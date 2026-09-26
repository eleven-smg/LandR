import type { CSSProperties } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSession, getManagedPages } from "@/lib/session"

export const dynamic = "force-dynamic"

const RANGES: Record<string, { label: string; days: number }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  "365": { label: "Last year", days: 365 },
}

const page: CSSProperties = { minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", padding: "28px 20px 60px" }
const wrap: CSSProperties = { maxWidth: 1100, margin: "0 auto" }
const backLink: CSSProperties = { color: "#8892a4", fontSize: 13, textDecoration: "none" }
const h1s: CSSProperties = { fontSize: 22, fontWeight: 700, marginTop: 14 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const card: CSSProperties = { background: "#181c27", border: "1px solid #232940", borderRadius: 14, padding: 16, marginTop: 18 }
const sectionTitle: CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8892a4" }
const pickRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }
const pick: CSSProperties = { display: "flex", alignItems: "center", gap: 8, background: "#0f1117", border: "1px solid #232940", borderRadius: 999, padding: "7px 13px", fontSize: 13 }
const btn: CSSProperties = { padding: "9px 14px", background: "#5b7fff", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }
const select: CSSProperties = { padding: "9px 11px", background: "#0f1117", border: "1px solid #232940", borderRadius: 8, color: "#fff" }
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }
const th: CSSProperties = { textAlign: "left", padding: "9px 10px", color: "#8892a4", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #232940", whiteSpace: "nowrap" }
const td: CSSProperties = { padding: "11px 10px", borderBottom: "1px solid #1c2233", whiteSpace: "nowrap" }
const tdName: CSSProperties = { ...td, fontWeight: 700, whiteSpace: "normal" }
const barTrack: CSSProperties = { background: "#0f1117", border: "1px solid #232940", borderRadius: 6, height: 26, overflow: "hidden", flex: 1 }
const barRow: CSSProperties = { display: "flex", alignItems: "center", gap: 10, marginTop: 8 }
const barLabel: CSSProperties = { width: 150, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
const barValue: CSSProperties = { width: 70, fontSize: 12, textAlign: "right", color: "#8892a4" }
const note: CSSProperties = { color: "#6b7396", fontSize: 12, marginTop: 14 }
const best: CSSProperties = { color: "#4ade80", fontWeight: 700 }
const worst: CSSProperties = { color: "#fca5a5", fontWeight: 700 }

type Row = {
  id: string
  handle: string
  name: string
  views: number
  visitors: number
  clicks: number
  clickRate: number
  topCountry: string
}

function Bars({ rows, pick: key, suffix }: { rows: Row[]; pick: (r: Row) => number; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => key(r)))
  return (
    <div>
      {rows.map((r) => {
        const value = key(r)
        const width = Math.round((value / max) * 100)
        return (
          <div key={r.id} style={barRow}>
            <div style={barLabel}>{r.name}</div>
            <div style={barTrack}>
              <div
                style={{
                  width: width + "%",
                  height: "100%",
                  background: "linear-gradient(90deg,#5b7fff,#8b5cf6)",
                }}
              />
            </div>
            <div style={barValue}>
              {value}
              {suffix || ""}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = searchParams ? await searchParams : {}

  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard/compare")

  const pages = await getManagedPages(account)
  if (pages.length === 0) redirect("/dashboard")

  const rangeKey = typeof query.range === "string" && RANGES[query.range] ? query.range : "30"
  const range = RANGES[rangeKey]

  // Ids come from the query string, so they are intersected with the pages this
  // account actually manages. A pasted id for somebody else's page is dropped
  // rather than trusted.
  const asked = Array.isArray(query.id) ? query.id : typeof query.id === "string" ? [query.id] : []
  const allowed = new Set(pages.map((p) => p.id))
  const selected = asked.filter((id) => allowed.has(id))

  // Default to everything, so the page is useful on first open.
  const chosen = selected.length > 0 ? selected : pages.map((p) => p.id)

  const since = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString()

  const [views, clicks] = await Promise.all([
    supabaseAdmin
      .from("page_views")
      .select("creator_id, visitor_id, country")
      .in("creator_id", chosen)
      .gte("created_at", since)
      .limit(100000),
    supabaseAdmin
      .from("link_clicks")
      .select("creator_id")
      .in("creator_id", chosen)
      .gte("created_at", since)
      .limit(100000),
  ])

  const viewCount: Record<string, number> = {}
  const clickCount: Record<string, number> = {}
  const visitors: Record<string, Set<string>> = {}
  const countries: Record<string, Record<string, number>> = {}

  for (const id of chosen) {
    viewCount[id] = 0
    clickCount[id] = 0
    visitors[id] = new Set<string>()
    countries[id] = {}
  }

  for (const raw of views.data || []) {
    const row = raw as Record<string, unknown>
    const id = String(row.creator_id || "")
    if (viewCount[id] === undefined) continue
    viewCount[id] += 1

    const visitor = row.visitor_id ? String(row.visitor_id) : ""
    if (visitor) visitors[id].add(visitor)

    const country = row.country ? String(row.country) : ""
    if (country) countries[id][country] = (countries[id][country] || 0) + 1
  }

  for (const raw of clicks.data || []) {
    const row = raw as Record<string, unknown>
    const id = String(row.creator_id || "")
    if (clickCount[id] === undefined) continue
    clickCount[id] += 1
  }

  const rows: Row[] = pages
    .filter((p) => chosen.includes(p.id))
    .map((p) => {
      const v = viewCount[p.id] || 0
      const c = clickCount[p.id] || 0
      const topCountry =
        Object.entries(countries[p.id] || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "\u2014"

      return {
        id: p.id,
        handle: p.handle,
        name: p.displayName,
        views: v,
        visitors: visitors[p.id] ? visitors[p.id].size : 0,
        clicks: c,
        clickRate: v > 0 ? Math.round((c / v) * 1000) / 10 : 0,
        topCountry,
      }
    })
    .sort((a, b) => b.views - a.views)

  const withTraffic = rows.filter((r) => r.views > 0)
  const leader = withTraffic.length > 0 ? withTraffic.reduce((a, b) => (b.clickRate > a.clickRate ? b : a)) : null
  const laggard = withTraffic.length > 1 ? withTraffic.reduce((a, b) => (b.clickRate < a.clickRate ? b : a)) : null
  const silent = rows.filter((r) => r.views === 0)

  return (
    <main style={page}>
      <div style={wrap}>
        <Link href="/dashboard" style={backLink}>
          &larr; All models
        </Link>
        <h1 style={h1s}>Compare models</h1>
        <p style={sub}>Pick the models you want to weigh against each other, then read them on the same scale.</p>

        <form method="get" style={card}>
          <div style={sectionTitle}>Models</div>
          <div style={pickRow}>
            {pages.map((p) => (
              <label key={p.id} style={pick}>
                <input type="checkbox" name="id" value={p.id} defaultChecked={chosen.includes(p.id)} />
                <span>{p.displayName}</span>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <select name="range" defaultValue={rangeKey} style={select}>
              {Object.entries(RANGES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            <button style={btn} type="submit">
              Compare
            </button>
          </div>
        </form>

        <div style={card}>
          <div style={sectionTitle}>
            {range.label} &middot; {rows.length} model{rows.length === 1 ? "" : "s"}
          </div>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Model</th>
                <th style={th}>Views</th>
                <th style={th}>Visitors</th>
                <th style={th}>Clicks</th>
                <th style={th}>Click rate</th>
                <th style={th}>Top country</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={tdName}>
                    {r.name}
                    <div style={{ color: "#6b7396", fontSize: 11, fontWeight: 400 }}>/{r.handle}</div>
                  </td>
                  <td style={td}>{r.views}</td>
                  <td style={td}>{r.visitors}</td>
                  <td style={td}>{r.clicks}</td>
                  <td style={td}>
                    <span style={leader && r.id === leader.id ? best : laggard && r.id === laggard.id ? worst : undefined}>
                      {r.clickRate}%
                    </span>
                  </td>
                  <td style={td}>{r.topCountry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={card}>
          <div style={sectionTitle}>Views</div>
          <Bars rows={rows} pick={(r) => r.views} />
        </div>

        <div style={card}>
          <div style={sectionTitle}>Clicks</div>
          <Bars rows={rows} pick={(r) => r.clicks} />
        </div>

        <div style={card}>
          <div style={sectionTitle}>Click rate</div>
          <Bars rows={rows} pick={(r) => r.clickRate} suffix="%" />
          <p style={note}>
            Click rate is clicks divided by views, so it says how convincing a page is rather than how much traffic it
            was sent. A page with few views and a high rate is working; a page with many views and a low rate is not.
          </p>
        </div>

        <div style={card}>
          <div style={sectionTitle}>What this says</div>
          {leader ? (
            <p style={{ ...sub, marginTop: 10 }}>
              <span style={best}>{leader.name}</span> converts best at {leader.clickRate}% over {range.label.toLowerCase()}.
              {laggard && laggard.id !== leader.id ? (
                <>
                  {" "}
                  <span style={worst}>{laggard.name}</span> is weakest at {laggard.clickRate}%
                  {laggard.views > leader.views ? " despite getting more views" : ""}.
                </>
              ) : null}
            </p>
          ) : (
            <p style={{ ...sub, marginTop: 10 }}>No views in this window, so there is nothing to rank yet.</p>
          )}
          {silent.length > 0 ? (
            <p style={note}>
              No traffic at all: {silent.map((r) => r.name).join(", ")}. Check the page is shared anywhere before
              judging the page itself.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
