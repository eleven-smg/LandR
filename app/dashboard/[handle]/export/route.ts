import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"
import { handlesByCreatorId, resolveCollectionScope } from "@/lib/collectionScope"

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
 * records or hand a spreadsheet to a model. Four shapes: raw views, raw clicks,
 * one row per link with its click rate, and the email subscriber list.
 *
 * This is visitor data, including cities and visitor ids, so the request has to
 * prove itself. A route handler does not pass through the dashboard layout, so
 * the ownership check has to happen here.
 *
 * The collection filter on the analytics page is honoured here too. It used to
 * be dropped, so a CSV downloaded while reading a whole campaign quietly held
 * one page. The collection id is resolved through the same helper the page
 * uses, so it can only widen the export to pages this account may already read.
 */
export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const url = new URL(request.url)
  const rangeKey = String(url.searchParams.get("range") || "week")
  const what = String(url.searchParams.get("what") || "views")
  const wantedCollection = String(url.searchParams.get("collection") || "")
  const days = RANGE_DAYS[rangeKey] || 7

  // Signed out, wrong owner and no such page all answer the same way, so this
  // cannot be used to find out which handles exist.
  const access = await requireDashboardAccess(handle)
  if (!access) return new Response("Not allowed", { status: 403 })

  const creator = access.creator

  const scope = await resolveCollectionScope({
    account: access.account,
    fallbackCreatorId: creator.id,
    wanted: wantedCollection,
  })

  const creatorIds = scope.creatorIds
  // More than one page can be in the file, so each row says which page it is.
  const grouped = scope.selected !== null
  const handles = grouped ? await handlesByCreatorId(creatorIds) : {}
  const pageOf = (id: unknown) => handles[String(id || "")] || ""

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const scoped = grouped ? creator.handle + "-collection" : creator.handle
  const stamp = scoped + "-" + rangeKey

  /**
   * The subscriber list is a mailing list, not a traffic report, so it
   * deliberately ignores the date tabs. Cutting "the subscribers" down to the
   * last seven days without saying so would hand the client a partial list that
   * looks complete -- the same quiet-wrong-answer class of bug as the export
   * that used to ignore the collection filter. The filename carries no range
   * for that reason.
   *
   * Unsubscribes are exported rather than hidden, and marked, so whoever mails
   * the list can see who opted out instead of discovering it the hard way.
   */
  if (what === "subscribers") {
    const { data } = await supabaseAdmin
      .from("subscribers")
      .select("created_at, creator_id, handle, email, unsubscribed_at")
      .in("creator_id", creatorIds)
      .order("created_at", { ascending: true })
      .limit(20000)

    const rows = (data || []) as Array<Record<string, unknown>>
    const header = ["Email", "Signed up", "Status", "Unsubscribed"]
    const body = csv(
      grouped ? ["Page", ...header] : header,
      rows.map((r) => {
        const line = [
          r.email,
          r.created_at,
          r.unsubscribed_at ? "unsubscribed" : "subscribed",
          r.unsubscribed_at,
        ]
        // creator_id is the source of truth. The stored handle is only a
        // fallback for rows written before a page was renamed.
        return grouped ? [pageOf(r.creator_id) || String(r.handle || ""), ...line] : line
      }),
    )
    return send(body, "landr-subscribers-" + scoped + ".csv")
  }

  if (what === "clicks") {
    const { data } = await supabaseAdmin
      .from("link_clicks")
      .select(
        "created_at, creator_id, destination_url, country, region, city, device, browser, os, referrer, source, visitor_id, session_id",
      )
      .in("creator_id", creatorIds)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(20000)

    const rows = (data || []) as Array<Record<string, unknown>>
    const header = [
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
    ]
    const body = csv(
      grouped ? ["Page", ...header] : header,
      rows.map((r) => {
        const line = [
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
        ]
        return grouped ? [pageOf(r.creator_id), ...line] : line
      }),
    )
    return send(body, "landr-clicks-" + stamp + ".csv")
  }

  if (what === "links") {
    const [linkRes, clickRes, viewRes] = await Promise.all([
      supabaseAdmin
        .from("links")
        .select("id, creator_id, label, url, position, is_active")
        .in("creator_id", creatorIds)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("link_clicks")
        .select("link_id")
        .in("creator_id", creatorIds)
        .gte("created_at", since)
        .limit(20000),
      supabaseAdmin
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .in("creator_id", creatorIds)
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

    const header = ["Link", "Destination", "Position", "Live", "Clicks", "Page views", "Click rate %"]
    const body = csv(
      grouped ? ["Page", ...header] : header,
      links.map((l) => {
        const hits = perLink.get(String(l.id)) || 0
        const rate = viewCount > 0 ? Math.round((hits / viewCount) * 1000) / 10 : 0
        const line = [l.label, l.url, l.position, l.is_active === false ? "no" : "yes", hits, viewCount, rate]
        return grouped ? [pageOf(l.creator_id), ...line] : line
      }),
    )
    return send(body, "landr-links-" + stamp + ".csv")
  }

  const { data } = await supabaseAdmin
    .from("page_views")
    .select(
      "created_at, creator_id, path, country, region, city, device, browser, os, referrer, source, visitor_id, session_id, duration_seconds, language, screen",
    )
    .in("creator_id", creatorIds)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20000)

  const rows = (data || []) as Array<Record<string, unknown>>
  const header = [
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
  ]
  const body = csv(
    grouped ? ["Model page", ...header] : header,
    rows.map((r) => {
      const line = [
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
      ]
      return grouped ? [pageOf(r.creator_id), ...line] : line
    }),
  )
  return send(body, "landr-views-" + stamp + ".csv")
}
