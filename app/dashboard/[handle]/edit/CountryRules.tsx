"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { TIERS, nameFor } from "@/lib/countryGroups"
import { saveGeoRules } from "./actions"
import ActionForm from "./ActionForm"
import SaveButton from "./SaveButton"

/**
 * Country rules for one link.
 *
 * The old control was a textarea where you typed `NG,GH = https://...` by hand,
 * which meant knowing ISO codes off the top of your head and getting the equals
 * sign right. Nothing about the storage changes here: this still posts the same
 * `geo_rules` lines to the same server action, so `links.geo_rules` keeps its
 * shape ({ countries, url }[]) and no migration is needed.
 *
 * Wording note: a listed country is *flagged*, not blocked. Flagged visitors see
 * the normal page; the only difference is where a link with a rule sends them.
 */

const NL = String.fromCharCode(10)

export type GeoRule = { countries: string[]; url: string }

type Row = { key: number; scope: string; countries: string[]; url: string; manual: string }

const toggleRow: CSSProperties = { display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#e2e8f0" }
const ruleCard: CSSProperties = {
  border: "1px solid #232940",
  borderRadius: 10,
  background: "#0f1117",
  padding: 12,
  marginTop: 10,
}
const row: CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }
const row8: CSSProperties = { ...row, marginTop: 8 }
const input: CSSProperties = {
  padding: "8px 10px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
}
const urlIn: CSSProperties = { ...input, flex: 1, minWidth: 190 }
const sel: CSSProperties = { ...input, minWidth: 200 }
const manualIn: CSSProperties = { ...input, flex: 1, minWidth: 150 }
const ghost: CSSProperties = {
  padding: "6px 10px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
  fontSize: 12,
}
const danger: CSSProperties = { ...ghost, background: "rgba(248,113,113,0.14)", color: "#fca5a5" }
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
  gap: 6,
  marginTop: 10,
}
const cbl: CSSProperties = { fontSize: 12, color: "#e2e8f0", display: "flex", gap: 6, alignItems: "center" }
const tierHead: CSSProperties = { fontSize: 12, fontWeight: 600, color: "#9aa4c2", marginTop: 10 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 8 }
const sumLine: CSSProperties = { color: "#9aa4c2", fontSize: 12, marginTop: 8 }
const warn: CSSProperties = { color: "#fbbf24", fontSize: 11, marginTop: 6 }

function sameSet(a: string[], b: string[]): boolean {
  if (a.length === 0 || a.length !== b.length) return false
  return a.every((code) => b.includes(code))
}

let seq = 0
function nextKey(): number {
  seq += 1
  return seq
}

function blank(): Row {
  return { key: nextKey(), scope: "flagged", countries: [], url: "", manual: "" }
}

export default function CountryRules({
  handle,
  linkId,
  initial,
  flagged,
}: {
  handle: string
  linkId: string
  initial: GeoRule[]
  flagged: string[]
}) {
  function scopeOf(codes: string[]): string {
    if (sameSet(codes, flagged)) return "flagged"
    const tier = TIERS.find((t) => sameSet(codes, t.countries.map((c) => c.code)))
    return tier ? tier.id : "custom"
  }

  const existing: Row[] = initial.map((r) => {
    const codes = (r.countries || []).map((c) => String(c).toUpperCase())
    return { key: nextKey(), scope: scopeOf(codes), countries: codes, url: String(r.url || ""), manual: "" }
  })

  const [on, setOn] = useState(existing.length > 0)
  const [rows, setRows] = useState<Row[]>(existing.length > 0 ? existing : [blank()])
  const [openPicker, setOpenPicker] = useState<number>(0)

  function codesFor(r: Row): string[] {
    if (r.scope === "flagged") return flagged
    if (r.scope === "custom") return r.countries
    const tier = TIERS.find((t) => t.id === r.scope)
    return tier ? tier.countries.map((c) => c.code) : []
  }

  function patch(key: number, next: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...next } : r)))
  }

  function toggleCountry(key: number, code: string) {
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? { ...r, countries: r.countries.includes(code) ? r.countries.filter((c) => c !== code) : r.countries.concat(code) }
          : r,
      ),
    )
  }

  function addManual(key: number) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r
        const codes = r.manual
          .toUpperCase()
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length === 2 && !r.countries.includes(c))
        return { ...r, countries: r.countries.concat(codes), manual: "" }
      }),
    )
  }

  // Serialised into exactly the format saveGeoRules already parses, so the
  // server action and the database column are untouched. Turning the tick box
  // off posts an empty value, which clears the rules for this link.
  const serialised = on
    ? rows
        .map((r) => ({ codes: codesFor(r), url: r.url.trim() }))
        .filter((r) => r.codes.length > 0 && r.url.length > 0)
        .map((r) => r.codes.join(",") + " = " + r.url)
        .join(NL)
    : ""

  return (
    <ActionForm action={saveGeoRules}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="id" value={linkId} />
      <input type="hidden" name="geo_rules" value={serialised} />

      <label style={toggleRow}>
        <input type="checkbox" checked={on} onChange={() => setOn(!on)} />
        Send some countries to a different destination
      </label>

      {!on ? (
        <p style={hint}>
          Off means this link behaves identically for the whole world. Saving with the box unticked clears any rules it
          already had.
        </p>
      ) : (
        <div>
          {rows.map((r) => {
            const codes = codesFor(r)
            const names = codes.slice(0, 4).map(nameFor).join(", ")
            return (
              <div key={r.key} style={ruleCard}>
                <div style={row}>
                  <select style={sel} value={r.scope} onChange={(e) => patch(r.key, { scope: e.target.value })}>
                    <option value="flagged">Every flagged country ({flagged.length})</option>
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.countries.length})
                      </option>
                    ))}
                    <option value="custom">Pick countries myself</option>
                  </select>
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      style={danger}
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    >
                      Remove rule
                    </button>
                  ) : null}
                </div>

                <div style={row8}>
                  <input
                    style={urlIn}
                    value={r.url}
                    onChange={(e) => patch(r.key, { url: e.target.value })}
                    placeholder="https://t.me/africa"
                  />
                </div>

                {r.scope === "custom" ? (
                  <div>
                    <div style={row8}>
                      <input
                        style={manualIn}
                        value={r.manual}
                        onChange={(e) => patch(r.key, { manual: e.target.value })}
                        placeholder="Type codes, e.g. NG, GH"
                      />
                      <button type="button" style={ghost} onClick={() => addManual(r.key)}>
                        Add
                      </button>
                      <button
                        type="button"
                        style={ghost}
                        onClick={() => setOpenPicker(openPicker === r.key ? 0 : r.key)}
                      >
                        {openPicker === r.key ? "Hide the list" : "Pick from the list"}
                      </button>
                    </div>
                    {openPicker === r.key
                      ? TIERS.map((t) => (
                          <div key={t.id}>
                            <div style={tierHead}>{t.label}</div>
                            <div style={grid}>
                              {t.countries.map((c) => (
                                <label key={c.code} style={cbl}>
                                  <input
                                    type="checkbox"
                                    checked={r.countries.includes(c.code)}
                                    onChange={() => toggleCountry(r.key, c.code)}
                                  />
                                  {c.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                ) : null}

                <p style={sumLine}>
                  {codes.length === 0
                    ? "No countries chosen yet, so this rule will not be saved."
                    : names + (codes.length > 4 ? " and " + (codes.length - 4) + " more" : "") + " go to this link instead."}
                </p>
                {r.scope === "flagged" && flagged.length === 0 ? (
                  <p style={warn}>No countries are flagged yet. Add them in the Country rules tab first.</p>
                ) : null}
              </div>
            )
          })}

          <div style={row8}>
            <button type="button" style={ghost} onClick={() => setRows((rs) => rs.concat(blank()))}>
              + Add another rule
            </button>
          </div>
        </div>
      )}

      <div style={row8}>
        <SaveButton label="Save country rules" variant="ghost" />
      </div>
      <p style={hint}>
        Any country you do not list keeps this link&apos;s normal destination. Visitors always see your normal page,
        whichever rules are set.
      </p>
    </ActionForm>
  )
}
