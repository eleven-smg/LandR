import { supabaseAdmin } from "@/lib/supabaseAdmin"

/**
 * A collection is the page owner's campaign folder: it groups their own pages
 * (creators.collection_id) and then does three optional things to a visitor,
 * each behind its own switch so none of them is a surprise.
 *
 * Everything here is read on the visitor path, so every value is validated
 * before it can become a redirect.
 */

export type CollectionDestination = { key: string; url: string; enabled: boolean }

export type CollectionSettings = {
  id: string
  name: string
  /** Already gated on country_redirect_enabled; null means "do nothing". */
  countryRedirectUrl: string | null
  /** Already gated on takeover_enabled; null means "do nothing". */
  takeoverUrl: string | null
  destinations: CollectionDestination[]
}

/** Suggested destination keys. Anything else typed by hand still works. */
export const DESTINATION_KEYS = [
  "telegram",
  "instagram",
  "whatsapp",
  "snapchat",
  "tiktok",
  "onlyfans",
  "fansly",
  "x",
  "youtube",
  "reddit",
  "threads",
  "website",
] as const

/**
 * A url saved as "t.me/ava" makes redirect() throw, which surfaces as a 500 on
 * a real visitor. Add the scheme when it is missing and refuse anything that is
 * still not an http(s) url, exactly as /go/[id] does for link destinations.
 */
export function safeExternalUrl(raw: unknown): string | null {
  const trimmed = String(raw || "").trim()
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

export function normalizeDestinations(raw: unknown): CollectionDestination[] {
  if (!Array.isArray(raw)) return []

  const out: CollectionDestination[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const key = String(row.key || "")
      .trim()
      .toLowerCase()
    const url = String(row.url || "").trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    // An empty url is kept out of the resolved list but is not an error: the
    // client may add the row now and fill it in later.
    if (!url) continue
    out.push({ key, url, enabled: row.enabled !== false })
  }

  return out
}

const HOST_KEYS: Array<[string, string]> = [
  ["t.me", "telegram"],
  ["telegram.me", "telegram"],
  ["telegram.org", "telegram"],
  ["instagram.com", "instagram"],
  ["instagr.am", "instagram"],
  ["wa.me", "whatsapp"],
  ["whatsapp.com", "whatsapp"],
  ["snapchat.com", "snapchat"],
  ["tiktok.com", "tiktok"],
  ["onlyfans.com", "onlyfans"],
  ["fansly.com", "fansly"],
  ["twitter.com", "x"],
  ["x.com", "x"],
  ["youtube.com", "youtube"],
  ["youtu.be", "youtube"],
  ["reddit.com", "reddit"],
  ["threads.net", "threads"],
  ["threads.com", "threads"],
]

/**
 * Which collection value a button belongs to, worked out from where it already
 * points. This is what lets campaign destinations work without the client
 * having to tag ten pages of buttons by hand; links.collection_key overrides it
 * when somebody wants an explicit choice.
 */
export function platformKeyFor(url: unknown): string | null {
  const safe = safeExternalUrl(url)
  if (!safe) return null
  try {
    const host = new URL(safe).hostname.toLowerCase().replace(/^www\./, "")
    for (const [needle, key] of HOST_KEYS) {
      if (host === needle || host.endsWith("." + needle)) return key
    }
    return null
  } catch {
    return null
  }
}

export async function loadCollectionSettings(collectionId: unknown): Promise<CollectionSettings | null> {
  const id = String(collectionId || "").trim()
  if (!id) return null

  const { data } = await supabaseAdmin
    .from("collections")
    .select("id, name, redirect_url, country_redirect_enabled, destinations, takeover_url, takeover_enabled")
    .eq("id", id)
    .maybeSingle()

  if (!data) return null

  const row = data as Record<string, unknown>

  return {
    id: String(row.id),
    name: String(row.name || ""),
    countryRedirectUrl: row.country_redirect_enabled ? safeExternalUrl(row.redirect_url) : null,
    takeoverUrl: row.takeover_enabled ? safeExternalUrl(row.takeover_url) : null,
    destinations: normalizeDestinations(row.destinations),
  }
}

/**
 * The campaign value for one button, or null to leave the button alone.
 * Called from /go/[id], so it does the creator lookup itself and returns early
 * when the page is in no collection.
 */
export async function collectionDestinationFor(
  creatorId: string,
  explicitKey: unknown,
  fallbackUrl: unknown,
): Promise<string | null> {
  const key =
    String(explicitKey || "")
      .trim()
      .toLowerCase() || platformKeyFor(fallbackUrl)
  if (!key) return null

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("collection_id")
    .eq("id", creatorId)
    .maybeSingle()

  if (!creator || !creator.collection_id) return null

  const settings = await loadCollectionSettings(creator.collection_id)
  if (!settings) return null

  const match = settings.destinations.find((d) => d.key === key && d.enabled)
  return match ? safeExternalUrl(match.url) : null
}
