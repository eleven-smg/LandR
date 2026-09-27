import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import type { CSSProperties } from "react"
import { saveConsent } from "./actions"

export const dynamic = "force-dynamic"

const nf: CSSProperties = { padding: 24, color: "#fff" }
const wrap: CSSProperties = { maxWidth: 820 }
const head: CSSProperties = { marginBottom: 20 }
const title: CSSProperties = { fontSize: 20, fontWeight: 700 }
const sub: CSSProperties = { color: "#8892a4", fontSize: 13, marginTop: 4 }
const card: CSSProperties = {
  padding: 20,
  borderRadius: 14,
  background: "#151922",
  border: "1px solid #222836",
}
const row: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 }
const label: CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }
const hint: CSSProperties = { color: "#8892a4", fontSize: 12, marginTop: 6 }
const input: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #2a3140",
  background: "#0f131a",
  color: "#fff",
  fontSize: 13,
}
const area: CSSProperties = { ...input, minHeight: 80, resize: "vertical" }
const button: CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#fff",
  color: "#11141a",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
}
const note: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: "#1a1410",
  border: "1px solid #3a2a18",
  color: "#e8c99a",
  fontSize: 12,
  lineHeight: 1.6,
}

export default async function PrivacyPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, handle, consent_banner_enabled, consent_banner_text, consent_privacy_url")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  if (!creator) return <main style={nf}>Creator not found.</main>

  const enabled = creator.consent_banner_enabled === true

  return (
    <div style={wrap}>
      <div style={head}>
        <div style={title}>Privacy</div>
        <div style={sub}>Ask visitors before keeping anything on their device.</div>
      </div>

      <form action={saveConsent} style={card}>
        <input type="hidden" name="handle" value={String(creator.handle)} />

        <div style={row}>
          <input
            type="checkbox"
            id="consent_banner_enabled"
            name="consent_banner_enabled"
            defaultChecked={enabled}
            style={{ marginTop: 3 }}
          />
          <label htmlFor="consent_banner_enabled" style={{ fontSize: 13, lineHeight: 1.5 }}>
            <b>Show a cookie notice on my page</b>
            <div style={hint}>
              Off by default. While it is on, no visitor id is stored and no time-on-page is measured
              until someone taps Accept, so your Visitors, Sessions and Time-on-page numbers will read
              lower than your view count.
            </div>
          </label>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label htmlFor="consent_banner_text" style={label}>
            Notice text
          </label>
          <textarea
            id="consent_banner_text"
            name="consent_banner_text"
            defaultValue={String(creator.consent_banner_text || "")}
            maxLength={400}
            placeholder="Leave empty to use the default wording."
            style={area}
          />
          <div style={hint}>Up to 400 characters.</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label htmlFor="consent_privacy_url" style={label}>
            Privacy policy link (optional)
          </label>
          <input
            id="consent_privacy_url"
            name="consent_privacy_url"
            type="text"
            defaultValue={String(creator.consent_privacy_url || "")}
            placeholder="example.com/privacy"
            style={input}
          />
          <div style={hint}>Shown as a small link inside the notice.</div>
        </div>

        <button type="submit" style={button}>
          Save
        </button>

        <div style={note}>
          <b>What the notice does not cover.</b> One anonymous view row is still written when the page
          is built, before anybody can answer: country, device, browser and referrer, with no id tying
          it to a person. Only the device id, the session id and the time-on-page pings wait for
          consent. If you need that first row to wait too, say so and it becomes a code change, not a
          setting.
        </div>
      </form>
    </div>
  )
}
