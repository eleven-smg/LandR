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

export async function addAccount(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = String(formData.get("role") || "model") === "admin" ? "admin" : "model"
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
  const role = String(formData.get("role") || "model") === "admin" ? "admin" : "model"
  if (!id || !password) return

  // Locking yourself out by saving your own row as a model is a one-way trip,
  // so the last thing an admin can change is their own role.
  const patch: Record<string, unknown> = { name: name || null, password }
  if (id !== access.account.id) patch.role = role

  await supabaseAdmin.from("accounts").update(patch).eq("id", id)
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
