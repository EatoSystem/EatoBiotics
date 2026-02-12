"use client"

import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* Soft radial glow */}
      <div className="pointer-events-none absolute inset-0 icon-glow" />

      {/* Floating gradient pills — larger, more vivid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-2 left-[5%] h-5 w-44 rotate-[-35deg] rounded-full opacity-40"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        <div
          className="absolute top-[8%] right-[6%] h-5 w-36 rotate-[25deg] rounded-full opacity-35"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        />
        <div
          className="absolute top-[25%] left-[10%] h-6 w-28 rotate-[55deg] rounded-full opacity-30"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        />
        <div
          className="absolute bottom-[20%] left-[2%] h-5 w-32 rotate-[40deg] rounded-full opacity-35"
          style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
        />
        <div
          className="absolute bottom-[8%] right-[4%] h-5 w-48 rotate-[-20deg] rounded-full opacity-40"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
        />
        <div
          className="absolute top-[55%] right-[15%] h-6 w-24 rotate-[60deg] rounded-full opacity-30"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
        />
        {/* Circles */}
        <div className="absolute top-[18%] left-[16%] h-8 w-8 rounded-full bg-icon-lime opacity-30" />
        <div className="absolute top-[40%] right-[10%] h-6 w-6 rounded-full bg-icon-orange opacity-30" />
        <div className="absolute bottom-[30%] right-[20%] h-9 w-9 rounded-full bg-icon-yellow opacity-25" />
        <div className="absolute bottom-[22%] left-[18%] h-5 w-5 rounded-full bg-icon-teal opacity-30" />
        <div className="absolute top-[65%] left-[8%] h-7 w-7 rounded-full bg-icon-green opacity-25" />
        <div className="absolute top-[12%] right-[30%] h-4 w-4 rounded-full bg-icon-lime opacity-35" />
      </div>

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

        {/* Gradient divider bar */}
        <ScrollReveal delay={600}>
          <div className="mt-14 h-1 w-64 rounded-full brand-gradient" />
        </ScrollReveal>
      </div>
    </section>
  )
}
