import { ImageResponse } from "next/og"
import { getTodaysFood, bioticLabels } from "@/lib/foods"

export const runtime = "edge"
export const alt = "Today's Food — EatoBiotics"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

const bioticBg: Record<string, string> = {
  prebiotic: "#7EC832",
  probiotic: "#2BBFA4",
  postbiotic: "#F5A623",
  protein: "#F0C020",
}

export default async function TodayOGImage() {
  const food = getTodaysFood()
  const badgeColor = bioticBg[food.biotic] ?? "#7EC832"

  const now = new Date()
  const dateString = now.toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0d1117",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #7EC832, #2BBFA4, #F5A623)",
          }}
        />

        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: badgeColor,
            opacity: 0.06,
            filter: "blur(80px)",
          }}
        />

        {/* Large emoji watermark */}
        <div
          style={{
            position: "absolute",
            bottom: -30,
            right: 40,
            fontSize: 280,
            opacity: 0.07,
            lineHeight: 1,
          }}
        >
          {food.emoji}
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 72px",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #7EC832, #2BBFA4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                🌿
              </div>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.3px",
                }}
              >
                EatoBiotics
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.08)",
                padding: "8px 16px",
                borderRadius: 100,
              }}
            >
              <span style={{ fontSize: 14, color: "#F5A623", fontWeight: 600, letterSpacing: "0.5px" }}>
                📅
              </span>
              <span style={{ fontSize: 14, color: "#aaaaaa", fontWeight: 500 }}>
                {dateString}
              </span>
            </div>
          </div>

          {/* Centre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* "Today's Food" label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  background: badgeColor,
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  padding: "6px 14px",
                  borderRadius: 100,
                  textTransform: "uppercase",
                }}
              >
                {bioticLabels[food.biotic]}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#666666",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                Today's Food
              </div>
            </div>

            {/* Emoji + Name side by side */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div style={{ fontSize: 96, lineHeight: 1 }}>{food.emoji}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    fontSize: 80,
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1,
                    letterSpacing: "-2.5px",
                  }}
                >
                  {food.name}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    color: "#888888",
                    fontStyle: "italic",
                    lineHeight: 1.3,
                  }}
                >
                  {food.tagline}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 24 }}>
              {food.benefits.slice(0, 3).map((b) => (
                <div
                  key={b.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 14,
                    color: "#666666",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: badgeColor,
                    }}
                  />
                  {b.title}
                </div>
              ))}
            </div>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "#444444",
              }}
            >
              eatobiotics.com/today
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
