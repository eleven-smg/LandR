"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

function refresh(handle: string) {
  revalidatePath("/dashboard/" + handle + "/users")
}

export async function addAccount(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = String(formData.get("role") || "model")
  if (!handle || !email || !password) return

  await supabaseAdmin.from("accounts").insert({ email, name: name || null, password, role })
  refresh(handle)
}

export async function updateAccount(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = String(formData.get("role") || "model")
  if (!handle || !id || !password) return

  await supabaseAdmin.from("accounts").update({ name: name || null, password, role }).eq("id", id)
  refresh(handle)
}

export async function deleteAccount(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  if (!handle || !id) return

  await supabaseAdmin.from("creators").update({ account_id: null }).eq("account_id", id)
  await supabaseAdmin.from("accounts").delete().eq("id", id)
  refresh(handle)
}

export async function assignPage(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const pageId = String(formData.get("page_id") || "")
  const accountId = String(formData.get("account_id") || "")
  if (!handle || !pageId) return

  await supabaseAdmin
    .from("creators")
    .update({ account_id: accountId ? accountId : null })
    .eq("id", pageId)
  refresh(handle)
}
