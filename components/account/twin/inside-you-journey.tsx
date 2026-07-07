"use client"

/**
 * InsideYouJourney — "Journey Through You", the interactive replacement for the
 * old auto-playing Remotion film.
 *
 * The member's own figure is the stage. They move at their own pace through the
 * body — You eat → Down in your gut → Your microbes → Through your body — and at
 * each stop the matching region of the figure lights up with living motion
 * (glow + pulse + drifting microbes / radiating sparks) while the story panel
 * teaches what happens there, with their real level. Self-paced: waypoint dots
 * on the body, prev/next, and an optional slow "Play the journey" auto-advance.
 * No chapters, no passive video. Reduced-motion-safe via the eb-* classes.
 */

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import type { InsideYouChapter } from "@/lib/account/inside-you"

const STOP_COLORS = ["#4CB648", "#A8E063", "#2DAA6E", "#F5A623"]

/** Waypoint name + where it lives on the figure (% coords + glow radius). */
const STOP_META = [
  { waypoint: "You eat", region: { x: 50, y: 19, r: 30 } },
  { waypoint: "Down in your gut", region: { x: 47, y: 62, r: 42 } },
  { waypoint: "Your microbes", region: { x: 54, y: 53, r: 36 } },
  { waypoint: "Through your body", region: { x: 50, y: 48, r: 72 } },
] as const

const AUTOPLAY_MS = 6000

/* ── Per-stop living motion — the biology of each stop, told in particles ─────
   0 You eat        → food motes converge into the body (the meal entering)
   1 Down in your gut → fibre streams drift + feeding pulses (prebiotics feed)
   2 Your microbes    → a colony wobbles and multiplies (probiotics work)
   3 Through your body → postbiotic sparks + rings radiate out (the give-back)
   Keyed by stop so animations restart cleanly. Reduced-motion-safe (eb-*). */
function StopMotion({ stop, color, region }: { stop: number; color: string; region: { x: number; y: number } }) {
  const cx = `${region.x}%`
  const cy = `${region.y}%`

  if (stop === 0) {
    // food converging inward onto the body
    const drops = [
      { x: -120, y: -90, c: "#A8E063", s: 10, d: 0 },
      { x: 110, y: -70, c: "#F5C518", s: 8, d: 300 },
      { x: -80, y: 100, c: "#4CB648", s: 9, d: 600 },
      { x: 130, y: 60, c: "#F5A623", s: 7, d: 200 },
      { x: 0, y: -130, c: "#2DAA6E", s: 9, d: 450 },
    ]
    return (
      <div key={stop} aria-hidden className="pointer-events-none absolute inset-0">
        {drops.map((p, i) => (
          <span key={i} className="eb-absorb absolute" style={{ left: cx, top: cy, width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2, borderRadius: "50%", background: p.c, boxShadow: `0 0 12px ${p.c}aa`, opacity: 0, animationDuration: "1.5s", animationDelay: `${p.d + 200}ms`, ["--eb-from-x" as string]: `${p.x}px`, ["--eb-from-y" as string]: `${p.y}px` }} />
        ))}
      </div>
    )
  }

  if (stop === 3) {
    // the give-back — rings + sparks radiating through the whole body
    return (
      <div key={stop} aria-hidden className="pointer-events-none absolute inset-0">
        {[0, 1].map((i) => (
          <span key={`ring-${i}`} className="eb-burst-ring absolute rounded-full" style={{ left: cx, top: cy, width: "60%", height: "60%", border: `2px solid ${color}99`, animationDelay: `${i * 700}ms`, animationDuration: "2.4s" }} />
        ))}
        {[-60, -20, 20, 60].map((dx, i) => (
          <span key={`spark-${i}`} className="eb-rise absolute rounded-full" style={{ left: `calc(${cx} + ${dx}px)`, top: cy, width: 6, height: 6, background: i % 2 ? "#F5C518" : color, boxShadow: `0 0 10px ${color}`, animationDelay: `${i * 260}ms`, animationDuration: "3.4s" }} />
        ))}
      </div>
    )
  }

  // stops 1 & 2 — a drifting / multiplying colony near the gut
  const count = stop === 2 ? 8 : 5
  const motes = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2
    const r = 22 + (i % 3) * 12
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.85, s: 6 + (i % 3) * 2, d: i * 320, ping: stop === 2 && i % 3 === 0 }
  })
  return (
    <div key={stop} aria-hidden className="pointer-events-none absolute inset-0">
      {motes.map((m, i) => (
        <span key={i} className="eb-float-big absolute" style={{ left: `calc(${cx} + ${m.dx}px)`, top: `calc(${cy} + ${m.dy}px)`, width: m.s, height: m.s, borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, ${color}66 60%, transparent 78%)`, boxShadow: `0 0 10px ${color}88`, animationDelay: `${m.d}ms`, animationDuration: "11s", transition: "left .7s ease, top .7s ease" }} />
      ))}
      {motes.filter((m) => m.ping).map((m, i) => (
        <span key={`ping-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `calc(${cx} + ${m.dx}px)`, top: `calc(${cy} + ${m.dy}px)` }}>
          <span className="eb-ping inline-flex h-5 w-5 rounded-full" style={{ background: color, opacity: 0.4 }} />
        </span>
      ))}
    </div>
  )
}

export function InsideYouJourney({ chapters, figureSrc }: { chapters: InsideYouChapter[]; figureSrc: string }) {
  const n = chapters.length
  const [stop, setStop] = useState(0)
  const [playing, setPlaying] = useState(false)

  const go = useCallback((i: number) => setStop(((i % n) + n) % n), [n])

  /* Guided auto-advance while playing; stops looping paused on the last stop. */
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      setStop((s) => {
        if (s >= n - 1) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [playing, stop, n])

  const ch = chapters[stop]
  const meta = STOP_META[stop] ?? STOP_META[0]
  const color = STOP_COLORS[stop] ?? "#4CB648"

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr] md:items-center">
      {/* ── the body, reacting at the active region ── */}
      <div className="relative mx-auto aspect-square w-full max-w-[400px]">
        <div className="absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, #FDFBF7 0%, #FDFBF7 42%, rgba(253,251,247,0.5) 58%, rgba(253,251,247,0.12) 70%, transparent 78%)" }} />

        {/* region glow — travels to the active stop */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: `${meta.region.x}%`,
            top: `${meta.region.y}%`,
            width: `${meta.region.r}%`,
            height: `${meta.region.r}%`,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(circle, ${color}77 0%, ${color}2e 45%, transparent 70%)`,
            transition: "left .7s ease, top .7s ease, width .7s ease, height .7s ease, background .7s ease",
            mixBlendMode: "screen",
          }}
        />

        {/* the figure */}
        <Image
          src={figureSrc}
          alt="The Food System inside you"
          width={400}
          height={400}
          sizes="400px"
          className="absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{ mixBlendMode: "multiply" }}
        />

        {/* per-stop living motion — the biology of the active stop */}
        <StopMotion stop={stop} color={color} region={meta.region} />

        {/* waypoint dots on the body — tap to jump */}
        {STOP_META.map((s, i) => {
          const active = i === stop
          const c = STOP_COLORS[i] ?? "#4CB648"
          return (
            <button
              key={s.waypoint}
              type="button"
              onClick={() => go(i)}
              aria-label={s.waypoint}
              aria-pressed={active}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${s.region.x}%`, top: `${s.region.y}%` }}
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                {active && <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: c, opacity: 0.55 }} />}
                <span
                  className="relative inline-flex rounded-full transition-transform hover:scale-110"
                  style={{
                    height: active ? 15 : 10,
                    width: active ? 15 : 10,
                    background: active ? c : "rgba(253,251,247,0.7)",
                    border: `2px solid ${active ? "rgba(11,22,7,0.4)" : c}`,
                    boxShadow: active ? `0 0 16px ${c}` : `0 0 6px ${c}88`,
                  }}
                />
              </span>
            </button>
          )
        })}
      </div>

      {/* ── the story ── */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color }}>{meta.waypoint}</span>
          <span className="text-[11px] font-semibold" style={{ color: "rgba(253,251,247,0.4)" }}>· stop {stop + 1} of {n}</span>
        </div>
        <h4 key={`t-${stop}`} className="eb-reveal mt-2 font-serif text-2xl font-bold leading-tight md:text-3xl" style={{ color: "#FDFBF7" }}>{ch.title}</h4>
        <p key={`n-${stop}`} className="eb-reveal mt-2 max-w-lg text-base leading-relaxed" style={{ color: "rgba(253,251,247,0.7)", animationDelay: "80ms" }}>{ch.narration}</p>

        {ch.value != null && (
          <div key={`v-${stop}`} className="eb-reveal mt-4 inline-flex items-baseline gap-2.5 rounded-2xl px-5 py-3" style={{ background: "rgba(253,251,247,0.06)", border: `1.5px solid ${color}`, boxShadow: `0 0 32px ${color}22`, animationDelay: "140ms" }}>
            <span className="font-serif text-3xl font-bold" style={{ color }}>{ch.value}</span>
            <span className="text-sm font-semibold" style={{ color: "rgba(253,251,247,0.85)" }}>{ch.valueLabel}</span>
          </div>
        )}

        <p key={`k-${stop}`} className="eb-reveal mt-4 max-w-lg rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "rgba(253,251,247,0.05)", border: "1px solid rgba(253,251,247,0.12)", color: "rgba(253,251,247,0.85)", animationDelay: "200ms" }}>
          {ch.takeaway}
        </p>

        {/* navigation — prev / stepper / next + play */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => go(stop - 1)} aria-label="Previous stop" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(253,251,247,0.2)", color: "rgba(253,251,247,0.75)" }}>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-1">
              {chapters.map((_, i) => (
                <button key={i} type="button" onClick={() => go(i)} aria-label={`Stop ${i + 1}`} className="h-2 rounded-full transition-all" style={{ width: i === stop ? 22 : 8, background: i === stop ? (STOP_COLORS[i] ?? "#4CB648") : "rgba(253,251,247,0.25)" }} />
              ))}
            </div>
            <button type="button" onClick={() => go(stop + 1)} aria-label="Next stop" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(253,251,247,0.2)", color: "rgba(253,251,247,0.75)" }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => { if (!playing && stop >= n - 1) setStop(0); setPlaying((p) => !p) }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors"
            style={{ background: playing ? "rgba(253,251,247,0.08)" : "linear-gradient(135deg, #4CB648, #2DAA6E)", color: playing ? "rgba(253,251,247,0.8)" : "white", border: playing ? "1px solid rgba(253,251,247,0.2)" : "none" }}
          >
            {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play the journey</>}
          </button>
        </div>
      </div>
    </div>
  )
}
