import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const ANALYSIS_PROMPT = `You are a gut health nutrition analyst using the EatoBiotics framework (prebiotics, probiotics, postbiotics).

Look at this meal photo carefully and identify EVERY distinct food item visible — including garnishes, seeds, dressings, sauces, and side items. Aim to identify 4–8 items typically visible in a meal photo. Don't miss small items like seeds on avocado, dressing, or herbs.

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

POSTBIOTIC presence — up to 15 points:
  1+ postbiotic source: 15 pts
  None: 5 pts (floor)

PROTEIN quality for gut lining — up to 15 points:
  High-quality protein (grilled chicken, fish, eggs, legumes): 15 pts
  Some protein present: 12 pts
  No protein: 0 pts

Calibration examples:
- Grilled chicken + asparagus + avocado + mixed greens: ~70 (strong prebiotics + quality protein, missing fermented)
- Salmon + kimchi + brown rice + broccoli: ~90 (excellent all-round)
- Plain chicken breast only: ~27 (minimal gut benefit alone)
- Full gut health bowl (veg + yogurt + sourdough + chicken): ~95+

Set "prebioticStrength" to "strong" (3+ prebiotic foods), "moderate" (1–2 prebiotic foods), or "low" (0 prebiotic foods).

Return ONLY valid JSON with this exact structure, no markdown fences:
{
  "score": 70,
  "prebioticStrength": "strong|moderate|low",
  "foods": [
    { "name": "string", "emoji": "string", "biotic": "prebiotic|probiotic|postbiotic|protein", "confidence": "high|medium|low" }
  ],
  "missingBiotics": [],
  "whatThisMealDoes": "1–2 sentences on what this meal does WELL for gut health — lead with the positives",
  "suggestions": ["string", "string", "string"],
  "overallAssessment": "string (1–2 sentences, warm and practical, reference EatoBiotics framework)"
}

missingBiotics should list any of ["prebiotic", "probiotic", "postbiotic"] not represented in the foods.
suggestions should give 3 specific, practical additions or swaps that would naturally complement this meal.
whatThisMealDoes should always highlight what IS working — never start with a negative.

If you cannot identify the meal clearly (blurry, non-food image, etc.), return exactly: {"error": "Could not identify foods in this image. Please try a clearer photo of your meal."}`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Analysis not available" }, { status: 503 })
    }

    const { imageBase64, mimeType } = await req.json() as {
      imageBase64: string
      mimeType: "image/jpeg" | "image/png" | "image/webp"
    }

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 })
    }

    // Validate size: base64 of 5MB = ~6.8MB string
    if (imageBase64.length > 7_000_000) {
      return NextResponse.json({ error: "Image too large. Please use an image under 5MB." }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
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
          ],
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
    console.error("[analyze-plate] error:", err)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
