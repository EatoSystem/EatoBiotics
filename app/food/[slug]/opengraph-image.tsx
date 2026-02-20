import { ImageResponse } from "next/og"
import { getFoodBySlug, bioticLabels } from "@/lib/foods"

export const runtime = "edge"
export const alt = "EatoBiotics Food Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Brand palette (matches globals.css)
const BRAND = {
  white:      "#FFFFFF",
  offWhite:   "#F7F8F5",
  border:     "#E8EDE4",
  fore:       "#1A2E12",
  mutedFore:  "#5A6E50",
  softMuted:  "#8FA882",
  lime:       "#A8E063",
  green:      "#4CB648",
  teal:       "#2DAA6E",
  yellow:     "#F5C518",
  orange:     "#F5A623",
}

// Per-biotic accent colours
const bioticAccent: Record<string, { badge: string; glow: string; text: string }> = {
  prebiotic:  { badge: BRAND.green,  glow: BRAND.lime,   text: "#ffffff" },
  probiotic:  { badge: BRAND.teal,   glow: "#2DAA6E44",  text: "#ffffff" },
  postbiotic: { badge: BRAND.orange, glow: "#F5A62344",  text: "#ffffff" },
  protein:    { badge: BRAND.yellow, glow: "#F5C51844",  text: "#1A2E12" },
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
            width: 1200, height: 630,
            background: BRAND.white,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <span style={{ fontSize: 48, color: BRAND.fore }}>EatoBiotics</span>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const accent = bioticAccent[food.biotic] ?? bioticAccent.prebiotic

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: BRAND.white,
          display: "flex",
          flexDirection: "row",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Left panel — rich colour block ── */}
        <div
          style={{
            width: 380,
            height: 630,
            flexShrink: 0,
            background: BRAND.offWhite,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Soft radial glow behind emoji */}
          <div
            style={{
              position: "absolute",
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: accent.badge,
              opacity: 0.12,
            }}
          />

          {/* Decorative ring */}
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              border: `2px solid ${accent.badge}`,
              opacity: 0.18,
            }}
          />

          {/* Giant emoji */}
          <div
            style={{
              fontSize: 160,
              lineHeight: 1,
              position: "relative",
              zIndex: 2,
            }}
          >
            {food.emoji}
          </div>

          {/* Biotic badge below emoji */}
          <div
            style={{
              marginTop: 28,
              background: accent.badge,
              color: accent.text,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "2px",
              padding: "8px 20px",
              borderRadius: 100,
              textTransform: "uppercase",
              position: "relative",
              zIndex: 2,
            }}
          >
            {bioticLabels[food.biotic]}
          </div>

          {/* Category pill */}
          <div
            style={{
              marginTop: 10,
              background: BRAND.border,
              color: BRAND.mutedFore,
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 14px",
              borderRadius: 100,
              position: "relative",
              zIndex: 2,
            }}
          >
            {food.category}
          </div>

          {/* Top gradient bar on left panel */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: 5,
              background: `linear-gradient(90deg, ${accent.badge}, ${BRAND.lime})`,
            }}
          />
        </div>

        {/* ── Right panel — content ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 64px 48px 64px",
            position: "relative",
          }}
        >
          {/* Top bar gradient (full width, behind content) */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: 5,
              background: `linear-gradient(90deg, ${accent.badge}, ${BRAND.lime})`,
            }}
          />

          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
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
                fontSize: 20,
                fontWeight: 700,
                color: BRAND.fore,
                letterSpacing: "-0.3px",
              }}
            >
              EatoBiotics
            </span>
            <div
              style={{
                width: 3, height: 3,
                borderRadius: "50%",
                background: BRAND.border,
                marginLeft: 6, marginRight: 6,
              }}
            />
            <span style={{ fontSize: 16, color: BRAND.softMuted }}>Food Library</span>
          </div>

          {/* Food name + tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 82,
                fontWeight: 800,
                color: BRAND.fore,
                lineHeight: 0.95,
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

          {/* Benefits + domain row */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Benefits */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {food.benefits.slice(0, 3).map((b) => (
                <div
                  key={b.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 15,
                    color: BRAND.mutedFore,
                  }}
                >
                  <div
                    style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: accent.badge,
                      flexShrink: 0,
                    }}
                  />
                  {b.title}
                </div>
              ))}
            </div>

            {/* Domain */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 14,
                borderTop: `1px solid ${BRAND.border}`,
              }}
            >
              <span style={{ fontSize: 14, color: BRAND.softMuted }}>
                eatobiotics.com/food/{food.slug}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: BRAND.offWhite,
                  padding: "6px 14px",
                  borderRadius: 100,
                  border: `1px solid ${BRAND.border}`,
                }}
              >
                <div
                  style={{
                    width: 7, height: 7,
                    borderRadius: "50%",
                    background: BRAND.green,
                  }}
                />
                <span style={{ fontSize: 13, color: BRAND.mutedFore, fontWeight: 600 }}>
                  Free to read
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
