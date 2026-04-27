import Image from "next/image"
import Link from "next/link"
import { Camera } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/* ── Sample data — salmon power bowl ─────────────────────────────────── */

const SAMPLE = {
  photo: "/food-6.png",
  mealName: "Salmon Power Bowl",
  score: 82,
  scoreBand: "Exceptional",
  scoreColor: "#4CAF50",
  biotics: [
    { icon: "🌱", label: "Prebiotics", score: 75, color: "#8BC34A", bg: "rgba(139,195,74,0.12)" },
    { icon: "🦠", label: "Probiotics", score: 82, color: "#4CAF50", bg: "rgba(76,175,80,0.12)" },
    { icon: "✨", label: "Postbiotics", score: 68, color: "#009688", bg: "rgba(0,150,136,0.12)" },
  ],
  macros: [
    { label: "Calories", value: 520, unit: "kcal", color: "#FF9800" },
    { label: "Protein",  value: 38,  unit: "g",    color: "#EF5350" },
    { label: "Carbs",    value: 45,  unit: "g",    color: "#42A5F5" },
    { label: "Fat",      value: 18,  unit: "g",    color: "#8BC34A" },
    { label: "Fibre",    value: 12,  unit: "g",    color: "#4CAF50" },
  ],
}

/* ── Arc gauge SVG ───────────────────────────────────────────────────── */

function ArcGauge({ score, color }: { score: number; color: string }) {
  // Semi-circle arc from -180° to 0° (left to right across bottom)
  const r = 54
  const cx = 70, cy = 70
  const circumference = Math.PI * r          // half-circle arc length
  const filled = (score / 100) * circumference
  const gap    = circumference - filled

  // Arc path: start at left (270° = top when rotated), sweep 180°
  const startX = cx - r,  startY = cy
  const endX   = cx + r,  endY   = cy

  return (
    <svg viewBox="0 0 140 80" className="w-full max-w-[180px]">
      {/* Track */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        className="text-border"
      />
      {/* Filled arc */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
      />
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#8BC34A" />
          <stop offset="60%"  stopColor={color} />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Score Card ──────────────────────────────────────────────────────── */

function ScoreCard() {
  const { score, scoreBand, scoreColor, biotics, macros } = SAMPLE

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg h-full flex flex-col gap-5">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Overall Score
        </p>
        <div className="border-b border-border" />
      </div>

      {/* Arc gauge */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-full max-w-[180px] mx-auto">
          <ArcGauge score={score} color={scoreColor} />
          {/* Score number overlaid */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-4xl font-bold tabular-nums leading-none" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">/100</span>
          </div>
        </div>
        {/* Badge */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #4CAF50, #8BC34A)" }}
        >
          ★ {scoreBand}
        </span>
      </div>

      {/* Biotic bars */}
      <div className="space-y-2.5">
        {biotics.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
              style={{ background: b.bg }}
            >
              {b.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{b.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: b.color }}>{b.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${b.score}%`, background: b.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Macros divider */}
      <div className="border-t border-border" />

      {/* Macronutrients */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Est. Macronutrients
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {macros.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center gap-0.5 rounded-lg py-2 px-1"
              style={{ background: `${m.color}15` }}
            >
              <span className="text-sm font-bold tabular-nums leading-none" style={{ color: m.color }}>
                {m.value}
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground">{m.unit}</span>
              <span className="text-[9px] text-muted-foreground/60">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ── Main Section ────────────────────────────────────────────────────── */

export function TryAMealTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">

        {/* Section header */}
        <div className="mb-10 max-w-xl">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--icon-teal)" }}>
              Meal Analysis
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance leading-tight">
              Every meal has a score. <span className="text-2xl">🌿</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-lg">
              Photograph or describe any meal and get an instant gut score across all three biotics.
            </p>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground max-w-lg">
              No account needed. Results in under 30 seconds.
            </p>
          </ScrollReveal>
        </div>

        {/* Two-column layout: photo + score card */}
        <div className="grid gap-5 lg:grid-cols-[1fr_380px] items-stretch">

          {/* Left — food photo */}
          <ScrollReveal>
            <div className="relative h-[340px] sm:h-[420px] lg:h-full min-h-[320px] overflow-hidden rounded-2xl group">
              <Image
                src={SAMPLE.photo}
                alt={SAMPLE.mealName}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
            </div>
          </ScrollReveal>

          {/* Right — score card */}
          <ScrollReveal delay={100}>
            <ScoreCard />
          </ScrollReveal>

        </div>

        {/* What you get strip */}
        <ScrollReveal delay={120}>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: "🌱",
                label: "Biotic Score",
                desc: "Pre, Pro & Postbiotic breakdown — 0 to 100",
                color: "var(--icon-lime)",
                bg: "color-mix(in srgb, var(--icon-lime) 10%, transparent)",
              },
              {
                icon: "🔥",
                label: "Inflammation Index",
                desc: "Anti-inflammatory, neutral, or inflammatory",
                color: "var(--icon-orange)",
                bg: "color-mix(in srgb, var(--icon-orange) 10%, transparent)",
              },
              {
                icon: "🧬",
                label: "Gut Metrics",
                desc: "Fermentation level, SCFA potential & gut lining",
                color: "var(--icon-teal)",
                bg: "color-mix(in srgb, var(--icon-teal) 10%, transparent)",
              },
              {
                icon: "💡",
                label: "Improvement Tips",
                desc: "3 specific swaps or additions to boost your score",
                color: "var(--icon-yellow)",
                bg: "color-mix(in srgb, var(--icon-yellow) 10%, transparent)",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-2 rounded-2xl border border-border p-4"
                style={{ background: item.bg }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg shrink-0"
                  style={{ background: "color-mix(in srgb, currentColor 8%, transparent)", color: item.color }}
                >
                  {item.icon}
                </span>
                <p className="text-sm font-semibold text-foreground leading-snug">{item.label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* CTA buttons */}
        <ScrollReveal delay={150}>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/analyse"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
            >
              <Camera size={16} /> Score My Meal — Free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
            >
              See how it works →
            </Link>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground/60">
            No account needed · Results in ~20 seconds · Free forever
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
