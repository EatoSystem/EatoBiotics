import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow } from "./shared"

/**
 * Chapter 2 — how EatoBiotics works: Assess → Score → Understand → Improve.
 *
 * This is deliberately a compact strip, not a full-height chapter. It answers
 * "what does the product do" in one glance so the sample score (the actual
 * proof) arrives quickly.
 *
 * It replaces the previous concept's `journey.tsx`, a five-step time-horizon
 * sequence (Understand / Explain / Improve / Measure / Continue) that competed
 * with Feed·Seed·Regenerate as a second explanation of the same thing. The two
 * frameworks now have distinct jobs: this one is what the *product* does, and
 * the foundation chapter is what the *person* does.
 *
 * Marked up as an ordered list so assistive technology announces it as a
 * sequence rather than four unrelated cards.
 */
const STAGES = [
  {
    number: "01",
    title: "Assess",
    line: "A few minutes on your food, habits, preferences and everyday context.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    number: "02",
    title: "Score",
    line: "Your personal Biotics Score — one number you can watch change.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    number: "03",
    title: "Understand",
    line: "The strengths, gaps and patterns inside your own food system.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
  },
  {
    number: "04",
    title: "Improve",
    line: "Practical, food-first steps that fit the way you already eat.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function Process() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="text-center">
            <Eyebrow>How EatoBiotics Works</Eyebrow>
          </div>
        </ScrollReveal>

        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <ScrollReveal key={s.number} delay={i * 80}>
              <li className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: s.gradient }}
                />
                <span
                  className="font-serif text-3xl font-bold leading-none"
                  style={{ color: s.color }}
                >
                  {s.number}
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.line}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>

        {/* The bridge — the one line that ties the Score to the Digital Twin. */}
        <ScrollReveal delay={340}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-lg font-medium leading-relaxed text-foreground">
            Your assessment creates your first{" "}
            <span className="font-semibold text-icon-green">Biotics Score</span> and begins your{" "}
            <span className="font-semibold text-icon-green">Digital Twin</span>.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
