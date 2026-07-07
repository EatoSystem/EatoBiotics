import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BIOTICS_CARDS } from "@/lib/biotics"
import type { SystemDef } from "@/lib/systems"

/**
 * Section 9 of the flagship recipe — the dark "Foundation" tie-back. Every
 * flagship page (Family, Stability, Mind, Glucose) ties its system back to
 * the You/Family baseline and the 3 Biotics in this slot; this generalises
 * that pattern (same copy convention as the old system-landing.tsx) for any
 * system in the catalog.
 */
export function SystemFoundationTieback({ system }: { system: SystemDef }) {
  return (
    <section className="bg-foreground px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">The Food System Inside You</p>
          <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-background sm:text-5xl md:text-6xl">
            One foundation.
            <br />
            <span className="brand-gradient-text">Every system builds on it.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
            {system.label} isn&apos;t a separate app or a standalone score — it&apos;s a lens on the same living
            Food System. It builds on your <strong className="text-background">You</strong> or{" "}
            <strong className="text-background">Family</strong> foundation, so everything you already know
            about your food patterns carries straight through.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <Link
            href="/assessment"
            className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-lime px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-icon-lime hover:text-foreground"
          >
            Begin with You or Family <ArrowUpRight size={14} />
          </Link>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {BIOTICS_CARDS.map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 100}>
              <div
                className="relative flex flex-col overflow-hidden rounded-2xl p-7"
                style={{ background: `color-mix(in srgb, ${card.accent} 8%, var(--foreground))`, border: `1px solid color-mix(in srgb, ${card.accent} 25%, transparent)` }}
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: card.gradient }} />
                <span className="font-serif text-4xl font-semibold" style={{ color: card.accent }}>{card.number}</span>
                <h3 className="mt-4 font-serif text-xl font-semibold text-background">{card.title}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: card.accent }}>{card.verb}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-background/70">{card.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {card.examples.map((ex) => (
                    <span key={ex} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${card.accent} 18%, transparent)`, color: card.accent }}>
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
