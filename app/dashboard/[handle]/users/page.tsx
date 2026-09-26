import type { CSSProperties } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireDashboardAccess } from "@/lib/session"
import type { Account } from "@/lib/session"
import { linksAsModel, needsReleaseApproval, peopleByIds } from "@/lib/creatorTeam"
import { signOut } from "@/app/signin/actions"
import { inviteCreator, disconnectCreator, respondToWorkClaim } from "@/app/dashboard/actions"
import { addAccount, updateAccount, deleteAccount, assignPage, deletePage, updateOwnLogin } from "./actions"

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
const rowNote: CSSProperties = { color: "#6b7396", fontSize: 11 }
const warn: CSSProperties = {
  background: "rgba(250,204,21,0.10)",
  border: "1px solid rgba(250,204,21,0.30)",
  color: "#facc15",
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 12,
  marginBottom: 14,
}
const alarm: CSSProperties = {
  background: "rgba(248,113,113,0.10)",
  border: "1px solid rgba(248,113,113,0.30)",
  color: "#f87171",
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 12,
  marginBottom: 14,
}
const count: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 12 }
const me: CSSProperties = { color: "#8892a4", fontSize: 12 }
const pageRow: CSSProperties = { ...rowStyle }
const pageName: CSSProperties = { flex: 1, minWidth: 150, fontSize: 13 }
const personName: CSSProperties = { fontSize: 14, fontWeight: 600 }
const linkStyle: CSSProperties = { color: "#5b7fff", fontWeight: 600, textDecoration: "none" }
const fieldLabel: CSSProperties = { fontSize: 11, color: "#8892a4", textTransform: "uppercase", letterSpacing: 0.4 }

function Header({ account, subtitle }: { account: Account; subtitle: string }) {
  return (
    <div style={head}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={title}>Team</div>
        <div style={sub}>{subtitle}</div>
      </div>
      <form action={signOut} style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={me}>{account.email || account.username || ""}</span>
        <button style={ghost} type="submit">
          Sign out
        </button>
      </form>
    </div>
  )
}

/**
 * What a model (or the creator working on her page) sees: who reaches this
 * page, and her own login. Nothing here can create accounts, change roles or
 * delete pages -- those stayed with the agency admin, because every one of
 * those actions refuses a non-admin anyway and showing them was the whole
 * problem with the old tab.
 */
async function TeamForOwner({
  handle,
  account,
  creatorId,
  isOwner,
}: {
  handle: string
  account: Account
  creatorId: string
  isOwner: boolean
}) {
  const { data: pageRow } = await supabaseAdmin
    .from("creators")
    .select("account_id")
    .eq("id", creatorId)
    .maybeSingle()

  const ownerId = pageRow && (pageRow as Record<string, unknown>).account_id
    ? String((pageRow as Record<string, unknown>).account_id)
    : ""

  const links = ownerId ? await linksAsModel(ownerId) : []
  const people = await peopleByIds(links.map((l) => l.creatorAccountId))
  const claims = isOwner ? links.filter((l) => l.workClaim === "requested") : []

  return (
    <div style={wrap}>
      <Header
        account={account}
        subtitle={isOwner ? "Who works on your page, and your own login" : "Who works on this page"}
      />

      {claims.length > 0 ? (
        <div style={card}>
          <h2 style={h2s}>Approve who does the work</h2>
          <p style={{ ...sub, marginTop: 0 }}>
            Approve only if this is what you agreed. Afterwards you cannot disconnect them yourself &mdash; you have to
            ask, and they decide. Declining does not remove them.
          </p>
          {claims.map((link) => {
            const person = people[link.creatorAccountId]
            return (
              <div key={link.id} style={rowStyle}>
                <span style={emailCell}>
                  <span style={personName}>{person ? person.label : "A creator"}</span>
                  <span style={rowNote}>
                    {" "}
                    &mdash; {link.workClaimNote ? link.workClaimNote : "says they build and edit this page"}
                  </span>
                </span>
                <form action={respondToWorkClaim}>
                  <input type="hidden" name="linkId" value={link.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button style={primary} type="submit">
                    Approve
                  </button>
                </form>
                <form action={respondToWorkClaim}>
                  <input type="hidden" name="linkId" value={link.id} />
                  <input type="hidden" name="decision" value="decline" />
                  <button style={ghost} type="submit">
                    Decline
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      ) : null}

      <div style={card}>
        <h2 style={h2s}>Creators on this page</h2>
        {links.length === 0 ? (
          <p style={hint}>Nobody else works on this page yet.</p>
        ) : (
          links.map((link) => {
            const person = people[link.creatorAccountId]
            const locked = needsReleaseApproval(link)
            const status =
              link.status === "pending"
                ? "Waiting for them to accept"
                : link.status === "release_requested"
                  ? "Release requested \u2014 waiting for their approval"
                  : link.invitedBy === "creator"
                    ? "Set this page up, so a release needs their approval"
                    : link.workClaim === "approved"
                      ? "Approved as the one doing the work, so a release needs their approval"
                      : link.workClaim === "requested"
                        ? "Says they do the work \u2014 waiting on the approval above"
                        : "Invited by the page owner, who can disconnect any time"

            return (
              <div key={link.id} style={rowStyle}>
                <span style={emailCell}>
                  <span style={personName}>{person ? person.label : "A creator"}</span>
                  {person && person.email ? <span style={rowNote}> &mdash; {person.email}</span> : null}
                  <div style={rowNote}>{status}</div>
                </span>
                {isOwner && link.status !== "release_requested" ? (
                  <form action={disconnectCreator}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button style={danger} type="submit">
                      {link.status === "pending" ? "Withdraw" : locked ? "Request release" : "Disconnect"}
                    </button>
                  </form>
                ) : null}
              </div>
            )
          })
        )}
        <p style={hint}>
          {isOwner
            ? "You always own this page. A creator's access is a connection you can end, unless they built the page or you approved that they do the work."
            : "Only the page owner can change these connections. Yours is on your "}
          {isOwner ? null : (
            <Link style={linkStyle} href="/dashboard">
              home screen
            </Link>
          )}
          {isOwner ? null : "."}
        </p>
      </div>

      {isOwner ? (
        <div style={card}>
          <h2 style={h2s}>Add a creator to your team</h2>
          <p style={{ ...sub, marginTop: 0 }}>
            They need an account already. Nothing is shared until they accept.
          </p>
          <form action={inviteCreator} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              style={{ ...input, flex: 1, minWidth: 200 }}
              name="email"
              type="email"
              placeholder="their email address"
            />
            <button style={primary} type="submit">
              Send request
            </button>
          </form>
        </div>
      ) : null}

      <div style={card}>
        <h2 style={h2s}>Your login</h2>
        <form action={updateOwnLogin} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <input type="hidden" name="handle" value={handle} />
          <label style={fieldLabel}>
            Name
            <br />
            <input
              style={{ ...input, width: 180, marginTop: 6 }}
              name="name"
              defaultValue={account.name || ""}
              placeholder="the name staff see"
            />
          </label>
          <label style={fieldLabel}>
            New password
            <br />
            <input
              style={{ ...input, width: 180, marginTop: 6 }}
              name="password"
              type="text"
              autoComplete="off"
              placeholder="leave empty to keep it"
            />
          </label>
          <button style={primary} type="submit">
            Save
          </button>
        </form>
        <p style={hint}>
          You sign in as {account.email || account.username || "this account"}. Changing the email or the role, adding
          another login, or deleting a page is the agency admin&rsquo;s job.
        </p>
      </div>
    </div>
  )
}

/** The original workspace-wide account management, now admin-only in the UI as well as in the actions. */
async function TeamForAdmin({ handle, account }: { handle: string; account: Account }) {
  const { data: accounts } = await supabaseAdmin
    .from("accounts")
    .select("id, email, username, name, password, role, created_at")
    .order("created_at", { ascending: true })

  const { data: creators } = await supabaseAdmin
    .from("creators")
    .select("id, handle, display_name, account_id")
    .order("created_at", { ascending: true })

  const rows = accounts || []
  const pages = creators || []

  const labelFor = (a: Record<string, unknown>) => String(a.email || a.username || a.name || String(a.id).slice(0, 8))

  const emailById = new Map<string, string>(rows.map((a: Record<string, unknown>) => [String(a.id), labelFor(a)]))

  return (
    <div style={wrap}>
      <Header account={account} subtitle="Every login and page in this workspace" />

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
            <span style={emailCell}>{labelFor(a)}</span>
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
              <option value="creator">Creator</option>
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
          <input style={{ ...input, flex: 1, minWidth: 190 }} name="email" type="email" placeholder="their email address" />
          <input style={{ ...input, width: 150 }} name="name" placeholder="Display name" />
          <input style={{ ...input, width: 140 }} name="password" placeholder="Password" />
          <select style={{ ...input, width: 100 }} name="role" defaultValue="model">
            <option value="model">Model</option>
            <option value="creator">Creator</option>
            <option value="admin">Admin</option>
          </select>
          <button style={primary} type="submit">
            Add account
          </button>
        </form>
        <p style={hint}>
          A model signs in at /signin with this email and password and sees her own page. A creator sees a home screen
          with every model who has connected to him. Admins see everything.
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
                  {labelFor(a)}
                </option>
              ))}
            </select>
            <button style={ghost} type="submit">
              Save
            </button>
          </form>
        ))}
        <p style={hint}>
          A page belongs to the model who runs it. A creator reaches it through a connection on the Team tab, never by
          being set as the owner here.
        </p>
      </div>

      <div style={card}>
        <h2 style={h2s}>Remove an account</h2>
        {rows.map((a: Record<string, unknown>) => (
          <form key={String(a.id)} action={deleteAccount} style={rowStyle}>
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="id" value={String(a.id)} />
            <span style={emailCell}>{labelFor(a)}</span>
            <button style={danger} type="submit">
              Delete
            </button>
          </form>
        ))}
        <p style={hint}>Deleting an account leaves its pages in place and simply marks them unassigned.</p>
      </div>

      <div style={card}>
        <h2 style={h2s}>Delete a page</h2>
        <div style={alarm}>
          Deleting a page also deletes its links, its views and clicks, and its email subscribers. There is no undo.
          Photos and videos already uploaded stay in storage.
        </div>
        {pages.length === 0 ? <p style={hint}>No pages yet.</p> : null}
        {pages.map((p: Record<string, unknown>) => {
          const pageHandle = String(p.handle || "")
          const owner = p.account_id ? emailById.get(String(p.account_id)) || "" : ""
          const isCurrent = pageHandle.toLowerCase() === handle.toLowerCase()
          return (
            <form key={String(p.id)} action={deletePage} style={pageRow}>
              <input type="hidden" name="handle" value={handle} />
              <input type="hidden" name="page_id" value={String(p.id)} />
              <span style={pageName}>
                {String(p.display_name || p.handle)} <span style={{ color: "#6b7396" }}>/{pageHandle}</span>
                <span style={rowNote}> {owner ? "\u2014 " + owner : "\u2014 unassigned"}</span>
              </span>
              {isCurrent ? (
                <span style={rowNote}>This is the dashboard you are in. Delete it from another page.</span>
              ) : (
                <>
                  <input
                    style={{ ...input, width: 180 }}
                    name="confirm_handle"
                    placeholder={"type " + pageHandle + " to confirm"}
                    autoComplete="off"
                  />
                  <button style={danger} type="submit">
                    Delete page
                  </button>
                </>
              )}
            </form>
          )
        })}
        <p style={hint}>
          The handle has to match the page being deleted, so nothing happens if the box is empty or misspelled. Use this
          to clear out duplicate or test pages.
        </p>
      </div>
    </div>
  )
}

export default async function TeamPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  // The layout gates the tabs, but this page reads other people's accounts, so
  // it asks for itself rather than trusting that it was reached through one.
  const access = await requireDashboardAccess(handle)
  if (!access) redirect("/signin?next=/dashboard/" + handle + "/users")

  if (access.account.role === "admin") {
    return <TeamForAdmin handle={access.creator.handle} account={access.account} />
  }

  return (
    <TeamForOwner
      handle={access.creator.handle}
      account={access.account}
      creatorId={access.creator.id}
      isOwner={access.isOwner}
    />
  )
}
