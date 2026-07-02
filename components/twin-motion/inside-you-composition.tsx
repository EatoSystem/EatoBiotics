"use client"

/**
 * "Inside You" v2 — the dark-cinema Remotion composition played live in the
 * account via @remotion/player: four ~5s chapters showing how the Food System
 * inside the member works, personalized with their real levels as inputProps.
 *
 *   1. You eat            — foods land on a lit plate, a signal ripples out
 *   2. Prebiotics feed    — fibre streams along curved paths into the microbe hub
 *   3. Probiotics work    — a living colony multiplies with depth-of-field glow
 *   4. Postbiotics power  — sparks radiate out through a body silhouette
 *
 * Cinematic grammar: deep botanical-ink backdrop + vignette (brand greens/ambers
 * only — never blue/purple), cross-fades between chapters, a progress rail with
 * chapter ticks, refined type scale. Deterministic pseudo-random placement
 * (index math, no Math.random) so every render is identical.
 */

import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import {
  INSIDE_YOU_CHAPTER_FRAMES,
  INSIDE_YOU_DURATION_FRAMES,
  type InsideYouChapter,
} from "@/lib/account/inside-you"

const LIME = "#A8E063"
const GREEN = "#4CB648"
const TEAL = "#2DAA6E"
const MINT = "#7ED9A8"
const YELLOW = "#F5C518"
const ORANGE = "#F5A623"
const CREAM = "#FDFBF7"
const CREAM_60 = "rgba(253,251,247,0.6)"

const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"

const CHAPTER_COLORS = [GREEN, LIME, TEAL, ORANGE]

/** Deterministic 0–1 from an index. */
const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Fade a chapter in/out at its edges for the cross-fade feel. */
const chapterFade = (frame: number) =>
  interpolate(frame, [0, 18, INSIDE_YOU_CHAPTER_FRAMES - 18, INSIDE_YOU_CHAPTER_FRAMES], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

/* ── Shared chapter chrome: eyebrow, headline, narration, live value ─────── */

function ChapterText({ chapter, index, frame }: { chapter: InsideYouChapter; index: number; frame: number }) {
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - 6, fps, config: { damping: 200 }, durationInFrames: 26 })
  const c = CHAPTER_COLORS[index] ?? GREEN
  const counted =
    chapter.value == null
      ? null
      : Math.round(
          chapter.value *
            spring({ frame: frame - 16, fps, config: { damping: 16, stiffness: 60 }, durationInFrames: 55 }),
        )

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        bottom: 84,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26}px)`,
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: c }}>
        Chapter {index + 1} · {chapter.label}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: CREAM, lineHeight: 1.12, marginTop: 12 }}>
        {chapter.title}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 22, color: CREAM_60, marginTop: 12, maxWidth: 780, lineHeight: 1.5 }}>
        {chapter.narration}
      </div>
      {counted != null && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 12,
            marginTop: 20,
            padding: "12px 26px",
            borderRadius: 999,
            background: "rgba(253,251,247,0.07)",
            border: `1.5px solid ${c}`,
            boxShadow: `0 0 40px ${c}33`,
            backdropFilter: "blur(6px)",
          }}
        >
          <span style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 700, color: c }}>{counted}</span>
          <span style={{ fontFamily: SANS, fontSize: 17, fontWeight: 600, color: CREAM }}>{chapter.valueLabel}</span>
        </div>
      )}
    </div>
  )
}

/* ── Chapter 1: You eat ───────────────────────────────────────────────────── */

const FOODS = [LIME, GREEN, TEAL, YELLOW, ORANGE, MINT, GREEN, YELLOW]

function EatScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cx = 640
  const cy = 260

  return (
    <>
      {/* plate: a disc of light on the dark stage */}
      <div
        style={{
          position: "absolute",
          left: cx - 165,
          top: cy - 165,
          width: 330,
          height: 330,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${CREAM} 0%, #F0EDDC 62%, rgba(253,251,247,0.25) 82%, transparent 95%)`,
          boxShadow: "0 0 90px rgba(168,224,99,0.25)",
          transform: `scale(${spring({ frame, fps, config: { damping: 14 } })})`,
        }}
      />
      {/* foods landing */}
      {FOODS.map((c, i) => {
        const a = (i / FOODS.length) * Math.PI * 2
        const r = 62 + rnd(i) * 58
        const drop = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 12 } })
        const s = 36 - rnd(i, 2) * 12
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r - s / 2,
              top: cy + Math.sin(a) * r * 0.82 - s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              background: c,
              opacity: drop,
              transform: `translateY(${(1 - drop) * -160}px) scale(${drop})`,
              boxShadow: `0 0 22px ${c}99`,
            }}
          />
        )
      })}
      {/* signal ripples once the plate is full */}
      {[0, 1, 2].map((i) => {
        const t = interpolate(frame, [66 + i * 16, 128 + i * 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - 165 - t * 150,
              top: cy - 165 - t * 150,
              width: 330 + t * 300,
              height: 330 + t * 300,
              borderRadius: "50%",
              border: `1.5px solid ${LIME}`,
              opacity: (1 - t) * 0.6,
            }}
          />
        )
      })}
    </>
  )
}

/* ── Chapter 2: Prebiotics feed ───────────────────────────────────────────── */

function FeedScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hubX = 830
  const hubY = 260
  const srcX = 210
  const srcY = 180
  const glow = interpolate(frame, [20, 130], [0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <>
      {/* origin plate, small + lit */}
      <div
        style={{
          position: "absolute", left: srcX - 62, top: srcY - 62, width: 124, height: 124, borderRadius: "50%",
          background: `radial-gradient(circle, ${CREAM} 0%, rgba(253,251,247,0.3) 70%, transparent 90%)`,
          boxShadow: `0 0 46px rgba(168,224,99,0.3)`,
        }}
      />
      {/* fibre particles on a curved bezier path plate → hub */}
      {Array.from({ length: 20 }).map((_, i) => {
        const t = ((frame * (0.9 + rnd(i) * 0.7)) / 92 + rnd(i, 3)) % 1
        // Quadratic bezier: source → control (arched) → hub
        const ctrlX = 520
        const ctrlY = 40 + rnd(i, 5) * 260
        const u = 1 - t
        const x = u * u * srcX + 2 * u * t * ctrlX + t * t * hubX
        const y = u * u * srcY + 2 * u * t * ctrlY + t * t * hubY
        const s = 8 + rnd(i, 2) * 9
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x - s / 2, top: y - s / 2,
              width: s, height: s, borderRadius: "50%",
              background: i % 3 === 0 ? GREEN : LIME,
              opacity: Math.min(1, t * 6) * Math.min(1, (1 - t) * 6),
              boxShadow: `0 0 16px ${LIME}bb`,
            }}
          />
        )
      })}
      {/* the microbe hub, brightening as it is fed */}
      <div
        style={{
          position: "absolute", left: hubX - 150, top: hubY - 150, width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(168,224,99,${0.5 * glow}) 0%, rgba(76,182,72,${0.28 * glow}) 48%, transparent 74%)`,
          filter: "blur(2px)",
        }}
      />
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI * 2
        const grow = spring({ frame: frame - 28 - i * 8, fps, config: { damping: 11 } })
        const c = i % 3 === 0 ? MINT : i % 2 ? GREEN : LIME
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: hubX + Math.cos(a) * 66 - 12,
              top: hubY + Math.sin(a) * 66 - 12,
              width: 24, height: 24, borderRadius: "50% 50% 50% 6px",
              background: c,
              transform: `rotate(${a + Math.PI / 4}rad) scale(${grow})`,
              boxShadow: `0 0 18px ${c}99`,
            }}
          />
        )
      })}
    </>
  )
}

/* ── Chapter 3: Probiotics work ───────────────────────────────────────────── */

function ColonyScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cx = 640
  const cy = 250

  return (
    <>
      <div
        style={{
          position: "absolute", left: cx - 230, top: cy - 230, width: 460, height: 460, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(45,170,110,0.35) 0%, rgba(126,217,168,0.14) 50%, transparent 74%)`,
          transform: `scale(${1 + Math.sin(frame / 14) * 0.05})`,
          filter: "blur(3px)",
        }}
      />
      {/* far layer — blurred, slow (depth of field) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = rnd(i, 9) * Math.PI * 2
        const r = 60 + rnd(i, 10) * 190
        const born = spring({ frame: frame - i * 5, fps, config: { damping: 12 } })
        const s = 26 + rnd(i, 11) * 34
        const c = i % 2 ? TEAL : GREEN
        return (
          <div
            key={`far-${i}`}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r - s / 2,
              top: cy + Math.sin(a) * r * 0.78 - s / 2,
              width: s, height: s * 0.7, borderRadius: 999,
              background: c,
              opacity: born * 0.25,
              filter: "blur(6px)",
              transform: `rotate(${rnd(i, 12) * 180}deg)`,
            }}
          />
        )
      })}
      {/* near layer — crisp, glowing, alive */}
      {Array.from({ length: 22 }).map((_, i) => {
        const a = rnd(i) * Math.PI * 2
        const r = 24 + rnd(i, 2) * 150
        const born = spring({ frame: frame - i * 4, fps, config: { damping: 10 } })
        const wobX = Math.sin(frame / 16 + i * 1.7) * 11
        const wobY = Math.cos(frame / 19 + i * 2.3) * 11
        const s = 14 + rnd(i, 4) * 26
        const c = i % 4 === 0 ? GREEN : i % 4 === 1 ? TEAL : i % 4 === 2 ? LIME : MINT
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r + wobX - s / 2,
              top: cy + Math.sin(a) * r * 0.8 + wobY - s / 2,
              width: s, height: s * (0.62 + rnd(i, 5) * 0.38),
              borderRadius: 999,
              background: c,
              opacity: born * (0.6 + rnd(i, 6) * 0.4),
              transform: `rotate(${rnd(i, 7) * 180}deg) scale(${born})`,
              boxShadow: `0 0 16px ${c}88`,
            }}
          />
        )
      })}
    </>
  )
}

/* ── Chapter 4: Postbiotics power ─────────────────────────────────────────── */

function PowerScene() {
  const frame = useCurrentFrame()
  const cx = 640
  const cy = 240

  return (
    <>
      {/* body silhouette — glowing outline on the dark stage */}
      <div
        style={{
          position: "absolute", left: cx - 52, top: cy - 185, width: 104, height: 104, borderRadius: "50%",
          border: `2px solid rgba(168,224,99,0.75)`, background: "rgba(168,224,99,0.08)",
          boxShadow: "0 0 30px rgba(168,224,99,0.25), inset 0 0 24px rgba(168,224,99,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute", left: cx - 100, top: cy - 70, width: 200, height: 280,
          borderRadius: "104px 104px 58px 58px",
          border: `2px solid rgba(168,224,99,0.75)`, background: "rgba(168,224,99,0.06)",
          boxShadow: "0 0 34px rgba(168,224,99,0.22), inset 0 0 30px rgba(168,224,99,0.10)",
        }}
      />
      {/* core spark */}
      <div
        style={{
          position: "absolute", left: cx - 46, top: cy + 8, width: 92, height: 92, borderRadius: "50%",
          background: `radial-gradient(circle, ${YELLOW} 0%, ${ORANGE} 62%, transparent 78%)`,
          transform: `scale(${1 + Math.sin(frame / 9) * 0.12})`,
          boxShadow: `0 0 80px rgba(245,197,24,0.75)`,
        }}
      />
      {/* postbiotic sparks radiating through the body */}
      {Array.from({ length: 20 }).map((_, i) => {
        const a = rnd(i) * Math.PI * 2
        const t = ((frame * (0.8 + rnd(i, 2) * 0.8)) / 80 + rnd(i, 3)) % 1
        const r = t * 185
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r * 0.6 - 6,
              top: cy + 52 + Math.sin(a) * r - 6,
              width: 12 - t * 6, height: 12 - t * 6, borderRadius: "50%",
              background: i % 2 ? YELLOW : ORANGE,
              opacity: (1 - t),
              boxShadow: `0 0 18px rgba(245,166,35,0.9)`,
            }}
          />
        )
      })}
      {/* rising energy lines */}
      {[0, 1, 2].map((i) => {
        const t = ((frame / 60) + i / 3) % 1
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: cx - 58 + i * 54, top: cy + 165 - t * 300,
              width: 5, height: 48, borderRadius: 999,
              background: `linear-gradient(180deg, transparent 0%, ${YELLOW} 50%, transparent 100%)`,
              opacity: Math.min(1, t * 4) * Math.min(1, (1 - t) * 4),
              boxShadow: `0 0 10px rgba(245,197,24,0.5)`,
            }}
          />
        )
      })}
    </>
  )
}

/* ── Progress rail with chapter ticks ─────────────────────────────────────── */

function ProgressRail({ chapters }: { chapters: InsideYouChapter[] }) {
  const frame = useCurrentFrame()
  const pct = (frame / INSIDE_YOU_DURATION_FRAMES) * 100
  return (
    <div style={{ position: "absolute", left: 72, right: 72, bottom: 40 }}>
      <div style={{ position: "relative", height: 4, borderRadius: 999, background: "rgba(253,251,247,0.14)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 999, background: `linear-gradient(90deg, ${GREEN}, ${LIME})`, boxShadow: `0 0 12px ${LIME}88` }} />
        {chapters.map((ch, i) => {
          const x = (ch.fromFrame / INSIDE_YOU_DURATION_FRAMES) * 100
          const reached = frame >= ch.fromFrame
          return (
            <div
              key={ch.key}
              style={{
                position: "absolute", left: `${x}%`, top: "50%",
                width: 10, height: 10, borderRadius: "50%",
                transform: "translate(-50%,-50%)",
                background: reached ? CHAPTER_COLORS[i] : "#22361A",
                border: `2px solid ${reached ? CHAPTER_COLORS[i] : "rgba(253,251,247,0.3)"}`,
                boxShadow: reached ? `0 0 10px ${CHAPTER_COLORS[i]}aa` : "none",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ── Composition root ─────────────────────────────────────────────────────── */

const SCENES = [EatScene, FeedScene, ColonyScene, PowerScene]

export function InsideYouComposition({ chapters }: { chapters: InsideYouChapter[] }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)" }}>
      {/* ambient stage glows */}
      <div style={{ position: "absolute", left: -140, top: -160, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,224,99,0.10) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", right: -160, top: 60, width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,170,110,0.12) 0%, transparent 65%)" }} />
      {chapters.map((ch, i) => {
        const Scene = SCENES[i] ?? EatScene
        const local = frame - ch.fromFrame
        return (
          <Sequence key={ch.key} from={ch.fromFrame} durationInFrames={ch.durationInFrames}>
            <AbsoluteFill style={{ opacity: chapterFade(local) }}>
              <Scene />
              <ChapterText chapter={ch} index={i} frame={local} />
            </AbsoluteFill>
          </Sequence>
        )
      })}
      <ProgressRail chapters={chapters} />
      {/* vignette on top of everything */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 52%, rgba(5,10,3,0.6) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  )
}
