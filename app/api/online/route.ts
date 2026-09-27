import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"

export const dynamic = "force-dynamic"

// A session counts as still here when its last known moment -- arrival plus the
// duration the heartbeat has recorded so far -- falls inside this window.
const PRESENT_MINUTES = 5
// How far back to read. A visit longer than this is not counted; the row cap
// below is the reason, and half an hour on one bio page is not a real case.
const LOOKBACK_MINUTES = 30
const ROW_CAP = 1000

export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle") || ""

  // Route handlers never pass through the dashboard layout, so this gate is not
  // optional. Missing page, signed out and not-allowed all answer the same way.
  const access = await requireDashboardAccess(handle)
  if (!access) {
    return NextResponse.json({ error: "not allowed" }, { status: 403 })
  }

  const now = Date.now()
  const since = new Date(now - LOOKBACK_MINUTES * 60000).toISOString()

  const { data, error } = await supabaseAdmin
    .from("page_views")
    .select("session_id, visitor_id, created_at, duration_seconds")
    .eq("creator_id", access.creator.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(ROW_CAP)

  if (error) {
    // Fail quietly with a null count rather than a number that is not true.
    return NextResponse.json(
      { online: null, minutes: PRESENT_MINUTES },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    )
  }

  const cutoff = now - PRESENT_MINUTES * 60000
  const present = new Set<string>()

  for (const row of (data || []) as Array<Record<string, unknown>>) {
    const started = Date.parse(String(row.created_at || ""))
    if (Number.isNaN(started)) continue

    const seconds = Number(row.duration_seconds || 0)
    const lastSeen = started + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0)
    if (lastSeen < cutoff) continue

    // Prefer the session id; fall back to the visitor cookie, then the row, so
    // an older row written before session ids existed still counts once.
    const key =
      String(row.session_id || "") || String(row.visitor_id || "") || "row:" + String(started)
    present.add(key)
  }

  return NextResponse.json(
    { online: present.size, minutes: PRESENT_MINUTES },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  )
}
