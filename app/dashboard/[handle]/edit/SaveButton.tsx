"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useFormStatus } from "react-dom"

type Variant = "primary" | "ghost" | "danger"

const base: CSSProperties = {
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  transition: "filter .15s, transform .1s",
}
const styles: Record<Variant, CSSProperties> = {
  primary: { ...base, padding: "9px 14px", background: "#5b7fff", color: "#fff", marginTop: 10 },
  ghost: { ...base, padding: "6px 10px", background: "#232940", color: "#cdd6f4", fontWeight: 500 },
  danger: { ...base, padding: "6px 10px", background: "#232940", color: "#ff8080", fontWeight: 500 },
}
const savedStyle: CSSProperties = { background: "#166534", color: "#d1fae5" }
const pendingStyle: CSSProperties = { opacity: 0.65, cursor: "progress" }

/**
 * Every form in the editor used to submit silently, so there was no way to tell
 * a successful save from a mis-tap. This button reports its own state: it goes
 * to "Saving..." while the server action runs, then flashes "Saved".
 */
export default function SaveButton({
  label,
  variant = "primary",
  confirm,
}: {
  label: string
  variant?: Variant
  confirm?: string
}) {
  const { pending } = useFormStatus()
  const [saved, setSaved] = useState(false)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      wasPending.current = pending
      setSaved(true)
      const timer = window.setTimeout(() => setSaved(false), 2500)
      return () => window.clearTimeout(timer)
    }
    wasPending.current = pending
  }, [pending])

  const style: CSSProperties = {
    ...styles[variant],
    ...(pending ? pendingStyle : null),
    ...(saved && !pending ? savedStyle : null),
  }

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={style}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault()
      }}
    >
      {pending ? "Saving..." : saved ? "Saved \u2713" : label}
    </button>
  )
}
