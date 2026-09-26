import { headers } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// Two windows on purpose. One number cannot stop both a burst (a script
// hammering the form) and a slow drip (a handful an hour, all day). A real
// person creating their own page trips neither.
export const SIGNUPS_PER_HOUR = 3
export const SIGNUPS_PER_DAY = 8

/**
 * The caller's IP as the platform reports it. `x-forwarded-for` is a list with
 * the client first and the proxies after it, so only the first entry is the
 * caller.
 *
 * This is a rate-limit bucket key and nothing more: a header is trivially
 * spoofable, so it must never be used for authorization. Callers behind a
 * shared NAT share a bucket, which is why the limits are generous.
 */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  const first = forwarded ? forwarded.split(",")[0].trim() : ""
  const ip = (first || h.get("x-real-ip") || "").slice(0, 64)
  return ip || "unknown"
}

export type SignupLimit = { allowed: boolean; ip: string }

/**
 * Counts this IP's completed signups in the last day, then checks both windows
 * against that one read.
 *
 * A read error deliberately **allows** the signup. The limit exists to slow
 * abuse down, and a database blip must not lock real people out of registering
 * altogether — but it is logged loudly, because a silently disabled limit is
 * the same as no limit.
 */
export async function checkSignupLimit(): Promise<SignupLimit> {
  const ip = await clientIp()
  if (ip === "unknown") return { allowed: true, ip }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from("signup_log")
    .select("created_at")
    .eq("ip", ip)
    .gte("created_at", dayAgo)
    .order("created_at", { ascending: false })
    .limit(SIGNUPS_PER_DAY + 1)

  if (error) {
    console.error("[signup] rate-limit read failed:", error.code, error.message)
    return { allowed: true, ip }
  }

  const rows = data || []
  if (rows.length >= SIGNUPS_PER_DAY) return { allowed: false, ip }

  const hourAgo = Date.now() - 60 * 60 * 1000
  const lastHour = rows.filter((row) => {
    const at = new Date(String(row.created_at)).getTime()
    return Number.isFinite(at) && at >= hourAgo
  })

  return { allowed: lastHour.length < SIGNUPS_PER_HOUR, ip }
}

/**
 * One row per account actually created. Called after the account and the page
 * exist, so a failed or abandoned attempt never counts against the visitor.
 * A write failure is logged and swallowed: the signup itself succeeded, and
 * refusing it now would be worse than losing one counter row.
 */
export async function recordSignup(ip: string, handle: string) {
  if (ip === "unknown") return
  const { error } = await supabaseAdmin.from("signup_log").insert({ ip, handle })
  if (error) {
    console.error("[signup] signup_log insert failed:", error.code, error.message)
  }
}
