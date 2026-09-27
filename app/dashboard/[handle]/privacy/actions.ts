"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"

function text(formData: FormData, field: string): string {
  return String(formData.get(field) || "").trim()
}

function checked(formData: FormData, field: string): boolean {
  const raw = String(formData.get(field) || "")
  return raw === "on" || raw === "true" || raw === "1"
}

/**
 * Only http(s) links are accepted, and a bare domain gets https:// put in
 * front, so a typo cannot turn the policy link into a javascript: url.
 */
function safeUrl(raw: string): string {
  if (!raw) return ""
  const lower = raw.toLowerCase()
  const candidate =
    lower.startsWith("http://") || lower.startsWith("https://") ? raw : "https://" + raw
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return ""
    return parsed.toString()
  } catch {
    return ""
  }
}

export async function saveConsent(formData: FormData) {
  // The handle comes from the form, but access is decided here and the creator
  // id used for the write comes back from the gate -- never from the client.
  const access = await requireDashboardAccess(text(formData, "handle"))
  if (!access) return

  const body = text(formData, "consent_banner_text").slice(0, 400)
  const privacy = safeUrl(text(formData, "consent_privacy_url"))

  await supabaseAdmin
    .from("creators")
    .update({
      consent_banner_enabled: checked(formData, "consent_banner_enabled"),
      consent_banner_text: body || null,
      consent_privacy_url: privacy || null,
    })
    .eq("id", access.creator.id)

  revalidatePath("/dashboard/" + access.creator.handle + "/privacy")
  revalidatePath("/" + access.creator.handle)
}
