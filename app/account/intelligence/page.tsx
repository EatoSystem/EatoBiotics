import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getUser } from "@/lib/supabase-server"
import { getUserMembershipTier } from "@/lib/membership"
import { IntelligenceClient } from "./intelligence-client"

export const metadata: Metadata = {
  title: "Food Intelligence | EatoBiotics",
  description: "Deep pattern analysis of your gut-health eating habits, powered by Claude AI.",
}

export default async function IntelligencePage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)

  if (tier === "free" || tier === "grow") {
    redirect("/pricing?feature=food-intelligence")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--icon-teal)" }}>
            Food Intelligence
          </p>
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
            Your gut-health pattern report
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Claude analyses your last 90 days of meal data with extended reasoning to surface the real patterns in your eating — strengths, gaps, and exactly what to shift.
          </p>
        </div>

        <IntelligenceClient tier={tier} />
      </div>
    </div>
  )
}
