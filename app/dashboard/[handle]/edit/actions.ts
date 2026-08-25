"use server"

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { SECTION_KEYS, normalizeOrder } from "@/lib/sections"

type Social = { platform: string; url: string }

export type SubscribeState = { ok?: boolean; error?: string }

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const NL = String.fromCharCode(10)
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif"]
const VIDEO_EXTS = ["mp4", "webm", "mov", "m4v"]

function refresh(handle: string) {
  revalidatePath("/" + handle)
  revalidatePath("/dashboard/" + handle + "/edit")
}

async function readSocials(handle: string): Promise<Social[]> {
  const { data } = await supabaseAdmin.from("creators").select("socials").eq("handle", handle).single()
  return Array.isArray(data?.socials) ? (data.socials as Social[]) : []
}

export async function saveProfile(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const display_name = String(formData.get("display_name") || "")
  const location = String(formData.get("location") || "")
  const tagline = String(formData.get("tagline") || "")
  const bio = String(formData.get("bio") || "")
  const active_text = String(formData.get("active_text") || "")
  const show_active_badge = formData.get("show_active_badge") === "on"
  const theme = String(formData.get("theme") || "noir")
  const template = String(formData.get("template") || "classic")
  const embed_layout = String(formData.get("embed_layout") || "stack")
  const bg_color = String(formData.get("bg_color") || "").trim()
  const bg_mode = String(formData.get("bg_mode") || "theme")
  const bg_fit = String(formData.get("bg_fit") || "cover")
  const show_subscribe = formData.get("show_subscribe") === "on"
  const subscribe_title = String(formData.get("subscribe_title") || "").trim()
  const subscribe_note = String(formData.get("subscribe_note") || "").trim()

  const patch: Record<string, unknown> = {
    display_name,
    location: location || null,
    tagline: tagline || null,
    bio,
    active_text,
    show_active_badge,
    theme,
    template: ["classic", "spotlight", "cover"].includes(template) ? template : "classic",
    // embed_layout stays in sync so older rows and the new picker agree.
    embed_layout,
    embed_template: embed_layout,
    bg_fit: bg_fit === "contain" ? "contain" : "cover",
    show_subscribe,
    subscribe_title: subscribe_title || null,
    subscribe_note: subscribe_note || null,
  }

  // Only the colour mode touches background_url, so switching to image or video
  // never wipes an uploaded file.
  if (bg_mode === "color" && bg_color) {
    patch.background_type = "color"
    patch.background_url = bg_color
  } else if (bg_mode === "image") {
    patch.background_type = "image"
  } else if (bg_mode === "video") {
    patch.background_type = "video"
  } else {
    patch.background_type = "theme"
    patch.background_url = null
  }

  await supabaseAdmin.from("creators").update(patch).eq("handle", handle)
  refresh(handle)
}

export async function moveSection(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const key = String(formData.get("key") || "")
  const direction = String(formData.get("direction") || "")
  if (!handle || !SECTION_KEYS.includes(key)) return

  const { data } = await supabaseAdmin.from("creators").select("section_order").eq("handle", handle).single()
  const order = normalizeOrder(data?.section_order)
  const index = order.indexOf(key)
  const swapWith = direction === "up" ? index - 1 : index + 1
  if (index === -1 || swapWith < 0 || swapWith >= order.length) return

  const tmp = order[index]
  order[index] = order[swapWith]
  order[swapWith] = tmp

  await supabaseAdmin.from("creators").update({ section_order: order.join(",") }).eq("handle", handle)
  refresh(handle)
}

export async function uploadBackground(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const creator_id = String(formData.get("creator_id") || "")
  const kind = String(formData.get("kind") || "image")
  const file = formData.get("file")

  if (!file || typeof file === "string") return
  const blob = file as File
  if (blob.size === 0) return
  if (blob.size > MAX_UPLOAD_BYTES) return

  const ext = (blob.name.split(".").pop() || (kind === "video" ? "mp4" : "jpg")).toLowerCase()
  const prefix = creator_id + "/bg-" + kind
  const path = prefix + "." + ext

  const { error } = await supabaseAdmin.storage.from("media").upload(path, blob, {
    contentType: blob.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
    upsert: true,
  })
  if (error) return

  // Replacing a jpg with a png would leave the jpg behind, so clear the siblings.
  const family = kind === "video" ? VIDEO_EXTS : IMAGE_EXTS
  const stale = family.filter((e) => e !== ext).map((e) => prefix + "." + e)
  if (stale.length > 0) await supabaseAdmin.storage.from("media").remove(stale)

  const { data: pub } = supabaseAdmin.storage.from("media").getPublicUrl(path)
  const col = kind === "video" ? "bg_video_url" : "bg_image_url"
  const patch: Record<string, unknown> = { background_type: kind }
  patch[col] = pub.publicUrl + "?v=" + Date.now()
  await supabaseAdmin.from("creators").update(patch).eq("handle", handle)
  refresh(handle)
}

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const handle = String(formData.get("handle") || "")
  const email = String(formData.get("email") || "").trim().toLowerCase()

  if (!email || !email.includes("@") || email.length < 5) {
    return { error: "Please enter a valid email." }
  }

  const { data: creator } = await supabaseAdmin.from("creators").select("id").eq("handle", handle).single()

  if (!creator) return { error: "Something went wrong. Try again." }

  const { error } = await supabaseAdmin.from("subscribers").insert({ creator_id: creator.id, handle, email })

  if (error) {
    // 23505 is a unique violation: the address is already on the list, which is
    // a success from the visitor's point of view.
    if (error.code === "23505") return { ok: true }
    return { error: "Could not subscribe. Please try again." }
  }

  refresh(handle)
  return { ok: true }
}

export async function uploadVideo(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const creator_id = String(formData.get("creator_id") || "")
  const file = formData.get("video")

  if (!file || typeof file === "string") return
  const blob = file as File
  if (blob.size === 0) return
  if (blob.size > MAX_UPLOAD_BYTES) return

  const ext = (blob.name.split(".").pop() || "mp4").toLowerCase()
  const path = creator_id + "/" + id + "." + ext

  const { error } = await supabaseAdmin.storage.from("media").upload(path, blob, {
    contentType: blob.type || "video/mp4",
    upsert: true,
  })
  if (error) return

  const { data: pub } = supabaseAdmin.storage.from("media").getPublicUrl(path)
  await supabaseAdmin.from("links").update({ media_url: pub.publicUrl }).eq("id", id)
  refresh(handle)
}

export async function removeVideo(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  await supabaseAdmin.from("links").update({ media_url: null }).eq("id", id)
  refresh(handle)
}

export async function savePreview(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const creator_id = String(formData.get("creator_id") || "")
  const pastedUrl = String(formData.get("preview_url") || "").trim()
  const file = formData.get("preview_file")

  let publicUrl = ""

  if (file && typeof file !== "string") {
    const blob = file as File
    if (blob.size > 0) {
      if (blob.size > MAX_UPLOAD_BYTES) return
      const ext = (blob.name.split(".").pop() || "jpg").toLowerCase()
      const path = creator_id + "/preview-" + id + "." + ext
      const { error } = await supabaseAdmin.storage.from("media").upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true,
      })
      if (error) return
      const { data: pub } = supabaseAdmin.storage.from("media").getPublicUrl(path)
      publicUrl = pub.publicUrl
    }
  }

  if (!publicUrl && pastedUrl) publicUrl = pastedUrl
  if (!publicUrl) return

  await supabaseAdmin.from("links").update({ preview_image_url: publicUrl }).eq("id", id)
  refresh(handle)
}

export async function removePreview(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  await supabaseAdmin.from("links").update({ preview_image_url: null }).eq("id", id)
  refresh(handle)
}

export async function saveLayout(handle: string, items: { id: string; size: string }[]) {
  for (let i = 0; i < items.length; i++) {
    await supabaseAdmin.from("links").update({ position: i, size: items[i].size }).eq("id", items[i].id)
  }
  refresh(handle)
}

export async function addSocial(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const platform = String(formData.get("platform") || "").trim().toLowerCase()
  const url = String(formData.get("url") || "").trim()
  if (!platform || !url) return
  const socials = await readSocials(handle)
  socials.push({ platform, url })
  await supabaseAdmin.from("creators").update({ socials }).eq("handle", handle)
  refresh(handle)
}

export async function updateSocial(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const index = Number(formData.get("index"))
  const platform = String(formData.get("platform") || "").trim().toLowerCase()
  const url = String(formData.get("url") || "").trim()
  const socials = await readSocials(handle)
  if (index < 0 || index >= socials.length) return
  socials[index] = { platform, url }
  await supabaseAdmin.from("creators").update({ socials }).eq("handle", handle)
  refresh(handle)
}

export async function deleteSocial(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const index = Number(formData.get("index"))
  const socials = await readSocials(handle)
  if (index < 0 || index >= socials.length) return
  socials.splice(index, 1)
  await supabaseAdmin.from("creators").update({ socials }).eq("handle", handle)
  refresh(handle)
}

export async function moveSocial(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const index = Number(formData.get("index"))
  const direction = String(formData.get("direction") || "")
  const socials = await readSocials(handle)
  const swapWith = direction === "up" ? index - 1 : index + 1
  if (index < 0 || index >= socials.length) return
  if (swapWith < 0 || swapWith >= socials.length) return
  const tmp = socials[index]
  socials[index] = socials[swapWith]
  socials[swapWith] = tmp
  await supabaseAdmin.from("creators").update({ socials }).eq("handle", handle)
  refresh(handle)
}

export async function addLink(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const creator_id = String(formData.get("creator_id") || "")
  const label = String(formData.get("label") || "")
  const url = String(formData.get("url") || "")
  const type = String(formData.get("type") || "button")

  const { data: last } = await supabaseAdmin
    .from("links")
    .select("position")
    .eq("creator_id", creator_id)
    .order("position", { ascending: false })
    .limit(1)

  const nextPos = last && last.length > 0 ? (last[0].position || 0) + 1 : 0

  await supabaseAdmin.from("links").insert({
    creator_id,
    label,
    type,
    destinations: [{ url }],
    position: nextPos,
    is_active: true,
  })

  refresh(handle)
}

export async function updateLink(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const label = String(formData.get("label") || "")
  const url = String(formData.get("url") || "")
  const type = String(formData.get("type") || "button")
  const icon = String(formData.get("icon") || "")
  const subtitle = String(formData.get("subtitle") || "")
  const shape = String(formData.get("shape") || "pill")
  const size = String(formData.get("size") || "md")
  const color = String(formData.get("color") || "")
  const is_active = formData.get("is_active") === "on"

  await supabaseAdmin
    .from("links")
    .update({
      label,
      type,
      destinations: [{ url }],
      icon: icon || null,
      subtitle: subtitle || null,
      shape,
      size,
      color: color || null,
      is_active,
    })
    .eq("id", id)

  refresh(handle)
}

export async function deleteLink(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  await supabaseAdmin.from("links").delete().eq("id", id)
  refresh(handle)
}

export async function moveLink(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const creator_id = String(formData.get("creator_id") || "")
  const id = String(formData.get("id") || "")
  const direction = String(formData.get("direction") || "")

  const { data: rows } = await supabaseAdmin
    .from("links")
    .select("id, position")
    .eq("creator_id", creator_id)
    .order("position", { ascending: true })

  if (!rows) return

  const index = rows.findIndex((r) => r.id === id)
  if (index === -1) return
  const swapWith = direction === "up" ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= rows.length) return

  const a = rows[index]
  const b = rows[swapWith]

  await supabaseAdmin.from("links").update({ position: b.position }).eq("id", a.id)
  await supabaseAdmin.from("links").update({ position: a.position }).eq("id", b.id)

  refresh(handle)
}

export async function saveGeoRules(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const raw = String(formData.get("geo_rules") || "")
  const rules: { countries: string[]; url: string }[] = []
  for (const line of raw.split(NL)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const countries = trimmed
      .slice(0, eq)
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0)
    const url = trimmed.slice(eq + 1).trim()
    if (countries.length === 0 || !url) continue
    rules.push({ countries, url })
  }
  await supabaseAdmin.from("links").update({ geo_rules: rules }).eq("id", id)
  refresh(handle)
}

export async function saveRotation(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const id = String(formData.get("id") || "")
  const rotate = formData.get("rotate") === "on"
  const raw = String(formData.get("rotation_urls") || "")
  const urls = raw
    .split(NL)
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
  await supabaseAdmin.from("links").update({ rotate, rotation_urls: urls }).eq("id", id)
  refresh(handle)
}

export async function saveBlockedCountries(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  const raw = String(formData.get("blocked_countries") || "")
  const redirectUrl = String(formData.get("blocked_redirect_url") || "").trim()
  const countries = raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0)
  await supabaseAdmin
    .from("creators")
    .update({ blocked_countries: countries, blocked_redirect_url: redirectUrl || null })
    .eq("handle", handle)
  refresh(handle)
}
