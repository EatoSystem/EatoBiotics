"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  CheckCircle2,
  Clipboard,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react"
import type { PlateRecipe } from "@/lib/plate-builder-recipe"

type PlateId = "foundation" | "function" | "diversity" | "restoration"

type StudioForm = {
  plateId: PlateId
  dishIdea: string
  protein: string
  cuisine: string
  vegetables: string
  avoid: string
  dietaryStyle: string
  cookingTime: string
  goal: string
  flavour: string
  contentFocus: string
}

type ApiResponse = {
  recipe?: PlateRecipe
  publicUrl?: string
  saved?: boolean
  generatedBy?: "openai" | "fallback"
  imageGenerated?: boolean
  warnings?: string[]
}

const PLATES: Array<{ id: PlateId; name: string; note: string; color: string }> = [
  {
    id: "foundation",
    name: "The Food System Bowl",
    note: "The weekly system plate: clear, balanced, practical, repeatable.",
    color: "var(--icon-green)",
  },
  {
    id: "function",
    name: "The Immunity Plate",
    note: "A functional plate for energy, mood, immunity, and recovery content.",
    color: "var(--icon-yellow)",
  },
  {
    id: "diversity",
    name: "The Living Plate",
    note: "Plant diversity, colour, abundance, texture, and microbial variety.",
    color: "var(--icon-teal)",
  },
  {
    id: "restoration",
    name: "The Rebuild Plate",
    note: "A calmer recovery plate for restoration, routine, and consistency.",
    color: "var(--icon-orange)",
  },
]

const CUISINES = [
  "None",
  "Irish",
  "Mediterranean",
  "Japanese",
  "Korean",
  "Mexican",
  "Indian",
  "Nordic",
  "Thai",
  "Levantine",
  "Italian",
  "Spanish",
]

const GOALS = [
  "digestion",
  "energy",
  "immunity",
  "mood",
  "recovery",
  "skin",
  "diversity",
  "family meal",
  "budget meal",
  "meal prep",
]

const TIMES = ["10 minutes", "20 minutes", "30 minutes", "Batch cook", "5-day meal prep"]
const DIETARY = ["Flexible", "Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-light", "High protein", "Low cost"]
const FLAVOURS = ["Bright and zesty", "Warm and spiced", "Fresh and herb-led", "Creamy and fermented", "Smoky and roasted", "Clean and simple"]

const initialForm: StudioForm = {
  plateId: "foundation",
  dishIdea: "",
  protein: "",
  cuisine: "None",
  vegetables: "",
  avoid: "",
  dietaryStyle: "Flexible",
  cookingTime: "30 minutes",
  goal: "digestion",
  flavour: "Bright and zesty",
  contentFocus: "Recipe page, Substack section, Instagram carousel, and short video script",
}

function recipeUrl(publicUrl?: string) {
  if (!publicUrl) return ""
  if (publicUrl.startsWith("http")) return publicUrl
  return publicUrl
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function buildSeoTitle(recipe: PlateRecipe | null) {
  if (!recipe) return ""
  return `${recipe.name} | ${recipe.plateName} | EatoBiotics`
}

function buildMetaDescription(recipe: PlateRecipe | null) {
  if (!recipe) return ""
  return `${recipe.description} Includes ingredients, method, nutrition estimate, shopping list, and EatoBiotics food-system guidance.`
}

function buildSubstackDraft(recipe: PlateRecipe | null) {
  if (!recipe) return ""
  return [
    `# ${recipe.name}`,
    "",
    recipe.description,
    "",
    "## Why this plate works",
    recipe.weeklyRole,
    "",
    "## Ingredients",
    ...recipe.ingredients.map((item) => `- ${item}`),
    "",
    "## Method",
    ...recipe.method.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Shopping list",
    ...recipe.shoppingSections.flatMap((section) => [
      `### ${section.title}`,
      ...section.items.map((item) => `- ${item}`),
    ]),
    "",
    recipe.disclaimer,
  ].join("\n")
}

function buildCarousel(recipe: PlateRecipe | null) {
  if (!recipe) return ""
  return [
    `Slide 1: ${recipe.name}`,
    `Slide 2: The plate idea - ${recipe.description}`,
    `Slide 3: The food-system pattern - ${recipe.weeklyRole}`,
    `Slide 4: Ingredients - ${recipe.ingredients.slice(0, 5).join("; ")}`,
    `Slide 5: Method - ${recipe.method.slice(0, 3).join(" ")}`,
    `Slide 6: Save this plate and build your own food system inside you.`,
  ].join("\n\n")
}

function buildVideoScript(recipe: PlateRecipe | null) {
  if (!recipe) return ""
  return [
    `Hook: This is ${recipe.name}, an EatoBiotics plate built to make the food system inside you visible.`,
    `Shot 1: Show the ingredients laid out on white. Mention the plate type: ${recipe.plateName}.`,
    `Shot 2: Build the centre of the plate. ${recipe.ingredients[0] ?? ""}`,
    `Shot 3: Add the plant base and colour. ${recipe.ingredients[1] ?? ""}`,
    `Shot 4: Add the finish, herbs, acid, seeds, or fermented side.`,
    `Close: ${recipe.weeklyRole}`,
  ].join("\n\n")
}

function buildShoppingList(recipe: PlateRecipe | null) {
  if (!recipe) return ""
  return recipe.shoppingSections
    .map((section) => `${section.title}\n${section.items.map((item) => `- ${item}`).join("\n")}`)
    .join("\n\n")
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function inputClass() {
  return "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-icon-green"
}

function ExportBox({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="rounded-3xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-2xl font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={copy}
          disabled={!text}
          className="inline-flex items-center gap-2 rounded-full border border-icon-green/30 px-3 py-2 text-xs font-bold text-foreground disabled:opacity-40"
        >
          {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-4 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-white p-4 text-sm leading-7 text-muted-foreground">
        {text || "Generate a recipe to create this export."}
      </pre>
    </div>
  )
}

export function RecipeStudioClient() {
  const [form, setForm] = useState<StudioForm>(initialForm)
  const [recipe, setRecipe] = useState<PlateRecipe | null>(null)
  const [publicUrl, setPublicUrl] = useState("")
  const [saved, setSaved] = useState(false)
  const [generatedBy, setGeneratedBy] = useState<"openai" | "fallback" | null>(null)
  const [imageGenerated, setImageGenerated] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const selectedPlate = useMemo(
    () => PLATES.find((plate) => plate.id === form.plateId) ?? PLATES[0],
    [form.plateId]
  )

  const exports = useMemo(() => ({
    seoTitle: buildSeoTitle(recipe),
    metaDescription: buildMetaDescription(recipe),
    substack: buildSubstackDraft(recipe),
    carousel: buildCarousel(recipe),
    video: buildVideoScript(recipe),
    shopping: buildShoppingList(recipe),
  }), [recipe])

  function update<K extends keyof StudioForm>(key: K, value: StudioForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function generate() {
    setGenerating(true)
    setWarnings([])
    try {
      const response = await fetch("/api/plate-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateId: form.plateId,
          dishIdea: form.dishIdea,
          country: form.cuisine,
          protein: form.protein,
          vegetables: form.vegetables,
          avoid: form.avoid,
          dietaryStyle: form.dietaryStyle,
          cookingTime: form.cookingTime,
          goal: form.goal,
          flavour: form.flavour,
          creativeSeed: `studio-${form.plateId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          publish: true,
        }),
      })

      if (!response.ok) throw new Error("Recipe generation failed")
      const data = await response.json() as ApiResponse
      setRecipe(data.recipe ?? null)
      setPublicUrl(recipeUrl(data.publicUrl))
      setSaved(Boolean(data.saved))
      setGeneratedBy(data.generatedBy ?? null)
      setImageGenerated(Boolean(data.imageGenerated))
      setWarnings(data.warnings ?? [])
    } catch (error) {
      setWarnings([error instanceof Error ? error.message : "Recipe generation failed"])
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-border bg-white px-6 py-5">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Founder Mode</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-foreground">EatoBiotics Recipe Studio</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              Build the recipe, generate the food-system content, create the image, and publish the plate page from one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground">
              Admin dashboard
            </Link>
            <Link href="/plate-builder" className="rounded-full border border-icon-green/30 px-4 py-2 text-sm font-semibold text-foreground">
              Public builder
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-[1380px] gap-8 lg:grid-cols-[430px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-3xl border-2 border-icon-green bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Plate type</p>
              <div className="mt-4 grid gap-3">
                {PLATES.map((plate) => (
                  <button
                    key={plate.id}
                    type="button"
                    onClick={() => update("plateId", plate.id)}
                    className={`rounded-2xl border-2 bg-white p-4 text-left transition ${
                      form.plateId === plate.id ? "border-icon-green" : "border-border hover:border-icon-green/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-xl font-semibold text-foreground">{plate.name}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{plate.note}</p>
                      </div>
                      {form.plateId === plate.id && <CheckCircle2 className="shrink-0 text-icon-green" size={20} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-icon-orange bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Creation brief</p>
              <div className="mt-5 grid gap-4">
                <Field label="Dish idea">
                  <input className={inputClass()} value={form.dishIdea} onChange={(event) => update("dishIdea", event.target.value)} placeholder="Optional, e.g. smoky white bean bowl" />
                </Field>
                <Field label="Main protein">
                  <input className={inputClass()} value={form.protein} onChange={(event) => update("protein", event.target.value)} placeholder="Salmon, eggs, chicken, tofu, lentils..." />
                </Field>
                <Field label="Cuisine / origin">
                  <select className={inputClass()} value={form.cuisine} onChange={(event) => update("cuisine", event.target.value)}>
                    {CUISINES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Goal">
                  <select className={inputClass()} value={form.goal} onChange={(event) => update("goal", event.target.value)}>
                    {GOALS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Time">
                    <select className={inputClass()} value={form.cookingTime} onChange={(event) => update("cookingTime", event.target.value)}>
                      {TIMES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label="Dietary">
                    <select className={inputClass()} value={form.dietaryStyle} onChange={(event) => update("dietaryStyle", event.target.value)}>
                      {DIETARY.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Flavour">
                  <select className={inputClass()} value={form.flavour} onChange={(event) => update("flavour", event.target.value)}>
                    {FLAVOURS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Plants, grains, ferments, extras">
                  <textarea className={inputClass()} rows={3} value={form.vegetables} onChange={(event) => update("vegetables", event.target.value)} placeholder="Optional comma-separated ingredients" />
                </Field>
                <Field label="Avoid">
                  <input className={inputClass()} value={form.avoid} onChange={(event) => update("avoid", event.target.value)} placeholder="No chicken, no dairy, no nuts..." />
                </Field>
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-icon-lime via-icon-green to-icon-yellow px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? "Creating recipe..." : "Generate and publish recipe"}
              </button>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-3xl border-2 border-icon-green bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: selectedPlate.color }}>{selectedPlate.name}</p>
                  <h2 className="mt-2 font-serif text-4xl font-semibold text-foreground">
                    {recipe ? recipe.name : "Generate the next EatoBiotics recipe"}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {recipe ? recipe.description : "Use founder mode to create recipe pages and reusable content from the EatoBiotics plate framework."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-icon-green/30 px-3 py-1.5 text-xs font-bold text-foreground">
                    {generatedBy === "openai" ? "AI recipe" : recipe ? "Fallback recipe" : "Waiting"}
                  </span>
                  <span className="rounded-full border border-icon-teal/30 px-3 py-1.5 text-xs font-bold text-foreground">
                    {imageGenerated ? "Image created" : recipe ? "Image fallback" : "No image yet"}
                  </span>
                  <span className="rounded-full border border-icon-orange/30 px-3 py-1.5 text-xs font-bold text-foreground">
                    {saved ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {warnings.length > 0 && (
                <div className="mt-5 rounded-2xl border border-icon-orange/40 bg-white p-4 text-sm leading-6 text-muted-foreground">
                  {warnings.join(" | ")}
                </div>
              )}

              {recipe && (
                <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
                  <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <img src={recipe.imageUrl} alt={recipe.name} className="aspect-square h-full w-full object-cover" />
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl border border-icon-green/30 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plate</p>
                        <p className="mt-2 text-sm font-semibold">{recipe.plateName.replace(/^The /, "")}</p>
                      </div>
                      <div className="rounded-2xl border border-icon-yellow/40 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Time</p>
                        <p className="mt-2 text-sm font-semibold">{recipe.time.total}</p>
                      </div>
                      <div className="rounded-2xl border border-icon-orange/40 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calories</p>
                        <p className="mt-2 text-sm font-semibold">{recipe.nutrition.calories} kcal</p>
                      </div>
                      <div className="rounded-2xl border border-icon-teal/40 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Protein</p>
                        <p className="mt-2 text-sm font-semibold">{recipe.nutrition.protein}g</p>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-border bg-white p-5">
                      <h3 className="font-serif text-2xl font-semibold">Ingredients</h3>
                      <ul className="mt-4 grid gap-2 md:grid-cols-2">
                        {recipe.ingredients.map((item) => (
                          <li key={item} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={generate}
                        className="inline-flex items-center gap-2 rounded-full border border-icon-green/30 px-4 py-2 text-sm font-bold text-foreground"
                      >
                        <RefreshCw size={15} />
                        Regenerate
                      </button>
                      {publicUrl && (
                        <Link href={publicUrl} className="inline-flex items-center gap-2 rounded-full border border-icon-orange/40 px-4 py-2 text-sm font-bold text-foreground">
                          <ArrowUpRight size={15} />
                          Open recipe page
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ExportBox title="SEO Title" text={exports.seoTitle} />
              <ExportBox title="Meta Description" text={exports.metaDescription} />
              <ExportBox title="Substack Draft" text={exports.substack} />
              <ExportBox title="Instagram Carousel" text={exports.carousel} />
              <ExportBox title="Short Video Script" text={exports.video} />
              <ExportBox title="Shopping List" text={exports.shopping} />
            </div>

            <div className="rounded-3xl border-2 border-icon-teal bg-white p-6">
              <div className="flex items-start gap-3">
                <Send className="mt-1 text-icon-teal" size={18} />
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-foreground">Next upgrade path</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    This studio currently uses the existing Plate Builder API. The next backend pass should add a dedicated recipe intelligence provider flag, recent-recipe memory, stronger validation, and optional Claude text generation while keeping OpenAI for images.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
