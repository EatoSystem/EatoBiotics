"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function FamilyHero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* ── Left: Text ─────────────────────────────────────── */}
        <div className="flex-1 text-left max-w-[560px]">
          <ScrollReveal>
            <h1
              className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance"
              style={{
                background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              The Food System<br />Inside Your Family
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              A practical framework any family can follow — one weekly plate,
              three types of food, and daily habits that build gut health for
              every person at the table.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <p className="mt-4 text-base font-semibold" style={{ color: "var(--icon-orange)" }}>
              Built around the 3 Biotics —{" "}
              <span className="text-foreground">Pre, Pro, &amp; PostBiotics</span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <div className="mt-8">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Start Free Assessment <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* ── Right: Image ─────────────────────────────────── */}
        <ScrollReveal delay={80} className="flex-1 flex items-center justify-center w-full max-w-[540px]">
          <div className="relative w-full">
            <Image
              src="/images/family-hero.png"
              alt="A family eating together — building the food system inside your family"
              width={900}
              height={900}
              priority
              className="w-full h-auto object-contain rounded-3xl"
            />
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
