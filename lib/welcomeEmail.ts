import { headers } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { unsubscribePath } from "@/lib/unsubscribe"
import { WELCOME_DEFAULTS, fillTemplate } from "@/lib/welcomeCopy"

/**
 * The welcome email: one message, from the page owner, to each new subscriber.
 *
 * Nothing here logs into a mailbox and nothing here asks for a mail password.
 * Mail is handed to a sending service over HTTPS using a key that sits on the
 * server, and the service delivers it as the owner's own address. Replies go to
 * the normal inbox; this site never reads them.
 *
 * Until that key exists the whole file is inert. Three guards, in this order,
 * and each one is a full stop:
 *   1. welcome_email_enabled is off  -- the switch, and it is off by default.
 *   2. no provider key on the server -- nothing to send with.
 *   3. no from address on the page   -- nothing to send as.
 *
 * Every outcome is written to email_sends, the skips included, so "was this
 * person mailed, and if not why not" is always answerable from the table
 * instead of from memory.
 */

const NL = String.fromCharCode(10)
const ENDPOINT = "https://api.resend.com/emails"

export type WelcomeEmailSettings = {
  welcome_email_enabled?: boolean | null
  welcome_email_from?: string | null
  welcome_email_reply_to?: string | null
  welcome_email_subject?: string | null
  welcome_email_body?: string | null
}

export type WelcomeSendStatus = "sent" | "skipped" | "failed"
export type WelcomeSendResult = { status: WelcomeSendStatus; detail: string }

/** True only when a sending key is present on this server. */
export function emailProviderReady(): boolean {
  return String(process.env.RESEND_API_KEY || "").trim().length > 0
}

/**
 * The public origin of this deployment, taken from the request the subscriber
 * just made, so the unsubscribe link is right on the vercel.app address today
 * and on a custom domain later with nothing to change here.
 */
async function siteOrigin(): Promise<string> {
  try {
    const bag = await headers()
    const host = bag.get("x-forwarded-host") || bag.get("host") || ""
    if (!host) return ""
    const proto = bag.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")
    return proto + "://" + host
  } catch {
    return ""
  }
}

/** Writing the log must never be the thing that breaks a subscription. */
async function record(
  creatorId: string,
  email: string,
  status: WelcomeSendStatus,
  detail: string,
  providerId?: string,
): Promise<void> {
  try {
    await supabaseAdmin.from("email_sends").insert({
      creator_id: creatorId,
      email,
      kind: "welcome",
      status,
      detail,
      provider_id: providerId || null,
    })
  } catch {
    // Deliberately swallowed.
  }
}

export async function sendWelcomeEmail(args: {
  creatorId: string
  handle: string
  email: string
  name?: string | null
  settings: WelcomeEmailSettings
}): Promise<WelcomeSendResult> {
  const { creatorId, handle, settings } = args
  const email = String(args.email || "").trim().toLowerCase()
  if (!creatorId || !email.includes("@")) return { status: "skipped", detail: "no address" }

  // 1. The switch. Anything other than an explicit true is off.
  if (settings.welcome_email_enabled !== true) {
    const detail = "welcome email switched off"
    await record(creatorId, email, "skipped", detail)
    return { status: "skipped", detail }
  }

  // 2. Nothing to send with.
  const key = String(process.env.RESEND_API_KEY || "").trim()
  if (!key) {
    const detail = "no mail provider connected"
    await record(creatorId, email, "skipped", detail)
    return { status: "skipped", detail }
  }

  // 3. Nothing to send as.
  const from = String(settings.welcome_email_from || "").trim()
  if (!from) {
    const detail = "no sender address set"
    await record(creatorId, email, "skipped", detail)
    return { status: "skipped", detail }
  }

  const vars = { name: args.name, handle, email }
  const subject = fillTemplate(String(settings.welcome_email_subject || "") || WELCOME_DEFAULTS.subject, vars)
  const origin = await siteOrigin()
  const link = origin + unsubscribePath(creatorId, email)

  /**
   * The way out is added here rather than left to whoever wrote the message,
   * because a mail with no unsubscribe is what gets a sender blocked, and the
   * reader's only other option is the spam button.
   */
  const body = fillTemplate(String(settings.welcome_email_body || "") || WELCOME_DEFAULTS.body, vars)
  const text = origin ? body + NL + NL + "--" + NL + "Not interested any more? Unsubscribe: " + link : body

  const replyTo = String(settings.welcome_email_reply_to || "").trim()

  const payload: Record<string, unknown> = { from, to: [email], subject, text }
  if (replyTo) payload.reply_to = replyTo

  /**
   * List-Unsubscribe only, never List-Unsubscribe-Post. One-click means the
   * mail app POSTs that link by itself, and /unsubscribe deliberately asks with
   * a button instead of acting on a request no person was seen to make.
   * Promising one-click with nothing behind it reads as a broken unsubscribe,
   * which is worse than not promising it.
   */
  if (origin) payload.headers = { "List-Unsubscribe": "<" + link + ">" }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const raw = await res.text()

    if (!res.ok) {
      const detail = "provider said " + res.status + ": " + raw.slice(0, 300)
      await record(creatorId, email, "failed", detail)
      return { status: "failed", detail }
    }

    let providerId = ""
    try {
      const parsed = JSON.parse(raw) as { id?: string }
      providerId = String(parsed.id || "")
    } catch {
      providerId = ""
    }

    await record(creatorId, email, "sent", "accepted by provider", providerId)
    return { status: "sent", detail: providerId }
  } catch (err) {
    const detail = String(err).slice(0, 300)
    await record(creatorId, email, "failed", detail)
    return { status: "failed", detail }
  }
}
