"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { subscribeToTasks } from "@/lib/progress"

const css = [
  "@keyframes landrSlide { 0% { transform: translateX(-60%) } 100% { transform: translateX(260%) } }",
  ".landr-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 2147483000;",
  "  background: rgba(91,127,255,.20); pointer-events: none; overflow: hidden }",
  ".landr-bar > span { display: block; height: 100%; width: 38%;",
  "  background: linear-gradient(90deg, transparent, #5b7fff, #9ab0ff, transparent);",
  "  animation: landrSlide 1s linear infinite }",
].join(String.fromCharCode(10))

/**
 * Tapping anything that loads used to look identical to tapping nothing, so
 * links and buttons got tapped repeatedly. This shows one bar at the top of
 * every page for both navigations and background saves.
 */
export default function GlobalProgress() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState(0)
  const [navigating, setNavigating] = useState(false)

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
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  const busy = navigating || tasks > 0

  // On a mouse, the cursor becomes a spinner as well.
  useEffect(() => {
    document.body.style.cursor = busy ? "progress" : ""
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
