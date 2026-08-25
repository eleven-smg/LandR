import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { CSSProperties } from "react"
import Builder from "./Builder"
import { SECTION_LABELS, normalizeOrder } from "@/lib/sections"
import {
  saveProfile,
  moveSection,
  addSocial,
  updateSocial,
  deleteSocial,
  moveSocial,
  updateLink,
  deleteLink,
  moveLink,
  uploadVideo,
  removeVideo,
  uploadBackground,
  savePreview,
  removePreview,
  saveLayout,
  saveGeoRules,
} from "./actions"
import { saveIcon, removeIcon, addLinkFull, saveAvatar, removeAvatar } from "./mediaActions"

export const dynamic = "force-dynamic"

type Social = { platform: string; url: string }

const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
}
const input: CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  marginTop: 4,
  boxSizing: "border-box",
}
const lbl: CSSProperties = { fontSize: 12, color: "#9aa4c2", display: "block", marginTop: 8 }
const btn: CSSProperties = {
  padding: "9px 14px",
  background: "#5b7fff",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 10,
}
const ghost: CSSProperties = {
  padding: "6px 10px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
}
const rowStyle: CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }

const nf: CSSProperties = { padding: 24, color: "#fff" }
const page: CSSProperties = { color: "#fff" }
const wrap: CSSProperties = { maxWidth: 1180 }
const grid: CSSProperties = { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }
const colMain: CSSProperties = { flex: 1, minWidth: 320, maxWidth: 660 }
const colSide: CSSProperties = { width: 262, flexShrink: 0, position: "sticky", top: 16 }
const phoneCard: CSSProperties = {
  ...card,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
}
const phone: CSSProperties = {
  width: 220,
  aspectRatio: "9 / 19",
  border: "6px solid #222",
  borderRadius: 28,
  overflow: "hidden",
  background: "#000",
}
const iframeStyle: CSSProperties = { width: "100%", height: "100%", border: "none", display: "block" }
const h1s: CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 4 }
const sub: CSSProperties = { color: "#9aa4c2", fontSize: 13, marginBottom: 18 }
const link: CSSProperties = { color: "#5b7fff" }
const sumStyle: CSSProperties = { fontSize: 15, fontWeight: 600, cursor: "pointer", listStyle: "none" }
const sumRow: CSSProperties = { ...sumStyle, display: "flex", gap: 8, alignItems: "center" }
const ta: CSSProperties = { ...input, minHeight: 70 }
const srow: CSSProperties = { ...rowStyle, marginTop: 10, borderTop: "1px solid #232940", paddingTop: 10 }
const frow: CSSProperties = { ...rowStyle, flex: 1 }
const pin: CSSProperties = { ...input, width: 120, marginTop: 0 }
const uin: CSSProperties = { ...input, flex: 1, marginTop: 0, minWidth: 160 }
const del: CSSProperties = { ...ghost, color: "#ff8080" }
const arow: CSSProperties = { ...rowStyle, marginTop: 12 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 8 }
const hint2: CSSProperties = { color: "#6b7396", fontSize: 12, marginTop: 4 }
const item: CSSProperties = { borderTop: "1px solid #232940", paddingTop: 12, marginTop: 12 }
const lin: CSSProperties = { ...input, flex: 1, marginTop: 0, minWidth: 140 }
const sel110: CSSProperties = { ...input, width: 110, marginTop: 0 }
const sel100: CSSProperties = { ...input, width: 100, marginTop: 0 }
const row8: CSSProperties = { ...rowStyle, marginTop: 8 }
const iin: CSSProperties = { ...input, width: 130, marginTop: 0 }
const subin: CSSProperties = { ...input, flex: 1, marginTop: 0, minWidth: 120 }
const albl: CSSProperties = { fontSize: 12, color: "#9aa4c2" }
const subItem: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  borderTop: "1px solid #232940",
  padding: "9px 0",
  fontSize: 14,
}
const subDate: CSSProperties = { color: "#6b7396", fontSize: 12, whiteSpace: "nowrap" }
const statRow: CSSProperties = { display: "flex", gap: 10, alignItems: "baseline", marginTop: 4 }
const statNum: CSSProperties = { fontSize: 26, fontWeight: 700, color: "#4ade80" }
const vrow: CSSProperties = { ...rowStyle, marginTop: 8, borderTop: "1px dashed #232940", paddingTop: 8 }
const okTag: CSSProperties = { color: "#4ade80", fontSize: 12 }
const fileIn: CSSProperties = { ...input, flex: 1, marginTop: 0, minWidth: 150, padding: "6px 8px" }
const previewTitle: CSSProperties = { fontSize: 13, fontWeight: 600, alignSelf: "flex-start" }
const previewNote: CSSProperties = { color: "#6b7396", fontSize: 11, textAlign: "center" }
const avatarImg: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid #232940",
}
const orderRow: CSSProperties = {
  ...rowStyle,
  borderTop: "1px solid #232940",
  paddingTop: 8,
  marginTop: 8,
}
const orderName: CSSProperties = { flex: 1, fontSize: 13, minWidth: 150 }
const orderNum: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: "#232940",
  color: "#9aa4c2",
  fontSize: 11,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}
const tag: CSSProperties = {
  fontSize: 11,
  color: "#9aa4c2",
  background: "#232940",
  borderRadius: 6,
  padding: "2px 7px",
}

export default async function EditPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const { data: creator } = await supabaseAdmin.from("creators").select("*").eq("handle", handle).single()
  if (!creator) return <main style={nf}>Creator not found.</main>

  const { data: links } = await supabaseAdmin
    .from("links")
    .select("*")
    .eq("creator_id", creator.id)
    .order("position", { ascending: true })
  const rows = links || []
  const socials: Social[] = Array.isArray(creator.socials) ? creator.socials : []

  const builderItems = rows.map((l: Record<string, unknown>) => ({
    id: String(l.id),
    label: String(l.label || ""),
    size: String(l.size || "md"),
  }))

  const { data: subs } = await supabaseAdmin
    .from("subscribers")
    .select("email, created_at")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
  const subRows = (subs || []) as { email: string; created_at: string }[]

  const order = normalizeOrder(creator.section_order)
  const previewSrc = "/" + creator.handle + "?preview=1&t=" + Date.now()

  return (
    <main style={page}>
      <div style={wrap}>
        <h1 style={h1s}>Edit /{creator.handle}</h1>
        <p style={sub}>
          <a href={"/" + creator.handle} style={link}>
            View public page &rarr;
          </a>
          <span style={hint2}> Every panel below opens and closes, so only what you are editing takes up space.</span>
        </p>

        <div style={grid}>
          <div style={colMain}>
            <details style={card} open>
              <summary style={sumStyle}>Profile picture</summary>
              <div style={row8}>
                {creator.photo_url ? (
                  <img src={creator.photo_url} alt="" style={avatarImg} />
                ) : (
                  <span style={albl}>No photo yet &mdash; the page shows your first letter instead.</span>
                )}
              </div>
              <form action={saveAvatar} encType="multipart/form-data" style={row8}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input type="hidden" name="creator_id" value={creator.id} />
                <input style={fileIn} type="file" name="photo_file" accept="image/*" />
                <input style={subin} name="photo_url" placeholder="or paste an image URL" />
                <button style={ghost} type="submit">
                  Save photo
                </button>
              </form>
              {creator.photo_url ? (
                <form action={removeAvatar} style={row8}>
                  <input type="hidden" name="handle" value={creator.handle} />
                  <button style={del} type="submit">
                    Remove photo
                  </button>
                </form>
              ) : null}
              <p style={hint}>
                Square images look best. Uploading a new photo replaces the old file, so nothing piles up in storage.
              </p>
            </details>

            <details style={card} open>
              <summary style={sumStyle}>Profile, template and layout</summary>
              <form action={saveProfile}>
                <input type="hidden" name="handle" value={creator.handle} />
                <label style={lbl}>
                  Page template
                  <select style={input} name="template" defaultValue={creator.template || "classic"}>
                    <option value="classic">Classic &mdash; your current look, photo background, round avatar</option>
                    <option value="spotlight">Spotlight &mdash; flat black, tight text, photo pill buttons</option>
                    <option value="cover">Cover card &mdash; big photo banner with your name over it</option>
                  </select>
                </label>
                <label style={lbl}>
                  Display name
                  <input style={input} name="display_name" defaultValue={creator.display_name || ""} />
                </label>
                <label style={lbl}>
                  Location
                  <input style={input} name="location" defaultValue={creator.location || ""} />
                </label>
                <label style={lbl}>
                  Tagline
                  <input style={input} name="tagline" defaultValue={creator.tagline || ""} />
                </label>
                <label style={lbl}>
                  Bio
                  <textarea style={ta} name="bio" defaultValue={creator.bio || ""} />
                </label>
                <label style={lbl}>
                  <input type="checkbox" name="show_active_badge" defaultChecked={!!creator.show_active_badge} /> Show
                  active badge
                </label>
                <label style={lbl}>
                  Active badge text
                  <input style={input} name="active_text" defaultValue={creator.active_text || "Active now"} />
                </label>
                <label style={lbl}>
                  Theme (used when background mode is Theme gradient)
                  <select style={input} name="theme" defaultValue={creator.theme || "noir"}>
                    <option value="noir">Noir</option>
                    <option value="blush">Blush</option>
                    <option value="aurora">Aurora</option>
                    <option value="gold">Gold</option>
                  </select>
                </label>
                <label style={lbl}>
                  Background mode
                  <select style={input} name="bg_mode" defaultValue={creator.background_type || "theme"}>
                    <option value="theme">Theme gradient</option>
                    <option value="color">Solid color (uses hex below)</option>
                    <option value="image">Uploaded image</option>
                    <option value="video">Uploaded video</option>
                  </select>
                </label>
                <label style={lbl}>
                  Background fit
                  <select style={input} name="bg_fit" defaultValue={creator.bg_fit || "cover"}>
                    <option value="cover">Fill the screen &mdash; crops the edges, never leaves gaps</option>
                    <option value="contain">Fit the whole image &mdash; shows all of it, may letterbox</option>
                  </select>
                </label>
                <label style={lbl}>
                  Solid color hex (used when mode = Solid color)
                  <input
                    style={input}
                    name="bg_color"
                    defaultValue={creator.background_type === "color" ? creator.background_url || "" : ""}
                    placeholder="#101010"
                  />
                </label>
                <label style={lbl}>
                  Embed arrangement
                  <select style={input} name="embed_layout" defaultValue={creator.embed_layout || "stack"}>
                    <option value="stack">1. Stack &mdash; every embed full size, one under another</option>
                    <option value="carousel">2. Carousel &mdash; one at a time, arrows and dots</option>
                    <option value="deck">3. Deck sideways &mdash; front card with the others peeking right</option>
                    <option value="deck-v">4. Deck stacked &mdash; front card with the others peeking below</option>
                    <option value="grid">5. Picker grid &mdash; Instagram style tiles, tap one to open it</option>
                    <option value="spotlight">6. Spotlight &mdash; one big player with a thumbnail strip</option>
                  </select>
                </label>
                <label style={lbl}>
                  <input type="checkbox" name="show_subscribe" defaultChecked={!!creator.show_subscribe} /> Show email
                  subscribe box on public page
                </label>
                <label style={lbl}>
                  Subscribe box title
                  <input style={input} name="subscribe_title" defaultValue={creator.subscribe_title || "Get notified"} />
                </label>
                <label style={lbl}>
                  Subscribe box note (optional)
                  <input
                    style={input}
                    name="subscribe_note"
                    defaultValue={creator.subscribe_note || ""}
                    placeholder={"Drop your email for new drops & links"}
                  />
                </label>
                <button style={btn} type="submit">
                  Save profile
                </button>
              </form>
            </details>

            <details style={card} open>
              <summary style={sumStyle}>Section order on the public page</summary>
              <p style={hint2}>
                Top of this list is top of your page. Move the subscribe box above your buttons, push embeds up over the
                links, whatever order you want.
              </p>
              {order.map((key, i) => (
                <div key={key} style={orderRow}>
                  <span style={orderNum}>{i + 1}</span>
                  <span style={orderName}>{SECTION_LABELS[key]}</span>
                  <form action={moveSection}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="direction" value="up" />
                    <button style={ghost} type="submit" disabled={i === 0}>
                      &uarr;
                    </button>
                  </form>
                  <form action={moveSection}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="direction" value="down" />
                    <button style={ghost} type="submit" disabled={i === order.length - 1}>
                      &darr;
                    </button>
                  </form>
                </div>
              ))}
            </details>

            <details style={card}>
              <summary style={sumStyle}>Background image / video</summary>
              <p style={hint2}>
                Upload a file here, then set <b>Background mode</b> to Image or Video and click <b>Save profile</b>.
                Uploading also switches the mode for you.
              </p>
              <form action={uploadBackground} encType="multipart/form-data" style={row8}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input type="hidden" name="creator_id" value={creator.id} />
                <input type="hidden" name="kind" value="image" />
                <input style={fileIn} type="file" name="file" accept="image/*" />
                <button style={ghost} type="submit">
                  Upload image
                </button>
                {creator.bg_image_url ? <span style={okTag}>&#10003; image set</span> : null}
              </form>
              <form action={uploadBackground} encType="multipart/form-data" style={row8}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input type="hidden" name="creator_id" value={creator.id} />
                <input type="hidden" name="kind" value="video" />
                <input style={fileIn} type="file" name="file" accept="video/*" />
                <button style={ghost} type="submit">
                  Upload video
                </button>
                {creator.bg_video_url ? <span style={okTag}>&#10003; video set</span> : null}
              </form>
              <p style={hint}>
                A new upload replaces the previous background file, so only one image and one video are ever stored.
                Backgrounds get a soft dark overlay so your text stays readable, and they now scale with the browser
                window instead of staying a fixed size.
              </p>
            </details>

            <details style={card} open>
              <summary style={sumRow}>
                Links, embeds and videos <span style={tag}>{rows.length}</span>
              </summary>
              <p style={hint2}>
                Each row below opens on its own. Type <b>button</b> = tappable button, <b>embed</b> = post or player
                card, <b>video</b> = your own uploaded clip.
              </p>
              {rows.map((l: Record<string, unknown>) => {
                const dest = (l.destinations as { url: string }[]) || []
                const label = String(l.label || "Untitled")
                const type = String(l.type || "button")
                const hidden = l.is_active === false
                return (
                  <details key={String(l.id)} style={item}>
                    <summary style={sumRow}>
                      <span style={{ flex: 1 }}>{label}</span>
                      <span style={tag}>{type}</span>
                      {hidden ? <span style={tag}>hidden</span> : null}
                    </summary>

                    <form action={updateLink}>
                      <input type="hidden" name="handle" value={creator.handle} />
                      <input type="hidden" name="id" value={String(l.id)} />
                      <div style={row8}>
                        <input style={lin} name="label" defaultValue={label} placeholder="Label" />
                        <select style={sel110} name="type" defaultValue={type}>
                          <option value="button">button</option>
                          <option value="embed">embed</option>
                          <option value="video">video</option>
                        </select>
                      </div>
                      <input
                        style={input}
                        name="url"
                        defaultValue={(dest[0] && dest[0].url) || ""}
                        placeholder="https://...  (for video: the tap target)"
                      />
                      <div style={row8}>
                        <input style={iin} name="icon" defaultValue={String(l.icon || "")} placeholder="icon url" />
                        <input
                          style={subin}
                          name="subtitle"
                          defaultValue={String(l.subtitle || "")}
                          placeholder="subtitle"
                        />
                      </div>
                      <div style={row8}>
                        <select style={sel100} name="size" defaultValue={String(l.size || "md")}>
                          <option value="sm">sm</option>
                          <option value="md">md</option>
                          <option value="lg">lg</option>
                        </select>
                        <select style={sel110} name="shape" defaultValue={String(l.shape || "pill")}>
                          <option value="pill">pill</option>
                          <option value="rounded">rounded</option>
                          <option value="square">square</option>
                        </select>
                        <input style={sel110} name="color" defaultValue={String(l.color || "")} placeholder="#color" />
                        <label style={albl}>
                          <input type="checkbox" name="is_active" defaultChecked={l.is_active !== false} /> active
                        </label>
                      </div>
                      <button style={btn} type="submit">
                        Save link
                      </button>
                    </form>

                    <details style={item}>
                      <summary style={albl}>Images: button icon, preview banner, uploaded clip</summary>
                      <form action={saveIcon} encType="multipart/form-data" style={vrow}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input style={fileIn} type="file" name="icon_file" accept="image/*" />
                        <input style={subin} name="icon_url" placeholder="or paste icon image URL" />
                        <button style={ghost} type="submit">
                          Save icon
                        </button>
                        {l.icon ? <span style={okTag}>&#10003; custom icon</span> : null}
                      </form>

                      <form action={savePreview} encType="multipart/form-data" style={vrow}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input style={fileIn} type="file" name="preview_file" accept="image/*" />
                        <input style={subin} name="preview_url" placeholder="or paste image URL" />
                        <button style={ghost} type="submit">
                          Save preview
                        </button>
                        {l.preview_image_url ? <span style={okTag}>&#10003; preview set</span> : null}
                      </form>

                      <form action={uploadVideo} encType="multipart/form-data" style={vrow}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input style={fileIn} type="file" name="video" accept="video/*" />
                        <button style={ghost} type="submit">
                          Upload video
                        </button>
                        {l.media_url ? <span style={okTag}>&#10003; video uploaded</span> : null}
                      </form>
                    </details>

                    <details style={item}>
                      <summary style={albl}>Country routing for this link</summary>
                      <form action={saveGeoRules} style={row8}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <label style={lbl}>
                          One rule per line, format <b>NG,GH = https://t.me/africa</b>
                          <textarea
                            style={ta}
                            name="geo_rules"
                            defaultValue={((l.geo_rules as { countries: string[]; url: string }[]) || [])
                              .map((r) => r.countries.join(",") + " = " + r.url)
                              .join(String.fromCharCode(10))}
                            placeholder="NG,GH = https://t.me/africa"
                          />
                        </label>
                        <button style={ghost} type="submit">
                          Save country rules
                        </button>
                      </form>
                      <p style={hint}>
                        Link rotation lives in the <b>Geoblocking</b> tab so every rotation group sits in one place.
                      </p>
                    </details>

                    <div style={row8}>
                      <form action={moveLink}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input type="hidden" name="direction" value="up" />
                        <button style={ghost} type="submit">
                          &uarr;
                        </button>
                      </form>
                      <form action={moveLink}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input type="hidden" name="direction" value="down" />
                        <button style={ghost} type="submit">
                          &darr;
                        </button>
                      </form>
                      <form action={deleteLink}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <button style={del} type="submit">
                          Delete
                        </button>
                      </form>
                      {l.icon ? (
                        <form action={removeIcon}>
                          <input type="hidden" name="handle" value={creator.handle} />
                          <input type="hidden" name="id" value={String(l.id)} />
                          <button style={del} type="submit">
                            Remove icon
                          </button>
                        </form>
                      ) : null}
                      {l.preview_image_url ? (
                        <form action={removePreview}>
                          <input type="hidden" name="handle" value={creator.handle} />
                          <input type="hidden" name="id" value={String(l.id)} />
                          <button style={del} type="submit">
                            Remove preview
                          </button>
                        </form>
                      ) : null}
                      {l.media_url ? (
                        <form action={removeVideo}>
                          <input type="hidden" name="handle" value={creator.handle} />
                          <input type="hidden" name="id" value={String(l.id)} />
                          <button style={del} type="submit">
                            Remove video
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </details>
                )
              })}

              <details style={item} open={rows.length === 0}>
                <summary style={sumRow}>+ Add a link, embed or video</summary>
                <form action={addLinkFull} encType="multipart/form-data">
                  <input type="hidden" name="handle" value={creator.handle} />
                  <input type="hidden" name="creator_id" value={creator.id} />
                  <div style={row8}>
                    <input style={lin} name="label" placeholder="New label" />
                    <select style={sel110} name="type" defaultValue="button">
                      <option value="button">button</option>
                      <option value="embed">embed</option>
                      <option value="video">video</option>
                    </select>
                  </div>
                  <input style={input} name="url" placeholder="https://..." />
                  <div style={row8}>
                    <input style={fileIn} type="file" name="icon_file" accept="image/*" />
                    <input style={subin} name="icon_url" placeholder="or paste icon image URL" />
                  </div>
                  <button style={btn} type="submit">
                    Add link
                  </button>
                  <p style={hint}>
                    Leave the icon empty and the site falls back to the favicon of the destination.
                  </p>
                </form>
              </details>
            </details>

            <details style={card}>
              <summary style={sumRow}>
                Social icon row <span style={tag}>{socials.length}</span>
              </summary>
              {socials.map((s, i) => (
                <div key={i} style={srow}>
                  <form action={updateSocial} style={frow}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <input style={pin} name="platform" defaultValue={s.platform} />
                    <input style={uin} name="url" defaultValue={s.url} />
                    <button style={ghost} type="submit">
                      Save
                    </button>
                  </form>
                  <form action={moveSocial}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <input type="hidden" name="direction" value="up" />
                    <button style={ghost} type="submit">
                      &uarr;
                    </button>
                  </form>
                  <form action={moveSocial}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <input type="hidden" name="direction" value="down" />
                    <button style={ghost} type="submit">
                      &darr;
                    </button>
                  </form>
                  <form action={deleteSocial}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <button style={del} type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              ))}
              <form action={addSocial} style={arow}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input style={pin} name="platform" placeholder="instagram" />
                <input style={uin} name="url" placeholder="https://instagram.com/ava" />
                <button style={btn} type="submit">
                  Add
                </button>
              </form>
              <p style={hint}>
                Platform names use Simple Icons slugs: instagram, tiktok, telegram, x, threads, snapchat, reddit,
                discord, twitch, youtube, and so on.
              </p>
            </details>

            <details style={card}>
              <summary style={sumStyle}>Visual builder &mdash; drag to reorder and resize</summary>
              <p style={hint2}>
                Drag the handle to reorder, or use the arrows on phones. Tap S/M/L to resize, then <b>Save layout</b>.
              </p>
              <Builder handle={creator.handle} items={builderItems} onSave={saveLayout} />
            </details>

            <details style={card}>
              <summary style={sumRow}>
                Subscribers <span style={tag}>{subRows.length}</span>
              </summary>
              <div style={statRow}>
                <span style={statNum}>{subRows.length}</span>
                <span style={albl}>total email{subRows.length === 1 ? "" : "s"} collected</span>
              </div>
              {subRows.length === 0 ? (
                <p style={hint}>No subscribers yet. Turn on the subscribe box above, save, then share your page.</p>
              ) : (
                subRows.map((s, i) => (
                  <div key={i} style={subItem}>
                    <span>{s.email}</span>
                    <span style={subDate}>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </details>
          </div>

          <aside style={colSide}>
            <div style={phoneCard}>
              <div style={previewTitle}>Live Preview</div>
              <div style={phone}>
                <iframe src={previewSrc} style={iframeStyle} title="Live preview" />
              </div>
              <a href={"/" + creator.handle} target="_blank" rel="noopener noreferrer" style={link}>
                &#8599; Open live page
              </a>
              <p style={previewNote}>
                The preview reloads every time you save. Preview visits are not counted in your analytics.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
