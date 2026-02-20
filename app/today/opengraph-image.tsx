import { ImageResponse } from "next/og"
import { getTodaysFood, bioticLabels } from "@/lib/foods"

export const runtime = "edge"
export const alt = "Today's Food — EatoBiotics"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

// Brand palette (matches globals.css)
const BRAND = {
  white:     "#FFFFFF",
  offWhite:  "#F7F8F5",
  border:    "#E8EDE4",
  fore:      "#1A2E12",
  mutedFore: "#5A6E50",
  softMuted: "#8FA882",
  lime:      "#A8E063",
  green:     "#4CB648",
  teal:      "#2DAA6E",
  yellow:    "#F5C518",
  orange:    "#F5A623",
}

const bioticAccent: Record<string, { badge: string; text: string }> = {
  prebiotic:  { badge: BRAND.green,  text: "#ffffff" },
  probiotic:  { badge: BRAND.teal,   text: "#ffffff" },
  postbiotic: { badge: BRAND.orange, text: "#ffffff" },
  protein:    { badge: BRAND.yellow, text: "#1A2E12" },
}

export default async function TodayOGImage() {
  const food = getTodaysFood()
  const accent = bioticAccent[food.biotic] ?? bioticAccent.prebiotic

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
          background: BRAND.white,
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Full-width gradient bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${BRAND.green}, ${BRAND.lime}, ${BRAND.orange})`,
          }}
        />

        {/* Soft background botanical shape — large circle bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            right: -180,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: accent.badge,
            opacity: 0.07,
          }}
        />
        {/* Second smaller circle mid-left */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: BRAND.lime,
            opacity: 0.09,
          }}
        />

        {/* Watermark emoji — large, bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 30,
            fontSize: 300,
            opacity: 0.06,
            lineHeight: 1,
          }}
        >
          {food.emoji}
        </div>

        {/* Main layout */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 80px 44px 80px",
          }}
        >
          {/* ── Top row: logo + date ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.teal})`,
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
                  color: BRAND.fore,
                  letterSpacing: "-0.3px",
                }}
              >
                EatoBiotics
              </span>
            </div>

            {/* Date pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: BRAND.offWhite,
                border: `1px solid ${BRAND.border}`,
                padding: "8px 18px",
                borderRadius: 100,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: accent.badge,
                }}
              />
              <span style={{ fontSize: 14, color: BRAND.mutedFore, fontWeight: 500 }}>
                {dateString}
              </span>
            </div>
          </div>

          {/* ── Centre: "Today's Food" label + huge name ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  background: accent.badge,
                  color: accent.text,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  padding: "6px 16px",
                  borderRadius: 100,
                  textTransform: "uppercase",
                }}
              >
                {bioticLabels[food.biotic]}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: BRAND.softMuted,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                Today's Food
              </div>
            </div>

            {/* Emoji + name side by side */}
            <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
              <div style={{ fontSize: 100, lineHeight: 1 }}>{food.emoji}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    fontSize: 88,
                    fontWeight: 800,
                    color: BRAND.fore,
                    lineHeight: 0.9,
                    letterSpacing: "-3px",
                  }}
                >
                  {food.name}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    color: accent.badge,
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    fontWeight: 500,
                  }}
                >
                  {food.tagline}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom: benefits + domain ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: `1px solid ${BRAND.border}`,
            }}
          >
            {/* Benefits dots */}
            <div style={{ display: "flex", gap: 20 }}>
              {food.benefits.slice(0, 3).map((b) => (
                <div
                  key={b.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: BRAND.mutedFore,
                  }}
                >
                  <div
                    style={{
                      width: 5, height: 5,
                      borderRadius: "50%",
                      background: accent.badge,
                    }}
                  />
                  {b.title}
                </div>
              ))}
            </div>

            {/* Domain */}
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: BRAND.softMuted,
                letterSpacing: "0.3px",
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
