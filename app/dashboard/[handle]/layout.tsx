import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import { getSession } from "@/lib/session"
import Sidebar from "./Sidebar"
import "./dashboard.css"

export const dynamic = "force-dynamic"

/**
 * Every dashboard tab hangs off this layout, so the login check lives here once
 * instead of in each page. Admins see every model's page. A model can only open
 * the page assigned to their account in the Users tab, and is bounced to their
 * own page if they try another handle.
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

  // Matched without case so /dashboard/Ava works the same as /dashboard/ava.
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("handle, display_name, photo_url, account_id")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  const row = creator as {
    handle: string
    display_name: string | null
    photo_url: string | null
    account_id: string | null
  } | null

  if (session.role !== "admin") {
    const owned = row && row.account_id && String(row.account_id) === session.id
    if (!owned) {
      const { data: mine } = await supabaseAdmin
        .from("creators")
        .select("handle")
        .eq("account_id", session.id)
        .order("created_at", { ascending: true })
        .limit(1)

      if (mine && mine.length > 0) redirect("/dashboard/" + String(mine[0].handle))
      redirect("/signin?error=2")
    }
  }

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
