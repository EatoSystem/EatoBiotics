import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { GoalsClient } from "./goals-client"

export const metadata: Metadata = {
  title: "Health Goals — EatoBiotics",
  description: "Set your health goals to personalise your meal analysis and AI consultation.",
}

export default async function GoalsPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "restore" && tier !== "transform") {
    redirect("/pricing?feature=condition_calibration")
  }

  const supabase = getSupabase()
  let currentGoals: string[] = []

  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("health_goals")
      .eq("id", user.id)
      .single()
    currentGoals = (data?.health_goals as string[] | null) ?? []
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <GoalsClient initialGoals={currentGoals} />
      </div>
    </div>
  )
}
