import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const CONTRAST = [
  { no: "Picky eater battles at every meal",          yes: "A shared plate every family member can eat from"   },
  { no: "Meal planning from scratch each week",        yes: "One weekly framework that covers the whole family" },
  { no: "Separate meals for adults and kids",          yes: "One food system that grows with every family member"},
]

export function StartFamilySolution() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-green">The Solution</p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            The{" "}
            <span className="brand-gradient-text">Family Food System Score</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
            You don&apos;t need a new recipe. You need a clearer picture of how your family&apos;s food is actually working.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-2 border-b border-border bg-secondary/40">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Not this</p>
              </div>
              <div className="border-l border-border px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">This</p>
              </div>
            </div>
            {CONTRAST.map((row, i) => (
              <div key={row.no} className={`grid grid-cols-2 ${i < CONTRAST.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-2 px-4 py-3.5">
                  <span className="text-sm text-muted-foreground line-through">{row.no}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-border px-4 py-3.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-green)" }} />
                  <span className="text-sm font-medium text-foreground">{row.yes}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            The Family Food System Score measures four pillars —{" "}
            <strong className="text-foreground">Variety, Routine, Biotics, and Together</strong>
            {" "}— giving your household a precise picture of what&apos;s working and where to improve.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <div className="mt-8 text-center">
            <Link href="/assessment-family" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-foreground">
              Check your Family Food System Score <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
