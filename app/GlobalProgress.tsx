"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { subscribeToTasks } from "@/lib/progress"

const TAP_CLASS = "landr-tapped"

const css = [
  "@keyframes landrSlide { 0% { transform: translateX(-60%) } 100% { transform: translateX(260%) } }",
  ".landr-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 2147483000;",
  "  background: rgba(91,127,255,.20); pointer-events: none; overflow: hidden }",
  ".landr-bar > span { display: block; height: 100%; width: 38%;",
  "  background: linear-gradient(90deg, transparent, #5b7fff, #9ab0ff, transparent);",
  "  animation: landrSlide 1s linear infinite }",
  ".landr-tapped { opacity: .45 !important; pointer-events: none !important;",
  "  cursor: progress !important; transition: opacity .12s ease }",
].join(String.fromCharCode(10))

/**
 * Tapping anything that loads used to look identical to tapping nothing, so
 * links and buttons got tapped repeatedly and the same action ran several
 * times. Two signals now cover the whole site:
 *
 * 1. One bar at the top of every page for navigations and background saves.
 * 2. The button or link you actually tapped dims and stops taking taps until
 *    the work finishes, so a second tap cannot queue up behind the first.
 */
export default function GlobalProgress() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState(0)
  const [navigating, setNavigating] = useState(false)
  const busyRef = useRef(false)
  const tappedRef = useRef<Set<HTMLElement>>(new Set())

  useEffect(() => subscribeToTasks(setTasks), [])

  // The new page has rendered, so the navigation is over.
  useEffect(() => {
    setNavigating(false)
  }, [pathname])

  // A safety net: never leave the bar spinning forever if a navigation is
  // cancelled or blocked.
  useEffect(() => {
    if (!navigating) return
    const timer = window.setTimeout(() => setNavigating(false), 15000)
    return () => window.clearTimeout(timer)
  }, [navigating])

  useEffect(() => {
    function release(el: HTMLElement) {
      el.classList.remove(TAP_CLASS)
      tappedRef.current.delete(el)
    }

    function onPointerDown(event: Event) {
      const target = event.target as HTMLElement | null
      if (!target || !target.closest) return
      const el = target.closest("button, a, [role=button]") as HTMLElement | null
      if (!el) return
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return
      // Sliders, colour pickers and file inputs live inside labels, not buttons,
      // so they are never caught here.
      el.classList.add(TAP_CLASS)
      tappedRef.current.add(el)

      // Most taps are instant, for example switching a tab. Those release after
      // a blink. Anything still working keeps its button dimmed until the work
      // finishes, and 8 seconds is the hard ceiling either way.
      window.setTimeout(() => {
        if (!busyRef.current) release(el)
      }, 400)
      window.setTimeout(() => release(el), 8000)
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const anchor = target && target.closest ? target.closest("a") : null
      if (!anchor) return
      const el = anchor as HTMLAnchorElement
      if (el.target === "_blank" || el.hasAttribute("download")) return
      const href = el.getAttribute("href") || ""
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      let url: URL
      try {
        url = new URL(el.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      setNavigating(true)
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("click", onClick, true)
    }
  }, [])

  const busy = navigating || tasks > 0

  // On a mouse, the cursor becomes a spinner as well, and everything that was
  // dimmed comes back to life the moment the work is done.
  useEffect(() => {
    busyRef.current = busy
    document.body.style.cursor = busy ? "progress" : ""
    if (!busy) {
      for (const el of Array.from(tappedRef.current)) {
        el.classList.remove(TAP_CLASS)
        tappedRef.current.delete(el)
      }
    }
    return () => {
      document.body.style.cursor = ""
    }
  }, [busy])

  return (
    <>
      <style>{css}</style>
      {busy ? (
        <div className="landr-bar" role="progressbar" aria-label="Loading">
          <span />
        </div>
      ) : null}
    </>
  )
}
