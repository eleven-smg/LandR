"use client"

import { useRef, useState, useTransition } from "react"
import type { CSSProperties } from "react"
import { beginTask, endTask } from "@/lib/progress"

const ROW_HEIGHT = 44

const row: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  height: ROW_HEIGHT,
  borderTop: "1px solid #232940",
  userSelect: "none",
}
const handleStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: "#232940",
  color: "#9aa4c2",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "grab",
  touchAction: "none",
  flexShrink: 0,
  fontSize: 13,
}
const num: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: "#232940",
  color: "#9aa4c2",
  fontSize: 11,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}
const nameStyle: CSSProperties = { flex: 1, fontSize: 13, minWidth: 90 }
const arrow: CSSProperties = {
  padding: "5px 9px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
}
const status: CSSProperties = { fontSize: 12, marginTop: 10, minHeight: 16 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 12, marginTop: 4 }

/**
 * Reordering used to be one page reload per tap, so tapping the arrow twice in a
 * row moved the section further than intended. The list now reorders instantly
 * on screen, can be dragged with a finger or a mouse, and the whole order is
 * saved once, shortly after you stop.
 */
export default function SectionOrder({
  handle,
  initial,
  labels,
  action,
}: {
  handle: string
  initial: string[]
  labels: Record<string, string>
  action: (handle: string, order: string[]) => Promise<void>
}) {
  const [order, setOrder] = useState<string[]>(initial)
  const [dragging, setDragging] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const saveTimer = useRef<number | null>(null)
  const drag = useRef<{ index: number; y: number } | null>(null)

  function scheduleSave(next: string[]) {
    setSaved(false)
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      beginTask()
      startTransition(async () => {
        try {
          await action(handle, next)
        } finally {
          endTask()
        }
        setSaved(true)
        window.setTimeout(() => setSaved(false), 3000)
      })
    }, 600)
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return
    const next = order.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setOrder(next)
    scheduleSave(next)
  }

  function onPointerDown(event: React.PointerEvent<HTMLSpanElement>, index: number) {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { index, y: event.clientY }
    setDragging(order[index])
  }

  function onPointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    const state = drag.current
    if (!state) return
    const steps = Math.round((event.clientY - state.y) / ROW_HEIGHT)
    if (steps === 0) return
    const target = Math.min(order.length - 1, Math.max(0, state.index + steps))
    if (target === state.index) return
    move(state.index, target)
    drag.current = { index: target, y: event.clientY }
  }

  function onPointerUp() {
    drag.current = null
    setDragging(null)
  }

  return (
    <div>
      <p style={hint}>
        Drag the grip, or use the arrows. The list moves straight away and saves itself a moment later.
      </p>
      {order.map((key, i) => (
        <div
          key={key}
          style={{
            ...row,
            opacity: dragging === key ? 0.55 : 1,
            background: dragging === key ? "#1d2333" : "transparent",
          }}
        >
          <span
            style={handleStyle}
            onPointerDown={(event) => onPointerDown(event, i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Drag to reorder"
          >
            &#8942;&#8942;
          </span>
          <span style={num}>{i + 1}</span>
          <span style={nameStyle}>{labels[key] || key}</span>
          <button type="button" style={arrow} disabled={i === 0} onClick={() => move(i, i - 1)}>
            &uarr;
          </button>
          <button type="button" style={arrow} disabled={i === order.length - 1} onClick={() => move(i, i + 1)}>
            &darr;
          </button>
        </div>
      ))}
      <div style={{ ...status, color: pending ? "#9aa4c2" : saved ? "#4ade80" : "#6b7396" }}>
        {pending ? "Saving order..." : saved ? "Order saved \u2713" : ""}
      </div>
    </div>
  )
}
