"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { saveRotation } from "../edit/actions"

export type RotationItem = { id: string; label: string; rotate: boolean; urls: string[] }

const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
}
const h3s: CSSProperties = { fontSize: 15, fontWeight: 600, marginBottom: 10 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginBottom: 14 }
const empty: CSSProperties = { color: "#6b7396", fontSize: 13, padding: "10px 0" }
const group: CSSProperties = { borderTop: "1px solid #232940", paddingTop: 12, marginTop: 12 }
const rowTop: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }
const name: CSSProperties = { fontSize: 14, fontWeight: 600, flex: 1, minWidth: 140 }
const input: CSSProperties = {
  padding: "9px 11px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
  width: "100%",
}
const ta: CSSProperties = { ...input, minHeight: 76, marginTop: 8, fontFamily: "inherit", fontSize: 13 }
const ghost: CSSProperties = {
  padding: "6px 10px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
  fontSize: 12,
  marginTop: 10,
}
const addBtn: CSSProperties = { ...ghost, width: 200, marginTop: 12 }
const cbl: CSSProperties = { fontSize: 12, color: "#8892a4", display: "flex", gap: 6, alignItems: "center" }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 8 }
const sel: CSSProperties = { ...input, width: "auto", minWidth: 200, marginTop: 0 }

export default function RotationGroups({ handle, items }: { handle: string; items: RotationItem[] }) {
  const [adding, setAdding] = useState(false)
  const active = items.filter((i) => i.rotate || i.urls.length > 0)
  const available = items.filter((i) => !(i.rotate || i.urls.length > 0))

  return (
    <div style={card}>
      <h3 style={h3s}>Link Rotation</h3>
      <p style={sub}>
        Add multiple URLs to a button and traffic splits evenly. Useful for rotating promos or affiliate links.
      </p>

      {active.length === 0 ? <div style={empty}>No rotation groups set up.</div> : null}

      {active.map((i) => (
        <form key={i.id} action={saveRotation} style={group}>
          <input type="hidden" name="handle" value={handle} />
          <input type="hidden" name="id" value={i.id} />
          <div style={rowTop}>
            <div style={name}>{i.label}</div>
            <label style={cbl}>
              <input type="checkbox" name="rotate" defaultChecked={i.rotate} /> rotation on
            </label>
          </div>
          <textarea style={ta} name="rotation_urls" defaultValue={i.urls.join("\n")} placeholder="https://example.com/one" />
          <button style={ghost} type="submit">
            Save group
          </button>
        </form>
      ))}

      {adding && available.length > 0 ? (
        <form action={saveRotation} style={group}>
          <input type="hidden" name="handle" value={handle} />
          <div style={rowTop}>
            <select style={sel} name="id" defaultValue={available[0].id}>
              {available.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
            <label style={cbl}>
              <input type="checkbox" name="rotate" defaultChecked /> rotation on
            </label>
          </div>
          <textarea style={ta} name="rotation_urls" placeholder="One URL per line" />
          <button style={ghost} type="submit">
            Create group
          </button>
        </form>
      ) : null}

      {available.length === 0 ? (
        <p style={hint}>Every link already has a rotation group.</p>
      ) : (
        <button type="button" style={addBtn} onClick={() => setAdding(!adding)}>
          {adding ? "Cancel" : "+ Add rotation group"}
        </button>
      )}

      <p style={hint}>
        Rotation serves the next URL in order on every visit, so a group of three splits traffic three ways. To switch a
        group off, untick rotation on and save. To delete it, clear the URLs and save.
      </p>
    </div>
  )
}
