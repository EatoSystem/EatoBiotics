import type { Metadata } from "next"
import { MindHero } from "@/components/gut-brain/mind-hero"
import { GutBrainIntro } from "@/components/gut-brain/gut-brain-intro"
import { GutBrainScience } from "@/components/gut-brain/gut-brain-science"
import { GutBrainConditions } from "@/components/gut-brain/gut-brain-conditions"
import { GutBrainFoods } from "@/components/gut-brain/gut-brain-foods"
import { GutBrainCta } from "@/components/gut-brain/gut-brain-cta"

export const metadata: Metadata = {
  title: "The Food System Inside Your Mind | EatoBiotics",
  description:
    "Your gut produces 90–95% of your body's serotonin. Learn how the microbiome-brain axis works and how what you eat shapes your mood, focus, and mental clarity.",
  openGraph: {
    title: "The Food System Inside Your Mind — EatoBiotics",
    description:
      "The science behind how your gut talks to your brain — and how food changes the conversation.",
  },
}

export default function MindPage() {
  return (
    <>
      <MindHero />
      <div className="section-divider" />
      <GutBrainIntro />
      <div className="section-divider" />
      <GutBrainScience />
      <div className="section-divider" />
      <GutBrainConditions />
      <div className="section-divider" />
      <GutBrainFoods />
      <div className="section-divider" />
      <GutBrainCta />
    </>
  )
}
