"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"
import { normalizeDestinations } from "@/lib/collections"
import type { DashboardAccess } from "@/lib/session"

function refresh(handle: string) {
  revalidatePath("/dashboard/" + handle + "/collections")
  revalidatePath("/dashboard/" + handle)
  revalidatePath("/dashboard/" + handle + "/geoblocking")
}

function text(formData: FormData, field: string): string {
  return String(formData.get(field) || "").trim()
}

function checked(formData: FormData, field: string): boolean {
  const raw = String(formData.get(field) || "")
  return raw === "on" || raw === "true" || raw === "1"
}

/**
 * The destination rows arrive as one JSON string in a hidden input, the same
 * pattern the country-rules editor uses, because a variable number of rows with
 * checkboxes does not survive plain form encoding.
 */
function destinationsFrom(formData: FormData) {
  const raw = String(formData.get("destinations") || "")
  if (!raw) return []
  try {
    return normalizeDestinations(JSON.parse(raw))
  } catch {
    return []
  }
}

/**
 * A collection now carries an owner, so it is no longer an admin-only object:
 * anyone can group their own pages. Editing or deleting one requires being its
 * owner, or an admin. Rows created before the owner column exists could not be
 * attributed to anybody, so they stay admin-only rather than becoming
 * everybody's.
 */
async function requireOwnedCollection(
  formData: FormData,
): Promise<{ access: DashboardAccess; id: string } | null> {
  const access = await requireDashboardAccess(text(formData, "handle"))
  if (!access) return null

  const id = text(formData, "id")
  if (!id) return null

  const { data } = await supabaseAdmin
    .from("collections")
    .select("id, owner_account_id")
    .eq("id", id)
    .maybeSingle()

  if (!data) return null

  const owner = data.owner_account_id ? String(data.owner_account_id) : ""
  if (access.account.role === "admin") return { access, id }
  if (owner && owner === access.account.id) return { access, id }
  return null
}

export async function createCollection(formData: FormData) {
  const access = await requireDashboardAccess(text(formData, "handle"))
  if (!access) return

  const name = text(formData, "name")
  if (!name) return

  await supabaseAdmin.from("collections").insert({
    name,
    owner_account_id: access.account.id,
  })
  refresh(access.creator.handle)
}

export async function updateCollection(formData: FormData) {
  const owned = await requireOwnedCollection(formData)
  if (!owned) return

  const name = text(formData, "name")
  if (!name) return

  const countryUrl = text(formData, "redirect_url")
  const takeoverUrl = text(formData, "takeover_url")

  await supabaseAdmin
    .from("collections")
    .update({
      name,
      redirect_url: countryUrl || null,
      // A switch with an empty url would claim to be doing something, so the
      // url is what decides whether the behaviour can be on at all.
      country_redirect_enabled: checked(formData, "country_redirect_enabled") && !!countryUrl,
      takeover_url: takeoverUrl || null,
      takeover_enabled: checked(formData, "takeover_enabled") && !!takeoverUrl,
      destinations: destinationsFrom(formData),
    })
    .eq("id", owned.id)

  refresh(owned.access.creator.handle)
}

export async function deleteCollection(formData: FormData) {
  const owned = await requireOwnedCollection(formData)
  if (!owned) return

  await supabaseAdmin.from("creators").update({ collection_id: null }).eq("collection_id", owned.id)
  await supabaseAdmin.from("collections").delete().eq("id", owned.id)
  refresh(owned.access.creator.handle)
}

export async function setPageCollection(formData: FormData) {
  const access = await requireDashboardAccess(text(formData, "handle"))
  if (!access) return

  const pageId = text(formData, "page_id")
  const collectionId = text(formData, "collection_id")
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

    // And only into a collection they control. Otherwise a page could be filed
    // into somebody else's campaign, which would hand that owner both the
    // page's analytics and the power to redirect its visitors.
    if (collectionId) {
      const { data: collection } = await supabaseAdmin
        .from("collections")
        .select("id")
        .eq("id", collectionId)
        .eq("owner_account_id", access.account.id)
        .maybeSingle()
      if (!collection) return
    }
  }

  await supabaseAdmin
    .from("creators")
    .update({ collection_id: collectionId ? collectionId : null })
    .eq("id", pageId)
  refresh(access.creator.handle)
}
