import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"

const B = {
  white:   "#FFFFFF",
  fore:    "#1A2E12",
  muted:   "#5A6E50",
  faint:   "#8FA882",
  border:  "#D6E8CC",
  offBg:   "#F3F9EE",
  darkBg:  "#0E1C08",
  darkMid: "#162412",
  lime:    "#A8E063",
  green:   "#4CB648",
  teal:    "#2DAA6E",
  yellow:  "#F5C518",
  orange:  "#F5A623",
}

const BRAND_STRIPE = `linear-gradient(90deg, ${B.lime}, ${B.green}, ${B.teal}, ${B.yellow}, ${B.orange})`

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const score      = Math.max(0, Math.min(100, parseInt(searchParams.get("score")      ?? "0",  10)))
  const percentile = Math.max(1, Math.min(99,  parseInt(searchParams.get("percentile") ?? "50", 10)))
  const label      = searchParams.get("label")   ?? "Gut Explorer"
  const emoji      = searchParams.get("emoji")   ?? "🧭"

  // Compute ring stroke-dashoffset for the SVG arc
  const r           = 120
  const circumf     = 2 * Math.PI * r
  const filled      = (score / 100) * circumf
  const offset      = circumf - filled

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: B.darkBg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}>

        {/* Brand stripe — top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: BRAND_STRIPE, display: "flex" }} />

        {/* Subtle radial glow behind ring */}
        <div style={{
          position: "absolute",
          top: 100, left: 100, width: 400, height: 430,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(77,182,72,0.18) 0%, transparent 70%)`,
          display: "flex",
        }} />

        {/* ─── LEFT PANEL — Ring + score ─── */}
        <div style={{
          position: "absolute",
          left: 60, top: 40, bottom: 40,
          width: 520,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}>

          {/* Logo row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            position: "absolute", top: 0, left: 0,
          }}>
            <img src={OG_ICON_BASE64} width={36} height={36} style={{ borderRadius: 8, flexShrink: 0 }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.3px", display: "flex" }}>
              EatoBiotics
            </span>
          </div>

          {/* SVG Ring */}
          <svg width="300" height="300" viewBox="0 0 300 300">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={B.lime}   />
                <stop offset="30%"  stopColor={B.green}  />
                <stop offset="65%"  stopColor={B.teal}   />
                <stop offset="85%"  stopColor={B.yellow} />
                <stop offset="100%" stopColor={B.orange} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="150" cy="150" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="16"
            />
            {/* Progress — rotated so 0 is at top */}
            <circle cx="150" cy="150" r={r}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumf}
              strokeDashoffset={offset}
              transform="rotate(-90 150 150)"
            />
            {/* Score number */}
            <text x="150" y="138" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 76, fontWeight: 800, fill: "#FFFFFF", fontFamily: "serif" }}
            >{score}</text>
            {/* /100 */}
            <text x="150" y="188" textAnchor="middle"
              style={{ fontSize: 22, fontWeight: 500, fill: "rgba(255,255,255,0.45)", fontFamily: "sans-serif" }}
            >/100</text>
          </svg>

          {/* Label pill */}
          <div style={{
            marginTop: 8,
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(45,170,110,0.15)",
            border: `1px solid rgba(45,170,110,0.4)`,
            borderRadius: 100,
            padding: "10px 24px",
          }}>
            <span style={{ fontSize: 26, display: "flex" }}>{emoji}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: B.teal, display: "flex", letterSpacing: "-0.3px" }}>
              {label}
            </span>
          </div>

          {/* Percentile */}
          <p style={{
            marginTop: 12,
            fontSize: 15, color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            display: "flex",
          }}>
            Higher than {percentile}% of people with typical eating habits
          </p>
        </div>

        {/* ─── RIGHT PANEL — CTA ─── */}
        <div style={{
          position: "absolute",
          right: 60, top: 40, bottom: 40,
          width: 480,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}>

          {/* Gut health score label */}
          <div style={{ display: "flex" }}>
            <div style={{
              display: "flex", background: B.lime, color: B.fore,
              fontSize: 12, fontWeight: 800, letterSpacing: "2px",
              textTransform: "uppercase", padding: "6px 14px", borderRadius: 100,
            }}>
              Gut Health Score
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: "#FFFFFF", lineHeight: 0.95, letterSpacing: "-2px", display: "flex" }}>
              What's your
            </span>
            <span style={{ fontSize: 52, fontWeight: 800, color: B.green, lineHeight: 0.95, letterSpacing: "-2px", display: "flex" }}>
              gut score?
            </span>
          </div>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, margin: 0, display: "flex" }}>
            A 2-minute assessment reveals your biotic balance across 5 pillars of gut health.
          </p>

          {/* Brand pills */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[B.lime, B.green, B.teal, B.yellow, B.orange].map((c, i) => (
              <div key={i} style={{ display: "flex", width: 50, height: 9, borderRadius: 999, background: c }} />
            ))}
          </div>

          {/* URL */}
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", margin: 0, display: "flex" }}>
            eatobiotics.com/assessment
          </p>
        </div>

        {/* Brand stripe — bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: BRAND_STRIPE, display: "flex" }} />

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
