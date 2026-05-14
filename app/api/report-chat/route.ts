import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import type { WeeklyReportJson } from "@/app/api/weekly-report/generate/route"

/* ── Validation ─────────────────────────────────────────────────────── */

const bodySchema = z.object({
  messages:  z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(40),
  reportId:  z.string().uuid(),
})

/* ── Static knowledge — cached ───────────────────────────────────────── */

const STATIC_KNOWLEDGE = `You are EatoBiotic — the expert guide on the 3 Biotics Framework (prebiotics, probiotics, postbiotics). You help members understand and improve their food system based on their weekly meal analysis report.

THE 3 BIOTICS FRAMEWORK:
- Prebiotics: plant fibres that feed beneficial gut bacteria (garlic, onion, leek, asparagus, oats, banana, chicory, flaxseeds, apples)
- Probiotics: live cultures from fermented foods (yoghurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, aged cheese)
- Postbiotics: compounds produced when bacteria ferment prebiotics; supported by EVOO, berries, dark chocolate 70%+, nuts, polyphenol-rich plants

SCORING: 0–100 per pillar. Overall = prebiotic 45% + probiotic 30% + postbiotic 25%. 70+ excellent. 50–69 solid. Below 50 needs attention.

Your tone: knowledgeable but warm, precise and practical, like a brilliant friend who's a world expert in food system health.
Always end with one specific, immediately actionable step the member can take today.`

/* ── Route handler ───────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  /* Require at least a free-tier member (any paid tier can chat about their report) */
  const tier = await getUserMembershipTier(user.id)
  if (tier === "free") {
    return NextResponse.json({ error: "Report chat requires an active membership" }, { status: 403 })
  }

  let body: z.infer<typeof bodySchema>
  try { body = bodySchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }) }

  const adminSupabase = getSupabase()
  if (!adminSupabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  /* Fetch the weekly report */
  const { data: reportRow, error: reportErr } = await adminSupabase
    .from("weekly_checkins")
    .select("id, content, report_json, week_starting, user_id")
    .eq("id", body.reportId)
    .single()

  if (reportErr || !reportRow) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 })
  }

  /* Verify the report belongs to this user */
  if ((reportRow.user_id as string) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  /* Build dynamic report context */
  const rj = reportRow.report_json as WeeklyReportJson | null
  const reportContext = rj ? `
THIS MEMBER'S WEEKLY REPORT — Week ${rj.weekNumber} (${rj.weekStarting}):
Summary title: ${rj.weekSummaryTitle}
Meals logged this week: ${rj.mealCount}
Average biotics score: ${rj.averageScore}/100${rj.previousWeekAverage != null ? ` (previous week: ${rj.previousWeekAverage}/100)` : ""}
Prebiotic: ${rj.pillars.prebiotic}/100 | Probiotic: ${rj.pillars.probiotic}/100 | Postbiotic: ${rj.pillars.postbiotic}/100
${rj.bestMeal ? `Best meal: ${rj.bestMeal.name} (${rj.bestMeal.score}/100)` : ""}
${rj.weakestMeal ? `Weakest meal: ${rj.weakestMeal.name} (${rj.weakestMeal.score}/100)` : ""}

Meals this week:
${rj.mealsThisWeek.map((m) => `- ${m.date}: ${m.name} (${m.type}) — ${m.score}/100`).join("\n")}

Report narrative: "${rj.narrative}"
Recommended focus: ${rj.focusAction}
Pillar insights:
- Prebiotic: ${rj.pillarInsights?.prebiotic ?? ""}
- Probiotic: ${rj.pillarInsights?.probiotic ?? ""}
- Postbiotic: ${rj.pillarInsights?.postbiotic ?? ""}

You have full context of this member's week. Answer their questions based on this data. Be specific — reference their actual meals, scores, and patterns.` : `Report content: ${reportRow.content as string}`

  /* Stream response */
  try {
    const stream = await anthropic.messages.stream({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: [
        { type: "text", text: STATIC_KNOWLEDGE, cache_control: { type: "ephemeral" } },
        { type: "text", text: reportContext },
      ],
      messages: body.messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch (err) {
    console.error("[report-chat]", err)
    return NextResponse.json({ error: "Chat unavailable" }, { status: 500 })
  }
}
