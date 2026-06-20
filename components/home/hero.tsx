"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-24 pb-20 md:pt-28 md:pb-28">
      <div className="relative z-10 mx-auto flex max-w-[1280px] min-h-[calc(100vh-140px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-24">

        {/* ── Left: Image ──── */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[660px]">
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
              className="w-full h-auto max-h-[70vw] object-contain md:max-h-none"
            />
          </div>
        </ScrollReveal>

        {/* ── Right: Text ── */}
        <div className="flex-1 text-left max-w-[600px]">
          <ScrollReveal>
            <h1
              className="font-serif text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl text-balance"
            >
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Discover what your gut is actually doing — and get a plan to improve it in 30 days.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-8">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2.5 rounded-full px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:shadow-2xl hover:shadow-icon-green/35 hover:opacity-90"
              >
                Get my gut score free <ArrowRight size={18} />
              </Link>
              <p className="mt-3.5 text-sm text-muted-foreground">
                Takes about 3 minutes. No account required.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={320}>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-muted-foreground">
              <span>3-minute assessment</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Personalised gut score</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>30-day action plan</span>
            </div>
          </ScrollReveal>
        </div>

      </div>
    </section>
  )
}
