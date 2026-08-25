import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logLinkClick, getRequestMeta } from "@/lib/analytics"
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

  const m = await getRequestMeta()
  let destinationUrl: string | null = null

  // 1) Country-based routing wins.
  const geoRules = (link.geo_rules || []) as GeoRule[]
  if (m.country) {
    const rule = geoRules.find((r) => Array.isArray(r.countries) && r.countries.includes(m.country as string))
    if (rule) destinationUrl = rule.url
  }

  // 2) Rotation: serve the next URL in the pool, evenly.
  if (!destinationUrl && link.rotate) {
    const pool = (link.rotation_urls || []) as string[]
    const clean = pool.filter((u) => typeof u === "string" && u.trim().length > 0)
    if (clean.length > 0) {
      destinationUrl = clean[await pickRotationIndex(link.id, clean.length)]
    }
  }

  // 3) Fallback: first live default destination.
  if (!destinationUrl) {
    const dests = (link.destinations || []) as Destination[]
    const live = dests.find((d) => !d.disabled)
    destinationUrl = live ? live.url : null
  }

  const target = destinationUrl ? normalizeUrl(destinationUrl) : null

  if (!target) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  await logLinkClick(link.creator_id, link.id, target)

  // 4) Smart deep linking. Only in-app browsers need rescuing: a normal mobile
  // browser already hands https links to the installed app by itself.
  const userAgent = req.headers.get("user-agent") || ""
  if (isInAppBrowser(userAgent)) {
    const { data: creator } = await supabaseAdmin
      .from("creators")
      .select("deep_links")
      .eq("id", link.creator_id)
      .single()

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
