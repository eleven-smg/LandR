"use client"

import { useEffect, useState } from "react"

const KEY = "landr_consent"
const EVENT = "landr-consent"

const DEFAULT_TEXT =
  "This page keeps a small anonymous id on your device so visits can be counted. Nothing is sold or shared with advertisers."

/**
 * The consent gate for a public page.
 *
 * Two jobs, and the second one is the important one:
 *
 *   1. ask the visitor, and remember the answer in localStorage;
 *   2. leave a marker element in the server-rendered HTML so Tracker, which
 *      lives in a different part of the tree and cannot receive props from
 *      here, can tell that consent is required at all.
 *
 * The marker is rendered unconditionally -- never behind state -- because
 * Tracker's effect runs before this component's effect (React runs child
 * effects first), so anything state-dependent would not be in the DOM yet and
 * Tracker would assume consent was not needed.
 */
export default function ConsentBanner({
  text,
  privacyUrl,
}: {
  text: string
  privacyUrl: string
}) {
  // Starts closed so the first client render matches the server HTML; the
  // effect below is what decides whether it should actually appear.
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved !== "accepted" && saved !== "declined") setOpen(true)
    } catch {
      // Private mode with storage disabled: ask anyway, and the choice simply
      // will not persist.
      setOpen(true)
    }
  }, [])

  function choose(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value)
    } catch {}
    setOpen(false)
    try {
      window.dispatchEvent(new CustomEvent(EVENT, { detail: value }))
    } catch {}
  }

  return (
    <>
      <div data-landr-consent="required" aria-hidden="true" style={{ display: "none" }} />

      {open ? (
        <div
          role="dialog"
          aria-label="Cookie notice"
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 9999,
            maxWidth: 560,
            margin: "0 auto",
            padding: 16,
            borderRadius: 14,
            background: "rgba(18, 20, 26, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <div style={{ color: "#d9dee7" }}>{text || DEFAULT_TEXT}</div>

          {privacyUrl ? (
            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", marginTop: 8, color: "#8ab4ff", fontSize: 12 }}
            >
              Privacy policy
            </a>
          ) : null}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => choose("accepted")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#fff",
                color: "#11141a",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => choose("declined")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.22)",
                background: "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
