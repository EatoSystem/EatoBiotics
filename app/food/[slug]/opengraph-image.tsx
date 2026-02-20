import { ImageResponse } from "next/og"
import { getFoodBySlug, bioticLabels } from "@/lib/foods"

export const runtime = "edge"
export const alt = "EatoBiotics Food Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Biotic label → solid background colour for the badge
const bioticBg: Record<string, string> = {
  prebiotic: "#7EC832",
  probiotic: "#2BBFA4",
  postbiotic: "#F5A623",
  protein: "#F0C020",
}

export default async function FoodOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const food = getFoodBySlug(slug)

  if (!food) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <span style={{ fontSize: 48, color: "#111" }}>EatoBiotics</span>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const badgeColor = bioticBg[food.biotic] ?? "#7EC832"

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#ffffff",
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
            height: 8,
            background: "linear-gradient(90deg, #7EC832, #2BBFA4, #F5A623)",
          }}
        />

        {/* Bottom-right large emoji watermark */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 40,
            fontSize: 260,
            opacity: 0.08,
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
            padding: "56px 72px",
          }}
        >
          {/* Top: logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #7EC832, #2BBFA4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🌿
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111111",
                letterSpacing: "-0.3px",
              }}
            >
              EatoBiotics
            </span>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#ccc",
                marginLeft: 4,
                marginRight: 4,
              }}
            />
            <span style={{ fontSize: 18, color: "#888888" }}>Food Library</span>
          </div>

          {/* Middle: emoji + food name */}
          <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
            {/* Emoji in a gradient circle */}
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 40,
                background: "linear-gradient(135deg, #f5f5f5, #eeeeee)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 100,
                flexShrink: 0,
                border: "3px solid #eeeeee",
              }}
            >
              {food.emoji}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Biotic badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    background: badgeColor,
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    padding: "6px 14px",
                    borderRadius: 100,
                    textTransform: "uppercase",
                  }}
                >
                  {bioticLabels[food.biotic]}
                </div>
                <div
                  style={{
                    background: "#f5f5f5",
                    color: "#666666",
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "6px 14px",
                    borderRadius: 100,
                  }}
                >
                  {food.category}
                </div>
              </div>

              {/* Food name */}
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  color: "#111111",
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                {food.name}
              </div>

              {/* Tagline */}
              <div
                style={{
                  fontSize: 24,
                  color: "#555555",
                  fontStyle: "italic",
                  lineHeight: 1.3,
                  maxWidth: 560,
                }}
              >
                {food.tagline}
              </div>
            </div>
          </div>

          {/* Bottom: domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 24 }}>
              {food.benefits.slice(0, 2).map((b) => (
                <div
                  key={b.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 15,
                    color: "#777777",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
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
                fontSize: 18,
                fontWeight: 600,
                color: "#aaaaaa",
                letterSpacing: "0.5px",
              }}
            >
              eatobiotics.com
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
