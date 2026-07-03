/**
 * /api/twin-state — Daily Ritual + milestone sync (Migration 36).
 *
 * GET  → the member's server-side twin state ({ rituals, milestones_seen }).
 * PUT  → merge-write: milestone ids are unioned, ritual days are shallow-merged
 *        with the incoming day winning (localStorage is the live source of
 *        truth for today's taps). Rituals are pruned to the last 35 days so the
 *        row stays tiny. Auth-gated; service-role client (RLS-equivalent scope
 *        enforced by the user id from the session).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

const ritualDay = z.object({
  fermented: z.boolean(),
  plants: z.boolean(),
  feeling: z.boolean(),
})

const putSchema = z.object({
  rituals: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ritualDay).default({}),
  milestonesSeen: z.array(z.string().max(60)).max(200).default([]),
})

function pruneRituals(rituals: Record<string, unknown>): Record<string, unknown> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 35)
  const cutoffKey = cutoff.toISOString().slice(0, 10)
  return Object.fromEntries(Object.entries(rituals).filter(([day]) => day >= cutoffKey))
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

  const { data } = await supabase
    .from("twin_state")
    .select("rituals, milestones_seen")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    rituals: (data?.rituals as Record<string, unknown>) ?? {},
    milestonesSeen: (data?.milestones_seen as string[]) ?? [],
  })
}

export async function PUT(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

  let body: z.infer<typeof putSchema>
  try {
    body = putSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("twin_state")
    .select("rituals, milestones_seen")
    .eq("user_id", user.id)
    .maybeSingle()

  const mergedRituals = pruneRituals({
    ...((existing?.rituals as Record<string, unknown>) ?? {}),
    ...body.rituals, // incoming day wins — the device that tapped is the truth
  })
  const mergedSeen = Array.from(
    new Set([...((existing?.milestones_seen as string[]) ?? []), ...body.milestonesSeen]),
  ).slice(-200)

  const { error } = await supabase.from("twin_state").upsert({
    user_id: user.id,
    rituals: mergedRituals,
    milestones_seen: mergedSeen,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    console.error("[twin-state] upsert:", error.message)
    return NextResponse.json({ error: "Save failed" }, { status: 500 })
  }
  return NextResponse.json({ rituals: mergedRituals, milestonesSeen: mergedSeen })
}
