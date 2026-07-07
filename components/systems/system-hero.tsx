import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { SystemDef } from "@/lib/systems"

/**
 * Flagship-style split hero for system pages — mirrors the image-left /
 * text-right layout used by YouHero and FamilyHero (components/you/you-hero.tsx,
 * components/family/family-hero.tsx), so Pregnancy/Birth/Baby/Recovery/Longevity
 * read as the same page family rather than a separate scaffold template.
 */
export function SystemPageHero({
  system,
  eyebrow,
  intro,
  primaryCta,
  secondaryCta,
  metaLine,
}: {
  system: SystemDef
  eyebrow: string
  intro: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  metaLine?: string
}) {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-20 pb-16 md:pb-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-160px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">
        {/* ── Left: Image ── */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[560px]">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: `radial-gradient(60% 60% at 50% 48%, color-mix(in srgb, ${system.accent} 20%, transparent), color-mix(in srgb, ${system.accent} 10%, transparent) 55%, transparent 78%)` }}
            />
            {system.image && (
              <Image
                src={system.image}
                alt={`${system.productName} illustration`}
                width={900}
                height={900}
                priority
                className="w-full h-auto object-contain"
              />
            )}
          </div>
        </ScrollReveal>

        {/* ── Right: Text ── */}
        <div className="flex-1 text-left max-w-[560px]">
          <ScrollReveal delay={80}>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles size={12} style={{ color: system.accent }} /> {eyebrow}
            </p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              <span style={{ color: system.accent }}>The {system.label}</span>{" "}
              <span className="brand-gradient-text">Food System</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <p className="mt-4 max-w-md text-xl font-medium text-foreground sm:text-2xl">
              {system.tagline}
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {intro}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href={primaryCta.href}
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                {primaryCta.label} <ArrowRight size={16} />
              </Link>
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
            {metaLine && <p className="mt-4 text-xs text-muted-foreground">{metaLine}</p>}
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
