import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import type { StabilityAssessment, StabilityDailyLog } from "@/lib/stability/types"
import { hasServerFoundation } from "@/lib/assessment/foundation-server"

/* ── GET: fetch the signed-in user's assessment + logs ──────────────────── */

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ assessment: null, logs: [] })

  const [{ data: aRow }, { data: logRows }] = await Promise.all([
    sb.from("stability_assessments").select("answers, flags, score").eq("user_id", user.id).maybeSingle(),
    sb.from("stability_logs").select("data").eq("user_id", user.id).order("log_date", { ascending: false }).limit(120),
  ])

  const assessment = aRow
    ? ({ answers: aRow.answers, flags: aRow.flags, score: aRow.score } as StabilityAssessment)
    : null
  const logs = (logRows ?? []).map((r) => r.data as StabilityDailyLog)

  return NextResponse.json({ assessment, logs })
}

/* ── POST: upsert an assessment and/or a single daily log ───────────────── */

const bodySchema = z.object({
  assessment: z
    .object({ answers: z.record(z.string(), z.unknown()), flags: z.record(z.string(), z.unknown()), score: z.record(z.string(), z.unknown()) })
    .optional(),
  log: z
    .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .passthrough()
    .optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 })

  const now = new Date().toISOString()

  // Foundation before Health/Life: both the Stability assessment and its daily
  // logs are add-on data and may only be persisted once a You/Family foundation
  // is on file. Checked once up front (not per-branch) so a request carrying
  // both `assessment` and `log` doesn't hit Supabase twice for the same proof.
  if (body.assessment || body.log) {
    if (!(await hasServerFoundation(sb, { userId: user.id, email: user.email }))) {
      return NextResponse.json({ error: "Foundation assessment required before add-on assessment." }, { status: 403 })
    }
  }

  if (body.assessment) {
    const { error } = await sb.from("stability_assessments").upsert(
      { user_id: user.id, answers: body.assessment.answers, flags: body.assessment.flags, score: body.assessment.score, updated_at: now },
      { onConflict: "user_id" },
    )
    if (error) console.error("[stability] assessment upsert:", error.message)
  }

  if (body.log) {
    const { error } = await sb.from("stability_logs").upsert(
      { user_id: user.id, log_date: body.log.date, data: body.log, updated_at: now },
      { onConflict: "user_id,log_date" },
    )
    if (error) console.error("[stability] log upsert:", error.message)
  }

  return NextResponse.json({ ok: true })
}
