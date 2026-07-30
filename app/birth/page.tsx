import type { Metadata } from "next"
import { Droplet, Soup, Moon, HeartPulse, AlertTriangle, ListChecks, Users2 } from "lucide-react"
import { SystemPageHero } from "@/components/systems/system-hero"
import { SystemProblem } from "@/components/systems/system-problem"
import { SystemPillarsGrid } from "@/components/systems/system-pillars"
import { SystemWhyCards } from "@/components/systems/system-why"
import { SystemFoundationTieback } from "@/components/systems/system-foundation"
import { SystemEcosystemGrid } from "@/components/systems/system-ecosystem"
import { SystemFinalCta } from "@/components/systems/system-final-cta"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { SYSTEMS, systemEyebrow } from "@/lib/systems"

const system = SYSTEMS.birth

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

export default function BirthPage() {
  return (
    <main className="overflow-hidden bg-white">
      <SystemPageHero
        system={system}
        eyebrow={systemEyebrow(system)}
        intro="Birth is a Life System inside EatoBiotics — food-first support for nourishment, hydration and rhythm around birth and early recovery, built on your You or Family foundation."
        primaryCta={{ label: "Join the Birth waitlist", href: "/waitlist" }}
        secondaryCta={{ label: "Begin with You or Family", href: "/assessment" }}
      />
      <GradientRule />

      <SystemProblem
        system={system}
        eyebrow="The Reality"
        heading="The days after birth get very little food-first support."
        quote="Recovery deserves the same care as preparation."
        bodyParagraphs={[
          "So much attention goes into preparing for birth — and comparatively little into the days and weeks of recovery that follow, when hydration, gentle nourishment, and rest matter just as much.",
          "Birth, as a Life System, carries the same food-first approach you already know from your foundation through this transition — nothing extra to learn, nothing separate to manage.",
        ]}
      />
      <div className="section-divider" />

      <SystemPillarsGrid
        eyebrow="The Framework"
        heading={<>The 4 Systems <span className="brand-gradient-text">of Birth</span></>}
        blurb="Four gentle, food-first patterns that support recovery and transition around birth."
        pillars={[
          { icon: Droplet, title: "Hydration & fluids", label: "RESTORE", description: "Steady fluid intake through early recovery, when it's easy to forget." },
          { icon: Soup, title: "Gentle nourishment", label: "COMFORT", description: "Easy, comforting foods for when appetite and energy are unpredictable." },
          { icon: HeartPulse, title: "Bowel comfort", label: "EASE", description: "Fibre and fluid patterns that support gentle digestive recovery." },
          { icon: Moon, title: "Rhythm & rest", label: "ROUTINE", description: "Small, regular meals that fit around broken sleep and a new routine." },
        ]}
      />
      <div className="section-divider" />

      <SystemWhyCards
        system={system}
        eyebrow="Why Birth"
        heading="Recovery shouldn't mean starting from zero."
        bodyParagraphs={[
          "Generic postpartum checklists rarely account for what you already know about your own food patterns — they start you over instead of building on what you've already got.",
          "Birth, built on your own foundation, carries your existing patterns straight through the transition.",
        ]}
        points={[
          { icon: ListChecks, from: "Instead of another generic checklist", to: "Simple rhythm and hydration cues." },
          { icon: AlertTriangle, from: "Instead of guesswork after birth", to: "Food-first support layered on your foundation." },
          { icon: Users2, from: "Instead of starting over", to: "The same Food System, carried through recovery." },
        ]}
      />
      <div className="section-divider" />

      <SystemFoundationTieback system={system} />
      <div className="section-divider" />

      <SystemEcosystemGrid system={system} />

      <SystemFinalCta
        system={system}
        heading="Birth starts with your foundation."
        body="Birth isn't live yet — but it will build directly on your You or Family Food System. Join the waitlist to hear when it launches."
        primaryCta={{ label: "Join the Birth waitlist", href: "/waitlist" }}
        metaLine="We'll let you know the moment it's ready."
      />

      <SystemDisclaimer level={system.safetyLevel} />
    </main>
  )
}
