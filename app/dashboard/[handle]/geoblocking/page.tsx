import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { saveBlockedCountries, saveGeoRules, saveRotation } from "../edit/actions"

export const dynamic = "force-dynamic"

type Destination = { url?: string; disabled?: boolean }
type GeoRule = { countries?: string[]; url?: string }

type LinkRow = {
  id: string
  label: string | null
  rotate: boolean | null
  rotation_urls: unknown
  geo_rules: unknown
  destinations: unknown
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v).trim()).filter((v) => v.length > 0)
}

// saveGeoRules parses one rule per line in the form COUNTRY,COUNTRY=url,
// so the stored JSON has to be rendered back into that exact shape.
function rulesToText(value: unknown): string {
  if (!Array.isArray(value)) return ""
  const lines: string[] = []
  for (const raw of value) {
    const rule = raw as GeoRule
    const countries = Array.isArray(rule.countries) ? rule.countries.join(",") : ""
    const url = rule.url ? String(rule.url) : ""
    if (!countries || !url) continue
    lines.push(countries + "=" + url)
  }
  return lines.join("\n")
}

function firstDestination(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return ""
  const d = value[0] as Destination
  return d && d.url ? String(d.url) : ""
}

export default async function GeoblockingPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  const { data: creatorData } = await supabaseAdmin
    .from("creators")
    .select("id, handle, blocked_countries, blocked_redirect_url")
    .eq("handle", handle)
    .single()

  const creator = creatorData as unknown as {
    id: string
    handle: string
    blocked_countries: unknown
    blocked_redirect_url: string | null
  } | null

  if (!creator) {
    return (
      <div className="page-header">
        <div className="page-title">No page called &ldquo;{handle}&rdquo;</div>
      </div>
    )
  }

  const { data: linkData } = await supabaseAdmin
    .from("links")
    .select("id, label, rotate, rotation_urls, geo_rules, destinations")
    .eq("creator_id", creator.id)
    .order("position", { ascending: true })

  const links = (linkData || []) as unknown as LinkRow[]
  const blocked = asStringArray(creator.blocked_countries)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Geoblocking</div>
        <div className="page-sub">
          Block visitors from specific countries and control where each link sends people.
        </div>
      </div>

      <form action={saveBlockedCountries}>
        <input type="hidden" name="handle" value={creator.handle} />

        <div className="geo-card">
          <h3>Blocked Countries</h3>
          {blocked.length === 0 ? (
            <div className="breakdown-empty">No countries blocked. Add them below.</div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              {blocked.map((c) => (
                <span key={c} className="country-tag">
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="form-row">
            <label className="form-label" htmlFor="blocked_countries">
              Two-letter codes, comma separated
            </label>
            <input
              id="blocked_countries"
              className="form-input"
              name="blocked_countries"
              defaultValue={blocked.join(", ")}
              placeholder="US, GB, DE"
            />
          </div>
          <div className="page-sub">
            Codes are ISO 3166 alpha-2, so NG is Nigeria and GB is the United Kingdom. Detection comes from
            Vercel and is blank on localhost.
          </div>
        </div>

        <div className="geo-card">
          <h3>Redirect URL</h3>
          <div className="page-sub" style={{ marginBottom: 12 }}>
            Blocked visitors go here instead of seeing the block screen. Leave empty to show the block screen.
          </div>
          <div className="form-row">
            <input
              className="form-input"
              name="blocked_redirect_url"
              defaultValue={creator.blocked_redirect_url || ""}
              placeholder="https://..."
            />
          </div>
          <button className="btn-primary" type="submit">
            Save geoblocking
          </button>
        </div>
      </form>

      <div className="geo-card">
        <h3>Link Rotation</h3>
        <div className="page-sub" style={{ marginBottom: 14 }}>
          Give a button several URLs and traffic is spread evenly across them, one visitor after another.
          Useful for backup links when one gets taken down.
        </div>

        {links.length === 0 ? (
          <div className="breakdown-empty">No links yet. Add some in the Page Editor first.</div>
        ) : (
          links.map((l) => (
            <form key={"rot-" + l.id} action={saveRotation} style={{ marginBottom: 18 }}>
              <input type="hidden" name="handle" value={creator.handle} />
              <input type="hidden" name="id" value={l.id} />
              <div className="form-label">{l.label || "Untitled link"}</div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "8px 0" }}>
                <input type="checkbox" name="rotate" defaultChecked={!!l.rotate} />
                Rotate this link
              </label>
              <textarea
                className="form-input"
                name="rotation_urls"
                rows={3}
                defaultValue={asStringArray(l.rotation_urls).join("\n")}
                placeholder={"https://example.com/one\nhttps://example.com/two"}
              />
              <div className="page-sub" style={{ margin: "6px 0 8px" }}>
                One URL per line. Falls back to {firstDestination(l.destinations) || "the link's own URL"} when
                rotation is off.
              </div>
              <button className="btn-primary" type="submit">
                Save rotation
              </button>
            </form>
          ))
        )}
      </div>

      <div className="geo-card">
        <h3>Country routing per link</h3>
        <div className="page-sub" style={{ marginBottom: 14 }}>
          Send visitors from certain countries to a different URL for one specific button. One rule per line,
          written as country codes then an equals sign then the URL. Country rules win over rotation.
        </div>

        {links.length === 0 ? (
          <div className="breakdown-empty">No links yet.</div>
        ) : (
          links.map((l) => (
            <form key={"geo-" + l.id} action={saveGeoRules} style={{ marginBottom: 18 }}>
              <input type="hidden" name="handle" value={creator.handle} />
              <input type="hidden" name="id" value={l.id} />
              <div className="form-label">{l.label || "Untitled link"}</div>
              <textarea
                className="form-input"
                name="geo_rules"
                rows={3}
                defaultValue={rulesToText(l.geo_rules)}
                placeholder={"US,CA=https://example.com/north-america\nNG=https://example.com/ng"}
              />
              <button className="btn-primary" type="submit" style={{ marginTop: 8 }}>
                Save routing
              </button>
            </form>
          ))
        )}
      </div>
    </div>
  )
}
