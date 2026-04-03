"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* ── Left: Text ─────────────────────────────────────── */}
        <div className="flex-1 text-left max-w-[560px]">
          <ScrollReveal>
            <h1 className="font-serif text-5xl font-bold leading-tight text-foreground sm:text-6xl md:text-7xl text-balance">
              The Food System<br />Inside You
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              A simple system to understand your microbiome and improve how you feel day to day —
              digestion, immunity, energy, mood, and recovery.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <p className="mt-4 text-base font-semibold" style={{ color: "var(--icon-orange)" }}>
              Built around{" "}
              <span className="text-foreground">Pre. Pro. Post.</span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <div className="mt-8 flex flex-col items-start gap-3">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Start Free Assessment <ArrowRight size={16} />
              </Link>
              <p className="text-sm text-muted-foreground">Takes 2 minutes. Free.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <a
              href="#how-it-works"
              className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold transition-colors"
              style={{ color: "var(--icon-green)" }}
            >
              See How It Works <ArrowRight size={15} />
            </a>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className="mt-12 text-sm font-medium italic text-muted-foreground/60 sm:text-base" style={{ color: "var(--icon-orange)", opacity: 0.85 }}>
              &ldquo;Build the food system inside you&hellip; and help build the food system around you.&rdquo;
            </p>
          </ScrollReveal>
        </div>

        {/* ── Right: Image ─────────────────────────────────── */}
        <ScrollReveal delay={80} className="flex-1 flex items-center justify-center w-full max-w-[540px]">
          <div className="relative w-full">
            <Image
              src="/images/hero-gut.png"
              alt="The food system inside you — gut microbiome illustration"
              width={900}
              height={900}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
