import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "Join the EatoBiotics Waitlist — Three launches. One subscription."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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

const BRAND_STRIPE = `linear-gradient(90deg, ${B.lime}, ${B.green}, ${B.teal}, ${B.yellow}, ${B.orange})`
const BIOTIC_PILLS = [B.lime, B.green, B.teal, B.yellow, B.orange]

const LAUNCHES = [
  { emoji: "📖", name: "The Book",   benefit: "Early bird €97", accent: B.yellow, accentText: B.fore, bg: "#FEF9E2", border: "#F5E087" },
  { emoji: "📱", name: "The App",    benefit: "Beta access",    accent: B.lime,   accentText: B.fore, bg: "#EBF7E1", border: "#C4E8A4" },
  { emoji: "🎓", name: "The Course", benefit: "Waitlist €97",   accent: B.orange, accentText: "#fff", bg: "#FEF3E2", border: "#FACB88" },
]

export default async function WaitlistOGImage() {
  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: B.white,
        display: "flex", flexDirection: "row",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
      }}>

        {/* ─── LEFT CONTENT PANEL ─── */}
        <div style={{
          width: 560, height: 630, flexShrink: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          padding: "0 52px 32px 52px",
          position: "relative",
          background: B.white,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 560, height: 12, background: BRAND_STRIPE }} />

          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 30 }}>
            <img src={OG_ICON_BASE64} width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: B.fore, letterSpacing: "-0.5px" }}>EatoBiotics</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#FEF3E2", border: "1px solid #FACB88", borderRadius: 100, padding: "5px 14px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: B.orange }} />
              <span style={{ fontSize: 12, color: B.muted, fontWeight: 600, display: "flex" }}>WAITLIST</span>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", background: B.orange, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 12px", borderRadius: 100 }}>
                Join the Waitlist
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: B.fore, lineHeight: 0.95, letterSpacing: "-3px" }}>
                Three launches.
              </div>
              <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: B.orange, lineHeight: 0.95, letterSpacing: "-3px" }}>
                One subscription.
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 19, color: B.muted, lineHeight: 1.4 }}>
              Early access to The Book, The App, and The Course.
            </div>
          </div>

          {/* Brand pills */}
          <div style={{ display: "flex", gap: 5 }}>
            {BIOTIC_PILLS.map((color, i) => (
              <div key={i} style={{ display: "flex", width: 44, height: 8, borderRadius: 999, background: color }} />
            ))}
          </div>
        </div>

        {/* ─── RIGHT VISUAL PANEL ─── */}
        <div style={{
          flex: 1, height: 630,
          background: B.offBg,
          borderLeft: "1px solid " + B.border,
          display: "flex", flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          padding: "52px 44px 44px",
          position: "relative",
          gap: 16,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: BRAND_STRIPE }} />

          {/* Coming 2026 badge */}
          <div style={{
            position: "absolute", top: 24, right: 44,
            display: "flex", alignItems: "center", gap: 7,
            background: B.white, border: "2px solid " + B.border,
            borderRadius: 100, padding: "6px 18px",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: B.orange }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: B.muted, textTransform: "uppercase", display: "flex" }}>
              Coming 2026
            </span>
          </div>

          {/* Launch cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 12 }}>
            {LAUNCHES.map((launch) => (
              <div key={launch.name} style={{
                display: "flex", alignItems: "center",
                background: launch.bg,
                border: "2px solid " + launch.border,
                borderRadius: 16,
                padding: "0 24px",
                height: 92,
              }}>
                {/* Emoji */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 60, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 34, display: "flex" }}>{launch.emoji}</span>
                </div>

                {/* Name */}
                <div style={{ display: "flex", flex: 1, paddingLeft: 16 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: B.fore, letterSpacing: "-0.5px", display: "flex" }}>
                    {launch.name}
                  </span>
                </div>

                {/* Benefit pill */}
                <div style={{
                  display: "flex", alignItems: "center",
                  background: launch.accent, color: launch.accentText,
                  fontSize: 15, fontWeight: 700,
                  padding: "9px 20px", borderRadius: 100,
                  flexShrink: 0,
                }}>
                  {launch.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
