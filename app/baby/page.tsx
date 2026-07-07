import type { Metadata } from "next"
import { Sprout, Users, Shuffle, HeartHandshake, AlertTriangle, ListX, BookOpen } from "lucide-react"
import { SystemPageHero } from "@/components/systems/system-hero"
import { SystemProblem } from "@/components/systems/system-problem"
import { SystemPillarsGrid } from "@/components/systems/system-pillars"
import { SystemWhyCards } from "@/components/systems/system-why"
import { SystemFoundationTieback } from "@/components/systems/system-foundation"
import { SystemEcosystemGrid } from "@/components/systems/system-ecosystem"
import { SystemFinalCta } from "@/components/systems/system-final-cta"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { SYSTEMS } from "@/lib/systems"

const system = SYSTEMS.baby

// Sensitive Life system — kept out of the index until clinical/legal sign-off.
export const metadata: Metadata = {
  title: `${system.productName} | EatoBiotics`,
  description: system.description,
  robots: { index: false },
}

function GradientRule() {
  return (
    <div
      style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
    />
  )
}

export default function BabyPage() {
  return (
    <main className="overflow-hidden bg-white">
      <SystemPageHero
        system={system}
        eyebrow="Life System · Coming Soon"
        intro="Baby is a Life System inside EatoBiotics — gentle, food-first education for the first years of life, built on your You or Family foundation."
        primaryCta={{ label: "Join the Baby waitlist", href: "/waitlist" }}
        secondaryCta={{ label: "Begin with You or Family", href: "/assessment" }}
      />
      <GradientRule />

      <SystemProblem
        system={system}
        eyebrow="The Reality"
        heading="First-food advice is often rigid, and rarely food-first."
        quote="The first years of eating shape a lifetime of food patterns."
        bodyParagraphs={[
          "New parents are handed strict rules, feeding schedules, and conflicting advice — often disconnected from the way the rest of the family already eats.",
          "Baby, as a Life System, brings your little one into the same living Food System your household is already building, gently and gradually.",
        ]}
      />
      <div className="section-divider" />

      <SystemPillarsGrid
        eyebrow="The Framework"
        heading={<>The 4 Systems <span className="brand-gradient-text">of Baby</span></>}
        blurb="Four gentle, food-first patterns for the first years of life."
        pillars={[
          { icon: Sprout, title: "Introducing food", label: "FIRST STEPS", description: "Gentle, paced introductions to solid foods, without pressure or rigid rules." },
          { icon: Users, title: "Family meals", label: "TOGETHER", description: "Bringing baby to the same table — the same Food System the family already has." },
          { icon: Shuffle, title: "Variety over time", label: "GROWTH", description: "Building food diversity gradually, at a pace that suits your baby." },
          { icon: HeartHandshake, title: "Parent confidence", label: "SUPPORT", description: "Plain-language education for parents — not another rulebook to follow." },
        ]}
      />
      <div className="section-divider" />

      <SystemWhyCards
        system={system}
        eyebrow="Why Baby"
        heading="Feeding a baby shouldn't feel separate from feeding a family."
        bodyParagraphs={[
          "Most first-food guidance treats a baby's diet as its own isolated project, disconnected from what the rest of the household already eats.",
          "Baby, built on your own foundation, grows from the same Food System your family is already building — not a parallel one.",
        ]}
        points={[
          { icon: ListX, from: "Instead of rigid feeding rules", to: "Gentle, food-first education." },
          { icon: AlertTriangle, from: "Instead of a solo project", to: "Built for the whole family table." },
          { icon: BookOpen, from: "Instead of a disconnected diet", to: "Grown from your existing Food System." },
        ]}
      />
      <div className="section-divider" />

      <SystemFoundationTieback system={system} />
      <div className="section-divider" />

      <SystemEcosystemGrid system={system} />

      <SystemFinalCta
        system={system}
        heading="Baby starts with your family's foundation."
        body="Baby isn't live yet — but it will build directly on your You or Family Food System. Join the waitlist to hear when it launches."
        primaryCta={{ label: "Join the Baby waitlist", href: "/waitlist" }}
        metaLine="We'll let you know the moment it's ready."
      />

      <SystemDisclaimer level={system.safetyLevel} />
    </main>
  )
}
