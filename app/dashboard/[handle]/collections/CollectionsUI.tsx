"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { createCollection, updateCollection, deleteCollection, setPageCollection } from "./actions"

export type CollectionRow = { id: string; name: string; redirectUrl: string; pageCount: number }
export type PageRow = { id: string; handle: string; displayName: string; collectionId: string }

const topRow: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
  flexWrap: "wrap",
}
const input: CSSProperties = {
  padding: "10px 12px",
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
}
const search: CSSProperties = { ...input, flex: 1, minWidth: 220, maxWidth: 320 }
const primary: CSSProperties = {
  padding: "10px 16px",
  background: "#5b7fff",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
}
const ghost: CSSProperties = {
  padding: "7px 11px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
  fontSize: 12,
}
const danger: CSSProperties = { ...ghost, color: "#f87171" }
const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
}
const empty: CSSProperties = { color: "#6b7396", fontSize: 13, padding: "18px 0", textAlign: "center" }
const nameRow: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }
const pill: CSSProperties = {
  background: "#232940",
  color: "#8892a4",
  borderRadius: 999,
  padding: "3px 9px",
  fontSize: 11,
}
const lbl: CSSProperties = { fontSize: 11, color: "#8892a4", textTransform: "uppercase", letterSpacing: 0.4 }
const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(5,7,12,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 50,
}
const modal: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 16,
  padding: 22,
  position: "relative",
}
const modalTitle: CSSProperties = { fontSize: 18, fontWeight: 700 }
const modalSub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4, marginBottom: 16 }
const closeX: CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  background: "none",
  border: "none",
  color: "#8892a4",
  fontSize: 18,
  cursor: "pointer",
}
const modalActions: CSSProperties = { display: "flex", gap: 10, marginTop: 18 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 8 }
const full: CSSProperties = { ...input, width: "100%", marginTop: 6, marginBottom: 14 }
const sectionTitle: CSSProperties = { fontSize: 15, fontWeight: 600, marginBottom: 10, marginTop: 26 }
const pageRow: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  borderTop: "1px solid #232940",
  padding: "10px 0",
  flexWrap: "wrap",
}
const pageName: CSSProperties = { flex: 1, minWidth: 140, fontSize: 14 }

export default function CollectionsUI({
  handle,
  collections,
  pages,
}: {
  handle: string
  collections: CollectionRow[]
  pages: PageRow[]
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState("")

  const term = query.trim().toLowerCase()
  const shown = term ? collections.filter((c) => c.name.toLowerCase().includes(term)) : collections

  return (
    <div>
      <div style={topRow}>
        <input
          style={search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections..."
        />
        <button type="button" style={primary} onClick={() => setOpen(true)}>
          Create collection +
        </button>
      </div>

      {collections.length === 0 ? (
        <div style={card}>
          <div style={empty}>No collections yet. Create one to group your pages.</div>
        </div>
      ) : null}

      {collections.length > 0 && shown.length === 0 ? (
        <div style={card}>
          <div style={empty}>No collection matches that search.</div>
        </div>
      ) : null}

      {shown.map((c) => (
        <div key={c.id} style={card}>
          {editing === c.id ? (
            <form action={updateCollection}>
              <input type="hidden" name="handle" value={handle} />
              <input type="hidden" name="id" value={c.id} />
              <label style={lbl}>
                Name
                <input style={full} name="name" defaultValue={c.name} />
              </label>
              <label style={lbl}>
                Redirect URL
                <input style={full} name="redirect_url" defaultValue={c.redirectUrl} placeholder="https://example.com/redirect" />
              </label>
              <div style={modalActions}>
                <button style={primary} type="submit">
                  Save collection
                </button>
                <button type="button" style={ghost} onClick={() => setEditing("")}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={nameRow}>
                <strong style={{ fontSize: 15 }}>{c.name}</strong>
                <span style={pill}>
                  {c.pageCount} page{c.pageCount === 1 ? "" : "s"}
                </span>
                <span style={{ flex: 1 }} />
                <button type="button" style={ghost} onClick={() => setEditing(c.id)}>
                  Edit
                </button>
                <form action={deleteCollection}>
                  <input type="hidden" name="handle" value={handle} />
                  <input type="hidden" name="id" value={c.id} />
                  <button style={danger} type="submit">
                    Delete
                  </button>
                </form>
              </div>
              <p style={hint}>
                {c.redirectUrl
                  ? "Blocked visitors go to " + c.redirectUrl
                  : "No redirect set, blocked visitors see the block screen."}
              </p>
            </div>
          )}
        </div>
      ))}

      <div style={sectionTitle}>Pages in collections</div>
      <div style={card}>
        {pages.length === 0 ? <div style={empty}>No pages yet.</div> : null}
        {pages.map((p) => (
          <form key={p.id} action={setPageCollection} style={pageRow}>
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="page_id" value={p.id} />
            <span style={pageName}>
              {p.displayName} <span style={{ color: "#6b7396" }}>/{p.handle}</span>
            </span>
            <select style={{ ...input, minWidth: 170 }} name="collection_id" defaultValue={p.collectionId}>
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button style={ghost} type="submit">
              Save
            </button>
          </form>
        ))}
      </div>

      {open ? (
        <div style={overlay}>
          <form action={createCollection} style={modal}>
            <button type="button" style={closeX} onClick={() => setOpen(false)} aria-label="Close">
              &#215;
            </button>
            <input type="hidden" name="handle" value={handle} />
            <div style={modalTitle}>New collection</div>
            <p style={modalSub}>Create a new collection for your pages</p>
            <label style={lbl}>
              Name
              <input style={full} name="name" placeholder="My collection" />
            </label>
            <label style={lbl}>
              Redirect URL
              <input style={full} name="redirect_url" placeholder="https://example.com/redirect" />
            </label>
            <p style={hint}>
              When someone from a blocked country visits a page in this collection, you can redirect them here.
            </p>
            <div style={modalActions}>
              <button type="button" style={ghost} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button style={primary} type="submit">
                Save collection
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
