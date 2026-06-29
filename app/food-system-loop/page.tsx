import type { Metadata } from "next"
import { LoopDemoClient } from "./loop-demo-client"

export const metadata: Metadata = {
  title: "The Food System Loop",
  description:
    "EatoBiotics is an ongoing improvement loop, not a one-time score. See how your baseline, meals, and progress feed a living Food System loop.",
  // Interactive demo surface — keep it out of the index for now.
  robots: { index: false, follow: true },
}

export default function FoodSystemLoopPage() {
  return <LoopDemoClient />
}
