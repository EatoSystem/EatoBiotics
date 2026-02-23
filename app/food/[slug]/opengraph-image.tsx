import { ImageResponse } from "next/og"
import { getFoodBySlug, bioticLabels } from "@/lib/foods"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "EatoBiotics Food Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// ── Brand palette — mirrors globals.css ───────────────────────────────────────
const B = {
  white:  "#FFFFFF",
  fore:   "#1A2E12",
  muted:  "#5A6E50",
  faint:  "#8FA882",
  border: "#E5E5E5",
  offBg:  "#F7F7F7",
  lime:   "#A8E063",
  green:  "#4CB648",
  teal:   "#2DAA6E",
  yellow: "#F5C518",
  orange: "#F5A623",
}

const BIOTIC_PILLS = [B.lime, B.green, B.teal, B.yellow, B.orange]

const BRAND_STRIPE = [
  "linear-gradient(90deg,",
  B.lime + ",",
  B.green + ",",
  B.teal + ",",
  B.yellow + ",",
  B.orange + ")",
].join(" ")

const theme: Record<string, {
  badge: string; badgeText: string; accent: string
  panelBg: string; panelBorder: string
}> = {
  prebiotic:  { badge: B.green,  badgeText: "#fff",  accent: B.green,  panelBg: "#EBF7E1", panelBorder: "#C4E8A4" },
  probiotic:  { badge: B.teal,   badgeText: "#fff",  accent: B.teal,   panelBg: "#E2F5EF", panelBorder: "#9ED9C3" },
  postbiotic: { badge: B.orange, badgeText: "#fff",  accent: B.orange, panelBg: "#FEF3E2", panelBorder: "#FACB88" },
  protein:    { badge: B.yellow, badgeText: B.fore,  accent: "#C49A10", panelBg: "#FEF9E2", panelBorder: "#F5E087" },
}

export default async function FoodOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const food = getFoodBySlug(slug)

  if (!food) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: B.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 64, fontWeight: 800, color: B.fore }}>EatoBiotics</span>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  const t = theme[food.biotic] ?? theme.prebiotic

  // Adaptive name size — stays legible even at mobile preview scale (~25%)
  const nameFontSize =
    food.name.length <= 7  ? 110 :
    food.name.length <= 12 ? 90  :
    food.name.length <= 17 ? 72  : 58

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: B.white,
        display: "flex", flexDirection: "row",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
      }}>

        {/* ─── LEFT CONTENT PANEL (620 px) ─── */}
        <div style={{
          width: 620, height: 630, flexShrink: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          padding: "0 56px 32px 56px",
          position: "relative",
          background: B.white,
        }}>

          {/* Full-spectrum brand stripe — 12 px for visibility at mobile scale */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 620, height: 12, background: BRAND_STRIPE }} />

          {/* GROUP 1 — Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 30 }}>
            <img src={OG_ICON_BASE64} width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: B.fore, letterSpacing: "-0.5px" }}>EatoBiotics</span>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: B.border, marginLeft: 6, marginRight: 6 }} />
            <span style={{ fontSize: 13, color: B.faint, fontStyle: "italic" }}>The food system inside you.</span>
          </div>

          {/* GROUP 2 — Hero content (biotic + name + tagline) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Biotic badge + category */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                display: "flex",
                background: t.badge, color: t.badgeText,
                fontSize: 12, fontWeight: 700, letterSpacing: "2px",
                textTransform: "uppercase", padding: "5px 14px", borderRadius: 100,
              }}>
                {bioticLabels[food.biotic]}
              </div>
              <div style={{
                display: "flex",
                fontSize: 13, fontWeight: 600, letterSpacing: "1.5px",
                textTransform: "uppercase", color: B.faint,
              }}>
                {food.county
                  ? food.category + "  \u00b7  " + food.county
                  : food.category}
              </div>
            </div>

            {/* HUGE food name — the #1 element at mobile scale */}
            <div style={{
              display: "flex",
              fontSize: nameFontSize,
              fontWeight: 800, color: B.fore,
              lineHeight: 0.9, letterSpacing: "-4px",
            }}>
              {food.name}
            </div>

            {/* Tagline — italic accent, big enough to read at mobile */}
            <div style={{
              display: "flex",
              fontSize: 26, fontStyle: "italic",
              color: t.accent, fontWeight: 500, lineHeight: 1.3,
            }}>
              {food.tagline}
            </div>
          </div>

          {/* GROUP 3 — Brand pill decoration (matches site .biotic-pill motif) */}
          <div style={{ display: "flex", gap: 5 }}>
            {BIOTIC_PILLS.map((color, i) => (
              <div key={i} style={{ display: "flex", width: 44, height: 8, borderRadius: 999, background: color }} />
            ))}
          </div>
        </div>

        {/* ─── RIGHT VISUAL PANEL (580 px) ─── */}
        <div style={{
          flex: 1, height: 630,
          background: B.white,
          borderLeft: "1px solid " + B.border,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>

          {/* Brand stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: BRAND_STRIPE }} />

          {/* Biotic badge — still readable as a coloured block at mobile */}
          <div style={{
            position: "absolute", top: 26,
            display: "flex", alignItems: "center", gap: 7,
            background: t.panelBg, border: "2px solid " + t.panelBorder,
            borderRadius: 100, padding: "6px 18px",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.badge }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", color: t.accent, textTransform: "uppercase" }}>
              {bioticLabels[food.biotic]}
            </span>
          </div>

          {/* GIANT emoji — the mobile hero element */}
          <div style={{ display: "flex", fontSize: 260, lineHeight: 1 }}>
            {food.emoji}
          </div>

          {/* Food name below emoji */}
          <div style={{
            display: "flex",
            marginTop: 16,
            fontSize: 32, fontWeight: 800, color: B.fore, letterSpacing: "-1px",
          }}>
            {food.name}
          </div>

          {/* Category label */}
          <div style={{
            display: "flex",
            marginTop: 6,
            fontSize: 13, fontWeight: 600,
            color: B.faint, letterSpacing: "1.5px", textTransform: "uppercase",
          }}>
            {food.category}
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
