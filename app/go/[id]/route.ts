import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logLinkClick, getRequestMeta } from "@/lib/analytics"

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

  // 2) Rotation: serve a random URL from the pool.
  if (!destinationUrl && link.rotate) {
    const pool = (link.rotation_urls || []) as string[]
    const clean = pool.filter((u) => typeof u === "string" && u.trim().length > 0)
    if (clean.length > 0) {
      destinationUrl = clean[Math.floor(Math.random() * clean.length)]
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
  return NextResponse.redirect(target)
}
