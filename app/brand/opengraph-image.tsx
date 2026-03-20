import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "Eato & EatoBiotics — Two expressions. One mission."
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

export default async function BrandOGImage() {
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
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#E2F5EF", border: "1px solid #9ED9C3", borderRadius: 100, padding: "5px 14px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: B.teal }} />
              <span style={{ fontSize: 12, color: B.muted, fontWeight: 600, display: "flex" }}>THE BRAND</span>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", background: B.teal, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 12px", borderRadius: 100 }}>
                Brand Architecture
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: B.fore, lineHeight: 0.95, letterSpacing: "-3px" }}>
                Two expressions.
              </div>
              <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: B.teal, lineHeight: 0.95, letterSpacing: "-3px" }}>
                One mission.
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: B.muted, lineHeight: 1.45 }}>
              Eato — the national food standard. EatoBiotics — the personal microbiome guide.
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
          gap: 18,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: BRAND_STRIPE }} />

          {/* Eato card */}
          <div style={{
            display: "flex", flexDirection: "column",
            background: B.white, border: "2px solid #9ED9C3",
            borderRadius: 18, padding: "28px 32px",
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, background: B.teal, borderRadius: "18px 0 0 18px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", background: B.teal, color: "#fff", fontSize: 20, fontWeight: 800, padding: "7px 22px", borderRadius: 100 }}>
                Eato
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: B.faint, letterSpacing: "1.5px", textTransform: "uppercase", display: "flex" }}>
                The External Ecosystem
              </span>
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: B.fore, lineHeight: 1.25 }}>
              Ireland's regenerative food standard
            </div>
          </div>

          {/* EatoBiotics card */}
          <div style={{
            display: "flex", flexDirection: "column",
            background: B.white, border: "2px solid #C4E8A4",
            borderRadius: 18, padding: "28px 32px",
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, background: B.lime, borderRadius: "18px 0 0 18px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", background: B.lime, color: B.fore, fontSize: 20, fontWeight: 800, padding: "7px 22px", borderRadius: 100 }}>
                EatoBiotics
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: B.faint, letterSpacing: "1.5px", textTransform: "uppercase", display: "flex" }}>
                The Internal Ecosystem
              </span>
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: B.fore, lineHeight: 1.25 }}>
              The food system inside you
            </div>
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
