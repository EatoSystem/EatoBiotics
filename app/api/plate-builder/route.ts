import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import {
  PLATE_DEFINITIONS,
  createFallbackPlateRecipe,
  slugify,
  type PlateRecipe,
} from "@/lib/plate-builder-recipe"

const requestSchema = z.object({
  plateId: z.enum(["foundation", "function", "diversity", "restoration"]),
  dishIdea: z.string().max(120).optional().default(""),
  country: z.string().max(80).optional().default("None"),
  protein: z.string().max(80).optional().default(""),
  vegetables: z.string().max(240).optional().default(""),
  avoid: z.string().max(160).optional().default(""),
  dietaryStyle: z.string().max(80).optional().default("Flexible"),
  cookingTime: z.string().max(80).optional().default("25 minutes"),
  goal: z.string().max(80).optional().default("balance"),
  flavour: z.string().max(80).optional().default("Bright and zesty"),
  publish: z.boolean().optional().default(true),
})

const recipeSchema: z.ZodType<PlateRecipe> = z.object({
  slug: z.string(),
  plateId: z.enum(["foundation", "function", "diversity", "restoration"]),
  plateName: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  goal: z.string(),
  flavour: z.string(),
  dietaryStyle: z.string(),
  time: z.object({ prep: z.string(), cook: z.string(), total: z.string() }),
  score: z.object({
    overall: z.number(),
    prebiotic: z.number(),
    probiotic: z.number(),
    postbiotic: z.number(),
    balance: z.number(),
  }),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fibre: z.number(),
  }),
  ingredients: z.array(z.string()),
  method: z.array(z.string()),
  shoppingSections: z.array(z.object({
    title: z.string(),
    items: z.array(z.string()),
    color: z.string(),
  })),
  weeklyRole: z.string(),
  disclaimer: z.string(),
  createdAt: z.string(),
})

function stripFences(value: string): string {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "")
}

function buildRecipePrompt(input: z.infer<typeof requestSchema>) {
  const plate = PLATE_DEFINITIONS[input.plateId]

  return `Create one EatoBiotics recipe for the ${plate.name}.

Purpose:
- This is a practical recipe people can cook and share.
- It must feel like EatoBiotics: food system, prebiotics, probiotics, postbiotic support, colourful, useful, premium, educational.
- Avoid medical claims. No cures, treatment, diagnosis, or disease promises.

User inputs:
- Dish idea: ${input.dishIdea || "none"}
- Main protein: ${input.protein || plate.defaultProtein}
- Vegetables/grains/ferments/toppings: ${input.vegetables || plate.defaultPlants.join(", ")}
- Country add-on: ${input.country}
- Dietary style: ${input.dietaryStyle}
- Cooking time: ${input.cookingTime}
- Goal: ${input.goal}
- Flavour direction: ${input.flavour}
- Foods to avoid: ${input.avoid || "none"}

Naming rule:
- If there is no user dish idea, the recipe name must be "${plate.name.replace(/^The /, "")} with [Capitalised Protein]".
- Do not put the goal, country, or descriptive adjectives before the plate name.
- Use title case for the protein.

Return ONLY valid JSON matching this exact shape:
{
  "slug": "short-url-slug",
  "plateId": "${input.plateId}",
  "plateName": "${plate.name}",
  "name": "Recipe name",
  "description": "One appetising sentence beginning with the food, not with 'A user-created...'",
  "imageUrl": "${plate.image}",
  "goal": "${input.goal}",
  "flavour": "${input.flavour}",
  "dietaryStyle": "${input.dietaryStyle}",
  "time": { "prep": "10 min", "cook": "15 min", "total": "25 min" },
  "score": { "overall": 80, "prebiotic": 80, "probiotic": 75, "postbiotic": 78, "balance": 82 },
  "nutrition": { "calories": 520, "protein": 35, "carbs": 55, "fat": 20, "fibre": 14 },
  "ingredients": ["specific ingredient role", "specific ingredient role"],
  "method": ["actual cooking step", "actual cooking step", "actual cooking step", "actual cooking step"],
  "shoppingSections": [
    { "title": "Protein", "items": ["Chicken"], "color": "var(--icon-green)" },
    { "title": "Plants", "items": ["asparagus"], "color": "var(--icon-lime)" },
    { "title": "Finish", "items": ["fermented side"], "color": "var(--icon-orange)" }
  ],
  "weeklyRole": "One practical educational sentence about how this plate fits the EatoBiotics framework.",
  "disclaimer": "EatoBiotics recipes and scores are educational and not medical advice. They do not diagnose, treat, prevent, or cure any condition.",
  "createdAt": "${new Date().toISOString()}"
}`
}

async function generateRecipeWithOpenAI(input: z.infer<typeof requestSchema>): Promise<PlateRecipe | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RECIPE_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You create practical EatoBiotics recipes as strict JSON. Return only valid JSON.",
        },
        { role: "user", content: buildRecipePrompt(input) },
      ],
    }),
  })

  if (!response.ok) {
    console.error("[plate-builder] OpenAI recipe error", await response.text())
    return null
  }

  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }
  const text = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ?? ""
  if (!text) return null

  try {
    const parsed = JSON.parse(stripFences(text)) as unknown
    return recipeSchema.parse(parsed)
  } catch (error) {
    console.error("[plate-builder] OpenAI recipe parse error", error)
    return null
  }
}

async function uploadGeneratedImage(slug: string, base64: string): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const bucket = process.env.SUPABASE_RECIPE_IMAGE_BUCKET || "plate-recipes"
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"))
  const path = `${slug}.png`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
    })

  if (error) {
    console.error("[plate-builder] Supabase image upload error", error)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

async function generateImageWithOpenAI(recipe: PlateRecipe): Promise<{ url?: string; base64?: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = `Overhead editorial food photography on pure white background, no plate rim visible. Create a vibrant EatoBiotics dish image for "${recipe.name}". Include the recipe ingredients and make it match a premium clean health-food brand: crisp, appetising, colourful, glossy fresh textures, square composition. No text in image.`

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "medium",
      n: 1,
    }),
  })

  if (!response.ok) {
    console.error("[plate-builder] OpenAI image error", await response.text())
    return null
  }

  const data = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> }
  const image = data.data?.[0]
  if (image?.url) return { url: image.url }
  if (image?.b64_json) return { base64: image.b64_json }
  return null
}

async function saveRecipe(recipe: PlateRecipe, publish: boolean) {
  const supabase = getSupabase()
  if (!supabase) return null

  const insertRecipe = async (slug: string) => supabase
    .from("plate_recipes")
    .insert({
      slug,
      plate_type: recipe.plateId,
      plate_name: recipe.plateName,
      name: recipe.name,
      description: recipe.description,
      image_url: recipe.imageUrl,
      goal: recipe.goal,
      flavour: recipe.flavour,
      dietary_style: recipe.dietaryStyle,
      time: recipe.time,
      score: recipe.score,
      nutrition: recipe.nutrition,
      ingredients: recipe.ingredients,
      method: recipe.method,
      shopping_sections: recipe.shoppingSections,
      weekly_role: recipe.weeklyRole,
      disclaimer: recipe.disclaimer,
      is_published: publish,
    })
    .select("slug")
    .single()

  const { data, error } = await insertRecipe(recipe.slug)

  if (error?.code === "23505") {
    const withSuffix = `${recipe.slug}-${Date.now().toString(36).slice(-5)}`
    const retry = await insertRecipe(withSuffix)
    if (!retry.error) return retry.data as { slug: string }
  }

  if (error) {
    console.error("[plate-builder] Supabase save error", error)
    return null
  }

  return data as { slug: string }
}

export async function POST(req: NextRequest) {
  let input: z.infer<typeof requestSchema>
  try {
    input = requestSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid plate builder request" }, { status: 400 })
  }

  const generated = await generateRecipeWithOpenAI(input)
  let recipe = generated ?? createFallbackPlateRecipe(input)
  recipe = { ...recipe, slug: slugify(recipe.slug || recipe.name), createdAt: new Date().toISOString() }

  const image = await generateImageWithOpenAI(recipe)
  const imageUrl = image?.url ?? (image?.base64 ? await uploadGeneratedImage(recipe.slug, image.base64) : null)
  if (imageUrl) recipe = { ...recipe, imageUrl }

  const saved = await saveRecipe(recipe, input.publish)
  const slug = saved?.slug ?? recipe.slug

  return NextResponse.json({
    recipe: { ...recipe, slug },
    publicUrl: `/recipe/${slug}`,
    saved: Boolean(saved),
    generatedBy: generated ? "openai" : "fallback",
    imageGenerated: Boolean(imageUrl),
  })
}
