"use client"

import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* Rich organic radial glow */}
      <div className="pointer-events-none absolute inset-0 icon-glow" />

      {/* Floating decorative pills — echo the icon capsule shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-4 left-[6%] h-4 w-36 rotate-[-35deg] rounded-full opacity-30"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        <div
          className="absolute top-[10%] right-[8%] h-4 w-28 rotate-[25deg] rounded-full opacity-25"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        />
        <div
          className="absolute bottom-[15%] left-[3%] h-4 w-24 rotate-[40deg] rounded-full opacity-25"
          style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
        />
        <div
          className="absolute bottom-[6%] right-[6%] h-4 w-40 rotate-[-20deg] rounded-full opacity-30"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
        />
        <div
          className="absolute top-[30%] left-[12%] h-6 w-20 rotate-[55deg] rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        />
        <div className="absolute top-[22%] left-[18%] h-5 w-5 rounded-full bg-icon-lime opacity-30" />
        <div className="absolute top-[45%] right-[12%] h-4 w-4 rounded-full bg-icon-orange opacity-25" />
        <div className="absolute bottom-[35%] right-[22%] h-6 w-6 rounded-full bg-icon-yellow opacity-20" />
        <div className="absolute bottom-[25%] left-[20%] h-3 w-3 rounded-full bg-icon-teal opacity-25" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
        {/* Icon — large, centrepiece */}
        <ScrollReveal>
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics icon — colourful biotic shapes"
            width={200}
            height={200}
            priority
            className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56"
          />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="mt-8 font-serif text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl text-balance">
            <span className="brand-gradient-text">EatoBiotics</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-4 font-serif text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
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
          <p className="mt-6 max-w-md text-base font-medium italic text-icon-orange md:text-lg">
            {"\"Build the food system inside you\u2026 and help build the food system around you.\""}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="https://eatobiotics.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-foreground shadow-lg shadow-icon-lime/20 transition-all hover:shadow-xl hover:shadow-icon-lime/30 hover:opacity-90"
            >
              Subscribe on Substack
            </a>
            <a
              href="https://www.eatosystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-icon-green bg-background px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
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
