import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getUserMembershipTier, canAccess } from "@/lib/membership"

/* ── Validation ─────────────────────────────────────────────────────── */

const bodySchema = z.object({
  goal: z.string().min(1).max(100),
  dietaryPreference: z.string().min(1).max(50),
  bioticsEmphasis: z.enum(["balanced", "prebiotic", "probiotic", "postbiotic"]),
  planPeriod: z.enum(["single_day", "full_week"]),
})

/* ── Anthropic client ───────────────────────────────────────────────── */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/* ── JSON schemas embedded in the prompt ───────────────────────────── */

const SINGLE_DAY_SCHEMA = `{
  "dayLabel": "string — e.g. 'Gut Reset — Omnivore'",
  "bioticsEmphasis": "balanced | prebiotic | probiotic | postbiotic",
  "dailyTotals": { "calories": number, "fibre_g": number, "protein_g": number, "carbs_g": number, "fat_g": number },
  "meals": [
    {
      "time": "string — e.g. '8:00am'",
      "name": "string — descriptive meal name",
      "foods": ["string array of 3-5 specific food items"],
      "biotics": ["array containing one or more of: prebiotic, probiotic, postbiotic"],
      "tip": "string — one short gut health tip for this meal",
      "nutrition": { "calories": number, "fibre_g": number, "protein_g": number, "carbs_g": number, "fat_g": number }
    }
  ],
  "gutHealthInsight": "string — one specific insight for this goal",
  "shoppingList": {
    "Fresh Produce": ["string array"],
    "Proteins": ["string array"],
    "Fermented & Dairy": ["string array"],
    "Grains & Legumes": ["string array"],
    "Pantry & Spices": ["string array"]
  }
}`

const FULL_WEEK_SCHEMA = `{
  "weekLabel": "string — e.g. 'Gut Reset Week — Omnivore'",
  "bioticsEmphasis": "balanced | prebiotic | probiotic | postbiotic",
  "days": [
    {
      "day": "Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday",
      "dailyTotals": { "calories": number, "fibre_g": number, "protein_g": number, "carbs_g": number, "fat_g": number },
      "meals": [
        {
          "time": "string",
          "name": "string",
          "foods": ["string array of max 4 items"],
          "biotics": ["prebiotic | probiotic | postbiotic"],
          "tip": "string",
          "nutrition": { "calories": number, "fibre_g": number, "protein_g": number, "carbs_g": number, "fat_g": number }
        }
      ]
    }
  ],
  "weeklyGutInsight": "string — one sentence weekly insight",
  "shoppingList": {
    "Fresh Produce": ["string array"],
    "Proteins": ["string array"],
    "Fermented & Dairy": ["string array"],
    "Grains & Legumes": ["string array"],
    "Pantry & Spices": ["string array"]
  }
}`

/* ── Prompt builder ─────────────────────────────────────────────────── */

function buildPrompt(
  goal: string,
  dietaryPreference: string,
  bioticsEmphasis: string,
  isFull: boolean,
): string {
  const emphasisInstruction =
    bioticsEmphasis === "balanced"
      ? "Include a good balance of all three biotics across meals."
      : `Put extra emphasis on ${bioticsEmphasis} foods — make sure the majority of meals strongly feature ${bioticsEmphasis} foods.`

  const dietNote =
    dietaryPreference === "Vegan"
      ? "All foods must be strictly vegan — no meat, fish, dairy, or eggs. Use plant-based fermented foods (sauerkraut, kimchi, tempeh, water kefir, coconut yogurt)."
      : dietaryPreference === "Vegetarian"
        ? "No meat or fish. Dairy and eggs are allowed."
        : dietaryPreference === "Gluten-Free"
          ? "All foods must be strictly gluten-free. Use oats only if certified gluten-free. No wheat, barley, rye."
          : dietaryPreference === "Dairy-Free"
            ? "No dairy products. Use plant-based alternatives (oat milk, coconut yogurt, water kefir, dairy-free kefir)."
            : "No dietary restrictions."

  if (isFull) {
    return `Generate a 7-day gut health meal plan for:
- Goal: ${goal}
- Dietary preference: ${dietaryPreference}
- Biotics emphasis: ${bioticsEmphasis}

Dietary rules: ${dietNote}
${emphasisInstruction}

Rules:
- Exactly 3 meals per day (breakfast, lunch, dinner) — no snacks
- Max 4 food items per meal
- Each meal must have at least one of: prebiotic, probiotic, or postbiotic tag
- Vary meals across days — do not repeat the same meal twice
- Include realistic, achievable everyday foods
- Fibre is the most important nutrient for gut health — target 30–40g total per day
- All 7 days must be included: Monday through Sunday

THE 3 BIOTICS (EatoBiotics framework):
- PREBIOTIC foods: garlic, onion, leeks, asparagus, oats, bananas (slightly underripe), chicory, Jerusalem artichoke, flaxseeds, apples, legumes, barley
- PROBIOTIC foods: natural yogurt, kefir, sauerkraut, kimchi, miso, tempeh, kombucha, live cheese
- POSTBIOTIC foods: wholegrains, resistant starch (cooled potato/rice), pulses, fermented foods after cooking, high-fibre vegetables, extra-virgin olive oil, dark chocolate (70%+), berries

Return ONLY this exact JSON structure, no markdown fences, no extra text:

${FULL_WEEK_SCHEMA}`
  }

  return `Generate a single-day gut health meal plate for:
- Goal: ${goal}
- Dietary preference: ${dietaryPreference}
- Biotics emphasis: ${bioticsEmphasis}

Dietary rules: ${dietNote}
${emphasisInstruction}

Rules:
- Include breakfast, lunch, dinner, and optionally one snack
- Each meal must have at least one of: prebiotic, probiotic, or postbiotic tag
- Include realistic, achievable everyday foods
- Fibre is the most important nutrient for gut health — target 30–40g total

THE 3 BIOTICS (EatoBiotics framework):
- PREBIOTIC foods: garlic, onion, leeks, asparagus, oats, bananas (slightly underripe), chicory, Jerusalem artichoke, flaxseeds, apples, legumes, barley
- PROBIOTIC foods: natural yogurt, kefir, sauerkraut, kimchi, miso, tempeh, kombucha, live cheese
- POSTBIOTIC foods: wholegrains, resistant starch (cooled potato/rice), pulses, fermented foods after cooking, high-fibre vegetables, extra-virgin olive oil, dark chocolate (70%+), berries

Return ONLY this exact JSON structure, no markdown fences, no extra text:

${SINGLE_DAY_SCHEMA}`
}

/* ── Repair incomplete JSON ─────────────────────────────────────────── */

function repairJson(raw: string): string {
  // Count unmatched braces and brackets
  let braces = 0
  let brackets = 0
  let inString = false
  let escape = false

  for (const ch of raw) {
    if (escape) { escape = false; continue }
    if (ch === "\\" && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === "{") braces++
    else if (ch === "}") braces--
    else if (ch === "[") brackets++
    else if (ch === "]") brackets--
  }

  let repaired = raw
  // Close any open string
  if (inString) repaired += '"'
  // Close open arrays
  for (let i = 0; i < brackets; i++) repaired += "]"
  // Close open objects
  for (let i = 0; i < braces; i++) repaired += "}"

  return repaired
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // 1. Auth + tier gate
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  const tier = await getUserMembershipTier(user.id)
  if (!canAccess(tier, "create_my_plate")) {
    return NextResponse.json({ error: "A paid EatoBiotics plan is required to use Create My Plate" }, { status: 403 })
  }

  // 2. Validate body
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const isFull = body.planPeriod === "full_week"

  // 2. Build prompt
  const userPrompt = buildPrompt(
    body.goal,
    body.dietaryPreference,
    body.bioticsEmphasis,
    isFull,
  )

  // 3. Call Claude
  let message: Anthropic.Message
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: isFull ? 8000 : 5000,
      system:
        "You are a gut health nutrition planner using the EatoBiotics 3-Biotics framework. You return ONLY valid JSON — no markdown code fences, no commentary, no extra text before or after the JSON.",
      messages: [{ role: "user", content: userPrompt }],
    })
  } catch (err) {
    console.error("[create-plate] Claude error:", err)
    return NextResponse.json({ error: "Failed to generate plate" }, { status: 500 })
  }

  // 4. Parse response
  const firstBlock = message.content[0]
  if (!firstBlock || firstBlock.type !== "text") {
    return NextResponse.json({ error: "Unexpected response format" }, { status: 500 })
  }

  let raw = firstBlock.text.trim()

  // Strip any accidental markdown fences
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "")

  // Attempt JSON parse; if truncated due to max_tokens, repair
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    if (message.stop_reason === "max_tokens") {
      try {
        parsed = JSON.parse(repairJson(raw))
      } catch {
        return NextResponse.json({ error: "Response was truncated and could not be repaired" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Invalid JSON in response" }, { status: 500 })
    }
  }

  return NextResponse.json(parsed)
}
