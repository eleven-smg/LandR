/**
 * Step 19 - scheduled and expiring links.
 *
 * `links.starts_at` and `links.ends_at` have existed since August with nothing
 * reading them anywhere in the product, which is the same defect class as F22
 * and F29: the schema claims a feature the visitor never sees. This module is
 * the single seam that answers "is this link live right now", so the public
 * page and /go/[id] cannot drift apart - two copies of one rule cost a whole
 * day in F25.
 *
 * Both bounds are optional. Null means no bound, so a row with neither is live
 * forever. Every row in the database today has neither, which is why turning
 * this on changes nothing until somebody sets a date.
 */

export type ScheduleRow = {
  starts_at?: string | null
  ends_at?: string | null
}

export type ScheduleState = "live" | "scheduled" | "expired"

/**
 * Postgres hands back a timestamptz as an ISO string, but some clients print
 * it with a space instead of the T, and Date.parse is only dependable on the
 * ISO form. An unparseable value is treated as no bound and logged: a typo in
 * one date must never silently delete a button from a live page.
 */
function parseBound(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!raw) return null
  const ms = Date.parse(raw.includes("T") ? raw : raw.replace(" ", "T"))
  if (Number.isNaN(ms)) {
    console.error("link schedule: ignoring unparseable date", raw)
    return null
  }
  return ms
}

export function scheduleState(row: ScheduleRow | null | undefined, now: number = Date.now()): ScheduleState {
  if (!row) return "live"
  const start = parseBound(row.starts_at)
  const end = parseBound(row.ends_at)
  if (start !== null && now < start) return "scheduled"
  if (end !== null && now >= end) return "expired"
  return "live"
}

export function isLinkLive(row: ScheduleRow | null | undefined, now: number = Date.now()): boolean {
  return scheduleState(row, now) === "live"
}
