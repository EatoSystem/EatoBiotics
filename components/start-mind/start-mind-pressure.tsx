import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function StartMindPressure() {
  return (
    <section className="bg-foreground px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px] text-center">

        <ScrollReveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--icon-teal)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">The reality</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl text-balance">
            Most people&apos;s Gut-Brain Score{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              is below 60.
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="mx-auto mt-4 max-w-sm text-base text-white/60">
            Not because of bad intentions — but because nobody taught them their gut runs their mind.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={130}>
          <p className="mt-3 text-lg font-semibold text-white">What&apos;s yours?</p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-8 space-y-3">
            <Link
              href="/assessment-mind"
              className="brand-gradient inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/30 transition-all hover:opacity-90"
            >
              Check your Gut-Brain Score <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-white/30">Free &nbsp;·&nbsp; 2 minutes &nbsp;·&nbsp; Instant results</p>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
