import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const CONTRAST = [
  { no: "Mood as a brain chemistry problem",      yes: "Mood as a gut-feeding problem you can change"    },
  { no: "Supplements and stimulants",             yes: "Food that produces what your mind needs naturally"},
  { no: "Guessing what affects your focus",       yes: "A clear score with specific, measurable gaps"    },
]

export function StartMindSolution() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">The Solution</p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            The{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Gut-Brain Score
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
            You don&apos;t need a new supplement. You need to understand what your gut
            is — or isn&apos;t — feeding your brain.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-2 border-b border-border bg-secondary/40">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Not this</p>
              </div>
              <div className="border-l border-border px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">This</p>
              </div>
            </div>
            {CONTRAST.map((row, i) => (
              <div key={row.no} className={`grid grid-cols-2 ${i < CONTRAST.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-2 px-4 py-3.5">
                  <span className="text-sm text-muted-foreground line-through">{row.no}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-border px-4 py-3.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-teal)" }} />
                  <span className="text-sm font-medium text-foreground">{row.yes}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            The Gut-Brain Score measures four pillars —{" "}
            <strong className="text-foreground">Gut Diversity, Serotonin Foods, Anti-Inflammatory Foods, and Brain Biotics</strong>
            {" "}— showing exactly where your food is supporting your mind and where it&apos;s falling short.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <div className="mt-8 text-center">
            <Link href="/assessment-mind" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-teal transition-colors hover:text-foreground">
              Check your Gut-Brain Score <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
