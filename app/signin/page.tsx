import type { CSSProperties } from "react"
import Link from "next/link"
import { signIn } from "./actions"

export const dynamic = "force-dynamic"

const page: CSSProperties = {
  minHeight: "100vh",
  background: "#0f1117",
  color: "#e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
}
const card: CSSProperties = {
  width: "100%",
  maxWidth: 380,
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 24,
}
const brand: CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }
const dot: CSSProperties = { width: 8, height: 8, borderRadius: 999, background: "#4ade80" }
const brandName: CSSProperties = { fontSize: 18, fontWeight: 700, color: "#5b7fff" }
const h1s: CSSProperties = { fontSize: 18, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4, marginBottom: 16 }
const lbl: CSSProperties = { fontSize: 11, color: "#8892a4", textTransform: "uppercase", letterSpacing: 0.4 }
const input: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  marginTop: 6,
  marginBottom: 14,
  boxSizing: "border-box",
}
const btn: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "#5b7fff",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
}
const err: CSSProperties = {
  background: "rgba(248,113,113,0.12)",
  border: "1px solid rgba(248,113,113,0.35)",
  color: "#fca5a5",
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 12,
  marginBottom: 14,
}
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 14 }
const footRow: CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid #232940",
  fontSize: 12,
  color: "#8892a4",
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
}
const linkStyle: CSSProperties = { color: "#5b7fff", fontWeight: 600, textDecoration: "none" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = searchParams ? await searchParams : {}
  const error = query.error
  const next = typeof query.next === "string" ? query.next : ""

  return (
    <main style={page}>
      <form action={signIn} style={card}>
        <div style={brand}>
          <span style={dot} />
          <span style={brandName}>LandR</span>
        </div>
        <div style={h1s}>Welcome back</div>
        <p style={sub}>Sign in with the email and password your agency gave you.</p>

        {error === "1" ? <div style={err}>That email and password combination did not match.</div> : null}
        {error === "2" ? <div style={err}>Signed in, but no page is assigned to this account yet.</div> : null}

        <input type="hidden" name="next" value={next} />
        <label style={lbl}>
          Email
          <input style={input} name="email" type="email" autoComplete="username" placeholder="you@agency.com" />
        </label>
        <label style={lbl}>
          Password
          <input style={input} name="password" type="password" autoComplete="current-password" placeholder="********" />
        </label>
        <button style={btn} type="submit">
          Sign in
        </button>
        <p style={hint}>Lost your password? Ask the agency admin to read it back to you from the Users tab.</p>
        <div style={footRow}>
          <span>New model account?</span>
          <Link style={linkStyle} href="/register">
            Create one &rarr;
          </Link>
        </div>
      </form>
    </main>
  )
}
