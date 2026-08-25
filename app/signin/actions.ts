"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { SESSION_COOKIE } from "@/lib/session"

const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") || "")
  const next = String(formData.get("next") || "")

  if (!email || !password) redirect("/signin?error=1")

  const { data } = await supabaseAdmin.from("accounts").select("id, password").ilike("email", email).limit(1)

  const account = data && data.length > 0 ? data[0] : null
  if (!account || String(account.password) !== password) redirect("/signin?error=1")

  const store = await cookies()
  store.set(SESSION_COOKIE, String(account.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  })

  if (next.startsWith("/dashboard")) redirect(next)

  const { data: pages } = await supabaseAdmin
    .from("creators")
    .select("handle")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true })
    .limit(1)

  if (pages && pages.length > 0) redirect("/dashboard/" + String(pages[0].handle))

  const { data: any_page } = await supabaseAdmin
    .from("creators")
    .select("handle")
    .order("created_at", { ascending: true })
    .limit(1)

  redirect(any_page && any_page.length > 0 ? "/dashboard/" + String(any_page[0].handle) : "/signin?error=2")
}

export async function signOut() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/signin")
}
