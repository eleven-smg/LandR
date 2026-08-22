import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
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
}

type ClickRow = { created_at: string; destination_url: string | null }

const RANGES = [
  { key: "day", label: "Day", days: 1 },
  { key: "week", label: "Week", days: 7 },
  { key: "month", label: "Month", days: 30 },
  { key: "year", label: "Year", days: 365 },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const NEEDS_TRACKING =
  "Not collected yet. This needs a visitor cookie and session tracking, which the analytics tables do not have."

function fmtDate(d: Date) {
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear()
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

  const { data: creatorData } = await supabaseAdmin
    .from("creators")
    .select("id, handle, display_name")
    .eq("handle", handle)
    .single()

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

  const [curRes, prevRes, clickRes, prevClickRes] = await Promise.all([
    supabaseAdmin
      .from("page_views")
      .select("created_at, country, region, city, device, browser, os, referrer, source, path")
      .eq("creator_id", creator.id)
      .gte("created_at", since.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("page_views")
      .select("created_at")
      .eq("creator_id", creator.id)
      .gte("created_at", prevSince.toISOString())
      .lt("created_at", since.toISOString())
      .limit(20000),
    supabaseAdmin
      .from("link_clicks")
      .select("created_at, destination_url")
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
  ])

  const views = (curRes.data || []) as unknown as ViewRow[]
  const prevViews = (prevRes.data || []) as unknown as Array<{ created_at: string }>
  const clicks = (clickRes.data || []) as unknown as ClickRow[]
  const prevClicks = (prevClickRes.data || []) as unknown as Array<{ created_at: string }>

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

  const fiveMinAgo = now.getTime() - 5 * 60 * 1000
  const active = views.filter((r) => Date.parse(r.created_at) >= fiveMinAgo).length
  const ctr = views.length > 0 ? Math.round((clicks.length / views.length) * 1000) / 10 : 0

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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Visitors</div>
          <div className="stat-value">{active}</div>
          <div className="stat-note">Views in the last 5 minutes.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Views</div>
          <div className="stat-value">{views.length}</div>
          <Change value={changePct(views.length, prevViews.length)} />
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
          <div className="stat-label">Unique Visitors</div>
          <div className="stat-value">&mdash;</div>
          <div className="stat-note">{NEEDS_TRACKING}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Session Duration</div>
          <div className="stat-value">&mdash;</div>
          <div className="stat-note">{NEEDS_TRACKING}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Visitor Traffic</div>
        <div className="chart-wrap">
          <TrafficChart data={series} />
        </div>
      </div>

      <div className="breakdown-grid">
        <BreakdownCard
          tabs={[
            { label: "Pages", rows: pages },
            { label: "Entry Pages", note: NEEDS_TRACKING },
            { label: "Exit Pages", note: NEEDS_TRACKING },
            { label: "Domains", rows: domains },
          ]}
        />
        <BreakdownCard
          tabs={[
            { label: "Referrers", rows: referrers },
            { label: "Channels", rows: sources },
            { label: "Sources", rows: sources },
            { label: "Mediums", note: "Needs UTM capture on the public page." },
          ]}
        />
        <BreakdownCard
          tabs={[
            { label: "Countries", rows: countries },
            { label: "Regions", rows: regions },
            { label: "Cities", rows: cities },
            { label: "Languages", note: "Needs the Accept-Language header stored on each view." },
          ]}
        />
        <BreakdownCard
          tabs={[
            { label: "OS", rows: oses },
            { label: "Browsers", rows: browsers },
            { label: "Platforms", rows: devices },
            { label: "Screens", note: "Needs screen size reported from the browser." },
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
