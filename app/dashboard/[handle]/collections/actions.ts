"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

function refresh(handle: string) {
  revalidatePath("/dashboard/" + handle + "/collections")
  revalidatePath("/dashboard/" + handle)
  revalidatePath("/dashboard/" + handle + "/geoblocking")
}

export async function createCollection(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const name = String(formData.get("name") || "").trim()
  const redirectUrl = String(formData.get("redirect_url") || "").trim()
  if (!handle || !name) return

  await supabaseAdmin.from("collections").insert({ name, redirect_url: redirectUrl || null })
  refresh(handle)
}

export async function updateCollection(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const redirectUrl = String(formData.get("redirect_url") || "").trim()
  if (!handle || !id || !name) return

  await supabaseAdmin.from("collections").update({ name, redirect_url: redirectUrl || null }).eq("id", id)
  refresh(handle)
}

export async function deleteCollection(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  if (!handle || !id) return

  await supabaseAdmin.from("creators").update({ collection_id: null }).eq("collection_id", id)
  await supabaseAdmin.from("collections").delete().eq("id", id)
  refresh(handle)
}

export async function setPageCollection(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const pageId = String(formData.get("page_id") || "")
  const collectionId = String(formData.get("collection_id") || "")
  if (!handle || !pageId) return

  await supabaseAdmin
    .from("creators")
    .update({ collection_id: collectionId ? collectionId : null })
    .eq("id", pageId)
  refresh(handle)
}
