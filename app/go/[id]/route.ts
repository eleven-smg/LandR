import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logLinkClick, getRequestMeta } from "@/lib/analytics"

type Destination = { url: string; disabled?: boolean }
type GeoRule = { countries: string[]; url: string }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: link } = await supabaseAdmin
    .from("links")
    .select("*")
    .eq("id", id)
    .single()

  if (!link) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const m = await getRequestMeta()
  let destinationUrl: string | null = null

  const geoRules = (link.geo_rules || []) as GeoRule[]
  if (m.country) {
    const rule = geoRules.find((r) => r.countries.includes(m.country as string))
    if (rule) destinationUrl = rule.url
  }

  if (!destinationUrl) {
    const dests = (link.destinations || []) as Destination[]
    const live = dests.find((d) => !d.disabled)
    destinationUrl = live ? live.url : null
  }

  if (!destinationUrl) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  await logLinkClick(link.creator_id, link.id, destinationUrl)
  return NextResponse.redirect(destinationUrl)
}
