"use client"

import { useState, type DragEvent } from "react"

type Item = { id: string; label: string; size: string }
type SavePayload = { id: string; size: string }

const HEIGHTS: Record<string, string> = { sm: "h-10", md: "h-14", lg: "h-20" }
const SIZES = ["sm", "md", "lg"]

export default function Builder({
  handle,
  items: initial,
  onSave,
}: {
  handle: string
  items: Item[]
  onSave: (handle: string, items: SavePayload[]) => Promise<void>
}) {
  const [items, setItems] = useState<Item[]>(initial)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)

  function handleDragStart(i: number) {
    setDragIndex(i)
    setSaved(false)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, i: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    setItems((prev) => {
      const next = prev.slice()
      const moved = next.splice(dragIndex, 1)[0]
      next.splice(i, 0, moved)
      return next
    })
    setDragIndex(i)
  }

  function handleDrop() {
    setDragIndex(null)
  }

  function move(i: number, dir: "up" | "down") {
    const j = dir === "up" ? i - 1 : i + 1
    if (j < 0 || j >= items.length) return
    setItems((prev) => {
      const next = prev.slice()
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      return next
    })
    setSaved(false)
  }

  function setSize(i: number, size: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, size } : it)))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setFailed(false)
    try {
      await onSave(
        handle,
        items.map((it) => ({ id: it.id, size: it.size })),
      )
      setSaved(true)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2">
      <div className="mx-auto w-full max-w-[320px] rounded-3xl border border-white/10 bg-black/40 p-3">
        {items.map((it, i) => (
          <div
            key={it.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={handleDrop}
            className={
              "mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 " +
              (HEIGHTS[it.size] || HEIGHTS.md) +
              (dragIndex === i ? " opacity-60 ring-1 ring-indigo-400" : "")
            }
          >
            <span className="cursor-grab select-none text-lg leading-none text-white/40" title="Drag to reorder">
              &#8942;&#8942;
            </span>
            <span className="flex-1 truncate text-sm text-white">{it.label || "(untitled)"}</span>
            <div className="flex items-center gap-1">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(i, s)}
                  className={
                    "rounded px-2 py-1 text-xs font-semibold " +
                    (it.size === s ? "bg-indigo-500 text-white" : "bg-white/10 text-white/60")
                  }
                >
                  {s.charAt(0).toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => move(i, "up")}
                className="rounded bg-white/10 px-2 py-1 text-xs text-white/60"
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={() => move(i, "down")}
                className="rounded bg-white/10 px-2 py-1 text-xs text-white/60"
              >
                &darr;
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="p-4 text-center text-sm text-white/40">No links yet.</p> : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || items.length === 0}
          className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save layout"}
        </button>
        {saved ? <span className="text-sm text-emerald-400">&#10003; Layout saved</span> : null}
        {failed ? <span className="text-sm text-red-400">Could not save. Try again.</span> : null}
      </div>
    </div>
  )
}
