"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { normalizeOrder } from "@/lib/sections"
import { clampPercent, clampZoom } from "@/lib/templates"
import { requireDashboardAccess } from "@/lib/session"

function refresh(handle: string) {
  revalidatePath("/" + handle)
  revalidatePath("/dashboard/" + handle + "/edit")
}

/**
 * The old reorder saved one swap per page reload, so a second tap landed before
 * the first had finished and the section overshot. The whole order is now sent
 * once, after the list has already moved on screen.
 *
 * The handle arrives from the browser, so it proves nothing on its own: the
 * signed-in account has to own it before anything is written.
 */
export async function saveSectionOrder(handle: string, order: string[]) {
  const access = await requireDashboardAccess(handle)
  if (!access) return

  const clean = normalizeOrder(order.join(","))
  await supabaseAdmin
    .from("creators")
    .update({ section_order: clean.join(",") })
    .eq("id", access.creator.id)
  refresh(access.creator.handle)
}

/** Same tap-to-crop framing as the background, applied to the profile photo. */
export async function saveAvatarFocus(formData: FormData) {
  const access = await requireDashboardAccess(String(formData.get("handle") || ""))
  if (!access) return

  await supabaseAdmin
    .from("creators")
    .update({
      photo_pos_x: clampPercent(formData.get("photo_pos_x"), 50),
      photo_pos_y: clampPercent(formData.get("photo_pos_y"), 50),
      photo_zoom: clampZoom(formData.get("photo_zoom")),
    })
    .eq("id", access.creator.id)
  refresh(access.creator.handle)
}
