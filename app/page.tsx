import Link from "next/link"
import type { CSSProperties } from "react"

export const metadata = {
  title: "Lander — one link for everything you share",
  description: "Build a link in bio page with smart routing, geoblocking, link rotation and real analytics.",
}

const page: CSSProperties = { minHeight: "100vh", background: "#0b0d13", color: "#e8ecf5" }
const nav: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 22px",
  maxWidth: 1040,
  margin: "0 auto",
}
const brand: CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18 }
const dot: CSSProperties = { width: 8, height: 8, borderRadius: 999, background: "#4ade80" }
const navLinks: CSSProperties = { display: "flex", gap: 10, alignItems: "center" }
const ghostLink: CSSProperties = {
  padding: "9px 14px",
  borderRadius: 999,
  color: "#cdd6f4",
  textDecoration: "none",
  fontSize: 14,
}
const solidLink: CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  background: "#5b7fff",
  color: "#fff",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
}
const hero: CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "70px 22px 40px", textAlign: "center" }
const h1s: CSSProperties = { fontSize: 42, lineHeight: 1.1, fontWeight: 800, letterSpacing: -0.5 }
const lead: CSSProperties = { marginTop: 16, fontSize: 17, lineHeight: 1.6, color: "#9aa4c2" }
const ctaRow: CSSProperties = { marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }
const grid: CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "20px 22px 70px",
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
}
const card: CSSProperties = {
  background: "#141824",
  border: "1px solid #212840",
  borderRadius: 16,
  padding: 20,
}
const cardTitle: CSSProperties = { fontSize: 15, fontWeight: 700 }
const cardBody: CSSProperties = { marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#8892a4" }
const foot: CSSProperties = {
  borderTop: "1px solid #212840",
  padding: "20px 22px",
  textAlign: "center",
  color: "#5f6885",
  fontSize: 12,
}

const FEATURES = [
  {
    title: "Country routing",
    body: "Send visitors from one country to a different destination, or block them and redirect the whole group at once.",
  },
  {
    title: "Link rotation",
    body: "Point one button at several URLs and traffic splits evenly across them, in order, with no repeats.",
  },
  {
    title: "Real analytics",
    body: "Views, unique visitors, sessions, time on page, referrers, countries, devices and per-link clicks.",
  },
  {
    title: "Video and embeds",
    body: "Upload a clip that plays inline and taps through to any destination, or embed TikTok, YouTube and more.",
  },
  {
    title: "Collections",
    body: "Group pages so a whole roster shares one redirect instead of configuring every page by hand.",
  },
  {
    title: "Your own look",
    body: "Photo or video backgrounds, three page templates, custom button colours, shapes, icons and ordering.",
  },
]

export default function Home() {
  return (
    <main style={page}>
      <nav style={nav}>
        <span style={brand}>
          <span style={dot} />
          Lander
        </span>
        <span style={navLinks}>
          <Link href="/signin" style={ghostLink}>
            Sign in
          </Link>
          <Link href="/register" style={solidLink}>
            Create a page
          </Link>
        </span>
      </nav>

      <section style={hero}>
        <h1 style={h1s}>One link for everything you share.</h1>
        <p style={lead}>
          Build a bio page in minutes, route traffic by country, rotate links, and see exactly where your visitors come
          from and what they tap.
        </p>
        <div style={ctaRow}>
          <Link href="/register" style={solidLink}>
            Create a page
          </Link>
          <Link href="/signin" style={{ ...ghostLink, border: "1px solid #212840" }}>
            Sign in to your dashboard
          </Link>
        </div>
      </section>

      <section style={grid}>
        {FEATURES.map((f) => (
          <div key={f.title} style={card}>
            <div style={cardTitle}>{f.title}</div>
            <p style={cardBody}>{f.body}</p>
          </div>
        ))}
      </section>

      <footer style={foot}>Lander</footer>
    </main>
  )
}
