"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { subscribeToTasks } from "@/lib/progress"

const TAP_CLASS = "landr-tapped"
const BUSY_CLASS = "landr-busy"

const css = [
  "@keyframes landrSlide { 0% { transform: translateX(-60%) } 100% { transform: translateX(260%) } }",
  ".landr-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 2147483000;",
  "  background: rgba(91,127,255,.20); pointer-events: none; overflow: hidden }",
  ".landr-bar > span { display: block; height: 100%; width: 38%;",
  "  background: linear-gradient(90deg, transparent, #5b7fff, #9ab0ff, transparent);",
  "  animation: landrSlide 1s linear infinite }",
  // The press feedback is opacity only. It must never touch pointer-events:
  // the browser picks the click target at pointer-up, so a button made
  // unclickable on pointerdown swallows its own first click.
  ".landr-tapped { opacity: .45 !important; cursor: progress !important;",
  "  transition: opacity .12s ease }",
  // Repeat taps are blocked instead, and only once the first click is away.
  ".landr-busy { pointer-events: none !important }",
].join(String.fromCharCode(10))

/**
 * Tapping anything that loads used to look identical to tapping nothing, so
 * links and buttons got tapped repeatedly and the same action ran several
 * times. Two signals now cover the whole site:
 *
 * 1. One bar at the top of every page for navigations and background saves.
 * 2. The button or link you actually tapped dims and stops taking further
 *    taps until the work finishes, so a second tap cannot queue up behind
 *    the first.
 *
 * Ordering matters. `pointerdown` only dims. The element is taken out of
 * hit-testing from the `click` handler on the next tick, once the browser has
 * finished dispatching the click that the user actually made.
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
      el.classList.remove(BUSY_CLASS)
      tappedRef.current.delete(el)
    }

    function pressable(target: EventTarget | null): HTMLElement | null {
      const el = target as HTMLElement | null
      if (!el || !el.closest) return null
      const hit = el.closest("button, a, [role=button]") as HTMLElement | null
      if (!hit) return null
      if (hit.hasAttribute("disabled") || hit.getAttribute("aria-disabled") === "true") {
        return null
      }
      return hit
    }

    function onPointerDown(event: Event) {
      // Sliders, colour pickers and file inputs live inside labels, not
      // buttons, so they are never caught here.
      const el = pressable(event.target)
      if (!el) return
      el.classList.add(TAP_CLASS)
      tappedRef.current.add(el)

      // Most taps are instant, for example switching a tab. Those release
      // after a blink. Anything still working keeps its button dimmed until
      // the work finishes, and 8 seconds is the hard ceiling either way.
      window.setTimeout(() => {
        if (!busyRef.current) release(el)
      }, 400)
      window.setTimeout(() => release(el), 8000)
    }

    function onClick(event: MouseEvent) {
      const el = pressable(event.target)

      if (el) {
        // A second tap while the first is still working: drop it before it
        // reaches React or the browser's default action.
        if (el.classList.contains(BUSY_CLASS)) {
          event.preventDefault()
          event.stopImmediatePropagation()
          return
        }
        // Let this click finish dispatching first, then stop taking taps.
        const target = el
        window.setTimeout(() => {
          if (tappedRef.current.has(target)) target.classList.add(BUSY_CLASS)
        }, 0)
      }

      if (event.defaultPrevented) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const node = event.target as HTMLElement | null
      const anchor = node && node.closest ? node.closest("a") : null
      if (!anchor) return
      const link = anchor as HTMLAnchorElement
      if (link.target === "_blank" || link.hasAttribute("download")) return
      const href = link.getAttribute("href") || ""
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      let url: URL
      try {
        url = new URL(link.href, window.location.href)
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
        el.classList.remove(BUSY_CLASS)
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
