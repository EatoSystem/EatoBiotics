import type { Metadata } from "next"
import { Droplet, Heart, Clock, ShieldCheck, Dumbbell, MessageCircleOff, Repeat as RepeatIcon } from "lucide-react"
import { SystemPageHero } from "@/components/systems/system-hero"
import { SystemProblem } from "@/components/systems/system-problem"
import { SystemPillarsGrid } from "@/components/systems/system-pillars"
import { SystemWhyCards } from "@/components/systems/system-why"
import { SystemFoundationTieback } from "@/components/systems/system-foundation"
import { SystemEcosystemGrid } from "@/components/systems/system-ecosystem"
import { SystemFinalCta } from "@/components/systems/system-final-cta"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { SYSTEMS, systemEyebrow } from "@/lib/systems"

const system = SYSTEMS.recovery

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

export default function RecoveryPage() {
  return (
    <main className="overflow-hidden bg-white">
      <SystemPageHero
        system={system}
        eyebrow={systemEyebrow(system)}
        intro="Recovery is a Health System inside EatoBiotics — food-first support for replenishment, repair, and rhythm after exertion, built on your You or Family foundation."
        primaryCta={{ label: "Start with your foundation", href: "/assessment" }}
        metaLine="Recovery layers on once your You or Family foundation is in place."
      />
      <GradientRule />

      <SystemProblem
        system={system}
        heading="Recovery is usually an afterthought."
        quote="What you eat after matters as much as what you eat before."
        bodyParagraphs={[
          "Most advice about exertion focuses on what happens before or during — fuelling up, staying hydrated, timing a meal right. What comes after is often left to a protein shake and a guess.",
          "Recovery, as a Health System, treats replenishment as part of the same living Food System you're already building — not a separate routine bolted on afterward.",
        ]}
      />
      <div className="section-divider" />

      <SystemPillarsGrid
        heading={<>The 4 Systems <span className="brand-gradient-text">of Recovery</span></>}
        blurb="Four food-first patterns that shape how well your body replenishes, repairs, and settles back into rhythm after exertion."
        pillars={[
          { icon: Droplet, title: "Replenishment", label: "RESTORE", description: "Restoring fluids and energy stores after exertion, without overcomplicating it." },
          { icon: Heart, title: "Repair", label: "REBUILD", description: "Protein and nutrient patterns that support the body's own repair process." },
          { icon: Clock, title: "Rhythm", label: "TIMING", description: "Meal timing that fits around training, rest, and everyday life — not a rigid protocol." },
          { icon: ShieldCheck, title: "Resilience", label: "CAPACITY", description: "Food patterns that build capacity over time, so recovery gets easier, not harder." },
        ]}
      />
      <div className="section-divider" />

      <SystemWhyCards
        system={system}
        eyebrow="Why Recovery"
        heading="Most recovery advice is generic. Yours doesn't have to be."
        bodyParagraphs={[
          "Supplement aisles and generic plans treat recovery as identical for everyone — same shake, same macros, same advice regardless of what your Food System already looks like.",
          "Recovery, built on your own foundation, starts from your real patterns instead of a one-size-fits-all template.",
        ]}
        points={[
          { icon: Dumbbell, from: "Instead of generic protein-shake advice", to: "Whole-food replenishment, built on your patterns." },
          { icon: MessageCircleOff, from: "Instead of guessing what to eat after exertion", to: "Rhythm and repair, food-first." },
          { icon: RepeatIcon, from: "Instead of a standalone recovery app", to: "One Food System, strengthened." },
        ]}
      />
      <div className="section-divider" />

      <SystemFoundationTieback system={system} />
      <div className="section-divider" />

      <SystemEcosystemGrid system={system} />

      <SystemFinalCta
        system={system}
        heading="Recovery starts with your foundation."
        body="Recovery isn't live yet — but it will build directly on your You or Family Food System. Start there today, and Recovery will layer on when it's ready."
        primaryCta={{ label: "Start with your foundation", href: "/assessment" }}
        metaLine="Free to start · a few minutes · food-first, not medical."
      />

      <SystemDisclaimer level={system.safetyLevel} />
    </main>
  )
}
