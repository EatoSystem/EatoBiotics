import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { getUserFromRequest } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { guardAiUsage } from "@/lib/ai-guard"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { EXTRACTION_SYSTEM, buildExtractionUser } from "@/lib/feedback/prompts"
import { coerceCategory, coerceSentiment, coerceSeverity, type FeedbackExtraction } from "@/lib/feedback/types"

/* ── Customer feedback capture ────────────────────────────────────────────
   Open to everyone — signed-in members AND anonymous visitors (feedback from
   people who haven't signed up is some of the most valuable). One Claude call
   triages the free-text into structured fields; if it fails, the raw message
   is still stored so nothing is lost.

   Cost cap: authed users go through guardAiUsage (per-user daily cap); anon
   users are bounded by a per-IP burst limit. Both keep the AI spend safe.
──────────────────────────────────────────────────────────────────────── */

const bodySchema = z.object({
  message: z.string().trim().min(1, "empty").max(4000),
  rating: z.number().int().min(1).max(5).optional(),
  source_page: z.string().max(300).optional(),
})

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Please include a short message." }, { status: 400 })
  }

  // Auth is OPTIONAL here — we accept anonymous feedback too.
  const user = await getUserFromRequest(req)

  // Cost cap: authed → per-user daily cap; anon → per-IP burst.
  if (user) {
    const blocked = await guardAiUsage(user.id, "feedback")
    if (blocked) return blocked
  } else {
    const rl = rateLimit(`feedback:${getClientIp(req)}`, 5, 10 * 60_000)
    if (!rl.allowed) {
      const { body, init } = rateLimitResponse(rl)
      return NextResponse.json(body, init)
    }
  }

  const supabase = getSupabase()
  if (!supabase) {
    // Never lose feedback to a misconfig — acknowledge so the UI thanks the user.
    return NextResponse.json({ ok: true, stored: false })
  }

  // Best-effort AI triage. Any failure → store the raw message anyway.
  let extraction: Partial<FeedbackExtraction> = {}
  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0,
      system: [{ type: "text", text: EXTRACTION_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildExtractionUser(parsed.message, parsed.rating ?? null, parsed.source_page ?? null) }],
    })
    const text = res.content[0]?.type === "text" ? res.content[0].text : ""
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const j = JSON.parse(match[0])
      extraction = {
        category: coerceCategory(j.category),
        sentiment: coerceSentiment(j.sentiment),
        severity: coerceSeverity(j.severity),
        feature_area: typeof j.feature_area === "string" ? j.feature_area.slice(0, 120) : null,
        summary: typeof j.summary === "string" ? j.summary.slice(0, 400) : null,
        suggested_improvement: typeof j.suggested_improvement === "string" ? j.suggested_improvement.slice(0, 400) : null,
        follow_up: typeof j.follow_up === "string" ? j.follow_up.slice(0, 200) : null,
      }
    }
  } catch (err) {
    console.error("[feedback] extraction failed (storing raw):", err)
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    source_page: parsed.source_page ?? null,
    rating: parsed.rating ?? null,
    message: parsed.message,
    category: extraction.category ?? null,
    sentiment: extraction.sentiment ?? null,
    severity: extraction.severity ?? null,
    feature_area: extraction.feature_area ?? null,
    summary: extraction.summary ?? null,
    suggested_improvement: extraction.suggested_improvement ?? null,
  })

  if (error) {
    console.error("[feedback] insert failed:", error.message)
    // Still thank the user — the failure is ours, not theirs.
    return NextResponse.json({ ok: true, stored: false })
  }

  // The one adaptive follow-up (if any) lets the widget deepen the conversation
  // without another AI call — the user's answer is appended to a fresh row.
  return NextResponse.json({ ok: true, stored: true, follow_up: extraction.follow_up ?? null })
}
