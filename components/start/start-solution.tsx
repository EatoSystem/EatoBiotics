import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const CONTRAST = [
  { no: "Counting calories", yes: "Your actual food diversity" },
  { no: "Following a diet",  yes: "Building a consistent food system" },
  { no: "Tracking macros",   yes: "Balancing the three biotics your body needs" },
]

export function StartSolution() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-green">
            The Solution
          </p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            The{" "}
            <span className="brand-gradient-text">Food System Score</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
            You don&apos;t need more food advice. You need a clearer picture of your system.
          </p>
        </ScrollReveal>

        {/* Contrast table */}
        <ScrollReveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-2 border-b border-border bg-secondary/40">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Not this
                </p>
              </div>
              <div className="border-l border-border px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                  This
                </p>
              </div>
            </div>
            {CONTRAST.map((row, i) => (
              <div
                key={row.no}
                className={`grid grid-cols-2 ${i < CONTRAST.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center gap-2 px-4 py-3.5">
                  <span className="text-sm text-muted-foreground line-through">{row.no}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-border px-4 py-3.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--icon-green)" }}
                  />
                  <span className="text-sm font-medium text-foreground">{row.yes}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Description */}
        <ScrollReveal delay={180}>
          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            The Food System Score measures four pillars —{" "}
            <strong className="text-foreground">Diversity, Biotics, Consistency, and Rhythm</strong>
            {" "}— giving you a precise picture of what&apos;s working and exactly where to improve.
          </p>
        </ScrollReveal>

        {/* Inline CTA */}
        <ScrollReveal delay={240}>
          <div className="mt-8 text-center">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-foreground"
            >
              Check your Food System Score
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
