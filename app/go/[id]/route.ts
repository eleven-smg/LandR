import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logLinkClick, getRequestMeta } from "@/lib/analytics"
import { collectionDestinationFor } from "@/lib/collections"
import { scheduleState } from "@/lib/schedule"
import { applyUtm } from "@/lib/utm"
import { androidIntentFor, appSchemeFor, iosBounceHtml, isAndroid, isInAppBrowser, isIos } from "@/lib/deeplink"

type Destination = { url: string; disabled?: boolean }
type GeoRule = { countries: string[]; url: string }

// A destination saved without a scheme (for example "t.me/ava") makes
// NextResponse.redirect throw, which would surface as a 500 on click. Add the
// scheme when it is missing and reject anything still unparseable.
function normalizeUrl(raw: string): string | null {
  const trimmed = (raw || "").trim()
  if (!trimmed) return null
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : "https://" + trimmed
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

// Random selection is uneven exactly where rotation pools are used: at low
// click counts a 2-URL pool can send eight of ten clicks the same way, which
// makes split-testing results meaningless. next_rotation_index increments a
// counter on the row and returns it atomically, so concurrent clicks cannot
// read the same value. If the function has not been installed yet, fall back
// to random rather than failing the redirect.
async function pickRotationIndex(linkId: string, poolSize: number): Promise<number> {
  if (poolSize <= 1) return 0
  const { data, error } = await supabaseAdmin.rpc("next_rotation_index", {
    link_id: linkId,
    pool_size: poolSize,
  })
  if (error || typeof data !== "number") {
    console.error(
      "next_rotation_index unavailable, falling back to random selection:",
      error?.message ?? "unexpected return type",
    )
    return Math.floor(Math.random() * poolSize)
  }
  return ((data % poolSize) + poolSize) % poolSize
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: link } = await supabaseAdmin.from("links").select("*").eq("id", id).single()

  if (!link) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // 0) Schedule. The button is already hidden on the page outside its window,
  // but /go/<id> is a shareable, crawlable URL that outlives the button, so
  // enforcing it only on the page would make "expired" mean "harder to find".
  // Send the visitor to the page itself rather than the old destination, and
  // do not log a click: nobody arrived anywhere.
  if (scheduleState(link) !== "live") {
    const { data: owner } = await supabaseAdmin
      .from("creators")
      .select("handle")
      .eq("id", link.creator_id)
      .single()
    const home = owner && owner.handle ? "/" + String(owner.handle) : "/"
    return NextResponse.redirect(new URL(home, req.url))
  }

  const m = await getRequestMeta()
  let destinationUrl: string | null = null

  const dests = (link.destinations || []) as Destination[]
  const ownDefault = dests.find((d) => !d.disabled)

  // 1) Country-based routing wins. It is the per-link safety rule, so neither a
  // campaign value nor a rotation pool may override it.
  const geoRules = (link.geo_rules || []) as GeoRule[]
  if (m.country) {
    const rule = geoRules.find((r) => Array.isArray(r.countries) && r.countries.includes(m.country as string))
    if (rule) destinationUrl = rule.url
  }

  // 2) Campaign value from the collection this page belongs to. Matched on
  // links.collection_key when set, otherwise on the platform this button
  // already points at, so the client does not have to tag every button.
  // Deliberately ahead of rotation: a value edited once for the whole campaign
  // should beat a pool saved on one link, and it only fires when the collection
  // actually holds an enabled value for this platform.
  if (!destinationUrl) {
    destinationUrl = await collectionDestinationFor(
      String(link.creator_id),
      link.collection_key,
      ownDefault ? ownDefault.url : null,
    )
  }

  // 3) Rotation: serve the next URL in the pool, evenly.
  if (!destinationUrl && link.rotate) {
    const pool = (link.rotation_urls || []) as string[]
    const clean = pool.filter((u) => typeof u === "string" && u.trim().length > 0)
    if (clean.length > 0) {
      destinationUrl = clean[await pickRotationIndex(link.id, clean.length)]
    }
  }

  // 4) Fallback: first live default destination.
  if (!destinationUrl) {
    destinationUrl = ownDefault ? ownDefault.url : null
  }

  const chosen = destinationUrl ? normalizeUrl(destinationUrl) : null

  if (!chosen) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  /**
   * The owner's page settings. Read once here because two things below need
   * them: the campaign tags and the deep-link switch. The deep-link branch used
   * to fetch this row itself, which meant an in-app-browser click cost two
   * queries and a normal click read nothing at all.
   */
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("handle, deep_links, utm_enabled, utm_source, utm_medium, utm_campaign")
    .eq("id", link.creator_id)
    .single()

  /**
   * 5) Campaign tags, Step 18. Applied to the destination that was already
   * chosen, never to the choosing: whatever the rules above decided is where
   * the visitor goes, tagged or not. Off unless the page turned it on.
   */
  const target = applyUtm(chosen, creator, {
    handle: String(creator?.handle || ""),
    label: String(link.label || ""),
  })

  // Logged with the tags on, so the analytics row is the URL the visitor
  // actually opened rather than a cleaner one nobody was sent to.
  await logLinkClick(link.creator_id, link.id, target)

  // 6) Smart deep linking. Only in-app browsers need rescuing: a normal mobile
  // browser already hands https links to the installed app by itself.
  const userAgent = req.headers.get("user-agent") || ""
  if (isInAppBrowser(userAgent)) {
    if (!creator || creator.deep_links !== false) {
      if (isAndroid(userAgent)) {
        const intent = androidIntentFor(target)
        if (intent) return NextResponse.redirect(intent)
      } else if (isIos(userAgent)) {
        return new NextResponse(iosBounceHtml(target, appSchemeFor(target)), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        })
      }
    }
  }

  return NextResponse.redirect(target)
}
