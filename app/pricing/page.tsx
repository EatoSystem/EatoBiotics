import type { Metadata } from "next"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { PricingClient } from "./pricing-client"

export const metadata: Metadata = {
  title: "Plans & Pricing — EatoBiotics",
  description:
    "Choose your EatoBiotics plan. From free gut health scoring to full AI meal analysis, weekly reports, and personalised gut coaching. Plans from €9.99/month.",
  openGraph: {
    title: "Plans & Pricing — EatoBiotics",
    description: "From free gut health scoring to full AI meal analysis, weekly reports, and personalised gut coaching.",
    url: "https://eatobiotics.com/pricing",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "EatoBiotics Plans" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plans & Pricing — EatoBiotics",
    description: "From free gut health scoring to full AI meal analysis and personalised weekly reports.",
    images: ["/og-image.png"],
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
