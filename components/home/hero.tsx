"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { useSearchParams } from "next/navigation"

const GOAL_VARIANTS: Record<string, { headline: string; sub: string }> = {
  energy: {
    headline: "The Energy System\nInside You",
    sub: "Low energy isn't a sleep problem — it's often a microbiome problem. Build the food system that powers everything else.",
  },
  digestion: {
    headline: "The Digestion System\nInside You",
    sub: "Bloating, sluggishness, inconsistency — most digestive issues trace back to what you're feeding (or not feeding) your gut bacteria.",
  },
  mood: {
    headline: "The Mood System\nInside You",
    sub: "Your gut produces 90% of your serotonin. Build the right food system and you change how you think, feel, and perform.",
  },
  immunity: {
    headline: "The Immunity System\nInside You",
    sub: "70% of your immune system lives in your gut. The foods you eat every day determine how well it works.",
  },
}

const DEFAULT = {
  headline: "The Food System\nInside You",
  sub: "Understand your microbiome. Build your personal food system. Improve your plate through the 3 Biotics — Pre, Pro, and Post.",
}

export function Hero() {
  const params = useSearchParams()
  const goal = params.get("goal") ?? ""
  const variant = GOAL_VARIANTS[goal] ?? DEFAULT
  const [line1, line2] = variant.headline.split("\n")

  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* ── Left: Image (desktop) / Top: Image (mobile) ──── */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[540px]">
          <div className="relative w-full">
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

        {/* ── Right: Text (desktop) / Bottom: Text (mobile) ── */}
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
              {line1}<br />{line2}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {variant.sub}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-8 flex flex-col items-start gap-3">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Get My Free Biotics Score <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>

      </div>
    </section>
  )
}
