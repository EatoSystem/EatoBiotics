import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "EatoBiotics — The Food System Inside You"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function DefaultOGImage() {
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
            background: "linear-gradient(90deg, #7EC832, #2BBFA4, #F5A623, #F0C020)",
          }}
        />

        {/* Large background gradient circle */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -200,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7EC832, #2BBFA4)",
            opacity: 0.06,
          }}
        />

        {/* Pill decorations */}
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 80,
            display: "flex",
            gap: 10,
          }}
        >
          {["#7EC832", "#2BBFA4", "#F5A623", "#F0C020", "#E8823A"].map((color, i) => (
            <div
              key={i}
              style={{
                width: 48,
                height: 14,
                borderRadius: 100,
                background: color,
                opacity: 0.7,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 96px",
            gap: 32,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #7EC832, #2BBFA4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              🌿
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#111111",
                letterSpacing: "-0.5px",
              }}
            >
              EatoBiotics
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 800,
                color: "#111111",
                lineHeight: 1.0,
                letterSpacing: "-3px",
                maxWidth: 760,
              }}
            >
              The food system{"\n"}inside you.
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#666666",
                lineHeight: 1.4,
                maxWidth: 640,
              }}
            >
              Prebiotics. Probiotics. Postbiotics. The science of feeding your microbiome — one food at a time.
            </div>
          </div>

          {/* Three pillars */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {[
              { label: "Prebiotic", color: "#7EC832", emoji: "🌿" },
              { label: "Probiotic", color: "#2BBFA4", emoji: "🧫" },
              { label: "Postbiotic", color: "#F5A623", emoji: "⚡" },
            ].map((pillar) => (
              <div
                key={pillar.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f8f8f8",
                  padding: "10px 20px",
                  borderRadius: 100,
                  border: `2px solid ${pillar.color}22`,
                }}
              >
                <span style={{ fontSize: 16 }}>{pillar.emoji}</span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: pillar.color,
                    letterSpacing: "0.5px",
                  }}
                >
                  {pillar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom domain */}
        <div
          style={{
            padding: "0 96px 40px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#bbbbbb",
            }}
          >
            eatobiotics.com
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
