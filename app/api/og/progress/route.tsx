import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"

const B = {
  white:   "#FFFFFF",
  fore:    "#1A2E12",
  muted:   "#5A6E50",
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
  const streak     = Math.max(0, parseInt(searchParams.get("streak")  ?? "0", 10))
  const trend      = searchParams.get("trend")   ?? "stable" // "up" | "stable" | "down"
  const count      = Math.max(0, parseInt(searchParams.get("count")   ?? "0", 10))

  // Ring geometry
  const r       = 110
  const circumf = 2 * Math.PI * r
  const offset  = circumf - (score / 100) * circumf

  const trendConfig = {
    up:     { arrow: "↑", text: "Score trending up",   color: B.lime  },
    stable: { arrow: "→", text: "Score holding steady", color: B.teal  },
    down:   { arrow: "↓", text: "Score trending down",  color: B.orange },
  }
  const td = trendConfig[trend as keyof typeof trendConfig] ?? trendConfig.stable

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: B.darkBg,
        display: "flex",
        flexDirection: "row",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}>

        {/* Brand stripe — top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: BRAND_STRIPE, display: "flex" }} />

        {/* Radial glow */}
        <div style={{
          position: "absolute",
          top: 60, left: 40, width: 440, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,170,110,0.15) 0%, transparent 65%)",
          display: "flex",
        }} />

        {/* ─── LEFT PANEL — Ring ─── */}
        <div style={{
          width: 500, height: 630, flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "50px 36px 40px 50px",
          position: "relative",
          gap: 0,
        }}>

          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            position: "absolute", top: 28, left: 50,
          }}>
            <img src={OG_ICON_BASE64} width={34} height={34} style={{ borderRadius: 7, flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.2px", display: "flex" }}>
              EatoBiotics
            </span>
          </div>

          {/* Ring */}
          <svg width="280" height="280" viewBox="0 0 280 280">
            <defs>
              <linearGradient id="progressRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={B.lime}   />
                <stop offset="30%"  stopColor={B.green}  />
                <stop offset="65%"  stopColor={B.teal}   />
                <stop offset="85%"  stopColor={B.yellow} />
                <stop offset="100%" stopColor={B.orange} />
              </linearGradient>
            </defs>
            <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="15" />
            <circle cx="140" cy="140" r={r}
              fill="none" stroke="url(#progressRingGrad)" strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray={circumf} strokeDashoffset={offset}
              transform="rotate(-90 140 140)"
            />
            <text x="140" y="128" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 70, fontWeight: 800, fill: "#FFFFFF", fontFamily: "serif" }}
            >{score}</text>
            <text x="140" y="172" textAnchor="middle"
              style={{ fontSize: 20, fontWeight: 500, fill: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}
            >/100</text>
          </svg>

          {/* Identity pill */}
          <div style={{
            marginTop: 6,
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(45,170,110,0.15)",
            border: "1px solid rgba(45,170,110,0.4)",
            borderRadius: 100,
            padding: "8px 20px",
          }}>
            <span style={{ fontSize: 22, display: "flex" }}>{emoji}</span>
            <span style={{ fontSize: 19, fontWeight: 700, color: B.teal, display: "flex", letterSpacing: "-0.2px" }}>
              {label}
            </span>
          </div>

          {/* Percentile */}
          <p style={{
            marginTop: 10, fontSize: 13,
            color: "rgba(255,255,255,0.38)", textAlign: "center", display: "flex",
          }}>
            Better than {percentile}% of people
          </p>
        </div>

        {/* ─── RIGHT PANEL — Journey stats ─── */}
        <div style={{
          flex: 1, height: 630,
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "50px 56px 40px 52px",
          gap: 28,
        }}>

          {/* Eyebrow */}
          <div style={{ display: "flex" }}>
            <div style={{
              display: "flex",
              background: "rgba(45,170,110,0.2)",
              border: `1px solid rgba(45,170,110,0.5)`,
              color: B.teal,
              fontSize: 11, fontWeight: 800, letterSpacing: "2px",
              textTransform: "uppercase", padding: "5px 14px", borderRadius: 100,
            }}>
              My Gut Journey
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 0.95, display: "flex" }}>
              Building a
            </span>
            <span style={{ fontSize: 48, fontWeight: 800, color: B.green, letterSpacing: "-2px", lineHeight: 0.95, display: "flex" }}>
              stronger gut
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Streak */}
            {streak > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(245,197,24,0.15)",
                  border: "1px solid rgba(245,197,24,0.3)",
                  fontSize: 24,
                }}>
                  🔥
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: B.yellow, letterSpacing: "-0.5px", display: "flex" }}>
                    {streak} day streak
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", display: "flex" }}>
                    consecutive days tracked
                  </span>
                </div>
              </div>
            )}

            {/* Trend */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 22, fontWeight: 800,
                color: td.color,
              }}>
                {td.arrow}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: td.color, letterSpacing: "-0.3px", display: "flex" }}>
                  {td.text}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", display: "flex" }}>
                  based on your meal history
                </span>
              </div>
            </div>

            {/* Meal count */}
            {count > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(168,224,99,0.12)",
                  border: "1px solid rgba(168,224,99,0.25)",
                  fontSize: 22,
                }}>
                  🥗
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: B.lime, letterSpacing: "-0.3px", display: "flex" }}>
                    {count} meals analysed
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", display: "flex" }}>
                    in the last 90 days
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* URL */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", margin: 0, display: "flex" }}>
            eatobiotics.com
          </p>
        </div>

        {/* Brand stripe — bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: BRAND_STRIPE, display: "flex" }} />

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
