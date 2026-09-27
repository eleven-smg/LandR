import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Signed unsubscribe links, so one link in one mail can take one person off one
 * page's list and nothing else.
 *
 * The token carries the creator id and the address, signed with a key that only
 * the server has. That means no lookup table and no extra column: a link is
 * valid because the signature proves the server wrote it, and changing a single
 * character of the address invalidates it. Anybody can still read the address
 * out of the token -- it is signed, not encrypted -- which is fine, because the
 * person holding the link is the person whose address it is.
 *
 * Deliberately **no expiry**. A mail sent today may be opened in a year, and an
 * unsubscribe link that has quietly stopped working is worse than none at all:
 * the reader's only remaining option is the spam button, which damages the
 * sending domain for every other subscriber.
 *
 * The key is the service role key, which is already in the environment on
 * Vercel, so this needs nothing new from the client. It never leaves the
 * server: only the digest is put in a URL.
 */

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function digest(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url")
}

export function cleanAddress(raw: string | null | undefined): string {
  return String(raw || "").trim().toLowerCase()
}

export function signUnsubscribe(creatorId: string, email: string): string {
  const payload = encode(String(creatorId || "") + ":" + cleanAddress(email))
  return payload + "." + digest(payload)
}

/** Null for anything that was not signed by this server, for any reason. */
export function verifyUnsubscribe(token: string | null | undefined): { creatorId: string; email: string } | null {
  if (!SECRET) return null

  const raw = String(token || "").trim()
  const dot = raw.indexOf(".")
  if (dot < 1 || dot === raw.length - 1) return null

  const payload = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  const expected = digest(payload)

  // timingSafeEqual throws on a length mismatch, so the lengths are compared
  // first and only equal-length buffers reach it.
  if (signature.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  let decoded = ""
  try {
    decoded = Buffer.from(payload, "base64url").toString("utf8")
  } catch {
    return null
  }

  const split = decoded.indexOf(":")
  if (split < 1) return null

  const creatorId = decoded.slice(0, split)
  const email = decoded.slice(split + 1)
  if (!creatorId || !email.includes("@")) return null

  return { creatorId, email }
}

/** The path to put in a mail. Prefix it with the site origin when sending. */
export function unsubscribePath(creatorId: string, email: string): string {
  return "/unsubscribe?t=" + encodeURIComponent(signUnsubscribe(creatorId, email))
}
