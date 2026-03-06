"use client"

import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
<div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
        <ScrollReveal>
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics icon"
            width={200}
            height={200}
            priority
            className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56"
          />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="mt-8 font-serif text-6xl font-semibold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl text-balance">
            <span className="brand-gradient-text">EatoBiotics</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-4 font-serif text-xl font-medium text-foreground sm:text-2xl md:text-3xl">
            The Food System Inside You
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            A practical guide to the foods that strengthen your microbiome and improve how
            you feel day to day -- digestion, immunity, energy, mood, and recovery.
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
              className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
            >
              Subscribe on Substack
            </a>
            <a
              href="https://www.eatosystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
            >
              Explore EatoSystem
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
