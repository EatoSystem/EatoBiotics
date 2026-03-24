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
  messages: z.array(messageSchema).min(1).max(50),
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
}): string {
  const { name, overallScore, subScores, recentScores } = context

  const scoreHistory = recentScores.length > 0
    ? recentScores.map((s) => `  - ${s.date}: ${s.score}/100`).join("\n")
    : "  No recent history"

  const pillarSummary = subScores
    ? Object.entries(subScores)
        .map(([k, v]) => `  - ${k.charAt(0).toUpperCase() + k.slice(1)}: ${Math.round(v)}/100`)
        .join("\n")
    : "  No pillar data available"

  return `You are the EatoBiotics Gut Health Advisor — a knowledgeable, warm, and precise gut health intelligence system built on the 3 Biotics Framework developed by Jason Curry. You are available exclusively to EatoBiotics Transform members.

The 3 Biotics Framework:
- Prebiotics: plant fibres and compounds that feed beneficial gut bacteria. Key foods: garlic, onions, oats, bananas, asparagus, leeks, chicory, Jerusalem artichoke.
- Probiotics: live cultures from fermented foods that replenish and diversify the gut microbiome. Key foods: yoghurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha.
- Postbiotics: beneficial compounds produced by gut bacteria — short-chain fatty acids, vitamins, neurotransmitters. Supported by: olive oil, dark chocolate, berries, nuts, seeds, avocado.

The 5 Pillars assessed in every EatoBiotics assessment:
- Feeding (68/100 average): fibre-rich whole foods
- Consistency (72/100 average): meal timing and rhythm
- Adding (38/100 average): fermented and live-culture foods
- Diversity (55/100 average): plant variety
- Feeling (58/100 average): how food makes you feel

Member context for this session:
- Name: ${name ?? "Member"}
- Current Biotics Score: ${overallScore != null ? `${overallScore}/100` : "Not yet taken"}
- 5-Pillar Scores:
${pillarSummary}
- Recent Score History (last 30 days):
${scoreHistory}

Use this data to personalise every response. Always ground your advice in their specific scores and patterns, not generic gut health advice.

Your tone is: knowledgeable but not clinical, warm but not casual, precise but not overwhelming. You are a trusted advisor, not a chatbot.

You do not diagnose medical conditions. If a member describes symptoms that suggest a medical issue, acknowledge their concern, offer what gut health context you can, and recommend they speak with a healthcare provider.

Always end your response with one specific, actionable next step the member can take today.`
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

  // 4. Fetch user context (scores, name)
  let memberName: string | null = null
  let overallScore: number | null = null
  let subScores: Record<string, number> | null = null
  const recentScores: Array<{ score: number; date: string }> = []

  if (adminSupabase) {
    const { data: profileData } = await adminSupabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    memberName = profileData?.name ?? null

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
  }

  // 5. Build system prompt
  const systemPrompt = buildSystemPrompt({ name: memberName, overallScore, subScores, recentScores })

  // 6. Stream from Claude
  try {
    const stream = await anthropic.messages.stream({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:     systemPrompt,
      messages:   body.messages,
    })

    // Log consultation after message completes (fire-and-forget)
    stream.on("message", (msg) => {
      const totalTokens = (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0)
      if (adminSupabase) {
        void adminSupabase.from("consultations").insert({
          user_id:       user.id,
          message_count: body.messages.length + 1,
          tokens_used:   totalTokens,
        })
      }
    })

    // Return SSE stream
    const readable = new ReadableStream({
      async start(controller) {
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
