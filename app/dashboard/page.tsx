import type { CSSProperties } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession, getManagedPages } from "@/lib/session"
import { linksAsCreator, linksAsModel, needsReleaseApproval, peopleByIds, totalsByCreator } from "@/lib/creatorTeam"
import { signOut } from "@/app/signin/actions"
import {
  inviteCreator,
  respondToRequest,
  respondToWorkClaim,
  withdrawWorkClaim,
  disconnectCreator,
  approveRelease,
  refuseRelease,
  createModelAccount,
} from "./actions"

export const dynamic = "force-dynamic"

const page: CSSProperties = { minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", padding: "28px 20px 60px" }
const wrap: CSSProperties = { maxWidth: 1000, margin: "0 auto" }
const topRow: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }
const brand: CSSProperties = { display: "flex", alignItems: "center", gap: 8 }
const dot: CSSProperties = { width: 8, height: 8, borderRadius: 999, background: "#4ade80" }
const brandName: CSSProperties = { fontSize: 18, fontWeight: 700, color: "#5b7fff" }
const h1s: CSSProperties = { fontSize: 22, fontWeight: 700, marginTop: 22 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const section: CSSProperties = { marginTop: 30 }
const sectionTitle: CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8892a4" }
const card: CSSProperties = { background: "#181c27", border: "1px solid #232940", borderRadius: 14, padding: 16, marginTop: 12 }
const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12, marginTop: 12 }
const modelCard: CSSProperties = { ...card, marginTop: 0, display: "block", textDecoration: "none", color: "#e2e8f0" }
const avatarRow: CSSProperties = { display: "flex", alignItems: "center", gap: 10 }
const avatar: CSSProperties = { width: 38, height: 38, borderRadius: 999, objectFit: "cover", background: "#232940" }
const avatarBlank: CSSProperties = { ...avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#8892a4" }
const nameStyle: CSSProperties = { fontWeight: 700, fontSize: 15 }
const handleStyle: CSSProperties = { color: "#6b7396", fontSize: 12 }
const statRow: CSSProperties = { display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: "1px solid #232940" }
const statValue: CSSProperties = { fontSize: 17, fontWeight: 700 }
const statLabel: CSSProperties = { fontSize: 10, color: "#6b7396", textTransform: "uppercase", letterSpacing: 0.4 }
const badge: CSSProperties = { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#232940", color: "#8892a4" }
const rowItem: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid #232940" }
const lbl: CSSProperties = { fontSize: 11, color: "#8892a4", textTransform: "uppercase", letterSpacing: 0.4, display: "block" }
const input: CSSProperties = { width: "100%", padding: "9px 11px", background: "#0f1117", border: "1px solid #232940", borderRadius: 8, color: "#fff", marginTop: 6, boxSizing: "border-box" }
const btn: CSSProperties = { padding: "9px 14px", background: "#5b7fff", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }
const btnQuiet: CSSProperties = { ...btn, background: "#232940" }
const btnDanger: CSSProperties = { ...btn, background: "rgba(248,113,113,0.15)", color: "#fca5a5" }
const msgBox: CSSProperties = { background: "rgba(91,127,255,0.12)", border: "1px solid rgba(91,127,255,0.35)", color: "#c7d2fe", borderRadius: 8, padding: "9px 11px", fontSize: 12, marginTop: 16 }
const formGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 6 }
const emptyNote: CSSProperties = { color: "#6b7396", fontSize: 13, marginTop: 10 }
const linkBtn: CSSProperties = { ...btn, textDecoration: "none", display: "inline-block" }
const claimBox: CSSProperties = { border: "1px solid #232940", borderRadius: 10, padding: "10px 12px", marginTop: 4, display: "grid", gap: 8, minWidth: 260 }
const claimLabel: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#c7d2fe", lineHeight: 1.4 }
const note: CSSProperties = { fontSize: 11, color: "#6b7396", lineHeight: 1.5 }

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?"
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = searchParams ? await searchParams : {}
  const msg = typeof query.msg === "string" ? query.msg : ""

  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const [pages, creatorLinks, modelLinks] = await Promise.all([
    getManagedPages(account),
    linksAsCreator(account.id),
    linksAsModel(account.id),
  ])

  // A plain model with one page and no team arrangements should never see this
  // screen -- she goes straight to her own dashboard, exactly as before.
  if (pages.length === 1 && creatorLinks.length === 0 && modelLinks.length === 0 && !msg) {
    redirect("/dashboard/" + pages[0].handle)
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const totals = await totalsByCreator(
    pages.map((p) => p.id),
    since,
  )

  const people = await peopleByIds([
    ...creatorLinks.map((l) => l.modelAccountId),
    ...modelLinks.map((l) => l.creatorAccountId),
  ])

  const requests = creatorLinks.filter((l) => l.status === "pending")
  const releaseRequests = creatorLinks.filter((l) => l.status === "release_requested")
  // Claims he made that she has not answered yet, and claims she has to answer.
  const myOpenClaims = creatorLinks.filter((l) => l.workClaim === "requested")
  const claimsToAnswer = modelLinks.filter((l) => l.workClaim === "requested")
  const ownsAPage = pages.some((p) => p.access === "own")

  return (
    <main style={page}>
      <div style={wrap}>
        <div style={topRow}>
          <div style={brand}>
            <span style={dot} />
            <span style={brandName}>LandR</span>
          </div>
          <form action={signOut}>
            <button style={btnQuiet} type="submit">
              Sign out
            </button>
          </form>
        </div>

        <h1 style={h1s}>Home</h1>
        <p style={sub}>
          {pages.length === 0
            ? "No pages yet. Create a model below, or ask a model to add your email to her team."
            : "Every page you can work on. Open one to get its full dashboard."}
        </p>

        {msg ? <div style={msgBox}>{msg}</div> : null}

        {requests.length > 0 ? (
          <section style={section}>
            <div style={sectionTitle}>Requests waiting for you</div>
            <div style={card}>
              {requests.map((link) => {
                const person = people[link.modelAccountId]
                return (
                  <div key={link.id} style={rowItem}>
                    <div>
                      <div style={nameStyle}>{person ? person.label : "A model"}</div>
                      <div style={handleStyle}>
                        {person && person.email ? person.email : "wants you to manage her page"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <form action={respondToRequest} style={claimBox}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="decision" value="accept" />
                        <label style={claimLabel}>
                          <input type="checkbox" name="claimWork" style={{ marginTop: 2 }} />
                          <span>I am the one who will build and edit this page, not just manage it</span>
                        </label>
                        <input
                          style={{ ...input, marginTop: 0 }}
                          name="claimNote"
                          placeholder="What you agreed (optional)"
                        />
                        <p style={note}>
                          If you tick this, she has to approve it. Once she does, she can no longer disconnect you on
                          her own &mdash; she has to ask, and you decide. Until she approves, she can.
                        </p>
                        <button style={btn} type="submit">
                          Accept
                        </button>
                      </form>
                      <form action={respondToRequest}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="decision" value="decline" />
                        <button style={btnQuiet} type="submit">
                          Decline
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {claimsToAnswer.length > 0 ? (
          <section style={section}>
            <div style={sectionTitle}>Who is building your page</div>
            <div style={card}>
              <p style={{ ...sub, marginTop: 0 }}>
                This creator says he is the one doing the work on your page. Approve it only if that is what you agreed:
                after that you cannot disconnect him yourself, you have to ask him and he has to agree. Declining does
                not remove him &mdash; he keeps access and you keep the right to disconnect any time.
              </p>
              {claimsToAnswer.map((link) => {
                const person = people[link.creatorAccountId]
                return (
                  <div key={link.id} style={rowItem}>
                    <div>
                      <div style={nameStyle}>{person ? person.label : "A creator"}</div>
                      <div style={handleStyle}>
                        {link.workClaimNote ? link.workClaimNote : "claims he builds and edits your page"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <form action={respondToWorkClaim}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button style={btn} type="submit">
                          Approve
                        </button>
                      </form>
                      <form action={respondToWorkClaim}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="decision" value="decline" />
                        <button style={btnQuiet} type="submit">
                          Decline
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {myOpenClaims.length > 0 ? (
          <section style={section}>
            <div style={sectionTitle}>Your work claims</div>
            <div style={card}>
              <p style={{ ...sub, marginTop: 0 }}>
                Waiting for her approval. Until she approves, she can still disconnect you, so hold off on the heavy
                work.
              </p>
              {myOpenClaims.map((link) => {
                const person = people[link.modelAccountId]
                return (
                  <div key={link.id} style={rowItem}>
                    <div>
                      <div style={nameStyle}>{person ? person.label : "A model"}</div>
                      <div style={handleStyle}>Waiting for her to approve that you do the work</div>
                    </div>
                    <form action={withdrawWorkClaim}>
                      <input type="hidden" name="linkId" value={link.id} />
                      <button style={btnQuiet} type="submit">
                        Withdraw claim
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {releaseRequests.length > 0 ? (
          <section style={section}>
            <div style={sectionTitle}>Release requests</div>
            <div style={card}>
              {releaseRequests.map((link) => {
                const person = people[link.modelAccountId]
                return (
                  <div key={link.id} style={rowItem}>
                    <div>
                      <div style={nameStyle}>{person ? person.label : "A model"}</div>
                      <div style={handleStyle}>
                        {link.releaseNote ? link.releaseNote : "asks to run her page on her own"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <form action={approveRelease}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <button style={btn} type="submit">
                          Release her
                        </button>
                      </form>
                      <form action={refuseRelease}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <button style={btnQuiet} type="submit">
                          Not yet
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        <section style={section}>
          <div style={{ ...topRow, alignItems: "baseline" }}>
            <div style={sectionTitle}>Your pages ({pages.length})</div>
            {pages.length > 1 ? (
              <Link style={linkBtn} href="/dashboard/compare">
                Compare models
              </Link>
            ) : null}
          </div>

          {pages.length === 0 ? (
            <p style={emptyNote}>Nothing to show yet.</p>
          ) : (
            <div style={grid}>
              {pages.map((p) => {
                const stat = totals[p.id] || { views: 0, clicks: 0 }
                return (
                  <Link key={p.id} href={"/dashboard/" + p.handle} style={modelCard}>
                    <div style={avatarRow}>
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photoUrl} alt="" style={avatar} />
                      ) : (
                        <div style={avatarBlank}>{initials(p.displayName)}</div>
                      )}
                      <div>
                        <div style={nameStyle}>{p.displayName}</div>
                        <div style={handleStyle}>/{p.handle}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <span style={badge}>
                        {p.access === "own" ? "Your page" : p.access === "admin" ? "Admin" : "Managed"}
                      </span>
                    </div>
                    <div style={statRow}>
                      <div>
                        <div style={statValue}>{stat.views}</div>
                        <div style={statLabel}>Views 7d</div>
                      </div>
                      <div>
                        <div style={statValue}>{stat.clicks}</div>
                        <div style={statLabel}>Clicks 7d</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {modelLinks.length > 0 ? (
          <section style={section}>
            <div style={sectionTitle}>Creators on your team</div>
            <div style={card}>
              {modelLinks.map((link) => {
                const person = people[link.creatorAccountId]
                const locked = needsReleaseApproval(link)
                const createdByCreator = link.invitedBy === "creator"
                return (
                  <div key={link.id} style={rowItem}>
                    <div>
                      <div style={nameStyle}>{person ? person.label : "A creator"}</div>
                      <div style={handleStyle}>
                        {link.status === "pending"
                          ? "Waiting for them to accept"
                          : link.status === "release_requested"
                            ? "Release requested \u2014 waiting for their approval"
                            : createdByCreator
                              ? "Set up your page, so a release needs their approval"
                              : link.workClaim === "approved"
                                ? "You approved that they do the work, so a release needs their approval"
                                : link.workClaim === "requested"
                                  ? "Says they do the work \u2014 your approval is still open"
                                  : "You invited them, so you can disconnect any time"}
                      </div>
                    </div>
                    {link.status === "release_requested" ? null : (
                      <form action={disconnectCreator}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <button style={btnDanger} type="submit">
                          {link.status === "pending" ? "Withdraw" : locked ? "Request release" : "Disconnect"}
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        <section style={section}>
          <div style={sectionTitle}>Add a model</div>
          <div style={card}>
            <p style={{ ...sub, marginTop: 0 }}>
              Creates her login and her page. She owns the page and signs in with this username; she can add an email
              later. Because you set her up, she cannot disconnect you without your agreement.
            </p>
            <form action={createModelAccount}>
              <div style={formGrid}>
                <label style={lbl}>
                  Display name
                  <input style={input} name="displayName" placeholder="Ava" />
                </label>
                <label style={lbl}>
                  Page address
                  <input style={input} name="handle" placeholder="ava" />
                </label>
                <label style={lbl}>
                  Username
                  <input style={input} name="username" placeholder="ava" autoComplete="off" />
                </label>
                <label style={lbl}>
                  Password
                  <input style={input} name="password" type="text" placeholder="at least 6 characters" autoComplete="off" />
                </label>
              </div>
              <button style={{ ...btn, marginTop: 14 }} type="submit">
                Create model
              </button>
            </form>
          </div>
        </section>

        {ownsAPage ? (
          <section style={section}>
            <div style={sectionTitle}>Add a creator to your team</div>
            <div style={card}>
              <p style={{ ...sub, marginTop: 0 }}>
                Enter a creator&rsquo;s email to ask them to run your page. Nothing is shared until they accept. You can
                disconnect them whenever you like, unless you later approve that they are the one building the page.
              </p>
              <form action={inviteCreator} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label style={{ ...lbl, flex: "1 1 220px" }}>
                  Creator email
                  <input style={input} name="email" type="email" placeholder="creator@agency.com" />
                </label>
                <button style={btn} type="submit">
                  Send request
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
