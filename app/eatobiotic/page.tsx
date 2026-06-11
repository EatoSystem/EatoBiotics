import type { Metadata } from "next"
import { getUser } from "@/lib/supabase-server"
import { canAccess, getUserMembershipTier } from "@/lib/membership"
import { EatobioticClient } from "./eatobiotic-client"

export const metadata: Metadata = {
  title: "Your Food System Expert — EatoBiotics",
  description:
    "Speak or text with your EatoBiotics Food System Expert. Explore your plate, gut health, Biotics Score, and the foods that help you thrive.",
  openGraph: {
    title: "Your Food System Expert — EatoBiotics",
    description:
      "Understand and improve the food system inside you. Get personalised guidance on your plate, gut health, Biotics Score, and weekly food choices.",
  },
}

export default async function EatobioticPage() {
  // Text chat is free for everyone; voice is a paid-tier perk.
  let signedIn = false
  let voiceEnabled = false
  try {
    const user = await getUser()
    if (user) {
      signedIn = true
      const tier = await getUserMembershipTier(user.id)
      voiceEnabled = canAccess(tier, "ai_voice")
    }
  } catch { /* auth unavailable → treat as signed-out */ }

  return <EatobioticClient signedIn={signedIn} voiceEnabled={voiceEnabled} />
}
