import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import {
  PLATE_DEFINITIONS,
  createFallbackPlateRecipe,
  slugify,
  type PlateRecipe,
} from "@/lib/plate-builder-recipe"

export const runtime = "nodejs"

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
  creativeSeed: z.string().max(160).optional().default(""),
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
  imageGenerated: z.boolean().optional(),
  imageModel: z.string().optional(),
  imagePrompt: z.string().optional(),
  referenceStyleUsed: z.boolean().optional(),
})

const STYLE_REFERENCE_PATHS = [
  ["public", "plate-builder", "food-1.png"],
  ["public", "plate-builder", "food-2.png"],
  ["public", "plate-builder", "food-3.png"],
  ["Food Images", "Food 8.0.png"],
  ["Food Images", "Food 9.0.png"],
]

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
- Creative seed: ${input.creativeSeed || "create a fresh, different variation from previous runs"}

Naming rule:
- If there is no user dish idea, the recipe name must be "${plate.name.replace(/^The /, "")} with [Capitalised Protein]".
- Do not put the goal, country, or descriptive adjectives before the plate name.
- Use title case for the protein.

Recipe rules:
- Do not simply repeat the default plate. Create a distinct dish variation every time.
- Treat the creative seed as mandatory variation pressure. Change at least 4 meaningful elements from the default selected plate: supporting plants, sauce/dressing, fermented element, texture, herb/spice profile, cooking method, or finish.
- Keep the selected plate identity, but vary the supporting plants, dressing, texture, cooking method, and flavour direction.
- Ingredients must be specific, cookable, and useful for a real recipe.
- Method steps must tell someone how to make the food, not how to style a photo.
- Shopping sections should use normal shopping language, not abstract score language.
- Scores and nutrition should vary within believable ranges based on the chosen ingredients.
- The slug should be based on the recipe name only; the server will append a unique suffix.

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

function buildImagePrompt(recipe: PlateRecipe): string {
  const ingredientContext = [
    ...recipe.ingredients,
    ...recipe.shoppingSections.flatMap((section) => section.items),
  ].join(", ")

  return `Create a premium EatoBiotics food image for "${recipe.name}".

Visual style:
- Square 1:1 overhead editorial food photography.
- Pure white background only.
- No ceramic plate, no bowl rim, no cutlery, no table, no props, no text.
- Arrange the food itself as a vibrant composed bowl/plate shape, like separated glossy ingredient clusters on white.
- Premium health-food campaign quality: crisp detail, appetising, colourful, fresh, abundant, clean, high contrast.
- Match the EatoBiotics reference style: isolated ingredients, vivid greens, warm golds, bright fermented accents, seeds and herbs, polished social content.
- Do not create a plain dinner plate. Do not use a beige bowl. Do not crop awkwardly.

Use these recipe ingredients as the visual source:
${ingredientContext}

The image must look like a unique newly created dish, not a copy of an existing template.`
}

async function getStyleReferenceImages(): Promise<Array<{ bytes: ArrayBuffer; filename: string }>> {
  const cwd = process.cwd()
  const images: Array<{ bytes: ArrayBuffer; filename: string }> = []
  for (const segments of STYLE_REFERENCE_PATHS) {
    const filePath = path.join(cwd, ...segments)
    try {
      const file = await readFile(filePath)
      images.push({
        bytes: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer,
        filename: segments[segments.length - 1],
      })
    } catch {
      // Missing reference images should not prevent recipe generation.
    }
  }
  return images
}

async function generateImageWithOpenAI(recipe: PlateRecipe): Promise<{ url?: string; base64?: string; prompt: string; model: string; referenceStyleUsed: boolean } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = buildImagePrompt(recipe)
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
  const references = await getStyleReferenceImages()
  if (references.length === 0) return null

  const postEdit = async (imageFieldName: "image[]" | "image") => {
    const form = new FormData()
    form.append("model", model)
    form.append("prompt", prompt)
    form.append("size", "1024x1024")
    form.append("quality", "high")
    form.append("n", "1")
    for (const reference of references.slice(0, 4)) {
      form.append(imageFieldName, new Blob([reference.bytes], { type: "image/png" }), reference.filename)
    }

    return fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    })
  }

  let response = await postEdit("image[]")
  if (!response.ok) {
    const firstError = await response.text()
    response = await postEdit("image")
    if (!response.ok) {
      console.error("[plate-builder] OpenAI image error", firstError, await response.text())
      return null
    }
  }

  const data = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> }
  const image = data.data?.[0]
  if (image?.url) return { url: image.url, prompt, model, referenceStyleUsed: true }
  if (image?.b64_json) return { base64: image.b64_json, prompt, model, referenceStyleUsed: true }
  return null
}

function withUniqueSlug(slug: string): string {
  const clean = slugify(slug)
  return `${clean}-${Date.now().toString(36)}`
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
      image_generated: recipe.imageGenerated ?? false,
      image_model: recipe.imageModel ?? null,
      image_prompt: recipe.imagePrompt ?? null,
      reference_style_used: recipe.referenceStyleUsed ?? false,
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

  if (
    error?.code === "42703" ||
    error?.message?.includes("image_generated") ||
    error?.message?.includes("image_model") ||
    error?.message?.includes("image_prompt") ||
    error?.message?.includes("reference_style_used")
  ) {
    const retry = await supabase
      .from("plate_recipes")
      .insert({
        slug: recipe.slug,
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
  recipe = { ...recipe, slug: withUniqueSlug(recipe.slug || recipe.name), createdAt: new Date().toISOString() }

  const image = await generateImageWithOpenAI(recipe)
  const imageUrl = image?.url ?? (image?.base64 ? await uploadGeneratedImage(recipe.slug, image.base64) : null)
  recipe = {
    ...recipe,
    ...(imageUrl ? { imageUrl } : {}),
    imageGenerated: Boolean(imageUrl),
    imageModel: image?.model,
    imagePrompt: image?.prompt ?? buildImagePrompt(recipe),
    referenceStyleUsed: image?.referenceStyleUsed ?? false,
  }

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
