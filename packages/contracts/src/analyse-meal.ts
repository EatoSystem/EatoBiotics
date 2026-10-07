/**
 * Request/response contract for POST /api/analyse-meal.
 *
 * Meal-level fields (prebiotic_score / probiotic_score / postbiotic_score)
 * describe ONE plate. They are never the person's Biotics Score™ and must
 * never be rendered as "Your Prebiotics". The overall meal number is a
 * Meal Biotics Score.
 */
import { z } from "zod"

export const analyseMealRequestSchema = z.object({
  description: z.string().max(1000).optional(),
  image: z.string().optional(),
  meal_type: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]).optional(),
})

export const analyseMealNutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fibre: z.number(),
})

export const analyseMealFoodSchema = z.object({
  name: z.string(),
  biotic: z.enum(["prebiotic", "probiotic", "postbiotic", "protein"]),
  confidence: z.enum(["high", "medium", "low"]),
})

export const analyseMealResponseSchema = z.object({
  id: z.string().nullable(),
  created_at: z.string().optional(),
  meal_name: z.string(),
  meal_type: z.string(),
  biotics_score: z.number(),
  prebiotic_score: z.number(),
  probiotic_score: z.number(),
  postbiotic_score: z.number(),
  quality_diversity: z.number(),
  quality_anti_inflammatory: z.number(),
  nutrition: analyseMealNutritionSchema,
  insight: z.string(),
  tags: z.array(z.string()),
  foods: z.array(analyseMealFoodSchema).optional(),
})

export type AnalyseMealRequest = z.infer<typeof analyseMealRequestSchema>
export type AnalyseMealResponse = z.infer<typeof analyseMealResponseSchema>
