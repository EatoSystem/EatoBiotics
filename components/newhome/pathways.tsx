import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading, StatusBadge } from "./shared"

/**
 * Section 6 — You first, Family next, deeper pathways on the shared
 * foundation. The Family band mirrors the production dark panel idiom
 * (components/home/closing-cta.tsx: dark green gradient, ambient glows,
 * gradient hairline); pathway cards mirror the quadrant card pattern
 * (the-framework.tsx: rounded-2xl, top gradient bar, uppercase label).
 */
const PATHWAYS = [
  {
    name: "Stability",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    line: "Support greater digestive comfort, predictability, and confidence.",
  },
  {
    name: "Glucose",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    line: "Support steadier energy, cravings, and food rhythm.",
  },
  {
    name: "Mind",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    line: "Explore the relationship between food, gut, mood, focus, and daily clarity.",
  },
  {
    name: "Performance",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    line: "Support energy, recovery, strength, and output through better food patterns.",
  },
]

export function Pathways() {
  return (
    <Section>
      {/* Header — split layout with side CTA, as on the production framework section */}
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>One Connected System</Eyebrow>
            <SectionHeading>
              Begin <span className="brand-gradient-text">with you.</span>
            </SectionHeading>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Everything in EatoBiotics builds on one foundation: your own Food System Score.
              Establish it once, and every deeper pathway starts from what you have already
              shared — you are never asked to repeat the complete foundation assessment.
            </p>
          </div>
          <Link
            href="/assessment"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2.5 text-sm font-semibold text-icon-green transition-all hover:border-icon-green/50 hover:bg-icon-green/10"
          >
            Get My Food System Score <ArrowRight size={15} />
          </Link>
        </div>
      </ScrollReveal>

      {/* Family — production dark panel idiom */}
      <ScrollReveal delay={100}>
        <div
          className="relative mt-16 overflow-hidden rounded-[2.5rem] px-6 py-16 md:px-12"
          style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
          />
          <div className="relative z-10">
            <StatusBadge status="in-development" />
            <h3 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
              Your family has a{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                food system too.
              </span>
            </h3>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              A household eats together, shops together, and builds habits together. Family is
              EatoBiotics&apos; next major expansion — adult household profiles first, with shared
              household food patterns, a Family Food System Score, one shared weekly action, and
              practical household meal and shopping guidance.
            </p>
            <p className="mt-4 text-xs text-white/55">
              Household features are being built adult-first. Child-specific profiles are not live.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Deeper pathways — quadrant card idiom */}
      <div className="mt-16">
        <ScrollReveal>
          <h3 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            Go deeper <span className="brand-gradient-text">where it matters to you.</span>
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Four pathways, all part of EatoBiotics, all building on your You or Family foundation.
          </p>
        </ScrollReveal>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PATHWAYS.map((p, index) => (
            <ScrollReveal key={p.name} delay={index * 80}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                <div className="absolute left-0 right-0 top-0 h-1" style={{ background: p.gradient }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: p.color }}>
                  Builds on your foundation
                </p>
                <h4 className="mt-1.5 font-serif text-xl font-semibold text-foreground">{p.name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.line}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
