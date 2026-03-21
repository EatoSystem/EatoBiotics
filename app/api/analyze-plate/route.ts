import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const ANALYSIS_PROMPT = `You are a gut health nutrition analyst using the EatoBiotics framework (prebiotics, probiotics, postbiotics).

Look at this meal photo and identify every distinct food item visible.

For each food, classify it as:
- prebiotic: fibrous plant foods that feed good gut bacteria (vegetables, fruits, wholegrains, legumes, garlic, onion, leeks, asparagus, oats, bananas, etc.)
- probiotic: live cultures / fermented foods (yogurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, etc.)
- postbiotic: health compounds produced by fermentation or aged foods (aged cheese, sourdough bread, vinegar, certain fermented foods with heat-killed bacteria)
- protein: meat, fish, eggs, legumes (as protein source)

Return ONLY valid JSON with this exact structure, no markdown fences:
{
  "foods": [
    { "name": "string", "emoji": "string", "biotic": "prebiotic|probiotic|postbiotic|protein", "confidence": "high|medium|low" }
  ],
  "missingBiotics": [],
  "suggestions": ["string", "string", "string"],
  "overallAssessment": "string (1-2 sentences, warm and practical, reference EatoBiotics framework)"
}

missingBiotics should list any of ["prebiotic", "probiotic", "postbiotic"] not represented in the foods.
suggestions should give 3 specific, actionable food additions or swaps.

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
