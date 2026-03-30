import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface StoryData {
  narrative?: string
  chapters?: Array<{ month: string; summary: string; scoreStart: number | null; scoreEnd: number | null }>
  lastUpdated?: string
}

export async function POST(req: NextRequest) {
  void req
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") return NextResponse.json({ error: "Transform required" }, { status: 403 })

  const adminSupabase = getSupabase()
  if (!adminSupabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("name, health_goals, food_system_story, membership_started_at")
    .eq("id", user.id)
    .single()

  const existingStory = (profile?.food_system_story as StoryData | null) ?? {
    narrative: "",
    chapters: [],
  }

  // Get all monthly reviews
  const { data: reviews } = await adminSupabase
    .from("monthly_reviews")
    .select("month, content, score_start, score_end")
    .eq("user_id", user.id)
    .order("month", { ascending: true })

  // Get all weekly checkins (last 3 for recent context)
  const { data: checkins } = await adminSupabase
    .from("weekly_checkins")
    .select("content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  const { data: latestAssessment } = await adminSupabase
    .from("leads")
    .select("overall_score")
    .or(`user_id.eq.${user.id}`)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const name = (profile?.name as string | null) ?? "Member"
  const currentScore = (latestAssessment?.overall_score as number | null) ?? null
  const startedAt = profile?.membership_started_at
    ? new Date(profile.membership_started_at as string).toLocaleDateString("en-IE", {
        month: "long",
        year: "numeric",
      })
    : "recently"

  const reviewsContext = (reviews ?? [])
    .map(
      (r) =>
        `${new Date(r.month as string).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}: Score ${r.score_start ?? "?"} → ${r.score_end ?? "?"}\n${(r.content as string).slice(0, 300)}`
    )
    .join("\n\n")

  const prompt = `You are EatoBiotic writing ${name}'s living Food System Story — a personal health narrative that captures their journey with the EatoBiotics platform.

MEMBER JOURNEY:
- Started: ${startedAt}
- Current Biotics Score: ${currentScore ?? "N/A"}/100
- Health goals: ${((profile?.health_goals as string[] | null) ?? []).join(", ") || "food system health"}

MONTHLY REVIEWS:
${reviewsContext || "No monthly reviews yet — write a brief opening chapter."}

RECENT CONTEXT:
${(checkins ?? []).map((c) => (c.content as string).slice(0, 150)).join("\n") || "No recent check-ins."}

EXISTING STORY (if any):
${existingStory.narrative ? existingStory.narrative.slice(0, 500) : "This is the first entry — start the story from the beginning."}

Write a personal, warm, first-person-adjacent narrative (about ${name}, not TO them) in 500-600 words. This is a living document — it should read like a health biography chapter. Be specific with scores and dates. Show the arc: where they started, what changed, what they discovered, where they are now. End with a forward-looking sentence about what's next.

This is not a clinical report. It's a personal story about their food system journey. Make it meaningful.`

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    })
    const narrative = response.content[0].type === "text" ? response.content[0].text : ""

    const month = new Date().toISOString().slice(0, 7)
    const latestReview = (reviews ?? [])[(reviews?.length ?? 0) - 1]
    const newChapter = {
      month,
      summary: narrative.slice(0, 200),
      scoreStart: (latestReview?.score_start as number | null) ?? null,
      scoreEnd: currentScore,
    }

    const updatedStory: StoryData = {
      narrative,
      lastUpdated: new Date().toISOString(),
      chapters: [
        ...(existingStory.chapters ?? []).filter((c) => c.month !== month),
        newChapter,
      ],
    }

    try {
      await adminSupabase
        .from("profiles")
        .update({ food_system_story: updatedStory })
        .eq("id", user.id)
    } catch (dbErr) {
      console.error("[food-system-story] DB update failed:", dbErr)
    }

    return NextResponse.json({ narrative, lastUpdated: updatedStory.lastUpdated })
  } catch (err) {
    console.error("[food-system-story]", err)
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
  }
}
