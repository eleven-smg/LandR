/**
 * Section metadata for public page ordering.
 *
 * This lives outside the server actions file on purpose: a "use server" module
 * is only allowed to export async functions, so plain constants and helpers
 * must sit in a normal module or the build fails.
 */
export const SECTION_KEYS = ["header", "socials", "buttons", "subscribe", "videos", "embeds"]

export const SECTION_LABELS: Record<string, string> = {
  header: "Profile photo, name, tagline, bio",
  socials: "Social icon row",
  buttons: "Link buttons",
  subscribe: "Email subscribe box",
  videos: "Uploaded videos",
  embeds: "Embeds (TikTok, YouTube, X, Telegram)",
}

/** Keeps only known sections, in the saved order, then appends anything missing. */
export function normalizeOrder(raw: unknown): string[] {
  const parts = String(raw || "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => SECTION_KEYS.includes(p))
  const order: string[] = []
  parts.forEach((p) => {
    if (!order.includes(p)) order.push(p)
  })
  SECTION_KEYS.forEach((k) => {
    if (!order.includes(k)) order.push(k)
  })
  return order
}
