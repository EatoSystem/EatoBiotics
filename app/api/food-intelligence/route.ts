import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

/* ── Food Intelligence Streaming Endpoint ───────────────────────────────
   Hackathon build — deep pattern analysis over a user's meal history.

   • Restricted to Restore / Transform tiers
   • Fetches last 30 analyses from 90-day window (full analysis_output jsonb)
   • Pre-aggregates food frequencies, score trends, missing biotic counts
   • Calls Claude with 15,000-token extended thinking budget
   • Streams SSE events:
       {"type":"thinking","text":"..."}   — live reasoning
       {"type":"complete","result":{...}} — final parsed JSON report
       [DONE]                             — end of stream
   • Saves the report to food_intelligence_reports (fire-and-forget)

   Rate limits (shared daily cap):
     Restore:   3 / day
     Transform: 10 / day
──────────────────────────────────────────────────────────────────────── */

/* ── Static system prompt (cached) ──────────────────────────────────── */

const INTELLIGENCE_PROMPT = `You are a specialist food-pattern analyst using the EatoBiotics framework (prebiotics, probiotics, postbiotics).

You will receive a structured summary of a member's meal history — individual meals, food frequencies, score history, and averages. Your job is to reason deeply about their gut-health patterns and produce a precise, personalised Food Intelligence Report.

The EatoBiotics framework scores meals 0–100:
- Prebiotic richness (fibre-rich plant foods): up to 45 pts
- Probiotic presence (fermented foods with live cultures): up to 25 pts
- Postbiotic presence (health compounds from fermentation): up to 15 pts
- Protein quality for gut lining: up to 15 pts

Key classifications:
- Prebiotic: vegetables, fruits, legumes, wholegrains, oats, seeds, avocado, garlic, onion, leeks, asparagus, peas, bananas
- Probiotic: yogurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, live-culture cheese
- Postbiotic: sourdough bread, aged hard cheese, apple cider vinegar, certain fermented products
- Protein: meat, fish, eggs, legumes (when the primary protein source)

Your analysis must:
1. Identify REAL patterns — not generic advice. Reference specific foods that appear frequently.
2. Find the single biggest gap holding their score down.
3. Surface any hidden strengths that aren't obvious from the score alone.
4. Be warm and practical — never guilt-inducing. Frame all gaps as opportunities.
5. Give next steps that are genuinely achievable given their existing eating patterns.

Return ONLY valid JSON with this exact structure, no markdown fences:
{
  "headline": "string — 5–8 words capturing the dominant pattern, e.g. 'Strong Plant Base, Missing Fermented Consistency'",
  "overallPattern": "string — 2–3 sentences describing their dominant eating style and gut health approach",
  "gutScore": {
    "average": number,
    "trend": "improving|stable|declining",
    "trendNote": "string — specific note, e.g. 'Up 8 points over the analysis period'"
  },
  "bioticProfile": {
    "prebiotic":  { "strength": "strong|moderate|low", "note": "string — 1 specific sentence referencing their actual foods" },
    "probiotic":  { "strength": "strong|moderate|low", "note": "string — 1 specific sentence" },
    "postbiotic": { "strength": "strong|moderate|low", "note": "string — 1 specific sentence" }
  },
  "topFoods": [
    { "name": "string", "emoji": "string", "biotic": "prebiotic|probiotic|postbiotic|protein", "count": number }
  ],
  "missingFoods": [
    { "name": "string", "emoji": "string", "biotic": "prebiotic|probiotic|postbiotic", "why": "string — why this food specifically would help them" }
  ],
  "patterns": [
    { "type": "gap|strength|habit", "title": "string", "detail": "string — 1–2 sentences, specific", "priority": "high|medium|low" }
  ],
  "nutritionAverage": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fibre_g": number },
  "nextSteps": ["string", "string", "string"],
  "gutHealthFingerprint": "string — 1–2 sentences: a unique characterisation of this person's gut-health approach, warm and specific",
  "mealCount": number
}

Rules:
- topFoods: include up to 8 most-frequent foods across all meals
- missingFoods: 3 foods from the most-absent biotic categories
- patterns: 3–5 patterns (mix of gaps, strengths, and habits)
- nextSteps: 3 concrete, specific, immediately actionable steps
- All numbers must be integers
- If fewer than 3 meals are available, return: {"error": "Not enough meal data. Analyse at least 3 meals to generate your Food Intelligence Report."}`

/* ── SSE helper ─────────────────────────────────────────────────────── */

function sseEvent(payload: Record<string, unknown> | string): string {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload)
  return `data: ${data}\n\n`
}

/* ── Types ──────────────────────────────────────────────────────────── */

interface AnalysedFood {
  name: string
  emoji: string
  biotic: string
  confidence?: string
}

interface AnalysisOutput {
  score?: number
  foods?: AnalysedFood[]
  missingBiotics?: string[]
  suggestions?: string[]
  whatThisMealDoes?: string
  overallAssessment?: string
  nutrition?: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fibre_g: number
  }
  error?: string
}

interface AnalysisRow {
  biotics_score: number | null
  prebiotic_score: number | null
  probiotic_score: number | null
  postbiotic_score: number | null
  created_at: string
  analysis_output: AnalysisOutput | null
}

/* ── Pre-aggregation ─────────────────────────────────────────────────── */

function aggregateMealData(analyses: AnalysisRow[]) {
  const validAnalyses = analyses.filter(
    (a) => a.biotics_score !== null && a.analysis_output && !a.analysis_output.error
  )

  if (validAnalyses.length === 0) return null

  // Food frequency across all meals
  const foodFreq: Record<string, { count: number; biotic: string; emoji: string }> = {}
  // Missing biotic frequency
  const missingFreq = { prebiotic: 0, probiotic: 0, postbiotic: 0 }
  // Nutrition totals
  let nutritionCount = 0
  const nutritionTotal = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 }

  // Per-meal summary for Claude
  const mealSummaries: Array<{
    date: string
    score: number
    foods: Array<{ name: string; biotic: string }>
    missingBiotics: string[]
  }> = []

  for (const row of validAnalyses) {
    const output = row.analysis_output!
    const date = row.created_at.slice(0, 10)
    const score = row.biotics_score ?? 0

    // Foods
    const mealFoods: Array<{ name: string; biotic: string }> = []
    for (const food of output.foods ?? []) {
      const key = food.name.toLowerCase()
      if (!foodFreq[key]) {
        foodFreq[key] = { count: 0, biotic: food.biotic, emoji: food.emoji }
      }
      foodFreq[key].count++
      mealFoods.push({ name: food.name, biotic: food.biotic })
    }

    // Missing biotics
    const missing = output.missingBiotics ?? []
    for (const b of missing) {
      if (b === "prebiotic")  missingFreq.prebiotic++
      if (b === "probiotic")  missingFreq.probiotic++
      if (b === "postbiotic") missingFreq.postbiotic++
    }

    // Nutrition
    if (output.nutrition) {
      nutritionTotal.calories  += output.nutrition.calories
      nutritionTotal.protein_g += output.nutrition.protein_g
      nutritionTotal.carbs_g   += output.nutrition.carbs_g
      nutritionTotal.fat_g     += output.nutrition.fat_g
      nutritionTotal.fibre_g   += output.nutrition.fibre_g
      nutritionCount++
    }

    mealSummaries.push({ date, score, foods: mealFoods, missingBiotics: missing })
  }

  // Average scores
  const scores = validAnalyses.map((a) => a.biotics_score ?? 0)
  const avgScore = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)

  const avgPrebiotic  = validAnalyses.map((a) => a.prebiotic_score ?? 0)
  const avgProbiotic  = validAnalyses.map((a) => a.probiotic_score ?? 0)
  const avgPostbiotic = validAnalyses.map((a) => a.postbiotic_score ?? 0)

  const avgScores = {
    overall:   avgScore,
    prebiotic:  Math.round(avgPrebiotic.reduce((s, n) => s + n, 0)  / avgPrebiotic.length),
    probiotic:  Math.round(avgProbiotic.reduce((s, n) => s + n, 0)  / avgProbiotic.length),
    postbiotic: Math.round(avgPostbiotic.reduce((s, n) => s + n, 0) / avgPostbiotic.length),
  }

  // Score trend: compare first half vs second half
  const half = Math.floor(scores.length / 2)
  const recentAvg = half > 0 ? scores.slice(0, half).reduce((s, n) => s + n, 0) / half : avgScore
  const olderAvg  = half > 0 ? scores.slice(half).reduce((s, n) => s + n, 0) / (scores.length - half) : avgScore
  const scoreTrend: "improving" | "stable" | "declining" =
    recentAvg - olderAvg > 4 ? "improving" :
    olderAvg - recentAvg > 4 ? "declining" :
    "stable"

  // Average nutrition
  const avgNutrition = nutritionCount > 0
    ? {
        calories:  Math.round(nutritionTotal.calories  / nutritionCount),
        protein_g: Math.round(nutritionTotal.protein_g / nutritionCount),
        carbs_g:   Math.round(nutritionTotal.carbs_g   / nutritionCount),
        fat_g:     Math.round(nutritionTotal.fat_g     / nutritionCount),
        fibre_g:   Math.round(nutritionTotal.fibre_g   / nutritionCount),
      }
    : null

  // Top foods sorted by frequency
  const topFoods = Object.entries(foodFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([name, { count, biotic, emoji }]) => ({ name, count, biotic, emoji }))

  return {
    mealCount: validAnalyses.length,
    mealSummaries,
    averageScores: avgScores,
    scoreTrend,
    missingBioticFrequency: missingFreq,
    averageNutrition: avgNutrition,
    topFoods,
  }
}

/* ── Build the user message for Claude ─────────────────────────────── */

function buildUserMessage(params: {
  memberName: string | null
  healthGoals: string[]
  assessmentScore: number | null
  weeklyCheckin: string | null
  aggregated: NonNullable<ReturnType<typeof aggregateMealData>>
  tier: string
}): string {
  const { memberName, healthGoals, assessmentScore, weeklyCheckin, aggregated, tier } = params
  const lines: string[] = []

  lines.push("=== FOOD INTELLIGENCE ANALYSIS REQUEST ===")
  lines.push("")

  if (memberName) lines.push(`Member: ${memberName}`)
  if (healthGoals.length > 0) lines.push(`Health goals: ${healthGoals.join(", ")}`)
  if (assessmentScore) lines.push(`Overall EatoBiotics Assessment Score: ${assessmentScore}/100`)
  lines.push(`Membership tier: ${tier}`)
  lines.push("")

  lines.push("=== MEAL HISTORY SUMMARY ===")
  lines.push(`Total meals analysed: ${aggregated.mealCount}`)
  lines.push("")

  lines.push("Average scores:")
  lines.push(`  Overall Biotics Score: ${aggregated.averageScores.overall}/100`)
  lines.push(`  Prebiotic component:   ${aggregated.averageScores.prebiotic}/45`)
  lines.push(`  Probiotic component:   ${aggregated.averageScores.probiotic}/25`)
  lines.push(`  Postbiotic component:  ${aggregated.averageScores.postbiotic}/15`)
  lines.push(`  Score trend:           ${aggregated.scoreTrend}`)
  lines.push("")

  lines.push("Missing biotics frequency (how many meals lacked each type):")
  lines.push(`  Prebiotic absent:  ${aggregated.missingBioticFrequency.prebiotic}/${aggregated.mealCount} meals`)
  lines.push(`  Probiotic absent:  ${aggregated.missingBioticFrequency.probiotic}/${aggregated.mealCount} meals`)
  lines.push(`  Postbiotic absent: ${aggregated.missingBioticFrequency.postbiotic}/${aggregated.mealCount} meals`)
  lines.push("")

  lines.push("Most frequent foods across all meals:")
  for (const f of aggregated.topFoods) {
    lines.push(`  ${f.emoji} ${f.name} [${f.biotic}] — appeared in ${f.count} meal(s)`)
  }
  lines.push("")

  if (aggregated.averageNutrition) {
    const n = aggregated.averageNutrition
    lines.push("Average meal nutrition:")
    lines.push(`  Calories: ${n.calories} kcal | Protein: ${n.protein_g}g | Carbs: ${n.carbs_g}g | Fat: ${n.fat_g}g | Fibre: ${n.fibre_g}g`)
    lines.push("")
  }

  lines.push("=== INDIVIDUAL MEAL LOG (newest first) ===")
  for (const meal of aggregated.mealSummaries) {
    const foodList = meal.foods.map((f) => `${f.name}[${f.biotic}]`).join(", ")
    const missing  = meal.missingBiotics.length > 0 ? ` | missing: ${meal.missingBiotics.join(", ")}` : ""
    lines.push(`${meal.date} — score: ${meal.score} — ${foodList}${missing}`)
  }
  lines.push("")

  if (weeklyCheckin) {
    lines.push("=== MOST RECENT WEEKLY CHECK-IN ===")
    lines.push(weeklyCheckin.slice(0, 400))
    lines.push("")
  }

  lines.push("=== TASK ===")
  lines.push("Analyse the above meal data deeply. Find the genuine patterns — what this person eats consistently, what they consistently miss, how their scores are trending, and what single change would move the needle most. Return a complete Food Intelligence Report as specified.")

  return lines.join("\n")
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // 1. Auth
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // 2. Tier check — Restore and above only
  const tier = await getUserMembershipTier(user.id)
  if (tier === "free" || tier === "grow") {
    return NextResponse.json(
      { error: "Food Intelligence requires a Restore or Transform membership" },
      { status: 403 }
    )
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  // 3. Rate limit
  const DAILY_LIMITS: Record<string, number> = { restore: 3, transform: 10 }
  const dailyLimit = DAILY_LIMITS[tier] ?? 3
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const { count } = await supabase
    .from("food_intelligence_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayUTC.toISOString())

  if ((count ?? 0) >= dailyLimit) {
    const resetAt = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000).toISOString()
    return NextResponse.json(
      { error: `Daily limit reached. Your plan allows ${dailyLimit} Food Intelligence reports per day.`, resetAt },
      { status: 429 }
    )
  }

  // 4. Fetch data in parallel
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [profileRes, analysesRes, assessmentRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, health_goals")
      .eq("id", user.id)
      .single(),

    supabase
      .from("analyses")
      .select("biotics_score, prebiotic_score, probiotic_score, postbiotic_score, created_at, analysis_output")
      .eq("user_id", user.id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .not("biotics_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("leads")
      .select("overall_score, sub_scores")
      .eq("user_id", user.id)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ])

  // Weekly check-in for Transform members
  let weeklyCheckin: string | null = null
  if (tier === "transform") {
    const { data: checkin } = await supabase
      .from("weekly_checkins")
      .select("content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    weeklyCheckin = checkin?.content ?? null
  }

  // 5. Pre-aggregate
  const analyses = (analysesRes.data ?? []) as AnalysisRow[]
  const aggregated = aggregateMealData(analyses)

  if (!aggregated || aggregated.mealCount < 3) {
    return NextResponse.json(
      { error: "Not enough meal data. Analyse at least 3 meals to generate your Food Intelligence Report." },
      { status: 422 }
    )
  }

  // 6. Build user message
  const profile      = profileRes.data
  const assessment   = assessmentRes.data
  const memberName   = profile?.name ?? null
  const healthGoals  = (profile?.health_goals as string[] | null) ?? []
  const assessmentScore = assessment?.overall_score ?? null

  const userMessage = buildUserMessage({
    memberName,
    healthGoals,
    assessmentScore,
    weeklyCheckin,
    aggregated,
    tier,
  })

  // 7. Stream from Claude with extended thinking
  const readable = new ReadableStream({
    async start(controller) {
      const enc  = new TextEncoder()
      const emit = (payload: Record<string, unknown> | string) =>
        controller.enqueue(enc.encode(sseEvent(payload)))

      let fullText = ""

      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 12000,
          thinking: { type: "enabled", budget_tokens: 15000 },
          system: [
            { type: "text", text: INTELLIGENCE_PROMPT, cache_control: { type: "ephemeral" } },
          ],
          messages: [{ role: "user", content: userMessage }],
        })

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "thinking_delta"
          ) {
            emit({ type: "thinking", text: event.delta.thinking })
          }

          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text
          }
        }

        // Parse the JSON result
        const cleaned = fullText
          .replace(/^```(?:json)?\n?/m, "")
          .replace(/\n?```$/m, "")
          .trim()

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(cleaned) as Record<string, unknown>
        } catch {
          emit({ type: "error", message: "Analysis produced an unexpected response. Please try again." })
          emit("[DONE]")
          controller.close()
          return
        }

        if (parsed.error) {
          emit({ type: "error", message: parsed.error as string })
          emit("[DONE]")
          controller.close()
          return
        }

        // Attach mealCount to result
        parsed.mealCount = aggregated.mealCount

        emit({ type: "complete", result: parsed })
        emit("[DONE]")
        controller.close()

        // 8. Save to food_intelligence_reports (fire-and-forget)
        void supabase.from("food_intelligence_reports").insert({
          user_id:      user.id,
          report_json:  parsed,
          meal_count:   aggregated.mealCount,
          tier_at_time: tier,
        })
      } catch (err) {
        console.error("[food-intelligence] Claude error:", err)
        emit({ type: "error", message: "Analysis failed. Please try again." })
        emit("[DONE]")
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  })
}
