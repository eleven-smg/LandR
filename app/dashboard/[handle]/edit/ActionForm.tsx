"use client"

import { createContext, useEffect, useRef, useState, useTransition } from "react"
import type { CSSProperties, ReactNode } from "react"
import { beginTask, endTask } from "@/lib/progress"

export type FormPhase = { pending: boolean; saved: boolean; dirty: boolean }

export const FormPhaseContext = createContext<FormPhase>({ pending: false, saved: false, dirty: false })

/**
 * Two problems fixed here.
 *
 * 1. A plain <form action={serverAction}> is reset by React once the action
 *    finishes, which put every field back to the value it had when the page was
 *    last rendered. That is why a saved change appeared to jump back until the
 *    page was refreshed. Submitting the action ourselves skips that reset, so
 *    what you typed or picked stays on screen.
 *
 * 2. The button used to say "Saved" forever. Touching any field now marks the
 *    form unsaved again, so "Saved" can never be mistaken for a later edit that
 *    has not been saved.
 */
export default function ActionForm({
  action,
  children,
  style,
  encType,
  resetOnSave,
}: {
  action: (formData: FormData) => Promise<void>
  children: ReactNode
  style?: CSSProperties
  encType?: string
  resetOnSave?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const savedTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current)
    }
  }, [])

  function touched() {
    setDirty(true)
    setSaved(false)
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSaved(false)
    beginTask()
    startTransition(async () => {
      try {
        await action(data)
      } finally {
        endTask()
      }
      setDirty(false)
      setSaved(true)
      if (resetOnSave) form.reset()
      if (savedTimer.current) window.clearTimeout(savedTimer.current)
      savedTimer.current = window.setTimeout(() => setSaved(false), 4000)
    })
  }

  return (
    <form style={style} encType={encType} onSubmit={onSubmit} onInput={touched} onChange={touched}>
      <FormPhaseContext.Provider value={{ pending, saved, dirty }}>{children}</FormPhaseContext.Provider>
    </form>
  )
}
