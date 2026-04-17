import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const PRINCIPLES = [
  {
    title: "Grounded in gut-brain research",
    detail: "The four pillars — Gut Diversity, Serotonin Foods, Anti-Inflammatory Foods, and Brain Biotics — are drawn from peer-reviewed gut-brain science.",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  },
  {
    title: "No supplements required",
    detail: "Food is the mechanism. Your gut produces what your brain needs when you give it the right inputs — no pills, no powders.",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
  },
  {
    title: "Real food. Not a protocol.",
    detail: "No elimination diets. No restrictive rules. Targeted additions to your existing eating patterns that move your score.",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
]

export function StartMindTrust() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">The science</p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            Your gut is running your brain.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
            90–95% of your serotonin is produced in the gut, not the brain. Your vagus nerve carries signals between them constantly.
            Short-chain fatty acids from fermented foods feed your neurons directly.
            The gut-brain connection isn't a metaphor — it&apos;s a measurable system.
          </p>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {PRINCIPLES.map((item, i) => (
            <ScrollReveal key={item.title} delay={140 + i * 70}>
              <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5">
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: item.gradient }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={380}>
          <div className="mt-10 text-center">
            <Link href="/assessment-mind" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-teal transition-colors hover:text-foreground">
              Check your Gut-Brain Score <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
