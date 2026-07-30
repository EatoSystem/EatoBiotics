import type { Metadata } from "next"
import { Sprout, Clock, Droplet, Apple, Heart, Ban, Stethoscope, Sparkles } from "lucide-react"
import { SystemPageHero } from "@/components/systems/system-hero"
import { SystemProblem } from "@/components/systems/system-problem"
import { SystemPillarsGrid } from "@/components/systems/system-pillars"
import { SystemWhyCards } from "@/components/systems/system-why"
import { SystemFoundationTieback } from "@/components/systems/system-foundation"
import { SystemEcosystemGrid } from "@/components/systems/system-ecosystem"
import { SystemFinalCta } from "@/components/systems/system-final-cta"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { PregnancyRedFlags } from "@/components/pregnancy/PregnancyRedFlags"
import { SYSTEMS, systemEyebrow } from "@/lib/systems"
import { PREGNANCY_SECTIONS } from "@/lib/pregnancy/questions"

const system = SYSTEMS.pregnancy

// Sensitive Life system — kept out of the index until clinical/legal sign-off.
export const metadata: Metadata = {
  title: `${system.productName} | EatoBiotics`,
  description:
    "A food-first, non-diagnostic reflection of your general-wellbeing food patterns during pregnancy — built on your You or Family foundation.",
  robots: { index: false },
}

function GradientRule() {
  return (
    <div
      style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
    />
  )
}

const PILLAR_META: Record<string, { icon: typeof Sprout; label: string }> = {
  plants: { icon: Sprout, label: "VARIETY" },
  rhythm: { icon: Clock, label: "ROUTINE" },
  hydration: { icon: Droplet, label: "FLUIDS" },
  nourishing: { icon: Apple, label: "BALANCE" },
  moderation: { icon: Heart, label: "GENTLE" },
}

export default function PregnancyPage() {
  const pillars = PREGNANCY_SECTIONS.map((s) => ({
    icon: PILLAR_META[s.id]?.icon ?? Sprout,
    title: s.title,
    label: PILLAR_META[s.id]?.label ?? "",
    description: s.intro ?? "",
  }))

  return (
    <main className="overflow-hidden bg-white">
      <SystemPageHero
        system={system}
        eyebrow={systemEyebrow(system)}
        intro="A gentle, food-first reflection of your everyday eating patterns for general wellbeing — never a diagnosis, and never a substitute for your midwife or doctor."
        primaryCta={{ label: "Start Pregnancy Assessment", href: "/assessment/add/pregnancy" }}
        metaLine="Free · a few minutes · food-first, not medical"
      />
      <GradientRule />

      <SystemProblem
        system={system}
        eyebrow="The Reality"
        heading="Pregnancy nutrition is usually rules, not rhythm."
        quote="No nutrient targets, no trimester rules — just a picture of your week."
        bodyParagraphs={[
          "Most pregnancy nutrition advice arrives as a list of rules — foods to avoid, nutrients to hit, trimester-by-trimester targets. It's rarely built around the food patterns you actually have.",
          "Pregnancy, as a Life System, reflects your everyday eating patterns for general wellbeing — food-first, non-diagnostic, and always pointing you back to your midwife or doctor for anything clinical.",
        ]}
      />
      <div className="section-divider" />

      <SystemPillarsGrid
        eyebrow="What It Looks At"
        heading={<>Five everyday <span className="brand-gradient-text">food patterns</span></>}
        blurb="No nutrient targets, no trimester rules, just a picture of your week."
        pillars={pillars}
      />
      <div className="section-divider" />

      <SystemWhyCards
        system={system}
        eyebrow="Why Pregnancy"
        heading="A gentle reflection, not another set of rules."
        bodyParagraphs={[
          "Pregnancy comes with enough advice already — much of it conflicting, some of it anxiety-inducing. What's often missing is a calm, honest picture of your own everyday patterns.",
          "Pregnancy, built on your own You or Family foundation, starts from what you're already doing — not a generic checklist.",
        ]}
        points={[
          { icon: Ban, from: "Instead of nutrient targets and trimester rules", to: "A gentle picture of your week." },
          { icon: Stethoscope, from: "Instead of a diagnosis", to: "A conversation starter for your midwife or doctor." },
          { icon: Sparkles, from: "Instead of generic pregnancy advice", to: "Built on your own You or Family foundation." },
        ]}
      />
      <div className="section-divider" />

      <SystemFoundationTieback system={system} />
      <div className="section-divider" />

      <SystemEcosystemGrid system={system} />

      {/* Safety */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <PregnancyRedFlags />
        </div>
      </section>

      <SystemFinalCta
        system={system}
        heading="Start your Pregnancy reflection."
        body="A few minutes, a gentle picture of your week, and next steps for general wellbeing — built on your You or Family foundation."
        primaryCta={{ label: "Start Pregnancy Assessment", href: "/assessment/add/pregnancy" }}
        metaLine="Free · a few minutes · food-first, not medical."
      />

      <SystemDisclaimer level="sensitive" />
    </main>
  )
}
