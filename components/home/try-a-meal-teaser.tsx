import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Camera } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const SAMPLE_MEALS = [
  {
    meal: "Salmon + Kimchi Bowl",
    photo: "/food-6.png",
    emojis: ["🐟", "🌿", "🥗", "🫙"],
    pre: 64,
    pro: 78,
    post: 72,
    score: 82,
    scoreBand: "Exceptional",
    scoreColor: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    meal: "Greek Yogurt Breakfast",
    photo: "/food-2.png",
    emojis: ["🍓", "🫐", "🥣", "🌾"],
    pre: 58,
    pro: 91,
    post: 44,
    score: 78,
    scoreBand: "Strong",
    scoreColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    meal: "Cheeseburger & Fries",
    photo: "/food-11.png",
    emojis: ["🍔", "🍟", "🧀"],
    pre: 12,
    pro: 4,
    post: 8,
    score: 9,
    scoreBand: "Low",
    scoreColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

const BARS = [
  { label: "Pre", key: "pre" as const, color: "var(--icon-lime)" },
  { label: "Pro", key: "pro" as const, color: "var(--icon-green)" },
  { label: "Post", key: "post" as const, color: "var(--icon-teal)" },
]

export function TryAMealTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">

        {/* Social proof strip */}
        <ScrollReveal>
          <div
            className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-border px-6 py-2.5 text-xs font-semibold text-muted-foreground w-fit mx-auto"
          >
            <span>★ 1,247 meals scored</span>
            <span className="hidden sm:inline text-border">|</span>
            <span>Avg score: 64</span>
            <span className="hidden sm:inline text-border">|</span>
            <span>Most common gap: <span style={{ color: "var(--icon-green)" }}>Probiotics</span></span>
          </div>
        </ScrollReveal>

        {/* Header */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-12">
          <ScrollReveal className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
              Meal Analysis
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Every meal has a score.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Photograph or describe any meal and get an instant Pre, Pro, and Postbiotic
              breakdown — plus calories, inflammation index, and gut lining support.
            </p>
          </ScrollReveal>

          {/* Upload mockup */}
          <ScrollReveal delay={80}>
            <div
              className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground"
              style={{ background: "color-mix(in srgb, var(--icon-green) 5%, var(--card))" }}
            >
              <Camera size={18} style={{ color: "var(--icon-green)" }} />
              <span className="font-semibold text-foreground">Your meal in 30 seconds</span>
              <span className="text-xs">→ drag or tap</span>
            </div>
          </ScrollReveal>
        </div>

        {/* Food photo cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {SAMPLE_MEALS.map((m, i) => (
            <ScrollReveal key={m.meal} delay={i * 80}>
              <div className="relative overflow-hidden rounded-2xl group">
                {/* Background food photo */}
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={m.photo}
                    alt={m.meal}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Score badge */}
                  <div
                    className="absolute top-3 right-3 flex items-center justify-center w-11 h-11 rounded-full border-2 bg-black/40 backdrop-blur-sm"
                    style={{ borderColor: m.scoreColor }}
                  >
                    <span className="text-sm font-bold tabular-nums text-white">
                      {m.score}
                    </span>
                  </div>

                  {/* Food emojis strip */}
                  <div className="absolute top-3 left-3 flex gap-1">
                    {m.emojis.slice(0, 4).map((emoji, ei) => (
                      <span
                        key={ei}
                        className="text-sm leading-none rounded-full px-1.5 py-0.5 backdrop-blur-sm bg-black/30"
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>

                  {/* Meal name + bars (bottom overlay) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-bold text-white leading-tight mb-2">{m.meal}</p>

                    {/* Biotics bars */}
                    <div className="space-y-1.5">
                      {BARS.map((b) => (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className="w-5 text-[10px] font-bold text-white/70 shrink-0">{b.label}</span>
                          <div className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${m[b.key]}%`, backgroundColor: b.color }}
                            />
                          </div>
                          <span className="w-5 text-right text-[10px] text-white/60 tabular-nums shrink-0">
                            {m[b.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score band footer */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ background: "color-mix(in srgb, var(--card) 95%, transparent)" }}
                >
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: m.gradient }}
                  >
                    {m.scoreBand}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full" style={{ backgroundColor: m.scoreColor }} />
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color: m.scoreColor }}>
                      {m.score}/100
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={240}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/analyse"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
            >
              <Camera size={16} /> Score My Meal — Free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
            >
              See how it works <ArrowRight size={14} />
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            No account needed · Takes about 30 seconds
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
