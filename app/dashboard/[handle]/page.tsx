import { supabaseAdmin } from "@/lib/supabaseAdmin"
import Charts from "./Charts"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("*")
    .eq("handle", handle)
    .single()

  if (!creator) {
    return (
      <main className="min-h-screen bg-neutral-950 p-8 text-neutral-300">
        <p>No creator found for that handle.</p>
      </main>
    )
  }

  const { data: viewsData } = await supabaseAdmin
    .from("page_views")
    .select("created_at, source, device")
    .eq("creator_id", creator.id)
    .limit(5000)

  const { data: clicksData } = await supabaseAdmin
    .from("link_clicks")
    .select("created_at, link_id")
    .eq("creator_id", creator.id)
    .limit(5000)

  const { data: linksData } = await supabaseAdmin
    .from("links")
    .select("id, label")
    .eq("creator_id", creator.id)

  const views = viewsData || []
  const clicks = clicksData || []
  const links = linksData || []

  const totalViews = views.length
  const totalClicks = clicks.length
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 1000) / 10 : 0

  const days: string[] = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const viewsByDay: Record<string, number> = {}
  const clicksByDay: Record<string, number> = {}
  for (const day of days) {
    viewsByDay[day] = 0
    clicksByDay[day] = 0
  }
  for (const v of views) {
    const k = String(v.created_at).slice(0, 10)
    if (k in viewsByDay) viewsByDay[k] += 1
  }
  for (const c of clicks) {
    const k = String(c.created_at).slice(0, 10)
    if (k in clicksByDay) clicksByDay[k] += 1
  }
  const daily = days.map((day) => ({
    day: day.slice(5),
    views: viewsByDay[day],
    clicks: clicksByDay[day],
  }))

  const labelById: Record<string, string> = {}
  for (const l of links) labelById[l.id] = l.label
  const clickCountById: Record<string, number> = {}
  for (const c of clicks) {
    const id = String(c.link_id)
    clickCountById[id] = (clickCountById[id] || 0) + 1
  }
  const byLink = Object.keys(clickCountById).map((id) => ({
    name: labelById[id] || "Unknown",
    value: clickCountById[id],
  }))

  const sourceCount: Record<string, number> = {}
  for (const v of views) {
    const s = v.source || "direct"
    sourceCount[s] = (sourceCount[s] || 0) + 1
  }
  const bySource = Object.keys(sourceCount).map((name) => ({
    name,
    value: sourceCount[name],
  }))

  const deviceCount: Record<string, number> = {}
  for (const v of views) {
    const dv = v.device || "desktop"
    deviceCount[dv] = (deviceCount[dv] || 0) + 1
  }
  const byDevice = Object.keys(deviceCount).map((name) => ({
    name,
    value: deviceCount[name],
  }))

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-10 text-neutral-100">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{creator.display_name} &mdash; Analytics</h1>
          <p className="text-sm text-neutral-500">/{creator.handle}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a href={"/dashboard/" + creator.handle + "/edit"} className="text-indigo-400 hover:underline">
              Edit page &rarr;
            </a>
            <a href={"/" + creator.handle} className="text-neutral-400 hover:underline">
              View public page &rarr;
            </a>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500">Total views</p>
            <p className="mt-1 text-3xl font-semibold">{totalViews}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500">Total clicks</p>
            <p className="mt-1 text-3xl font-semibold">{totalClicks}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500">Click-through rate</p>
            <p className="mt-1 text-3xl font-semibold">{ctr}%</p>
          </div>
        </div>

        <Charts daily={daily} byLink={byLink} bySource={bySource} byDevice={byDevice} />
      </div>
    </main>
  )
}
