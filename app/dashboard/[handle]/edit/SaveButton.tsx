"use client"

import { useContext } from "react"
import type { CSSProperties } from "react"
import { useFormStatus } from "react-dom"
import { FormPhaseContext } from "./ActionForm"

type Variant = "primary" | "ghost" | "danger"

const base: CSSProperties = {
  border: "1px solid transparent",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  transition: "filter .15s, transform .1s, background .15s, border-color .15s",
}
const styles: Record<Variant, CSSProperties> = {
  primary: { ...base, padding: "9px 14px", background: "#5b7fff", color: "#fff", marginTop: 10 },
  ghost: { ...base, padding: "6px 10px", background: "#232940", color: "#cdd6f4", fontWeight: 500 },
  danger: { ...base, padding: "6px 10px", background: "#232940", color: "#ff8080", fontWeight: 500 },
}

export default function SaveButton({
  label,
  variant = "primary",
  confirm,
}: {
  label: string
  variant?: Variant
  confirm?: string
}) {
  const phase = useContext(FormPhaseContext)
  const native = useFormStatus()
  const pending = phase.pending || native.pending

  let text = label
  let extra: CSSProperties = {}

  if (pending) {
    text = "Saving..."
    extra = { opacity: 0.65, cursor: "progress" }
  } else if (phase.dirty) {
    text = label + " \u2022 unsaved"
    extra = { background: "#5b7fff", color: "#fff", borderColor: "#9ab0ff" }
  } else if (phase.saved) {
    text = "Saved \u2713"
    extra = { background: "#166534", color: "#d1fae5" }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{ ...styles[variant], ...extra }}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault()
      }}
    >
      {text}
    </button>
  )
}
