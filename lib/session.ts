import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"

export const SESSION_COOKIE = "landr_session"

export type Account = {
  id: string
  email: string
  name: string | null
  role: string
}

export type DashboardAccess = {
  account: Account
  creator: { id: string; handle: string }
}

export async function getSession(): Promise<Account | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)
  if (!raw || !raw.value) return null

  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, email, name, role")
    .eq("id", raw.value)
    .single()

  if (!data) return null
  return {
    id: String(data.id),
    email: String(data.email),
    name: data.name ? String(data.name) : null,
    role: String(data.role || "model"),
  }
}

export async function isAdmin(): Promise<boolean> {
  const account = await getSession()
  return !!account && account.role === "admin"
}

/**
 * The one place that answers "is this visitor allowed to work on this page?".
 *
 * The dashboard layout does this check for the tabs, but route handlers and
 * server actions never pass through a layout, so each of them has to ask here
 * instead. Admins reach every page; a model reaches only the page whose
 * account_id is their own.
 *
 * Returns null when nobody is signed in, when the handle does not exist, or
 * when the account does not own it. Callers should treat all three the same and
 * refuse the request, so an outsider cannot tell a missing page from a page
 * they simply cannot see.
 *
 * Never take creator_id or handle from client input and trust it. Take the
 * handle from the URL, call this, and use the creator id it returns.
 */
export async function requireDashboardAccess(handle: string): Promise<DashboardAccess | null> {
  const clean = String(handle || "").trim()
  if (!clean) return null

  const account = await getSession()
  if (!account) return null

  // Matched without case so /dashboard/Ava behaves like /dashboard/ava.
  const { data } = await supabaseAdmin
    .from("creators")
    .select("id, handle, account_id")
    .ilike("handle", likeSafeHandle(clean))
    .limit(1)
    .maybeSingle()

  const row = data as { id: string; handle: string; account_id: string | null } | null
  if (!row) return null

  if (account.role !== "admin" && String(row.account_id || "") !== account.id) return null

  return {
    account,
    creator: { id: String(row.id), handle: String(row.handle) },
  }
}
