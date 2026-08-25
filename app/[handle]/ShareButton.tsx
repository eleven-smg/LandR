"use client"

import { useState } from "react"

type ShareCapableNavigator = Navigator & {
  share?: (data: { title?: string; url?: string }) => Promise<void>
}

export default function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    const url = typeof window === "undefined" ? "" : window.location.href
    if (!url) return
    const nav = navigator as ShareCapableNavigator
    if (nav.share) {
      try {
        await nav.share({ title: name, url })
        return
      } catch {
        // The visitor dismissed the sheet, or sharing is blocked: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked; nothing useful left to try.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share this page"
      className="absolute right-4 top-4 z-30 flex h-9 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 text-xs text-white/80 backdrop-blur transition hover:bg-white/10 active:scale-95"
    >
      <span aria-hidden="true">&#8599;</span>
      {copied ? "Link copied" : "Share"}
    </button>
  )
}
