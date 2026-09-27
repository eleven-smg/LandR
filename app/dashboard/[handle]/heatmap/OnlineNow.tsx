"use client"

import { useEffect, useState } from "react"

const POLL_MS = 20000

export default function OnlineNow({ handle }: { handle: string }) {
  // null = not asked yet, so nothing is guessed during the server render.
  const [online, setOnline] = useState<number | null>(null)
  const [minutes, setMinutes] = useState(5)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true

    const read = async () => {
      try {
        const res = await fetch("/api/online?handle=" + encodeURIComponent(handle), {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(String(res.status))
        const body = (await res.json()) as { online: number | null; minutes?: number }
        if (!alive) return
        setFailed(body.online === null)
        setOnline(typeof body.online === "number" ? body.online : null)
        if (typeof body.minutes === "number") setMinutes(body.minutes)
      } catch {
        if (!alive) return
        setFailed(true)
      }
    }

    read()
    const timer = setInterval(read, POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [handle])

  const live = typeof online === "number" && online > 0

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#141922",
        border: "1px solid #1f2733",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 16,
        maxWidth: 820,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          flex: "0 0 auto",
          background: live ? "#27c07f" : "#3a4354",
          boxShadow: live ? "0 0 0 4px rgba(39,192,127,0.15)" : "none",
        }}
      />
      <div style={{ fontSize: 14, color: "#fff" }}>
        {failed ? (
          <span style={{ color: "#8892a4" }}>Could not read who is on the page right now.</span>
        ) : online === null ? (
          <span style={{ color: "#8892a4" }}>Checking who is on your page…</span>
        ) : online === 0 ? (
          <span style={{ color: "#8892a4" }}>Nobody on your page right now.</span>
        ) : (
          <>
            <b>{online.toLocaleString()}</b> {online === 1 ? "person" : "people"} on your page now
          </>
        )}
      </div>
      <div style={{ marginLeft: "auto", fontSize: 11, color: "#6c7689" }}>
        active in the last {minutes} min · refreshes itself
      </div>
    </div>
  )
}
