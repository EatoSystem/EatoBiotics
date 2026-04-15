import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function GutBrainCta() {
  return (
    <section className="bg-foreground px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[720px] text-center">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
            Your Next Step
          </p>
          <h2 className="font-serif text-4xl font-semibold text-white sm:text-5xl text-balance leading-tight">
            <span
              style={{
                background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              See how well your gut
            </span>
            <br />
            is feeding your brain.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/60">
            The Mind Assessment is 15 questions across 5 pillars — scored specifically for
            the gut-brain connection. You&apos;ll see exactly where your food habits are
            supporting mental clarity, and where the gaps are.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/assessment-mind"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/30 transition-all hover:opacity-90"
            >
              Start the Mind Assessment
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/50"
            >
              Or take the gut assessment
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/30">
            Free · 5 minutes · Results sent to your inbox
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
