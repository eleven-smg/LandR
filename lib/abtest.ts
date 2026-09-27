/**
 * Step 20 - A/B testing, built on the rotation pools that already exist.
 *
 * No experiments table and no new column. A rotating link already serves its
 * pool evenly (next_rotation_index is atomic - see app/go/[id]/route.ts), and
 * every click is already logged with the destination_url the visitor opened.
 * The test is therefore a read: group a link's clicks by which pool URL they
 * hit.
 *
 * Two honesty rules are baked in.
 *  - A click that matches no pool URL was sent by a country rule or a
 *    collection value, both of which run *before* rotation in /go/[id]. Those
 *    clicks are reported separately instead of being folded into a variant,
 *    because they never took part in the test.
 *  - Clicks are compared, not conversions. LandR cannot see what happens after
 *    the visitor leaves, so a winner here is "the URL people tapped", never
 *    "the URL that earned more".
 */

export type Variant = { url: string; clicks: number; share: number }

export type Verdict = "single" | "no-clicks" | "too-early" | "even" | "clear" | "many"

export type LinkReport = {
  linkId: string
  label: string
  variants: Variant[]
  /** Clicks that landed on one of the pool URLs. */
  matched: number
  /** Clicks on this button that a country rule or collection value sent elsewhere. */
  other: number
  leader: Variant | null
  verdict: Verdict
  note: string
}

/** Below this, a two-way split is noise and the screen says so. */
export const MIN_CLICKS = 30

/**
 * Strip everything that does not change where the visitor landed: the campaign
 * tags Step 18 appends on the way out, a trailing slash, the fragment, and the
 * case of the host. Without this every tagged click would look like a URL that
 * is not in the pool, and the whole report would read zero.
 */
export function canonicalUrl(raw: string): string {
  const trimmed = (raw || "").trim()
  if (!trimmed) return ""
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : "https://" + trimmed
  try {
    const u = new URL(candidate)
    const keep = Array.from(u.searchParams.entries())
      .filter(([k]) => !k.toLowerCase().startsWith("utm_"))
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    const query = keep.map(([k, v]) => k + "=" + v).join("&")
    const path = u.pathname.replace(/\/+$/, "")
    return u.host.toLowerCase() + path + (query ? "?" + query : "")
  } catch {
    return trimmed.toLowerCase()
  }
}

/** Short, readable form of a destination for the table. */
export function shortUrl(raw: string): string {
  const trimmed = (raw || "").trim()
  if (!trimmed) return "(empty)"
  const stripped = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "")
  return stripped.length > 58 ? stripped.slice(0, 55) + "\u2026" : stripped
}

export function buildReport(
  input: { id: string; label: string; pool: string[] },
  clickUrls: string[],
): LinkReport {
  const pool = (input.pool || []).filter((u) => typeof u === "string" && u.trim().length > 0)
  const keys = pool.map(canonicalUrl)
  const counts = pool.map(() => 0)
  let other = 0

  for (const raw of clickUrls) {
    const idx = keys.indexOf(canonicalUrl(raw))
    if (idx >= 0) counts[idx] += 1
    else other += 1
  }

  const matched = counts.reduce((a, b) => a + b, 0)
  const variants: Variant[] = pool.map((url, i) => ({
    url,
    clicks: counts[i],
    share: matched > 0 ? counts[i] / matched : 0,
  }))
  const ranked = variants.slice().sort((a, b) => b.clicks - a.clicks)
  const leader = matched > 0 && ranked.length > 0 ? ranked[0] : null

  let verdict: Verdict = "no-clicks"
  let note = "No clicks on this button yet, so there is nothing to compare."

  if (pool.length < 2) {
    verdict = "single"
    note =
      "Rotation is on but the pool holds fewer than two URLs, so every visitor gets the same " +
      "destination. Add a second URL in the Page Editor to start a test."
  } else if (matched === 0) {
    verdict = "no-clicks"
  } else if (pool.length > 2) {
    verdict = "many"
    note =
      pool.length +
      " URLs share this button, so each gets roughly a " +
      Math.round(100 / pool.length) +
      "% share. The split is shown below, but calling a winner between more than two needs far " +
      "more clicks than a straight A/B."
  } else if (matched < MIN_CLICKS) {
    verdict = "too-early"
    note =
      "Only " +
      matched +
      " clicks so far. Wait for at least " +
      MIN_CLICKS +
      " before reading anything into the split - at this size one busy afternoon decides it."
  } else {
    const gap = Math.abs(variants[0].clicks - variants[1].clicks)
    // Rotation is even by construction, so the null hypothesis is a 50/50
    // split and the gap's standard deviation is sqrt(n). 1.96 is the usual 5%
    // two-sided cut-off.
    const z = gap / Math.sqrt(matched)
    if (z >= 1.96 && leader) {
      verdict = "clear"
      note =
        "Clear result: " +
        shortUrl(leader.url) +
        " is ahead by " +
        gap +
        " clicks out of " +
        matched +
        ". On an even rotation a gap that wide turns up by chance less than 5% of the time."
    } else {
      verdict = "even"
      note =
        "Too close to call: " +
        gap +
        " clicks apart out of " +
        matched +
        ". That is inside what an even rotation produces on its own. Leave it running, or make the " +
        "two destinations more different from each other."
    }
  }

  return {
    linkId: input.id,
    label: input.label || "Untitled link",
    variants,
    matched,
    other,
    leader,
    verdict,
    note,
  }
}
