import type { Metadata } from "next"
import { StartMindHero } from "@/components/start-mind/start-mind-hero"
import { StartMindProblem } from "@/components/start-mind/start-mind-problem"
import { StartMindSolution } from "@/components/start-mind/start-mind-solution"
import { StartMindHow } from "@/components/start-mind/start-mind-how"
import { StartMindValue } from "@/components/start-mind/start-mind-value"
import { StartMindPressure } from "@/components/start-mind/start-mind-pressure"
import { StartMindTrust } from "@/components/start-mind/start-mind-trust"
import { StartMindFinal } from "@/components/start-mind/start-mind-final"
import { StickyCTAMind } from "@/components/start-mind/sticky-cta-mind"

export const metadata: Metadata = {
  title: "What's your Gut-Brain Score? | EatoBiotics",
  description:
    "Discover how your daily food habits are shaping your mood, focus, and mental clarity. Get your free Gut-Brain Score in under 2 minutes.",
}

export default function StartMindPage() {
  return (
    <>
      <StartMindHero />
      <StartMindProblem />
      <StartMindSolution />
      <StartMindHow />
      <StartMindValue />
      <StartMindPressure />
      <StartMindTrust />
      <StartMindFinal />
      <StickyCTAMind />
    </>
  )
}
