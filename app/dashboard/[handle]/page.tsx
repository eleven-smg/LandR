import Link from "next/link"
import type { CSSProperties } from "react"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import BreakdownCard from "./BreakdownCard"
import TrafficChart from "./TrafficChart"
import type { Point } from "./TrafficChart"

export const dynamic = "force-dynamic"

type ViewRow = {
  created_at: string
  country: string | null
  region: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  referrer: string | null
  source: string | null
  path: string | null
  visitor_id: string | null
  session_id: string | null
  duration_seconds: number | null
  language: string | null
  screen: string | null
}

type PrevViewRow = { created_at: string; visitor_id: string | null }
type ClickRow = {
  created_at: string
  destination_url: string | null
  link_id: string | null
  session_id: string | null
}
type LinkRow = { id: string; label: string | null; url: string | null; is_active: boolean | null }

const RANGES = [
  { key: "day", label: "Day", days: 1 },
  { key: "week", label: "Week", days: 7 },
  { key: "month", label: "Month", days: 30 },
  { key: "year", label: "Year", days: 365 },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const exportRow: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }
const exportBtn: CSSProperties = {
  display: "inline-block",
  padding: "6px 11px",
  background: "#232940",
  border: "1px solid #2d3550",
  borderRadius: 8,
  color: "#cdd6f4",
  fontSize: 12,
  fontWeight: 500,
  textDecoration: "none",
}
const linkTable: CSSProperties = { marginTop: 4 }
const linkHead: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#6b7396",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  paddingBottom: 8,
  borderBottom: "1px solid #232940",
}
const linkRow: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  padding: "9px 0",
  borderBottom: "1px solid #1c2130",
  fontSize: 13,
}
const linkName: CSSProperties = { flex: 1, minWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
const linkOff: CSSProperties = { color: "#6b7396", fontSize: 11, marginLeft: 6 }
const numCell: CSSProperties = { width: 70, textAlign: "right", fontVariantNumeric: "tabular-nums" }
const rateCell: CSSProperties = { width: 80, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }
const barWrap: CSSProperties = { width: 110, height: 6, background: "#1c2130", borderRadius: 999, overflow: "hidden" }
const emptyNote: CSSProperties = { color: "#6b7396", fontSize: 13, padding: "12px 0" }

function fmtDate(d: Date) {
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear()
}

/** 95 becomes 1m 35s, 0 becomes 0s. */
function fmtDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return total + "s"
  const mins = Math.floor(total / 60)
  const rest = total % 60
  if (mins < 60) return mins + "m " + rest + "s"
  return Math.floor(mins / 60) + "h " + (mins % 60) + "m"
}

/** Browser language tags are noisy, so en-GB and en-US both read as English. */
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  ar: "Arabic",
  ru: "Russian",
  hi: "Hindi",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  tr: "Turkish",
  pl: "Polish",
  sv: "Swedish",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
  sw: "Swahili",
}

function languageName(raw: string | null) {
  const tag = String(raw || "").trim().toLowerCase()
  if (!tag) return ""
  const base = tag.split("-")[0]
  const named = LANGUAGE_NAMES[base]
  return named ? named + " (" + tag + ")" : tag
}

/** 1080x2400 is grouped into a readable band so the list is not all singletons. */
function screenBand(raw: string | null) {
  const value = String(raw || "").trim().toLowerCase()
  if (!value) return ""
  const width = Number(value.split("x")[0])
  if (!Number.isFinite(width) || width <= 0) return value
  const band =
    width < 400
      ? "Small phone"
      : width < 500
        ? "Phone"
        : width < 820
          ? "Large phone"
          : width < 1100
            ? "Tablet"
            : width < 1500
              ? "Laptop"
              : "Desktop"
  return band + " " + value
}

function tally(values: Array<string | null | undefined>, limit: number) {
  const m = new Map<string, number>()
  for (const v of values) {
    const k = (v || "").trim()
    if (!k) continue
    m.set(k, (m.get(k) || 0) + 1)
  }
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

function hostOf(raw: string | null) {
  try {
    return new URL(String(raw)).hostname.replace("www.", "")
  } catch {
    return ""
  }
}

function changePct(now: number, before: number) {
  if (before === 0) return now > 0 ? 100 : 0
  return Math.round(((now - before) / before) * 1000) / 10
}

function Change({ value }: { value: number }) {
  const down = value < 0
  const arrow = down ? "\u2193" : "\u2191"
  return (
    <div className={down ? "stat-change down" : "stat-change"}>
      {arrow} {Math.abs(value)}%
    </div>
  )
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ range?: string }>
}) {
  const { handle } = await params
  const sp = await searchParams
  const range = RANGES.find((r) => r.key === sp.range) || RANGES[1]

  // Matched without case, so /dashboard/Ava works the same as /dashboard/ava.
  const { data: creatorData } = await supabaseAdmin
    .from("creators")
    .select("id, handle, display_name")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  const creator = creatorData as { id: string; handle: string; display_name: string | null } | null

  if (!creator) {
    return (
      <div className="page-header">
        <div className="page-title">No page called &ldquo;{handle}&rdquo;</div>
        <div className="page-sub">Check the handle in the address bar.</div>
      </div>
    )
  }

  const now = new Date()
  const span = range.days * 24 * 60 * 60 * 1000
  const since = new Date(now.getTime() - span)
  const prevSince = new Date(now.getTime() - 2 * span)

  const [curRes, prevRes, clickRes, prevClickRes, linkRes] = await Promise.all([
    supabaseAdmin
      .from("page_views")
      .select(
        "created_at, country, region, city, device, browser, os, referrer, source, path, visitor_id, session_id, duration_seconds, language, screen",
      )
      .eq("creator_id", creator.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .limit(20000),
    supabaseAdmin
      .from("page_views")
      .select("created_at, visitor_id")
      .eq("creator_id", creator.id)
      .gte("created_at", prevSince.toISOString())
      .lt("created_at", since.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("link_clicks")
      .select("created_at, destination_url, link_id, session_id")
      .eq("creator_id", creator.id)
      .gte("created_at", since.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("link_clicks")
      .select("created_at")
      .eq("creator_id", creator.id)
      .gte("created_at", prevSince.toISOString())
      .lt("created_at", since.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("links")
      .select("id, label, url, is_active")
      .eq("creator_id", creator.id)
      .order("position", { ascending: true }),
  ])

  const views = (curRes.data || []) as unknown as ViewRow[]
  const prevViews = (prevRes.data || []) as unknown as PrevViewRow[]
  const clicks = (clickRes.data || []) as unknown as ClickRow[]
  const prevClicks = (prevClickRes.data || []) as unknown as Array<{ created_at: string }>
  const links = (linkRes.data || []) as unknown as LinkRow[]

  // Single pass per dataset. Filtering once per bucket would be 365 x 20000
  // comparisons on the year range.
  const hourly = range.days <= 1
  const buckets = hourly ? 24 : range.days
  const step = hourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const start = now.getTime() - buckets * step
  const vCounts = new Array<number>(buckets).fill(0)
  const cCounts = new Array<number>(buckets).fill(0)

  for (const r of views) {
    const i = Math.floor((Date.parse(r.created_at) - start) / step)
    if (i >= 0 && i < buckets) vCounts[i] = vCounts[i] + 1
  }
  for (const r of clicks) {
    const i = Math.floor((Date.parse(r.created_at) - start) / step)
    if (i >= 0 && i < buckets) cCounts[i] = cCounts[i] + 1
  }

  const series: Point[] = vCounts.map((v, i) => {
    const d = new Date(start + i * step)
    const label = hourly
      ? String(d.getUTCHours()).padStart(2, "0") + ":00"
      : d.getUTCDate() + " " + MONTHS[d.getUTCMonth()]
    return { label, views: v, clicks: cCounts[i] }
  })

  // One walk over the views builds every visitor and session figure at once.
  // Rows are already ordered oldest first, so the first path seen in a session
  // is the entry page and the last one is the exit page.
  const visitorIds = new Set<string>()
  const sessions = new Map<string, { hits: number; seconds: number; entry: string; exit: string }>()

  for (const r of views) {
    const visitor = String(r.visitor_id || "").trim()
    if (visitor) visitorIds.add(visitor)

    const sessionKey = String(r.session_id || "").trim()
    if (!sessionKey) continue

    const path = String(r.path || "").trim()
    const seconds = Number(r.duration_seconds || 0)
    const found = sessions.get(sessionKey)

    if (!found) {
      sessions.set(sessionKey, {
        hits: 1,
        seconds: Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
        entry: path,
        exit: path,
      })
      continue
    }

    found.hits = found.hits + 1
    // The tracker heartbeats, so the largest number is the real time on page.
    if (Number.isFinite(seconds) && seconds > found.seconds) found.seconds = seconds
    if (path) found.exit = path
  }

  const sessionList = Array.from(sessions.entries()).map(([key, value]) => ({ key, ...value }))
  const sessionCount = sessionList.length
  const uniqueVisitors = visitorIds.size
  const prevUniqueVisitors = new Set(
    prevViews.map((r) => String(r.visitor_id || "").trim()).filter((v) => v.length > 0),
  ).size

  // A link-in-bio page is one screen, so "looked at one page and left" counted
  // almost every visit. What the agency actually wants to know is how many
  // people arrived and tapped nothing.
  const clickedSessions = new Set(
    clicks.map((c) => String(c.session_id || "").trim()).filter((v) => v.length > 0),
  )
  const silent = sessionList.filter((s) => !clickedSessions.has(s.key)).length
  const silentRate = sessionCount > 0 ? Math.round((silent / sessionCount) * 1000) / 10 : 0

  const timedSessions = sessionList.filter((s) => s.seconds > 0)
  const avgSeconds =
    timedSessions.length > 0
      ? timedSessions.reduce((sum, s) => sum + s.seconds, 0) / timedSessions.length
      : 0

  const entryPages = tally(
    sessionList.map((s) => s.entry),
    8,
  )
  const exitPages = tally(
    sessionList.map((s) => s.exit),
    8,
  )

  const fiveMinAgo = now.getTime() - 5 * 60 * 1000
  const recent = views.filter((r) => Date.parse(r.created_at) >= fiveMinAgo)
  const activeVisitors = new Set(
    recent.map((r) => String(r.visitor_id || r.session_id || "").trim()).filter((v) => v.length > 0),
  ).size
  const active = activeVisitors > 0 ? activeVisitors : recent.length
  const ctr = views.length > 0 ? Math.round((clicks.length / views.length) * 1000) / 10 : 0

  // Clicks per button, so the agency can see which link earns.
  const clicksByLink = new Map<string, number>()
  for (const c of clicks) {
    const id = String(c.link_id || "").trim()
    if (id) clicksByLink.set(id, (clicksByLink.get(id) || 0) + 1)
  }
  const perLink = links
    .map((l) => {
      const hits = clicksByLink.get(String(l.id)) || 0
      return {
        id: String(l.id),
        label: String(l.label || "Untitled link"),
        host: hostOf(l.url),
        live: l.is_active !== false,
        clicks: hits,
        rate: views.length > 0 ? Math.round((hits / views.length) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => b.clicks - a.clicks)
  const bestRate = perLink.length > 0 ? Math.max(...perLink.map((l) => l.rate), 1) : 1
  const untracked = clicks.filter((c) => !String(c.link_id || "").trim()).length

  const pages = tally(
    views.map((r) => r.path),
    8,
  )
  const domains = tally(
    views.map((r) => hostOf(r.referrer)),
    8,
  )
  const referrers = tally(
    views.map((r) => r.referrer),
    8,
  )
  const sources = tally(
    views.map((r) => r.source),
    8,
  )
  const countries = tally(
    views.map((r) => r.country),
    8,
  )
  const regions = tally(
    views.map((r) => r.region),
    8,
  )
  const cities = tally(
    views.map((r) => r.city),
    8,
  )
  const languages = tally(
    views.map((r) => languageName(r.language)),
    8,
  )
  const screens = tally(
    views.map((r) => screenBand(r.screen)),
    8,
  )
  const oses = tally(
    views.map((r) => r.os),
    8,
  )
  const browsers = tally(
    views.map((r) => r.browser),
    8,
  )
  const devices = tally(
    views.map((r) => r.device),
    8,
  )
  const clickUrls = tally(
    clicks.map((r) => r.destination_url),
    8,
  )
  const clickDomains = tally(
    clicks.map((r) => hostOf(r.destination_url)),
    8,
  )

  const name = creator.display_name || creator.handle
  const noSessions = sessionCount === 0
  const exportBase = "/dashboard/" + creator.handle + "/export?range=" + range.key + "&what="

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Welcome back {name}</div>
        <div className="page-sub">
          Traffic for /{creator.handle} &mdash;{" "}
          <Link className="dash-link" href={"/" + creator.handle}>
            view public page &rarr;
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="period-tabs">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={"?range=" + r.key}
              className={r.key === range.key ? "period-tab active" : "period-tab"}
            >
              {r.label}
            </Link>
          ))}
        </div>
        <div className="date-range">
          {fmtDate(since)} &ndash; {fmtDate(now)}
        </div>
      </div>

      <div style={{ ...exportRow, marginBottom: 18 }}>
        <span style={{ color: "#6b7396", fontSize: 12 }}>Download this {range.label.toLowerCase()}:</span>
        <a style={exportBtn} href={exportBase + "views"} download>
          Views CSV
        </a>
        <a style={exportBtn} href={exportBase + "clicks"} download>
          Clicks CSV
        </a>
        <a style={exportBtn} href={exportBase + "links"} download>
          Per-link CSV
        </a>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Visitors</div>
          <div className="stat-value">{active}</div>
          <div className="stat-note">People on the page in the last 5 minutes.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Views</div>
          <div className="stat-value">{views.length}</div>
          <Change value={changePct(views.length, prevViews.length)} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Visitors</div>
          <div className="stat-value">{uniqueVisitors}</div>
          <Change value={changePct(uniqueVisitors, prevUniqueVisitors)} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{sessionCount}</div>
          <div className="stat-note">One visit each. A new session starts after the tab is closed.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Link Clicks</div>
          <div className="stat-value">{clicks.length}</div>
          <Change value={changePct(clicks.length, prevClicks.length)} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Click Rate</div>
          <div className="stat-value">{ctr}%</div>
          <div className="stat-note">Clicks divided by views.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clicked Nothing</div>
          <div className="stat-value">{noSessions ? "0%" : silentRate + "%"}</div>
          <div className="stat-note">Visits that clicked nothing: {silent} of {sessionCount}.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Time On Page</div>
          <div className="stat-value">{fmtDuration(avgSeconds)}</div>
          <div className="stat-note">Average per visit, measured while the tab is open.</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Visitor Traffic</div>
        <div className="chart-wrap">
          <TrafficChart data={series} />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Which link earns</div>
        {perLink.length === 0 ? (
          <div style={emptyNote}>No links on this page yet.</div>
        ) : (
          <div style={linkTable}>
            <div style={linkHead}>
              <span style={linkName}>Link</span>
              <span style={barWrap} />
              <span style={numCell}>Clicks</span>
              <span style={rateCell}>Click rate</span>
            </div>
            {perLink.map((l) => (
              <div key={l.id} style={linkRow}>
                <span style={linkName}>
                  {l.label}
                  {l.host ? <span style={linkOff}>{l.host}</span> : null}
                  {l.live ? null : <span style={linkOff}>hidden</span>}
                </span>
                <span style={barWrap}>
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: Math.round((l.rate / bestRate) * 100) + "%",
                      background: "#5b7fff",
                    }}
                  />
                </span>
                <span style={numCell}>{l.clicks}</span>
                <span style={rateCell}>{l.rate}%</span>
              </div>
            ))}
            <div className="stat-note" style={{ marginTop: 10 }}>
              Click rate is that button&rsquo;s clicks divided by the {views.length} page views in this range.
              {untracked > 0
                ? " " + untracked + " older clicks were logged before per-button tracking and are not counted here."
                : ""}
            </div>
          </div>
        )}
      </div>

      <div className="breakdown-grid">
        <BreakdownCard
          tabs={[
            { label: "Pages", rows: pages },
            { label: "Entry Pages", rows: entryPages },
            { label: "Exit Pages", rows: exitPages },
            { label: "Domains", rows: domains },
          ]}
        />
        <BreakdownCard
          tabs={[
            { label: "Referrers", rows: referrers },
            { label: "Channels", rows: sources },
            { label: "Sources", rows: sources },
            { label: "Mediums", note: "Needs UTM capture on the public page, which is not built yet." },
          ]}
        />
        <BreakdownCard
          tabs={[
            { label: "Countries", rows: countries },
            { label: "Regions", rows: regions },
            { label: "Cities", rows: cities },
            { label: "Languages", rows: languages },
          ]}
        />
        <BreakdownCard
          tabs={[
            { label: "OS", rows: oses },
            { label: "Browsers", rows: browsers },
            { label: "Platforms", rows: devices },
            { label: "Screens", rows: screens },
          ]}
        />
        <BreakdownCard tabs={[{ label: "Events", note: "No events table yet. Clicks are tracked separately." }]} />
        <BreakdownCard
          tabs={[
            { label: "Clicks by url", rows: clickUrls },
            { label: "By domain", rows: clickDomains },
          ]}
        />
      </div>
    </div>
  )
}
