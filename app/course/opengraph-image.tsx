import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "The EatoBiotics Course — Five Modules. Five Pillars."
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

const MODULES = [
  { num: "01", name: "Your Microbiome",        color: B.lime,   textColor: B.fore  },
  { num: "02", name: "Building Your Plate",    color: B.green,  textColor: "#fff"  },
  { num: "03", name: "The Fasting Window",     color: B.teal,   textColor: "#fff"  },
  { num: "04", name: "The Morning Practice",   color: B.yellow, textColor: B.fore  },
  { num: "05", name: "The Walk & the System",  color: B.orange, textColor: "#fff"  },
]

export default async function CourseOGImage() {
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
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#EBF7E1", border: "1px solid #C4E8A4", borderRadius: 100, padding: "5px 14px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: B.lime }} />
              <span style={{ fontSize: 12, color: B.muted, fontWeight: 600, display: "flex" }}>THE COURSE</span>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", background: B.lime, color: B.fore, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 12px", borderRadius: 100 }}>
                Online Course
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: B.fore, lineHeight: 0.95, letterSpacing: "-3px" }}>
                Five Modules.
              </div>
              <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: B.green, lineHeight: 0.95, letterSpacing: "-3px" }}>
                Five Pillars.
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 19, color: B.muted, lineHeight: 1.4 }}>
              The complete framework for rebuilding your gut health.
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
          padding: "52px 40px 32px",
          position: "relative",
          gap: 10,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: BRAND_STRIPE }} />

          {/* Coming 2026 badge */}
          <div style={{
            position: "absolute", top: 24, right: 40,
            display: "flex", alignItems: "center", gap: 7,
            background: B.white, border: "2px solid " + B.border,
            borderRadius: 100, padding: "6px 18px",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: B.lime }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: B.muted, textTransform: "uppercase", display: "flex" }}>
              Coming 2026
            </span>
          </div>

          {/* Module rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", paddingTop: 12 }}>
            {MODULES.map((mod) => (
              <div key={mod.num} style={{
                display: "flex", alignItems: "center",
                background: mod.color,
                borderRadius: 12,
                overflow: "hidden",
                height: 64,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 68, height: 64,
                  background: "rgba(0,0,0,0.12)",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: mod.textColor, display: "flex" }}>{mod.num}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", paddingLeft: 18, flex: 1 }}>
                  <span style={{ fontSize: 19, fontWeight: 700, color: mod.textColor, letterSpacing: "-0.3px", display: "flex" }}>{mod.name}</span>
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
