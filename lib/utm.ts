/**
 * Step 18 - campaign tags on outbound links.
 *
 * Tagging happens at the very end of /go/[id], after country rules, the
 * collection value and rotation have already chosen a destination. That order
 * matters: a tag must never be able to change where a click lands, only to
 * describe it. This module is pure so the rule can be reasoned about on its own
 * and cannot drift into a second copy the way F25 did.
 *
 * Two deliberate refusals:
 *
 * - A parameter the destination already carries is left alone. Creators paste
 *   links that agencies and platforms have already tagged; overwriting their
 *   utm_source with ours would quietly break somebody else's reporting.
 * - An unparseable or non-http URL is returned untouched rather than dropped.
 *   A tag is a nicety; the redirect working is not.
 */

export type UtmSettings = {
  utm_enabled?: boolean | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

export const UTM_DEFAULT_MEDIUM = "link"

/**
 * Every analytics tool compares utm values literally, so "Summer Drop",
 * "summer drop" and "summer-drop" become three separate rows in the same
 * report. Lower-cased, spaces hyphenated, and anything that would need URL
 * encoding removed, so the value that is typed is the value that appears.
 */
export function utmValue(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._~-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

export function applyUtm(
  url: string,
  settings: UtmSettings | null | undefined,
  ctx: { handle: string; label?: string | null },
): string {
  if (!settings || settings.utm_enabled !== true) return url

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return url

  // Sensible fallbacks, so switching this on with every box empty still
  // produces a usable report instead of half-written tags.
  const source = utmValue(settings.utm_source) || utmValue(ctx.handle)
  const medium = utmValue(settings.utm_medium) || UTM_DEFAULT_MEDIUM
  const campaign = utmValue(settings.utm_campaign)
  const content = utmValue(ctx.label)

  const add = (key: string, value: string) => {
    if (!value) return
    if (parsed.searchParams.has(key)) return
    parsed.searchParams.set(key, value)
  }

  add("utm_source", source)
  add("utm_medium", medium)
  add("utm_campaign", campaign)
  // Which button was tapped, which is the one thing the destination's own
  // report cannot work out for itself.
  add("utm_content", content)

  return parsed.toString()
}
