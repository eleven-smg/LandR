"use client"

import { useEffect, useMemo, useState } from "react"

type Props = {
  /** ISO timestamps of page views, newest first. */
  views: string[]
  /** ISO timestamps of link clicks, newest first. */
  clicks: string[]
  days: number
  /** True when the query hit its row cap, so the grid is a sample. */
  capped: boolean
}

type Grid = number[][]

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function emptyGrid(): Grid {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
}

// Buckets in the *browser's* clock. Doing this on the server would bucket in
// UTC, which is the wrong answer for a question about when to post, and it
// would also render different HTML than the client (hydration mismatch), which
// is why nothing here is computed until the effect below has run.
function bucketLocal(times: string[]): Grid {
  const grid = emptyGrid()
  for (const raw of times) {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) continue
    const day = (d.getDay() + 6) % 7 // Monday first
    grid[day][d.getHours()] += 1
  }
  return grid
}

function two(n: number) {
  return String(n).padStart(2, "0")
}

function slotLabel(day: number, hour: number) {
  return DAY_LABELS[day] + " " + two(hour) + ":00–" + two((hour + 1) % 24) + ":00"
}

export default function Heatmap({ views, clicks, days, capped }: Props) {
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<"views" | "clicks">("views")

  useEffect(() => {
    setReady(true)
  }, [])

  const grids = useMemo(
    () => ({ views: bucketLocal(views), clicks: bucketLocal(clicks) }),
    [views, clicks],
  )

  const grid = ready ? (mode === "views" ? grids.views : grids.clicks) : emptyGrid()
  const noun = mode === "views" ? "views" : "clicks"

  let total = 0
  let max = 0
  for (const row of grid) {
    for (const n of row) {
      total += n
      if (n > max) max = n
    }
  }

  const best: Array<{ day: number; hour: number; n: number }> = []
  grid.forEach((row, day) =>
    row.forEach((n, hour) => {
      if (n > 0) best.push({ day, hour, n })
    }),
  )
  best.sort((a, b) => b.n - a.n)
  const top = best.slice(0, 3)

  const tz = ready ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""

  const cell = (n: number, day: number, hour: number) => {
    const alpha = max > 0 && n > 0 ? 0.12 + 0.68 * (n / max) : 0
    return (
      <div
        key={day + "-" + hour}
        title={slotLabel(day, hour) + " — " + n + " " + noun}
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          flex: "0 0 auto",
          background: n > 0 ? "rgba(90,140,255," + alpha.toFixed(3) + ")" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      />
    )
  }

  return (
    <div
      style={{
        background: "#141922",
        border: "1px solid #1f2733",
        borderRadius: 12,
        padding: 20,
        maxWidth: 820,
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["views", "clicks"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 13,
              cursor: "pointer",
              color: mode === m ? "#fff" : "#8892a4",
              background: mode === m ? "#2b62ff" : "transparent",
              border: "1px solid " + (mode === m ? "#2b62ff" : "#293241"),
            }}
          >
            {m === "views" ? "Page views" : "Link clicks"}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ minWidth: 640 }}>
          <div style={{ display: "flex", gap: 2, marginLeft: 44, marginBottom: 6 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                style={{
                  width: 22,
                  flex: "0 0 auto",
                  fontSize: 10,
                  color: "#6c7689",
                  textAlign: "center",
                }}
              >
                {h % 3 === 0 ? two(h) : ""}
              </div>
            ))}
          </div>

          {grid.map((row, day) => (
            <div key={day} style={{ display: "flex", gap: 2, alignItems: "center", marginBottom: 2 }}>
              <div style={{ width: 44, fontSize: 11, color: "#8892a4", flex: "0 0 auto" }}>
                {DAY_LABELS[day]}
              </div>
              {row.map((n, hour) => cell(n, day, hour))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 13, color: "#c3cbd8", lineHeight: 1.6 }}>
        {!ready ? (
          <span style={{ color: "#6c7689" }}>Reading your clock…</span>
        ) : total === 0 ? (
          <span>
            No {noun} in the last {days} days, so there is nothing to read here yet. The grid fills
            itself as people visit — nothing needs switching on.
          </span>
        ) : (
          <>
            <div>
              <b>{total.toLocaleString()}</b> {noun} in the last {days} days. Busiest:{" "}
              {top.map((t, i) => (
                <span key={t.day + "-" + t.hour}>
                  {i > 0 ? ", " : ""}
                  <b>{slotLabel(t.day, t.hour)}</b> ({t.n})
                </span>
              ))}
              .
            </div>
            <div style={{ color: "#8892a4", marginTop: 6 }}>
              Post shortly before a dark square, not during it — the square is when people were
              already here.
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#6c7689", lineHeight: 1.6 }}>
        Times use this device&apos;s clock{tz ? " (" + tz + ")" : ""}. A visitor in another country is
        counted at your hour, not theirs.
        {capped ? " Showing the most recent rows only, so very old traffic is left out." : ""}
      </div>
    </div>
  )
}
