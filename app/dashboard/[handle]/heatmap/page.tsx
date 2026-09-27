import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import type { CSSProperties } from "react"
import Heatmap from "./Heatmap"

export const dynamic = "force-dynamic"

// Access is enforced by app/dashboard/[handle]/layout.tsx, the same gate the
// other tabs rely on. This page only reads, and only this page's own rows.
const DAYS_BACK = 90
const ROW_CAP = 5000

const nf: CSSProperties = { padding: 24, color: "#fff" }
const head: CSSProperties = { marginBottom: 20 }
const title: CSSProperties = { fontSize: 20, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const wrap: CSSProperties = { maxWidth: 820 }

function stamps(rows: Array<Record<string, unknown>> | null) {
  return (rows || []).map((r) => String(r.created_at)).filter((s) => s && s !== "null")
}

export default async function HeatmapPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, handle")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  if (!creator) return <main style={nf}>Creator not found.</main>

  const since = new Date(Date.now() - DAYS_BACK * 86400000).toISOString()

  const [viewRows, clickRows] = await Promise.all([
    supabaseAdmin
      .from("page_views")
      .select("created_at")
      .eq("creator_id", creator.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(ROW_CAP),
    supabaseAdmin
      .from("link_clicks")
      .select("created_at")
      .eq("creator_id", creator.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(ROW_CAP),
  ])

  const views = stamps(viewRows.data as Array<Record<string, unknown>> | null)
  const clicks = stamps(clickRows.data as Array<Record<string, unknown>> | null)
  const capped = views.length >= ROW_CAP || clicks.length >= ROW_CAP

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={title}>Best time to post</div>
        <div style={sub}>
          When people actually opened your page and tapped your links, by day and hour, over the last{" "}
          {DAYS_BACK} days.
        </div>
      </div>

      <Heatmap views={views} clicks={clicks} days={DAYS_BACK} capped={capped} />
    </div>
  )
}
