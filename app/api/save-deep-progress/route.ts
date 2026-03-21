import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

type RequestBody = {
  sessionId: string
  answers: Record<string, unknown>
  status?: string
}

export async function PATCH(req: NextRequest) {
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
