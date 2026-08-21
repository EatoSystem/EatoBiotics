import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { getUserFromRequest } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { guardAiUsage } from "@/lib/ai-guard"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { EXTRACTION_SYSTEM, buildExtractionUser } from "@/lib/feedback/prompts"
import { coerceCategory, coerceSentiment, coerceSeverity, type FeedbackExtraction } from "@/lib/feedback/types"

/* ── Private product feedback capture ─────────────────────────────────────
   Open to everyone — signed-in members AND anonymous visitors (feedback from
   people who haven't signed up is some of the most valuable). One Claude call
   triages the free-text into structured fields; if THAT fails, the raw message
   is still stored, because the triage is a convenience and the message is the
   point.

   Storage failure is a different thing entirely. This route used to report a
   fail-soft success when Supabase was missing or the insert errored, and the
   widget thanked the user either way — so a customer could type a paragraph,
   be thanked for it, and have it silently discarded. A thank-you is a claim
   that we received something. It is only sent now when a row actually exists.

   Everything captured here is private: read back only by the admin dashboard
   and the weekly owner digest, both server-side. Nothing is ever rendered
   publicly. Raw text is retained 90 days (`expires_at`, server-derived by
   column DEFAULT — deliberately never sent from here) and swept by
   /api/feedback/retention.

   Cost cap: authed users go through guardAiUsage (per-user daily cap); anon
   users are bounded by a per-IP burst limit.
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
    // Nowhere to store it. Saying "thanks" here would be a lie the customer
    // cannot detect, and their message would be gone.
    console.error("[feedback] Supabase not configured — refusing to fake a save")
    return NextResponse.json({ error: "Feedback is unavailable right now." }, { status: 503 })
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
    // The failure IS ours, not theirs — which is exactly why they need to know
    // it happened, so they can send it again. The message text is never echoed
    // and the database error never leaves this log line.
    console.error("[feedback] insert failed:", error.message)
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 503 })
  }

  // The one adaptive follow-up (if any) lets the widget deepen the conversation
  // without another AI call — the user's answer is appended to a fresh row.
  return NextResponse.json({ ok: true, stored: true, follow_up: extraction.follow_up ?? null })
}
