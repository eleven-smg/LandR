"use client"

import { useEffect } from "react"

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function stored(store: Storage | null, key: string) {
  if (!store) return ""
  try {
    const found = store.getItem(key)
    if (found) return found
    const made = newId()
    store.setItem(key, made)
    return made
  } catch {
    return ""
  }
}

export default function Tracker({ viewId }: { viewId: string }) {
  useEffect(() => {
    if (!viewId) return

    const visitorId = stored(typeof localStorage === "undefined" ? null : localStorage, "landr_vid")
    const sessionId = stored(typeof sessionStorage === "undefined" ? null : sessionStorage, "landr_sid")
    const startedAt = Date.now()

    const payload = (duration: number) =>
      JSON.stringify({
        viewId,
        visitorId,
        sessionId,
        duration,
        language: navigator.language || "",
        screen: window.screen ? window.screen.width + "x" + window.screen.height : "",
      })

    const send = (duration: number) => {
      const body = payload(duration)
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {})
    }

    const leave = () => {
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      const body = payload(seconds)
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))
        return
      }
      send(seconds)
    }

    const onHidden = () => {
      if (document.visibilityState === "hidden") leave()
    }

    send(0)
    const timer = window.setInterval(() => send(Math.round((Date.now() - startedAt) / 1000)), 15000)
    window.addEventListener("pagehide", leave)
    document.addEventListener("visibilitychange", onHidden)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener("pagehide", leave)
      document.removeEventListener("visibilitychange", onHidden)
    }
  }, [viewId])

  return null
}
