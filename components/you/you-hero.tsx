"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function YouHero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-20 pb-16 md:pb-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-160px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* ── Left: Image ── */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[560px]">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.20), rgba(45,170,110,0.12) 55%, transparent 78%)" }}
            />
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

        {/* ── Right: Text ── */}
        <div className="flex-1 text-left max-w-[560px]">
          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span className="brand-gradient-text">Inside You</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <p className="mt-4 max-w-md text-xl font-medium text-foreground sm:text-2xl">
              Build the microbiome that powers your energy, digestion, and immunity.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Your gut is home to 100 trillion microbes — a living system shaped entirely by what you
              eat. Take the free assessment, discover your EatoBiotics Score, and start building it.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link href="/assessment" className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90">
                Start Free Assessment <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
                See how it works
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={320}>
            <div className="mt-8 flex items-center gap-6">
              {[
                { num: "Free", label: "To start" },
                { num: "3 min", label: "Takes about" },
                { num: "30 days", label: "To results" },
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
        </div>
      </div>
    </section>
  )
}
