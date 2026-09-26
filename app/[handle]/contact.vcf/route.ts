import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"

export const dynamic = "force-dynamic"

/**
 * A contact card for the sending address. Saving the sender to contacts is the
 * one trust signal every mail provider honours, and on a phone this downloads
 * and opens in the contacts app in a single tap -- far more likely to actually
 * happen than "go into settings and add a filter".
 *
 * 404 when no sending address is configured yet: a contact card with no email
 * on it would be a card that does nothing, which is worse than no button.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("handle, display_name, whitelist_from_email, whitelist_from_name")
    .ilike("handle", likeSafeHandle(handle))
    .maybeSingle()

  const email = String(creator?.whitelist_from_email || "").trim()
  if (!creator || !email) return new Response("Not found", { status: 404 })

  const name = String(creator.whitelist_from_name || creator.display_name || creator.handle || "").trim()
  const safeName = name.split("\r").join(" ").split("\n").join(" ")

  const card = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "FN:" + safeName,
    "N:" + safeName + ";;;;",
    "EMAIL;TYPE=INTERNET;TYPE=PREF:" + email,
    "NOTE:Newsletter sender. Keep in contacts so updates reach your inbox.",
    "END:VCARD",
  ].join("\r\n")

  return new Response(card, {
    headers: {
      "content-type": "text/vcard; charset=utf-8",
      "content-disposition": "attachment; filename=\"" + creator.handle + ".vcf\"",
      "cache-control": "no-store",
    },
  })
}
