import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function YouCta() {
  return (
    <section className="bg-foreground px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[720px] text-center">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
            Your Next Step
          </p>
          <h2 className="font-serif text-4xl font-semibold text-white sm:text-5xl text-balance leading-tight">
            Ready to understand{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              your gut?
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/60">
            Take the free assessment. Get your personal gut food score, understand your biotic
            gaps, and receive a tailored food plan — in under 5 minutes.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/30 transition-all hover:opacity-90"
            >
              Take the Free Assessment
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/biotics"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/50"
            >
              Explore the Biotics
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
