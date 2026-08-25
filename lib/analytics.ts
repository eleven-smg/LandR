import { headers } from "next/headers"
import { UAParser } from "ua-parser-js"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

function sourceFromReferrer(referrer: string | null): string {
  if (!referrer) return "direct"
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase()
    if (host.includes("tiktok")) return "tiktok"
    if (host.includes("instagram")) return "instagram"
    if (host.includes("twitter") || host.includes("x.com") || host.includes("t.co")) return "x"
    if (host.includes("telegram") || host.includes("t.me")) return "telegram"
    if (host.includes("google")) return "google"
    if (host.includes("facebook") || host.includes("fb.")) return "facebook"
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube"
    return host
  } catch {
    return "direct"
  }
}

function firstLanguage(raw: string | null): string | null {
  if (!raw) return null
  const first = raw.split(",")[0]
  if (!first) return null
  const clean = first.split(";")[0].trim()
  return clean.length > 0 ? clean.slice(0, 16) : null
}

export async function getRequestMeta() {
  const h = await headers()
  const ua = h.get("user-agent") || ""
  const parser = new UAParser(ua)
  const referrer = h.get("referer")
  return {
    country: h.get("x-vercel-ip-country"),
    region: h.get("x-vercel-ip-country-region"),
    city: h.get("x-vercel-ip-city"),
    device: parser.getDevice().type || "desktop",
    browser: parser.getBrowser().name || null,
    os: parser.getOS().name || null,
    referrer,
    source: sourceFromReferrer(referrer),
    language: firstLanguage(h.get("accept-language")),
  }
}

/**
 * Records a page view and returns the row id so the browser can enrich it with
 * visitor id, session id, screen size and time on page. Returns null when the
 * insert fails, in which case the browser simply skips the follow-up.
 */
export async function logPageView(creatorId: string, path: string): Promise<string | null> {
  const m = await getRequestMeta()
  const { data, error } = await supabaseAdmin
    .from("page_views")
    .insert({
      creator_id: creatorId,
      path,
      country: m.country,
      region: m.region,
      city: m.city,
      device: m.device,
      browser: m.browser,
      os: m.os,
      referrer: m.referrer,
      source: m.source,
      language: m.language,
    })
    .select("id")
    .single()

  // Tracking must never break the page, so log and continue. Watch for 42703
  // (undefined column), which means a migration has not been applied.
  if (error) {
    console.error("[analytics] page_view insert failed:", error.code, error.message)
    return null
  }
  return data ? String(data.id) : null
}

export async function logLinkClick(creatorId: string, linkId: string, destinationUrl: string) {
  const m = await getRequestMeta()
  const { error } = await supabaseAdmin.from("link_clicks").insert({
    creator_id: creatorId,
    link_id: linkId,
    destination_url: destinationUrl,
    country: m.country,
    region: m.region,
    city: m.city,
    device: m.device,
    browser: m.browser,
    os: m.os,
    referrer: m.referrer,
    source: m.source,
  })
  if (error) {
    console.error("[analytics] link_click insert failed:", error.code, error.message)
  }
}
