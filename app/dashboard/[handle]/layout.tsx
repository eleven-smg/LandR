import type { ReactNode } from "react"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import Sidebar from "./Sidebar"
import "./dashboard.css"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  // Matched without case so /dashboard/Ava works the same as /dashboard/ava.
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("handle, display_name, photo_url")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  const row = creator as { handle: string; display_name: string | null; photo_url: string | null } | null

  return (
    <div className="dash-root">
      <Sidebar
        handle={(row && row.handle) || handle}
        displayName={(row && row.display_name) || handle}
        photoUrl={(row && row.photo_url) || null}
      />
      <div className="dash-main">{children}</div>
    </div>
  )
}
