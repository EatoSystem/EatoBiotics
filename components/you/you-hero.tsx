"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function YouHero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* ── Left: Text ─────────────────────────────────────── */}
        <div className="flex-1 text-left max-w-[560px]">

          <ScrollReveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              />
              Core Pathway
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              The Food System
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Your gut is home to 100 trillion microbes — a living system shaped
              entirely by what you eat. Understanding it is the first step to building
              a food life that actually works for you.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
              70% of your immune system lives in your gut
            </p>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Start Your Assessment <ArrowRight size={16} />
              </Link>
              <Link
                href="/biotics"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Explore the Framework <ArrowUpRight size={14} />
              </Link>
            </div>
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
