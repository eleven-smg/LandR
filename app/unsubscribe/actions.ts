"use server"

import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { verifyUnsubscribe } from "@/lib/unsubscribe"

/**
 * Open on purpose, like `subscribe()`: the person leaving a mailing list has no
 * account and must never be asked to sign in. The signature in the token is the
 * authorization, and it names both the page and the address, so this can only
 * ever touch the one row the link was written for.
 */
export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("t") || "")
  const claim = verifyUnsubscribe(token)
  const back = "/unsubscribe?t=" + encodeURIComponent(token)

  if (!claim) redirect(back + "&state=invalid")

  // `is("unsubscribed_at", null)` keeps the original date: a second tap on an
  // old link must not rewrite when the person actually left.
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString(), wants_updates: false })
    .eq("creator_id", claim.creatorId)
    .eq("email", claim.email)
    .is("unsubscribed_at", null)

  if (error) redirect(back + "&state=error")

  redirect(back + "&state=done")
}
