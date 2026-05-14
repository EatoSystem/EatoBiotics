/*
  SQL migrations — run once in Supabase SQL editor:

  ALTER TABLE analyses
    ADD COLUMN IF NOT EXISTS meal_name text,
    ADD COLUMN IF NOT EXISTS meal_type text DEFAULT 'Meal',
    ADD COLUMN IF NOT EXISTS image_url  text,
    ADD COLUMN IF NOT EXISTS quality_diversity         integer,
    ADD COLUMN IF NOT EXISTS quality_anti_inflammatory integer,
    ADD COLUMN IF NOT EXISTS nutrition_json jsonb,
    ADD COLUMN IF NOT EXISTS insight text,
    ADD COLUMN IF NOT EXISTS tags    jsonb DEFAULT '[]'::jsonb;
*/

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

/* ── Validation ─────────────────────────────────────────────────────── */

const bodySchema = z.object({
  description: z.string().max(1000).optional(),
  image:       z.string().optional(), // base64 data URL: "data:image/jpeg;base64,..."
  meal_type:   z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]).optional(),
})

/* ── Analysis prompt — cached ────────────────────────────────────────── */

const ANALYSIS_SYSTEM = `You are EatoBiotic, the world's expert on the 3 Biotics Framework for gut health.
Analyse the meal described or shown and return a single valid JSON object — no markdown, no explanation, no extra text.

SCORING RUBRIC:
- prebiotic_score 0–100: plant/fibre diversity. 4+ distinct plant/fibre sources = 80–95, 3 = 65–75, 2 = 45–60, 1 = 25–40, 0 = 5–15
- probiotic_score 0–100: live/fermented foods. 2+ fermented = 75–90, 1 = 45–60, none = 5–15
- postbiotic_score 0–100: postbiotic-supporting foods (EVOO, berries, dark chocolate 70%+, nuts, polyphenol-rich plants, avocado, sourdough). Present and diverse = 50–80, minimal = 20–35, none = 5–15
- biotics_score (overall): weighted — prebiotic 45% + probiotic 30% + postbiotic 25%, then round to nearest integer
- quality_diversity 0–100: breadth of different food types across the whole meal
- quality_anti_inflammatory 0–100: presence of omega-3s, polyphenols, curcumin, allicin, antioxidants; absence of processed food, refined sugar, trans fats

JSON structure (return ONLY this):
{
  "meal_name": "concise descriptive name of the meal",
  "meal_type": "Breakfast|Lunch|Dinner|Snack",
  "biotics_score": <integer 0–100>,
  "prebiotic_score": <integer 0–100>,
  "probiotic_score": <integer 0–100>,
  "postbiotic_score": <integer 0–100>,
  "quality_diversity": <integer 0–100>,
  "quality_anti_inflammatory": <integer 0–100>,
  "nutrition": {
    "calories": <integer kcal estimate>,
    "protein": <integer grams>,
    "carbs": <integer grams>,
    "fat": <integer grams>,
    "fibre": <integer grams>
  },
  "insight": "<2–3 sentences: what this meal does for the gut specifically, which biotic is strongest and why, one concrete swap that would improve the overall score and by roughly how many points>",
  "tags": ["<tag>", ...]
}

Valid tags (use 2–4 most relevant): Omega-3s, Probiotics, Prebiotics, Postbiotics, Anti-inflammatory, High Fibre, Plant Diversity, Fermented Foods, Quick Win, Needs Work, Protein Rich, Low Biotics, Polyphenols`

/* ── Analysis result type ────────────────────────────────────────────── */

export interface MealAnalysisResult {
  id:           string | null
  meal_name:    string
  meal_type:    string
  biotics_score:             number
  prebiotic_score:           number
  probiotic_score:           number
  postbiotic_score:          number
  quality_diversity:         number
  quality_anti_inflammatory: number
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fibre: number }
  insight: string
  tags:    string[]
  created_at?: string
}

/* ── Route handler ───────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

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

  /* Build message content (text + optional image) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msgContent: any[] = []

  if (body.image) {
    const match = body.image.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      msgContent.push({
        type: "image",
        source: { type: "base64", media_type: match[1], data: match[2] },
      })
    }
  }

  msgContent.push({
    type: "text",
    text: body.description
      ? `Analyse this meal: ${body.description}. Meal type hint: ${body.meal_type ?? "unknown"}.`
      : `Analyse the meal shown in this photo. Meal type hint: ${body.meal_type ?? "unknown"}.`,
  })

  /* Call Claude */
  let result: MealAnalysisResult
  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 800,
      system:     [{ type: "text", text: ANALYSIS_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages:   [{ role: "user", content: msgContent }],
    })
    const text = response.content[0]?.type === "text" ? response.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in Claude response")
    const parsed = JSON.parse(jsonMatch[0])
    result = { id: null, ...parsed }
  } catch (err) {
    console.error("[analyse-meal] Claude error:", err)
    return NextResponse.json({ error: "Analysis failed — try again" }, { status: 500 })
  }

  /* Save to analyses table */
  const adminSupabase = getSupabase()
  if (adminSupabase) {
    const tier = await getUserMembershipTier(user.id)
    const { data: saved, error } = await adminSupabase
      .from("analyses")
      .insert({
        user_id:                   user.id,
        biotics_score:             result.biotics_score,
        prebiotic_score:           result.prebiotic_score,
        probiotic_score:           result.probiotic_score,
        postbiotic_score:          result.postbiotic_score,
        meal_name:                 result.meal_name,
        meal_type:                 result.meal_type || (body.meal_type ?? "Meal"),
        meal_description:          body.description ?? null,
        quality_diversity:         result.quality_diversity,
        quality_anti_inflammatory: result.quality_anti_inflammatory,
        nutrition_json:            result.nutrition,
        insight:                   result.insight,
        tags:                      result.tags,
        tier_at_time_of_analysis:  tier,
      })
      .select("id, created_at")
      .single()

    if (error) {
      console.error("[analyse-meal] DB insert error:", error.message)
    } else if (saved) {
      result.id         = saved.id as string
      result.created_at = saved.created_at as string
    }
  }

  return NextResponse.json(result)
}
