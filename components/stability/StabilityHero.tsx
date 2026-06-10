import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Activity } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function StabilityHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-16 md:pt-28 md:pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--icon-yellow) 14%, transparent), color-mix(in srgb, var(--icon-green) 8%, transparent) 50%, transparent 78%)" }} />
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-10 md:flex-row md:gap-16">
        {/* Image */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[480px]">
          <div className="relative w-full">
            <div aria-hidden className="absolute inset-0 -z-10 blur-3xl" style={{ background: "radial-gradient(55% 55% at 50% 50%, rgba(245,197,24,0.18), rgba(76,182,72,0.10) 55%, transparent 78%)" }} />
            <Image
              src="/images/stability-hero.png"
              alt="Two calm figures with a glowing, balanced digestive system"
              width={1402}
              height={1122}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </ScrollReveal>

        {/* Text */}
        <div className="flex-1 text-left max-w-[560px]">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <Activity size={14} style={{ color: "var(--icon-green)" }} /> EatoBiotics Stability™
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] text-balance sm:text-5xl">
              <span style={{ color: "var(--foreground)" }}>Understand Your Gut. </span>
              <span style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Reduce Urgency.</span>
              <span style={{ color: "var(--icon-green)" }}> Build Stability.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={140}>
            <p className="mt-5 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: "var(--muted-foreground)" }}>
              A digestive stability tool to help you track stool quality, urgency, food triggers,
              lifestyle patterns, and gut-health habits — so you can build more confidence in
              everyday life.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={220}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link href="/stability/assessment" className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl">
                Start Stability Assessment <ArrowRight size={16} />
              </Link>
              <Link href="/stability/tracker" className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-base font-semibold transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                Track Today&apos;s Gut Stability
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
