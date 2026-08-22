import { supabaseAdmin } from "@/lib/supabaseAdmin"
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
    .eq("handle", handle)
    .single()

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
        <div style={sub}>Block visitors from specific countries and redirect them elsewhere</div>
      </div>

      <CountryPicker
        handle={creator.handle}
        initial={((creator.blocked_countries as string[]) || []).map((c) => String(c).toUpperCase())}
        redirectUrl={String(creator.blocked_redirect_url || "")}
      />

      <RotationGroups handle={creator.handle} items={items} />
    </div>
  )
}
