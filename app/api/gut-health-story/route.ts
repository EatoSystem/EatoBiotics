import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

/* ── Gut Health Story Streaming Endpoint ────────────────────────────────
   Hackathon Day 7 — AI-generated personal gut health narrative.

   • Restricted to Restore / Transform tiers
   • Fetches: profile, 90-day analyses, assessment, latest intelligence report
   • Calls Claude with 8,000-token extended thinking budget
   • Streams SSE events:
       {"type":"thinking","text":"..."}      — live reasoning
       {"type":"thinking_complete"}          — transitions to writing phase
       {"type":"complete","result":{...}}    — final GutHealthStory JSON
       [DONE]
   • Saves story to profiles.food_system_story (fire-and-forget)

   Rate limits:
     Restore:   2 / day
     Transform: 5 / day
──────────────────────────────────────────────────────────────────────── */

/* ── System prompt (cached) ─────────────────────────────────────────── */

const STORY_PROMPT = `You are a personal gut health narrative writer for EatoBiotics. Your job is to take a member's real health data and write a warm, personal, five-section story about their gut health journey.

The EatoBiotics framework scores gut health across three biotic categories:
- Prebiotics: fibre-rich plant foods that feed good gut bacteria (target: strong, 3+ plant foods per meal)
- Probiotics: live fermented foods (yogurt, kefir, kimchi, sauerkraut, miso — should appear daily)
- Postbiotics: health compounds from fermentation (sourdough, aged cheese, apple cider vinegar)

Scores are 0–100. Below 50 = significant room to grow. 50–70 = emerging. 70–85 = strong. 85+ = thriving.

Your story must have EXACTLY five sections. Write each section's heading and content based on the data you receive. Stick to these section purposes:
1. Opening section: where this person started — their assessment score, what profile type that means
2. Eating patterns section: what their food data actually shows — top foods, dominant eating style, how consistent they are
3. Biotic profile section: their specific strengths and gaps across prebiotics, probiotics, and postbiotics — be specific about which foods they do and don't eat
4. Patterns section: the 2–3 most significant patterns you found — name the specific foods and numbers
5. Forward section: their next chapter — what specific changes would move them most, framed as the story continuing

Style rules:
- Write in SECOND PERSON ("you", "your") — warm, direct, personal
- Reference SPECIFIC foods by name in every section — never speak in generalities
- Use REAL NUMBERS from the data (scores, counts, frequencies)
- Be encouraging — frame gaps as exciting opportunities, never failures
- Never repeat generic advice — every sentence must be specific to THIS person
- Each section's content should be 3–5 short paragraphs, separated by \\n\\n
- Open each section with a concrete observation from their data, not a generic statement

Return ONLY valid JSON, no markdown fences, with this exact structure:
{
  "title": "string — personalised title, e.g. 'A Gut Story Worth Telling, [name]' or 'The Food Journey of [name]'",
  "subtitle": "string — e.g. 'Based on 28 meals and your gut health assessment'",
  "sections": [
    {
      "heading": "string — memorable section heading, e.g. 'Where It All Began'",
      "content": "string — 3–5 paragraphs separated by \\n\\n"
    }
  ],
  "closingThought": "string — 1–2 sentences, forward-looking, warm, specific",
  "generatedAt": "string — current ISO timestamp",
  "mealCount": number
}

If fewer than 3 meal analyses are available, return: {"error": "Not enough meal data. Analyse at least 3 meals to generate your Gut Health Story."}`

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
}

interface AnalysisOutput {
  score?: number
  foods?: AnalysedFood[]
  missingBiotics?: string[]
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

interface StoredStoryData {
  story?: Record<string, unknown>
  generatedAt?: string
  dailyCount?: number
  lastCountDate?: string
}

/* ── Light aggregation ──────────────────────────────────────────────── */

function aggregateForStory(analyses: AnalysisRow[]) {
  const valid = analyses.filter(
    (a) => a.biotics_score !== null && a.analysis_output && !a.analysis_output.error
  )
  if (valid.length === 0) return null

  const foodFreq: Record<string, { count: number; biotic: string; emoji: string }> = {}
  const missingFreq = { prebiotic: 0, probiotic: 0, postbiotic: 0 }
  let nutritionCount = 0
  const nutritionTotal = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 }

  for (const row of valid) {
    const output = row.analysis_output!
    for (const food of output.foods ?? []) {
      const key = food.name.toLowerCase()
      if (!foodFreq[key]) foodFreq[key] = { count: 0, biotic: food.biotic, emoji: food.emoji }
      foodFreq[key].count++
    }
    for (const b of output.missingBiotics ?? []) {
      if (b === "prebiotic")  missingFreq.prebiotic++
      if (b === "probiotic")  missingFreq.probiotic++
      if (b === "postbiotic") missingFreq.postbiotic++
    }
    if (output.nutrition) {
      nutritionTotal.calories  += output.nutrition.calories
      nutritionTotal.protein_g += output.nutrition.protein_g
      nutritionTotal.carbs_g   += output.nutrition.carbs_g
      nutritionTotal.fat_g     += output.nutrition.fat_g
      nutritionTotal.fibre_g   += output.nutrition.fibre_g
      nutritionCount++
    }
  }

  const scores = valid.map((a) => a.biotics_score ?? 0)
  const avgScore = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
  const avgPre  = Math.round(valid.map((a) => a.prebiotic_score  ?? 0).reduce((s, n) => s + n, 0) / valid.length)
  const avgPro  = Math.round(valid.map((a) => a.probiotic_score  ?? 0).reduce((s, n) => s + n, 0) / valid.length)
  const avgPost = Math.round(valid.map((a) => a.postbiotic_score ?? 0).reduce((s, n) => s + n, 0) / valid.length)

  const half = Math.floor(scores.length / 2)
  const recentAvg = half > 0 ? scores.slice(0, half).reduce((s, n) => s + n, 0) / half : avgScore
  const olderAvg  = half > 0 ? scores.slice(half).reduce((s, n) => s + n, 0) / (scores.length - half) : avgScore
  const trend: "improving" | "stable" | "declining" =
    recentAvg - olderAvg > 4 ? "improving" : olderAvg - recentAvg > 4 ? "declining" : "stable"

  const topFoods = Object.entries(foodFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, { count, biotic, emoji }]) => ({ name, count, biotic, emoji }))

  const avgNutrition = nutritionCount > 0
    ? {
        calories:  Math.round(nutritionTotal.calories  / nutritionCount),
        protein_g: Math.round(nutritionTotal.protein_g / nutritionCount),
        carbs_g:   Math.round(nutritionTotal.carbs_g   / nutritionCount),
        fat_g:     Math.round(nutritionTotal.fat_g     / nutritionCount),
        fibre_g:   Math.round(nutritionTotal.fibre_g   / nutritionCount),
      }
    : null

  return { mealCount: valid.length, avgScore, avgPre, avgPro, avgPost, trend, missingFreq, topFoods, avgNutrition }
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  void req

  // 1. Auth
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  // 2. Tier check — Restore and above only
  const tier = await getUserMembershipTier(user.id)
  if (tier === "free" || tier === "grow") {
    return NextResponse.json(
      { error: "Gut Health Story requires a Restore or Transform membership" },
      { status: 403 }
    )
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

  // 3. Rate limit — read from profiles.food_system_story
  const DAILY_LIMITS: Record<string, number> = { restore: 2, transform: 5 }
  const dailyLimit = DAILY_LIMITS[tier] ?? 2
  const todayStr = new Date().toISOString().slice(0, 10)

  const { data: profileForLimit } = await supabase
    .from("profiles")
    .select("food_system_story")
    .eq("id", user.id)
    .single()

  const existingData = (profileForLimit?.food_system_story as StoredStoryData | null) ?? {}
  const isSameDay    = existingData.lastCountDate === todayStr
  const dailyCount   = isSameDay ? (existingData.dailyCount ?? 0) : 0

  if (dailyCount >= dailyLimit) {
    return NextResponse.json(
      { error: `Daily limit reached. Your plan allows ${dailyLimit} story generation${dailyLimit > 1 ? "s" : ""} per day.` },
      { status: 429 }
    )
  }

  // 4. Fetch data in parallel
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [profileRes, analysesRes, assessmentRes, intelligenceRes] = await Promise.all([
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
      .select("overall_score, profile_type, sub_scores")
      .eq("user_id", user.id)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from("food_intelligence_reports")
      .select("report_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ])

  // Transform: fetch latest weekly check-in
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
  const analyses    = (analysesRes.data ?? []) as AnalysisRow[]
  const aggregated  = aggregateForStory(analyses)

  if (!aggregated || aggregated.mealCount < 3) {
    return NextResponse.json(
      { error: "Not enough meal data. Analyse at least 3 meals to generate your Gut Health Story." },
      { status: 422 }
    )
  }

  // 6. Build user message
  const profile     = profileRes.data
  const assessment  = assessmentRes.data
  const intel       = intelligenceRes.data?.report_json as Record<string, unknown> | null
  const memberName  = (profile?.name as string | null) ?? null
  const healthGoals = (profile?.health_goals as string[] | null) ?? []

  const lines: string[] = []
  lines.push("=== GUT HEALTH STORY REQUEST ===")
  lines.push("")
  if (memberName) lines.push(`Member name: ${memberName}`)
  if (healthGoals.length > 0) lines.push(`Health goals: ${healthGoals.join(", ")}`)
  lines.push(`Membership tier: ${tier}`)
  lines.push("")

  lines.push("=== ASSESSMENT ===")
  if (assessment) {
    lines.push(`Overall EatoBiotics Score: ${assessment.overall_score}/100`)
    lines.push(`Profile type: ${assessment.profile_type ?? "unknown"}`)
    if (assessment.sub_scores) {
      const s = assessment.sub_scores as Record<string, number>
      lines.push(`Pillar scores: Feeding ${s.feeding ?? "?"}, Adding ${s.adding ?? "?"}, Diversity ${s.diversity ?? "?"}, Feeling ${s.feeling ?? "?"}, Consistency ${s.consistency ?? "?"}`)
    }
  } else {
    lines.push("No formal assessment completed yet")
  }
  lines.push("")

  lines.push("=== MEAL DATA SUMMARY ===")
  lines.push(`Total meals analysed: ${aggregated.mealCount} (90-day window)`)
  lines.push(`Average Biotics Score: ${aggregated.avgScore}/100`)
  lines.push(`Average Prebiotic component: ${aggregated.avgPre}/45`)
  lines.push(`Average Probiotic component: ${aggregated.avgPro}/25`)
  lines.push(`Average Postbiotic component: ${aggregated.avgPost}/15`)
  lines.push(`Score trend: ${aggregated.trend}`)
  lines.push("")

  lines.push("Missing biotics frequency:")
  lines.push(`  Prebiotic absent: ${aggregated.missingFreq.prebiotic}/${aggregated.mealCount} meals`)
  lines.push(`  Probiotic absent: ${aggregated.missingFreq.probiotic}/${aggregated.mealCount} meals`)
  lines.push(`  Postbiotic absent: ${aggregated.missingFreq.postbiotic}/${aggregated.mealCount} meals`)
  lines.push("")

  lines.push("Most frequent foods:")
  for (const f of aggregated.topFoods) {
    lines.push(`  ${f.emoji} ${f.name} [${f.biotic}] — appeared in ${f.count} meal(s)`)
  }
  lines.push("")

  if (aggregated.avgNutrition) {
    const n = aggregated.avgNutrition
    lines.push(`Average meal nutrition: ${n.calories} kcal | Protein: ${n.protein_g}g | Carbs: ${n.carbs_g}g | Fat: ${n.fat_g}g | Fibre: ${n.fibre_g}g`)
    lines.push("")
  }

  if (intel) {
    lines.push("=== FOOD INTELLIGENCE REPORT CONTEXT ===")
    if (intel.headline)         lines.push(`Headline: ${intel.headline}`)
    if (intel.gutHealthFingerprint) lines.push(`Gut fingerprint: ${intel.gutHealthFingerprint}`)
    if (intel.overallPattern)   lines.push(`Pattern summary: ${intel.overallPattern}`)
    lines.push("")
  }

  if (weeklyCheckin) {
    lines.push("=== LATEST WEEKLY CHECK-IN ===")
    lines.push(weeklyCheckin.slice(0, 400))
    lines.push("")
  }

  lines.push("=== TASK ===")
  lines.push("Write a personal, warm, engaging Gut Health Story for this member. Make it specific to their data — reference their actual foods, their actual scores, their actual trends. This should feel like someone who really knows them wrote it.")

  const userMessage = lines.join("\n")

  // 7. Stream from Claude
  const readable = new ReadableStream({
    async start(controller) {
      const enc  = new TextEncoder()
      const emit = (payload: Record<string, unknown> | string) =>
        controller.enqueue(enc.encode(sseEvent(payload)))

      let fullText        = ""
      let thinkingComplete = false

      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 6000,
          thinking: { type: "enabled", budget_tokens: 8000 },
          system: [
            { type: "text", text: STORY_PROMPT, cache_control: { type: "ephemeral" } },
          ],
          messages: [{ role: "user", content: userMessage }],
        })

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "thinking_delta") {
            emit({ type: "thinking", text: event.delta.thinking })
          }
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            if (!thinkingComplete) {
              emit({ type: "thinking_complete" })
              thinkingComplete = true
            }
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
          emit({ type: "error", message: "Story generation produced an unexpected response. Please try again." })
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

        // Stamp with current time and meal count
        parsed.generatedAt = new Date().toISOString()
        parsed.mealCount   = aggregated.mealCount

        emit({ type: "complete", result: parsed })
        emit("[DONE]")
        controller.close()

        // 8. Save to profiles.food_system_story (fire-and-forget)
        void supabase.from("profiles").update({
          food_system_story: {
            story:          parsed,
            generatedAt:    parsed.generatedAt,
            dailyCount:     dailyCount + 1,
            lastCountDate:  todayStr,
          },
        }).eq("id", user.id)

      } catch (err) {
        console.error("[gut-health-story] Claude error:", err)
        emit({ type: "error", message: "Story generation failed. Please try again." })
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
