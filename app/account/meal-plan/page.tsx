import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { MealPlanClient } from "./meal-plan-client"

export const metadata: Metadata = {
  title: "Weekly Meal Plan — EatoBiotics",
  description: "Your personalised 7-day food system meal plan with Biotics Scores.",
}

export default async function MealPlanPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform" && tier !== "restore") {
    redirect("/pricing?feature=meal-plan")
  }

  const adminSupabase = getSupabase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentPlan: any = null

  if (adminSupabase) {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const weekStarting = monday.toISOString().slice(0, 10)

    try {
      const { data } = await adminSupabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_starting", weekStarting)
        .single()
      currentPlan = data
    } catch {
      // Table may not exist yet
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <MealPlanClient initialPlan={currentPlan} membershipTier={tier} />
    </div>
  )
}
