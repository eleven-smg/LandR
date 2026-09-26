import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import { mailboxFor } from "@/lib/mailboxes"

export const dynamic = "force-dynamic"

/**
 * Where "yes, keep me updated" lands. The whole point of this screen is that
 * the instructions are for the provider the subscriber actually uses, so it is
 * four taps and not a wall of advice about mail clients they have never opened.
 *
 * The mailbox comes in as ?mb=gmail.com -- the domain only, never the address,
 * so a shared or logged link cannot leak who subscribed.
 *
 * No session: a subscriber is not signed in, and nothing here reads subscriber
 * data. It only renders the creator's own sending address, which is public by
 * definition once she mails anyone.
 */
export default async function WhitelistPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ mb?: string }>
}) {
  const { handle } = await params
  const { mb } = await searchParams

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("handle, display_name, whitelist_from_email, whitelist_from_name")
    .ilike("handle", likeSafeHandle(handle))
    .maybeSingle()

  if (!creator) notFound()

  const fromEmail = String(creator.whitelist_from_email || "")
  const fromName = String(creator.whitelist_from_name || creator.display_name || creator.handle || "")
  const box = mailboxFor(mb || "", fromEmail)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 bg-black px-5 py-12 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">You are on the list</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">Now make sure it reaches you</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          Mail providers hide new senders in Spam or Promotions by default. This takes about twenty seconds and then
          every update from {fromName} arrives in your main inbox.
        </p>
      </div>

      {fromEmail ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/40">My address</p>
          <p className="mt-1 break-all text-[15px] font-semibold">{fromEmail}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-white/80">
          In {box.label}
          {box.id === "other" ? "" : " \u2014 the fastest way"}
        </p>
        <ol className="mt-3 flex flex-col gap-3">
          {box.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-[15px] leading-relaxed text-white/70">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3">
        {box.actionUrl ? (
          <a
            href={box.actionUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white px-5 py-3 text-center text-[15px] font-semibold text-black transition hover:brightness-90 active:scale-95"
          >
            {box.actionLabel}
          </a>
        ) : box.inboxUrl ? (
          <a
            href={box.inboxUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white px-5 py-3 text-center text-[15px] font-semibold text-black transition hover:brightness-90 active:scale-95"
          >
            Open {box.label}
          </a>
        ) : null}

        {fromEmail ? (
          <a
            href={"/" + creator.handle + "/contact.vcf"}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-center text-[15px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
          >
            Save me to your contacts
          </a>
        ) : null}

        <Link
          href={"/" + creator.handle}
          className="px-5 py-2 text-center text-sm font-medium text-white/50 transition hover:text-white"
        >
          Done, take me back
        </Link>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-white/30">
        No spam, and one tap unsubscribes you from any mail I send.
      </p>
    </main>
  )
}
