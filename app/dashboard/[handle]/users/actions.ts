"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"

function refresh(handle: string) {
  revalidatePath("/dashboard/" + handle + "/users")
}

/**
 * Logins and roles are the keys to the whole workspace, so only an admin may
 * touch them. Nothing here trusts the form: the handle is checked against the
 * session, and the role comes from the account row, not the request.
 */
async function requireAdmin(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return null
  if (access.account.role !== "admin") return null
  return access
}

const ROLES = ["admin", "model", "creator"]

function cleanRole(value: unknown): string {
  const role = String(value || "model")
  return ROLES.includes(role) ? role : "model"
}

export async function addAccount(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = cleanRole(formData.get("role"))
  if (!email || !password) return

  await supabaseAdmin.from("accounts").insert({ email, name: name || null, password, role })
  refresh(access.creator.handle)
}

export async function updateAccount(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = cleanRole(formData.get("role"))
  if (!id || !password) return

  // Locking yourself out by saving your own row as a model is a one-way trip,
  // so the last thing an admin can change is their own role.
  const patch: Record<string, unknown> = { name: name || null, password }
  if (id !== access.account.id) patch.role = role

  await supabaseAdmin.from("accounts").update(patch).eq("id", id)
  refresh(access.creator.handle)
}

/**
 * The one account-editing action that is not admin-only: your own name and
 * password. It is scoped to the signed-in account id, so the form cannot name
 * somebody else's row, and it deliberately cannot touch `role` or `email` --
 * those are still the admin's job.
 */
export async function updateOwnLogin(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")

  const patch: Record<string, unknown> = { name: name || null }
  // An empty box means "leave it alone" rather than "blank my password".
  if (password) {
    if (password.length < 6) return
    patch.password = password
  }

  await supabaseAdmin.from("accounts").update(patch).eq("id", access.account.id)
  refresh(access.creator.handle)
}

export async function deleteAccount(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const id = String(formData.get("id") || "")
  if (!id) return
  // Deleting the account you are signed in with would end the session mid-click.
  if (id === access.account.id) return

  await supabaseAdmin.from("creators").update({ account_id: null }).eq("account_id", id)
  await supabaseAdmin.from("accounts").delete().eq("id", id)
  refresh(access.creator.handle)
}

export async function assignPage(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const pageId = String(formData.get("page_id") || "")
  const accountId = String(formData.get("account_id") || "")
  if (!pageId) return

  await supabaseAdmin
    .from("creators")
    .update({ account_id: accountId ? accountId : null })
    .eq("id", pageId)
  refresh(access.creator.handle)
}

/**
 * Deletes a page and everything hanging off it. This is the one destructive
 * action in the app that cannot be undone from the UI, so the admin has to
 * type the handle and it has to match the row being deleted. A stray click,
 * a stale page id or a mistyped handle all end as a no-op.
 */
export async function deletePage(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const pageId = String(formData.get("page_id") || "")
  const typed = String(formData.get("confirm_handle") || "")
    .trim()
    .replace(/^\//, "")
    .toLowerCase()
  if (!pageId || !typed) return

  const { data: targetData } = await supabaseAdmin
    .from("creators")
    .select("id, handle")
    .eq("id", pageId)
    .maybeSingle()

  const target = targetData as { id: string; handle: string | null } | null
  if (!target) return

  const targetHandle = String(target.handle || "")
  // The typed handle is the whole safety net, so a mismatch stops here.
  if (!targetHandle || targetHandle.toLowerCase() !== typed) return
  // Deleting the page named in the address bar would pull the dashboard out
  // from under the click, so that one has to be deleted from elsewhere.
  if (String(target.id) === access.creator.id) return

  // sql/schema.sql declares "on delete cascade" on all four child tables, but
  // this database has been patched by hand more than once, so the children go
  // first. Child-first order is correct whether or not the cascade is really
  // there, and it leaves nothing orphaned if one statement fails.
  await supabaseAdmin.from("link_clicks").delete().eq("creator_id", pageId)
  await supabaseAdmin.from("page_views").delete().eq("creator_id", pageId)
  await supabaseAdmin.from("subscribers").delete().eq("creator_id", pageId)
  await supabaseAdmin.from("links").delete().eq("creator_id", pageId)
  await supabaseAdmin.from("creators").delete().eq("id", pageId)

  // Files already uploaded to the media bucket are left alone on purpose:
  // several pages can point at the same upload.
  revalidatePath("/" + targetHandle)
  revalidatePath("/dashboard/" + access.creator.handle + "/collections")
  refresh(access.creator.handle)
}
