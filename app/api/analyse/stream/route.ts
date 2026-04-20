import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

/* ── GutScan Streaming Endpoint ─────────────────────────────────────────
   Hackathon build — streaming vision analysis with extended thinking.

   Differences from /api/analyse:
   • Uses messages.stream() with extended thinking (5,000 token budget)
   • Emits SSE events in real time:
       {"type":"thinking","text":"..."}   — Claude's reasoning, streamed live
       {"type":"complete","result":{...}} — final parsed JSON result
       [DONE]                             — end of stream
   • BASE_PROMPT is in cached system field (same as /api/analyse)
   • Rate limit is shared with /api/analyse (same daily cap)
──────────────────────────────────────────────────────────────────────── */

/* ── Base analysis prompt (cached in system field) ──────────────────── */

const BASE_PROMPT = `You are a food system nutrition analyst using the EatoBiotics framework (prebiotics, probiotics, postbiotics).

Look at this meal photo carefully and identify EVERY distinct food item visible — including garnishes, seeds, dressings, sauces, and side items. Aim to identify 4–8 items typically visible in a meal photo. Don't miss small items like seeds on avocado, dressing, or herbs.

For each food, classify it as ONE of:
- prebiotic: fibrous plant foods that feed good gut bacteria (ALL vegetables, fruits, wholegrains, legumes, garlic, onion, leeks, asparagus, peas, oats, bananas, seeds like hemp/flax/chia, avocado, etc.)
- probiotic: live cultures / fermented foods (yogurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, live-culture cheese, etc.)
- postbiotic: health compounds from fermentation (aged hard cheese, sourdough bread, apple cider vinegar, certain fermented products)
- protein: meat, fish, eggs, or legumes when serving as the primary protein source

Classification notes:
- Avocado = prebiotic (excellent fibre)
- Asparagus, peas, edamame = prebiotic (high in FOSs and resistant starch)
- Seeds (hemp, flax, sesame, pumpkin, sunflower) = prebiotic
- Legumes like lentils/chickpeas = prebiotic (if a side dish) or protein (if the main protein)
- Greek yogurt = probiotic (live cultures)
- Aged cheddar/parmesan = postbiotic

Score this meal from 0–100 using this calibrated rubric for a SINGLE MEAL:

PREBIOTIC richness — up to 45 points:
  4+ different plant/fibre foods: 45 pts
  3 plant/fibre foods: 40 pts
  2 plant/fibre foods: 32 pts
  1 plant/fibre food: 20 pts
  0 plant/fibre foods: 0 pts

PROBIOTIC presence — up to 25 points:
  2+ fermented foods: 25 pts
  1 fermented food: 20 pts
  None: 10 pts (floor — single meals commonly skip fermented food)

POSTBIOTIC presence — up to 15 points:
  1+ postbiotic source: 15 pts
  None: 5 pts (floor)

PROTEIN quality for gut lining — up to 15 points:
  High-quality protein (grilled chicken, fish, eggs, legumes): 15 pts
  Some protein present: 12 pts
  No protein: 0 pts

Calibration examples:
- Grilled chicken + asparagus + avocado + mixed greens: ~70
- Salmon + kimchi + brown rice + broccoli: ~90
- Plain chicken breast only: ~27
- Full food system bowl (veg + yogurt + sourdough + chicken): ~95+

Set "prebioticStrength" to "strong" (3+ prebiotic foods), "moderate" (1–2), or "low" (0).

Nutrition calibration (typical single servings):
- Grilled chicken breast (~150g) ≈ 180 kcal, 35g protein, 0g carbs, 4g fat, 0g fibre
- Salmon fillet (~150g) ≈ 280 kcal, 34g protein, 0g carbs, 16g fat, 0g fibre
- Brown rice (1 cup cooked) ≈ 215 kcal, 5g protein, 45g carbs, 2g fat, 4g fibre
- Pasta (large bowl) ≈ 500 kcal, 14g protein, 80g carbs, 8g fat, 5g fibre
- Large mixed salad (2 cups) ≈ 30 kcal, 2g protein, 5g carbs, 0g fat, 2g fibre
- Avocado (half) ≈ 160 kcal, 2g protein, 9g carbs, 15g fat, 7g fibre
- 2 eggs ≈ 180 kcal, 12g protein, 1g carbs, 14g fat, 0g fibre
- Greek yogurt (150g) ≈ 130 kcal, 15g protein, 8g carbs, 4g fat, 0g fibre
IMPORTANT: Do NOT default to 500–600 kcal for every meal. Vary your estimate meaningfully based on visible portions.

Also calculate a "boostedScore" — what the score would be if the user added ONE item from each missing biotic category.

Return ONLY valid JSON with this exact structure, no markdown fences:
{
  "score": 70,
  "boostedScore": 85,
  "prebioticStrength": "strong|moderate|low",
  "foods": [
    { "name": "string", "emoji": "string", "biotic": "prebiotic|probiotic|postbiotic|protein", "confidence": "high|medium|low" }
  ],
  "missingBiotics": [],
  "whatThisMealDoes": "1–2 sentences on what this meal does WELL for your food system — lead with the positives",
  "suggestions": ["string", "string", "string"],
  "overallAssessment": "string (1–2 sentences, warm and practical)",
  "nutrition": {
    "calories": 520,
    "protein_g": 38,
    "carbs_g": 45,
    "fat_g": 18,
    "fibre_g": 12
  }
}

missingBiotics should list any of ["prebiotic", "probiotic", "postbiotic"] not represented in the foods.
suggestions should give 3 specific, practical additions or swaps that would naturally complement this meal.
whatThisMealDoes should always highlight what IS working — never start with a negative.

If you cannot identify the meal clearly, return exactly: {"error": "Could not identify foods in this image. Please try a clearer photo of your meal."}`

/* ── Input schema ───────────────────────────────────────────────────── */

const bodySchema = z.object({
  imageBase64: z.string().min(1).max(8_000_000),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
})

/* ── Build member context for Restore/Transform tiers ───────────────── */

async function buildContextSection(
  userId: string,
  tier: "grow" | "restore" | "transform",
  supabase: NonNullable<ReturnType<typeof getSupabase>>
): Promise<string> {
  if (tier === "grow") return ""

  const lines: string[] = ["\nMEMBER CONTEXT (personalise your analysis with this):"]

  const { data: profile } = await supabase
    .from("profiles")
    .select("health_goals, name")
    .eq("id", userId)
    .single()

  if (profile?.name) lines.push(`Member name: ${profile.name}`)
  if (profile?.health_goals?.length) {
    lines.push(`Health goals: ${(profile.health_goals as string[]).join(", ")}`)
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: recentAnalyses } = await supabase
    .from("analyses")
    .select("biotics_score, created_at")
    .eq("user_id", userId)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(30)

  if (recentAnalyses && recentAnalyses.length > 0) {
    const scores = recentAnalyses.map((a) => a.biotics_score).filter(Boolean) as number[]
    const avg = scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null
    lines.push(`Meal analyses in last 90 days: ${recentAnalyses.length}`)
    if (avg) lines.push(`Average Biotics Score (90 days): ${avg}/100`)
  }

  const { data: latestAssessment } = await supabase
    .from("leads")
    .select("sub_scores, overall_score")
    .eq("user_id", userId)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (latestAssessment) {
    lines.push(`Overall assessment score: ${latestAssessment.overall_score}/100`)
    if (latestAssessment.sub_scores) {
      const s = latestAssessment.sub_scores as Record<string, number>
      lines.push(`Pillar scores: Feeding ${s.feeding ?? "?"}, Adding ${s.adding ?? "?"}, Diversity ${s.diversity ?? "?"}, Feeling ${s.feeling ?? "?"}, Consistency ${s.consistency ?? "?"}`)
    }
  }

  if (tier === "transform") {
    const { data: checkin } = await supabase
      .from("weekly_checkins")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (checkin?.content) {
      lines.push(`Latest weekly check-in: "${checkin.content.slice(0, 300)}..."`)
    }
  }

  return lines.join("\n")
}

/* ── SSE helper ─────────────────────────────────────────────────────── */

function sseEvent(payload: Record<string, unknown> | string): string {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload)
  return `data: ${data}\n\n`
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // 1. Auth
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // 2. Tier check — Grow and above
  const tier = await getUserMembershipTier(user.id)
  if (tier === "free") {
    return NextResponse.json(
      { error: "Meal analysis requires an active Grow membership or above" },
      { status: 403 }
    )
  }

  // 3. Validate body
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const supabase = getSupabase()

  // 4. Rate limit — shared daily cap with /api/analyse
  const DAILY_LIMITS: Record<string, number> = { grow: 2, restore: 5, transform: 10 }
  const dailyLimit = DAILY_LIMITS[tier] ?? 2
  if (supabase) {
    const todayUTC = new Date()
    todayUTC.setUTCHours(0, 0, 0, 0)
    const { count } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayUTC.toISOString())

    if ((count ?? 0) >= dailyLimit) {
      const resetAt = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000).toISOString()
      return NextResponse.json(
        { error: `Daily limit reached. Your plan allows ${dailyLimit} meal analyses per day.`, resetAt },
        { status: 429 }
      )
    }
  }

  // 5. Build member context for Restore/Transform
  let contextSection = ""
  if (supabase && (tier === "restore" || tier === "transform")) {
    try {
      contextSection = await buildContextSection(user.id, tier, supabase)
    } catch (err) {
      console.error("[analyse/stream] context fetch error (non-fatal):", err)
    }
  }

  // 6. Build user message content — image + optional context
  const userContent: import("@anthropic-ai/sdk/resources").ContentBlockParam[] = [
    {
      type: "image",
      source: { type: "base64", media_type: body.mimeType, data: body.imageBase64 },
    },
  ]
  if (contextSection) {
    userContent.push({ type: "text", text: contextSection })
  }

  // 7. Stream from Claude with extended thinking
  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const emit = (payload: Record<string, unknown> | string) =>
        controller.enqueue(enc.encode(sseEvent(payload)))

      let fullText = ""

      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          thinking: { type: "enabled", budget_tokens: 5000 },
          system: [
            // BASE_PROMPT cached — saves ~750 input tokens on every call
            { type: "text", text: BASE_PROMPT, cache_control: { type: "ephemeral" } },
          ],
          messages: [{ role: "user", content: userContent }],
        })

        for await (const event of stream) {
          // Stream thinking deltas in real time
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "thinking_delta"
          ) {
            emit({ type: "thinking", text: event.delta.thinking })
          }

          // Accumulate text (the JSON result)
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text
          }
        }

        // Parse the final JSON result
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

        // Emit the complete result
        emit({ type: "complete", result: parsed })
        emit("[DONE]")
        controller.close()

        // 8. Save to analyses table (fire-and-forget, after stream closes)
        if (supabase && !parsed.error) {
          const scoreVal = typeof parsed.score === "number" ? parsed.score : null
          const foods = Array.isArray(parsed.foods) ? parsed.foods as Array<{ biotic: string }> : []

          const prebioticCount  = foods.filter((f) => f.biotic === "prebiotic").length
          const probioticCount  = foods.filter((f) => f.biotic === "probiotic").length
          const postbioticCount = foods.filter((f) => f.biotic === "postbiotic").length

          const prebioticScore  = prebioticCount >= 4 ? 45 : prebioticCount === 3 ? 40 : prebioticCount === 2 ? 32 : prebioticCount === 1 ? 20 : 0
          const probioticScore  = probioticCount >= 2 ? 25 : probioticCount === 1 ? 20 : 10
          const postbioticScore = postbioticCount >= 1 ? 15 : 5

          void supabase.from("analyses").insert({
            user_id:                  user.id,
            biotics_score:            scoreVal,
            prebiotic_score:          prebioticScore,
            probiotic_score:          probioticScore,
            postbiotic_score:         postbioticScore,
            meal_description:         (parsed.overallAssessment as string | undefined)?.slice(0, 500) ?? null,
            analysis_output:          parsed,
            tier_at_time_of_analysis: tier,
          })
        }
      } catch (err) {
        console.error("[analyse/stream] Claude error:", err)
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
