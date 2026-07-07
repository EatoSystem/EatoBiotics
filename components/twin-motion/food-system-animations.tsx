"use client"

/**
 * Food System edutainment animations — player-ready Remotion compositions.
 *
 * Reusable, data-driven building blocks for "Your Food System" (played live via
 * @remotion/player, lazy + ssr:false — never in the server bundle):
 *
 *  - FoodSystemModelAnimation      — the living model: pulsing orb + glints
 *  - MealImpactAnimation           — a meal flows in and lights a pathway
 *  - FoodSystemLearningAnimation   — meal → observation → pattern → next action
 *  - YourFoodSystemThisWeekAnimation — the week's bars growing, story-led
 *  - InsideOutEatoSystemAnimation  — You → Family → Community → County →
 *                                    Country → The Food System (EatoSystem)
 *
 * Brand palette only. Deterministic (index math, no Math.random).
 */

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"

const LIME = "#A8E063"
const GREEN = "#4CB648"
const TEAL = "#2DAA6E"
const YELLOW = "#F5C518"
const ORANGE = "#F5A623"
const CREAM = "#FDFBF7"
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"
const DARK_BG = "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)"

const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* ── FoodSystemModelAnimation ─────────────────────────────────────────────── */

export function FoodSystemModelAnimation() {
  const frame = useCurrentFrame()
  const cx = 640
  const cy = 360
  return (
    <AbsoluteFill style={{ background: DARK_BG }}>
      <div
        style={{
          position: "absolute", left: cx - 240, top: cy - 240, width: 480, height: 480, borderRadius: "50%",
          background: `radial-gradient(circle, ${CREAM} 0%, ${CREAM} 40%, rgba(253,251,247,0.4) 60%, transparent 76%)`,
          transform: `scale(${1 + Math.sin(frame / 22) * 0.03})`,
          boxShadow: "0 0 140px rgba(168,224,99,0.25)",
        }}
      />
      <div
        style={{
          position: "absolute", left: cx - 260, top: cy - 260, width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(168,224,99,0.35) 0%, rgba(245,197,24,0.18) 55%, transparent 74%)`,
          mixBlendMode: "screen",
          transform: `scale(${1 + Math.sin(frame / 15) * 0.05})`,
        }}
      />
      {Array.from({ length: 10 }).map((_, i) => {
        const t = ((frame * (0.5 + rnd(i) * 0.6)) / 110 + rnd(i, 2)) % 1
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - 130 + rnd(i, 3) * 260,
              top: cy + 170 - t * 380,
              width: 6 + rnd(i, 4) * 7, height: 6 + rnd(i, 4) * 7, borderRadius: "50%",
              background: i % 3 === 0 ? YELLOW : i % 2 ? LIME : GREEN,
              opacity: Math.min(1, t * 5) * Math.min(1, (1 - t) * 5) * 0.9,
              boxShadow: `0 0 12px ${LIME}aa`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/* ── MealImpactAnimation ──────────────────────────────────────────────────── */

export type MealImpactKind = "probiotic" | "fibre" | "fats" | "plants" | "strain"

const IMPACT_META: Record<MealImpactKind, { color: string; label: string }> = {
  probiotic: { color: TEAL, label: "Probiotic network lights up" },
  fibre: { color: LIME, label: "Fibre pathways glow" },
  fats: { color: YELLOW, label: "Healthy fats support the system" },
  plants: { color: GREEN, label: "Plant diversity brightens everything" },
  strain: { color: ORANGE, label: "Ultra-processed strain pulses" },
}

export function MealImpactAnimation({ impact = "probiotic" }: { impact?: MealImpactKind }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const meta = IMPACT_META[impact]
  const cx = 640
  const cy = 340
  const strain = impact === "strain"

  return (
    <AbsoluteFill style={{ background: DARK_BG }}>
      {/* body silhouette */}
      <div style={{ position: "absolute", left: cx - 46, top: cy - 190, width: 92, height: 92, borderRadius: "50%", border: `2px solid rgba(253,251,247,0.35)` }} />
      <div style={{ position: "absolute", left: cx - 85, top: cy - 88, width: 170, height: 250, borderRadius: "90px 90px 52px 52px", border: `2px solid rgba(253,251,247,0.35)` }} />
      {/* the pathway lighting up (or strain pulsing) */}
      <div
        style={{
          position: "absolute", left: cx - 60, top: cy - 20, width: 120, height: 120, borderRadius: "50%",
          background: `radial-gradient(circle, ${meta.color} 0%, transparent 70%)`,
          opacity: strain
            ? 0.35 + Math.abs(Math.sin(frame / 6)) * 0.5
            : interpolate(frame, [30, 80], [0.1, 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      {/* the meal flowing in from the left */}
      {Array.from({ length: 9 }).map((_, i) => {
        const t = interpolate(frame - i * 5, [0, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        const u = 1 - t
        const x = u * u * 160 + 2 * u * t * 420 + t * t * cx
        const y = u * u * 200 + 2 * u * t * (120 + rnd(i) * 160) + t * t * (cy + 30)
        return (
          <div key={i} style={{ position: "absolute", left: x - 6, top: y - 6, width: 12 - t * 5, height: 12 - t * 5, borderRadius: "50%", background: meta.color, opacity: t < 1 ? 0.9 : 0, boxShadow: `0 0 14px ${meta.color}` }} />
        )
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", opacity: spring({ frame: frame - 40, fps, config: { damping: 200 } }) }}>
        <span style={{ fontFamily: SANS, fontSize: 26, fontWeight: 800, color: meta.color }}>{meta.label}</span>
      </div>
    </AbsoluteFill>
  )
}

/* ── FoodSystemLearningAnimation ──────────────────────────────────────────── */

const LOOP_STEPS = ["Meal", "Observation", "Pattern", "Next Best Action"]

export function FoodSystemLearningAnimation() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: DARK_BG, justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, padding: "0 60px" }}>
        {LOOP_STEPS.map((label, i) => {
          const on = spring({ frame: frame - 20 - i * 28, fps, config: { damping: 13 } })
          const colors = [LIME, GREEN, TEAL, ORANGE]
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <div
                style={{
                  padding: "20px 26px", borderRadius: 18, textAlign: "center",
                  background: `color-mix(in srgb, ${colors[i]} 14%, transparent)`,
                  border: `2px solid ${colors[i]}`,
                  boxShadow: `0 0 ${20 * on}px ${colors[i]}55`,
                  transform: `scale(${0.7 + on * 0.3})`, opacity: on,
                  fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: CREAM, whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
              {i < LOOP_STEPS.length - 1 && (
                <div style={{ width: 44, height: 3, borderRadius: 2, background: colors[i], opacity: spring({ frame: frame - 34 - i * 28, fps, config: { damping: 200 } }) }} />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", opacity: interpolate(frame, [130, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <span style={{ fontFamily: SANS, fontSize: 22, fontWeight: 700, color: "rgba(253,251,247,0.65)" }}>Every meal teaches your Food System something new.</span>
      </div>
    </AbsoluteFill>
  )
}

/* ── YourFoodSystemThisWeekAnimation ──────────────────────────────────────── */

export function YourFoodSystemThisWeekAnimation({ scores = [58, 64, 61, 70, 68, 74, 79] }: { scores?: number[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const days = ["M", "T", "W", "T", "F", "S", "S"]
  return (
    <AbsoluteFill style={{ background: DARK_BG, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: LIME }}>Your Food System This Week</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 30, marginTop: 46, height: 300 }}>
        {scores.slice(0, 7).map((s, i) => {
          const grow = spring({ frame: frame - 15 - i * 9, fps, config: { damping: 14 } })
          const best = s === Math.max(...scores)
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 58, height: Math.max(10, (s / 100) * 280 * grow), borderRadius: 14,
                  background: best ? `linear-gradient(180deg, ${YELLOW}, ${ORANGE})` : `linear-gradient(180deg, ${LIME}, ${GREEN})`,
                  boxShadow: best ? `0 0 26px ${YELLOW}66` : `0 0 16px ${GREEN}44`,
                }}
              />
              <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 16, fontWeight: 700, color: "rgba(253,251,247,0.6)" }}>{days[i]}</div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* ── InsideOutEatoSystemAnimation ─────────────────────────────────────────── */

const INSIDE_OUT = ["You", "Family", "Community", "County", "Country", "The Food System"]

export function InsideOutEatoSystemAnimation() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cx = 640
  const cy = 360
  const colors = [YELLOW, ORANGE, LIME, GREEN, TEAL, CREAM]

  return (
    <AbsoluteFill style={{ background: DARK_BG }}>
      {INSIDE_OUT.map((label, i) => {
        const r = 52 + i * 62
        const on = spring({ frame: frame - 10 - i * 22, fps, config: { damping: 15 } })
        return (
          <div key={label}>
            <div
              style={{
                position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%",
                border: `2px ${i === INSIDE_OUT.length - 1 ? "solid" : "dashed"} ${colors[i]}`,
                opacity: on * (0.9 - i * 0.08),
                transform: `scale(${0.85 + on * 0.15}) rotate(${frame / (8 + i * 4)}deg)`,
              }}
            />
            <div
              style={{
                position: "absolute", left: cx, top: cy - r - 16, transform: "translateX(-50%)",
                fontFamily: SANS, fontSize: i === 0 ? 20 : 17, fontWeight: 800, color: colors[i], opacity: on,
                background: "rgba(11,22,7,0.85)", padding: "2px 12px", borderRadius: 999, whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
        )
      })}
      {/* the You core */}
      <div
        style={{
          position: "absolute", left: cx - 26, top: cy - 26, width: 52, height: 52, borderRadius: "50%",
          background: `radial-gradient(circle, ${YELLOW} 0%, ${ORANGE} 70%)`,
          boxShadow: `0 0 40px ${YELLOW}aa`,
          transform: `scale(${1 + Math.sin(frame / 10) * 0.1})`,
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", opacity: interpolate(frame, [140, 170], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: CREAM }}>The Food System — built from the inside out.</span>
      </div>
    </AbsoluteFill>
  )
}
