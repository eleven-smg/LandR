"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { TIERS, nameFor } from "@/lib/countryGroups"
import { saveBlockedCountries } from "../edit/actions"

const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
}
const h3s: CSSProperties = { fontSize: 15, fontWeight: 600, marginBottom: 10 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginBottom: 12 }
const empty: CSSProperties = { color: "#6b7396", fontSize: 13, padding: "10px 0" }
const tagWrap: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 }
const tag: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(248,113,113,0.12)",
  border: "1px solid rgba(248,113,113,0.35)",
  color: "#fca5a5",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
}
const tagX: CSSProperties = {
  background: "none",
  border: "none",
  color: "#fca5a5",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
}
const tierRow: CSSProperties = {
  borderTop: "1px solid #232940",
  paddingTop: 12,
  marginTop: 12,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
}
const input: CSSProperties = {
  padding: "9px 11px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
}
const primary: CSSProperties = {
  padding: "9px 14px",
  background: "#5b7fff",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
}
const ghost: CSSProperties = {
  padding: "6px 10px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
  fontSize: 12,
}
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
  gap: 6,
  marginTop: 12,
}
const cbl: CSSProperties = { fontSize: 12, color: "#e2e8f0", display: "flex", gap: 6, alignItems: "center" }
const tierName: CSSProperties = { fontSize: 14, fontWeight: 600, flex: 1, minWidth: 160 }
const tierNote: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 2, fontWeight: 400 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 10 }
const addRow: CSSProperties = { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }
const count: CSSProperties = { color: "#8892a4", fontSize: 12 }

export default function CountryPicker({
  handle,
  initial,
  redirectUrl,
}: {
  handle: string
  initial: string[]
  redirectUrl: string
}) {
  const [sel, setSel] = useState<string[]>(initial)
  const [open, setOpen] = useState<string>("")
  const [manual, setManual] = useState("")

  function toggle(code: string) {
    setSel((s) => (s.includes(code) ? s.filter((c) => c !== code) : s.concat(code)))
  }
  function blockAll(codes: string[]) {
    setSel((s) => s.concat(codes.filter((c) => !s.includes(c))))
  }
  function unblockAll(codes: string[]) {
    setSel((s) => s.filter((c) => !codes.includes(c)))
  }
  function addManual() {
    const codes = manual
      .toUpperCase()
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length === 2)
    setSel((s) => s.concat(codes.filter((c) => !s.includes(c))))
    setManual("")
  }

  return (
    <form action={saveBlockedCountries}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="blocked_countries" value={sel.join(",")} />

      <div style={card}>
        <h3 style={h3s}>Blocked Countries</h3>
        {sel.length === 0 ? (
          <div style={empty}>No countries blocked. Pick a group or add countries below.</div>
        ) : (
          <div style={tagWrap}>
            {sel.map((c) => (
              <span key={c} style={tag}>
                {nameFor(c)}
                <button type="button" style={tagX} onClick={() => toggle(c)} aria-label={"Unblock " + c}>
                  &#215;
                </button>
              </span>
            ))}
          </div>
        )}

        {TIERS.map((t) => {
          const codes = t.countries.map((c) => c.code)
          const on = codes.filter((c) => sel.includes(c)).length
          return (
            <div key={t.id}>
              <div style={tierRow}>
                <div style={tierName}>
                  {t.label}
                  <div style={tierNote}>{t.note}</div>
                </div>
                <span style={count}>
                  {on} / {codes.length} blocked
                </span>
                <button type="button" style={ghost} onClick={() => blockAll(codes)}>
                  Block all
                </button>
                <button type="button" style={ghost} onClick={() => unblockAll(codes)}>
                  Clear
                </button>
                <button type="button" style={ghost} onClick={() => setOpen(open === t.id ? "" : t.id)}>
                  {open === t.id ? "Hide list" : "Pick one by one"}
                </button>
              </div>
              {open === t.id ? (
                <div style={grid}>
                  {t.countries.map((c) => (
                    <label key={c.code} style={cbl}>
                      <input type="checkbox" checked={sel.includes(c.code)} onChange={() => toggle(c.code)} />
                      {c.name}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}

        <div style={addRow}>
          <input
            style={{ ...input, flex: 1, minWidth: 180 }}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Any other codes, e.g. NG, US, GB"
          />
          <button type="button" style={ghost} onClick={addManual}>
            Add
          </button>
        </div>
        <p style={hint}>
          Codes are ISO 3166 alpha-2. Groups are a shortcut only, you can add or remove any single country. Country
          detection comes from Vercel and is blank on localhost.
        </p>
      </div>

      <div style={card}>
        <h3 style={h3s}>Redirect URL</h3>
        <p style={sub}>Blocked visitors will be sent to this URL instead of seeing a blank page</p>
        <input
          style={{ ...input, width: "100%", maxWidth: 400 }}
          name="blocked_redirect_url"
          defaultValue={redirectUrl}
          placeholder="https://example.com/redirect"
        />
        <div style={{ marginTop: 14 }}>
          <button style={primary} type="submit">
            Save geoblocking
          </button>
        </div>
      </div>
    </form>
  )
}
