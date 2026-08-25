import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logPageView, getRequestMeta } from "@/lib/analytics"
import { redirect } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import EmbedShowcase from "./EmbedShowcase"
import SubscribeForm from "./SubscribeForm"
import Tracker from "./Tracker"

export const dynamic = "force-dynamic"

type Destination = { url: string; disabled?: boolean }
type Social = { platform: string; url: string }
type LinkRow = {
  id: string
  label: string
  icon: string | null
  subtitle: string | null
  type: string | null
  size: string | null
  shape: string | null
  color: string | null
  media_url: string | null
  preview_image_url: string | null
  destinations: Destination[]
}

const THEMES: Record<string, string> = {
  noir: "radial-gradient(circle at 50% 0%, #1a1d29 0%, #0b0d13 60%)",
  blush: "linear-gradient(160deg, #3a1f2e 0%, #140b12 100%)",
  aurora: "linear-gradient(160deg, #1e2a44 0%, #0a0f1c 100%)",
  gold: "radial-gradient(circle at 50% 0%, #3a2f14 0%, #0d0b06 60%)",
}

const BTN_PAD: Record<string, string> = { sm: "px-3 py-2.5", md: "px-4 py-3.5", lg: "px-5 py-5" }
const BTN_TEXT: Record<string, string> = { sm: "text-sm", md: "text-[15px]", lg: "text-lg" }
const ICON_SIZE: Record<string, string> = { sm: "h-8 w-8", md: "h-9 w-9", lg: "h-11 w-11" }
const RADIUS: Record<string, string> = { pill: "9999px", rounded: "16px", square: "4px" }
const BANNER_H: Record<string, string> = { sm: "h-28", md: "h-40", lg: "h-56" }
const DOT = " \u2022 "
const DEFAULT_ORDER = "header,socials,buttons,subscribe,videos,embeds"

function faviconFor(url: string) {
  try {
    const host = new URL(url).hostname
    return "https://www.google.com/s2/favicons?domain=" + host + "&sz=64"
  } catch {
    return ""
  }
}

/**
 * Picks a readable label colour for a button background. Light custom colours
 * such as #efddf2 used to render white-on-white and were unreadable.
 */
function labelColor(background: string | null): string {
  if (!background) return "#ffffff"
  const match = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(background.trim())
  if (!match) return "#ffffff"
  let hex = match[1]
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.62 ? "#141414" : "#ffffff"
}

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { handle } = await params
  const query = searchParams ? await searchParams : {}
  const isPreview = query.preview === "1"

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("*")
    .eq("handle", handle)
    .single()

  if (creatorError && creatorError.code !== "PGRST116") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white/70">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm">This page could not be loaded right now. Please refresh in a moment.</p>
      </main>
    )
  }

  if (!creator) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white/70">
        This page does not exist.
      </main>
    )
  }

  let viewId: string | null = null

  if (!isPreview) {
    const meta = await getRequestMeta()
    const blocked = (creator.blocked_countries || []) as string[]
    if (meta.country && blocked.includes(meta.country)) {
      if (creator.blocked_redirect_url) {
        redirect(String(creator.blocked_redirect_url))
      }
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white/70">
          <div className="text-4xl">&#128683;</div>
          <h1 className="mt-4 text-xl font-semibold text-white">Not available in your region</h1>
          <p className="mt-2 max-w-sm text-sm">This page isn&rsquo;t accessible from your location.</p>
        </main>
      )
    }

    viewId = await logPageView(creator.id, "/" + handle)
  }

  const { data: links } = await supabaseAdmin
    .from("links")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("is_active", true)
    .order("position", { ascending: true })

  const rows = (links || []) as LinkRow[]
  const buttons = rows.filter((l) => l.type !== "embed" && l.type !== "video")
  const videos = rows.filter((l) => l.type === "video" && !!l.media_url)
  const embeds = rows
    .filter((l) => l.type === "embed")
    .map((l) => ({ id: l.id, label: l.label, url: (l.destinations && l.destinations[0]?.url) || "" }))

  const initial = (creator.display_name || creator.handle || "?").charAt(0).toUpperCase()
  const socials = (Array.isArray(creator.socials) ? creator.socials : []) as Social[]
  const template = String(creator.template || "classic")
  const isRachel = template === "spotlight"
  const isCover = template === "cover"

  const gradient = THEMES[creator.theme as string] || THEMES.noir
  const bgType = (creator.background_type as string) || "theme"
  const imageUrl = (creator.bg_image_url as string) || ""
  const videoUrl = (creator.bg_video_url as string) || ""
  const bgFit = String(creator.bg_fit || "cover") === "contain" ? "object-contain" : "object-cover"
  // The spotlight template is deliberately flat black, so it ignores backgrounds.
  const useImage = !isRachel && bgType === "image" && !!imageUrl
  const useVideo = !isRachel && bgType === "video" && !!videoUrl
  const useColor = bgType === "color" && !!creator.background_url

  const baseStyle: CSSProperties = isRachel
    ? { background: "#000000" }
    : useImage || useVideo
      ? { background: "#000000" }
      : { background: useColor ? (creator.background_url as string) : gradient }

  const shellWidth = isRachel ? "max-w-[430px]" : "max-w-[520px]"
  const avatarSize = isRachel ? "h-20 w-20" : "h-24 w-24"
  const iconShape = isRachel || isCover ? "rounded-full" : "rounded-md"

  const headerBlock = (
    <div className="flex w-full flex-col items-center">
      {creator.photo_url ? (
        <img
          src={creator.photo_url as string}
          alt={(creator.display_name as string) || (creator.handle as string)}
          className={avatarSize + " rounded-full object-cover ring-2 ring-white/15"}
        />
      ) : (
        <div
          className={
            avatarSize +
            " flex items-center justify-center rounded-full bg-white/10 text-3xl font-semibold ring-2 ring-white/15"
          }
        >
          {initial}
        </div>
      )}

      <h1 className={(isRachel ? "mt-3 text-xl" : "mt-4 text-2xl") + " font-bold"}>
        {creator.display_name || creator.handle}
      </h1>

      {creator.location || creator.tagline ? (
        <p className="mt-1 text-center text-sm text-white/60">
          {[creator.location, creator.tagline].filter(Boolean).join(DOT)}
        </p>
      ) : null}

      {creator.show_active_badge ? (
        <div className="mt-3 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {creator.active_text || "Active now"}
        </div>
      ) : null}

      {creator.bio ? (
        <p className="mt-4 text-center text-[15px] leading-relaxed text-white/80">{creator.bio}</p>
      ) : null}
    </div>
  )

  const coverBlock = (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
      {creator.photo_url ? (
        <img src={creator.photo_url as string} alt="" className="h-60 w-full object-cover" />
      ) : (
        <div className="flex h-60 w-full items-center justify-center bg-white/10 text-5xl font-semibold">{initial}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h1 className="text-2xl font-bold">{creator.display_name || creator.handle}</h1>
        {creator.location || creator.tagline ? (
          <p className="mt-1 text-sm text-white/70">
            {[creator.location, creator.tagline].filter(Boolean).join(DOT)}
          </p>
        ) : null}
        {creator.show_active_badge ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {creator.active_text || "Active now"}
          </div>
        ) : null}
        {creator.bio ? <p className="mt-3 text-sm leading-relaxed text-white/80">{creator.bio}</p> : null}
      </div>
    </div>
  )

  const socialsBlock =
    socials.length > 0 ? (
      <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-3">
        {socials.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <img src={"https://cdn.simpleicons.org/" + s.platform + "/white"} alt={s.platform} className="h-5 w-5" />
          </a>
        ))}
      </div>
    ) : null

  const buttonsBlock = (
    <div className="mt-6 flex w-full flex-col gap-3">
      {buttons.map((link) => {
        const size = link.size || "md"
        const pad = BTN_PAD[size] || BTN_PAD.md
        const txt = BTN_TEXT[size] || BTN_TEXT.md
        const radius = RADIUS[link.shape || "pill"] || RADIUS.pill
        const icon = link.icon || faviconFor((link.destinations && link.destinations[0]?.url) || "")
        const preview = link.preview_image_url || ""
        const ink = labelColor(link.color)

        if (preview) {
          const bh = BANNER_H[size] || BANNER_H.md
          const cardStyle: CSSProperties = {
            borderRadius: "18px",
            background: link.color || "rgba(255,255,255,0.08)",
          }
          return (
            <a
              key={link.id}
              href={"/go/" + link.id}
              className="block overflow-hidden border border-white/10 transition hover:brightness-110"
              style={cardStyle}
            >
              <img src={preview} alt="" className={"w-full " + bh + " object-cover"} />
              <div className="flex items-center gap-3 px-4 py-3 font-medium" style={{ color: ink }}>
                <span className="flex-1 text-left">
                  <span className="block">{link.label}</span>
                  {link.subtitle ? (
                    <span className="block text-xs font-normal" style={{ color: ink, opacity: 0.7 }}>
                      {link.subtitle}
                    </span>
                  ) : null}
                </span>
                <span style={{ color: ink, opacity: 0.6 }}>&rarr;</span>
              </div>
            </a>
          )
        }

        const btnStyle: CSSProperties = {
          borderRadius: radius,
          background: link.color || "rgba(255,255,255,0.08)",
          color: ink,
        }
        return (
          <a
            key={link.id}
            href={"/go/" + link.id}
            className={
              "flex items-center gap-3 border border-white/10 " + pad + " " + txt + " font-medium transition hover:brightness-110"
            }
            style={btnStyle}
          >
            {icon ? <img src={icon} alt="" className={ICON_SIZE[size] + " " + iconShape + " object-cover"} /> : null}
            <span className="flex-1 text-left">
              <span className="block">{link.label}</span>
              {link.subtitle ? (
                <span className="block text-xs font-normal" style={{ color: ink, opacity: 0.7 }}>
                  {link.subtitle}
                </span>
              ) : null}
            </span>
          </a>
        )
      })}
      {buttons.length === 0 ? <p className="text-center text-sm text-white/40">No links yet.</p> : null}
    </div>
  )

  const videosBlock =
    videos.length > 0 ? (
      <div className="mt-6 flex w-full flex-col gap-4">
        {videos.map((v) => {
          const media = v.media_url || ""
          const tap = (v.destinations && v.destinations[0]?.url) || ""
          const videoEl = (
            <video src={media} autoPlay muted loop playsInline controls={!tap} className="h-full w-full object-cover" />
          )
          return tap ? (
            <a
              key={v.id}
              href={"/go/" + v.id}
              className="relative block overflow-hidden rounded-2xl border border-white/10 bg-black"
            >
              <div className="aspect-[9/16] w-full">{videoEl}</div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-3">
                <span className="text-sm font-medium text-white">{v.label}</span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black">Open &rarr;</span>
              </div>
            </a>
          ) : (
            <div key={v.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div className="aspect-[9/16] w-full">{videoEl}</div>
              {v.label ? <p className="p-3 text-sm text-white/80">{v.label}</p> : null}
            </div>
          )
        })}
      </div>
    ) : null

  const subscribeBlock = creator.show_subscribe ? (
    <SubscribeForm
      handle={creator.handle as string}
      title={(creator.subscribe_title as string) || "Get notified"}
      note={(creator.subscribe_note as string) || ""}
    />
  ) : null

  const embedsBlock = (
    <EmbedShowcase
      embeds={embeds}
      layout={String(creator.embed_template || creator.embed_layout || "stack")}
    />
  )

  const sections: Record<string, ReactNode> = {
    header: isCover ? coverBlock : headerBlock,
    socials: socialsBlock,
    buttons: buttonsBlock,
    subscribe: subscribeBlock,
    videos: videosBlock,
    embeds: embedsBlock,
  }

  const requested = String(creator.section_order || DEFAULT_ORDER)
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part in sections)

  // Anything the saved order forgot still renders, so a section can never vanish.
  const order = requested.slice()
  Object.keys(sections).forEach((key) => {
    if (!order.includes(key)) order.push(key)
  })

  return (
    <main className="relative min-h-screen w-full text-white" style={baseStyle}>
      {useImage ? (
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <img src={imageUrl} alt="" className={"h-full w-full " + bgFit} />
        </div>
      ) : null}
      {useVideo ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className={"fixed inset-0 h-full w-full " + bgFit}
          style={{ zIndex: 0 }}
        />
      ) : null}
      {useVideo || useImage ? <div className="fixed inset-0 bg-black/45" style={{ zIndex: 1 }} /> : null}

      <div className={"relative z-10 mx-auto flex w-full " + shellWidth + " flex-col items-center px-5 py-12"}>
        {order.map((key) =>
          sections[key] ? (
            <div key={key} className="flex w-full flex-col items-center">
              {sections[key]}
            </div>
          ) : null,
        )}
        <p className="mt-10 text-xs text-white/30">powered by LandR</p>
      </div>

      {viewId ? <Tracker viewId={viewId} /> : null}
    </main>
  )
}
