import type { Metadata } from "next"
import { Zap, HeartPulse, Beef, Timer, Dumbbell, Pill, ClipboardX } from "lucide-react"
import { SystemPageHero } from "@/components/systems/system-hero"
import { SystemProblem } from "@/components/systems/system-problem"
import { SystemPillarsGrid } from "@/components/systems/system-pillars"
import { SystemWhyCards } from "@/components/systems/system-why"
import { SystemFoundationTieback } from "@/components/systems/system-foundation"
import { SystemEcosystemGrid } from "@/components/systems/system-ecosystem"
import { SystemFinalCta } from "@/components/systems/system-final-cta"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { SYSTEMS, systemEyebrow } from "@/lib/systems"

const system = SYSTEMS.performance

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

export default function PerformancePage() {
  return (
    <main className="overflow-hidden bg-white">
      <SystemPageHero
        system={system}
        eyebrow={systemEyebrow(system)}
        intro="Performance is a Health System inside EatoBiotics — food-first fuel, recovery, and training support, built on your You or Family foundation."
        primaryCta={{ label: "Start Performance Assessment", href: "/assessment/add/performance" }}
        metaLine="Free · a few minutes · food-first, not medical"
      />
      <GradientRule />

      <SystemProblem
        system={system}
        heading="Sports nutrition is usually supplements, not systems."
        quote="Performance starts with your Food System, not your supplement stack."
        bodyParagraphs={[
          "Most performance nutrition advice arrives as a product — a shake, a stack, a protocol — disconnected from the everyday food patterns that actually fuel training and recovery.",
          "Performance, as a Health System, treats fuel, recovery, and training support as part of the same living Food System you're already building — not a separate regimen bolted on top.",
        ]}
      />
      <div className="section-divider" />

      <SystemPillarsGrid
        heading={<>The 4 Systems <span className="brand-gradient-text">of Performance</span></>}
        blurb="Four food-first patterns that shape fuel, recovery, and training support — Fuel, Recovery, Protein Quality, and Training Rhythm."
        pillars={[
          { icon: Zap, title: "Fuel", label: "ENERGY", description: "Energy patterns matched to how you actually train, not a generic calorie target." },
          { icon: HeartPulse, title: "Recovery", label: "REPAIR", description: "Replenishment and repair after training, built on food rather than supplements alone." },
          { icon: Beef, title: "Protein quality", label: "REBUILD", description: "Protein patterns that support training adaptation and everyday recovery." },
          { icon: Timer, title: "Training rhythm", label: "TIMING", description: "Meal timing that fits around training and rest, not a rigid protocol." },
        ]}
      />
      <div className="section-divider" />

      <SystemWhyCards
        system={system}
        eyebrow="Why Performance"
        heading="Most sports nutrition is sold, not built for you."
        bodyParagraphs={[
          "Supplement marketing treats performance nutrition as identical for everyone — the same stack, the same protocol, regardless of what your Food System already looks like.",
          "Performance, built on your own foundation, starts from your real food patterns instead of a one-size-fits-all product line.",
        ]}
        points={[
          { icon: Pill, from: "Instead of generic supplement stacks", to: "Whole-food fuel, built on your patterns." },
          { icon: ClipboardX, from: "Instead of one-size-fits-all sports nutrition", to: "Food-first support for how you actually train." },
          { icon: Dumbbell, from: "Instead of a standalone sports app", to: "One Food System, strengthened." },
        ]}
      />
      <div className="section-divider" />

      <SystemFoundationTieback system={system} />
      <div className="section-divider" />

      <SystemEcosystemGrid system={system} />

      <SystemFinalCta
        system={system}
        heading="Start your Performance Assessment."
        body="A few minutes, built on your You or Family foundation, for food-first fuel, recovery, and training support."
        primaryCta={{ label: "Start Performance Assessment", href: "/assessment/add/performance" }}
        metaLine="Free · a few minutes · food-first, not medical."
      />

      <SystemDisclaimer level={system.safetyLevel} />
    </main>
  )
}
