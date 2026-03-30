import type { Metadata } from "next"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { PricingClient } from "./pricing-client"

export const metadata: Metadata = {
  title: "Membership Plans — EatoBiotics",
  description: "Choose the EatoBiotics membership that fits your food system journey.",
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>
}) {
  const params = await searchParams
  const highlightFeature = params.feature ?? null

  const user = await getUser()

  let currentTier: "free" | "grow" | "restore" | "transform" = "free"
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
        growPriceId={process.env.NEXT_PUBLIC_STRIPE_GROW_PRICE_ID ?? ""}
        restorePriceId={process.env.NEXT_PUBLIC_STRIPE_RESTORE_PRICE_ID ?? ""}
        transformPriceId={process.env.NEXT_PUBLIC_STRIPE_TRANSFORM_PRICE_ID ?? ""}
      />
    </div>
  )
}
