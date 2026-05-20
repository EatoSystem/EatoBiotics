export type PlateId = "foundation" | "function" | "diversity" | "restoration"

export type PlateRecipeInput = {
  plateId: PlateId
  dishIdea?: string
  country?: string
  protein?: string
  vegetables?: string
  avoid?: string
  dietaryStyle?: string
  cookingTime?: string
  goal?: string
  flavour?: string
}

export type PlateRecipe = {
  slug: string
  plateId: PlateId
  plateName: string
  name: string
  description: string
  imageUrl: string
  goal: string
  flavour: string
  dietaryStyle: string
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
  shoppingSections: {
    title: string
    items: string[]
    color: string
  }[]
  weeklyRole: string
  disclaimer: string
  createdAt: string
  imageGenerated?: boolean
  imageModel?: string
  imagePrompt?: string
  referenceStyleUsed?: boolean
}

export const PLATE_DEFINITIONS: Record<PlateId, {
  name: string
  image: string
  defaultProtein: string
  defaultPlants: string[]
  accent: string
}> = {
  foundation: {
    name: "The Food System Bowl",
    image: "/plate-builder/food-1.png",
    defaultProtein: "salmon",
    defaultPlants: ["quinoa", "kale", "cucumber", "avocado", "chickpeas", "red cabbage"],
    accent: "var(--icon-lime)",
  },
  function: {
    name: "The Immunity Plate",
    image: "/plate-builder/food-2.png",
    defaultProtein: "chicken",
    defaultPlants: ["asparagus", "berries", "avocado", "lentils", "kale", "pumpkin seeds"],
    accent: "var(--icon-yellow)",
  },
  diversity: {
    name: "The Living Plate",
    image: "/plate-builder/food-3.png",
    defaultProtein: "tempeh",
    defaultPlants: ["beets", "rainbow carrots", "broccoli", "lentils", "chickpeas", "greens"],
    accent: "var(--icon-teal)",
  },
  restoration: {
    name: "The Rebuild Plate",
    image: "/food-20.png",
    defaultProtein: "trout",
    defaultPlants: ["sweet potato", "carrots", "greens", "lentils", "cabbage", "herbs"],
    accent: "var(--icon-orange)",
  },
}

export function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
}

export function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

export function splitList(value = ""): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function seed(text: string): number {
  return text.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function variationFromSeed(generatedSeed: number) {
  const themes = [
    "crisp citrus herb",
    "charred green and fermented",
    "bright berry and seed",
    "warm ginger sesame",
    "peppery greens and lemon",
    "golden roast and yogurt",
    "fresh garden crunch",
    "zesty pickle and herb",
  ]
  return themes[generatedSeed % themes.length]
}

function score(base: number, modifier: number): number {
  return Math.max(62, Math.min(98, Math.round(base + modifier)))
}

function totalTimeLabel(cookingTime = "25 minutes"): PlateRecipe["time"] {
  if (cookingTime === "15 minutes") return { prep: "7 min", cook: "8 min", total: "15 min" }
  if (cookingTime === "40 minutes") return { prep: "15 min", cook: "25 min", total: "40 min" }
  if (cookingTime === "Batch cook") return { prep: "20 min", cook: "45 min", total: "65 min" }
  return { prep: "10 min", cook: "15 min", total: "25 min" }
}

function estimateNutrition(plateId: PlateId, protein: string, plantCount: number, generatedSeed: number): PlateRecipe["nutrition"] {
  const proteinName = protein.toLowerCase()
  const proteinBase = proteinName.includes("tofu") || proteinName.includes("tempeh") || proteinName.includes("bean")
    ? { calories: 190, protein: 20, fat: 9 }
    : proteinName.includes("salmon") || proteinName.includes("trout")
      ? { calories: 260, protein: 34, fat: 14 }
      : proteinName.includes("egg")
        ? { calories: 210, protein: 18, fat: 14 }
        : { calories: 230, protein: 32, fat: 8 }
  const plateBoost = plateId === "diversity" ? 90 : plateId === "foundation" ? 70 : 55
  const calories = proteinBase.calories + plateBoost + plantCount * 22 + (generatedSeed % 45)
  const carbs = 28 + plantCount * 4 + (plateId === "foundation" ? 10 : 0)
  const fat = proteinBase.fat + 8 + (generatedSeed % 6)
  const fibre = Math.min(22, 7 + plantCount * 1.4 + (plateId === "diversity" ? 3 : 0))

  return {
    calories: Math.round(calories),
    protein: proteinBase.protein,
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fibre: Math.round(fibre),
  }
}

export function createFallbackPlateRecipe(input: PlateRecipeInput, imageUrl?: string): PlateRecipe {
  const plateId = input.plateId
  const plate = PLATE_DEFINITIONS[plateId]
  const protein = input.protein?.trim() || plate.defaultProtein
  const displayProtein = titleCase(protein)
  const plants = Array.from(new Set([...splitList(input.vegetables), ...plate.defaultPlants])).slice(0, 9)
  const flavour = input.flavour || "Bright and zesty"
  const goal = input.goal || "balance"
  const generatedSeed = seed(`${plateId}-${goal}-${protein}-${plants.join("-")}-${input.dietaryStyle ?? "Flexible"}-${input.dishIdea ?? ""}-${flavour}`)
  const fallbackVariation = variationFromSeed(generatedSeed)
  const prebiotic = score(76, (plants.length % 6) * 3 + (plateId === "diversity" ? 7 : 0))
  const probiotic = score(72, (generatedSeed % 10) + (plateId === "function" ? 5 : 0))
  const postbiotic = score(74, (generatedSeed % 8) + (plateId === "restoration" ? 7 : 0))
  const balance = score(78, (generatedSeed % 9) + (plateId === "foundation" ? 6 : 0))
  const name = input.dishIdea?.trim() || `${plate.name.replace(/^The /, "")} with ${displayProtein}`
  const fermentedAccent = plateId === "function" ? "live yogurt or kimchi" : plateId === "diversity" ? "sauerkraut or kimchi" : "kimchi, sauerkraut, kefir yogurt, miso, or pickled vegetables"

  return {
    slug: slugify(name),
    plateId,
    plateName: plate.name,
    name,
    description: `${displayProtein} served with ${formatList(plants.slice(0, 6))}, a fermented accent, seeds, herbs, and a ${fallbackVariation} finish.`,
    imageUrl: imageUrl || plate.image,
    goal,
    flavour,
    dietaryStyle: input.dietaryStyle || "Flexible",
    time: totalTimeLabel(input.cookingTime),
    score: {
      overall: Math.round((prebiotic + probiotic + postbiotic + balance) / 4),
      prebiotic,
      probiotic,
      postbiotic,
      balance,
    },
    nutrition: estimateNutrition(plateId, protein, plants.length, generatedSeed),
    ingredients: [
      `${displayProtein} for the main protein`,
      `${formatList(plants.slice(0, 5))} for fibre, colour, and plant diversity`,
      `${fermentedAccent} for the fermented element`,
      "extra virgin olive oil, seeds, herbs, citrus, and spices for flavour and texture",
      input.avoid?.trim() ? `Leave out: ${input.avoid.trim()}` : "Optional finish: lemon, vinegar, lime, or herb oil",
    ],
    method: [
      `Cook or warm the ${protein} until ready, then season with salt, pepper, herbs, and a little olive oil.`,
      `Prepare the plant base with ${formatList(plants.slice(0, 5))}. Keep some elements fresh and cook or warm the heartier ingredients.`,
      `Add ${fermentedAccent}, then finish with seeds, herbs, citrus, and a ${fallbackVariation} flavour direction.`,
      `Serve as a ${input.cookingTime || "25 minutes"} ${plate.name.replace(/^The /, "").toLowerCase()} for ${goal}, with the dressing added just before eating.`,
    ],
    shoppingSections: [
      { title: "Protein", items: [displayProtein], color: "var(--icon-green)" },
      { title: "Plants", items: plants.slice(0, 6), color: "var(--icon-lime)" },
      { title: "Finish", items: ["fermented side", "extra virgin olive oil", "seeds", "fresh herbs", "citrus"], color: "var(--icon-orange)" },
    ],
    weeklyRole:
      plateId === "foundation"
        ? "A balanced weekly bowl built around protein, fibre, fermented food, healthy fats, and colourful plants."
        : plateId === "function"
          ? "A bright plate designed for everyday food education around energy, mood, immunity, recovery, and the microbiome."
          : plateId === "diversity"
            ? "A plant-diverse plate focused on colour, variety, fibre, texture, and microbial nourishment."
            : "A steady restorative plate built around gentle cooking, routine, recovery, and consistency.",
    disclaimer: "EatoBiotics recipes and scores are educational and not medical advice. They do not diagnose, treat, prevent, or cure any condition.",
    createdAt: new Date().toISOString(),
    imageGenerated: Boolean(imageUrl),
    imageModel: imageUrl ? "fallback-reference" : "static-reference",
    imagePrompt: "",
    referenceStyleUsed: false,
  }
}
