"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

/**
 * Step 19, the editor side: the two dates that decide when a link is on.
 *
 * Enforcement already exists and is the reason this is only inputs. lib/schedule.ts
 * answers "is this live right now", the public page leaves the button out outside
 * its window, and /go/[id] refuses the redirect and logs no click. Until now the
 * two columns could only be set by hand in the database, which is the same defect
 * class as F22 and F29: a feature the schema claims and nobody can reach.
 *
 * Dates are typed in the browser's own clock, because "9am" means the creator's
 * nine. The columns are timestamptz, so the exact instant has to travel with the
 * text: tz_offset carries the browser's offset in minutes and the server turns
 * the pair into one UTC time. Without it the same wording typed in Lagos and in
 * London would save two different moments.
 *
 * Both inputs render empty and are filled in an effect on purpose. A
 * datetime-local value depends on the reader's clock, so the server cannot know
 * it, and printing one during render is a guaranteed hydration mismatch.
 */

const wrap: CSSProperties = { marginTop: 8, borderTop: "1px dashed #232940", paddingTop: 8 }
const row: CSSProperties = { display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }
const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 3 }
const lbl: CSSProperties = { fontSize: 12, color: "#9aa4c2" }
const box: CSSProperties = {
  padding: "8px 10px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
  minWidth: 196,
}
const clearBtn: CSSProperties = {
  padding: "8px 10px",
  background: "transparent",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#9aa4c2",
  fontSize: 12,
}
const state: CSSProperties = { color: "#9aa4c2", fontSize: 12, marginTop: 6 }
const warn: CSSProperties = { color: "#f59e0b", fontSize: 12, marginTop: 6 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 4 }

function pad(n: number): string {
  return (n < 10 ? "0" : "") + String(n)
}

/** Stored instant -> what a datetime-local input wants, in this browser's clock. */
function toInput(value: string): string {
  const raw = String(value || "").trim()
  if (!raw) return ""
  const ms = Date.parse(raw.indexOf("T") === -1 ? raw.replace(" ", "T") : raw)
  if (Number.isNaN(ms)) return ""
  const d = new Date(ms)
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  )
}

function when(value: string): string {
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) return value
  return new Date(ms).toLocaleString()
}

function msOf(value: string): number | null {
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

/**
 * The same rule as lib/schedule.ts, said in words the creator can check against
 * what she sees on her own page. Deliberately not imported: that module answers
 * a yes or no about a stored row, this one describes two half-typed inputs.
 */
function sentence(start: string, end: string): string {
  const now = Date.now()
  const s = start ? msOf(start) : null
  const e = end ? msOf(end) : null

  if (s === null && e === null) return "Always on. Leave both empty unless you want it to appear or disappear by itself."
  if (s !== null && e === null) {
    return now < s ? "Hidden until " + when(start) + ", then on for good." : "On since " + when(start) + ", with no end."
  }
  if (s === null && e !== null) {
    return now < e ? "On now, stops " + when(end) + "." : "Stopped " + when(end) + " \u2014 hidden on your page right now."
  }
  if (s !== null && e !== null) {
    if (now < s) return "Hidden until " + when(start) + ", then on until " + when(end) + "."
    if (now < e) return "On now, stops " + when(end) + "."
    return "Finished " + when(end) + " \u2014 hidden on your page right now."
  }
  return "Always on."
}

export default function ScheduleFields({ startsAt, endsAt }: { startsAt: string; endsAt: string }) {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [offset, setOffset] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setStart(toInput(startsAt))
    setEnd(toInput(endsAt))
    setOffset(String(new Date().getTimezoneOffset()))
    setReady(true)
  }, [startsAt, endsAt])

  const s = start ? msOf(start) : null
  const e = end ? msOf(end) : null
  const backwards = s !== null && e !== null && e <= s

  return (
    <div style={wrap}>
      <input type="hidden" name="tz_offset" value={offset} />
      <div style={row}>
        <label style={field}>
          <span style={lbl}>Show it from</span>
          <input
            style={box}
            type="datetime-local"
            name="starts_at"
            value={start}
            onChange={(ev) => setStart(ev.target.value)}
          />
        </label>
        <label style={field}>
          <span style={lbl}>Stop showing it</span>
          <input
            style={box}
            type="datetime-local"
            name="ends_at"
            value={end}
            onChange={(ev) => setEnd(ev.target.value)}
          />
        </label>
        {start || end ? (
          <button
            type="button"
            style={clearBtn}
            onClick={() => {
              setStart("")
              setEnd("")
            }}
          >
            Clear dates
          </button>
        ) : null}
      </div>
      {ready ? <p style={state}>{sentence(start, end)}</p> : null}
      {backwards ? <p style={warn}>The stop time is before the start time, so this link would never show. Fix one of them.</p> : null}
      <p style={hint}>Your own clock. Press Save link to store it.</p>
    </div>
  )
}
