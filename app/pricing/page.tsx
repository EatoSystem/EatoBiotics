import type { Metadata } from "next"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { PricingClient } from "./pricing-client"
import type { MembershipTier } from "@/lib/membership"
import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"
import { REPORT_PRICE_EUR } from "@/lib/report/offer"

export const metadata: Metadata = {
  title: "Plans & Pricing — EatoBiotics",
  description:
    `Your Food System Assessment is free. The Personal Food System Consultation is €${REPORT_PRICE_EUR} one-time and produces your Personal Food System Report. EatoBiotics Member is €${MEMBER_PRICE_EUR}/month.`,
  openGraph: {
    title: "Plans & Pricing — EatoBiotics",
    description: `Free Food System Assessment, a €${REPORT_PRICE_EUR} Personal Food System Consultation, and EatoBiotics Member at €${MEMBER_PRICE_EUR}/month.`,
    url: "https://eatobiotics.com/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plans & Pricing — EatoBiotics",
    description: `Free Food System Assessment, a €${REPORT_PRICE_EUR} Personal Food System Consultation, and EatoBiotics Member at €${MEMBER_PRICE_EUR}/month.`,
  },
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>
}) {
  const params = await searchParams
  const highlightFeature = params.feature ?? null

  const user = await getUser()

  let currentTier: MembershipTier = "free"
  let currentStatus: string = "inactive"
  let isFoundingMember = false

  if (user) {
    const adminSupabase = getSupabase()
    if (adminSupabase) {
      const { data } = await adminSupabase
        .from("profiles")
        .select("membership_tier, membership_status, is_founding_member")
        .eq("id", user.id)
        .single()

      if (data) {
        currentTier   = (data.membership_tier   as typeof currentTier)   ?? "free"
        currentStatus = (data.membership_status as string)               ?? "inactive"
        isFoundingMember = data.is_founding_member ?? false
      }
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <PricingClient
        isLoggedIn={!!user}
        currentTier={currentTier}
        currentStatus={currentStatus}
        isFoundingMember={isFoundingMember}
        highlightFeature={highlightFeature}
      />
    </div>
  )
}
