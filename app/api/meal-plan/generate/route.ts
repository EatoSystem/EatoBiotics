import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  void req
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform" && tier !== "restore") {
    return NextResponse.json({ error: "Restore or Transform membership required" }, { status: 403 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  // Fetch user context
  const { data: profile } = await adminSupabase.from("profiles").select("name, health_goals").eq("id", user.id).single()
  const { data: latestLead } = await adminSupabase
    .from("leads")
    .select("overall_score, sub_scores")
    .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const name = (profile?.name as string | null) ?? "Member"
  const goals = (profile?.health_goals as string[] | null)?.join(", ") ?? "general food system health"
  const score = (latestLead?.overall_score as number | null) ?? null
  const subScores = latestLead?.sub_scores as Record<string, number> | null

  const weakestPillar = subScores
    ? Object.entries({
        Feeding: subScores.feeding,
        Adding: subScores.adding,
        Diversity: subScores.diversity,
        Consistency: subScores.consistency,
        Feeling: subScores.feeling,
      })
        .filter(([, v]) => v != null)
        .reduce((a, b) => (b[1] < a[1] ? b : a))[0]
    : "Adding"

  const month = new Date().toLocaleDateString("en-IE", { month: "long", year: "numeric" })

  const prompt = `You are EatoBiotic, an expert food system consultant. Generate a personalised 7-day meal plan for ${name}.

MEMBER CONTEXT:
- Overall Biotics Score: ${score ?? "Not assessed"}/100
- Weakest pillar: ${weakestPillar} — focus meals on improving this
- Health goals: ${goals}
- Month: ${month}

THE 3 BIOTICS FRAMEWORK:
- Prebiotics (up to 45pts): garlic, onion, oats, asparagus, leek, banana, flaxseeds, apples
- Probiotics (up to 25pts): kefir, yoghurt, kimchi, sauerkraut, miso, tempeh, kombucha
- Postbiotics (up to 15pts): EVOO, dark chocolate 70%+, berries, avocado, green tea, sourdough

For each day provide: breakfast, lunch, dinner, and one snack. Include an estimated Biotics Score (0-100) for each meal.
Also provide a consolidated shopping list organised by category.

Respond ONLY with valid JSON in this exact format:
{
  "meals": [
    {
      "day": "Monday",
      "breakfast": {"name": "...", "description": "...", "score": 78},
      "lunch": {"name": "...", "description": "...", "score": 72},
      "dinner": {"name": "...", "description": "...", "score": 85},
      "snack": {"name": "...", "description": "...", "score": 65}
    }
  ],
  "shopping_list": [
    {"category": "Fermented Foods", "items": ["Natural live yoghurt (500g)", "Kefir (1 litre)"]},
    {"category": "Vegetables", "items": ["Garlic (1 bulb)", "Onions (4)", "Asparagus (1 bunch)"]},
    {"category": "Fruits", "items": ["Apples (4)", "Blueberries (200g)"]},
    {"category": "Grains", "items": ["Oats (500g)", "Sourdough bread (1 loaf)"]},
    {"category": "Protein", "items": []},
    {"category": "Pantry", "items": ["Extra-virgin olive oil", "Dark chocolate 70%+"]}
  ],
  "summary": "Brief 2-sentence summary of why this week's plan targets ${weakestPillar} and how it helps."
}`

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")

    const planData = JSON.parse(jsonMatch[0]) as {
      meals: Array<{
        day: string
        breakfast: { name: string; description: string; score: number }
        lunch: { name: string; description: string; score: number }
        dinner: { name: string; description: string; score: number }
        snack: { name: string; description: string; score: number }
      }>
      shopping_list: Array<{ category: string; items: string[] }>
      summary: string
    }

    // Calculate average score
    const allScores = planData.meals.flatMap((m) => [
      m.breakfast.score,
      m.lunch.score,
      m.dinner.score,
      m.snack.score,
    ])
    const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)

    // Get Monday of current week
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const weekStarting = monday.toISOString().slice(0, 10)

    // Save to DB (defensive — table may not exist)
    try {
      await adminSupabase
        .from("meal_plans")
        .upsert(
          {
            user_id: user.id,
            week_starting: weekStarting,
            meals: planData.meals,
            shopping_list: planData.shopping_list,
            summary: planData.summary,
            biotics_score_avg: avgScore,
          },
          { onConflict: "user_id,week_starting" }
        )
    } catch (dbErr) {
      console.error("[meal-plan/generate] DB save failed (table may not exist):", dbErr)
    }

    return NextResponse.json({ ...planData, biotics_score_avg: avgScore, week_starting: weekStarting })
  } catch (err) {
    console.error("[meal-plan/generate]", err)
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 })
  }
}
