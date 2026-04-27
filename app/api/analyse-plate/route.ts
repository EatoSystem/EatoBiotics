import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages"

const ANALYSIS_PROMPT = `You are a food system nutrition analyst using the EatoBiotics framework (prebiotics, probiotics, postbiotics).

Look at this meal carefully and identify EVERY distinct food item visible — including garnishes, seeds, dressings, sauces, and side items. Aim to identify 4–8 items typically visible in a meal photo. Don't miss small items like seeds on avocado, dressing, or herbs.

For each food, classify it as ONE of:
- prebiotic: fibrous plant foods that feed good gut bacteria (ALL vegetables, fruits, wholegrains, legumes, garlic, onion, leeks, asparagus, peas, oats, bananas, seeds like hemp/flax/chia, avocado, etc.)
- probiotic: live cultures / fermented foods (yogurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, live-culture cheese, etc.)
- postbiotic: health compounds from fermentation (aged hard cheese, sourdough bread, apple cider vinegar, certain fermented products)
- protein: meat, fish, eggs, or legumes when serving as the primary protein source

Classification notes:
- Avocado = prebiotic (excellent fibre)
- Asparagus, peas, edamame = prebiotic (high in FOSs and resistant starch)
- Seeds (hemp, flax, sesame, pumpkin, sunflower) = prebiotic
- Legumes like lentils/chickpeas = prebiotic (if a side dish) or protein (if the main protein)
- Greek yogurt = probiotic (live cultures)
- Aged cheddar/parmesan = postbiotic

Score this meal from 0–100 using this calibrated rubric for a SINGLE MEAL (most single meals won't have all 3 biotics — that's normal):

PREBIOTIC richness — up to 45 points:
  4+ different plant/fibre foods: 45 pts
  3 plant/fibre foods: 40 pts
  2 plant/fibre foods: 32 pts
  1 plant/fibre food: 20 pts
  0 plant/fibre foods: 0 pts

PROBIOTIC presence — up to 25 points:
  2+ fermented foods: 25 pts
  1 fermented food: 20 pts
  None: 10 pts (floor — single meals commonly skip fermented food; this is not a failure)

POSTBIOTIC production capacity — up to 15 points:
  Postbiotics are NOT eaten — they are PRODUCED by gut bacteria fermenting prebiotic fibre.
  Score based on how much this meal will generate SCFAs, vitamins, and neurotransmitters in the gut:
  Strong prebiotics (4+ plants) + at least 1 fermented food: 15 pts
  Strong prebiotics (4+ plants), no fermented foods: 12 pts
  Moderate prebiotics (2–3 plants) + at least 1 fermented food: 10 pts
  Moderate prebiotics (2–3 plants), no fermented foods: 7 pts
  1 plant food only: 4 pts
  0 plant foods: 1 pt (endogenous bacteria produce trace postbiotics)
  Bonus: add 2 pts if meal contains high-fermentability foods (oats, garlic, onion, leeks, asparagus, banana, chicory, Jerusalem artichoke) — these produce especially high butyrate/propionate output

PROTEIN quality for gut lining — up to 15 points:
  High-quality protein (grilled chicken, fish, eggs, legumes): 15 pts
  Some protein present: 12 pts
  No protein: 0 pts

Calibration examples:
- Grilled chicken + asparagus + avocado + mixed greens: ~70 (strong prebiotics + quality protein, missing fermented)
- Salmon + kimchi + brown rice + broccoli: ~90 (excellent all-round)
- Plain chicken breast only: ~27 (minimal gut benefit alone)
- Full food system bowl (veg + yogurt + sourdough + chicken): ~95+

Set "prebioticStrength" to "strong" (3+ prebiotic foods), "moderate" (1–2 prebiotic foods), or "low" (0 prebiotic foods).

NUTRITION ACCURACY — CRITICAL:
Before returning nutrition totals, mentally estimate each visible food item's calories individually based on actual portion size, then sum them. Every meal should produce a different total — never default to the same range.

Meal-level calorie benchmarks (use these to sense-check your per-item sum):
- Side salad or light snack: 150–300 kcal
- Typical lunch bowl (protein + veg + small grain): 400–600 kcal
- Large rice or pasta bowl: 600–900 kcal
- Fast food meal (burger + fries + drink): 900–1400 kcal
- Breakfast (eggs + toast): 300–500 kcal
- Smoothie or açaí bowl: 350–600 kcal

Per-item calibration (adjust for visible portion size):
- Grilled chicken breast (palm-sized, ~150g) ≈ 180 kcal, 33g protein, 0g carbs, 4g fat, 0g fibre
- Chicken breast (large, ~220g) ≈ 265 kcal, 50g protein, 0g carbs, 6g fat, 0g fibre
- Salmon fillet (medium, ~150g) ≈ 280 kcal, 30g protein, 0g carbs, 17g fat, 0g fibre
- Tuna steak (150g) ≈ 185 kcal, 40g protein, 0g carbs, 2g fat, 0g fibre
- Beef burger patty (~120g, cooked) ≈ 290 kcal, 26g protein, 0g carbs, 20g fat, 0g fibre
- 1 egg ≈ 70 kcal, 6g protein, 0g carbs, 5g fat, 0g fibre
- Brown rice (1 cup cooked, ~200g) ≈ 215 kcal, 5g protein, 45g carbs, 2g fat, 4g fibre
- White rice (1 cup cooked) ≈ 200 kcal, 4g protein, 44g carbs, 0g fat, 1g fibre
- Pasta (medium bowl, ~220g cooked) ≈ 330 kcal, 12g protein, 65g carbs, 2g fat, 3g fibre
- Pasta (large bowl, ~350g cooked) ≈ 520 kcal, 18g protein, 100g carbs, 3g fat, 4g fibre
- Large mixed salad greens (2 cups) ≈ 20 kcal, 2g protein, 4g carbs, 0g fat, 2g fibre
- Avocado (half, ~75g) ≈ 120 kcal, 1g protein, 6g carbs, 11g fat, 5g fibre
- Sweet potato (medium, ~150g, roasted) ≈ 130 kcal, 2g protein, 30g carbs, 0g fat, 4g fibre
- Broccoli (1 cup florets) ≈ 35 kcal, 3g protein, 7g carbs, 0g fat, 2g fibre
- Olive oil drizzle (1 tbsp) ≈ 120 kcal, 0g protein, 0g carbs, 14g fat, 0g fibre
- Greek yogurt (small pot, 150g) ≈ 130 kcal, 15g protein, 8g carbs, 4g fat, 0g fibre
- Kimchi (small portion, 50g) ≈ 15 kcal, 1g protein, 2g carbs, 0g fat, 1g fibre
- Sourdough bread (1 slice, ~40g) ≈ 100 kcal, 4g protein, 19g carbs, 1g fat, 1g fibre
- Fries (medium portion, ~150g) ≈ 380 kcal, 4g protein, 50g carbs, 18g fat, 4g fibre
- Cheese (1 slice cheddar, ~28g) ≈ 110 kcal, 7g protein, 0g carbs, 9g fat, 0g fibre
- Chickpeas (½ cup cooked) ≈ 135 kcal, 7g protein, 22g carbs, 2g fat, 6g fibre

IMPORTANT: Do NOT produce similar calorie or protein numbers across different meals. A grilled chicken salad ≈ 350–450 kcal and 30–35g protein. A salmon rice bowl ≈ 550–700 kcal and 35–45g protein. A burger with fries ≈ 900–1100 kcal and 35–45g protein. A small yogurt breakfast ≈ 200–350 kcal and 12–20g protein. Estimate from what is ACTUALLY VISIBLE on the plate — portion size matters enormously.

Also estimate the total nutritional content of the ENTIRE meal visible (not per food item).

Also calculate a "boostedScore" — what the score would be if the user added ONE item from each category listed in missingBiotics. Apply the same scoring rubric. If nothing is missing, boostedScore equals score.

Also return these additional fields in the same JSON object:

mealName: A short descriptive name for this meal (e.g. "Salmon + Kimchi Bowl", "Greek Yogurt Breakfast", "Cheeseburger & Fries"). Max 4 words.

prebioticScore: 0–100 numeric score for prebiotics specifically (not the overall score)
probioticScore: 0–100 numeric score for probiotics specifically
postbioticScore: 0–100 score for the meal's POSTBIOTIC PRODUCTION CAPACITY — how much the prebiotic fibre + probiotic bacteria will generate SCFAs, vitamins, and neurotransmitters in the gut. Score as follows: prebiotic richness up to 50 pts (4+ plants=50, 3=40, 2=28, 1=15, 0=5); probiotic synergy up to 30 pts (2+ fermented=30, 1 fermented=22, none=8); high-fermentability bonus: +15 if 2+ of (oats, garlic, onion, leeks, asparagus, banana, chicory) present, +8 if 1; direct postbiotic sources (sourdough, aged cheese, ACV, miso) add +5. Cap total at 100.

plantDiversityCount: Count of distinct plant foods visible (each vegetable, fruit, grain, legume, herb, seed counts as 1)

inflammationIndex: "anti-inflammatory" if the meal is rich in polyphenols/omega-3/fibre with minimal refined sugar/seed oils; "inflammatory" if high in refined carbs, seed oils, processed meat; "neutral" otherwise

processingLevel: "whole_food" if >80% of ingredients are whole/minimally processed; "ultra_processed" if dominated by packaged/fast food; "minimally_processed" otherwise

fermentationLevel: "none" if no fermented foods; "low" if trace amounts (e.g. small dressing with ACV); "medium" if one clear fermented item; "high" if 2+ fermented items

gutLiningSupport: "strong" if meal contains collagen-rich proteins, zinc sources, vitamin C, or butyrate-producing foods; "weak" if primarily refined carbs/processed foods; "moderate" otherwise

scfaPotential: "high" if the prebiotic fibre content will produce significant short-chain fatty acids (butyrate, propionate, acetate) during fermentation — typically 4+ prebiotic foods or beta-glucan sources; "medium" if 2–3 prebiotic foods; "low" otherwise

plateQuadrants: Estimate what % of the plate each quadrant represents as integers summing to 100:
  { "fiber": X, "fermented": X, "protein": X, "fats": X }
  fiber = all plant/fibre foods, fermented = all fermented foods, protein = all protein sources, fats = all fat sources (note: a food can span multiple but assign to primary role)

keyNutrients: Estimate presence of these key nutrients as "high"/"moderate"/"low":
  { "magnesium": "...", "omega3": "...", "zinc": "...", "vitaminC": "...", "b12": "..." }

Return ONLY valid JSON with this exact structure, no markdown fences:
{
  "score": 70,
  "mealName": "string",
  "prebioticScore": 75,
  "probioticScore": 20,
  "postbioticScore": 45,
  "boostedScore": 85,
  "prebioticStrength": "strong|moderate|low",
  "plantDiversityCount": 4,
  "inflammationIndex": "anti-inflammatory|neutral|inflammatory",
  "processingLevel": "whole_food|minimally_processed|ultra_processed",
  "fermentationLevel": "none|low|medium|high",
  "gutLiningSupport": "strong|moderate|weak",
  "scfaPotential": "high|medium|low",
  "plateQuadrants": { "fiber": 40, "fermented": 20, "protein": 25, "fats": 15 },
  "keyNutrients": { "magnesium": "high", "omega3": "high", "zinc": "moderate", "vitaminC": "moderate", "b12": "high" },
  "foods": [
    { "name": "string", "emoji": "string", "biotic": "prebiotic|probiotic|postbiotic|protein", "confidence": "high|medium|low" }
  ],
  "missingBiotics": [],
  "whatThisMealDoes": "1–2 sentences on what this meal does WELL for your food system — lead with the positives",
  "suggestions": ["string", "string", "string"],
  "overallAssessment": "string (1–2 sentences, warm and practical, reference EatoBiotics framework)",
  "nutrition": {
    "calories": 520,
    "protein_g": 38,
    "carbs_g": 45,
    "fat_g": 18,
    "fibre_g": 12
  }
}

missingBiotics should list any of ["prebiotic", "probiotic", "postbiotic"] not represented in the foods.
suggestions should give 3 specific, practical additions or swaps that would naturally complement this meal.
whatThisMealDoes should always highlight what IS working — never start with a negative.
nutrition values should be integers representing realistic estimates for the whole meal visible.

If you cannot identify the meal clearly (blurry, non-food image, etc.), return exactly: {"error": "Could not identify foods in this image. Please try a clearer photo of your meal."}`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Analysis not available" }, { status: 503 })
    }

    const body = await req.json() as {
      imageBase64?: string
      mimeType?: "image/jpeg" | "image/png" | "image/webp"
      description?: string
    }

    const { imageBase64, mimeType, description } = body

    // Must have either an image or a text description
    if (!imageBase64 && !description) {
      return NextResponse.json({ error: "Missing image or description" }, { status: 400 })
    }

    // Validate size: base64 of 5MB = ~6.8MB string
    if (imageBase64 && imageBase64.length > 7_000_000) {
      return NextResponse.json({ error: "Image too large. Please use an image under 5MB." }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Build message content — image path or text-only path
    type MsgContent = MessageParam["content"]
    let messageContent: MsgContent

    if (imageBase64 && mimeType) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: imageBase64,
          },
        },
        {
          type: "text",
          text: ANALYSIS_PROMPT,
        },
      ]
    } else {
      // Text-only description path
      messageContent = [
        {
          type: "text",
          text: `${ANALYSIS_PROMPT}\n\nMeal description: ${description}`,
        },
      ]
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""

    // Strip any markdown fences just in case
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "Could not parse analysis. Please try again." }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("[analyse-plate] error:", err)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
