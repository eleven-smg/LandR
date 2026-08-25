import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"

export const dynamic = "force-dynamic"

const RANGE_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 }

/** Excel and Sheets both need quotes doubled and newlines flattened. */
function cell(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value)
  const flat = raw.split("\r").join(" ").split("\n").join(" ")
  return "\"" + flat.split("\"").join("\"\"") + "\""
}

function csv(header: string[], rows: Array<Array<unknown>>) {
  const lines = [header.map(cell).join(",")]
  for (const row of rows) lines.push(row.map(cell).join(","))
  return lines.join("\r\n")
}

function send(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"" + filename + "\"",
      "cache-control": "no-store",
    },
  })
}

/**
 * Downloads the numbers behind the analytics page so the agency can keep its own
 * records or hand a spreadsheet to a model. Three shapes: raw views, raw clicks,
 * and one row per link with its click rate.
 */
export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const url = new URL(request.url)
  const rangeKey = String(url.searchParams.get("range") || "week")
  const what = String(url.searchParams.get("what") || "views")
  const days = RANGE_DAYS[rangeKey] || 7

  const { data: creatorData } = await supabaseAdmin
    .from("creators")
    .select("id, handle")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  const creator = creatorData as { id: string; handle: string } | null
  if (!creator) return new Response("No page called " + handle, { status: 404 })

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const stamp = creator.handle + "-" + rangeKey

  if (what === "clicks") {
    const { data } = await supabaseAdmin
      .from("link_clicks")
      .select(
        "created_at, destination_url, country, region, city, device, browser, os, referrer, source, visitor_id, session_id",
      )
      .eq("creator_id", creator.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(20000)

    const rows = (data || []) as Array<Record<string, unknown>>
    const body = csv(
      [
        "When",
        "Destination",
        "Country",
        "Region",
        "City",
        "Device",
        "Browser",
        "OS",
        "Referrer",
        "Source",
        "Visitor",
        "Session",
      ],
      rows.map((r) => [
        r.created_at,
        r.destination_url,
        r.country,
        r.region,
        r.city,
        r.device,
        r.browser,
        r.os,
        r.referrer,
        r.source,
        r.visitor_id,
        r.session_id,
      ]),
    )
    return send(body, "landr-clicks-" + stamp + ".csv")
  }

  if (what === "links") {
    const [linkRes, clickRes, viewRes] = await Promise.all([
      supabaseAdmin
        .from("links")
        .select("id, label, url, position, is_active")
        .eq("creator_id", creator.id)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("link_clicks")
        .select("link_id")
        .eq("creator_id", creator.id)
        .gte("created_at", since)
        .limit(20000),
      supabaseAdmin
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id)
        .gte("created_at", since),
    ])

    const links = (linkRes.data || []) as Array<Record<string, unknown>>
    const clicks = (clickRes.data || []) as Array<{ link_id: string | null }>
    const viewCount = Number(viewRes.count || 0)

    const perLink = new Map<string, number>()
    for (const c of clicks) {
      const id = String(c.link_id || "").trim()
      if (id) perLink.set(id, (perLink.get(id) || 0) + 1)
    }

    const body = csv(
      ["Link", "Destination", "Position", "Live", "Clicks", "Page views", "Click rate %"],
      links.map((l) => {
        const hits = perLink.get(String(l.id)) || 0
        const rate = viewCount > 0 ? Math.round((hits / viewCount) * 1000) / 10 : 0
        return [l.label, l.url, l.position, l.is_active === false ? "no" : "yes", hits, viewCount, rate]
      }),
    )
    return send(body, "landr-links-" + stamp + ".csv")
  }

  const { data } = await supabaseAdmin
    .from("page_views")
    .select(
      "created_at, path, country, region, city, device, browser, os, referrer, source, visitor_id, session_id, duration_seconds, language, screen",
    )
    .eq("creator_id", creator.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20000)

  const rows = (data || []) as Array<Record<string, unknown>>
  const body = csv(
    [
      "When",
      "Page",
      "Country",
      "Region",
      "City",
      "Device",
      "Browser",
      "OS",
      "Referrer",
      "Source",
      "Visitor",
      "Session",
      "Seconds on page",
      "Language",
      "Screen",
    ],
    rows.map((r) => [
      r.created_at,
      r.path,
      r.country,
      r.region,
      r.city,
      r.device,
      r.browser,
      r.os,
      r.referrer,
      r.source,
      r.visitor_id,
      r.session_id,
      r.duration_seconds,
      r.language,
      r.screen,
    ]),
  )
  return send(body, "landr-views-" + stamp + ".csv")
}
