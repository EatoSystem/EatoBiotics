import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { hasServerFoundation, payloadHasAddon, payloadHasFoundation } from "@/lib/assessment/foundation-server"

/* ── GET: fetch the signed-in user's assessment journey + summaries ─────────── */

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ journey: null, summaries: null, updatedAt: null })

  const { data } = await sb
    .from("assessment_journeys")
    .select("journey, summaries, updated_at")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    journey: data?.journey ?? null,
    summaries: data?.summaries ?? null,
    updatedAt: data?.updated_at ?? null,
  })
}

/* ── POST: upsert the journey state + the normalised summary map ────────────── */

const bodySchema = z.object({
  journey: z.record(z.string(), z.unknown()),
  summaries: z.record(z.string(), z.unknown()),
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

  // Foundation before Health/Life: an add-on summary (Mind, Glucose, Performance,
  // Pregnancy, Stability) may only be persisted alongside — or after — a completed
  // You/Family foundation. A foundation-only payload is always allowed; it's how
  // the foundation itself gets established.
  if (payloadHasAddon(body.summaries) && !payloadHasFoundation(body.summaries)) {
    const hasFoundation = await hasServerFoundation(sb, { userId: user.id, email: user.email })
    if (!hasFoundation) {
      return NextResponse.json({ error: "Foundation assessment required before add-on assessment." }, { status: 403 })
    }
  }

  const { error } = await sb.from("assessment_journeys").upsert(
    { user_id: user.id, journey: body.journey, summaries: body.summaries, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  )
  if (error) console.error("[assessment-journey] upsert:", error.message)

  return NextResponse.json({ ok: true })
}
