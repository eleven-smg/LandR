"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import ActionForm from "./ActionForm"
import SaveButton from "./SaveButton"
import { SUBSCRIBE_STYLE_LABELS, TEMPLATES, normalizeSubscribeStyle, templateInfo, normalizeTemplate } from "@/lib/templates"

export type ProfileValues = {
  template: string
  display_name: string
  location: string
  tagline: string
  bio: string
  show_active_badge: boolean
  active_text: string
  theme: string
  accent_color: string
  bg_mode: string
  bg_fit: string
  bg_color: string
  bg_pos_x: number
  bg_pos_y: number
  bg_zoom: number
  embed_layout: string
  show_subscribe: boolean
  subscribe_style: string
  subscribe_title: string
  subscribe_note: string
  subscribe_button_text: string
  subscribe_ask_name: boolean
  deep_links: boolean
  share_button: boolean
}

const input: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  marginTop: 4,
  boxSizing: "border-box",
}
const lbl: CSSProperties = { fontSize: 12, color: "#9aa4c2", display: "block" }
const ta: CSSProperties = { ...input, minHeight: 60 }
const two: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }
const sub: CSSProperties = {
  border: "1px solid #232940",
  borderRadius: 10,
  padding: "9px 11px",
  marginTop: 10,
  background: "#141824",
}
const sum: CSSProperties = { fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#cdd6f4" }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 6 }
const check: CSSProperties = { fontSize: 12, color: "#9aa4c2", display: "flex", alignItems: "center", gap: 6, marginTop: 8 }
const blurb: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 6, lineHeight: 1.45 }
const pickWrap: CSSProperties = { display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }
const sliders: CSSProperties = { flex: 1, minWidth: 170 }
const range: CSSProperties = { width: "100%", marginTop: 2 }
const shapeRow: CSSProperties = { display: "flex", gap: 6, alignItems: "center", marginTop: 8, flexWrap: "wrap" }
const chip: CSSProperties = {
  padding: "4px 9px",
  borderRadius: 999,
  border: "1px solid #232940",
  background: "#0f1117",
  color: "#8892a4",
  fontSize: 11,
  cursor: "pointer",
}
const chipOn: CSSProperties = { ...chip, borderColor: "#5b7fff", background: "rgba(91,127,255,0.12)", color: "#cdd6f4" }

export default function ProfileForm({
  action,
  handle,
  values,
  bgImageUrl,
}: {
  action: (formData: FormData) => Promise<void>
  handle: string
  values: ProfileValues
  bgImageUrl: string
}) {
  // Every value lives in state, and ActionForm submits without letting React
  // reset the form, so what you pick stays picked after a save.
  const [v, setV] = useState<ProfileValues>(values)
  // A phone crops a wide photo very differently from a monitor, which is why the
  // page looked right on the phone and cut off the face on the PC. The preview
  // can now be switched to the shape of the screen you are checking.
  const [shape, setShape] = useState<string>("phone")
  const set = <K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }))

  const active = templateInfo(normalizeTemplate(v.template))
  const isSpotlight = active.id === "spotlight"
  const showBackground = active.usesBackground
  const usingImage = v.bg_mode === "image"
  const subStyle = normalizeSubscribeStyle(v.subscribe_style)
  const isPhoneShape = shape === "phone"

  const frame: CSSProperties = {
    width: isPhoneShape ? 132 : 250,
    height: isPhoneShape ? 232 : 140,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #232940",
    background: v.bg_color || "#000",
    flexShrink: 0,
    cursor: "crosshair",
    position: "relative",
  }

  const focalStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: v.bg_fit === "contain" ? "contain" : "cover",
    objectPosition: v.bg_pos_x + "% " + v.bg_pos_y + "%",
    transform: v.bg_zoom === 100 ? undefined : "scale(" + v.bg_zoom / 100 + ")",
  }

  function pickFocal(event: React.MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = Math.round(((event.clientX - box.left) / box.width) * 100)
    const y = Math.round(((event.clientY - box.top) / box.height) * 100)
    setV((prev) => ({
      ...prev,
      bg_pos_x: Math.min(100, Math.max(0, x)),
      bg_pos_y: Math.min(100, Math.max(0, y)),
    }))
  }

  function recentre() {
    setV((prev) => ({ ...prev, bg_pos_x: 50, bg_pos_y: 50, bg_zoom: 100 }))
  }

  return (
    <ActionForm action={action}>
      <input type="hidden" name="handle" value={handle} />

      <label style={lbl}>
        Page template &mdash; this sets the whole look
        <select style={input} name="template" value={v.template} onChange={(e) => set("template", e.target.value)}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <p style={blurb}>{active.blurb}</p>

      <details style={sub} open>
        <summary style={sum}>Name, tagline and bio</summary>
        <div style={two}>
          <label style={lbl}>
            Display name
            <input style={input} name="display_name" value={v.display_name} onChange={(e) => set("display_name", e.target.value)} />
          </label>
          <label style={lbl}>
            Location
            <input style={input} name="location" value={v.location} onChange={(e) => set("location", e.target.value)} />
          </label>
          <label style={lbl}>
            Tagline
            <input style={input} name="tagline" value={v.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </label>
          <label style={lbl}>
            Active badge text
            <input style={input} name="active_text" value={v.active_text} onChange={(e) => set("active_text", e.target.value)} />
          </label>
        </div>
        <label style={lbl}>
          Bio
          <textarea style={ta} name="bio" value={v.bio} onChange={(e) => set("bio", e.target.value)} />
        </label>
        <label style={check}>
          <input
            type="checkbox"
            name="show_active_badge"
            checked={v.show_active_badge}
            onChange={(e) => set("show_active_badge", e.target.checked)}
          />
          Show the active badge
        </label>
      </details>

      {isSpotlight ? (
        <details style={sub} open>
          <summary style={sum}>Page colour</summary>
          <p style={hint}>
            This template is one flat colour behind everything, like the reference page. Leave it empty for black.
          </p>
          <div style={two}>
            <label style={lbl}>
              Colour hex
              <input
                style={input}
                name="accent_color"
                value={v.accent_color}
                placeholder="#000000"
                onChange={(e) => set("accent_color", e.target.value)}
              />
            </label>
          </div>
          <input type="hidden" name="bg_mode" value={v.bg_mode} />
          <input type="hidden" name="bg_fit" value={v.bg_fit} />
          <input type="hidden" name="bg_color" value={v.bg_color} />
          <input type="hidden" name="theme" value={v.theme} />
          <input type="hidden" name="bg_pos_x" value={v.bg_pos_x} />
          <input type="hidden" name="bg_pos_y" value={v.bg_pos_y} />
          <input type="hidden" name="bg_zoom" value={v.bg_zoom} />
        </details>
      ) : null}

      {showBackground ? (
        <details style={sub}>
          <summary style={sum}>Background and colours</summary>
          <div style={two}>
            <label style={lbl}>
              Background
              <select style={input} name="bg_mode" value={v.bg_mode} onChange={(e) => set("bg_mode", e.target.value)}>
                <option value="theme">Theme gradient</option>
                <option value="color">Solid colour</option>
                <option value="image">Uploaded photo</option>
                <option value="video">Uploaded video</option>
              </select>
            </label>
            <label style={lbl}>
              Theme gradient
              <select style={input} name="theme" value={v.theme} onChange={(e) => set("theme", e.target.value)}>
                <option value="noir">Noir</option>
                <option value="blush">Blush</option>
                <option value="aurora">Aurora</option>
                <option value="gold">Gold</option>
              </select>
            </label>
            <label style={lbl}>
              Solid colour hex
              <input
                style={input}
                name="bg_color"
                value={v.bg_color}
                placeholder="#101010"
                onChange={(e) => set("bg_color", e.target.value)}
              />
            </label>
            <label style={lbl}>
              Photo or video fit
              <select style={input} name="bg_fit" value={v.bg_fit} onChange={(e) => set("bg_fit", e.target.value)}>
                <option value="cover">Fill the screen</option>
                <option value="contain">Fit the whole picture</option>
              </select>
            </label>
          </div>

          {usingImage && bgImageUrl ? (
            <>
              <p style={hint}>
                Tap the part of the photo you want kept in frame &mdash; your face, for example. Zoom above 100% crops
                tighter, below 100% pulls back so more of the picture fits.
              </p>
              <div style={shapeRow}>
                <span style={{ ...hint, marginTop: 0 }}>Check the crop on:</span>
                <button type="button" style={isPhoneShape ? chipOn : chip} onClick={() => setShape("phone")}>
                  Phone
                </button>
                <button type="button" style={isPhoneShape ? chip : chipOn} onClick={() => setShape("desktop")}>
                  Computer
                </button>
                <button type="button" style={chip} onClick={recentre}>
                  Recentre
                </button>
              </div>
              <div style={pickWrap}>
                <div style={frame} onClick={pickFocal} title="Tap the part to keep in frame">
                  <img src={bgImageUrl} alt="" style={focalStyle} />
                </div>
                <div style={sliders}>
                  <label style={lbl}>
                    Left to right: {v.bg_pos_x}% {v.bg_pos_x === 50 ? "(centre)" : ""}
                    <input
                      style={range}
                      type="range"
                      min={0}
                      max={100}
                      name="bg_pos_x"
                      value={v.bg_pos_x}
                      onChange={(e) => set("bg_pos_x", Number(e.target.value))}
                    />
                  </label>
                  <label style={lbl}>
                    Top to bottom: {v.bg_pos_y}% {v.bg_pos_y === 50 ? "(centre)" : v.bg_pos_y < 30 ? "(top of photo)" : ""}
                    <input
                      style={range}
                      type="range"
                      min={0}
                      max={100}
                      name="bg_pos_y"
                      value={v.bg_pos_y}
                      onChange={(e) => set("bg_pos_y", Number(e.target.value))}
                    />
                  </label>
                  <label style={lbl}>
                    Zoom: {v.bg_zoom}%{" "}
                    {v.bg_zoom === 100 ? "(no zoom)" : v.bg_zoom < 100 ? "(pulled back)" : "(cropped in)"}
                    <input
                      style={range}
                      type="range"
                      min={50}
                      max={300}
                      step={5}
                      name="bg_zoom"
                      value={v.bg_zoom}
                      onChange={(e) => set("bg_zoom", Number(e.target.value))}
                    />
                  </label>
                  <p style={hint}>
                    On a wide monitor a tall photo has to lose the top or the bottom. Drop &ldquo;Top to bottom&rdquo;
                    towards 20% to keep the face, or pull the zoom under 100% to fit the whole shot with the page colour
                    showing around it.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="bg_pos_x" value={v.bg_pos_x} />
              <input type="hidden" name="bg_pos_y" value={v.bg_pos_y} />
              <input type="hidden" name="bg_zoom" value={v.bg_zoom} />
              {usingImage ? <p style={hint}>Upload a photo in the panel below, then come back to set the crop.</p> : null}
            </>
          )}
          <input type="hidden" name="accent_color" value={v.accent_color} />
        </details>
      ) : null}

      <details style={sub}>
        <summary style={sum}>Email subscribe</summary>
        <label style={check}>
          <input
            type="checkbox"
            name="show_subscribe"
            checked={v.show_subscribe}
            onChange={(e) => set("show_subscribe", e.target.checked)}
          />
          Show the subscribe box
        </label>
        <label style={lbl}>
          Style
          <select
            style={input}
            name="subscribe_style"
            value={subStyle}
            onChange={(e) => set("subscribe_style", e.target.value)}
          >
            <option value="inline">{SUBSCRIBE_STYLE_LABELS.inline}</option>
            <option value="pill">{SUBSCRIBE_STYLE_LABELS.pill}</option>
            <option value="bar">{SUBSCRIBE_STYLE_LABELS.bar}</option>
          </select>
        </label>
        <div style={two}>
          <label style={lbl}>
            Title
            <input
              style={input}
              name="subscribe_title"
              value={v.subscribe_title}
              onChange={(e) => set("subscribe_title", e.target.value)}
            />
          </label>
          <label style={lbl}>
            Button text
            <input
              style={input}
              name="subscribe_button_text"
              value={v.subscribe_button_text}
              placeholder="Subscribe"
              onChange={(e) => set("subscribe_button_text", e.target.value)}
            />
          </label>
        </div>
        <label style={lbl}>
          Note under the title
          <input
            style={input}
            name="subscribe_note"
            value={v.subscribe_note}
            onChange={(e) => set("subscribe_note", e.target.value)}
          />
        </label>
        <label style={check}>
          <input
            type="checkbox"
            name="subscribe_ask_name"
            checked={v.subscribe_ask_name}
            onChange={(e) => set("subscribe_ask_name", e.target.checked)}
          />
          Ask for a first name as well as the email
        </label>
      </details>

      <details style={sub}>
        <summary style={sum}>Embeds, sharing and app links</summary>
        <label style={lbl}>
          Embed arrangement
          <select
            style={input}
            name="embed_layout"
            value={v.embed_layout}
            onChange={(e) => set("embed_layout", e.target.value)}
          >
            <option value="stack">1. Stack &mdash; full size, one under another</option>
            <option value="carousel">2. Carousel &mdash; one at a time, arrows and dots</option>
            <option value="deck">3. Deck sideways &mdash; others peeking to the right</option>
            <option value="deck-v">4. Deck stacked &mdash; others peeking below</option>
            <option value="grid">5. Picker grid &mdash; Instagram style tiles</option>
            <option value="spotlight">6. Spotlight &mdash; one big player, thumbnail strip</option>
          </select>
        </label>
        <label style={check}>
          <input
            type="checkbox"
            name="deep_links"
            checked={v.deep_links}
            onChange={(e) => set("deep_links", e.target.checked)}
          />
          Smart deep linking &mdash; open Telegram, Instagram and TikTok in the real app
        </label>
        <label style={check}>
          <input
            type="checkbox"
            name="share_button"
            checked={v.share_button}
            onChange={(e) => set("share_button", e.target.checked)}
          />
          Show the share button in the corner of the page
        </label>
      </details>

      <SaveButton label="Save page" />
    </ActionForm>
  )
}
