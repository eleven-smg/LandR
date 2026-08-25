import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import type { CSSProperties } from "react"
import CountryPicker from "./CountryPicker"
import RotationGroups from "./RotationGroups"
import type { RotationItem } from "./RotationGroups"

export const dynamic = "force-dynamic"

const nf: CSSProperties = { padding: 24, color: "#fff" }
const head: CSSProperties = { marginBottom: 20 }
const title: CSSProperties = { fontSize: 20, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const wrap: CSSProperties = { maxWidth: 820 }

export default async function GeoblockingPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, handle, blocked_countries, blocked_redirect_url")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  if (!creator) return <main style={nf}>Creator not found.</main>

  const { data: links } = await supabaseAdmin
    .from("links")
    .select("id, label, rotate, rotation_urls")
    .eq("creator_id", creator.id)
    .order("position", { ascending: true })

  const items: RotationItem[] = (links || []).map((l: Record<string, unknown>) => ({
    id: String(l.id),
    label: String(l.label || "Untitled link"),
    rotate: l.rotate === true,
    urls: (l.rotation_urls as string[]) || [],
  }))

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={title}>Geoblocking</div>
        <div style={sub}>Pick the countries that get treated differently, then choose what they see</div>
      </div>

      <CountryPicker
        handle={String(creator.handle)}
        initial={((creator.blocked_countries as string[]) || []).map((c) => String(c).toUpperCase())}
        redirectUrl={String(creator.blocked_redirect_url || "")}
      />

      <RotationGroups handle={String(creator.handle)} items={items} />
    </div>
  )
}
