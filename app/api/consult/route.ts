import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

/* ── Validation ─────────────────────────────────────────────────────── */

const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
})

const bodySchema = z.object({
  messages:  z.array(messageSchema).min(1).max(40),
  sessionId: z.string().uuid().optional(),
})

/* ── Anthropic client ───────────────────────────────────────────────── */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/* ── System prompt (server-side only — never sent to client) ────────── */

function buildSystemPrompt(context: {
  name: string | null
  overallScore: number | null
  subScores: Record<string, number> | null
  recentScores: Array<{ score: number; date: string }>
  healthGoals: string[]
  weeklyCheckinSummary: string | null
}): string {
  const { name, overallScore, subScores, recentScores, healthGoals, weeklyCheckinSummary } = context

  const scoreHistory = recentScores.length > 0
    ? recentScores.map((s) => `  - ${s.date}: ${s.score}/100`).join("\n")
    : "  No recent history"

  const pillarSummary = subScores
    ? Object.entries(subScores)
        .map(([k, v]) => `  - ${k.charAt(0).toUpperCase() + k.slice(1)}: ${Math.round(v)}/100`)
        .join("\n")
    : "  No pillar data available"

  const goalsSummary = healthGoals.length > 0
    ? healthGoals.join(", ")
    : "Not yet set"

  const checkinSection = weeklyCheckinSummary
    ? `\n- Most recent weekly check-in: "${weeklyCheckinSummary.slice(0, 400)}"`
    : ""

  // Identify weakest and strongest pillars for personalised guidance
  let weakestPillar = ""
  let strongestPillar = ""
  if (subScores) {
    const pillarMap = { Feeding: subScores.feeding, Adding: subScores.adding, Diversity: subScores.diversity, Consistency: subScores.consistency, Feeling: subScores.feeling }
    const entries = Object.entries(pillarMap).filter(([, v]) => v != null) as [string, number][]
    if (entries.length > 0) {
      weakestPillar  = entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0]
      strongestPillar = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    }
  }

  return `You are the EatoBiotics Gut Health Advisor — the world's most knowledgeable guide on prebiotics, probiotics, postbiotics, gut microbiome science, and food-based health optimisation. You combine cutting-edge microbiome research, nutritional biochemistry, and deep practical food knowledge to help each member build a genuinely healthier gut through what they eat. You are warm, precise, and always specific. You never give vague advice. You are available exclusively to EatoBiotics Transform members.

THE 3 BIOTICS FRAMEWORK (developed by Jason Curry):
Prebiotics — plant fibres and compounds that feed beneficial gut bacteria (up to 45 pts in meal scoring):
  Key foods: garlic, onion, leek, asparagus, Jerusalem artichoke, chicory root, oats, barley, slightly-underripe bananas, flaxseeds, apples, dandelion greens, psyllium husk
  Mechanism: inulin, FOS, and other non-digestible fibres selectively feed Bifidobacterium and Lactobacillus species

Probiotics — live cultures from fermented foods that replenish and diversify the microbiome (up to 25 pts):
  Key foods: natural live yoghurt, kefir (dairy or water), kimchi, sauerkraut, miso, tempeh, natto, kombucha, aged cheese (cheddar, gouda, parmesan), lassi, filmjölk
  Mechanism: introduce viable bacteria strains that temporarily colonise and competitively exclude pathogens

Postbiotics — beneficial compounds produced when gut bacteria ferment prebiotics (up to 15 pts):
  Key foods: extra-virgin olive oil, dark chocolate (70%+), berries (all types), nuts and seeds, avocado, green tea, sourdough bread, polyphenol-rich plants, aged/fermented dairy
  Mechanism: short-chain fatty acids (butyrate, propionate, acetate), bacteriocins, vitamins B12/K2, serotonin precursors

THE BIOTICS SCORING RUBRIC (used for every meal 0–100):
• Prebiotic richness — up to 45 pts: 4+ different plant/fibre foods=45 | 3=40 | 2=32 | 1=20 | 0=0
• Probiotic presence — up to 25 pts: 2+ fermented foods=25 | 1=20 | none=10
• Postbiotic support — up to 15 pts: 1+ postbiotic source=15 | none=5
• Protein quality — up to 15 pts: high-quality protein=15 | some=12 | none=0
Max possible: 100. A score of 70+ is excellent. 50–69 is solid. Below 50 needs attention.

THE 5 PILLARS:
• Feeding (fibre-rich whole foods that nourish gut bacteria)
• Adding (fermented and live-culture foods)
• Diversity (plant variety — aim for 30 different plants per week)
• Feeling (energy, digestion, bloating, mood signals from food)
• Consistency (meal timing and daily eating rhythm)

CONDITION-SPECIFIC EXPERTISE:
You have deep knowledge of how to adapt eating for gut conditions:
• IBS (IBS-C and IBS-D): low-FODMAP phasing (garlic oil instead of raw garlic, green tips of leeks only, firm banana not ripe), reintroduction protocols, stress-gut axis
• SIBO (Small Intestinal Bacterial Overgrowth): lower-fermentation prebiotics first, phased probiotic introduction, avoid large doses of FOS
• IBD (Crohn's, Ulcerative Colitis): anti-inflammatory omega-3 foods, soluble fibre during flares, exclusion phases, l-glutamine support foods
• Leaky gut / intestinal permeability: zinc-rich foods, collagen broth, bone broth, glutamine foods, avoiding gluten/casein triggers
• Candida overgrowth: anti-fungal strategy (garlic, coconut oil, ACV), limiting simple sugars, rebuilding beneficial bacteria
• Histamine intolerance: low-histamine fermented alternatives (fresh yoghurt over aged cheese, water kefir over dairy kefir), DAO-supporting foods
Always recommend working with a gastroenterologist for active conditions while providing the food intelligence that specialists often don't have time to give.

RECIPE AND MEAL DESIGN:
When asked to design a meal, recipe, or eating plan:
• Design for the highest possible Biotics Score using the rubric above
• State the estimated Biotics Score for every meal you recommend, broken down by component
• Explain which foods contribute to which biotic category
• Suggest easy swaps that would increase the score further
• Be specific: exact ingredients, quantities, and preparation methods
• Example: "1 tablespoon of kimchi" not "some kimchi" — precision matters

THIS MEMBER'S PROFILE:
Name: ${name ?? "Member"}
Overall Biotics Score: ${overallScore != null ? `${overallScore}/100` : "Not yet assessed"}
5-Pillar Scores:
${pillarSummary}
${weakestPillar ? `Their weakest pillar is ${weakestPillar} — focus advice here first.` : ""}
${strongestPillar ? `Their strongest pillar is ${strongestPillar} — build on this strength.` : ""}
Recent Score History (last 30 days):
${scoreHistory}
Health goals: ${goalsSummary}${checkinSection}

PERSONALISATION RULES:
• If their Adding (fermented foods) score is low: prioritise fermented food suggestions in every response
• If their Diversity score is low: emphasise plant variety and the "30 plants per week" target
• If their Feeding score is low: focus on fibre-rich whole food swaps
• If their Feeling score is low: ask about specific symptoms before giving broad advice
• If their Consistency score is low: suggest meal timing strategies and habit anchoring
• Always reference their actual numbers: "Your Adding score of 38 tells me..." not generic advice
• Never give advice that ignores their data

YOUR TONE: Knowledgeable but not clinical. Warm but not casual. Precise but never overwhelming. Like a brilliant friend who happens to be a world expert in gut health — they speak plainly, give real answers, and always leave you with something specific you can do.

RESPONSE FORMAT:
• Be thorough but scannable — use short paragraphs, not walls of text
• When recommending meals, always include the estimated Biotics Score
• Cite mechanisms briefly when relevant: "Garlic contains inulin, a prebiotic fibre that selectively feeds Bifidobacterium"
• Be specific with quantities: "1 tablespoon" not "some"
• Medical conditions: acknowledge, give food context, always recommend a healthcare provider for diagnosis/treatment

Always end every response with one specific, immediately actionable step the member can take today — formatted as:
Your next step: [one clear, specific, and personalised action]`
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // 2. Check Transform membership
  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") {
    return NextResponse.json(
      { error: "AI consultation requires an active Transform membership" },
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

  const adminSupabase = getSupabase()

  // 4. Usage limit checks
  if (adminSupabase) {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    // 4a. Daily limit: 2 consultations per day
    const { count: dailyCount } = await adminSupabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("date", today)

    if ((dailyCount ?? 0) >= 2) {
      // Reset at midnight UTC
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      tomorrow.setUTCHours(0, 0, 0, 0)
      return NextResponse.json(
        {
          error: "Daily limit reached",
          message: "You've had 2 consultations today — your daily limit. Your limit resets at midnight.",
          resetAt: tomorrow.toISOString(),
        },
        { status: 429 }
      )
    }

    // 4b. Monthly limit: 60 consultations per month
    const firstOfMonth = new Date()
    firstOfMonth.setUTCDate(1)
    firstOfMonth.setUTCHours(0, 0, 0, 0)

    const { count: monthlyCount } = await adminSupabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", firstOfMonth.toISOString().slice(0, 10))

    if ((monthlyCount ?? 0) >= 60) {
      const firstOfNextMonth = new Date(firstOfMonth)
      firstOfNextMonth.setUTCMonth(firstOfNextMonth.getUTCMonth() + 1)
      return NextResponse.json(
        {
          error: "Monthly limit reached",
          message: `You've reached your 60 consultation limit for this month. Your limit resets on ${firstOfNextMonth.toLocaleDateString("en-IE", { day: "numeric", month: "long" })}.`,
          resetAt: firstOfNextMonth.toISOString(),
        },
        { status: 429 }
      )
    }
  }

  // 5. Session turn limit (20 turns)
  const sessionId = body.sessionId ?? crypto.randomUUID()
  let existingSessionRow: { id: string; turn_count: number } | null = null

  if (adminSupabase && body.sessionId) {
    const { data } = await adminSupabase
      .from("consultations")
      .select("id, turn_count")
      .eq("session_id", body.sessionId)
      .eq("user_id", user.id)
      .single()
    existingSessionRow = data as { id: string; turn_count: number } | null
  }

  const currentTurnCount = existingSessionRow?.turn_count ?? 0

  // At turn 20: generate summary and close session
  if (currentTurnCount >= 20) {
    if (adminSupabase && existingSessionRow) {
      // Generate summary
      try {
        const summaryMsg = await anthropic.messages.create({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [
            ...body.messages,
            {
              role: "user",
              content: "Please summarise this consultation in 3-4 sentences: the main health question discussed, the key advice given, and the most important next step recommended.",
            },
          ],
        })
        const summary = summaryMsg.content[0].type === "text" ? summaryMsg.content[0].text : ""
        void adminSupabase
          .from("consultations")
          .update({ summary, ended_at: new Date().toISOString() })
          .eq("id", existingSessionRow.id)

        return NextResponse.json(
          { error: "session_limit_reached", summary },
          { status: 400 }
        )
      } catch {
        return NextResponse.json(
          { error: "session_limit_reached", summary: "This session has reached its 20-turn limit." },
          { status: 400 }
        )
      }
    }
    return NextResponse.json(
      { error: "session_limit_reached", summary: "This session has reached its 20-turn limit." },
      { status: 400 }
    )
  }

  // 6. Fetch user context (scores, name, goals, check-in)
  let memberName: string | null = null
  let overallScore: number | null = null
  let subScores: Record<string, number> | null = null
  const recentScores: Array<{ score: number; date: string }> = []
  let healthGoals: string[] = []
  let weeklyCheckinSummary: string | null = null

  if (adminSupabase) {
    const { data: profileData } = await adminSupabase
      .from("profiles")
      .select("name, health_goals")
      .eq("id", user.id)
      .single()
    memberName  = profileData?.name ?? null
    healthGoals = (profileData?.health_goals as string[] | null) ?? []

    // Latest assessment scores
    const { data: latestAssessment } = await adminSupabase
      .from("leads")
      .select("overall_score, sub_scores, created_at")
      .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (latestAssessment) {
      overallScore = latestAssessment.overall_score
      subScores    = latestAssessment.sub_scores as Record<string, number> | null
    }

    // Last 30 days score history
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: historyData } = await adminSupabase
      .from("leads")
      .select("overall_score, created_at")
      .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
      .not("overall_score", "is", null)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    for (const row of historyData ?? []) {
      recentScores.push({
        score: row.overall_score as number,
        date:  new Date(row.created_at as string).toLocaleDateString("en-IE"),
      })
    }

    // Most recent weekly check-in
    const { data: checkin } = await adminSupabase
      .from("weekly_checkins")
      .select("content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    weeklyCheckinSummary = checkin?.content ?? null
  }

  // 7. Build system prompt
  const systemPrompt = buildSystemPrompt({
    name: memberName,
    overallScore,
    subScores,
    recentScores,
    healthGoals,
    weeklyCheckinSummary,
  })

  // 8. Upsert consultation session row
  if (adminSupabase) {
    if (!existingSessionRow) {
      // New session — create row
      void adminSupabase.from("consultations").insert({
        user_id:    user.id,
        session_id: sessionId,
        turn_count: 0,
        date:       new Date().toISOString().slice(0, 10),
        tokens_used: 0,
        message_count: 0,
      })
    }
  }

  // 9. Stream from Claude
  try {
    const stream = await anthropic.messages.stream({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:     systemPrompt,
      messages:   body.messages,
    })

    // After stream completes: increment turn_count, log tokens
    stream.on("message", (msg) => {
      const totalTokens = (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0)
      if (adminSupabase) {
        if (existingSessionRow) {
          void adminSupabase
            .from("consultations")
            .update({
              turn_count:    currentTurnCount + 1,
              tokens_used:   totalTokens,
              message_count: body.messages.length + 1,
            })
            .eq("id", existingSessionRow.id)
        }
        // For new sessions, the insert above will be updated on next turn
      }
    })

    // Return SSE stream — include sessionId in first event
    const readable = new ReadableStream({
      async start(controller) {
        // Send session ID first so client can track it
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ sessionId, turnCount: currentTurnCount + 1 })}\n\n`)
        )
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive",
      },
    })
  } catch (err) {
    console.error("[consult]", err)
    return NextResponse.json({ error: "Consultation unavailable" }, { status: 500 })
  }
}
