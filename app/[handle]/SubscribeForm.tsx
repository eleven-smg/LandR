"use client"

import { useActionState, useState } from "react"
import { subscribe, type SubscribeState } from "../dashboard/[handle]/edit/actions"

type Props = {
  handle: string
  title: string
  note: string
  style: string
  buttonText: string
  askName: boolean
  avatar: string
}

const field =
  "w-full rounded-full border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white placeholder-white/35 outline-none focus:border-white/40"
const submit =
  "rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-black transition hover:brightness-90 active:scale-95 disabled:opacity-50"

export default function SubscribeForm({ handle, title, note, style, buttonText, askName, avatar }: Props) {
  const [state, formAction, pending] = useActionState<SubscribeState, FormData>(subscribe, {})
  const [open, setOpen] = useState(false)
  const label = buttonText || (style === "pill" ? "Subscribe" : "Notify me")

  const done = (
    <div className="w-full rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
      <p className="text-[15px] font-semibold text-emerald-200">You&rsquo;re on the list &#10003;</p>
      <p className="mt-1 text-sm text-emerald-200/70">Thanks &mdash; I&rsquo;ll be in touch.</p>
    </div>
  )

  const inputs = (
    <>
      <input type="hidden" name="handle" value={handle} />
      {askName ? <input name="name" autoComplete="given-name" placeholder="First name" className={field} /> : null}
      <input name="email" type="email" required autoComplete="email" placeholder="Email" className={field} />
      <button type="submit" disabled={pending} className={submit + " w-full"}>
        {pending ? "Adding..." : label}
      </button>
      {state.error ? <p className="text-center text-sm text-red-300">{state.error}</p> : null}
    </>
  )

  if (style === "pill") {
    return (
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 active:scale-95"
        >
          <span aria-hidden="true">&#9788;</span>
          {label}
        </button>

        {open ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-5">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center text-black">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 text-xl leading-none text-black/40 transition hover:text-black"
              >
                &#215;
              </button>
              {avatar ? (
                <img src={avatar} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
              ) : null}
              <p className="mt-3 text-base font-bold">{title}</p>
              {note ? <p className="mt-1 text-sm text-black/60">{note}</p> : null}
              {state.ok ? (
                <p className="mt-5 text-[15px] font-semibold text-emerald-600">You&rsquo;re on the list &#10003;</p>
              ) : (
                <form action={formAction} className="mt-5 flex flex-col gap-3 text-left">
                  <input type="hidden" name="handle" value={handle} />
                  {askName ? (
                    <input
                      name="name"
                      autoComplete="given-name"
                      placeholder="First name"
                      className="w-full rounded-full border border-black/15 px-4 py-3 text-[15px] outline-none focus:border-black/50"
                    />
                  ) : null}
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email"
                    className="w-full rounded-full border border-black/15 px-4 py-3 text-[15px] outline-none focus:border-black/50"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-full bg-black px-5 py-3 text-[15px] font-semibold text-white transition hover:brightness-125 active:scale-95 disabled:opacity-50"
                  >
                    {pending ? "Adding..." : label}
                  </button>
                  {state.error ? <p className="text-center text-sm text-red-500">{state.error}</p> : null}
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  if (style === "bar") {
    if (state.ok) return <div className="mt-6 w-full">{done}</div>
    return (
      <form action={formAction} className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
        <input type="hidden" name="handle" value={handle} />
        {askName ? <input name="name" placeholder="First name" className={field + " sm:w-32"} /> : null}
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className={field} />
        <button type="submit" disabled={pending} className={submit}>
          {pending ? "..." : label}
        </button>
        {state.error ? <p className="text-center text-sm text-red-300">{state.error}</p> : null}
      </form>
    )
  }

  if (state.ok) return <div className="mt-8 w-full">{done}</div>

  return (
    <form action={formAction} className="mt-8 flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-center text-[15px] font-semibold text-white">{title}</p>
      {note ? <p className="-mt-2 text-center text-sm text-white/55">{note}</p> : null}
      {inputs}
      <p className="text-center text-[11px] text-white/30">No spam. Unsubscribe anytime.</p>
    </form>
  )
}
