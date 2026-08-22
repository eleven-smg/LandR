import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { CSSProperties } from "react"
import Builder from "./Builder"
import {
  saveProfile,
  addSocial,
  updateSocial,
  deleteSocial,
  moveSocial,
  addLink,
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
  saveRotation,
  saveBlockedCountries,
} from "./actions"

export const dynamic = "force-dynamic"

type Social = { platform: string; url: string }

const card: CSSProperties = {
  background: "#181c27",
  border: "1px solid #232940",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
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

const nf: CSSProperties = { padding: 24, color: "#fff", background: "#0f1117", minHeight: "100vh" }
const page: CSSProperties = { background: "#0f1117", minHeight: "100vh", color: "#fff", padding: "28px 16px" }
const wrap: CSSProperties = { maxWidth: 640, margin: "0 auto" }
const h1s: CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 4 }
const sub: CSSProperties = { color: "#9aa4c2", fontSize: 13, marginBottom: 20 }
const link: CSSProperties = { color: "#5b7fff" }
const h2s: CSSProperties = { fontSize: 16, fontWeight: 600 }
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
const iin: CSSProperties = { ...input, width: 90, marginTop: 0 }
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

  return (
    <main style={page}>
      <div style={wrap}>
        <h1 style={h1s}>Edit /{creator.handle}</h1>
        <p style={sub}>
          <a href={"/" + creator.handle} style={link}>
            View public page &rarr;
          </a>
        </p>

        <form action={saveProfile} style={card}>
          <h2 style={h2s}>Profile</h2>
          <input type="hidden" name="handle" value={creator.handle} />
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
            <input type="checkbox" name="show_active_badge" defaultChecked={!!creator.show_active_badge} /> Show active
            badge
          </label>
          <label style={lbl}>
            Active badge text
            <input style={input} name="active_text" defaultValue={creator.active_text || "Active now"} />
          </label>
          <label style={lbl}>
            Theme
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
              <option value="theme">Theme gradient (uses Theme above)</option>
              <option value="color">Solid color (uses hex below)</option>
              <option value="image">Uploaded image</option>
              <option value="video">Uploaded video</option>
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
            Embed layout
            <select style={input} name="embed_layout" defaultValue={creator.embed_layout || "stack"}>
              <option value="stack">Stack &mdash; one under another (default)</option>
              <option value="deck">Deck horizontal &mdash; front card, others peek on the right</option>
              <option value="deck-v">Deck vertical &mdash; front card, others peek below</option>
              <option value="carousel">Carousel &mdash; one at a time with arrows and dots</option>
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

        <div style={card}>
          <h2 style={h2s}>Background image / video</h2>
          <p style={hint2}>
            Upload a file here, then set <b>Background mode</b> above to Image or Video and click <b>Save profile</b>.
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
            Background images and videos get a soft dark overlay so your text stays readable. Keep background videos
            short and small.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2s}>Visual builder &mdash; drag to reorder &amp; resize</h2>
          <p style={hint2}>
            Drag the handle to reorder, or use the &uarr;/&darr; buttons (these work on phones where dragging may not).
            Tap <b>S</b>/<b>M</b>/<b>L</b> to resize each item, then click <b>Save layout</b>. This sets the order and
            size of everything on your public page.
          </p>
          <Builder handle={creator.handle} items={builderItems} onSave={saveLayout} />
        </div>

        <div style={card}>
          <h2 style={h2s}>Geoblocking (whole page)</h2>
          <p style={hint2}>
            Block visitors from certain countries. Enter 2-letter country codes separated by commas (e.g.{" "}
            <b>US, GB, DE</b>). Optionally send blocked visitors to another URL instead of the block screen.
          </p>
          <form action={saveBlockedCountries}>
            <input type="hidden" name="handle" value={creator.handle} />
            <label style={lbl}>
              Blocked countries
              <input
                style={input}
                name="blocked_countries"
                defaultValue={((creator.blocked_countries as string[]) || []).join(", ")}
                placeholder="US, GB, DE"
              />
            </label>
            <label style={lbl}>
              Redirect blocked visitors to (optional)
              <input
                style={input}
                name="blocked_redirect_url"
                defaultValue={creator.blocked_redirect_url || ""}
                placeholder="https://..."
              />
            </label>
            <button style={btn} type="submit">
              Save geoblocking
            </button>
          </form>
          <p style={hint}>
            Country codes are ISO 3166 alpha-2 (NG = Nigeria, US = United States, GB = United Kingdom). Detection comes
            from Vercel and is blank on localhost.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2s}>Subscribers</h2>
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
        </div>

        <div style={card}>
          <h2 style={h2s}>Social icons</h2>
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
            Platform names use Simple Icons slugs: instagram, tiktok, telegram, x, threads, snapchat, reddit, discord,
            twitch, youtube, and so on.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2s}>Links, embeds and videos</h2>
          <p style={hint2}>
            Type <b>button</b> = tappable button. <b>embed</b> = video or post card. <b>video</b> = upload your own
            clip. Add a <b>preview image</b> to turn a button into a big featured card, and use <b>size</b> (sm/md/lg)
            to set how tall that banner is. Reorder and resize fast with the <b>Visual builder</b> above.
          </p>
          {rows.map((l: Record<string, unknown>) => {
            const dest = (l.destinations as { url: string }[]) || []
            return (
              <div key={String(l.id)} style={item}>
                <form action={updateLink}>
                  <input type="hidden" name="handle" value={creator.handle} />
                  <input type="hidden" name="id" value={String(l.id)} />
                  <div style={rowStyle}>
                    <input style={lin} name="label" defaultValue={String(l.label || "")} placeholder="Label" />
                    <select style={sel110} name="type" defaultValue={String(l.type || "button")}>
                      <option value="button">button</option>
                      <option value="embed">embed</option>
                      <option value="video">video</option>
                    </select>
                  </div>
                  <input
                    style={input}
                    name="url"
                    defaultValue={(dest[0] && dest[0].url) || ""}
                    placeholder="https://...  (for video: optional tap target)"
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
                  <button style={btn} type="submit">
                    Save link
                  </button>
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

                <details style={item}>
                  <summary style={albl}>Routing: country rules &amp; rotation</summary>
                  <form action={saveGeoRules} style={row8}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="id" value={String(l.id)} />
                    <label style={lbl}>
                      Country rules &mdash; one per line, format <b>NG,GH = https://t.me/africa</b>
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
                  <form action={saveRotation} style={vrow}>
                    <input type="hidden" name="handle" value={creator.handle} />
                    <input type="hidden" name="id" value={String(l.id)} />
                    <label style={albl}>
                      <input type="checkbox" name="rotate" defaultChecked={l.rotate === true} /> Rotate between the URLs
                      below (a random one is served each visit)
                    </label>
                    <textarea
                      style={ta}
                      name="rotation_urls"
                      defaultValue={((l.rotation_urls as string[]) || []).join(String.fromCharCode(10))}
                      placeholder="https://example.com/one"
                    />
                    <button style={ghost} type="submit">
                      Save rotation
                    </button>
                  </form>
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
              </div>
            )
          })}
          <form action={addLink} style={item}>
            <input type="hidden" name="handle" value={creator.handle} />
            <input type="hidden" name="creator_id" value={creator.id} />
            <div style={rowStyle}>
              <input style={lin} name="label" placeholder="New label" />
              <select style={sel110} name="type" defaultValue="button">
                <option value="button">button</option>
                <option value="embed">embed</option>
                <option value="video">video</option>
              </select>
            </div>
            <input style={input} name="url" placeholder="https://..." />
            <button style={btn} type="submit">
              Add link
            </button>
            <p style={hint}>
              Tip: add the row first, Save, then use its <b>Save preview</b> or <b>Upload video</b> buttons.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
