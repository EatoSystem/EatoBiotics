import { ImageResponse } from "next/og"
import { OG_ICON_BASE64 } from "@/lib/og-icon"
import { getSupabase } from "@/lib/supabase"
import { resultFromLead } from "@/lib/waitlist-result"

export const alt = "My Food System Type — EatoBiotics"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const B = {
  fore: "#1A2E12", darkBg: "#0E1C08",
  lime: "#A8E063", green: "#4CB648", teal: "#2DAA6E", yellow: "#F5C518", orange: "#F5A623",
}
const BRAND_STRIPE = `linear-gradient(90deg, ${B.lime}, ${B.green}, ${B.teal}, ${B.yellow}, ${B.orange})`

function scoreHex(score: number): string {
  if (score >= 80) return B.green
  if (score >= 65) return B.teal
  if (score >= 50) return B.lime
  if (score >= 35) return B.yellow
  return B.orange
}

const ENGINES_HEX: { key: "prebiotics" | "probiotics" | "postbiotics"; label: string; color: string }[] = [
  { key: "prebiotics", label: "Prebiotics", color: B.green },
  { key: "probiotics", label: "Probiotics", color: B.teal },
  { key: "postbiotics", label: "Postbiotics", color: B.orange },
]

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = getSupabase()
  const { data } = supabase
    ? await supabase.from("leads").select("overall_score, sub_scores, profile_type").eq("share_code", code).maybeSingle()
    : { data: null }
  const result = data ? resultFromLead(data) : null

  const score = result?.overall ?? 0
  const profileType = result?.profile.type ?? "Your Food System Type"
  const color = scoreHex(score)
  const r = 120, circumf = 2 * Math.PI * r, offset = circumf - (score / 100) * circumf

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: B.darkBg, display: "flex", position: "relative", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: BRAND_STRIPE, display: "flex" }} />

        {/* Left — ring */}
        <div style={{ position: "absolute", left: 70, top: 40, bottom: 40, width: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, position: "absolute", top: 0, left: 0 }}>
            <img src={OG_ICON_BASE64} width={36} height={36} style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.7)", display: "flex" }}>EatoBiotics</span>
          </div>
          <div style={{ position: "relative", display: "flex", width: 300, height: 300, alignItems: "center", justifyContent: "center" }}>
            <svg width="300" height="300" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
              <circle cx="150" cy="150" r={r} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={circumf} strokeDashoffset={offset} transform="rotate(-90 150 150)" />
            </svg>
            <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 76, fontWeight: 800, color: "#FFFFFF", fontFamily: "serif", lineHeight: 1, display: "flex" }}>{score}</span>
              <span style={{ fontSize: 22, color: "rgba(255,255,255,0.45)", display: "flex" }}>/100</span>
            </div>
          </div>
        </div>

        {/* Right — type + engines + CTA */}
        <div style={{ position: "absolute", right: 60, top: 40, bottom: 40, width: 540, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", background: B.lime, color: B.fore, fontSize: 12, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", padding: "6px 14px", borderRadius: 100 }}>
              My Food System Type
            </div>
          </div>
          <span style={{ fontSize: 52, fontWeight: 800, color: color, lineHeight: 1.0, letterSpacing: "-1.5px", display: "flex" }}>{profileType}</span>

          {/* Engine bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {ENGINES_HEX.map((e) => {
              const v = Math.max(0, Math.min(100, (result?.subScores as Record<string, number> | undefined)?.[e.key] ?? 0))
              return (
                <div key={e.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: e.color, display: "flex" }}>{e.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.55)", display: "flex" }}>{v}</span>
                  </div>
                  <div style={{ display: "flex", width: 480, height: 12, background: "rgba(255,255,255,0.10)", borderRadius: 999 }}>
                    <div style={{ display: "flex", width: (480 * v) / 100, height: 12, background: e.color, borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </div>

          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", display: "flex", marginTop: 4 }}>What&rsquo;s yours? · eatobiotics.com</span>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: BRAND_STRIPE, display: "flex" }} />
      </div>
    ),
    { ...size }
  )
}
