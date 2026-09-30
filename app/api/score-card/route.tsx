// app/api/score-card/route.ts
// Generates a 1200×630 OG image for the shareable EatoBiotics score card.
// Route: GET /api/score-card?score=62&profile=Emerging+Balance
// (Older links also carry &feed=&seed=&heal= — ignored, see below.)
//
// Uses Next.js built-in ImageResponse — no additional packages required.

import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // Two spellings are accepted for each pillar. The route was written to read
  // feed/seed/heal, but its only caller has always sent the canonical pillar
  // names — so every card rendered 0 / 0 / 0. Reading both repairs the live
  // path and keeps any card URL already shared in the wild working.
  //
  // ══ THE SUB-SCORES ARE NO LONGER READ, AND OLD LINKS STILL WORK ═══════════
  //
  // The card rendered a bar and a value for each Biotic, read from
  // ?feed=&seed=&heal= (with ?prebiotics=&probiotics=&postbiotics= accepted as
  // a second spelling, because the caller and the route once disagreed and
  // every card rendered 0 / 0 / 0 until #179).
  //
  // A number per Biotic is a personal biological state —
  // POSTBIOTICS_INFERENCE_BOUNDARY prohibits it for Postbiotics by name, and
  // under strict ISAPP a questionnaire reaches none of the three. This is the
  // most public form of that claim: it travels into social feeds as an image,
  // where nobody at EatoBiotics ever sees it again.
  //
  // So the bars go and the three Biotics stay, named, as the foundation the
  // card is about. Nothing needs to be parsed to keep old links working: a
  // query parameter this route does not read is simply ignored, so every card
  // URL already posted still resolves to a valid image.
  //
  // Consequence, accepted deliberately: a card shared last month renders
  // without those three numbers the next time someone opens it. The image is
  // generated per request, not sealed at share time, so there is no historical
  // artefact being rewritten — only a live endpoint that was making a claim.
  const score    = Number(searchParams.get("score") ?? 0)
  const profile  = searchParams.get("profile") ?? "Biotics Score"

  // The SCIENTIFIC pathways, not the actions. Feed / Seed / Rejuvenate are
  // things a person does; these are what the product teaches. Named only —
  // see the note above for why no value travels with them.
  const pillars = [
    { label: "Prebiotics",  color: "#7fc47e" },
    { label: "Probiotics",  color: "#3ab0a0" },
    { label: "Postbiotics", color: "#e6b84a" },
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
              Biotics Score™
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
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
              Biotics Score
            </span>
          </div>

          {/* Right: the three Biotics, named */}
          <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 24 }}>
            {pillars.map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: color,
                    display: "flex",
                  }}
                />
                <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{label}</span>
              </div>
            ))}

            {/* Tagline */}
            <div style={{ display: "flex", marginTop: 8 }}>
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
