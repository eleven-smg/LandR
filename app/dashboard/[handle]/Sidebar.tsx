"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type Props = {
  handle: string
  displayName: string
  photoUrl: string | null
  /** Only true when this account manages more than one page. */
  showHome?: boolean
  roleLabel?: string
  accountName?: string
}

type Item = { slug: string; label: string; icon: string }

// Slug "" is the analytics index at /dashboard/<handle>.
// The geoblocking slug is kept so existing links and bookmarks still work; the
// label is "Country rules" because nothing is actually blocked: flagged
// visitors see the normal page with different link destinations.
const ITEMS: Item[] = [
  { slug: "", label: "Analytics", icon: "chart" },
  { slug: "heatmap", label: "Best time", icon: "clock" },
  { slug: "experiments", label: "A/B tests", icon: "split" },
  { slug: "edit", label: "Page Editor", icon: "pencil" },
  { slug: "collections", label: "Collections", icon: "grid" },
  { slug: "geoblocking", label: "Country rules", icon: "globe" },
  { slug: "users", label: "Team", icon: "users" },
]

function NavIcon({ name }: { name: string }) {
  const common = {
    className: "nav-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    )
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <polyline points="3 17 9 11 13 15 21 7" />
      </svg>
    )
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    )
  }
  if (name === "split") {
    return (
      <svg {...common}>
        <path d="M12 20V10" />
        <path d="M12 10 6 4" />
        <path d="m12 10 6-6" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    )
  }
  if (name === "pencil") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    )
  }
  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    )
  }
  if (name === "globe") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  )
}

export default function Sidebar({
  handle,
  displayName,
  photoUrl,
  showHome = false,
  roleLabel = "Owner",
  accountName = "",
}: Props) {
  const pathname = usePathname() || ""
  const base = "/dashboard/" + handle
  const initial = (displayName || handle || "?").charAt(0).toUpperCase()

  return (
    <nav className="sidebar">
      <div className="logo">
        <div className="logo-dot" />
        <span>LandR</span>
      </div>

      {showHome ? (
        <Link href="/dashboard" className="nav-item">
          <NavIcon name="home" />
          <span>All models</span>
        </Link>
      ) : null}

      {showHome ? <div className="nav-current">{displayName}</div> : null}

      {ITEMS.map((it) => {
        const href = it.slug ? base + "/" + it.slug : base
        // Trailing slashes are normalised so /dashboard/ava/ still matches.
        const clean = pathname.replace(/\/+$/, "") || pathname
        const active = it.slug ? clean === href || clean.startsWith(href + "/") : clean === base
        return (
          <Link key={it.label} href={href} className={active ? "nav-item active" : "nav-item"}>
            <NavIcon name={it.icon} />
            <span>{it.label}</span>
          </Link>
        )
      })}

      <div className="sidebar-footer">
        <div className="avatar-sm">
          {photoUrl ? <img src={photoUrl} alt={displayName} /> : <span>{initial}</span>}
        </div>
        <div className="user-info">
          <div className="user-name">{accountName || displayName}</div>
          <div className="user-role">{roleLabel}</div>
        </div>
      </div>
    </nav>
  )
}
