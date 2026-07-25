import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { ConditionDef } from "@/lib/conditions"

export function ConditionHero({ condition }: { condition: ConditionDef }) {
  const Badge = condition.badgeIcon
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)", opacity: 0.07 }}
        />
        <div
          className="absolute right-[-8%] top-[20%] h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--icon-teal), transparent 70%)", opacity: 0.06 }}
        />
      </div>

      <div className="relative mx-auto max-w-[760px] text-center">
        <ScrollReveal>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
            <Badge size={12} className="text-[var(--icon-teal)]" />
            Mental Health & The Gut
          </div>

          <h1 className="font-serif text-5xl font-semibold leading-tight text-foreground sm:text-6xl md:text-7xl text-balance">
            {condition.label} &{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Food System
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {condition.hero.body}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/assessment-mind"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
            >
              Take the Mind Assessment
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/food"
              className="inline-flex items-center gap-2 rounded-full border-2 border-icon-teal px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-teal hover:text-white"
            >
              {condition.hero.secondaryCtaLabel}
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Educational content only · Not medical advice</p>
        </ScrollReveal>
      </div>
    </section>
  )
}
