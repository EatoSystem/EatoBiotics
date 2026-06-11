import type { Metadata } from "next"
import { StabilitySubnav } from "@/components/stability/StabilitySubnav"
import { StabilityReport } from "@/components/stability/StabilityReport"
import { StabilityUpsell } from "@/components/stability/StabilityUpsell"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"
import { getUser } from "@/lib/supabase-server"
import { canAccess, getUserMembershipTier, type MembershipTier } from "@/lib/membership"

export const metadata: Metadata = {
  title: "Monthly Stability Report — EatoBiotics Stability™",
  robots: { index: false, follow: false },
}

export default async function StabilityReportPage() {
  // Fail closed: if auth is unavailable, treat as free (gated) rather than erroring.
  let tier: MembershipTier = "free"
  try {
    const user = await getUser()
    if (user) tier = await getUserMembershipTier(user.id)
  } catch { /* auth unavailable → free */ }
  const unlocked = canAccess(tier, "stability_report")

  return (
    <main className="min-h-screen bg-white">
      <section className="px-5 pt-24 pb-16 md:pt-28">
        <h1 className="mb-6 text-center font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Monthly Stability Report</h1>
        <StabilitySubnav />
        <div className="mx-auto max-w-3xl">
          {unlocked ? (
            <StabilityReport />
          ) : (
            <StabilityUpsell
              title="Your Monthly Stability Report"
              description="A clinician-ready monthly summary of your stability trends, urgency and accident episodes, best and worst days, and where to focus next."
              bullets={[
                "Month-over-month stability trend with your average and direction",
                "Urgency, accident, and stool-pattern changes over time",
                "Your best and worst days, and a focus for next month",
                "Ready to bring to your GP or continence nurse",
              ]}
              feature="stability-report"
            />
          )}
        </div>
      </section>
      <MedicalDisclaimer />
    </main>
  )
}
