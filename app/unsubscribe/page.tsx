import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { verifyUnsubscribe } from "@/lib/unsubscribe"
import { confirmUnsubscribe } from "./actions"

export const dynamic = "force-dynamic"

export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } }

const shell = "flex min-h-screen items-center justify-center bg-black px-5 py-16 text-white"
const card = "w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 text-center"

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className={shell}>
      <div className={card}>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
      </div>
    </main>
  )
}

/**
 * One page, three states: confirm, done, or a link that does not check out.
 *
 * It asks before acting rather than unsubscribing on load. Security scanners,
 * link previewers and corporate mail gateways fetch every URL in a message, and
 * a link that acts on a GET would take people off the list who never touched
 * it. One tap is still one tap.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = searchParams ? await searchParams : {}
  const token = String(query.t || "")
  const state = String(query.state || "")
  const claim = verifyUnsubscribe(token)

  if (!claim) {
    return (
      <Message
        title="This link is not valid"
        body="It may have been cut short by your email app. Reply to the message you received and you will be taken off the list by hand."
      />
    )
  }

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("display_name, handle")
    .eq("id", claim.creatorId)
    .maybeSingle()

  const from = String(creator?.display_name || creator?.handle || "this page")

  if (state === "done") {
    return (
      <Message
        title="You are unsubscribed"
        body={"No more emails from " + from + " will be sent to " + claim.email + ". Nothing else to do."}
      />
    )
  }

  if (state === "error") {
    return (
      <Message
        title="That did not go through"
        body="Something went wrong on our side and you are still on the list. Please try the link again in a moment."
      />
    )
  }

  const { data: row } = await supabaseAdmin
    .from("subscribers")
    .select("unsubscribed_at")
    .eq("creator_id", claim.creatorId)
    .eq("email", claim.email)
    .maybeSingle()

  // Not on the list, or already gone: say so instead of offering a button that
  // would do nothing.
  if (!row) {
    return (
      <Message
        title="Nothing to unsubscribe"
        body={claim.email + " is not on the list for " + from + ". You will not be emailed."}
      />
    )
  }

  if (row.unsubscribed_at) {
    return (
      <Message
        title="Already unsubscribed"
        body={claim.email + " was taken off the list for " + from + " and no more emails will be sent."}
      />
    )
  }

  return (
    <main className={shell}>
      <div className={card}>
        <h1 className="text-lg font-semibold">Unsubscribe?</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {"This takes "}
          <span className="text-white">{claim.email}</span>
          {" off the email list for "}
          <span className="text-white">{from}</span>
          {". You can subscribe again any time from the page."}
        </p>
        <form action={confirmUnsubscribe} className="mt-6">
          <input type="hidden" name="t" value={token} />
          <button
            type="submit"
            className="w-full rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-black transition hover:brightness-90 active:scale-95"
          >
            Unsubscribe me
          </button>
        </form>
        <p className="mt-4 text-xs text-white/30">powered by LandR</p>
      </div>
    </main>
  )
}
