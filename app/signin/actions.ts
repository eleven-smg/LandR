"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { SESSION_COOKIE } from "@/lib/session"
import { likeSafeHandle } from "@/lib/handles"

const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function signIn(formData: FormData) {
  // A model created by a creator has a username and no email, so the one field
  // accepts either. "email" is still read as a fallback for any cached form.
  const identifier = String(formData.get("identifier") || formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const next = String(formData.get("next") || "")

  if (!identifier || !password) redirect("/signin?error=1")

  const column = identifier.includes("@") ? "email" : "username"

  // likeSafeHandle escapes % and _ so a typed wildcard cannot widen the match.
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, password")
    .ilike(column, likeSafeHandle(identifier))
    .limit(2)

  const rows = data || []

  // Exactly one match required. Historic rows could share an email because the
  // table had no unique constraint until 26 Sep; an ambiguous login is refused
  // rather than guessed.
  if (rows.length !== 1) redirect("/signin?error=1")

  const account = rows[0]
  if (String(account.password) !== password) redirect("/signin?error=1")

  const store = await cookies()
  store.set(SESSION_COOKIE, String(account.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  })

  if (next.startsWith("/dashboard")) redirect(next)

  // /dashboard decides where to go: straight into the only page, or the home
  // list for a creator managing several. It used to fall back to the first row
  // in the whole creators table, which dropped an account with no page of its
  // own onto somebody else's dashboard.
  redirect("/dashboard")
}

export async function signOut() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/signin")
}
