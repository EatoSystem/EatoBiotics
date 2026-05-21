"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  Check,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
} from "lucide-react"
import type { PlateRecipe } from "@/lib/plate-builder-recipe"

type PlateId = "foundation" | "function" | "diversity" | "restoration"

const PLATE_BUILDER_STORAGE_VERSION = 4
const LAST_PLATE_STORAGE_KEY = "eatobiotics:last-plate-builder-result"

type Preferences = {
  dishIdea: string
  country: string
  protein: string
  vegetables: string
  avoid: string
  dietaryStyle: string
  cookingTime: string
  goal: string
  flavour: string
}

type PlateOption = {
  id: PlateId
  name: string
  focus: string
  description: string
  image: string
  accent: string
  gradient: string
  hero: string
  defaultProtein: string
  defaultPlants: string[]
}

type GeneratedPlate = {
  name: string
  image: string
  story: string
  weeklyRole: string
  time: {
    prep: string
    cook: string
    total: string
  }
  score: {
    overall: number
    prebiotic: number
    probiotic: number
    postbiotic: number
    balance: number
  }
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fibre: number
  }
  ingredients: string[]
  method: string[]
  shoppingList: string[]
  shoppingSections: {
    title: string
    items: string[]
    color: string
  }[]
  publicUrl?: string
  saved?: boolean
  generatedBy?: "openai" | "fallback"
  imageGenerated?: boolean
  imageOptions?: string[]
  referenceStyleUsed?: boolean
}

type StoredPlateBuilderResult = {
  version: number
  selectedPlate: PlateId
  result: GeneratedPlate
}

const PLATES: PlateOption[] = [
  {
    id: "foundation",
    name: "The Food System Bowl",
    focus: "digestion, energy, resilience, steady meals",
    description:
      "A complete EatoBiotics bowl for digestion, energy, resilience, and steady meals.",
    image: "/plate-builder/food-1.png",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    hero: "Glossy salmon, quinoa, kale, cucumber ribbons, avocado, chickpeas, yogurt, kimchi, red cabbage, and seeds.",
    defaultProtein: "salmon",
    defaultPlants: ["quinoa", "kale", "cucumber", "avocado", "chickpeas", "red cabbage"],
  },
  {
    id: "function",
    name: "The Immunity Plate",
    focus: "immunity, mood, energy, recovery",
    description:
      "A bright EatoBiotics plate for immunity, mood, energy, and recovery.",
    image: "/plate-builder/food-2.png",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-yellow))",
    hero: "Golden chicken, asparagus, berries, avocado, lentils, kale, live yogurt, kimchi, eggs, and pumpkin seeds.",
    defaultProtein: "chicken",
    defaultPlants: ["asparagus", "berries", "avocado", "lentils", "kale", "pumpkin seeds"],
  },
  {
    id: "diversity",
    name: "The Living Plate",
    focus: "richness, diversity, nourishment, consistency",
    description:
      "A colourful plant-diverse plate for richness, variety, nourishment, and consistency.",
    image: "/plate-builder/food-3.png",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal), var(--icon-yellow))",
    hero: "Tempeh, beets, rainbow carrots, broccoli, lentils, chickpeas, sauerkraut, purple cabbage, avocado, greens, herbs, and seeds.",
    defaultProtein: "tempeh",
    defaultPlants: ["beets", "rainbow carrots", "broccoli", "lentils", "chickpeas", "greens"],
  },
  {
    id: "restoration",
    name: "The Rebuild Plate",
    focus: "rebuilding, steadiness, recovery, restoration",
    description:
      "A calming restorative plate for rebuilding, steadiness, recovery, and routine.",
    image: "/food-20.png",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    hero: "Warm roots, soft grains, greens, yogurt, seeds, herbs, olive oil, and a steady protein centre.",
    defaultProtein: "trout",
    defaultPlants: ["sweet potato", "carrots", "greens", "lentils", "cabbage", "herbs"],
  },
]

const COUNTRIES = ["None", "Ireland", "United Kingdom", "United States", "France", "Spain", "Italy", "India", "Japan", "Mexico"]
const GOALS = ["digestion", "energy", "immunity", "mood", "recovery", "diversity"]
const STYLES = ["Flexible", "Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-light"]
const TIMES = ["15 minutes", "25 minutes", "40 minutes", "Batch cook"]
const FLAVOURS = ["Bright and zesty", "Warm and spiced", "Fresh and herb-led", "Creamy and fermented", "Smoky and roasted", "Clean and simple"]

const COUNTRY_TWISTS: Record<string, string[]> = {
  None: [],
  Ireland: ["oats", "cabbage", "parsley", "live yogurt"],
  "United Kingdom": ["barley", "peas", "mustard greens", "kefir"],
  "United States": ["black beans", "corn", "sweet potato", "pickled onion"],
  France: ["lentils", "endive", "walnuts", "cornichons"],
  Spain: ["chickpeas", "peppers", "tomatoes", "olive oil"],
  Italy: ["white beans", "tomatoes", "basil", "aged balsamic"],
  India: ["dhal", "spinach", "turmeric", "lime pickle"],
  Japan: ["rice", "seaweed", "miso", "sesame"],
  Mexico: ["beans", "salsa", "avocado", "pickled cabbage"],
}

function seed(text: string): number {
  return text.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function score(base: number, modifier: number): number {
  return Math.max(62, Math.min(98, Math.round(base + modifier)))
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function totalTimeLabel(cookingTime: string): GeneratedPlate["time"] {
  if (cookingTime === "15 minutes") return { prep: "7 min", cook: "8 min", total: "15 min" }
  if (cookingTime === "40 minutes") return { prep: "15 min", cook: "25 min", total: "40 min" }
  if (cookingTime === "Batch cook") return { prep: "20 min", cook: "45 min", total: "65 min" }
  return { prep: "10 min", cook: "15 min", total: "25 min" }
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function estimateNutrition(plate: PlateOption, protein: string, plantCount: number, generatedSeed: number): GeneratedPlate["nutrition"] {
  const proteinName = protein.toLowerCase()
  const proteinBase = proteinName.includes("tofu") || proteinName.includes("tempeh") || proteinName.includes("bean")
    ? { calories: 190, protein: 20, fat: 9 }
    : proteinName.includes("salmon") || proteinName.includes("trout")
      ? { calories: 260, protein: 34, fat: 14 }
      : proteinName.includes("egg")
        ? { calories: 210, protein: 18, fat: 14 }
        : { calories: 230, protein: 32, fat: 8 }
  const plateBoost = plate.id === "diversity" ? 90 : plate.id === "foundation" ? 70 : 55
  const calories = proteinBase.calories + plateBoost + plantCount * 22 + (generatedSeed % 45)
  const carbs = 28 + plantCount * 4 + (plate.id === "foundation" ? 10 : 0)
  const fat = proteinBase.fat + 8 + (generatedSeed % 6)
  const fibre = Math.min(22, 7 + plantCount * 1.4 + (plate.id === "diversity" ? 3 : 0))

  return {
    calories: Math.round(calories),
    protein: proteinBase.protein,
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fibre: Math.round(fibre),
  }
}

function buildResult(plate: PlateOption, prefs: Preferences): GeneratedPlate {
  const twist = COUNTRY_TWISTS[prefs.country] ?? []
  const protein = prefs.protein.trim() || plate.defaultProtein
  const userPlants = splitList(prefs.vegetables)
  const plants = [...userPlants, ...twist, ...plate.defaultPlants].filter(Boolean)
  const uniquePlants = Array.from(new Set(plants)).slice(0, 9)
  const avoid = prefs.avoid.trim()
  const flavour = prefs.flavour || "Bright and zesty"
  const generatedSeed = seed(`${plate.id}-${prefs.goal}-${protein}-${uniquePlants.join("-")}-${prefs.dietaryStyle}-${prefs.dishIdea}-${flavour}`)

  const prebiotic = score(76, (uniquePlants.length % 6) * 3 + (plate.id === "diversity" ? 7 : 0))
  const probiotic = score(72, (generatedSeed % 10) + (plate.id === "function" ? 5 : 0))
  const postbiotic = score(74, (generatedSeed % 8) + (plate.id === "restoration" ? 7 : 0))
  const balance = score(78, (generatedSeed % 9) + (plate.id === "foundation" ? 6 : 0))
  const overall = Math.round((prebiotic + probiotic + postbiotic + balance) / 4)
  const displayProtein = titleCase(protein)
  const dishName = prefs.dishIdea.trim() || `${plate.name.replace(/^The /, "")} with ${displayProtein}`
  const time = totalTimeLabel(prefs.cookingTime)
  const nutrition = estimateNutrition(plate, protein, uniquePlants.length, generatedSeed)
  const corePlants = uniquePlants.slice(0, 5)
  const supportingPlants = uniquePlants.slice(0, 6)
  const fermentedAccent = plate.id === "function" ? "live yogurt or kimchi" : plate.id === "diversity" ? "sauerkraut or kimchi" : "kimchi, sauerkraut, kefir yogurt, miso, or pickled vegetables"

  return {
    name: dishName,
    image: plate.image,
    story: `${displayProtein} served with ${formatList(supportingPlants)}, a fermented accent, seeds, herbs, and a ${flavour.toLowerCase()} finish.`,
    weeklyRole:
      plate.id === "foundation"
        ? "A balanced weekly bowl built around protein, fibre, fermented food, healthy fats, and colourful plants."
        : plate.id === "function"
          ? "A bright plate designed for everyday food education around energy, mood, immunity, recovery, and the microbiome."
          : plate.id === "diversity"
            ? "A plant-diverse plate focused on colour, variety, fibre, texture, and microbial nourishment."
            : "A steady restorative plate built around gentle cooking, routine, recovery, and consistency.",
    time,
    score: { overall, prebiotic, probiotic, postbiotic, balance },
    nutrition,
    ingredients: [
      `${displayProtein} for the main protein`,
      `${formatList(corePlants)} for fibre, colour, and plant diversity`,
      `${fermentedAccent} for the fermented element`,
      "extra virgin olive oil, seeds, herbs, citrus, and spices for flavour and texture",
      avoid ? `Leave out: ${avoid}` : "Optional finish: lemon, vinegar, lime, or herb oil",
    ],
    method: [
      `Cook or warm the ${protein} until ready, then season with salt, pepper, herbs, and a little olive oil.`,
      `Prepare the plant base with ${formatList(corePlants)}. Keep some elements fresh and cook or warm the heartier ingredients.`,
      `Add ${fermentedAccent}, then finish with seeds, herbs, citrus, and your ${flavour.toLowerCase()} flavour direction.`,
      `Serve as a ${prefs.cookingTime.toLowerCase()} ${plate.name.replace(/^The /, "").toLowerCase()} for ${prefs.goal}, with the dressing added just before eating.`,
    ],
    shoppingList: Array.from(new Set([protein, ...uniquePlants.slice(0, 7), "fermented side", "extra virgin olive oil", "seeds", "fresh herbs", "citrus"])),
    shoppingSections: [
      { title: "Protein", items: [displayProtein], color: "var(--icon-green)" },
      { title: "Plants", items: uniquePlants.slice(0, 6), color: "var(--icon-lime)" },
      { title: "Finish", items: ["fermented side", "extra virgin olive oil", "seeds", "fresh herbs", "citrus"], color: "var(--icon-orange)" },
    ],
    saved: false,
    generatedBy: "fallback",
    imageGenerated: false,
    imageOptions: [],
    referenceStyleUsed: false,
  }
}

function mapRecipeToResult(
  recipe: PlateRecipe,
  publicUrl?: string,
  meta?: { saved?: boolean; generatedBy?: "openai" | "fallback"; imageGenerated?: boolean; imageOptions?: string[]; referenceStyleUsed?: boolean }
): GeneratedPlate {
  return {
    name: recipe.name,
    image: recipe.imageUrl,
    story: recipe.description,
    weeklyRole: recipe.weeklyRole,
    time: recipe.time,
    score: recipe.score,
    nutrition: recipe.nutrition,
    ingredients: recipe.ingredients,
    method: recipe.method,
    shoppingList: recipe.shoppingSections.flatMap((section) => section.items),
    shoppingSections: recipe.shoppingSections,
    publicUrl,
    saved: meta?.saved,
    generatedBy: meta?.generatedBy,
    imageGenerated: meta?.imageGenerated ?? recipe.imageGenerated,
    imageOptions: meta?.imageOptions ?? recipe.imageOptions ?? [],
    referenceStyleUsed: meta?.referenceStyleUsed ?? recipe.referenceStyleUsed,
  }
}

function GenerationStatus({ result }: { result: GeneratedPlate }) {
  const items = [
    {
      label: result.generatedBy === "openai" ? "Recipe created" : "Draft recipe",
      active: result.generatedBy === "openai",
    },
    {
      label: result.imageGenerated ? "Image created" : "Reference image",
      active: Boolean(result.imageGenerated),
    },
    {
      label: result.saved ? "Page saved" : "Not saved",
      active: Boolean(result.saved && result.publicUrl),
    },
  ]

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
            item.active
              ? "border-icon-green/30 bg-icon-green/10 text-icon-green"
              : "border-icon-orange/30 bg-icon-orange/10 text-icon-orange"
          }`}
        >
          {item.label}
        </span>
      ))}
    </div>
  )
}

function ScoreCircle({ value }: { value: number }) {
  return (
    <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-icon-green bg-white text-center">
      <span className="font-serif text-4xl font-semibold leading-none text-foreground">{value}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/100</span>
    </div>
  )
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: color }}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function EatoBioticsScoreCard({ result }: { result: GeneratedPlate }) {
  return (
    <div className="rounded-3xl border border-icon-green/30 bg-white p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <ScoreCircle value={result.score.overall} />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">EatoBiotics Score</p>
          <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">Food-system strength</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A simple educational read on the plate's prebiotic fibre, fermented contrast, and postbiotic support.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ScorePill label="Prebiotic" value={result.score.prebiotic} color="var(--icon-lime)" />
        <ScorePill label="Probiotic" value={result.score.probiotic} color="var(--icon-teal)" />
        <ScorePill label="Postbiotic" value={result.score.postbiotic} color="var(--icon-orange)" />
      </div>
    </div>
  )
}

function NutritionStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-foreground">
        {value}
        <span className="ml-1 text-xs font-semibold" style={{ color }}>{unit}</span>
      </p>
    </div>
  )
}

function RecipeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  // Generated OpenAI images may be remote or data URLs, so use a plain img tag.
  return <img src={src} alt={alt} className={className} />
}

export function PlateBuilderClient() {
  const [selectedPlate, setSelectedPlate] = useState<PlateId>("foundation")
  const [creatorMode, setCreatorMode] = useState<"create" | "personalise">("create")
  const [prefs, setPrefs] = useState<Preferences>({
    dishIdea: "",
    country: "None",
    protein: "",
    vegetables: "",
    avoid: "",
    dietaryStyle: "Flexible",
    cookingTime: "25 minutes",
    goal: "digestion",
    flavour: "Bright and zesty",
  })
  const [result, setResult] = useState<GeneratedPlate>(() => buildResult(PLATES[0], {
    dishIdea: "",
    country: "None",
    protein: "",
    vegetables: "",
    avoid: "",
    dietaryStyle: "Flexible",
    cookingTime: "25 minutes",
    goal: "digestion",
    flavour: "Bright and zesty",
  }))
  const [generating, setGenerating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const plate = useMemo(() => PLATES.find((item) => item.id === selectedPlate) ?? PLATES[0], [selectedPlate])

  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_PLATE_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as StoredPlateBuilderResult
      if (
        parsed.version === PLATE_BUILDER_STORAGE_VERSION &&
        PLATES.some((item) => item.id === parsed.selectedPlate) &&
        parsed.result?.name
      ) {
        setSelectedPlate(parsed.selectedPlate)
        setResult(parsed.result)
      } else {
        window.localStorage.removeItem(LAST_PLATE_STORAGE_KEY)
      }
    } catch {
      window.localStorage.removeItem(LAST_PLATE_STORAGE_KEY)
    }
  }, [])

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((current) => ({ ...current, [key]: value }))
  }

  async function createPlate() {
    setGenerating(true)
    setNotice(null)
    try {
      const response = await fetch("/api/plate-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateId: plate.id,
          ...prefs,
          creativeSeed: `${plate.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          publish: true,
        }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json() as {
        recipe?: PlateRecipe
        publicUrl?: string
        saved?: boolean
        generatedBy?: "openai" | "fallback"
        imageGenerated?: boolean
        imageOptions?: string[]
        warnings?: string[]
      }
      const nextResult = data.recipe
        ? mapRecipeToResult(data.recipe, data.publicUrl, {
            saved: data.saved,
            generatedBy: data.generatedBy,
            imageGenerated: data.imageGenerated,
            imageOptions: data.imageOptions,
            referenceStyleUsed: data.recipe.referenceStyleUsed,
          })
        : buildResult(plate, prefs)
      setResult(nextResult)
      window.localStorage.setItem(
        LAST_PLATE_STORAGE_KEY,
        JSON.stringify({ version: PLATE_BUILDER_STORAGE_VERSION, selectedPlate: plate.id, result: nextResult } satisfies StoredPlateBuilderResult)
      )
      if (!data.saved) {
        setNotice("Recipe created locally. Add the Supabase plate_recipes table to publish permanent recipe pages.")
      } else if (data.generatedBy === "fallback") {
        setNotice("Recipe page created with fallback generation. Add OPENAI_API_KEY to generate new AI recipes and images.")
      } else if (!data.imageGenerated) {
        setNotice("Recipe content was generated, but image generation did not return a new image. Check the OpenAI image model and Vercel logs.")
      }
      if (data.warnings?.length) {
        setNotice(data.warnings.join(" | "))
      }
      window.setTimeout(() => document.getElementById("latest-creation")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    } catch {
      const nextResult = buildResult(plate, prefs)
      setResult(nextResult)
      window.localStorage.setItem(
        LAST_PLATE_STORAGE_KEY,
        JSON.stringify({ version: PLATE_BUILDER_STORAGE_VERSION, selectedPlate: plate.id, result: nextResult } satisfies StoredPlateBuilderResult)
      )
      setNotice("Recipe created with the local fallback because the generation API was unavailable.")
      window.setTimeout(() => document.getElementById("latest-creation")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    } finally {
      setGenerating(false)
    }
  }

  function placeholder(action: string) {
    setNotice(`${action} is a placeholder action. The next build should connect accounts and export/share logic.`)
  }

  return (
    <main className="bg-background">
      <section className="px-6 pt-24 pb-10 md:pt-32 md:pb-16">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">Plate Builder</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Create your own EatoBiotics bowl or plate.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Build a unique dish concept with your own ingredients, timing, method, score, and generated image. This is the founder content machine for EatoBiotics recipes, posts, and education.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={createPlate}
                disabled={generating}
                className="brand-gradient inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {generating ? <RefreshCw size={17} className="animate-spin" /> : <Sparkles size={17} />}
                Create my plate
              </button>
              <a
                href="#choose-plate"
                className="inline-flex items-center justify-center rounded-full border-2 border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
              >
                Start building
              </a>
            </div>
          </div>

          <div id="share-card" className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-icon-green/25 bg-white">
              <div className="relative aspect-square">
                <RecipeImage src={result.image} alt={result.name} className="h-full w-full object-cover" />
              </div>
              <div className="border-t border-border bg-background p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: plate.accent }}>
                      EatoBiotics Plate
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">
                      {result.name}
                    </h2>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-foreground text-center text-background">
                    <p className="text-[9px] uppercase tracking-widest text-background/55">Score</p>
                    <p className="font-serif text-3xl font-semibold leading-none">{result.score.overall}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{result.story}</p>
                <GenerationStatus result={result} />
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-icon-green/20 bg-white p-3">
                    <p className="font-bold text-foreground">{result.time.prep}</p>
                    <p className="mt-1 text-muted-foreground">Prep</p>
                  </div>
                  <div className="rounded-xl border border-icon-yellow/30 bg-white p-3">
                    <p className="font-bold text-foreground">{result.time.cook}</p>
                    <p className="mt-1 text-muted-foreground">Cook</p>
                  </div>
                  <div className="rounded-xl border border-icon-orange/25 bg-white p-3">
                    <p className="font-bold text-foreground">{result.time.total}</p>
                    <p className="mt-1 text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="choose-plate" className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">Creator mode</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">Create recipes on demand for EatoBiotics content.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Pick one plate, generate a dish concept, then use the score, recipe, image, and public page for social posts, education, and future customer tools.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLATES.map((option) => {
              const active = selectedPlate === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedPlate(option.id)}
                  className={`overflow-hidden rounded-2xl border bg-white text-left transition-all hover:-translate-y-0.5 ${
                    active ? "border-icon-green" : "border-border"
                  }`}
                >
                  <div className="relative aspect-square bg-white">
                    <Image src={option.image} alt={option.name} fill className="object-cover" sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" />
                    {active && (
                      <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-icon-green text-white">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-xl font-semibold leading-tight text-foreground">{option.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setCreatorMode("create")}
              className={`rounded-3xl border p-6 text-left transition-all hover:-translate-y-0.5 ${
                creatorMode === "create" ? "border-icon-green bg-white" : "border-border bg-white"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Create</p>
              <h3 className="mt-2 font-serif text-3xl font-semibold text-foreground">Generate a plate automatically.</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Pick your EatoBiotics plate and create a fresh recipe concept instantly.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setCreatorMode("personalise")}
              className={`rounded-3xl border p-6 text-left transition-all hover:-translate-y-0.5 ${
                creatorMode === "personalise" ? "border-icon-orange bg-white" : "border-border bg-white"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Personalise</p>
              <h3 className="mt-2 font-serif text-3xl font-semibold text-foreground">Shape the dish yourself.</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Add a dish idea, ingredients, flavour direction, timing, and constraints.
              </p>
            </button>
          </div>

          {creatorMode === "create" && (
            <div className="mt-5 rounded-3xl border border-border bg-white p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">Ready to create</p>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">{plate.name}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Create a new dish from this plate, including a unique name, hero ingredient, plants, method, time, score, shopping list, and image.
                </p>
              </div>
              <button type="button" onClick={createPlate} disabled={generating} className="brand-gradient mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70 md:mt-0 md:w-auto">
                {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Create recipe
              </button>
            </div>
          )}

          {creatorMode === "personalise" && (
            <div className="mt-5 rounded-3xl border border-icon-orange/25 bg-white p-5 md:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">Build your unique dish</p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">Add the ingredients, direction, and constraints.</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  The plate choice gives the EatoBiotics structure. Your inputs make the recipe unique.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground">Dish name or idea</span>
                  <input value={prefs.dishIdea} onChange={(event) => update("dishIdea", event.target.value)} placeholder="e.g. Green Gold Salmon Food System Bowl" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Goal</span>
                  <select value={prefs.goal} onChange={(event) => update("goal", event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green">
                    {GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Main protein</span>
                  <input value={prefs.protein} onChange={(event) => update("protein", event.target.value)} placeholder="salmon, tofu, beans" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground">Vegetables, grains, ferments, toppings</span>
                  <input value={prefs.vegetables} onChange={(event) => update("vegetables", event.target.value)} placeholder="kale, quinoa, cucumber, kimchi, avocado, pumpkin seeds" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Flavour direction</span>
                  <select value={prefs.flavour} onChange={(event) => update("flavour", event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green">
                    {FLAVOURS.map((flavour) => <option key={flavour} value={flavour}>{flavour}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Dietary style</span>
                  <select value={prefs.dietaryStyle} onChange={(event) => update("dietaryStyle", event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green">
                    {STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Time to make</span>
                  <select value={prefs.cookingTime} onChange={(event) => update("cookingTime", event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green">
                    {TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Country add-on</span>
                  <select value={prefs.country} onChange={(event) => update("country", event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green">
                    {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground">Foods to avoid</span>
                  <input value={prefs.avoid} onChange={(event) => update("avoid", event.target.value)} placeholder="dairy, gluten, mushrooms" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-icon-green" />
                </label>
                <div className="flex items-end">
                  <button type="button" onClick={createPlate} disabled={generating} className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70">
                    {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Create personalised recipe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="latest-creation" className="bg-white px-6 py-4">
        <div className="mx-auto max-w-[1100px] rounded-3xl border border-icon-green/30 bg-white p-5 md:grid md:grid-cols-[220px_1fr] md:gap-6 md:p-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white">
            <RecipeImage src={result.image} alt={result.name} className="h-full w-full object-cover" />
          </div>
          <div className="mt-5 md:mt-0">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: plate.accent }}>{plate.name}</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-foreground">{result.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.story}</p>
            <GenerationStatus result={result} />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-icon-green/20 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plate</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{plate.name.replace(/^The /, "")}</p>
              </div>
              <div className="rounded-2xl border border-icon-orange/25 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Score</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{result.score.overall}/100</p>
              </div>
              <div className="rounded-2xl border border-icon-teal/25 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{result.time.total}</p>
              </div>
              <div className="rounded-2xl border border-icon-yellow/30 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calories</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{result.nutrition.calories} kcal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-6 md:py-8">
        <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <EatoBioticsScoreCard result={result} />

            <div className="rounded-3xl border border-icon-teal/30 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">Nutritional values</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <NutritionStat label="Calories" value={result.nutrition.calories} unit="kcal" color="var(--icon-orange)" />
                <NutritionStat label="Protein" value={result.nutrition.protein} unit="g" color="var(--icon-green)" />
                <NutritionStat label="Carbs" value={result.nutrition.carbs} unit="g" color="var(--icon-yellow)" />
                <NutritionStat label="Fat" value={result.nutrition.fat} unit="g" color="var(--icon-teal)" />
                <NutritionStat label="Fibre" value={result.nutrition.fibre} unit="g" color="var(--icon-lime)" />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Values are educational estimates for content creation and will vary by portion size, brand, and cooking method.
              </p>
            </div>

            <div className="rounded-3xl border border-icon-teal/30 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Shopping list</p>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">Grouped for a quick shop.</h3>
                </div>
                <span className="rounded-full border border-icon-teal/25 bg-white px-3 py-1 text-xs font-bold text-foreground">{result.shoppingList.length} items</span>
              </div>
              <div className="mt-5 grid gap-3">
                {result.shoppingSections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: section.color }}>{section.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {section.items.map((item) => (
                        <span key={`${section.title}-${item}`} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-icon-green/30 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: plate.accent }}>{plate.name}</p>
              <h3 className="mt-2 font-serif text-3xl font-semibold text-foreground">{result.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.story}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-icon-green/20 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prep</p>
                  <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{result.time.prep}</p>
                </div>
                <div className="rounded-2xl border border-icon-yellow/30 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cook</p>
                  <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{result.time.cook}</p>
                </div>
                <div className="rounded-2xl border border-icon-orange/25 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</p>
                  <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{result.time.total}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-icon-green/20 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingredients</p>
                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {result.ingredients.map((item) => (
                      <li key={item} className="flex gap-3 rounded-2xl border border-border bg-white p-3 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-icon-green" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-icon-orange/30 bg-white p-5">
                  <h4 className="font-serif text-2xl font-semibold text-foreground">Method</h4>
                  <div className="mt-4 grid gap-3">
                    {result.method.map((step, index) => (
                      <div key={step} className="flex gap-4 rounded-2xl border border-border bg-white p-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: plate.gradient }}>
                          {index + 1}
                        </span>
                        <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 rounded-2xl border border-icon-green/20 bg-white p-4 text-sm leading-relaxed text-foreground">{result.weeklyRole}</p>
                </div>
              </div>
            </div>

            {notice && <div className="rounded-2xl border border-icon-yellow/30 bg-white p-4 text-sm text-foreground">{notice}</div>}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => placeholder("Save plate")} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-icon-green hover:text-icon-green">
                <Save size={15} />
                Save plate
              </button>
              <button type="button" onClick={() => placeholder("Share plate")} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-icon-green hover:text-icon-green">
                <Share2 size={15} />
                Share plate
              </button>
              {result.publicUrl && (
                <a href={result.publicUrl} className="inline-flex items-center gap-2 rounded-full border border-icon-green px-5 py-3 text-sm font-semibold text-icon-green hover:bg-icon-green hover:text-white">
                  Open recipe page
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-[900px] rounded-2xl border border-border bg-white p-6">
          <p className="text-sm font-semibold text-foreground">Educational recipe generator</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            EatoBiotics recipes and scores are educational and not medical advice. They do not diagnose, treat, prevent, or cure any condition. Generated recipes and images should be reviewed before publishing.
          </p>
        </div>
      </section>
    </main>
  )
}
