"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { createCollection, updateCollection, deleteCollection, setPageCollection } from "./actions"

export type CollectionDestinationRow = { key: string; url: string; enabled: boolean }

export type CollectionRow = {
  id: string
  name: string
  countryRedirectUrl: string
  countryRedirectEnabled: boolean
  takeoverUrl: string
  takeoverEnabled: boolean
  destinations: CollectionDestinationRow[]
  pageCount: number
  canManage: boolean
}

export type PageRow = { id: string; handle: string; displayName: string; collectionId: string }

const SUGGESTED_KEYS = [
  "telegram",
  "instagram",
  "whatsapp",
  "snapchat",
  "tiktok",
  "onlyfans",
  "fansly",
  "x",
  "youtube",
  "reddit",
  "threads",
  "website",
]

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
const full: CSSProperties = { ...input, width: "100%", marginTop: 6, marginBottom: 6 }
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
const block: CSSProperties = {
  border: "1px solid #232940",
  borderRadius: 12,
  padding: 14,
  marginTop: 14,
  background: "#141824",
}
const blockHead: CSSProperties = { display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600 }
const blockNote: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 6 }
const destRow: CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }
const warn: CSSProperties = { color: "#fbbf24", fontSize: 11, marginTop: 6 }
const summaryLine: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 8, lineHeight: 1.5 }

/**
 * Plain English for what this collection currently does to a visitor. The old
 * tab showed an unexplained url field and left the client guessing, which is
 * exactly the confusion this line exists to remove.
 */
function describe(c: CollectionRow): string {
  const bits: string[] = []

  if (c.takeoverEnabled && c.takeoverUrl) {
    bits.push("every visitor to these " + c.pageCount + " page(s) is sent to " + c.takeoverUrl)
  }

  const live = c.destinations.filter((d) => d.enabled && d.url)
  if (live.length > 0) {
    bits.push(live.map((d) => d.key).join(", ") + " buttons on these pages point at this collection's url")
  }

  if (c.countryRedirectEnabled && c.countryRedirectUrl) {
    bits.push("visitors from a flagged country go to " + c.countryRedirectUrl)
  }

  if (bits.length === 0) {
    return "Grouping only: these pages read together on Analytics, and nothing at all changes for a visitor."
  }

  return bits.join(" \u00b7 ")
}

function CollectionForm({ handle, collection }: { handle: string; collection: CollectionRow }) {
  const [destinations, setDestinations] = useState<CollectionDestinationRow[]>(collection.destinations)
  const [countryOn, setCountryOn] = useState(collection.countryRedirectEnabled)
  const [takeoverOn, setTakeoverOn] = useState(collection.takeoverEnabled)

  function setRow(index: number, patch: Partial<CollectionDestinationRow>) {
    setDestinations((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <form action={updateCollection}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="id" value={collection.id} />

      <label style={lbl}>
        Name
        <input style={full} name="name" defaultValue={collection.name} />
      </label>

      <div style={block}>
        <div style={blockHead}>Campaign destinations</div>
        <p style={blockNote}>
          Set the url a button should use for this whole campaign. A Telegram row here means every Telegram button on
          every page in this collection goes to that url, so you change it once instead of ten times. Buttons you have
          not listed keep their own destination, so your main link stays the main link for everybody. Untick a row to
          stop using it without deleting the url.
        </p>
        {destinations.map((d, i) => (
          <div key={i} style={destRow}>
            <input
              type="checkbox"
              checked={d.enabled}
              onChange={(e) => setRow(i, { enabled: e.target.checked })}
              aria-label="Use this destination"
            />
            <input
              style={{ ...input, width: 130 }}
              list="landr-destination-keys"
              value={d.key}
              onChange={(e) => setRow(i, { key: e.target.value })}
              placeholder="telegram"
            />
            <input
              style={{ ...input, flex: 1, minWidth: 180 }}
              value={d.url}
              onChange={(e) => setRow(i, { url: e.target.value })}
              placeholder="https://t.me/yourchannel"
            />
            <button
              type="button"
              style={danger}
              onClick={() => setDestinations((rows) => rows.filter((_, x) => x !== i))}
            >
              Remove
            </button>
          </div>
        ))}
        <datalist id="landr-destination-keys">
          {SUGGESTED_KEYS.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <button
          type="button"
          style={{ ...ghost, marginTop: 10 }}
          onClick={() => setDestinations((rows) => [...rows, { key: "", url: "", enabled: true }])}
        >
          Add destination +
        </button>
        <input type="hidden" name="destinations" value={JSON.stringify(destinations)} />
      </div>

      <div style={block}>
        <label style={blockHead}>
          <input
            type="checkbox"
            name="country_redirect_enabled"
            checked={countryOn}
            onChange={(e) => setCountryOn(e.target.checked)}
          />
          Send flagged-country visitors somewhere else
        </label>
        <input
          style={full}
          name="redirect_url"
          defaultValue={collection.countryRedirectUrl}
          placeholder="https://example.com/elsewhere"
        />
        <p style={blockNote}>
          Applies to every page in the collection that has flagged countries saved on its Country rules tab. A page with
          its own destination set there keeps it — the page always wins over the group.
        </p>
      </div>

      <div style={block}>
        <label style={blockHead}>
          <input
            type="checkbox"
            name="takeover_enabled"
            checked={takeoverOn}
            onChange={(e) => setTakeoverOn(e.target.checked)}
          />
          Send everybody to a site I prepared for this campaign
        </label>
        <input
          style={full}
          name="takeover_url"
          defaultValue={collection.takeoverUrl}
          placeholder="https://example.com/campaign"
        />
        <p style={warn}>
          While this is on, nobody sees the pages in this collection at all — every visitor lands on that site. Views
          are still counted first, so Analytics keeps working.
        </p>
      </div>

      <div style={modalActions}>
        <button style={primary} type="submit">
          Save collection
        </button>
      </div>
    </form>
  )
}

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
  const assignable = collections.filter((c) => c.canManage)

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
          <div style={nameRow}>
            <strong style={{ fontSize: 15 }}>{c.name}</strong>
            <span style={pill}>
              {c.pageCount} page{c.pageCount === 1 ? "" : "s"}
            </span>
            <span style={{ flex: 1 }} />
            {c.canManage ? (
              <button type="button" style={ghost} onClick={() => setEditing(editing === c.id ? "" : c.id)}>
                {editing === c.id ? "Close" : "Edit"}
              </button>
            ) : (
              <span style={pill}>Admin only</span>
            )}
            {c.canManage ? (
              <form action={deleteCollection}>
                <input type="hidden" name="handle" value={handle} />
                <input type="hidden" name="id" value={c.id} />
                <button style={danger} type="submit">
                  Delete
                </button>
              </form>
            ) : null}
          </div>

          <p style={summaryLine}>{describe(c)}</p>

          {editing === c.id && c.canManage ? <CollectionForm handle={handle} collection={c} /> : null}
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
              {assignable.map((c) => (
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
      <p style={hint}>
        This is the only place a page joins a collection — a collection holds your own pages, not visitors. Once a page
        is in one, Analytics can add the whole group together with its &ldquo;Filter on collection&rdquo; dropdown.
      </p>

      {open ? (
        <div style={overlay}>
          <form action={createCollection} style={modal}>
            <button type="button" style={closeX} onClick={() => setOpen(false)} aria-label="Close">
              &#215;
            </button>
            <input type="hidden" name="handle" value={handle} />
            <div style={modalTitle}>New collection</div>
            <p style={modalSub}>Name the campaign. Nothing changes for visitors until you switch something on.</p>
            <label style={lbl}>
              Name
              <input style={full} name="name" placeholder="Summer campaign" />
            </label>
            <p style={hint}>
              Next: add your pages below, then press Edit to set campaign destinations, a flagged-country destination, or
              a full takeover.
            </p>
            <div style={modalActions}>
              <button type="button" style={ghost} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button style={primary} type="submit">
                Create collection
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
