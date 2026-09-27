import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Keep-alive.
 *
 * A free Supabase project is paused after about a week with no traffic, and a
 * paused project does not fail loudly: the pages still load, they simply come
 * up empty, and nothing starts working again until somebody signs in to
 * Supabase and unpauses it by hand. For a site that may sit quiet between
 * promotions that is the difference between a slow week and a dead link in
 * every bio.
 *
 * So once a day Vercel calls this route, the route asks the database one
 * trivial question, and that single request is enough to count as activity.
 * Nothing is written, nothing is deleted, and no row is touched: it is a
 * head-only count, the cheapest read there is.
 *
 * The address is public, which is deliberate -- it returns two harmless numbers
 * and can be opened by hand to check the database is awake. If CRON_SECRET is
 * ever set in the environment, the route starts requiring the bearer token
 * Vercel sends with it and refuses everything else; with no secret set it stays
 * open, because a keep-alive that needs configuration to work is a keep-alive
 * that quietly does not.
 */
export async function GET(req: Request) {
  const secret = String(process.env.CRON_SECRET || "").trim()
  if (secret) {
    const offered = req.headers.get("authorization") || ""
    if (offered !== "Bearer " + secret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
  }

  const startedAt = Date.now()

  // head: true asks for the count and no rows at all.
  const { count, error } = await supabaseAdmin
    .from("creators")
    .select("id", { count: "exact", head: true })

  const ms = Date.now() - startedAt

  if (error) {
    // Reported as a failure on purpose: a 500 here is the one honest signal that
    // the database is unreachable, which is exactly what this route exists to
    // notice.
    return NextResponse.json({ ok: false, ms, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pages: count ?? 0, ms, at: new Date().toISOString() })
}
