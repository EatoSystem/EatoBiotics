import { ImageResponse } from "next/og"
import { getTodaysFood, bioticLabels } from "@/lib/foods"

export const runtime = "edge"
export const alt = "Today's Food — EatoBiotics"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

// ── Brand palette (exact match to globals.css) ──────────────────────────────
const B = {
  white:     "#FFFFFF",
  offWhite:  "#F7F8F5",
  border:    "#DDE5D4",
  fore:      "#1A2E12",
  muted:     "#5A6E50",
  faint:     "#8FA882",
  lime:      "#A8E063",
  green:     "#4CB648",
  teal:      "#2DAA6E",
  yellow:    "#F5C518",
  orange:    "#F5A623",
}

const theme: Record<string, {
  badge: string; badgeText: string;
  panelBg: string; panelBorder: string;
  accent: string; glow: string;
}> = {
  prebiotic: {
    badge: B.green,   badgeText: "#fff",
    panelBg: "#EBF7E1", panelBorder: "#C4E8A4",
    accent: B.green,  glow: B.lime,
  },
  probiotic: {
    badge: B.teal,    badgeText: "#fff",
    panelBg: "#E2F5EF", panelBorder: "#9ED9C3",
    accent: B.teal,   glow: "#7ECFB3",
  },
  postbiotic: {
    badge: B.orange,  badgeText: "#fff",
    panelBg: "#FEF3E2", panelBorder: "#FACB88",
    accent: B.orange, glow: B.yellow,
  },
  protein: {
    badge: B.yellow,  badgeText: B.fore,
    panelBg: "#FEF9E2", panelBorder: "#F5E087",
    accent: "#C49A10", glow: B.yellow,
  },
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  const cut = str.lastIndexOf(" ", max)
  return str.slice(0, cut > 0 ? cut : max) + "…"
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

  const pullQuote = truncate(food.description, 130)
  const scienceShort = truncate(food.science, 100)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: B.white,
          display: "flex", flexDirection: "row",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT CONTENT PANEL  (740px)
        ══════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            width: 740, height: 630, flexShrink: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
            padding: "0 52px 36px 52px",
            position: "relative",
          }}
        >
          {/* Top gradient stripe */}
          <div style={{
            position: "absolute", top: 0, left: 0, width: 740, height: 5,
            background: `linear-gradient(90deg, ${t.accent}, ${t.glow})`,
          }} />

          {/* ── LOGO ROW ── */}
          <div style={{ display: "flex", alignItems: "center", paddingTop: 28 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: `linear-gradient(135deg, ${B.green}, ${B.teal})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 180 180" fill="none">
                <path fill="white" d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z"/>
                <path fill="white" d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z"/>
              </svg>
            </div>
            <span style={{ marginLeft: 10, fontSize: 20, fontWeight: 700, color: B.fore, letterSpacing: "-0.4px" }}>
              EatoBiotics
            </span>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: B.border, margin: "0 10px" }} />
            <span style={{ fontSize: 14, color: B.faint, fontStyle: "italic" }}>
              The food system inside you.
            </span>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Date pill — top right of left panel */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: B.offWhite, border: `1px solid ${B.border}`,
              borderRadius: 100, padding: "5px 14px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.badge }} />
              <span style={{ fontSize: 12, color: B.muted, fontWeight: 500 }}>
                {dateString}
              </span>
            </div>
          </div>

          {/* ── TODAY'S FOOD LABEL + NAME ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: t.badge, color: t.badgeText,
                fontSize: 11, fontWeight: 700, letterSpacing: "2px",
                textTransform: "uppercase", padding: "5px 14px", borderRadius: 100,
              }}>
                {bioticLabels[food.biotic]}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, letterSpacing: "2.5px",
                textTransform: "uppercase", color: B.faint,
              }}>
                Today's Food · {food.category}
                {food.county ? `  ·  ${food.county}` : ""}
              </span>
            </div>

            {/* Food name */}
            <div style={{
              fontSize: food.name.length > 12 ? 68 : 84,
              fontWeight: 800, color: B.fore,
              lineHeight: 0.92, letterSpacing: "-3px",
            }}>
              {food.name}
            </div>

            {/* Food tagline */}
            <div style={{
              fontSize: 22, fontStyle: "italic",
              color: t.accent, fontWeight: 500, lineHeight: 1.25,
              marginTop: 2,
            }}>
              {food.tagline}
            </div>
          </div>

          {/* ── PULL-QUOTE ── */}
          <div style={{
            fontSize: 14, color: B.muted, lineHeight: 1.55,
            borderLeft: `3px solid ${t.accent}`,
            paddingLeft: 14,
          }}>
            {pullQuote}
          </div>

          {/* ── BENEFITS PILLS ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {food.benefits.slice(0, 3).map((b) => (
              <div key={b.title} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: t.panelBg, border: `1px solid ${t.panelBorder}`,
                borderRadius: 100, padding: "5px 12px",
                fontSize: 12, fontWeight: 600, color: t.accent,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.badge }} />
                {b.title}
              </div>
            ))}
          </div>

          {/* ── BOTTOM: science + pairs ── */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            paddingTop: 12, borderTop: `1px solid ${B.border}`,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{
                flexShrink: 0,
                background: t.panelBg, border: `1px solid ${t.panelBorder}`,
                borderRadius: 6, padding: "2px 8px",
                fontSize: 10, fontWeight: 700, letterSpacing: "1px",
                color: t.accent, textTransform: "uppercase",
              }}>
                Science
              </div>
              <span style={{ fontSize: 12, color: B.faint, lineHeight: 1.45 }}>
                {scienceShort}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: B.faint, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                Pairs with
              </span>
              {food.pairsWith.slice(0, 4).map((p) => (
                <div key={p} style={{
                  background: B.offWhite, border: `1px solid ${B.border}`,
                  borderRadius: 100, padding: "3px 10px",
                  fontSize: 11, color: B.muted, fontWeight: 500,
                }}>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT VISUAL PANEL  (460px)
        ══════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: 1, height: 630,
            background: t.panelBg,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Top gradient bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 5,
            background: `linear-gradient(90deg, ${t.accent}, ${t.glow})`,
          }} />

          {/* Concentric rings */}
          <div style={{
            position: "absolute", width: 420, height: 420, borderRadius: "50%",
            border: `1px solid ${t.panelBorder}`, opacity: 0.6,
          }} />
          <div style={{
            position: "absolute", width: 300, height: 300, borderRadius: "50%",
            border: `1px solid ${t.panelBorder}`, opacity: 0.8,
          }} />
          <div style={{
            position: "absolute", width: 195, height: 195, borderRadius: "50%",
            background: t.badge, opacity: 0.12,
          }} />

          {/* "Updated Daily" ribbon — top of panel */}
          <div style={{
            position: "absolute", top: 20,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.75)",
            border: `1px solid ${t.panelBorder}`,
            borderRadius: 100, padding: "4px 14px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.badge }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: t.accent, textTransform: "uppercase" }}>
              Updated Daily
            </span>
          </div>

          {/* Giant emoji */}
          <div style={{
            fontSize: 170, lineHeight: 1,
            position: "relative", zIndex: 2,
            filter: "drop-shadow(0px 8px 24px rgba(0,0,0,0.12))",
          }}>
            {food.emoji}
          </div>

          {/* Biotic badge */}
          <div style={{
            marginTop: 20,
            background: t.badge, color: t.badgeText,
            fontSize: 12, fontWeight: 700,
            letterSpacing: "2px", textTransform: "uppercase",
            padding: "7px 20px", borderRadius: 100,
            position: "relative", zIndex: 2,
          }}>
            {bioticLabels[food.biotic]}
          </div>

          {/* How to eat snippet */}
          <div style={{
            marginTop: 14, maxWidth: 310,
            fontSize: 12, color: B.muted,
            textAlign: "center", lineHeight: 1.5,
            position: "relative", zIndex: 2,
            padding: "0 20px",
          }}>
            {truncate(food.howToEat, 90)}
          </div>

          {/* Science citation — bottom */}
          <div style={{
            position: "absolute", bottom: 16,
            left: 0, right: 0,
            display: "flex", justifyContent: "center",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.7)",
              border: `1px solid ${t.panelBorder}`,
              borderRadius: 100, padding: "4px 12px",
              fontSize: 10, color: B.faint,
            }}>
              📖 {food.scienceSource}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
