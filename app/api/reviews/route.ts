import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

/*
  PRIVATE account-linked structured feedback. Migration 45 (`reviews`).

  One row per signed-in member: a 1–5 rating plus an optional comment,
  upserted so a member can revise it.

  ── There is no public read, and that is the point ────────────────────────

  This route used to export a public GET returning an aggregate rating and a
  handful of moderated quotes as social proof for the marketing surface. That
  is gone. Public testimonials are out of scope for the controlled beta, and
  the old shape had a specific problem worth naming: the moderation flag was a
  STAFF decision, not consent. Nobody submitting through FeedbackPrompt was
  told their words might be published, so clearing a quote for display would
  have published text the member never agreed to publish. Moderating text and
  being allowed to quote someone are different permissions.

  The public read was not replaced with an empty response either. An endpoint
  answering with an empty list reads like a working public surface that happens
  to have no data yet, and the next person to find it would wire a renderer to
  it. A 405 says what is true: there is no public read.

  Consent-based testimonials — affirmative unchecked opt-in, exact quote and
  display-name approval, consent version and timestamp, withdrawal — are
  designed separately. See the follow-up issue linked from #229.

  Retention: comment text is kept 90 days (`expires_at`, set by column DEFAULT
  and never sent from here) and swept by /api/feedback/retention. Account
  deletion cascades.
*/

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
  source: z.enum(["account", "meal", "retest", "milestone"]).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  // Cheap abuse guard on top of the one-row-per-user upsert.
  const rl = rateLimit(`reviews:${getClientIp(req)}`, 5, 10 * 60_000)
  if (!rl.allowed) {
    const { body, init } = rateLimitResponse(rl)
    return NextResponse.json(body, init)
  }

  let body: z.infer<typeof postSchema>
  try {
    body = postSchema.parse(await req.json())
  } catch {
    // No echo of the payload: it carries the member's own words.
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    console.error("[reviews] Supabase not configured — refusing to fake a save")
    return NextResponse.json({ error: "Feedback is unavailable right now." }, { status: 503 })
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      rating: body.rating,
      comment: body.comment && body.comment.length > 0 ? body.comment : null,
      source: body.source ?? "account",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )
  if (error) {
    console.error("[reviews] upsert failed:", error.message)
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 503 })
  }
  // `stored: true` is only ever sent when a row exists.
  return NextResponse.json({ ok: true, stored: true })
}
