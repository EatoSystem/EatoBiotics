import type { Metadata } from "next"
import { StabilitySubnav } from "@/components/stability/StabilitySubnav"
import { StabilityInsights } from "@/components/stability/StabilityInsights"
import { StabilityUpsell } from "@/components/stability/StabilityUpsell"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"
import { getUser } from "@/lib/supabase-server"
import { canAccess, getUserMembershipTier, type MembershipTier } from "@/lib/membership"

export const metadata: Metadata = {
  title: "Stability Insights — EatoBiotics Stability™",
  robots: { index: false, follow: false },
}

export default async function StabilityInsightsPage() {
  // Fail closed: if auth is unavailable, treat as free (gated) rather than erroring.
  let tier: MembershipTier = "free"
  try {
    const user = await getUser()
    if (user) tier = await getUserMembershipTier(user.id)
  } catch { /* auth unavailable → free */ }
  const unlocked = canAccess(tier, "stability_insights")

  return (
    <main className="min-h-screen bg-white">
      <section className="px-5 pt-24 pb-16 md:pt-28">
        <h1 className="mb-6 text-center font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Stability Insights</h1>
        <StabilitySubnav />
        <div className="mx-auto max-w-2xl">
          {unlocked ? (
            <StabilityInsights />
          ) : (
            <StabilityUpsell
              title="Your Stability Insights"
              description="Pattern-spotting across your logs — what tends to settle your gut and what tends to set it off — so you can change one thing at a time with confidence."
              bullets={[
                "Personalised patterns from your daily logs",
                "What's associated with your calmer and harder days",
                "Gentle, non-diagnostic suggestions to test next",
                "Updates automatically as you keep tracking",
              ]}
              feature="stability-insights"
            />
          )}
        </div>
      </section>
      <MedicalDisclaimer />
    </main>
  )
}
