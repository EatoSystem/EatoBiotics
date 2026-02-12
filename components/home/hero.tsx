"use client"

import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* Radial glow behind icon */}
      <div className="pointer-events-none absolute inset-0 icon-glow" />

      {/* Floating decorative pills — echo the icon capsule shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left lime pill */}
        <div
          className="absolute -top-8 left-[8%] h-3 w-28 rotate-[-35deg] rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        {/* Top-right teal pill */}
        <div
          className="absolute top-[12%] right-[10%] h-3 w-24 rotate-[25deg] rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        />
        {/* Bottom-left yellow pill */}
        <div
          className="absolute bottom-[18%] left-[5%] h-3 w-20 rotate-[40deg] rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
        />
        {/* Bottom-right orange pill */}
        <div
          className="absolute bottom-[8%] right-[8%] h-3 w-32 rotate-[-20deg] rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
        />
        {/* Small circles */}
        <div className="absolute top-[25%] left-[15%] h-4 w-4 rounded-full bg-icon-lime opacity-20" />
        <div className="absolute bottom-[30%] right-[18%] h-5 w-5 rounded-full bg-icon-orange opacity-15" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[680px] flex-col items-center text-center">
        {/* Icon — large, centrepiece */}
        <ScrollReveal>
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics icon — colourful biotic shapes"
            width={200}
            height={200}
            priority
            className="h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52"
          />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="mt-8 font-serif text-6xl font-normal tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-9xl text-balance">
            <span className="brand-gradient-text">EatoBiotics</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-4 font-serif text-xl text-muted-foreground sm:text-2xl md:text-3xl">
            The Food System Inside You
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            A practical guide to the foods that strengthen your microbiome and improve how
            you feel day to day — digestion, immunity, energy, mood, and recovery.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <p className="mt-6 max-w-md font-serif text-base italic text-icon-orange md:text-lg">
            {"\"Build the food system inside you\u2026 and help build the food system around you.\""}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="https://eatobiotics.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-background transition-opacity hover:opacity-90"
            >
              Subscribe on Substack
            </a>
            <a
              href="https://www.eatosystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Explore EatoSystem
            </a>
          </div>
        </ScrollReveal>

        {/* Decorative pill bar beneath CTAs */}
        <ScrollReveal delay={600}>
          <div className="mt-12 flex items-center gap-2">
            <span className="biotic-pill bg-icon-lime" />
            <span className="biotic-pill bg-icon-green" />
            <span className="biotic-pill bg-icon-teal" />
            <span className="biotic-pill bg-icon-yellow" />
            <span className="biotic-pill bg-icon-orange" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
