"use client"

import { useActionState } from "react"
import { subscribe, type SubscribeState } from "../dashboard/[handle]/edit/actions"

export default function SubscribeForm({
  handle,
  title,
  note,
}: {
  handle: string
  title: string
  note: string
}) {
  const [state, formAction, pending] = useActionState<SubscribeState, FormData>(subscribe, {})

  if (state.ok) {
    return (
      <div className="mt-8 w-full rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
        <p className="text-[15px] font-semibold text-emerald-200">You&rsquo;re on the list &#10003;</p>
        <p className="mt-1 text-sm text-emerald-200/70">Thanks &mdash; I&rsquo;ll be in touch.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-center text-[15px] font-semibold text-white">{title}</p>
      {note ? <p className="mt-1 text-center text-sm text-white/55">{note}</p> : null}
      <input type="hidden" name="handle" value={handle} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="flex-1 rounded-full border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white placeholder-white/35 outline-none focus:border-white/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-black transition hover:brightness-90 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Notify me"}
        </button>
      </div>
      {state.error ? <p className="mt-2 text-center text-sm text-red-300">{state.error}</p> : null}
      <p className="mt-3 text-center text-[11px] text-white/30">No spam. Unsubscribe anytime.</p>
    </form>
  )
}
