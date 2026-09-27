import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import type { CSSProperties } from "react"
import { buildReport, shortUrl, type LinkReport } from "@/lib/abtest"

export const dynamic = "force-dynamic"

// Access is enforced by app/dashboard/[handle]/layout.tsx, the gate every other
// tab uses. This page only reads, and only this page's own rows.
const DAYS_BACK = 90
const ROW_CAP = 5000

const nf: CSSProperties = { padding: 24, color: "#fff" }
const wrap: CSSProperties = { maxWidth: 820 }
const head: CSSProperties = { marginBottom: 20 }
const title: CSSProperties = { fontSize: 20, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 12,
  padding: 18,
  marginBottom: 14,
}
const cardTitle: CSSProperties = { fontSize: 15, fontWeight: 700, color: "#fff" }
const rowWrap: CSSProperties = { marginTop: 14 }
const rowTop: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13,
  color: "#c7cede",
}
const urlText: CSSProperties = { overflowWrap: "anywhere" }
const countText: CSSProperties = { whiteSpace: "nowrap", color: "#8892a4" }
const track: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: "#232940",
  marginTop: 6,
  overflow: "hidden",
}
const noteBase: CSSProperties = { fontSize: 13, marginTop: 14, lineHeight: 1.5 }
const small: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 10, lineHeight: 1.5 }

function noteStyle(verdict: LinkReport["verdict"]): CSSProperties {
  if (verdict === "clear") return { ...noteBase, color: "#7ee2a8" }
  if (verdict === "even" || verdict === "too-early" || verdict === "many")
    return { ...noteBase, color: "#e6c07b" }
  return { ...noteBase, color: "#8892a4" }
}

export default async function ExperimentsPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, handle")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  if (!creator) return <main style={nf}>Creator not found.</main>

  const { data: linkRows } = await supabaseAdmin
    .from("links")
    .select("id, label, rotate, rotation_urls, position")
    .eq("creator_id", creator.id)
    .eq("rotate", true)
    .order("position", { ascending: true })

  const rotating = (linkRows || []) as Array<{
    id: string
    label: string | null
    rotation_urls: unknown
  }>

  const since = new Date(Date.now() - DAYS_BACK * 86400000).toISOString()
  const ids = rotating.map((l) => String(l.id))

  const { data: clickRows } = ids.length
    ? await supabaseAdmin
        .from("link_clicks")
        .select("link_id, destination_url")
        .eq("creator_id", creator.id)
        .in("link_id", ids)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(ROW_CAP)
    : { data: [] as Array<Record<string, unknown>> }

  const byLink = new Map<string, string[]>()
  for (const row of (clickRows || []) as Array<Record<string, unknown>>) {
    const key = String(row.link_id)
    const list = byLink.get(key) || []
    list.push(String(row.destination_url || ""))
    byLink.set(key, list)
  }

  const reports: LinkReport[] = rotating.map((l) =>
    buildReport(
      {
        id: String(l.id),
        label: String(l.label || ""),
        pool: Array.isArray(l.rotation_urls) ? (l.rotation_urls as string[]) : [],
      },
      byLink.get(String(l.id)) || [],
    ),
  )

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={title}>A/B tests</div>
        <div style={sub}>
          Any button set to rotate between two or more URLs is already a live test. This is how each
          one is doing over the last {DAYS_BACK} days.
        </div>
      </div>

      {reports.length === 0 ? (
        <div style={card}>
          <div style={cardTitle}>No tests running</div>
          <div style={{ ...noteBase, color: "#8892a4" }}>
            Nothing is rotating yet. Open the Page Editor, pick a button, turn on rotation and add a
            second URL - visitors are then split evenly between them and this page starts counting.
            Nothing on your page changes for anyone until you do.
          </div>
        </div>
      ) : null}

      {reports.map((r) => (
        <div key={r.linkId} style={card}>
          <div style={cardTitle}>{r.label}</div>

          <div style={rowWrap}>
            {r.variants.map((v, i) => (
              <div key={v.url + ":" + i} style={{ marginBottom: 10 }}>
                <div style={rowTop}>
                  <span style={urlText}>{shortUrl(v.url)}</span>
                  <span style={countText}>
                    {v.clicks} {v.clicks === 1 ? "click" : "clicks"}
                    {r.matched > 0 ? " \u00b7 " + Math.round(v.share * 100) + "%" : ""}
                  </span>
                </div>
                <div style={track}>
                  <div
                    style={{
                      width: Math.round(v.share * 100) + "%",
                      height: "100%",
                      background:
                        r.verdict === "clear" && r.leader && r.leader.url === v.url
                          ? "#4fd08a"
                          : "#5b7fff",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={noteStyle(r.verdict)}>{r.note}</div>

          {r.other > 0 ? (
            <div style={small}>
              {r.other} more {r.other === 1 ? "click" : "clicks"} on this button went somewhere else
              entirely - a country rule or a collection value decided those, and both of those run
              before rotation, so they are not part of the test.
            </div>
          ) : null}
        </div>
      ))}

      {reports.length > 0 ? (
        <div style={small}>
          Counted on clicks only. LandR can see which URL a visitor opened, never what they did after
          they left, so "winning" here means the destination people tapped more - not the one that
          earned more.
        </div>
      ) : null}
    </div>
  )
}
