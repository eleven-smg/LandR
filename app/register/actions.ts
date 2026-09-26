"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { SESSION_COOKIE } from "@/lib/session"
import { likeSafeHandle, normalizeHandle, handleProblem } from "@/lib/handles"

const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function register(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const name = String(formData.get("name") || "").trim()

  // The handle rules live in lib/handles so the register form, the creator's
  // "add a model" form and the reserved-route list cannot drift apart.
  const handle = normalizeHandle(String(formData.get("handle") || ""))

  if (!email || !password || !handle) redirect("/register?error=missing")
  if (password.length < 6) redirect("/register?error=short")
  if (handleProblem(handle)) redirect("/register?error=handle")

  const { data: takenHandle } = await supabaseAdmin
    .from("creators")
    .select("id")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
  if (takenHandle && takenHandle.length > 0) redirect("/register?error=handle")

  const { data: takenEmail } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .ilike("email", likeSafeHandle(email))
    .limit(1)
  if (takenEmail && takenEmail.length > 0) redirect("/register?error=email")

  const { data: account, error: accountError } = await supabaseAdmin
    .from("accounts")
    .insert({ email, password, name: name || null, role: "model" })
    .select("id")
    .single()

  if (accountError || !account) redirect("/register?error=failed")

  const { error: pageError } = await supabaseAdmin.from("creators").insert({
    handle,
    display_name: name || handle,
    account_id: account.id,
    theme: "noir",
    template: "classic",
    background_type: "theme",
    show_active_badge: true,
    active_text: "Active now",
    show_subscribe: true,
    subscribe_title: "Get my updates",
    subscribe_note: "New links and drops, straight to your inbox.",
    section_order: "header,socials,buttons,subscribe,videos,embeds",
  })

  if (pageError) {
    await supabaseAdmin.from("accounts").delete().eq("id", account.id)
    redirect("/register?error=failed")
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, String(account.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  })

  redirect("/dashboard/" + handle + "/edit")
}
