import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const SAMPLE_MEALS = [
  {
    meal: "Greek yogurt + berries + oats",
    emoji: "🥣",
    pre: 82,
    pro: 91,
    post: 48,
    score: 80,
    verdict: "Strong",
    verdictColor: "var(--icon-lime)",
    verdictGradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    meal: "Grilled salmon + kimchi + spinach",
    emoji: "🐟",
    pre: 64,
    pro: 78,
    post: 89,
    score: 78,
    verdict: "Excellent",
    verdictColor: "var(--icon-teal)",
    verdictGradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    meal: "Cheeseburger + fries + cola",
    emoji: "🍔",
    pre: 12,
    pro: 4,
    post: 8,
    score: 9,
    verdict: "Poor",
    verdictColor: "var(--icon-orange)",
    verdictGradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

const BARS = [
  { label: "Pre", key: "pre" as const, color: "var(--icon-lime)" },
  { label: "Pro", key: "pro" as const, color: "var(--icon-teal)" },
  { label: "Post", key: "post" as const, color: "var(--icon-orange)" },
]

export function TryAMealTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-12">
          <ScrollReveal className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Meal Analysis
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Every meal has a score.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Photograph or describe any meal and get an instant Pre, Pro, and Postbiotic
              breakdown. See exactly what your food is doing for — or against — your microbiome.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <Link
              href="/analyse"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted shrink-0"
            >
              Score your meal
              <ArrowRight size={14} />
            </Link>
          </ScrollReveal>
        </div>

        {/* Sample meal cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {SAMPLE_MEALS.map((m, i) => (
            <ScrollReveal key={m.meal} delay={i * 80}>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6">
                {/* Top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: m.verdictGradient }}
                />

                {/* Emoji + score */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{m.emoji}</span>
                  <div className="text-right">
                    <div
                      className="font-serif text-2xl font-bold"
                      style={{ color: m.verdictColor }}
                    >
                      {m.score}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Score
                    </div>
                  </div>
                </div>

                {/* Meal name */}
                <p className="text-sm font-semibold text-foreground mb-4 leading-snug">
                  {m.meal}
                </p>

                {/* Biotics bars */}
                <div className="space-y-2">
                  {BARS.map((b) => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="w-6 text-[10px] font-semibold text-muted-foreground shrink-0">
                        {b.label}
                      </span>
                      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m[b.key]}%`,
                            backgroundColor: b.color,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-[10px] text-muted-foreground shrink-0">
                        {m[b.key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Verdict */}
                <div className="mt-4 pt-4 border-t border-border">
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                    style={{ background: m.verdictGradient }}
                  >
                    {m.verdict}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={240}>
          <div className="mt-10 text-center">
            <Link
              href="/analyse"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
            >
              Score my meal now
              <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Free to try. Takes about 30 seconds.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
