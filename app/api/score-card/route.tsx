// app/api/score-card/route.ts
// Generates a 1200×630 OG image for the shareable EatoBiotics score card.
// Route: GET /api/score-card?score=62&feed=71&seed=38&heal=67&profile=Emerging+Balance
//
// Uses Next.js built-in ImageResponse — no additional packages required.

import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const score    = Number(searchParams.get("score")   ?? 0)
  const feed     = Number(searchParams.get("feed")    ?? 0)
  const seed     = Number(searchParams.get("seed")    ?? 0)
  const heal     = Number(searchParams.get("heal")    ?? 0)
  const profile  = searchParams.get("profile") ?? "EatoBiotics Score"

  const pillars = [
    { label: "Feed",  score: feed,  color: "#7fc47e", gradient: "linear-gradient(90deg, #7fc47e, #4caf7d)" },
    { label: "Seed",  score: seed,  color: "#3ab0a0", gradient: "linear-gradient(90deg, #4caf7d, #3ab0a0)" },
    { label: "Heal",  score: heal,  color: "#e6b84a", gradient: "linear-gradient(90deg, #e6b84a, #e07b4a)" },
  ]

  // Score band colour
  const scoreColor =
    score >= 80 ? "#4caf7d"
    : score >= 65 ? "#3ab0a0"
    : score >= 50 ? "#7fc47e"
    : score >= 35 ? "#e6b84a"
    : "#e07b4a"

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#0f1a13",
          padding: "64px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Gradient accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #7fc47e, #4caf7d, #3ab0a0, #e6b84a, #e07b4a)",
          }}
        />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              EatoBiotics
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
              Personal Food System Score
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: "rgba(76,175,125,0.15)",
                border: "1px solid rgba(76,175,125,0.4)",
                borderRadius: 20,
                padding: "6px 16px",
                color: "#4caf7d",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {profile}
            </div>
          </div>
        </div>

        {/* Main content: large score + pillar bars */}
        <div style={{ display: "flex", flex: 1, gap: 80, alignItems: "center" }}>
          {/* Left: big score */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 160,
                  fontWeight: 800,
                  color: scoreColor,
                  lineHeight: 1,
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: 40, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>/100</span>
            </div>
            <span
              style={{
                marginTop: 12,
                fontSize: 16,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              EatoBiotics Score
            </span>
          </div>

          {/* Right: pillar bars */}
          <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 24 }}>
            {pillars.map(({ label, score: pScore, color, gradient }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{label}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color }}>{pScore}</span>
                </div>
                {/* Bar background */}
                <div
                  style={{
                    height: 12,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pScore}%`,
                      height: "100%",
                      borderRadius: 6,
                      background: gradient,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Tagline */}
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.35)",
                  fontStyle: "italic",
                }}
              >
                "Improving my inner food system in 30 days."
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
            Take the free assessment at eatobiotics.com
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>
            eatobiotics.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
