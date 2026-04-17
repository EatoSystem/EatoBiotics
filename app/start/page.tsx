import type { Metadata } from "next"
import { StartHero } from "@/components/start/start-hero"
import { StartProblem } from "@/components/start/start-problem"
import { StartSolution } from "@/components/start/start-solution"
import { StartHow } from "@/components/start/start-how"
import { StartValue } from "@/components/start/start-value"
import { StartPressure } from "@/components/start/start-pressure"
import { StartTrust } from "@/components/start/start-trust"
import { StartFinal } from "@/components/start/start-final"
import { StickyCta } from "@/components/start/sticky-cta"

export const metadata: Metadata = {
  title: "What's your Food System Score? | EatoBiotics",
  description:
    "Discover how your daily food habits are shaping your health, energy, and mind. Get your free Food System Score in 2 minutes.",
  openGraph: {
    title: "What's your Food System Score? | EatoBiotics",
    description:
      "Discover how your daily food habits are shaping your health, energy, and mind. Get your free Food System Score in 2 minutes.",
  },
}

export default function StartPage() {
  return (
    <>
      <StartHero />
      <StartProblem />
      <StartSolution />
      <StartHow />
      <StartValue />
      <StartPressure />
      <StartTrust />
      <StartFinal />
      <StickyCta />
    </>
  )
}
