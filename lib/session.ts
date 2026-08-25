import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const SESSION_COOKIE = "landr_session"

export type Account = {
  id: string
  email: string
  name: string | null
  role: string
}

export async function getSession(): Promise<Account | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)
  if (!raw || !raw.value) return null

  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, email, name, role")
    .eq("id", raw.value)
    .single()

  if (!data) return null
  return {
    id: String(data.id),
    email: String(data.email),
    name: data.name ? String(data.name) : null,
    role: String(data.role || "model"),
  }
}

export async function isAdmin(): Promise<boolean> {
  const account = await getSession()
  return !!account && account.role === "admin"
}
