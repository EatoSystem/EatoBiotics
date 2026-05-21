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
  imageOptions: z.array(z.string()).optional(),
  imageModel: z.string().optional(),
  imagePrompt: z.string().optional(),
  referenceStyleUsed: z.boolean().optional(),
})

function boundedScore(base: number, spread: number, hash: number): number {
  return Math.max(62, Math.min(96, base + (Math.abs(hash) % spread)))
}

function scoreHash(value: string): number {
  return value.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 17)
}

function recalculateRecipeScores(recipe: PlateRecipe, input: z.infer<typeof requestSchema>): PlateRecipe {
  const ingredientText = [
    recipe.name,
    recipe.description,
    recipe.ingredients.join(" "),
    recipe.method.join(" "),
    recipe.shoppingSections.flatMap((section) => section.items).join(" "),
    input.creativeSeed,
  ].join(" | ").toLowerCase()
  const hash = scoreHash(ingredientText)
  const plantItems = recipe.shoppingSections
    .filter((section) => !/protein/i.test(section.title))
    .flatMap((section) => section.items)
  const fermentedHits = ["kimchi", "sauerkraut", "kefir", "yogurt", "miso", "pickle", "fermented"].filter((term) => ingredientText.includes(term)).length
  const seedHits = ["seed", "pumpkin", "sesame", "hemp", "chia", "flax", "walnut", "almond"].filter((term) => ingredientText.includes(term)).length
  const colourHits = ["kale", "cabbage", "berry", "beet", "carrot", "avocado", "cucumber", "greens", "herb", "pepper", "radish"].filter((term) => ingredientText.includes(term)).length

  const prebiotic = boundedScore(66 + Math.min(12, plantItems.length * 2) + Math.min(6, colourHits), 9, hash)
  const probiotic = boundedScore(64 + Math.min(12, fermentedHits * 5), 12, Math.floor(hash / 3))
  const postbiotic = boundedScore(66 + Math.min(10, seedHits * 3) + Math.min(5, colourHits), 11, Math.floor(hash / 7))
  const balance = boundedScore(68 + Math.min(10, recipe.ingredients.length) + Math.min(5, plantItems.length), 10, Math.floor(hash / 11))
  const overall = Math.round((prebiotic + probiotic + postbiotic + balance) / 4)

  return {
    ...recipe,
    score: { overall, prebiotic, probiotic, postbiotic, balance },
  }
}

const STYLE_REFERENCE_PATHS = [
  ["public", "plate-builder", "food-1.png"],
  ["public", "plate-builder", "food-2.png"],
  ["public", "plate-builder", "food-3.png"],
  ["Food Images", "Food 8.0.png"],
  ["Food Images", "Food 9.0.png"],
]

const variationAngles = [
  "crisp citrus herb with fresh crunch",
  "charred greens with fermented brightness",
  "berry, seed, and peppery leaf contrast",
  "warm ginger sesame with glossy greens",
  "golden roast vegetables with yogurt herbs",
  "zesty pickle, avocado, and seed texture",
  "smoky protein with cool cucumber and herbs",
  "sprouted legumes with lemon oil and cabbage",
]

const plantSwapIdeas = [
  "swap at least two default plants for seasonal alternatives",
  "add one bitter green, one colourful raw element, and one cooked element",
  "use one grain or pulse, one fermented accent, one seed, and one glossy herb finish",
  "combine one crisp vegetable, one soft protein, one bright acid, and one creamy element",
]

const heroProteinIdeas: Record<z.infer<typeof requestSchema>["plateId"], string[]> = {
  foundation: ["salmon", "mackerel", "chicken", "soft eggs", "tempeh", "white beans", "trout", "tofu"],
  function: ["chicken", "tuna", "eggs", "turkey", "tempeh", "salmon", "lentil falafel", "tofu"],
  diversity: ["tempeh", "tofu", "chickpea patties", "lentil kofta", "white beans", "edamame", "eggs", "salmon"],
  restoration: ["trout", "chicken", "soft eggs", "tofu", "salmon", "white beans", "miso tempeh", "turkey"],
}

const nameAngles = ["Lemon Herb", "Miso Sesame", "Charred Green", "Citrus Crunch", "Golden Yogurt", "Pickled Herb", "Ginger Lime", "Smoky Seeded"]

function seedNumber(value: string): number {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function pickVariation(items: string[], seed: number, offset = 0): string {
  return items[Math.abs(seed + offset) % items.length]
}

function buildVariationBrief(input: z.infer<typeof requestSchema>) {
  const seed = seedNumber(`${input.plateId}-${input.goal}-${input.flavour}-${input.creativeSeed}-${Date.now()}`)
  const suggestedProtein = input.protein.trim() || pickVariation(heroProteinIdeas[input.plateId], seed, 17)
  return {
    angle: pickVariation(variationAngles, seed),
    plantRule: pickVariation(plantSwapIdeas, seed, 5),
    scoreBias: 3 + (seed % 9),
    methodStyle: pickVariation(["roasted", "charred", "steamed and dressed", "raw and cooked contrast", "quick sauteed", "warm grain bowl"], seed, 11),
    suggestedProtein,
    nameAngle: pickVariation(nameAngles, seed, 19),
  }
}

function stripFences(value: string): string {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "")
}

function buildRecipePrompt(input: z.infer<typeof requestSchema>) {
  const plate = PLATE_DEFINITIONS[input.plateId]
  const variation = buildVariationBrief(input)

  return `Create one EatoBiotics recipe for the ${plate.name}.

Purpose:
- This is a practical recipe people can cook and share.
- It must feel like EatoBiotics: food system, prebiotics, probiotics, postbiotic support, colourful, useful, premium, educational.
- Avoid medical claims. No cures, treatment, diagnosis, or disease promises.

User inputs:
- Dish idea: ${input.dishIdea || "none"}
- Main protein: ${input.protein || `choose a new hero ingredient; suggested for this run: ${variation.suggestedProtein}`}
- Vegetables/grains/ferments/toppings: ${input.vegetables || plate.defaultPlants.join(", ")}
- Country add-on: ${input.country}
- Dietary style: ${input.dietaryStyle}
- Cooking time: ${input.cookingTime}
- Goal: ${input.goal}
- Flavour direction: ${input.flavour}
- Foods to avoid: ${input.avoid || "none"}
- Creative seed: ${input.creativeSeed || "create a fresh, different variation from previous runs"}

Mandatory variation for this exact run:
- Creative angle: ${variation.angle}
- Hero ingredient for this run: ${variation.suggestedProtein}
- Name angle for this run: ${variation.nameAngle}
- Plant rule: ${variation.plantRule}
- Cooking/method style: ${variation.methodStyle}
- Score variation bias: ${variation.scoreBias}

Naming rule:
- If there is no user dish idea, the recipe name must start with "${plate.name.replace(/^The /, "")} with" and then include a unique hero phrase, such as "${plate.name.replace(/^The /, "")} with ${variation.nameAngle} ${variation.suggestedProtein.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}".
- Do not put the goal, country, or descriptive adjectives before the plate name.
- Do not return the bare default name "${plate.name.replace(/^The /, "")} with ${plate.defaultProtein.charAt(0).toUpperCase() + plate.defaultProtein.slice(1)}".
- Use title case for the hero phrase.

Recipe rules:
- Do not simply repeat the default plate. Create a distinct dish variation every time.
- Treat the creative seed as mandatory variation pressure. Change at least 4 meaningful elements from the default selected plate: supporting plants, sauce/dressing, fermented element, texture, herb/spice profile, cooking method, or finish.
- If no protein was provided by the user, do not automatically use the default protein. Use the hero ingredient suggested above or another distinct protein.
- Keep the selected plate identity, but vary the supporting plants, dressing, texture, cooking method, and flavour direction.
- Ingredients must be specific, cookable, and useful for a real recipe.
- Method steps must tell someone how to make the food, not how to style a photo.
- Shopping sections should use normal shopping language, not abstract score language.
- Scores and nutrition should vary within believable ranges based on the chosen ingredients.
- The slug should be based on the recipe name only; the server will append a unique suffix.
- Never return the same ingredient list, method, score set, or shopping list as a prior run using the selected plate defaults.

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
  "score": { "overall": 87, "prebiotic": 91, "probiotic": 76, "postbiotic": 84, "balance": 88 },
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

async function generateRecipeWithOpenAI(input: z.infer<typeof requestSchema>): Promise<{ recipe: PlateRecipe | null; warning?: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { recipe: null, warning: "OPENAI_API_KEY is missing" }

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
    return { recipe: null, warning: "OpenAI recipe request failed" }
  }

  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }
  const text = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ?? ""
  if (!text) return { recipe: null, warning: "OpenAI recipe returned no text" }

  try {
    const parsed = JSON.parse(stripFences(text)) as unknown
    return { recipe: recipeSchema.parse(parsed) }
  } catch (error) {
    console.error("[plate-builder] OpenAI recipe parse error", error)
    return { recipe: null, warning: "OpenAI recipe JSON could not be parsed" }
  }
}

async function uploadImageBytes(slug: string, bytes: Uint8Array, index = 0): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const bucket = process.env.SUPABASE_RECIPE_IMAGE_BUCKET || "plate-recipes"
  const path = `${slug}-${index + 1}.png`
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

async function uploadGeneratedImage(slug: string, base64: string, index = 0): Promise<string | null> {
  return uploadImageBytes(slug, Uint8Array.from(Buffer.from(base64, "base64")), index)
}

async function uploadRemoteGeneratedImage(slug: string, url: string, index = 0): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    return uploadImageBytes(slug, bytes, index)
  } catch (error) {
    console.error("[plate-builder] Remote image upload error", error)
    return null
  }
}

function buildImagePrompt(recipe: PlateRecipe): string {
  const ingredientContext = [
    ...recipe.ingredients,
    ...recipe.shoppingSections.flatMap((section) => section.items),
  ].join(", ")
  const visualSeed = scoreHash(`${recipe.slug}-${recipe.name}-${recipe.description}`)
  const layouts = [
    "a diagonal river composition from top-left to bottom-right with the hero protein crossing the centre and plants grouped in uneven colour islands",
    "a loose crescent composition with negative white space through the middle and ingredients arcing around one side",
    "a segmented editorial grid with irregular ingredient blocks, one generous hero cluster, and scattered seeds breaking the edges",
    "a radial burst that is not circular: hero ingredient slightly off-centre, long greens pointing outward, small ferments and seeds placed asymmetrically",
    "a stacked vertical composition with the hero ingredient high in the frame, grains and pulses lower, and herbs scattered like movement",
    "a wide asymmetric platterless composition with two strong colour zones, a bright acid accent, and separated textures rather than a neat bowl",
  ]
  const heroPlacements = [
    "hero ingredient angled at 30 degrees",
    "hero ingredient sliced and fanned in a short line",
    "hero ingredient broken into two distinct clusters",
    "hero ingredient placed off-centre with plants wrapping around it",
    "hero ingredient running horizontally across one third of the image",
  ]
  const colourAccents = [
    "deep purple and emerald contrast",
    "gold, citrus yellow, and glossy green accents",
    "red fermented accents against pale grains",
    "orange root vegetables with dark leafy greens",
    "berry-like reds with avocado green and seed texture",
    "bright herb oil dots and lemon zest highlights",
  ]
  const textureRules = [
    "include at least one ribbon-cut or shaved vegetable",
    "include one crunchy seed trail that breaks the outline",
    "include one glossy dressing drizzle, but no sauce pool",
    "include a fermented accent as a small vivid cluster",
    "include herbs scattered naturally, not symmetrically",
    "include one cooked item and one raw item with visibly different textures",
  ]
  const pick = (items: string[], offset: number) => items[Math.abs(visualSeed + offset) % items.length]
  const layout = pick(layouts, 0)
  const heroPlacement = pick(heroPlacements, 7)
  const colourAccent = pick(colourAccents, 13)
  const textureRule = pick(textureRules, 19)

  return `Create a premium EatoBiotics food image for "${recipe.name}".

Visual style:
- Square 1:1 overhead editorial food photography.
- Pure white background only.
- No ceramic plate, no bowl rim, no cutlery, no table, no props, no text.
- Arrange the food itself as a vibrant premium ingredient composition on white, like separated glossy ingredient clusters.
- Avoid a generic circular dinner-plate look. Avoid a perfect round bowl silhouette. Avoid reusing the same quinoa-left, greens-top, cabbage-right, chickpeas-bottom cluster map.
- Premium health-food campaign quality: crisp detail, appetising, colourful, fresh, abundant, clean, high contrast.
- Match the EatoBiotics reference style: isolated ingredients, vivid greens, warm golds, bright fermented accents, seeds and herbs, polished social content.
- Do not create a plain dinner plate. Do not use a beige bowl. Do not crop awkwardly.

Required uniqueness for this exact image:
- Composition layout: ${layout}.
- Hero placement: ${heroPlacement}.
- Colour accent: ${colourAccent}.
- Texture rule: ${textureRule}.
- Change the spatial map from previous EatoBiotics images while preserving the same premium white-background style.
- Make the dish recognisable from the listed ingredients, but do not make a near-copy of any reference image.

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

async function generateImageWithOpenAI(recipe: PlateRecipe): Promise<{ urls: string[]; base64s: string[]; prompt: string; model: string; referenceStyleUsed: boolean } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = buildImagePrompt(recipe)
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5"
  const references = await getStyleReferenceImages()
  if (references.length === 0) return null

  const postEdit = async (imageFieldName: "image[]" | "image", count: 1 | 4) => {
    const form = new FormData()
    form.append("model", model)
    form.append("prompt", prompt)
    form.append("size", "1024x1024")
    form.append("quality", "high")
    form.append("n", String(count))
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

  let response: Response | null = null
  const errors: string[] = []
  for (const count of [4, 1] as const) {
    for (const field of ["image[]", "image"] as const) {
      response = await postEdit(field, count)
      if (response.ok) break
      errors.push(await response.text())
      response = null
    }
    if (response?.ok) break
  }

  if (!response?.ok) {
    console.error("[plate-builder] OpenAI image error", errors.join("\n"))
    return null
  }

  const data = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> }
  const images = data.data ?? []
  const urls = images.map((image) => image.url).filter((url): url is string => Boolean(url))
  const base64s = images.map((image) => image.b64_json).filter((base64): base64 is string => Boolean(base64))
  if (urls.length > 0 || base64s.length > 0) return { urls, base64s, prompt, model, referenceStyleUsed: true }
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
      image_options: recipe.imageOptions ?? [],
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
    error?.message?.includes("image_options")
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
        image_generated: recipe.imageGenerated ?? false,
        image_model: recipe.imageModel ?? null,
        image_prompt: recipe.imagePrompt ?? null,
        reference_style_used: recipe.referenceStyleUsed ?? false,
        is_published: publish,
      })
      .select("slug")
      .single()
    if (!retry.error) return retry.data as { slug: string }
  }

  if (
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
  let recipe = generated.recipe ?? createFallbackPlateRecipe(input)
  recipe = recalculateRecipeScores(recipe, input)
  recipe = { ...recipe, slug: withUniqueSlug(recipe.slug || recipe.name), createdAt: new Date().toISOString() }

  const image = await generateImageWithOpenAI(recipe)
  const uploadedFromBase64 = image?.base64s?.length
    ? await Promise.all(image.base64s.map((base64, index) => uploadGeneratedImage(recipe.slug, base64, index)))
    : []
  const uploadedFromUrls = image?.urls?.length
    ? await Promise.all(image.urls.map((url, index) => uploadRemoteGeneratedImage(recipe.slug, url, index + uploadedFromBase64.length)))
    : []
  const uploadedUrls = [...uploadedFromBase64, ...uploadedFromUrls].filter((url): url is string => Boolean(url))
  const imageOptions = Array.from(new Set(uploadedUrls.length > 0 ? uploadedUrls : image?.urls ?? []))
  const imageUrl = imageOptions[0] ?? null
  recipe = {
    ...recipe,
    ...(imageUrl ? { imageUrl } : {}),
    imageGenerated: Boolean(imageUrl),
    imageOptions,
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
    generatedBy: generated.recipe ? "openai" : "fallback",
    imageGenerated: Boolean(imageUrl),
    imageOptions,
    warnings: [
      generated.warning,
      !imageUrl ? "Image generation failed or returned no usable image" : null,
      !saved ? "Recipe page was not saved to Supabase" : null,
    ].filter(Boolean),
  })
}

export async function PATCH(req: NextRequest) {
  let body: { slug?: string; imageUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid image selection request" }, { status: 400 })
  }

  const slug = body.slug?.trim()
  const imageUrl = body.imageUrl?.trim()
  if (!slug || !imageUrl) {
    return NextResponse.json({ error: "Missing slug or imageUrl" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 })
  }

  const { error } = await supabase
    .from("plate_recipes")
    .update({
      image_url: imageUrl,
      image_generated: true,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)

  if (error) {
    console.error("[plate-builder] Supabase image selection error", error)
    return NextResponse.json({ error: "Could not update selected recipe image" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
