import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "EatoBiotics Roadmap — Foundation. Growth. Scale."
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

const PHASES = [
  { year: "2025",  phase: "Foundation", status: "UNDERWAY", bg: "#EBF7E1", border: "#C4E8A4", accent: B.lime,   statusBg: B.lime,   statusText: B.fore },
  { year: "2026",  phase: "Growth",     status: "COMING",   bg: "#E4F3E0", border: "#A0D890", accent: B.green,  statusBg: B.green,  statusText: "#fff"  },
  { year: "2027+", phase: "Scale",      status: "FUTURE",   bg: "#E2F5EF", border: "#9ED9C3", accent: B.teal,   statusBg: B.teal,   statusText: "#fff"  },
]

export default async function RoadmapOGImage() {
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
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#E4F3E0", border: "1px solid #A0D890", borderRadius: 100, padding: "5px 14px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: B.green }} />
              <span style={{ fontSize: 12, color: B.muted, fontWeight: 600, display: "flex" }}>ROADMAP</span>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", background: B.green, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 12px", borderRadius: 100 }}>
                2025 — 2027+
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 70, fontWeight: 800, color: B.fore, lineHeight: 0.92, letterSpacing: "-3.5px" }}>
                Where we're
              </div>
              <div style={{ display: "flex", fontSize: 70, fontWeight: 800, color: B.green, lineHeight: 0.92, letterSpacing: "-3.5px" }}>
                going.
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 19, color: B.muted, lineHeight: 1.4 }}>
              Foundation. Growth. Scale. Three phases, three pillars.
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

          {PHASES.map((phase) => (
            <div key={phase.year} style={{
              display: "flex", alignItems: "center",
              background: phase.bg,
              border: "2px solid " + phase.border,
              borderRadius: 16,
              padding: "0 24px",
              flex: 1,
            }}>
              {/* Year */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 108, flexShrink: 0,
              }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: phase.accent, letterSpacing: "-2px", display: "flex" }}>
                  {phase.year}
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: 2, height: 44, background: phase.border, flexShrink: 0 }} />

              {/* Phase name */}
              <div style={{ display: "flex", flex: 1, paddingLeft: 20 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: B.fore, letterSpacing: "-0.5px", display: "flex" }}>
                  {phase.phase}
                </span>
              </div>

              {/* Status pill */}
              <div style={{
                display: "flex", alignItems: "center",
                background: phase.statusBg, color: phase.statusText,
                fontSize: 11, fontWeight: 700, letterSpacing: "2px",
                textTransform: "uppercase", padding: "7px 16px", borderRadius: 100,
                flexShrink: 0,
              }}>
                {phase.status}
              </div>
            </div>
          ))}
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
