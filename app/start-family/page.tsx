import type { Metadata } from "next"
import { StartFamilyHero } from "@/components/start-family/start-family-hero"
import { StartFamilyProblem } from "@/components/start-family/start-family-problem"
import { StartFamilySolution } from "@/components/start-family/start-family-solution"
import { StartFamilyHow } from "@/components/start-family/start-family-how"
import { StartFamilyValue } from "@/components/start-family/start-family-value"
import { StartFamilyPressure } from "@/components/start-family/start-family-pressure"
import { StartFamilyTrust } from "@/components/start-family/start-family-trust"
import { StartFamilyFinal } from "@/components/start-family/start-family-final"
import { StickyCtagFamily } from "@/components/start-family/sticky-cta-family"

export const metadata: Metadata = {
  title: "What's your Family Food System Score? | EatoBiotics",
  description:
    "Discover how your household's food habits are shaping every family member's health. Get your free Family Food System Score in 2 minutes.",
  openGraph: {
    title: "What's your Family Food System Score? | EatoBiotics",
    description:
      "Discover how your household's food habits are shaping every family member's health. Get your free Family Food System Score in 2 minutes.",
  },
}

export default function StartFamilyPage() {
  return (
    <>
      <StartFamilyHero />
      <StartFamilyProblem />
      <StartFamilySolution />
      <StartFamilyHow />
      <StartFamilyValue />
      <StartFamilyPressure />
      <StartFamilyTrust />
      <StartFamilyFinal />
      <StickyCtagFamily />
    </>
  )
}
