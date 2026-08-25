export type TemplateId = "classic" | "spotlight" | "mosaic"

export type TemplateInfo = {
  id: TemplateId
  name: string
  blurb: string
  /** True when the look paints a full-screen photo or video behind everything. */
  usesBackground: boolean
  /** True when the look is one flat colour instead of a photo. */
  usesFlatColor: boolean
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "classic",
    name: "Classic photo",
    blurb: "Your current look. Full-screen photo or video background, round profile photo, coloured buttons.",
    usesBackground: true,
    usesFlatColor: false,
  },
  {
    id: "spotlight",
    name: "Spotlight (rachelfit style)",
    blurb: "One flat colour, small centred photo, bare social glyphs, outlined pill buttons with a round thumbnail.",
    usesBackground: false,
    usesFlatColor: true,
  },
  {
    id: "mosaic",
    name: "Mosaic tiles",
    blurb: "Photo on the left with your name beside it, then links as two columns of picture tiles.",
    usesBackground: true,
    usesFlatColor: false,
  },
]

export function normalizeTemplate(raw: unknown): TemplateId {
  const value = String(raw || "").toLowerCase()
  if (value === "spotlight") return "spotlight"
  // "cover" was the old name for this look, so old rows keep working.
  if (value === "mosaic" || value === "cover") return "mosaic"
  return "classic"
}

export function templateInfo(id: TemplateId): TemplateInfo {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

export type SubscribeStyle = "inline" | "pill" | "bar"

export const SUBSCRIBE_STYLE_LABELS: Record<SubscribeStyle, string> = {
  inline: "Card on the page (title, note, email field)",
  pill: "Small SUBSCRIBE pill that opens a pop-up (rachelfit style)",
  bar: "Slim one-line bar, no card around it",
}

export function normalizeSubscribeStyle(raw: unknown): SubscribeStyle {
  const value = String(raw || "").toLowerCase()
  if (value === "pill") return "pill"
  if (value === "bar") return "bar"
  return "inline"
}

/** Focal point percentages are stored as plain integers, so clamp defensively. */
export function clampPercent(raw: unknown, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Background zoom is a percentage; 100 means untouched. */
export function clampZoom(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 100
  return Math.min(300, Math.max(100, Math.round(n)))
}
