/**
 * "The Food System Loop" — homepage section framing EatoBiotics as an ongoing
 * improvement loop, not a one-time assessment. Presentational; brand palette.
 */

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const LOOP_LABELS = [
  "Assess",
  "Understand",
  "Observe",
  "Analyse",
  "Recommend",
  "Improve",
  "Learn",
]

export function FoodSystemLoopSection() {
  return (
    <section id="food-system-loop" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Food System Loop
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Your Food System improves through a{" "}
              <span className="brand-gradient-text">living loop</span>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              EatoBiotics doesn&rsquo;t stop at a single score. Your baseline, meals,
              symptoms, habits, and progress feed an ongoing loop that helps you
              understand what is changing, why it matters, and what to improve next.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <ol className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {LOOP_LABELS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, var(--icon-lime) ${100 - i * 8}%, var(--icon-orange)), var(--icon-green))`,
                  }}
                >
                  {label}
                </span>
                {i < LOOP_LABELS.length - 1 && (
                  <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />
                )}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />
              <span className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
                Repeat
              </span>
            </li>
          </ol>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
            >
              Start My Food System Baseline
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
