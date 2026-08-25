import { supabaseAdmin } from "@/lib/supabaseAdmin"
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

  const { data: collections } = await supabaseAdmin
    .from("collections")
    .select("id, name, redirect_url")
    .order("created_at", { ascending: true })

  const { data: creators } = await supabaseAdmin
    .from("creators")
    .select("id, handle, display_name, collection_id")
    .order("created_at", { ascending: true })

  const pages: PageRow[] = (creators || []).map((c: Record<string, unknown>) => ({
    id: String(c.id),
    handle: String(c.handle || ""),
    displayName: String(c.display_name || c.handle || "Untitled"),
    collectionId: c.collection_id ? String(c.collection_id) : "",
  }))

  const rows: CollectionRow[] = (collections || []).map((c: Record<string, unknown>) => ({
    id: String(c.id),
    name: String(c.name || ""),
    redirectUrl: c.redirect_url ? String(c.redirect_url) : "",
    pageCount: pages.filter((p) => p.collectionId === String(c.id)).length,
  }))

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={title}>Collections</div>
        <div style={sub}>Group your pages, then reuse one redirect for every page in the group</div>
      </div>
      <CollectionsUI handle={handle} collections={rows} pages={pages} />
    </div>
  )
}
