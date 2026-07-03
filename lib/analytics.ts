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
  }
}

export async function logPageView(creatorId: string, path: string) {
  const m = await getRequestMeta()
  await supabaseAdmin.from("page_views").insert({
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
  })
}

export async function logLinkClick(creatorId: string, linkId: string, destinationUrl: string) {
  const m = await getRequestMeta()
  await supabaseAdmin.from("link_clicks").insert({
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
}
