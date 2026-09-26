import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import { getSession, getManagedPages, requireDashboardAccess } from "@/lib/session"
import Sidebar from "./Sidebar"
import "./dashboard.css"

export const dynamic = "force-dynamic"

/**
 * Every dashboard tab hangs off this layout, so the login check lives here once
 * instead of in each page.
 *
 * The decision itself is delegated to requireDashboardAccess so that the layout,
 * the route handlers and the server actions cannot drift apart: a model reaches
 * her own page, a creator reaches the pages of models who accepted him, and an
 * admin reaches everything. Anyone else is sent to /dashboard, which works out
 * where they should be instead of guessing here.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const session = await getSession()
  if (!session) redirect("/signin?next=" + encodeURIComponent("/dashboard/" + handle))

  const access = await requireDashboardAccess(handle)
  if (!access) redirect("/dashboard")

  // Matched without case so /dashboard/Ava works the same as /dashboard/ava.
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("handle, display_name, photo_url")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  const row = creator as {
    handle: string
    display_name: string | null
    photo_url: string | null
  } | null

  // The Home link only appears when there is somewhere to go back to, so a
  // model with a single page sees exactly the sidebar she saw before.
  const pages = await getManagedPages(session)
  const showHome = pages.length > 1

  const roleLabel =
    session.role === "admin" ? "Admin" : access.viaCreatorLink ? "Creator" : access.isOwner ? "Owner" : "Member"

  return (
    <div className="dash-root">
      <Sidebar
        handle={(row && row.handle) || handle}
        displayName={(row && row.display_name) || handle}
        photoUrl={(row && row.photo_url) || null}
        showHome={showHome}
        roleLabel={roleLabel}
        accountName={session.name || session.email || session.username || "Account"}
      />
      <div className="dash-main">{children}</div>
    </div>
  )
}
