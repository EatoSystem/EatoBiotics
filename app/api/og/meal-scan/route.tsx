import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"

const B = {
  white:   "#FFFFFF",
  fore:    "#1A2E12",
  muted:   "#5A6E50",
  border:  "#D6E8CC",
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
  const pre        = searchParams.get("pre")     ?? "low"   // "strong" | "moderate" | "low"
  const pro        = searchParams.get("pro")     ?? "0"     // "1" | "0"
  const post       = searchParams.get("post")    ?? "0"     // "1" | "0"
  const foodsRaw   = searchParams.get("foods")   ?? ""      // e.g. "🥦🧅🫙🧀🍳"

  // Spread emoji string into individual grapheme clusters (handles multi-byte emoji)
  const foodEmojis = [...foodsRaw].slice(0, 5)

  // Ring geometry
  const r      = 110
  const circumf = 2 * Math.PI * r
  const offset  = circumf - (score / 100) * circumf

  // Biotic bar widths
  const preWidth  = pre === "strong" ? 100 : pre === "moderate" ? 55 : 15
  const proWidth  = pro  === "1" ? 80 : 12
  const postWidth = post === "1" ? 70 : 12

  const biotics = [
    { icon: "🌱", label: "Prebiotic",  width: preWidth,  color: B.lime  },
    { icon: "🦠", label: "Probiotic",  width: proWidth,  color: B.green },
    { icon: "✨", label: "Postbiotic", width: postWidth, color: B.teal  },
  ]

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

        {/* Radial glow behind ring */}
        <div style={{
          position: "absolute",
          top: 60, left: 40, width: 440, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,182,72,0.16) 0%, transparent 65%)",
          display: "flex",
        }} />

        {/* ─── LEFT PANEL — Ring ─── */}
        <div style={{
          width: 520, height: 630, flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "50px 40px 40px 50px",
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
              <linearGradient id="mealRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={B.lime}   />
                <stop offset="30%"  stopColor={B.green}  />
                <stop offset="65%"  stopColor={B.teal}   />
                <stop offset="85%"  stopColor={B.yellow} />
                <stop offset="100%" stopColor={B.orange} />
              </linearGradient>
            </defs>
            <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="15" />
            <circle cx="140" cy="140" r={r}
              fill="none" stroke="url(#mealRingGrad)" strokeWidth="15"
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

        {/* ─── RIGHT PANEL — Meal details ─── */}
        <div style={{
          flex: 1, height: 630,
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "50px 52px 40px 48px",
          gap: 24,
        }}>

          {/* Eyebrow */}
          <div style={{ display: "flex" }}>
            <div style={{
              display: "flex", background: B.lime, color: B.fore,
              fontSize: 11, fontWeight: 800, letterSpacing: "2px",
              textTransform: "uppercase", padding: "5px 14px", borderRadius: 100,
            }}>
              Meal Gut Score
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 46, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 0.95, display: "flex" }}>
              What I ate
            </span>
            <span style={{ fontSize: 46, fontWeight: 800, color: B.green, letterSpacing: "-2px", lineHeight: 0.95, display: "flex" }}>
              today
            </span>
          </div>

          {/* Food emojis */}
          {foodEmojis.length > 0 && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {foodEmojis.map((fe, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 64, height: 64,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  fontSize: 36,
                }}>
                  {fe}
                </div>
              ))}
            </div>
          )}

          {/* Biotic bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {biotics.map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, width: 20, display: "flex" }}>{b.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", width: 74, display: "flex" }}>
                  {b.label}
                </span>
                <div style={{
                  flex: 1, height: 7, borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  display: "flex",
                }}>
                  <div style={{
                    height: "100%", width: `${b.width}%`,
                    borderRadius: 999,
                    background: b.color,
                    display: "flex",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* URL */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", margin: 0, display: "flex" }}>
            eatobiotics.com/analyse
          </p>
        </div>

        {/* Brand stripe — bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: BRAND_STRIPE, display: "flex" }} />

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
