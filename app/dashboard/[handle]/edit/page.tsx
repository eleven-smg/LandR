import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { CSSProperties } from "react"
import Builder from "./Builder"
import ProfileForm from "./ProfileForm"
import SaveButton from "./SaveButton"
import { SECTION_LABELS, normalizeOrder } from "@/lib/sections"
import { clampPercent, clampZoom, normalizeSubscribeStyle, normalizeTemplate } from "@/lib/templates"
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

// Nothing in the editor used to react to the pointer, so there was no way to
// tell a live control from a label. These rules add the missing hover, focus
// and press states everywhere at once.
const uiCss = [
  "a, button, summary, select, label, input[type=checkbox], input[type=file], input[type=range] { cursor: pointer }",
  "input[type=text], input[type=email], input[type=url], input:not([type]), textarea { cursor: text }",
  "input, textarea, select { transition: border-color .15s ease, background .15s ease }",
  "input:hover, textarea:hover, select:hover { border-color: #3a4468 }",
  "input:focus, textarea:focus, select:focus { border-color: #5b7fff; outline: none }",
  "button { transition: filter .15s ease, transform .1s ease }",
  "button:hover { filter: brightness(1.14) }",
  "button:active { transform: scale(.97) }",
  "button:disabled { filter: none; opacity: .4; cursor: not-allowed }",
  "summary { transition: color .15s ease }",
  "summary:hover { color: #ffffff }",
  "a:hover { text-decoration: underline }",
  "nav a, aside a { transition: background .15s ease, color .15s ease }",
  "nav a:hover { background: rgba(91,127,255,.14) }",
].join(String.fromCharCode(10))

const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
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
const lbl: CSSProperties = { fontSize: 12, color: "#9aa4c2", display: "block", marginTop: 8 }
const rowStyle: CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }
const nf: CSSProperties = { padding: 24, color: "#fff" }
const page: CSSProperties = { color: "#fff" }
const wrap: CSSProperties = { maxWidth: 1180 }
const grid: CSSProperties = { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }
const colMain: CSSProperties = { flex: 1, minWidth: 320, maxWidth: 660 }
const colSide: CSSProperties = { width: 262, flexShrink: 0, position: "sticky", top: 16 }
const phoneCard: CSSProperties = { ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }
const phone: CSSProperties = {
  width: 220,
  aspectRatio: "9 / 19",
  border: "6px solid #222",
  borderRadius: 28,
  overflow: "hidden",
  background: "#000",
}
const iframeStyle: CSSProperties = { width: "100%", height: "100%", border: "none", display: "block" }
const h1s: CSSProperties = { fontSize: 21, fontWeight: 700, marginBottom: 4 }
const sub: CSSProperties = { color: "#9aa4c2", fontSize: 13, marginBottom: 14 }
const link: CSSProperties = { color: "#5b7fff" }
const sumStyle: CSSProperties = { fontSize: 15, fontWeight: 600, cursor: "pointer" }
const sumRow: CSSProperties = { ...sumStyle, display: "flex", gap: 8, alignItems: "center" }
const ta: CSSProperties = { ...input, minHeight: 66 }
const srow: CSSProperties = { ...rowStyle, marginTop: 10, borderTop: "1px solid #232940", paddingTop: 10 }
const frow: CSSProperties = { ...rowStyle, flex: 1 }
const pin: CSSProperties = { ...input, width: 120, marginTop: 0 }
const uin: CSSProperties = { ...input, flex: 1, marginTop: 0, minWidth: 160 }
const arow: CSSProperties = { ...rowStyle, marginTop: 12 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 8 }
const hint2: CSSProperties = { color: "#6b7396", fontSize: 12, marginTop: 4 }
const item: CSSProperties = { borderTop: "1px solid #232940", paddingTop: 10, marginTop: 10 }
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
  width: 60,
  height: 60,
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid #232940",
}
const thumb: CSSProperties = {
  width: 54,
  height: 84,
  borderRadius: 8,
  objectFit: "cover",
  border: "1px solid #232940",
}
const orderRow: CSSProperties = { ...rowStyle, borderTop: "1px solid #232940", paddingTop: 8, marginTop: 8 }
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
const tag: CSSProperties = { fontSize: 11, color: "#9aa4c2", background: "#232940", borderRadius: 6, padding: "2px 7px" }
const arrow: CSSProperties = {
  padding: "5px 9px",
  background: "#232940",
  border: "none",
  borderRadius: 8,
  color: "#cdd6f4",
  cursor: "pointer",
}

export default async function EditPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const { data: creator } = await supabaseAdmin.from("creators").select("*").eq("handle", handle).single()
  if (!creator) return <main style={nf}>Creator not found.</main>

  // These two used to run one after the other, which made the editor feel slow.
  const [linkResult, subResult] = await Promise.all([
    supabaseAdmin.from("links").select("*").eq("creator_id", creator.id).order("position", { ascending: true }),
    supabaseAdmin
      .from("subscribers")
      .select("email, name, created_at")
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false }),
  ])

  const rows = linkResult.data || []
  const subRows = (subResult.data || []) as { email: string; name: string | null; created_at: string }[]
  const socials: Social[] = Array.isArray(creator.socials) ? creator.socials : []

  const builderItems = rows.map((l: Record<string, unknown>) => ({
    id: String(l.id),
    label: String(l.label || ""),
    size: String(l.size || "md"),
  }))

  const order = normalizeOrder(creator.section_order)
  const previewSrc = "/" + creator.handle + "?preview=1&t=" + Date.now()
  const bgImageUrl = String(creator.bg_image_url || "")
  const bgVideoUrl = String(creator.bg_video_url || "")

  const profileValues = {
    template: normalizeTemplate(creator.template),
    display_name: String(creator.display_name || ""),
    location: String(creator.location || ""),
    tagline: String(creator.tagline || ""),
    bio: String(creator.bio || ""),
    show_active_badge: !!creator.show_active_badge,
    active_text: String(creator.active_text || "Active now"),
    theme: String(creator.theme || "noir"),
    accent_color: String(creator.accent_color || ""),
    bg_mode: String(creator.background_type || "theme"),
    bg_fit: String(creator.bg_fit || "cover"),
    bg_color: creator.background_type === "color" ? String(creator.background_url || "") : "",
    bg_pos_x: clampPercent(creator.bg_pos_x, 50),
    bg_pos_y: clampPercent(creator.bg_pos_y, 50),
    bg_zoom: clampZoom(creator.bg_zoom),
    embed_layout: String(creator.embed_template || creator.embed_layout || "stack"),
    show_subscribe: !!creator.show_subscribe,
    subscribe_style: normalizeSubscribeStyle(creator.subscribe_style),
    subscribe_title: String(creator.subscribe_title || "Get notified"),
    subscribe_note: String(creator.subscribe_note || ""),
    subscribe_button_text: String(creator.subscribe_button_text || ""),
    subscribe_ask_name: !!creator.subscribe_ask_name,
    deep_links: creator.deep_links !== false,
    share_button: creator.share_button !== false,
  }

  return (
    <main style={page}>
      <style>{uiCss}</style>
      <div style={wrap}>
        <h1 style={h1s}>Edit /{creator.handle}</h1>
        <p style={sub}>
          <a href={"/" + creator.handle} style={link}>
            View public page &rarr;
          </a>
          <span style={hint2}> Every panel opens and closes. Buttons say &quot;Saving...&quot; then &quot;Saved&quot;, so you never have to guess.</span>
        </p>

        <div style={grid}>
          <div style={colMain}>
            <details style={card} open>
              <summary style={sumRow}>
                Profile photo {creator.photo_url ? <span style={okTag}>&#10003;</span> : <span style={tag}>none yet</span>}
              </summary>
              <div style={row8}>
                {creator.photo_url ? (
                  <img src={String(creator.photo_url)} alt="" style={avatarImg} />
                ) : (
                  <span style={albl}>No photo yet &mdash; the page shows your first letter instead.</span>
                )}
              </div>
              <form action={saveAvatar} encType="multipart/form-data" style={row8}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input type="hidden" name="creator_id" value={creator.id} />
                <input style={fileIn} type="file" name="photo_file" accept="image/*" />
                <input style={subin} name="photo_url" placeholder="or paste an image URL" />
                <SaveButton label="Save photo" variant="ghost" />
              </form>
              {creator.photo_url ? (
                <form action={removeAvatar} style={row8}>
                  <input type="hidden" name="handle" value={creator.handle} />
                  <SaveButton label="Remove photo" variant="danger" confirm="Remove the profile photo?" />
                </form>
              ) : null}
              <p style={hint}>Square images look best. Each upload gets a fresh filename, so a new photo shows immediately.</p>
            </details>

            <details style={card} open>
              <summary style={sumStyle}>Page look</summary>
              <ProfileForm action={saveProfile} handle={String(creator.handle)} values={profileValues} bgImageUrl={bgImageUrl} />
            </details>

            <details style={card}>
              <summary style={sumRow}>
                Background photo or video
                {bgImageUrl || bgVideoUrl ? <span style={okTag}>&#10003;</span> : <span style={tag}>none yet</span>}
              </summary>
              <p style={hint2}>
                Upload here, then choose <b>Uploaded photo</b> or <b>Uploaded video</b> under Page look and set the crop.
              </p>
              <div style={row8}>
                {bgImageUrl ? <img src={bgImageUrl} alt="" style={thumb} /> : null}
                {bgVideoUrl ? <video src={bgVideoUrl} muted playsInline style={thumb} /> : null}
              </div>
              <form action={uploadBackground} encType="multipart/form-data" style={row8}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input type="hidden" name="creator_id" value={creator.id} />
                <input type="hidden" name="kind" value="image" />
                <input style={fileIn} type="file" name="file" accept="image/*" />
                <SaveButton label="Upload photo" variant="ghost" />
              </form>
              <form action={uploadBackground} encType="multipart/form-data" style={row8}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input type="hidden" name="creator_id" value={creator.id} />
                <input type="hidden" name="kind" value="video" />
                <input style={fileIn} type="file" name="file" accept="video/*" />
                <SaveButton label="Upload video" variant="ghost" />
              </form>
              <p style={hint}>
                The old file is deleted and the new one gets its own name, so the page can never show a stale picture.
              </p>
            </details>

            <details style={card}>
              <summary style={sumStyle}>Order of the sections on your page</summary>
              <p style={hint2}>Top of this list is top of your page. Put the email box first if you want.</p>
              {order.map((key, i) => (
                <div key={key} style={orderRow}>
                  <span style={orderNum}>{i + 1}</span>
                  <span style={orderName}>{SECTION_LABELS[key]}</span>
                  <form action={moveSection}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="direction" value="up" />
                    <button style={arrow} type="submit" disabled={i === 0}>
                      &uarr;
                    </button>
                  </form>
                  <form action={moveSection}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="direction" value="down" />
                    <button style={arrow} type="submit" disabled={i === order.length - 1}>
                      &darr;
                    </button>
                  </form>
                </div>
              ))}
            </details>

            <details style={card} open>
              <summary style={sumRow}>
                Links, embeds and videos <span style={tag}>{rows.length}</span>
              </summary>
              <p style={hint2}>
                Each row opens on its own. <b>button</b> = tappable button, <b>embed</b> = post or player, <b>video</b> = your
                own clip.
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
                        <input style={subin} name="subtitle" defaultValue={String(l.subtitle || "")} placeholder="subtitle" />
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
                      <SaveButton label="Save link" />
                    </form>

                    <details style={item}>
                      <summary style={albl}>Images: button icon, preview banner, uploaded clip</summary>
                      <form action={saveIcon} encType="multipart/form-data" style={vrow}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input style={fileIn} type="file" name="icon_file" accept="image/*" />
                        <input style={subin} name="icon_url" placeholder="or paste icon image URL" />
                        <SaveButton label="Save icon" variant="ghost" />
                        {l.icon ? <span style={okTag}>&#10003;</span> : null}
                      </form>

                      <form action={savePreview} encType="multipart/form-data" style={vrow}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input style={fileIn} type="file" name="preview_file" accept="image/*" />
                        <input style={subin} name="preview_url" placeholder="or paste image URL" />
                        <SaveButton label="Save preview" variant="ghost" />
                        {l.preview_image_url ? <span style={okTag}>&#10003;</span> : null}
                      </form>

                      <form action={uploadVideo} encType="multipart/form-data" style={vrow}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input style={fileIn} type="file" name="video" accept="video/*" />
                        <SaveButton label="Upload clip" variant="ghost" />
                        {l.media_url ? <span style={okTag}>&#10003;</span> : null}
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
                        <SaveButton label="Save country rules" variant="ghost" />
                      </form>
                      <p style={hint}>Link rotation lives in the Geoblocking tab so every rotation group sits in one place.</p>
                    </details>

                    <div style={row8}>
                      <form action={moveLink}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input type="hidden" name="direction" value="up" />
                        <button style={arrow} type="submit">
                          &uarr;
                        </button>
                      </form>
                      <form action={moveLink}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="creator_id" value={creator.id} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <input type="hidden" name="direction" value="down" />
                        <button style={arrow} type="submit">
                          &darr;
                        </button>
                      </form>
                      <form action={deleteLink}>
                        <input type="hidden" name="handle" value={creator.handle} />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <SaveButton label="Delete" variant="danger" confirm={"Delete " + label + "?"} />
                      </form>
                      {l.icon ? (
                        <form action={removeIcon}>
                          <input type="hidden" name="handle" value={creator.handle} />
                          <input type="hidden" name="id" value={String(l.id)} />
                          <SaveButton label="Remove icon" variant="danger" />
                        </form>
                      ) : null}
                      {l.preview_image_url ? (
                        <form action={removePreview}>
                          <input type="hidden" name="handle" value={creator.handle} />
                          <input type="hidden" name="id" value={String(l.id)} />
                          <SaveButton label="Remove preview" variant="danger" />
                        </form>
                      ) : null}
                      {l.media_url ? (
                        <form action={removeVideo}>
                          <input type="hidden" name="handle" value={creator.handle} />
                          <input type="hidden" name="id" value={String(l.id)} />
                          <SaveButton label="Remove clip" variant="danger" />
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
                  <SaveButton label="Add link" />
                  <p style={hint}>Leave the icon empty and the site falls back to the favicon of the destination.</p>
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
                    <SaveButton label="Save" variant="ghost" />
                  </form>
                  <form action={moveSocial}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <input type="hidden" name="direction" value="up" />
                    <button style={arrow} type="submit">
                      &uarr;
                    </button>
                  </form>
                  <form action={moveSocial}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <input type="hidden" name="direction" value="down" />
                    <button style={arrow} type="submit">
                      &darr;
                    </button>
                  </form>
                  <form action={deleteSocial}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="index" value={i} />
                    <SaveButton label="Delete" variant="danger" confirm={"Remove " + s.platform + "?"} />
                  </form>
                </div>
              ))}
              <form action={addSocial} style={arow}>
                <input type="hidden" name="handle" value={creator.handle} />
                <input style={pin} name="platform" placeholder="instagram" />
                <input style={uin} name="url" placeholder="https://instagram.com/ava" />
                <SaveButton label="Add" variant="ghost" />
              </form>
              <p style={hint}>
                Platform names use Simple Icons slugs: instagram, tiktok, telegram, x, threads, snapchat, reddit, discord,
                twitch, youtube, and so on.
              </p>
            </details>

            <details style={card}>
              <summary style={sumStyle}>Visual builder &mdash; drag to reorder and resize</summary>
              <p style={hint2}>Drag the handle to reorder, or use the arrows on phones. Tap S/M/L to resize, then Save layout.</p>
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
                <p style={hint}>No subscribers yet. Turn the subscribe box on under Page look, save, then share your page.</p>
              ) : (
                subRows.map((s, i) => (
                  <div key={i} style={subItem}>
                    <span>{s.name ? s.name + " \u00b7 " + s.email : s.email}</span>
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
