import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading } from "./shared"

/**
 * Section 4 — the journey over time. Anchored for the hero's "See How It
 * Works". Mirrors the production step-card pattern (components/home/
 * how-it-works.tsx): tinted rounded-3xl cards, 4px left accent, serif
 * display numbers, gradient connector dots between steps on desktop.
 */
const STEPS = [
  {
    number: "01",
    title: "Understand",
    horizon: "Now",
    line: "Complete the free assessment and receive your Food System Score.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-lime) 10%, transparent), transparent 60%)",
  },
  {
    number: "02",
    title: "Explain",
    horizon: "This week",
    line: "Unlock a personalised Food System Report and understand the patterns behind the score.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 60%)",
  },
  {
    number: "03",
    title: "Improve",
    horizon: "One month",
    line: "Follow practical food-first actions and a personal plan, one step at a time.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-teal) 10%, transparent), transparent 60%)",
  },
  {
    number: "04",
    title: "Measure",
    horizon: "75 days",
    line: "Check in, retest, and see how your patterns change over time.",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-yellow) 10%, transparent), transparent 60%)",
  },
  {
    number: "05",
    title: "Continue",
    horizon: "One year and beyond",
    line: "Build a better relationship with food through ongoing support and membership.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-orange) 10%, transparent), transparent 60%)",
  },
]

const PROGRESS_STATES = [
  { label: "Improved", color: "var(--icon-green)",  note: "Patterns strengthened" },
  { label: "Stable",   color: "var(--icon-teal)",   note: "Holding steady counts" },
  { label: "Mixed",    color: "var(--icon-yellow)", note: "Some up, some down" },
  { label: "Declined", color: "var(--icon-orange)", note: "Useful information, not failure" },
]

export function Journey() {
  return (
    <Section id="journey">
      <ScrollReveal>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>How It Works</Eyebrow>
          <SectionHeading>
            A journey, <span className="brand-gradient-text">not a one-time test</span>
          </SectionHeading>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            The Food System Inside You changes slowly, with the seasons of your life. EatoBiotics is
            built around watching it over weeks, months, and years — not judging it on one day.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => (
          <ScrollReveal key={step.number} delay={i * 80}>
            <div
              className="relative flex h-full min-h-[240px] flex-col rounded-3xl p-7 transition-shadow hover:shadow-lg"
              style={{
                background: step.bgGradient,
                border: `1.5px solid color-mix(in srgb, ${step.color} 30%, transparent)`,
                borderLeft: `4px solid ${step.color}`,
              }}
            >
              <span className="font-serif text-6xl font-bold leading-none md:text-7xl" style={{ color: step.color }}>
                {step.number}
              </span>
              <h3 className="mt-7 font-serif text-2xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: step.color }}>
                {step.horizon}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.line}</p>

              {/* Connector (not on last) */}
              {i < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block" style={{ zIndex: 1 }}>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: step.gradient }}>
                    <ArrowRight size={12} />
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Direction, not judgement */}
      <ScrollReveal delay={200}>
        <div
          className="mt-12 rounded-3xl p-8 md:p-10"
          style={{
            background: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 8%, transparent), transparent 60%)",
            border: "1.5px solid color-mix(in srgb, var(--icon-green) 30%, transparent)",
          }}
        >
          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Every check-in gives direction, not judgement.
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Progress is rarely a straight line. A retest can come back four ways — and each one
            tells you something useful about what to do next.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PROGRESS_STATES.map((p) => (
              <div key={p.label}>
                <span
                  className="inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                  style={{
                    background: `color-mix(in srgb, ${p.color} 15%, transparent)`,
                    color: `color-mix(in srgb, ${p.color} 78%, var(--foreground))`,
                  }}
                >
                  {p.label}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </Section>
  )
}
