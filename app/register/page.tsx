import Link from "next/link"
import type { CSSProperties } from "react"
import { register } from "./actions"

export const dynamic = "force-dynamic"

const ERRORS: Record<string, string> = {
  missing: "Email, password and a page name are all required.",
  short: "Use a password of at least 6 characters.",
  handle: "That page name is taken or not allowed. Try another.",
  email: "An account already exists for that email.",
  failed: "Something went wrong creating the account. Please try again.",
}

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
  maxWidth: 400,
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
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 6, marginBottom: 14 }
const footLink: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 16, display: "block", textAlign: "center" }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = searchParams ? await searchParams : {}
  const code = typeof query.error === "string" ? query.error : ""
  const message = ERRORS[code] || ""

  return (
    <main style={page}>
      <form action={register} style={card}>
        <div style={brand}>
          <span style={dot} />
          <span style={brandName}>Lander</span>
        </div>
        <div style={h1s}>Create your page</div>
        <p style={sub}>One account, one bio page. An admin can add more pages to you later.</p>

        {message ? <div style={err}>{message}</div> : null}

        <label style={lbl}>
          Page name
          <input style={input} name="handle" placeholder="ava" />
        </label>
        <p style={hint}>This becomes your public link, so keep it short and lowercase.</p>

        <label style={lbl}>
          Display name
          <input style={input} name="name" placeholder="Ava" />
        </label>
        <label style={lbl}>
          Email
          <input style={input} name="email" type="email" autoComplete="username" placeholder="you@agency.com" />
        </label>
        <label style={lbl}>
          Password
          <input style={input} name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" />
        </label>

        <button style={btn} type="submit">
          Create page
        </button>
        <Link href="/signin" style={footLink}>
          Already have an account? Sign in
        </Link>
      </form>
    </main>
  )
}
