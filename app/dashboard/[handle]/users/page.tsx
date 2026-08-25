import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSession } from "@/lib/session"
import { signOut } from "@/app/signin/actions"
import type { CSSProperties } from "react"
import { addAccount, updateAccount, deleteAccount, assignPage } from "./actions"

export const dynamic = "force-dynamic"

const wrap: CSSProperties = { maxWidth: 980 }
const head: CSSProperties = { marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }
const title: CSSProperties = { fontSize: 20, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
}
const h2s: CSSProperties = { fontSize: 15, fontWeight: 600, marginBottom: 12 }
const rowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
  borderTop: "1px solid #232940",
  paddingTop: 12,
  marginTop: 12,
}
const input: CSSProperties = {
  padding: "8px 10px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
}
const idCell: CSSProperties = { color: "#6b7396", fontSize: 11, fontFamily: "monospace", width: 74 }
const emailCell: CSSProperties = { fontSize: 13, flex: 1, minWidth: 170 }
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
  padding: "7px 11px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
  fontSize: 12,
}
const danger: CSSProperties = { ...ghost, color: "#f87171" }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 10 }
const warn: CSSProperties = {
  background: "rgba(250,204,21,0.10)",
  border: "1px solid rgba(250,204,21,0.30)",
  color: "#facc15",
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 12,
  marginBottom: 14,
}
const count: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 12 }
const me: CSSProperties = { color: "#8892a4", fontSize: 12 }
const pageRow: CSSProperties = { ...rowStyle }
const pageName: CSSProperties = { flex: 1, minWidth: 150, fontSize: 13 }

export default async function UsersPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const session = await getSession()

  const { data: accounts } = await supabaseAdmin
    .from("accounts")
    .select("id, email, name, password, role, created_at")
    .order("created_at", { ascending: true })

  const { data: creators } = await supabaseAdmin
    .from("creators")
    .select("id, handle, display_name, account_id")
    .order("created_at", { ascending: true })

  const rows = accounts || []
  const pages = creators || []

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={title}>Users</div>
          <div style={sub}>Agency admins and model logins for this workspace</div>
        </div>
        {session ? (
          <form action={signOut} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={me}>{session.email}</span>
            <button style={ghost} type="submit">
              Sign out
            </button>
          </form>
        ) : null}
      </div>

      <div style={warn}>
        Passwords are stored and shown in plain text, as the agency asked. Anyone who can open this tab can read every
        login, so keep dashboard access to trusted staff only.
      </div>

      <div style={card}>
        <h2 style={h2s}>Accounts</h2>
        {rows.map((a: Record<string, unknown>) => (
          <form key={String(a.id)} action={updateAccount} style={rowStyle}>
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="id" value={String(a.id)} />
            <span style={idCell}>{String(a.id).slice(0, 8)}</span>
            <span style={emailCell}>{String(a.email)}</span>
            <input style={{ ...input, width: 140 }} name="name" defaultValue={String(a.name || "")} placeholder="Name" />
            <input
              style={{ ...input, width: 130 }}
              name="password"
              defaultValue={String(a.password || "")}
              placeholder="Password"
            />
            <select style={{ ...input, width: 100 }} name="role" defaultValue={String(a.role || "model")}>
              <option value="admin">Admin</option>
              <option value="model">Model</option>
            </select>
            <button style={ghost} type="submit">
              Save
            </button>
          </form>
        ))}
        <div style={count}>
          Showing 1&ndash;{rows.length} of {rows.length}
        </div>
      </div>

      <div style={card}>
        <h2 style={h2s}>Add an account</h2>
        <form action={addAccount} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input type="hidden" name="handle" value={handle} />
          <input style={{ ...input, flex: 1, minWidth: 190 }} name="email" type="email" placeholder="model@agency.com" />
          <input style={{ ...input, width: 150 }} name="name" placeholder="Display name" />
          <input style={{ ...input, width: 140 }} name="password" placeholder="Password" />
          <select style={{ ...input, width: 100 }} name="role" defaultValue="model">
            <option value="model">Model</option>
            <option value="admin">Admin</option>
          </select>
          <button style={primary} type="submit">
            Add account
          </button>
        </form>
        <p style={hint}>
          A model signs in at /signin with this email and password. Admins can see every page, models only see the pages
          assigned to them below.
        </p>
      </div>

      <div style={card}>
        <h2 style={h2s}>Who owns which page</h2>
        {pages.map((p: Record<string, unknown>) => (
          <form key={String(p.id)} action={assignPage} style={pageRow}>
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="page_id" value={String(p.id)} />
            <span style={pageName}>
              {String(p.display_name || p.handle)} <span style={{ color: "#6b7396" }}>/{String(p.handle)}</span>
            </span>
            <select
              style={{ ...input, minWidth: 200 }}
              name="account_id"
              defaultValue={p.account_id ? String(p.account_id) : ""}
            >
              <option value="">Unassigned</option>
              {rows.map((a: Record<string, unknown>) => (
                <option key={String(a.id)} value={String(a.id)}>
                  {String(a.email)}
                </option>
              ))}
            </select>
            <button style={ghost} type="submit">
              Save
            </button>
          </form>
        ))}
        <p style={hint}>
          Ten models means ten pages. Give each one its own account here, or point several pages at one shared account if
          the agency prefers a single login.
        </p>
      </div>

      <div style={card}>
        <h2 style={h2s}>Remove an account</h2>
        {rows.map((a: Record<string, unknown>) => (
          <form key={String(a.id)} action={deleteAccount} style={rowStyle}>
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="id" value={String(a.id)} />
            <span style={emailCell}>{String(a.email)}</span>
            <button style={danger} type="submit">
              Delete
            </button>
          </form>
        ))}
        <p style={hint}>Deleting an account leaves its pages in place and simply marks them unassigned.</p>
      </div>
    </div>
  )
}
