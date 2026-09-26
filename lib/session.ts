import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"

export const SESSION_COOKIE = "landr_session"

/**
 * Statuses in which a creator still reaches a model's dashboard.
 *
 * `release_requested` is deliberately included: a model created BY a creator can
 * ask to be released, but the creator keeps working until he approves it. A
 * model who invited the creator herself does not use this path at all -- she
 * revokes directly and access ends immediately.
 */
export const LINKED_STATUSES = ["active", "release_requested"] as const

export type Account = {
  id: string
  /** Null for a model created by a creator, who signs in with a username. */
  email: string | null
  username: string | null
  name: string | null
  role: string
}

export type DashboardAccess = {
  account: Account
  creator: { id: string; handle: string }
  /** True when this account_id owns the page outright. */
  isOwner: boolean
  /** True when access comes from a creator_clients link rather than ownership. */
  viaCreatorLink: boolean
}

export type ManagedPage = {
  id: string
  handle: string
  displayName: string
  photoUrl: string | null
  accountId: string | null
  access: "own" | "managed" | "admin"
}

export async function getSession(): Promise<Account | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)
  if (!raw || !raw.value) return null

  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, email, username, name, role")
    .eq("id", raw.value)
    .single()

  if (!data) return null
  return {
    id: String(data.id),
    email: data.email ? String(data.email) : null,
    username: data.username ? String(data.username) : null,
    name: data.name ? String(data.name) : null,
    role: String(data.role || "model"),
  }
}

export async function isAdmin(): Promise<boolean> {
  const account = await getSession()
  return !!account && account.role === "admin"
}

/**
 * The model account ids this account currently manages as a creator.
 * Empty for models and for creators with no accepted links.
 */
export async function getClientAccountIds(accountId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("creator_clients")
    .select("model_account_id")
    .eq("creator_account_id", accountId)
    .in("status", LINKED_STATUSES as unknown as string[])

  return (data || [])
    .map((r: Record<string, unknown>) => String(r.model_account_id || ""))
    .filter(Boolean)
}

/**
 * THE ownership seam. Every list, gate and analytics query asks this one
 * function which pages an account may work on, so the rules live in a single
 * place:
 *
 *   - a model sees the pages her own account_id owns;
 *   - a creator additionally sees the pages of every model he has an accepted
 *     link to;
 *   - an admin sees everything.
 *
 * Ownership is never transferred to a creator. The model always owns her page
 * and the creator's reach is a row in creator_clients, which is what makes
 * disconnecting (or releasing) a one-column change.
 */
export async function getManagedPages(account: Account): Promise<ManagedPage[]> {
  const isAdminAccount = account.role === "admin"

  const clientIds = isAdminAccount ? [] : await getClientAccountIds(account.id)

  let query = supabaseAdmin
    .from("creators")
    .select("id, handle, display_name, photo_url, account_id")
    .order("created_at", { ascending: true })

  if (!isAdminAccount) {
    const owners = [account.id, ...clientIds]
    query = query.in("account_id", owners)
  }

  const { data } = await query

  return (data || []).map((c: Record<string, unknown>) => {
    const accountId = c.account_id ? String(c.account_id) : null
    const access: ManagedPage["access"] =
      accountId && accountId === account.id ? "own" : isAdminAccount ? "admin" : "managed"

    return {
      id: String(c.id),
      handle: String(c.handle || ""),
      displayName: String(c.display_name || c.handle || "Untitled"),
      photoUrl: c.photo_url ? String(c.photo_url) : null,
      accountId,
      access,
    }
  })
}

/**
 * The one place that answers "is this visitor allowed to work on this page?".
 *
 * The dashboard layout does this check for the tabs, but route handlers and
 * server actions never pass through a layout, so each of them has to ask here
 * instead. Admins reach every page; a model reaches the page whose account_id
 * is her own; a creator reaches the pages of models he has an accepted link to.
 *
 * Returns null when nobody is signed in, when the handle does not exist, or
 * when the account may not touch it. Callers should treat all three the same and
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

  const ownerId = String(row.account_id || "")
  const isOwner = ownerId !== "" && ownerId === account.id
  let viaCreatorLink = false

  if (!isOwner && account.role !== "admin") {
    if (!ownerId) return null

    const { data: link } = await supabaseAdmin
      .from("creator_clients")
      .select("id")
      .eq("creator_account_id", account.id)
      .eq("model_account_id", ownerId)
      .in("status", LINKED_STATUSES as unknown as string[])
      .limit(1)
      .maybeSingle()

    if (!link) return null
    viaCreatorLink = true
  }

  return {
    account,
    creator: { id: String(row.id), handle: String(row.handle) },
    isOwner,
    viaCreatorLink,
  }
}
