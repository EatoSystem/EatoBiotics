/**
 * The one place a scored meal is written to the `analyses` table. Extracted so
 * every analyse adapter persists the same columns identically.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { AnalysisResult } from "./types"

export interface PersistOptions {
  userId: string
  result: AnalysisResult
  description?: string
  mealTypeHint?: string
  tier: string
}

/** Inserts one analysis row; returns the new id + created_at (or null id on
    failure — persistence is best-effort, the caller still returns the result). */
export async function persistAnalysis(
  supabase: SupabaseClient,
  opts: PersistOptions,
): Promise<{ id: string | null; created_at?: string }> {
  const { result } = opts
  const { data: saved, error } = await supabase
    .from("analyses")
    .insert({
      user_id:                   opts.userId,
      biotics_score:             result.biotics_score,
      prebiotic_score:           result.prebiotic_score,
      probiotic_score:           result.probiotic_score,
      postbiotic_score:          result.postbiotic_score,
      meal_name:                 result.meal_name,
      meal_type:                 result.meal_type || (opts.mealTypeHint ?? "Meal"),
      meal_description:          opts.description ?? null,
      quality_diversity:         result.quality_diversity,
      quality_anti_inflammatory: result.quality_anti_inflammatory,
      nutrition_json:            result.nutrition,
      insight:                   result.insight,
      tags:                      result.tags,
      tier_at_time_of_analysis:  opts.tier,
    })
    .select("id, created_at")
    .single()

  if (error) {
    console.error("[analysis] DB insert error:", error.message)
    return { id: null }
  }
  return { id: (saved?.id as string) ?? null, created_at: saved?.created_at as string | undefined }
}
