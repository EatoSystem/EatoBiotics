import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { StoryClient } from "./story-client"

export const metadata: Metadata = {
  title: "Your Food System Story — EatoBiotics",
  description:
    "Your living food system health narrative — where you started, how you've grown, where you're going.",
}

export default async function StoryPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")
  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") redirect("/pricing?feature=story")

  const adminSupabase = getSupabase()
  let storyData: {
    narrative: string
    lastUpdated: string
    chapters: Array<{
      month: string
      summary: string
      scoreStart: number | null
      scoreEnd: number | null
    }>
  } | null = null
  let currentScore: number | null = null
  let memberName: string | null = null
  let memberSince: string | null = null

  if (adminSupabase) {
    const { data: p } = await adminSupabase
      .from("profiles")
      .select("name, food_system_story, membership_started_at")
      .eq("id", user.id)
      .single()

    storyData = (p?.food_system_story as typeof storyData) ?? null
    memberName = (p?.name as string | null) ?? null
    memberSince = (p?.membership_started_at as string | null) ?? null

    const { data: la } = await adminSupabase
      .from("leads")
      .select("overall_score")
      .or(`user_id.eq.${user.id}`)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    currentScore = (la?.overall_score as number | null) ?? null
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <StoryClient
        story={storyData}
        currentScore={currentScore}
        memberName={memberName}
        memberSince={memberSince}
      />
    </div>
  )
}
