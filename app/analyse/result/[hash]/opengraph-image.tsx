import { ImageResponse } from "next/og"
import { getSupabase } from "@/lib/supabase"
import type { AnalysisResult } from "@/components/analyse/result-builder"
import { OG_ICON_BASE64 } from "@/lib/og-icon"

export const runtime = "edge"
export const alt = "EatoBiotics Meal Score"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({
  params,
}: {
  params: Promise<{ hash: string }>
}) {
  const { hash } = await params
  const supabase = getSupabase()

  let result: AnalysisResult | null = null
  let mealName = "Meal Analysis"
  let score = 0
  let prebioticScore: number | undefined
  let probioticScore: number | undefined
  let postbioticScore: number | undefined

  if (supabase) {
    const { data } = await supabase
      .from("meal_scans")
      .select("result_json, biotics_score")
      .eq("hash", hash)
      .single()

    if (data) {
      result = data.result_json as AnalysisResult
      mealName = result?.mealName ?? "Meal Analysis"
      score = data.biotics_score ?? result?.score ?? 0
      prebioticScore = result?.prebioticScore
      probioticScore = result?.probioticScore
      postbioticScore = result?.postbioticScore
    }
  }

  const scoreColor =
    score >= 80 ? "#4CAF50" :
    score >= 65 ? "#8BC34A" :
    score >= 50 ? "#FFC107" :
    score >= 35 ? "#FF9800" : "#EF5350"

  const biotics = [
    { label: "Pre", score: prebioticScore ?? 0, color: "#8BC34A" },
    { label: "Pro", score: probioticScore ?? 0, color: "#4CAF50" },
    { label: "Post", score: postbioticScore ?? 0, color: "#009688" },
  ]

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f1b0d 0%, #0d1f14 60%, #0a1a1a 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OG_ICON_BASE64} width={40} height={40} alt="" style={{ borderRadius: "8px" }} />
          <span style={{ color: "#6FCF6F", fontSize: "16px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
            EatoBiotics · Meal Analysis
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, gap: "60px", alignItems: "center" }}>
          {/* Left — score */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                border: `8px solid ${scoreColor}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ fontSize: "72px", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", letterSpacing: "2px", marginTop: "4px" }}>GUT SCORE</span>
            </div>
          </div>

          {/* Right — meal info */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "16px" }}>
            <div>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "1px" }}>MEAL SCORED</p>
              <h1 style={{ fontSize: "42px", fontWeight: 800, color: "white", lineHeight: 1.1, margin: 0 }}>
                {mealName}
              </h1>
            </div>

            {/* Biotic bars */}
            {(prebioticScore !== undefined || probioticScore !== undefined || postbioticScore !== undefined) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                {biotics.map((b) => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "36px", fontSize: "13px", color: b.color, fontWeight: 700 }}>{b.label}</span>
                    <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${b.score}%`,
                          height: "100%",
                          background: b.color,
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <span style={{ width: "32px", textAlign: "right", fontSize: "13px", color: b.color, fontWeight: 700 }}>{b.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px" }}>
            What does your meal score?
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #8BC34A, #4CAF50)",
              borderRadius: "100px",
              padding: "10px 24px",
              fontSize: "15px",
              fontWeight: 700,
              color: "white",
            }}
          >
            eatobiotics.com/analyse →
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
