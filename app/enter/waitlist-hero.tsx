"use client"

import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DiscoverFlow } from "@/components/waitlist/discover-flow"
import { WaitlistSocialProof } from "@/components/waitlist/social-proof"
import { HeroVideo } from "@/components/hero-video"

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

/**
 * Waitlist hero for the gated landing page. The right-hand column hosts the
 * "Discover Your Food System Type" flow (a short quiz → profile reveal →
 * waitlist signup), which posts to /api/waitlist. Everything below it on /enter
 * reuses the real homepage showcase sections.
 */
export function WaitlistHero() {
  return (
    <section className="relative px-6 pt-24 pb-16 md:pb-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* Left: gut hero illustration with brand glow */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[520px]">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.22), rgba(245,166,35,0.12) 55%, transparent 78%)" }}
            />
            <HeroVideo
              posterSrc="/videos/food-system-hero-poster.jpg"
              webmSrc="/videos/food-system-hero.webm"
              mp4Src="/videos/food-system-hero.mp4"
              alt="The food system inside you — animated gut microbiome figure"
              className="w-full h-auto max-h-[70vw] object-contain md:max-h-none"
            />
          </div>
        </ScrollReveal>

        {/* Right: waitlist content */}
        <div className="flex-1 text-left max-w-[560px] w-full">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GRADIENT_BAR }} />
              Coming soon · Join the waitlist
            </span>
            <WaitlistSocialProof />
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span
                style={{
                  background: GRADIENT_BAR,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take the 60-second discovery to meet the living food system inside you — then
              join the waitlist for early access when EatoBiotics launches.
            </p>
          </ScrollReveal>

          {/* Discover Your Food System Type flow */}
          <ScrollReveal delay={200}>
            <div className="mt-8 w-full">
              <DiscoverFlow />
            </div>
          </ScrollReveal>

          {/* Stat row — matches homepage */}
          <ScrollReveal delay={300}>
            <div className="mt-8 flex items-center gap-6">
              {[
                { num: "Free", label: "To join" },
                { num: "Early", label: "Access" },
                { num: "2026", label: "Launching" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-5">
                  {i > 0 && <div className="h-5 w-px bg-border" />}
                  <div>
                    <p className="font-serif text-lg font-bold text-foreground">{s.num}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={340}>
            <Link
              href="/waitlist"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              See what&apos;s coming — Book, App &amp; Course
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
