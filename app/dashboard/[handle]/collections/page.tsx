import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"
import { normalizeDestinations } from "@/lib/collections"
import type { CSSProperties } from "react"
import CollectionsUI from "./CollectionsUI"
import type { CollectionRow, PageRow } from "./CollectionsUI"

export const dynamic = "force-dynamic"

const wrap: CSSProperties = { maxWidth: 900 }
const head: CSSProperties = { marginBottom: 20 }
const title: CSSProperties = { fontSize: 20, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }

export default async function CollectionsPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  // Collections group the viewer's own pages into a campaign. Both lists are
  // scoped to this account: the collection list was previously unscoped, so
  // every account could read every other account's campaign names.
  const access = await requireDashboardAccess(handle)
  const seesEverything = access?.account.role === "admin"

  let collectionsQuery = supabaseAdmin
    .from("collections")
    .select(
      "id, name, owner_account_id, redirect_url, country_redirect_enabled, destinations, takeover_url, takeover_enabled",
    )
    .order("created_at", { ascending: true })

  if (access && !seesEverything) collectionsQuery = collectionsQuery.eq("owner_account_id", access.account.id)

  const { data: collections } = await collectionsQuery

  let creatorsQuery = supabaseAdmin
    .from("creators")
    .select("id, handle, display_name, collection_id")
    .order("created_at", { ascending: true })

  if (access && !seesEverything) creatorsQuery = creatorsQuery.eq("account_id", access.account.id)

  const { data: creators } = await creatorsQuery

  const pages: PageRow[] = (creators || []).map((c: Record<string, unknown>) => ({
    id: String(c.id),
    handle: String(c.handle || ""),
    displayName: String(c.display_name || c.handle || "Untitled"),
    collectionId: c.collection_id ? String(c.collection_id) : "",
  }))

  const rows: CollectionRow[] = (collections || []).map((c: Record<string, unknown>) => {
    const owner = c.owner_account_id ? String(c.owner_account_id) : ""
    return {
      id: String(c.id),
      name: String(c.name || ""),
      countryRedirectUrl: c.redirect_url ? String(c.redirect_url) : "",
      countryRedirectEnabled: !!c.country_redirect_enabled,
      takeoverUrl: c.takeover_url ? String(c.takeover_url) : "",
      takeoverEnabled: !!c.takeover_enabled,
      destinations: normalizeDestinations(c.destinations),
      pageCount: pages.filter((p) => p.collectionId === String(c.id)).length,
      // A row created before collections had owners belongs to nobody, so only
      // an admin can safely change it.
      canManage: seesEverything || (!!access && !!owner && owner === access.account.id),
    }
  })

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={title}>Collections</div>
        <div style={sub}>
          Group your own pages into a campaign, then choose what the campaign does: swap a button&rsquo;s destination
          across every page in it, send flagged-country visitors one place, or send everybody to a site you prepared.
          Each one has its own switch, and Analytics can read the whole group together.
        </div>
      </div>
      <CollectionsUI handle={handle} collections={rows} pages={pages} />
    </div>
  )
}
