import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { guardAiUsage } from "@/lib/ai-guard"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { computeReport } from "@/lib/stability/insights"
import type { StabilityDailyLog } from "@/lib/stability/types"

/* ── /api/eatobiotic ─────────────────────────────────────────────────────
   Public, free text chat with the EatoBiotics Food System Expert. Works for
   anonymous visitors (IP-rate-limited) and signed-in members (per-user daily
   cap + personalised context). Streams Server-Sent Events, mirroring the
   Transform /api/consult route but simpler and open to everyone.
──────────────────────────────────────────────────────────────────────── */

const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
})

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(24),
})

const STATIC_KNOWLEDGE = `You are EatoBiotic — the EatoBiotics Food System Expert. You help anyone understand and improve the food system inside them through prebiotics, probiotics, postbiotics, and everyday food choices. You are warm, precise, and always specific — never vague. You speak plainly, like a brilliant friend who happens to be a world expert in gut and food-system health. This is a free, public conversation open to everyone.

THE 3 BIOTICS FRAMEWORK (developed by Jason Curry):
- Prebiotics — plant fibres that feed beneficial gut bacteria. Foods: garlic, onion, leek, asparagus, Jerusalem artichoke, oats, barley, slightly-underripe banana, flaxseed, apples, chicory root.
- Probiotics — live cultures from fermented foods that diversify the microbiome. Foods: live yoghurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, aged cheese.
- Postbiotics — beneficial compounds (short-chain fatty acids like butyrate) produced when bacteria ferment prebiotics. Foods: extra-virgin olive oil, dark chocolate 70%+, berries, nuts, seeds, green tea, sourdough.

THE BIOTICS SCORE (0–100 for a meal): prebiotic richness (up to 45), probiotic presence (up to 25), postbiotic support (up to 15), protein quality (up to 15). 70+ excellent, 50–69 solid, under 50 needs attention. When designing a meal, estimate its Biotics Score and name which foods contribute to which biotic.

THE 5 PILLARS: Feeding (fibre), Adding (fermented foods), Diversity (aim for 30 plants/week), Feeling (energy/digestion/mood signals), Consistency (meal timing/rhythm).

GUARDRAILS:
- For gut conditions (IBS, SIBO, IBD, reflux, etc.) give food context and ALWAYS recommend they work with a doctor/gastroenterologist for diagnosis and treatment. Never diagnose, never tell anyone to stop medication, never claim to treat or cure.
- For digestive stability (bowel urgency, stool, leakage): speak associatively and non-diagnostically ("may be associated with", "worth tracking"), suggest gentle one-variable-at-a-time experiments. RED FLAGS — blood in stool, black/tarry stools, unexplained weight loss, severe pain, sudden change in bowel habits, persistent diarrhoea, night-time symptoms, fever, anaemia: clearly urge them to contact their GP as a priority.

ROUTING (mention naturally when relevant, never pushy):
- If they haven't been assessed, suggest the free Biotics assessment at /assessment.
- For digestive-stability questions, mention EatoBiotics Stability™ (/stability).
- For weight/GLP-1 and protein questions, mention the GLP-1 Companion (/eatobetics/glp1).
- For deeper, ongoing, personalised coaching, mention membership (/pricing).

STYLE: Thorough but scannable — short paragraphs, specific quantities ("1 tablespoon of kimchi", not "some"). Always end with one specific action, formatted as:
Your next step: [one clear, specific action they can take today]`

function buildContext(ctx: {
  name: string | null
  tier: string
  overallScore: number | null
  subScores: Record<string, number> | null
  stabilitySummary: string | null
}): string {
  const { name, tier, overallScore, subScores, stabilitySummary } = ctx
  const pillars = subScores
    ? Object.entries(subScores).map(([k, v]) => `${k}: ${Math.round(v)}/100`).join(", ")
    : "not yet assessed"
  return `THIS PERSON (signed in${tier !== "free" ? `, ${tier} member` : ""}):
Name: ${name ?? "there"}
Overall Biotics Score: ${overallScore != null ? `${overallScore}/100` : "not yet assessed"}
Pillars: ${pillars}
${stabilitySummary ? `Stability: ${stabilitySummary}\n` : ""}Reference their actual numbers when relevant. Don't re-suggest the assessment if they already have a score.`
}

export async function POST(req: NextRequest) {
  // Validate first (cheap).
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const user = await getUser().catch(() => null)

  // Cost guard: per-user daily cap when signed in, IP burst limit when anonymous.
  if (user) {
    const blocked = await guardAiUsage(user.id, "eatobiotic")
    if (blocked) return blocked
  } else {
    const ip = getClientIp(req)
    const burst = rateLimit(`eatobiotic:ip:${ip}`, 12, 60 * 60 * 1000)
    if (!burst.allowed) {
      return NextResponse.json(
        { error: "You've reached the free guest limit for now. Sign in to keep chatting, or try again shortly." },
        { status: 429, headers: { "Retry-After": String(burst.retryAfterSeconds) } },
      )
    }
  }

  // Personalised context for signed-in users.
  let contextBlock: string | null = null
  if (user) {
    const sb = getSupabase()
    if (sb) {
      const [tier, { data: lead }, { data: stabAssess }, { data: profile }, { data: stabLogRows }] = await Promise.all([
        getUserMembershipTier(user.id),
        sb.from("leads").select("overall_score, sub_scores").or(`email.eq.${user.email!},user_id.eq.${user.id}`).not("overall_score", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("stability_assessments").select("score").eq("user_id", user.id).maybeSingle(),
        sb.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        sb.from("stability_logs").select("data").eq("user_id", user.id).order("log_date", { ascending: false }).limit(30),
      ])

      let stabilitySummary: string | null = null
      const sc = stabAssess?.score as { totalScore?: number; band?: string } | null
      const stabLogs = (stabLogRows ?? []).map((r) => r.data as StabilityDailyLog)
      if (sc?.totalScore != null || stabLogs.length) {
        const parts: string[] = []
        if (sc?.totalScore != null) parts.push(`score ${sc.totalScore}/100${sc.band ? ` (${sc.band})` : ""}`)
        if (stabLogs.length >= 3) {
          const rep = computeReport(stabLogs, 30)
          parts.push(`${rep.logCount} logged days, avg ${rep.avgStability ?? "n/a"}/10, ${rep.accidentEpisodes} accident episode(s)`)
        }
        stabilitySummary = parts.join("; ")
      }

      contextBlock = buildContext({
        name: (profile?.name as string | null) ?? null,
        tier,
        overallScore: (lead?.overall_score as number | null) ?? null,
        subScores: (lead?.sub_scores as Record<string, number> | null) ?? null,
        stabilitySummary,
      })
    }
  }

  const systemBlocks: import("@anthropic-ai/sdk/resources").TextBlockParam[] = [
    { type: "text", text: STATIC_KNOWLEDGE, cache_control: { type: "ephemeral" } },
    ...(contextBlock ? [{ type: "text" as const, text: contextBlock }] : []),
  ]

  try {
    const stream = await anthropic.messages.stream({
      model:      CLAUDE_MODEL,
      max_tokens: 1200,
      system:     systemBlocks,
      messages:   body.messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
            }
          }
        } catch (err) {
          console.error("[eatobiotic] stream error:", err)
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    })
  } catch (err) {
    console.error("[eatobiotic]", err)
    return NextResponse.json({ error: "The expert is unavailable right now. Please try again shortly." }, { status: 500 })
  }
}
