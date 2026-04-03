import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { MonthlyReviewClient } from "./monthly-review-client"

export const metadata: Metadata = {
  title: "Monthly Review — EatoBiotics",
  description: "Your monthly food system reflection and progress summary.",
}

export default async function MonthlyReviewPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") redirect("/pricing?feature=monthly-review")

  const adminSupabase = getSupabase()
  let reviews: Array<{
    id: string
    month: string
    content: string | null
    score_start: number | null
    score_end: number | null
    created_at: string
  }> = []

  if (adminSupabase) {
    try {
      const { data } = await adminSupabase
        .from("monthly_reviews")
        .select("id, month, content, score_start, score_end, created_at")
        .eq("user_id", user.id)
        .order("month", { ascending: false })
        .limit(6)
      reviews = data ?? []
    } catch {
      // Table may not exist yet
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <MonthlyReviewClient reviews={reviews} />
    </div>
  )
}
