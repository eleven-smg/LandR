import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logPageView, getRequestMeta } from "@/lib/analytics"
import { redirect } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import EmbedShowcase from "./EmbedShowcase"
import SubscribeForm from "./SubscribeForm"
import ShareButton from "./ShareButton"
import Tracker from "./Tracker"
import { normalizeOrder } from "@/lib/sections"
import { likeSafeHandle } from "@/lib/handles"
import { clampPercent, clampZoom, normalizeSubscribeStyle, normalizeTemplate } from "@/lib/templates"

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

function faviconFor(url: string) {
  try {
    const host = new URL(url).hostname
    return "https://www.google.com/s2/favicons?domain=" + host + "&sz=64"
  } catch {
    return ""
  }
}

function firstUrl(link: LinkRow) {
  return (link.destinations && link.destinations[0]?.url) || ""
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

  // Phone keyboards capitalise the first letter in the address bar, so /Ava was
  // arriving as a handle that did not exist. Matching without case fixes it.
  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("*")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

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

  const realHandle = String(creator.handle)
  let viewId: string | null = null

  if (!isPreview) {
    const meta = await getRequestMeta()
    const blocked = (creator.blocked_countries || []) as string[]

    // A listed country is only sent away when a redirect URL is actually set.
    // With the field empty, the visitor sees the normal page and it is the
    // per-link country rules that change: a Telegram button can point somewhere
    // else for that country while Instagram stays the same for everybody. That
    // swap happens in /go/[id], so nothing here needs to know about it.
    if (meta.country && blocked.includes(meta.country) && creator.blocked_redirect_url) {
      redirect(String(creator.blocked_redirect_url))
    }

    // Logged against the real handle, so /Ava and /ava are one page in analytics.
    viewId = await logPageView(creator.id, "/" + realHandle)
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
    .map((l) => ({ id: l.id, label: l.label, url: firstUrl(l) }))

  const name = String(creator.display_name || creator.handle)
  const initial = name.charAt(0).toUpperCase()
  const socials = (Array.isArray(creator.socials) ? creator.socials : []) as Social[]

  const template = normalizeTemplate(creator.template)
  const isSpotlight = template === "spotlight"
  const isMosaic = template === "mosaic"
  const isGlass = template === "glass"

  // Spotlight is a flat-colour look, so it ignores uploaded backgrounds entirely.
  const gradient = THEMES[creator.theme as string] || THEMES.noir
  const bgType = String(creator.background_type || "theme")
  const imageUrl = String(creator.bg_image_url || "")
  const videoUrl = String(creator.bg_video_url || "")
  const useImage = !isSpotlight && bgType === "image" && !!imageUrl
  const useVideo = !isSpotlight && bgType === "video" && !!videoUrl
  const useColor = bgType === "color" && !!creator.background_url
  const flatColor = String(creator.accent_color || "").trim() || "#000000"

  const baseStyle: CSSProperties = isSpotlight
    ? { background: flatColor }
    : useImage || useVideo
      ? { background: "#000000" }
      : { background: useColor ? String(creator.background_url) : gradient }

  // Focal point and zoom decide which part of a tall photo stays on screen, so a
  // portrait shot is no longer cropped to the middle of the frame by accident.
  const fitClass = String(creator.bg_fit || "cover") === "contain" ? "object-contain" : "object-cover"
  const zoom = clampZoom(creator.bg_zoom)
  const mediaStyle: CSSProperties = {
    objectPosition: clampPercent(creator.bg_pos_x, 50) + "% " + clampPercent(creator.bg_pos_y, 50) + "%",
    transform: zoom === 100 ? undefined : "scale(" + zoom / 100 + ")",
  }

  // The profile photo has its own framing, so an Instagram portrait can be
  // centred on the face instead of the middle of the picture.
  const photoZoom = clampZoom(creator.photo_zoom)
  const photoStyle: CSSProperties = {
    objectPosition: clampPercent(creator.photo_pos_x, 50) + "% " + clampPercent(creator.photo_pos_y, 50) + "%",
    transform: photoZoom === 100 ? undefined : "scale(" + photoZoom / 100 + ")",
  }

  const shellWidth = isSpotlight
    ? "max-w-[430px]"
    : isMosaic
      ? "max-w-[560px]"
      : isGlass
        ? "max-w-[480px]"
        : "max-w-[520px]"

  const badge = creator.show_active_badge ? (
    <div className="mt-3 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      {creator.active_text || "Active now"}
    </div>
  ) : null

  const avatar = (size: string, radius: string) =>
    creator.photo_url ? (
      <div className={size + " " + radius + " overflow-hidden ring-2 ring-white/15"}>
        <img src={String(creator.photo_url)} alt={name} className="h-full w-full object-cover" style={photoStyle} />
      </div>
    ) : (
      <div
        className={
          size + " " + radius + " flex items-center justify-center bg-white/10 text-3xl font-semibold ring-2 ring-white/15"
        }
      >
        {initial}
      </div>
    )

  const classicHeader = (
    <div className="flex w-full flex-col items-center">
      {avatar("h-24 w-24", "rounded-full")}
      <h1 className="mt-4 text-2xl font-bold">{name}</h1>
      {creator.location || creator.tagline ? (
        <p className="mt-1 text-center text-sm text-white/60">
          {[creator.location, creator.tagline].filter(Boolean).join(DOT)}
        </p>
      ) : null}
      {badge}
      {creator.bio ? <p className="mt-4 text-center text-[15px] leading-relaxed text-white/80">{creator.bio}</p> : null}
    </div>
  )

  const spotlightHeader = (
    <div className="flex w-full flex-col items-center">
      {avatar("h-24 w-24", "rounded-full")}
      <h1 className="mt-3 text-xl font-bold">{name}</h1>
      {creator.location ? (
        <p className="mt-1 text-[13px] font-semibold text-white/75">&#9906; {String(creator.location)}</p>
      ) : null}
      {creator.tagline ? <p className="mt-1 text-[13px] font-bold text-white">{String(creator.tagline)}</p> : null}
      {badge}
      {creator.bio ? <p className="mt-3 text-center text-sm leading-relaxed text-white/70">{creator.bio}</p> : null}
    </div>
  )

  const mosaicHeader = (
    <div className="w-full">
      <div className="flex items-center gap-4">
        {avatar("h-20 w-20", "rounded-2xl")}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{name}</h1>
          {creator.tagline ? <p className="mt-0.5 text-sm text-white/70">{String(creator.tagline)}</p> : null}
          {creator.location ? <p className="mt-0.5 text-xs text-white/45">{String(creator.location)}</p> : null}
          {badge}
        </div>
      </div>
      {creator.bio ? <p className="mt-4 text-[15px] leading-relaxed text-white/80">{creator.bio}</p> : null}
    </div>
  )

  const glassHeader = (
    <div className="flex w-full flex-col items-center">
      {avatar("h-20 w-20", "rounded-full")}
      <h1 className="mt-3 text-xl font-bold">{name}</h1>
      {creator.tagline ? <p className="mt-1 text-center text-sm text-white/80">{String(creator.tagline)}</p> : null}
      {creator.location ? <p className="mt-0.5 text-xs text-white/55">{String(creator.location)}</p> : null}
      {badge}
      {creator.bio ? <p className="mt-3 text-center text-sm leading-relaxed text-white/75">{creator.bio}</p> : null}
    </div>
  )

  const socialsBlock =
    socials.length > 0 ? (
      isSpotlight ? (
        <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-5">
          {socials.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="opacity-90 transition hover:opacity-100">
              <img src={"https://cdn.simpleicons.org/" + s.platform + "/white"} alt={s.platform} className="h-6 w-6" />
            </a>
          ))}
        </div>
      ) : (
        <div className={(isMosaic ? "mt-5 justify-start" : "mt-5 justify-center") + " flex w-full flex-wrap items-center gap-3"}>
          {socials.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <img src={"https://cdn.simpleicons.org/" + s.platform + "/white"} alt={s.platform} className="h-5 w-5" />
            </a>
          ))}
        </div>
      )
    ) : null

  const classicButtons = (
    <div className="mt-6 flex w-full flex-col gap-3">
      {buttons.map((link) => {
        const size = link.size || "md"
        const pad = BTN_PAD[size] || BTN_PAD.md
        const txt = BTN_TEXT[size] || BTN_TEXT.md
        const radius = RADIUS[link.shape || "pill"] || RADIUS.pill
        const icon = link.icon || faviconFor(firstUrl(link))
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
              className="block overflow-hidden border border-white/10 transition hover:brightness-110 active:scale-[0.99]"
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
              "flex items-center gap-3 border border-white/10 " +
              pad +
              " " +
              txt +
              " font-medium transition hover:brightness-110 active:scale-[0.99]"
            }
            style={btnStyle}
          >
            {icon ? <img src={icon} alt="" className={ICON_SIZE[size] + " rounded-md object-cover"} /> : null}
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

  // Spotlight: transparent pill, thin border, centred bold label, round thumbnail
  // pinned on the left, exactly like the reference page.
  const spotlightButtons = (
    <div className="mt-6 flex w-full flex-col gap-4">
      {buttons.map((link) => {
        const thumb = link.icon || link.preview_image_url || faviconFor(firstUrl(link))
        const edgeStyle: CSSProperties = {
          borderColor: link.color || "rgba(255,255,255,0.9)",
          borderRadius: "9999px",
        }
        return (
          <a
            key={link.id}
            href={"/go/" + link.id}
            className="relative flex h-16 items-center justify-center border px-16 text-center text-[15px] font-semibold text-white transition hover:bg-white/10 active:scale-[0.99]"
            style={edgeStyle}
          >
            {thumb ? <img src={thumb} alt="" className="absolute left-2.5 h-11 w-11 rounded-full object-cover" /> : null}
            <span className="flex flex-col">
              <span>{link.label}</span>
              {link.subtitle ? <span className="text-xs font-normal text-white/60">{link.subtitle}</span> : null}
            </span>
          </a>
        )
      })}
      {buttons.length === 0 ? <p className="text-center text-sm text-white/40">No links yet.</p> : null}
    </div>
  )

  // Mosaic: two columns of picture tiles. A link with a preview image gets a
  // wide tile, everything else gets a square one.
  const mosaicButtons = (
    <div className="mt-6 grid w-full grid-cols-2 gap-3">
      {buttons.map((link) => {
        const art = link.preview_image_url || link.icon || ""
        const wide = !!link.preview_image_url
        const tileStyle: CSSProperties = { background: link.color || "rgba(255,255,255,0.07)" }
        return (
          <a
            key={link.id}
            href={"/go/" + link.id}
            className={
              (wide ? "col-span-2 h-40 " : "col-span-1 h-32 ") +
              "relative flex flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-3 transition hover:brightness-110 active:scale-[0.99]"
            }
            style={tileStyle}
          >
            {art ? <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="relative">
              <span className="block text-sm font-semibold text-white">{link.label}</span>
              {link.subtitle ? <span className="block text-xs text-white/70">{link.subtitle}</span> : null}
            </div>
          </a>
        )
      })}
      {buttons.length === 0 ? <p className="col-span-2 text-center text-sm text-white/40">No links yet.</p> : null}
    </div>
  )

  // Glass: frosted rows inside the frosted card, thumbnail on the left.
  const glassButtons = (
    <div className="mt-5 flex w-full flex-col gap-2.5">
      {buttons.map((link) => {
        const icon = link.icon || link.preview_image_url || faviconFor(firstUrl(link))
        const ink = link.color ? labelColor(link.color) : "#ffffff"
        const rowStyle: CSSProperties = link.color
          ? { background: link.color, color: ink }
          : { background: "rgba(255,255,255,0.14)", color: "#ffffff" }
        return (
          <a
            key={link.id}
            href={"/go/" + link.id}
            className="flex items-center gap-3 rounded-2xl border border-white/20 px-3 py-3 text-[15px] font-semibold transition hover:brightness-110 active:scale-[0.99]"
            style={rowStyle}
          >
            {icon ? <img src={icon} alt="" className="h-9 w-9 rounded-xl object-cover" /> : null}
            <span className="flex-1 text-left">
              <span className="block">{link.label}</span>
              {link.subtitle ? (
                <span className="block text-xs font-normal" style={{ opacity: 0.72 }}>
                  {link.subtitle}
                </span>
              ) : null}
            </span>
            <span style={{ opacity: 0.55 }}>&rarr;</span>
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
          const tap = firstUrl(v)
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
      handle={realHandle}
      title={String(creator.subscribe_title || "Get notified")}
      note={String(creator.subscribe_note || "")}
      style={normalizeSubscribeStyle(creator.subscribe_style)}
      buttonText={String(creator.subscribe_button_text || "")}
      askName={!!creator.subscribe_ask_name}
      avatar={String(creator.photo_url || "")}
    />
  ) : null

  const embedsBlock = <EmbedShowcase embeds={embeds} layout={String(creator.embed_template || creator.embed_layout || "stack")} />

  const sections: Record<string, ReactNode> = {
    header: isSpotlight ? spotlightHeader : isMosaic ? mosaicHeader : isGlass ? glassHeader : classicHeader,
    socials: socialsBlock,
    buttons: isSpotlight ? spotlightButtons : isMosaic ? mosaicButtons : isGlass ? glassButtons : classicButtons,
    subscribe: subscribeBlock,
    videos: videosBlock,
    embeds: embedsBlock,
  }

  const order = normalizeOrder(creator.section_order)

  const body = order.map((key) =>
    sections[key] ? (
      <div key={key} className="flex w-full flex-col items-center">
        {sections[key]}
      </div>
    ) : null,
  )

  return (
    <main className="relative min-h-screen w-full text-white" style={baseStyle}>
      {useImage ? (
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <img src={imageUrl} alt="" className={"h-full w-full " + fitClass} style={mediaStyle} />
        </div>
      ) : null}
      {useVideo ? (
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className={"h-full w-full " + fitClass}
            style={mediaStyle}
          />
        </div>
      ) : null}
      {useVideo || useImage ? (
        <div className={isGlass ? "fixed inset-0 bg-black/25" : "fixed inset-0 bg-black/45"} style={{ zIndex: 1 }} />
      ) : null}

      {creator.share_button === false ? null : <ShareButton name={name} />}

      <div className={"relative z-10 mx-auto flex w-full " + shellWidth + " flex-col items-center px-5 py-12"}>
        {isGlass ? (
          <div className="flex w-full flex-col items-center rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            {body}
          </div>
        ) : (
          body
        )}
        <p className="mt-10 text-xs text-white/30">powered by LandR</p>
      </div>

      {viewId ? <Tracker viewId={viewId} /> : null}
    </main>
  )
}
