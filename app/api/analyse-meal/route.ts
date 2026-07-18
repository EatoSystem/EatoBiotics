import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUserFromRequest } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { runAnalysis } from "@/lib/analysis/analyse"
import { persistAnalysis } from "@/lib/analysis/persist"
import type { AnalysisResult } from "@/lib/analysis/types"

/*
  The canonical meal-analysis endpoint. Scoring + persistence live in
  lib/analysis/* so every analyse surface shares one prompt, one 0–100 scale,
  and one column mapping. This route owns auth, rate limiting, the per-tier
  daily cap, and the response.

  Response shape is the mobile Phase C contract — additive changes only.

  SQL columns used (all live): meal_name, meal_type, image_url,
  quality_diversity, quality_anti_inflammatory, nutrition_json, insight, tags.
*/

const bodySchema = z.object({
  description: z.string().max(1000).optional(),
  image:       z.string().optional(), // base64 data URL: "data:image/jpeg;base64,..."
  meal_type:   z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]).optional(),
})

/** The result plus the persistence fields the client receives. */
export type MealAnalysisResult = AnalysisResult & { id: string | null; created_at?: string }

export async function POST(req: NextRequest) {
  // Web session cookie OR `Authorization: Bearer <supabase access token>`
  // (mobile companion app) — same dual-surface auth as /api/twin-state.
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  /* Per-IP rate limit — cheap abuse guard before the expensive AI call */
  const rl = rateLimit(`analyse-meal:${getClientIp(req)}`, 20, 60_000)
  if (!rl.allowed) {
    const { body: rlBody, init } = rateLimitResponse(rl)
    return NextResponse.json(rlBody, init)
  }

  /* Parse body — supports JSON or multipart */
  let body: z.infer<typeof bodySchema>
  try {
    const ct = req.headers.get("content-type") ?? ""
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData()
      const file = fd.get("image") as File | null
      let imageBase64: string | undefined
      if (file) {
        const buf = await file.arrayBuffer()
        imageBase64 = `data:${file.type};base64,${Buffer.from(buf).toString("base64")}`
      }
      body = bodySchema.parse({
        description: (fd.get("description") as string | null) ?? undefined,
        image:       imageBase64,
        meal_type:   (fd.get("meal_type") as string | null) ?? undefined,
      })
    } else {
      body = bodySchema.parse(await req.json())
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.description && !body.image) {
    return NextResponse.json({ error: "Either description or image is required" }, { status: 400 })
  }

  /* Fail closed: this AI-cost endpoint requires the DB to enforce limits. */
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }

  /* Per-tier daily cap (free/unknown → 2/day) */
  const tier = await getUserMembershipTier(user.id)
  const DAILY_LIMITS: Record<string, number> = { grow: 2, restore: 5, transform: 10 }
  const dailyLimit = DAILY_LIMITS[tier] ?? 2
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  const { count: todayCount } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayUTC.toISOString())
  if ((todayCount ?? 0) >= dailyLimit) {
    const resetAt = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000).toISOString()
    return NextResponse.json(
      { error: `Daily limit reached. Your plan allows ${dailyLimit} meal analyses per day.`, resetAt },
      { status: 429 },
    )
  }

  /* Score (shared core) */
  const outcome = await runAnalysis({
    description: body.description,
    image: body.image,
    mealTypeHint: body.meal_type,
  })
  if (outcome.status === "unreadable") {
    // Honest refusal — no analyses row, no cap slot consumed.
    return NextResponse.json({ error: outcome.message, unreadable: true }, { status: 422 })
  }
  if (outcome.status === "error") {
    return NextResponse.json({ error: "Analysis failed — try again" }, { status: 500 })
  }

  /* Persist (shared core) and return */
  const result: MealAnalysisResult = { id: null, ...outcome.result }
  const saved = await persistAnalysis(supabase, {
    userId: user.id,
    result: outcome.result,
    description: body.description,
    mealTypeHint: body.meal_type,
    tier,
  })
  result.id = saved.id
  result.created_at = saved.created_at

  return NextResponse.json(result)
}
