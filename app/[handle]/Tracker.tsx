"use client"

import { useEffect } from "react"

const CONSENT_KEY = "landr_consent"
const CONSENT_EVENT = "landr-consent"
const CONSENT_MARKER = '[data-landr-consent="required"]'

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

/** True when the page rendered a consent banner, i.e. asking is required. */
function consentRequired() {
  try {
    return !!document.querySelector(CONSENT_MARKER)
  } catch {
    return false
  }
}

function consentAccepted() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted"
  } catch {
    return false
  }
}

/**
 * Reports how long the visitor stayed, and keeps the ids that turn raw views
 * into visitors and sessions.
 *
 * When a consent banner is present nothing here runs -- no id is written, no
 * ping is sent -- until the visitor accepts. Declining leaves the page with
 * only the anonymous view the server already recorded while building the HTML.
 */
export default function Tracker({ viewId }: { viewId: string }) {
  useEffect(() => {
    if (!viewId) return

    let stop: (() => void) | null = null

    const start = () => {
      if (stop) return

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

      stop = () => {
        window.clearInterval(timer)
        window.removeEventListener("pagehide", leave)
        document.removeEventListener("visibilitychange", onHidden)
      }
    }

    if (!consentRequired() || consentAccepted()) {
      start()
      return () => {
        if (stop) stop()
      }
    }

    // Banner is up: wait for the answer, and start mid-visit if it is yes.
    const onConsent = () => {
      if (consentAccepted()) start()
    }

    window.addEventListener(CONSENT_EVENT, onConsent)

    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent)
      if (stop) stop()
    }
  }, [viewId])

  return null
}
