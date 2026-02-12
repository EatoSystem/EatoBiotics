"use client"

import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <Image
          src="/background-graphic.webp"
          alt=""
          width={800}
          height={800}
          className="w-full max-w-[600px] lg:max-w-[700px]"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[680px] flex-col items-center text-center">
        <ScrollReveal>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Now Publishing on Substack
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="font-serif text-6xl font-normal tracking-tight text-[var(--foreground)] sm:text-7xl md:text-8xl lg:text-9xl">
            <GradientText>EatoBiotics</GradientText>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-6 font-serif text-xl text-[var(--muted-foreground)] sm:text-2xl md:text-3xl">
            The Food System Inside You
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            A practical guide to the foods that strengthen your microbiome and improve how
            you feel day to day — digestion, immunity, energy, mood, and recovery.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <p className="mt-6 max-w-md font-serif text-base italic text-[var(--accent)] md:text-lg">
            {"\"Build the food system inside you\u2026 and help build the food system around you.\""}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="https://eatobiotics.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Subscribe on Substack
            </a>
            <a
              href="https://www.eatosystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--border)] bg-[var(--background)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
            >
              Explore EatoSystem
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
