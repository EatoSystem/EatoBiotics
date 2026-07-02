"use client"

/**
 * "Inside You" — the personalized Remotion composition played live in the account
 * via @remotion/player (not pre-rendered): four ~5s chapters showing how the Food
 * System inside the member works, with their real biotic levels as inputProps.
 *
 *   1. You eat            — foods land on a plate, a signal ripples out
 *   2. Prebiotics feed    — fibre particles stream into the inner garden
 *   3. Probiotics work    — a living colony multiplies and pulses
 *   4. Postbiotics power  — sparks radiate out through a body silhouette
 *
 * Brand palette only (lime→green→teal→yellow→orange). Deterministic pseudo-random
 * placement (index math, no Math.random) so every render is identical.
 */

import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import {
  INSIDE_YOU_CHAPTER_FRAMES,
  type InsideYouChapter,
} from "@/lib/account/inside-you"

const LIME = "#A8E063"
const GREEN = "#4CB648"
const TEAL = "#2DAA6E"
const YELLOW = "#F5C518"
const ORANGE = "#F5A623"
const INK = "#1A2E12"
const CREAM = "#FDFBF7"

const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Deterministic 0–1 from an index. */
const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* ── Shared chapter chrome: headline, narration, live value badge ────────── */

function ChapterText({ chapter, frame }: { chapter: InsideYouChapter; frame: number }) {
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 })
  const exitStart = INSIDE_YOU_CHAPTER_FRAMES - 12
  const exit = interpolate(frame, [exitStart, INSIDE_YOU_CHAPTER_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const counted =
    chapter.value == null
      ? null
      : Math.round(interpolate(frame, [12, 60], [0, chapter.value], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 56,
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 24}px)`,
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: INK, lineHeight: 1.15 }}>
        {chapter.title}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 21, color: "#4a5843", marginTop: 12, maxWidth: 760, lineHeight: 1.45 }}>
        {chapter.narration}
      </div>
      {counted != null && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 10,
            marginTop: 18,
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
            border: `2px solid ${GREEN}`,
            boxShadow: "0 6px 24px rgba(76,182,72,0.18)",
          }}
        >
          <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: GREEN }}>{counted}</span>
          <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: INK }}>{chapter.valueLabel}</span>
        </div>
      )}
    </div>
  )
}

/* ── Chapter 1: You eat ───────────────────────────────────────────────────── */

const FOODS = [LIME, GREEN, TEAL, YELLOW, ORANGE, LIME, GREEN, YELLOW]

function EatScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cx = 640
  const cy = 300

  return (
    <>
      {/* plate */}
      <div
        style={{
          position: "absolute",
          left: cx - 170,
          top: cy - 170,
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "white",
          border: "3px solid rgba(76,182,72,0.35)",
          boxShadow: "0 18px 60px rgba(26,46,18,0.10)",
          transform: `scale(${spring({ frame, fps, config: { damping: 14 } })})`,
        }}
      />
      {/* foods landing */}
      {FOODS.map((c, i) => {
        const a = (i / FOODS.length) * Math.PI * 2
        const r = 70 + rnd(i) * 55
        const drop = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 12 } })
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r - 19,
              top: cy + Math.sin(a) * r * 0.85 - 19,
              width: 38 - rnd(i, 2) * 12,
              height: 38 - rnd(i, 2) * 12,
              borderRadius: "50%",
              background: c,
              opacity: drop,
              transform: `translateY(${(1 - drop) * -140}px) scale(${drop})`,
              boxShadow: `0 0 18px ${c}66`,
            }}
          />
        )
      })}
      {/* signal ripple once the plate is full */}
      {[0, 1, 2].map((i) => {
        const t = interpolate(frame, [70 + i * 16, 130 + i * 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - 170 - t * 130,
              top: cy - 170 - t * 130,
              width: 340 + t * 260,
              height: 340 + t * 260,
              borderRadius: "50%",
              border: `2px solid ${GREEN}`,
              opacity: (1 - t) * 0.5,
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
  const gardenX = 800
  const gardenY = 300
  const glow = interpolate(frame, [20, 130], [0.25, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <>
      {/* small plate, top-left origin */}
      <div
        style={{
          position: "absolute", left: 150, top: 150, width: 130, height: 130, borderRadius: "50%",
          background: "white", border: `3px solid ${LIME}`, boxShadow: "0 10px 34px rgba(26,46,18,0.10)",
        }}
      />
      {/* fibre particles streaming plate → garden */}
      {Array.from({ length: 16 }).map((_, i) => {
        const t = ((frame * (0.9 + rnd(i) * 0.7)) / 90 + rnd(i, 3)) % 1
        const wob = Math.sin(t * Math.PI * 3 + i) * 34
        const x = interpolate(t, [0, 1], [215, gardenX])
        const y = interpolate(t, [0, 1], [215, gardenY]) + wob
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y,
              width: 9 + rnd(i, 2) * 8, height: 9 + rnd(i, 2) * 8, borderRadius: "50%",
              background: i % 3 === 0 ? GREEN : LIME,
              opacity: Math.min(1, t * 6) * Math.min(1, (1 - t) * 6) * 0.95,
              boxShadow: `0 0 12px ${LIME}aa`,
            }}
          />
        )
      })}
      {/* the inner garden, brightening as it's fed */}
      <div
        style={{
          position: "absolute", left: gardenX - 130, top: gardenY - 130, width: 260, height: 260, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(168,224,99,${glow}) 0%, rgba(76,182,72,${glow * 0.55}) 48%, rgba(255,255,255,0) 74%)`,
        }}
      />
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2
        const grow = spring({ frame: frame - 30 - i * 9, fps, config: { damping: 11 } })
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: gardenX + Math.cos(a) * 62 - 13,
              top: gardenY + Math.sin(a) * 62 - 13,
              width: 26, height: 26, borderRadius: "50% 50% 50% 4px",
              background: i % 2 ? GREEN : TEAL,
              transform: `rotate(${a + Math.PI / 4}rad) scale(${grow})`,
              boxShadow: `0 0 14px rgba(76,182,72,0.5)`,
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
  const cy = 290

  return (
    <>
      <div
        style={{
          position: "absolute", left: cx - 200, top: cy - 200, width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(45,170,110,0.30) 0%, rgba(168,224,99,0.16) 50%, rgba(255,255,255,0) 74%)`,
          transform: `scale(${1 + Math.sin(frame / 14) * 0.05})`,
        }}
      />
      {Array.from({ length: 26 }).map((_, i) => {
        const a = rnd(i) * Math.PI * 2
        const r = 26 + rnd(i, 2) * 150
        const born = spring({ frame: frame - i * 4, fps, config: { damping: 10 } })
        const wobX = Math.sin(frame / 16 + i * 1.7) * 10
        const wobY = Math.cos(frame / 19 + i * 2.3) * 10
        const s = 14 + rnd(i, 4) * 26
        const c = i % 4 === 0 ? GREEN : i % 4 === 1 ? TEAL : i % 4 === 2 ? LIME : "#7ED9A8"
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
              opacity: born * (0.55 + rnd(i, 6) * 0.45),
              transform: `rotate(${rnd(i, 7) * 180}deg) scale(${born})`,
              boxShadow: `0 0 12px ${c}55`,
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
  const cy = 280

  return (
    <>
      {/* body silhouette — simple head + torso glow */}
      <div
        style={{
          position: "absolute", left: cx - 55, top: cy - 195, width: 110, height: 110, borderRadius: "50%",
          border: `3px solid rgba(76,182,72,0.5)`, background: "rgba(168,224,99,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute", left: cx - 105, top: cy - 75, width: 210, height: 290,
          borderRadius: "110px 110px 60px 60px",
          border: `3px solid rgba(76,182,72,0.5)`, background: "rgba(168,224,99,0.10)",
        }}
      />
      {/* core spark */}
      <div
        style={{
          position: "absolute", left: cx - 46, top: cy + 8, width: 92, height: 92, borderRadius: "50%",
          background: `radial-gradient(circle, ${YELLOW} 0%, ${ORANGE} 62%, rgba(255,255,255,0) 78%)`,
          transform: `scale(${1 + Math.sin(frame / 9) * 0.12})`,
          boxShadow: `0 0 60px rgba(245,197,24,0.65)`,
        }}
      />
      {/* postbiotic sparks radiating through the body */}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = rnd(i) * Math.PI * 2
        const t = ((frame * (0.8 + rnd(i, 2) * 0.8)) / 80 + rnd(i, 3)) % 1
        const r = t * 190
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r * 0.62 - 6,
              top: cy + 54 + Math.sin(a) * r - 6,
              width: 12 - t * 6, height: 12 - t * 6, borderRadius: "50%",
              background: i % 2 ? YELLOW : ORANGE,
              opacity: (1 - t) * 0.95,
              boxShadow: `0 0 14px rgba(245,166,35,0.7)`,
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
              position: "absolute", left: cx - 60 + i * 55, top: cy + 170 - t * 300,
              width: 5, height: 46, borderRadius: 999,
              background: `linear-gradient(180deg, rgba(245,197,24,0) 0%, ${YELLOW} 50%, rgba(245,197,24,0) 100%)`,
              opacity: Math.min(1, t * 4) * Math.min(1, (1 - t) * 4),
            }}
          />
        )
      })}
    </>
  )
}

/* ── Composition root ─────────────────────────────────────────────────────── */

const SCENES = [EatScene, FeedScene, ColonyScene, PowerScene]

export function InsideYouComposition({ chapters }: { chapters: InsideYouChapter[] }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${CREAM} 0%, #F4F8EC 100%)` }}>
      {chapters.map((ch, i) => {
        const Scene = SCENES[i] ?? EatScene
        return (
          <Sequence key={ch.key} from={ch.fromFrame} durationInFrames={ch.durationInFrames}>
            <AbsoluteFill>
              <Scene />
              <ChapterText chapter={ch} frame={frame - ch.fromFrame} />
            </AbsoluteFill>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
