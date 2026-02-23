import { ImageResponse } from "next/og"
import { getTodaysFood, bioticLabels } from "@/lib/foods"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "Today's Food — EatoBiotics"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

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
  badge: string; badgeText: string
  panelBg: string; panelBorder: string; accent: string
}> = {
  prebiotic:  { badge: B.green,  badgeText: "#fff",  panelBg: "#EBF7E1", panelBorder: "#C4E8A4", accent: B.green  },
  probiotic:  { badge: B.teal,   badgeText: "#fff",  panelBg: "#E2F5EF", panelBorder: "#9ED9C3", accent: B.teal   },
  postbiotic: { badge: B.orange, badgeText: "#fff",  panelBg: "#FEF3E2", panelBorder: "#FACB88", accent: B.orange },
  protein:    { badge: B.yellow, badgeText: B.fore,  panelBg: "#FEF9E2", panelBorder: "#F5E087", accent: "#C49A10"},
}

function clamp(str: string, max: number): string {
  if (str.length <= max) return str
  const cut = str.lastIndexOf(" ", max)
  return str.slice(0, cut > 0 ? cut : max) + "\u2026"
}

export default async function TodayOGImage() {
  const food = getTodaysFood()
  const t = theme[food.biotic] ?? theme.prebiotic

  const now = new Date()
  const dateString = now.toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const nameFontSize = food.name.length > 14 ? 56 : food.name.length > 10 ? 70 : 84
  const categoryLine = food.county
    ? food.category + "  \u00b7  " + food.county + ", Ireland"
    : food.category

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: B.white, display: "flex", flexDirection: "row", fontFamily: "'Helvetica Neue', Arial, sans-serif", overflow: "hidden" }}>

        {/* ─── LEFT CONTENT PANEL (680 px) ─── */}
        <div style={{ width: 680, height: 630, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0 48px 28px 48px", position: "relative", background: B.white }}>

          {/* Full-spectrum brand stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 680, height: 6, background: BRAND_STRIPE }} />

          {/* LOGO ROW */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 26 }}>
            <img src={OG_ICON_BASE64} width={36} height={36} style={{ borderRadius: 8, flexShrink: 0 }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: B.fore, letterSpacing: "-0.3px" }}>EatoBiotics</span>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: B.border, marginLeft: 4, marginRight: 4 }} />
            <span style={{ fontSize: 12, color: B.faint, fontStyle: "italic" }}>The food system inside you.</span>
            <div style={{ flex: 1 }} />
            {/* Date pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: B.offBg, border: "1px solid " + B.border, borderRadius: 100, padding: "4px 12px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.badge }} />
              <span style={{ fontSize: 11, color: B.muted, fontWeight: 500 }}>{dateString}</span>
            </div>
          </div>

          {/* TODAY LABEL + FOOD NAME BLOCK */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Today label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", background: t.badge, color: t.badgeText, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 11px", borderRadius: 100 }}>
                {bioticLabels[food.biotic]}
              </div>
              <div style={{ display: "flex", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: B.faint }}>
                {"Today's Food  \u00b7  " + categoryLine}
              </div>
            </div>

            {/* Big food name */}
            <div style={{ display: "flex", fontSize: nameFontSize, fontWeight: 800, color: B.fore, lineHeight: 0.9, letterSpacing: "-3px" }}>
              {food.name}
            </div>

            {/* Tagline */}
            <div style={{ display: "flex", fontSize: 19, fontStyle: "italic", color: t.accent, fontWeight: 500, lineHeight: 1.25 }}>
              {food.tagline}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div style={{ display: "flex", fontSize: 14, color: B.muted, lineHeight: 1.6, borderLeft: "3px solid " + t.badge, paddingLeft: 14 }}>
            {clamp(food.description, 215)}
          </div>

          {/* BENEFIT PILLS */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {food.benefits.slice(0, 3).map((b) => (
              <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 5, background: t.panelBg, border: "1px solid " + t.panelBorder, borderRadius: 100, padding: "4px 11px", fontSize: 11, fontWeight: 600, color: t.accent }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.badge }} />
                {b.title}
              </div>
            ))}
          </div>

          {/* BOTTOM: Pairs + brand pill decoration */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid " + B.border, paddingTop: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 10, color: B.faint, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>Pairs with</div>
              {food.pairsWith.slice(0, 4).map((p) => (
                <div key={p} style={{ display: "flex", background: B.offBg, border: "1px solid " + B.border, borderRadius: 100, padding: "2px 9px", fontSize: 11, color: B.muted, fontWeight: 500 }}>
                  {p}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {BIOTIC_PILLS.map((color, i) => (
                <div key={i} style={{ display: "flex", width: 38, height: 5, borderRadius: 999, background: color }} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT VISUAL PANEL (520 px) ─── */}
        <div style={{ flex: 1, height: 630, background: B.white, borderLeft: "1px solid " + B.border, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>

          {/* Brand stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: BRAND_STRIPE }} />

          {/* Updated Daily badge */}
          <div style={{ position: "absolute", top: 22, display: "flex", alignItems: "center", gap: 6, background: B.offBg, border: "1px solid " + B.border, borderRadius: 100, padding: "5px 14px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.badge }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: t.accent, textTransform: "uppercase" }}>
              Updated Daily
            </span>
          </div>

          {/* Giant emoji — clean, no circles, no shadows */}
          <div style={{ display: "flex", fontSize: 180, lineHeight: 1 }}>
            {food.emoji}
          </div>

          {/* Food name */}
          <div style={{ display: "flex", marginTop: 14, fontSize: 26, fontWeight: 800, color: B.fore, letterSpacing: "-1px" }}>
            {food.name}
          </div>

          {/* How to eat snippet */}
          <div style={{ display: "flex", marginTop: 8, maxWidth: 340, fontSize: 12, color: B.muted, textAlign: "center", lineHeight: 1.55, padding: "0 20px" }}>
            {clamp(food.howToEat, 95)}
          </div>

          {/* Science citation */}
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", background: B.offBg, border: "1px solid " + B.border, borderRadius: 100, padding: "3px 12px", fontSize: 10, color: B.faint }}>
              {"\uD83D\uDCD6 " + food.scienceSource}
            </div>
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
