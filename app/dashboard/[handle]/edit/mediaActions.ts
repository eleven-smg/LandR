"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const BUCKET = "media"
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif"]

function refresh(handle: string) {
  revalidatePath("/" + handle)
  revalidatePath("/dashboard/" + handle)
  revalidatePath("/dashboard/" + handle + "/edit")
  revalidatePath("/dashboard/" + handle + "/geoblocking")
}

function fileFrom(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value === "string") return null
  if (value.size <= 0 || value.size > MAX_UPLOAD_BYTES) return null
  return value
}

function extOf(name: string, fallback: string) {
  const dot = name.lastIndexOf(".")
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : ""
  return ext.length > 0 && ext.length <= 5 ? ext : fallback
}

async function uploadPublic(path: string, file: File) {
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  })
  if (error) return ""
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  if (!data || !data.publicUrl) return ""
  return data.publicUrl + "?v=" + Date.now()
}

/**
 * Uploading over the same path replaces the old file, but only when the new file
 * has the same extension. Switching from jpg to png would otherwise leave the
 * old image sitting in storage forever, so remove the siblings explicitly.
 */
async function dropOtherExtensions(prefix: string, keepExt: string) {
  const stale = IMAGE_EXTS.filter((e) => e !== keepExt).map((e) => prefix + "." + e)
  if (stale.length === 0) return
  await supabaseAdmin.storage.from(BUCKET).remove(stale)
}

export async function saveAvatar(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const creatorId = String(formData.get("creator_id") || "")
  const pasted = String(formData.get("photo_url") || "").trim()
  const file = fileFrom(formData.get("photo_file"))

  if (!handle) return

  let photo = pasted
  if (file) {
    const ext = extOf(file.name, "jpg")
    photo = await uploadPublic(creatorId + "/avatar." + ext, file)
    if (photo) await dropOtherExtensions(creatorId + "/avatar", ext)
  }
  if (!photo) return

  await supabaseAdmin.from("creators").update({ photo_url: photo }).eq("handle", handle)
  refresh(handle)
}

export async function removeAvatar(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  if (!handle) return
  await supabaseAdmin.from("creators").update({ photo_url: null }).eq("handle", handle)
  refresh(handle)
}

export async function saveIcon(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const creatorId = String(formData.get("creator_id") || "")
  const pasted = String(formData.get("icon_url") || "").trim()
  const file = fileFrom(formData.get("icon_file"))

  if (!handle || !id) return

  let icon = pasted
  if (file) {
    const ext = extOf(file.name, "png")
    icon = await uploadPublic(creatorId + "/icon-" + id + "." + ext, file)
    if (icon) await dropOtherExtensions(creatorId + "/icon-" + id, ext)
  }
  if (!icon) return

  await supabaseAdmin.from("links").update({ icon }).eq("id", id)
  refresh(handle)
}

export async function removeIcon(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  if (!handle || !id) return
  await supabaseAdmin.from("links").update({ icon: null }).eq("id", id)
  refresh(handle)
}

export async function addLinkFull(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const creatorId = String(formData.get("creator_id") || "")
  const label = String(formData.get("label") || "").trim()
  const url = String(formData.get("url") || "").trim()
  const type = String(formData.get("type") || "button")
  const pasted = String(formData.get("icon_url") || "").trim()
  const file = fileFrom(formData.get("icon_file"))

  if (!handle || !creatorId || !label) return

  const { data: last } = await supabaseAdmin
    .from("links")
    .select("position")
    .eq("creator_id", creatorId)
    .order("position", { ascending: false })
    .limit(1)

  const highest = last && last.length > 0 ? Number(last[0].position || 0) : 0

  const { data: created, error } = await supabaseAdmin
    .from("links")
    .insert({
      creator_id: creatorId,
      label,
      type,
      position: highest + 1,
      destinations: url ? [{ url }] : [],
      is_active: true,
      size: "md",
      shape: "pill",
      icon: file ? null : pasted || null,
    })
    .select("id")
    .single()

  if (error || !created) return

  if (file) {
    const icon = await uploadPublic(creatorId + "/icon-" + created.id + "." + extOf(file.name, "png"), file)
    if (icon) await supabaseAdmin.from("links").update({ icon }).eq("id", created.id)
  }

  refresh(handle)
}
