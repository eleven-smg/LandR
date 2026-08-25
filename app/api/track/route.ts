import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

/**
 * Enriches a page view that was already inserted server side. The browser is
 * the only place that knows the visitor id, the session id, the screen size and
 * how long the page stayed open.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const viewId = String(body.viewId || "")
    if (viewId.length < 10) return NextResponse.json({ ok: false }, { status: 400 })

    const patch: Record<string, unknown> = {}
    if (body.visitorId) patch.visitor_id = String(body.visitorId).slice(0, 64)
    if (body.sessionId) patch.session_id = String(body.sessionId).slice(0, 64)
    if (body.language) patch.language = String(body.language).slice(0, 16)
    if (body.screen) patch.screen = String(body.screen).slice(0, 16)

    const duration = Number(body.duration)
    if (Number.isFinite(duration) && duration > 0) {
      patch.duration_seconds = Math.min(Math.round(duration), 86400)
    }

    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

    await supabaseAdmin.from("page_views").update(patch).eq("id", viewId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
