"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { Tweet } from "react-tweet"

type Embed = { id: string; label: string; url: string }

type Info = {
  platform: string
  kind: "iframe" | "tweet" | "threads" | "link"
  src?: string
  tweetId?: string
  url: string
  mode: "wide" | "portrait" | "tall"
}

const ICON: Record<string, string> = {
  youtube: "https://cdn.simpleicons.org/youtube/white",
  tiktok: "https://cdn.simpleicons.org/tiktok/white",
  telegram: "https://cdn.simpleicons.org/telegram/white",
  x: "https://cdn.simpleicons.org/x/white",
  threads: "https://cdn.simpleicons.org/threads/white",
  instagram: "https://cdn.simpleicons.org/instagram/white",
  link: "https://cdn.simpleicons.org/googlechrome/white",
}

function parse(url: string): Info {
  try {
    const u = new URL(url)
    const host = u.hostname.replace("www.", "")
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      const last = u.pathname.split("/").filter(Boolean).pop()
      const id = v || last || ""
      return { platform: "youtube", kind: "iframe", src: `https://www.youtube.com/embed/${id}`, url, mode: "wide" }
    }
    if (host.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0] || ""
      return { platform: "youtube", kind: "iframe", src: `https://www.youtube.com/embed/${id}`, url, mode: "wide" }
    }
    if (host.includes("tiktok.com")) {
      const m = u.pathname.match(/video\/(\d+)/)
      const id = m ? m[1] : ""
      return { platform: "tiktok", kind: "iframe", src: `https://www.tiktok.com/player/v1/${id}`, url, mode: "portrait" }
    }
    if (host === "t.me" || host.includes("telegram.me")) {
      const path = u.pathname.split("/").filter(Boolean).join("/")
      return { platform: "telegram", kind: "iframe", src: `https://t.me/${path}?embed=1&dark=1`, url, mode: "tall" }
    }
    if (host === "x.com" || host.includes("twitter.com")) {
      const m = u.pathname.match(/status\/(\d+)/)
      const id = m ? m[1] : ""
      return { platform: "x", kind: "tweet", tweetId: id, url, mode: "tall" }
    }
    if (host.includes("threads.net") || host.includes("threads.com")) {
      return { platform: "threads", kind: "threads", url, mode: "tall" }
    }
    if (host.includes("instagram.com")) {
      const parts = u.pathname.split("/").filter(Boolean)
      const seg = parts[0] || "p"
      const code = parts[1] || ""
      return { platform: "instagram", kind: "iframe", src: `https://www.instagram.com/${seg}/${code}/embed`, url, mode: "tall" }
    }
  } catch {
    // fall through to link
  }
  return { platform: "link", kind: "link", url, mode: "wide" }
}

function ThreadsEmbed({ url }: { url: string }) {
  const boxStyle: CSSProperties = { background: "transparent", margin: 0, padding: 0, width: "100%" }
  useEffect(() => {
    const s = document.createElement("script")
    s.src = "https://www.threads.net/embed.js"
    s.async = true
    document.body.appendChild(s)
    return () => {
      if (s.parentNode) s.parentNode.removeChild(s)
    }
  }, [url])
  return (
    <blockquote
      className="text-post-media"
      data-text-post-permalink={url}
      data-text-post-version="0"
      style={boxStyle}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 underline">
        View this post on Threads
      </a>
    </blockquote>
  )
}

function EmbedFrame({ info }: { info: Info }) {
  const common = "w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40"
  if (info.kind === "iframe") {
    const style: CSSProperties =
      info.mode === "wide"
        ? { aspectRatio: "16 / 9" }
        : info.mode === "portrait"
          ? { aspectRatio: "9 / 16" }
          : { height: "560px" }
    return (
      <div className={`relative ${common}`} style={style}>
        <iframe
          src={info.src}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }
  if (info.kind === "tweet") {
    return (
      <div className={`${common} flex justify-center p-1`} data-theme="dark">
        <div className="w-full">
          <Tweet id={info.tweetId as string} />
        </div>
      </div>
    )
  }
  if (info.kind === "threads") {
    return (
      <div className={`${common} p-3`}>
        <ThreadsEmbed url={info.url} />
      </div>
    )
  }
  return (
    <a href={info.url} target="_blank" rel="noopener noreferrer" className={`${common} flex items-center justify-center p-6 text-sm text-white/70`}>
      Open link
    </a>
  )
}

function Chip({ info, label }: { info: Info; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <img src={ICON[info.platform] || ICON.link} alt={info.platform} className="h-4 w-4" />
      <span className="text-sm font-medium text-white/80">{label || info.platform}</span>
    </div>
  )
}

type Item = Embed & { info: Info }

function Stack({ items }: { items: Item[] }) {
  return (
    <div className="flex w-full flex-col gap-5">
      {items.map((it) => {
        const wrap =
          it.info.mode === "portrait" ? "mx-auto w-full max-w-[320px]" : it.info.mode === "tall" ? "mx-auto w-full max-w-[420px]" : "w-full"
        return (
          <div key={it.id} className={wrap}>
            <div className="mb-2 flex justify-center"><Chip info={it.info} label={it.label} /></div>
            <EmbedFrame info={it.info} />
          </div>
        )
      })}
    </div>
  )
}

function Carousel({ items }: { items: Item[] }) {
  const [i, setI] = useState(0)
  const n = items.length
  const it = items[i]
  const wrap = it.info.mode === "portrait" ? "mx-auto w-full max-w-[320px]" : "mx-auto w-full max-w-[420px]"
  const btn = "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white/80 hover:bg-white/10"
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setI((i - 1 + n) % n)} className={btn}>&#8249;</button>
        <Chip info={it.info} label={it.label} />
        <button type="button" onClick={() => setI((i + 1) % n)} className={btn}>&#8250;</button>
      </div>
      <div className={wrap}><EmbedFrame info={it.info} /></div>
      <div className="mt-3 flex justify-center gap-1.5">
        {items.map((d, idx) => (
          <button key={d.id} type="button" onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-5 bg-white/80" : "w-2 bg-white/30"}`} />
        ))}
      </div>
    </div>
  )
}

function Deck({ items, orientation }: { items: Item[]; orientation: "h" | "v" }) {
  const [active, setActive] = useState(0)
  const n = items.length
  const it = items[active]
  const others: number[] = []
  for (let k = 1; k < n; k++) others.push((active + k) % n)
  const wrapMax = it.info.mode === "portrait" ? "max-w-[300px]" : "max-w-[380px]"
  const btn = "flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"

  const tabs = (
    <div className={orientation === "h" ? "flex flex-col gap-2" : "flex flex-row flex-wrap gap-2"}>
      {others.map((idx) => {
        const o = items[idx]
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setActive(idx)}
            title={o.label || o.info.platform}
            className={
              orientation === "h"
                ? "flex h-20 w-12 items-center justify-center rounded-l-2xl border border-r-0 border-white/10 bg-white/5 hover:bg-white/10"
                : "flex h-12 flex-1 items-center justify-center rounded-t-2xl border border-b-0 border-white/10 bg-white/5 px-2 hover:bg-white/10"
            }
          >
            <img src={ICON[o.info.platform] || ICON.link} alt={o.info.platform} className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-center"><Chip info={it.info} label={it.label} /></div>
      {orientation === "h" ? (
        <div className="flex items-stretch justify-center">
          <div className={`relative w-full ${wrapMax}`}>
            <div className="pointer-events-none absolute -right-2 top-2 bottom-2 -z-10 w-full rounded-2xl border border-white/5 bg-white/5" />
            <EmbedFrame info={it.info} />
          </div>
          {n > 1 ? tabs : null}
        </div>
      ) : (
        <div className={`mx-auto ${wrapMax}`}>
          <div className="relative">
            <div className="pointer-events-none absolute -bottom-2 left-2 right-2 -z-10 h-full rounded-2xl border border-white/5 bg-white/5" />
            <EmbedFrame info={it.info} />
          </div>
          {n > 1 ? <div className="mt-2">{tabs}</div> : null}
        </div>
      )}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" onClick={() => setActive((active - 1 + n) % n)} className={btn}>&#8249;</button>
        <span className="text-xs text-white/40">{active + 1} / {n}</span>
        <button type="button" onClick={() => setActive((active + 1) % n)} className={btn}>&#8250;</button>
      </div>
    </div>
  )
}

export default function EmbedShowcase({ embeds, layout }: { embeds: Embed[]; layout: string }) {
  const items: Item[] = embeds.map((e) => ({ ...e, info: parse(e.url) }))
  if (items.length === 0) return null
  return (
    <div className="mt-8 w-full">
      {layout === "carousel" ? (
        <Carousel items={items} />
      ) : layout === "deck" ? (
        <Deck items={items} orientation="h" />
      ) : layout === "deck-v" ? (
        <Deck items={items} orientation="v" />
      ) : (
        <Stack items={items} />
      )}
    </div>
  )
}
