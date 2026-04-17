import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function StartFamilyPressure() {
  return (
    <section className="bg-foreground px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px] text-center">

        <ScrollReveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-icon-orange" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">The reality</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl text-balance">
            Most families are scoring{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              below 60.
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="mx-auto mt-4 max-w-sm text-base text-white/60">
            Not because they don&apos;t try — but because they don&apos;t have a shared system.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={130}>
          <p className="mt-3 text-lg font-semibold text-white">Where is your family?</p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-8 space-y-3">
            <Link
              href="/assessment-family"
              className="brand-gradient inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/30 transition-all hover:opacity-90"
            >
              Check your Family Food System Score <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-white/30">Free &nbsp;·&nbsp; 2 minutes &nbsp;·&nbsp; Instant results</p>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
