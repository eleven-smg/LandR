"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const BUCKET = "media"

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
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : ""
  return ext.length > 0 && ext.length <= 5 ? ext : fallback
}

/**
 * A link id on its own says nothing about who owns it, so every action that
 * edits one row by id confirms the row sits under this creator first.
 */
async function ownsLink(creatorId: string, id: string): Promise<boolean> {
  if (!id) return false
  const { data } = await supabaseAdmin
    .from("links")
    .select("id")
    .eq("id", id)
    .eq("creator_id", creatorId)
    .maybeSingle()
  return !!data
}

/**
 * Every replacement gets a brand new filename, so the public URL always changes
 * and no browser or CDN can keep serving the previous picture. The older files
 * with the same prefix are deleted straight afterwards, so storage stays clean.
 */
async function replaceMedia(creatorId: string, prefix: string, file: File, fallbackExt: string): Promise<string> {
  const filename = prefix + "-" + Date.now() + "." + extOf(file.name, fallbackExt)
  const path = creatorId + "/" + filename

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  })
  if (error) return ""

  const { data: existing } = await supabaseAdmin.storage.from(BUCKET).list(creatorId)
  const stale = (existing || [])
    .map((entry) => entry.name)
    .filter((entryName) => entryName !== filename)
    .filter((entryName) => entryName.startsWith(prefix + ".") || entryName.startsWith(prefix + "-"))
    .map((entryName) => creatorId + "/" + entryName)
  if (stale.length > 0) await supabaseAdmin.storage.from(BUCKET).remove(stale)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  if (!data || !data.publicUrl) return ""
  return data.publicUrl
}

export async function saveAvatar(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  const pasted = String(formData.get("photo_url") || "").trim()
  const file = fileFrom(formData.get("photo_file"))

  // The creator id comes from the session lookup, never from the form, so the
  // upload cannot be aimed at another model's folder.
  let photo = pasted
  if (file) photo = await replaceMedia(access.creator.id, "avatar", file, "jpg")
  if (!photo) return

  await supabaseAdmin.from("creators").update({ photo_url: photo }).eq("id", access.creator.id)
  refresh(access.creator.handle)
}

export async function removeAvatar(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  await supabaseAdmin.from("creators").update({ photo_url: null }).eq("id", access.creator.id)
  refresh(access.creator.handle)
}

export async function saveIcon(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  const id = String(formData.get("id") || "")
  if (!(await ownsLink(access.creator.id, id))) return

  const pasted = String(formData.get("icon_url") || "").trim()
  const file = fileFrom(formData.get("icon_file"))

  let icon = pasted
  if (file) icon = await replaceMedia(access.creator.id, "icon-" + id, file, "png")
  if (!icon) return

  await supabaseAdmin.from("links").update({ icon }).eq("id", id).eq("creator_id", access.creator.id)
  refresh(access.creator.handle)
}

export async function removeIcon(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  const id = String(formData.get("id") || "")
  if (!(await ownsLink(access.creator.id, id))) return

  await supabaseAdmin.from("links").update({ icon: null }).eq("id", id).eq("creator_id", access.creator.id)
  refresh(access.creator.handle)
}

export async function addLinkFull(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  const creatorId = access.creator.id
  const label = String(formData.get("label") || "").trim()
  const url = String(formData.get("url") || "").trim()
  const type = String(formData.get("type") || "button")
  const pasted = String(formData.get("icon_url") || "").trim()
  const file = fileFrom(formData.get("icon_file"))

  if (!label) return

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
    const icon = await replaceMedia(creatorId, "icon-" + created.id, file, "png")
    if (icon) await supabaseAdmin.from("links").update({ icon }).eq("id", created.id)
  }

  refresh(access.creator.handle)
}
