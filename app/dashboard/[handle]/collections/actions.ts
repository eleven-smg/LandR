"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"

function refresh(handle: string) {
  revalidatePath("/dashboard/" + handle + "/collections")
  revalidatePath("/dashboard/" + handle)
  revalidatePath("/dashboard/" + handle + "/geoblocking")
}

/**
 * A collection is shared by every page in it, and the row carries no owner of
 * its own, so renaming or deleting one affects the whole workspace. That is an
 * admin job. Putting a single page into a collection only needs the person who
 * owns that page.
 */
async function requireAdmin(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return null
  if (access.account.role !== "admin") return null
  return access
}

export async function createCollection(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const name = String(formData.get("name") || "").trim()
  const redirectUrl = String(formData.get("redirect_url") || "").trim()
  if (!name) return

  await supabaseAdmin.from("collections").insert({ name, redirect_url: redirectUrl || null })
  refresh(access.creator.handle)
}

export async function updateCollection(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const redirectUrl = String(formData.get("redirect_url") || "").trim()
  if (!id || !name) return

  await supabaseAdmin.from("collections").update({ name, redirect_url: redirectUrl || null }).eq("id", id)
  refresh(access.creator.handle)
}

export async function deleteCollection(formData: FormData) {
  const access = await requireAdmin(formData)
  if (!access) return

  const id = String(formData.get("id") || "")
  if (!id) return

  await supabaseAdmin.from("creators").update({ collection_id: null }).eq("collection_id", id)
  await supabaseAdmin.from("collections").delete().eq("id", id)
  refresh(access.creator.handle)
}

export async function setPageCollection(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  const pageId = String(formData.get("page_id") || "")
  const collectionId = String(formData.get("collection_id") || "")
  if (!pageId) return

  // A model may only move a page whose account_id is their own; an admin may
  // move any page.
  if (access.account.role !== "admin") {
    const { data: owned } = await supabaseAdmin
      .from("creators")
      .select("id")
      .eq("id", pageId)
      .eq("account_id", access.account.id)
      .maybeSingle()
    if (!owned) return
  }

  await supabaseAdmin
    .from("creators")
    .update({ collection_id: collectionId ? collectionId : null })
    .eq("id", pageId)
  refresh(access.creator.handle)
}
