import type { Metadata } from "next"
import { Sprout, Flame, Repeat as RepeatIcon, Sparkles, Hourglass, Ban, HeartHandshake } from "lucide-react"
import { SystemPageHero } from "@/components/systems/system-hero"
import { SystemProblem } from "@/components/systems/system-problem"
import { SystemPillarsGrid } from "@/components/systems/system-pillars"
import { SystemWhyCards } from "@/components/systems/system-why"
import { SystemFoundationTieback } from "@/components/systems/system-foundation"
import { SystemEcosystemGrid } from "@/components/systems/system-ecosystem"
import { SystemFinalCta } from "@/components/systems/system-final-cta"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { SYSTEMS, systemEyebrow } from "@/lib/systems"

const system = SYSTEMS.longevity

export const metadata: Metadata = {
  title: `${system.productName} | EatoBiotics`,
  description: system.description,
}

function GradientRule() {
  return (
    <div
      style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
    />
  )
}

export default function LongevityPage() {
  return (
    <main className="overflow-hidden bg-white">
      <SystemPageHero
        system={system}
        eyebrow={systemEyebrow(system)}
        intro="Longevity is a Health System inside EatoBiotics — food-first support for long-term diversity and anti-inflammatory patterns, built on your You or Family foundation."
        primaryCta={{ label: "Start with your foundation", href: "/assessment" }}
        metaLine="Longevity layers on once your You or Family foundation is in place."
      />
      <GradientRule />

      <SystemProblem
        system={system}
        heading="Ageing well is a pattern, not an event."
        quote="The food system you build today is the one you'll be living with in thirty years."
        bodyParagraphs={[
          "Most longevity advice arrives as a dramatic overhaul — a new diet, a new supplement stack, a new rulebook. Very little of it is about the small, repeatable food patterns that actually compound over decades.",
          "Longevity, as a Health System, treats ageing well as an extension of the Food System you're already building — diversity and consistency, sustained over time.",
        ]}
      />
      <div className="section-divider" />

      <SystemPillarsGrid
        heading={<>The 4 Systems <span className="brand-gradient-text">of Longevity</span></>}
        blurb="Four food-first patterns associated with long-term health — sustainable, not restrictive."
        pillars={[
          { icon: Sprout, title: "Diversity", label: "VARIETY", description: "A wide variety of plants and foods over time, rather than a narrow, repetitive routine." },
          { icon: Flame, title: "Anti-inflammatory patterns", label: "BALANCE", description: "Everyday food choices associated with lower long-term inflammation." },
          { icon: RepeatIcon, title: "Consistency", label: "RHYTHM", description: "Small, sustainable habits repeated for years — not dramatic changes that don't last." },
          { icon: Sparkles, title: "Ageing well", label: "VITALITY", description: "Food patterns associated with long-term energy, mobility, and vitality." },
        ]}
      />
      <div className="section-divider" />

      <SystemWhyCards
        system={system}
        eyebrow="Why Longevity"
        heading="Most longevity advice doesn't survive real life."
        bodyParagraphs={[
          "Extreme diets and rigid protocols rarely last — they ask for more than most people can sustain for a week, let alone a decade.",
          "Longevity, built on your own foundation, starts from patterns you can actually keep — because the ones you keep are the ones that compound.",
        ]}
        points={[
          { icon: Ban, from: "Instead of short-term fixes", to: "Long-term diversity you can sustain." },
          { icon: Hourglass, from: "Instead of restrictive rules", to: "Anti-inflammatory patterns that fit real life." },
          { icon: HeartHandshake, from: "Instead of starting from scratch", to: "Built on the Food System you're already growing." },
        ]}
      />
      <div className="section-divider" />

      <SystemFoundationTieback system={system} />
      <div className="section-divider" />

      <SystemEcosystemGrid system={system} />

      <SystemFinalCta
        system={system}
        heading="Longevity starts with your foundation."
        body="Longevity isn't live yet — but it will build directly on your You or Family Food System. Start there today, and Longevity will layer on when it's ready."
        primaryCta={{ label: "Start with your foundation", href: "/assessment" }}
        metaLine="Free to start · a few minutes · food-first, not medical."
      />

      <SystemDisclaimer level={system.safetyLevel} />
    </main>
  )
}
