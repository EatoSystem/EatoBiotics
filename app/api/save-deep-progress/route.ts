import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

type RequestBody = {
  sessionId: string
  answers: Record<string, unknown>
  status?: string
}

export async function PATCH(req: NextRequest) {
  // Unauthenticated best-effort auto-save keyed by an (unguessable) Stripe
  // session id — rate limit per IP to blunt enumeration/abuse attempts.
  const limit = rateLimit(`save-deep-progress:${getClientIp(req)}`, 60, 10 * 60_000)
  if (!limit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(limit)
    return NextResponse.json(rlBody, init)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { sessionId, answers, status } = body

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    // No-op in dev without Supabase configured
    return NextResponse.json({ ok: true })
  }

  try {
    const { error } = await supabase.from("deep_assessments").upsert(
      {
        stripe_session_id: sessionId,
        answers,
        status: status ?? "in_progress",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id" }
    )

    if (error) {
      // Log but never block — this is best-effort auto-save
      console.error("[save-deep-progress] Supabase upsert error:", error.message)
    }
  } catch (err) {
    console.error("[save-deep-progress] Unexpected error:", err)
  }

  // Always return ok — auto-save must never block the user
  return NextResponse.json({ ok: true })
}
