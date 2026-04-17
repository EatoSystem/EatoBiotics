import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function StartMindFinal() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px] text-center">

        <ScrollReveal>
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            Check your{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green), var(--icon-lime))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Gut-Brain Score
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
            Free report included &nbsp;·&nbsp; Takes 2 minutes &nbsp;·&nbsp; Instant results
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="mt-8 space-y-3">
            <Link
              href="/assessment-mind"
              className="brand-gradient inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-8 py-5 text-base font-semibold text-white shadow-lg shadow-icon-green/30 transition-all hover:opacity-90 hover:shadow-xl"
            >
              Check your Gut-Brain Score <ArrowRight size={18} />
            </Link>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>No signup required</span>
              <span>·</span>
              <span>No spam</span>
              <span>·</span>
              <span>No credit card</span>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
