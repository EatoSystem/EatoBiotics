"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
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
            Understand your microbiome. Score your meals. Build better habits — for digestion,
            energy, mood, immunity, and recovery.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
            >
              Start Free Assessment <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
            >
              See How It Works <ChevronDown size={16} />
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Free to start. No card needed.</p>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <p className="mt-10 max-w-md text-sm font-medium italic text-muted-foreground/70">
            &ldquo;Build the food system inside you&hellip; and help build the food system around you.&rdquo;
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
