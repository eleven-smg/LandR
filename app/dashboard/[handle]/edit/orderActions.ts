"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { normalizeOrder } from "@/lib/sections"
import { clampPercent, clampZoom } from "@/lib/templates"

function refresh(handle: string) {
  revalidatePath("/" + handle)
  revalidatePath("/dashboard/" + handle + "/edit")
}

/**
 * The old reorder saved one swap per page reload, so a second tap landed before
 * the first had finished and the section overshot. The whole order is now sent
 * once, after the list has already moved on screen.
 */
export async function saveSectionOrder(handle: string, order: string[]) {
  if (!handle) return
  const clean = normalizeOrder(order.join(","))
  await supabaseAdmin.from("creators").update({ section_order: clean.join(",") }).eq("handle", handle)
  refresh(handle)
}

/** Same tap-to-crop framing as the background, applied to the profile photo. */
export async function saveAvatarFocus(formData: FormData) {
  const handle = String(formData.get("handle") || "")
  if (!handle) return
  await supabaseAdmin
    .from("creators")
    .update({
      photo_pos_x: clampPercent(formData.get("photo_pos_x"), 50),
      photo_pos_y: clampPercent(formData.get("photo_pos_y"), 50),
      photo_zoom: clampZoom(formData.get("photo_zoom")),
    })
    .eq("handle", handle)
  refresh(handle)
}
