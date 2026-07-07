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
  creativeSeed?: string
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
  imageOptions?: string[]
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
    image: "/food-1.webp",
    defaultProtein: "salmon",
    defaultPlants: ["quinoa", "kale", "cucumber", "avocado", "chickpeas", "red cabbage"],
    accent: "var(--icon-lime)",
  },
  function: {
    name: "The Immunity Plate",
    image: "/food-2.webp",
    defaultProtein: "chicken",
    defaultPlants: ["asparagus", "berries", "avocado", "lentils", "kale", "pumpkin seeds"],
    accent: "var(--icon-yellow)",
  },
  diversity: {
    name: "The Living Plate",
    image: "/food-3.webp",
    defaultProtein: "tempeh",
    defaultPlants: ["beets", "rainbow carrots", "broccoli", "lentils", "chickpeas", "greens"],
    accent: "var(--icon-teal)",
  },
  restoration: {
    name: "The Rebuild Plate",
    image: "/food-20.webp",
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

function pick<T>(items: T[], generatedSeed: number, offset = 0): T {
  return items[Math.abs(generatedSeed + offset) % items.length]
}

function variationFromSeed(generatedSeed: number) {
  const themes = [
    "crisp citrus herb",
    "charred green and fermented",
    "bright berry and seed",
    "warm ginger sesame",
    "peppery greens and lemon",
    "golden roast and yogurt",
    "fresh herb crunch",
    "zesty pickle and herb",
  ]
  return themes[generatedSeed % themes.length]
}

const fallbackPlantPools: Record<PlateId, string[]> = {
  foundation: [
    "quinoa",
    "buckwheat",
    "barley",
    "kale",
    "watercress",
    "cucumber ribbons",
    "avocado",
    "chickpeas",
    "butter beans",
    "red cabbage",
    "fennel",
    "radish",
  ],
  function: [
    "asparagus",
    "blueberries",
    "raspberries",
    "avocado",
    "lentils",
    "kale",
    "rocket",
    "pumpkin seeds",
    "soft egg",
    "kimchi",
    "purple cabbage",
    "green beans",
  ],
  diversity: [
    "beets",
    "rainbow carrots",
    "broccoli",
    "lentils",
    "chickpeas",
    "mixed greens",
    "sauerkraut",
    "purple cabbage",
    "edamame",
    "sprouted seeds",
    "charred courgette",
    "fresh herbs",
  ],
  restoration: [
    "sweet potato",
    "roasted carrots",
    "spinach",
    "lentils",
    "cabbage",
    "parsley",
    "brown rice",
    "miso greens",
    "pumpkin",
    "cucumber",
    "yogurt",
    "sesame",
  ],
}

const fallbackFinishes = [
  "lemon herb oil",
  "ginger lime dressing",
  "miso tahini drizzle",
  "olive oil and cider vinegar",
  "yogurt herb dressing",
  "chilli citrus finish",
  "sumac lemon oil",
  "sesame tamari glaze",
]

const fallbackProteinPools: Record<PlateId, string[]> = {
  foundation: ["salmon", "mackerel", "chicken", "soft eggs", "tempeh", "white beans", "trout", "tofu"],
  function: ["chicken", "tuna", "eggs", "turkey", "tempeh", "salmon", "lentil falafel", "tofu"],
  diversity: ["tempeh", "tofu", "chickpea patties", "lentil kofta", "white beans", "edamame", "eggs", "salmon"],
  restoration: ["trout", "chicken", "soft eggs", "tofu", "salmon", "white beans", "miso tempeh", "turkey"],
}

const heroDescriptors = [
  "Lemon Herb",
  "Miso Sesame",
  "Charred Green",
  "Citrus Crunch",
  "Golden Yogurt",
  "Pickled Herb",
  "Ginger Lime",
  "Smoky Seeded",
]

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
  const flavour = input.flavour || "Bright and zesty"
  const goal = input.goal || "balance"
  const seedBase = `${plateId}-${goal}-${input.protein ?? ""}-${input.dietaryStyle ?? "Flexible"}-${input.dishIdea ?? ""}-${flavour}-${input.creativeSeed ?? ""}-${Date.now()}`
  const preliminarySeed = seed(seedBase)
  const protein = input.protein?.trim() || pick(fallbackProteinPools[plateId], preliminarySeed, 17)
  const displayProtein = titleCase(protein)
  const generatedSeed = seed(`${seedBase}-${protein}`)
  const requestedPlants = splitList(input.vegetables)
  const pool = fallbackPlantPools[plateId]
  const variedPlants = Array.from(
    new Set([
      ...requestedPlants,
      pick(pool, generatedSeed, 1),
      pick(pool, generatedSeed, 3),
      pick(pool, generatedSeed, 5),
      pick(pool, generatedSeed, 7),
      pick(pool, generatedSeed, 9),
      pick(pool, generatedSeed, 11),
    ])
  )
  const plants = (requestedPlants.length > 0 ? Array.from(new Set([...requestedPlants, ...variedPlants])) : variedPlants).slice(0, 9)
  const fallbackVariation = variationFromSeed(generatedSeed)
  const finish = pick(fallbackFinishes, generatedSeed, 13)
  const prebiotic = score(68, (plants.length % 6) * 3 + (generatedSeed % 15) + (plateId === "diversity" ? 6 : 0))
  const probiotic = score(66, (Math.floor(generatedSeed / 3) % 17) + (plateId === "function" ? 5 : 0))
  const postbiotic = score(67, (Math.floor(generatedSeed / 7) % 16) + (plateId === "restoration" ? 6 : 0))
  const balance = score(70, (Math.floor(generatedSeed / 11) % 15) + (plateId === "foundation" ? 5 : 0))
  const name = input.dishIdea?.trim() || `${plate.name.replace(/^The /, "")} with ${pick(heroDescriptors, generatedSeed, 19)} ${displayProtein}`
  const fermentedAccent = plateId === "function" ? "live yogurt or kimchi" : plateId === "diversity" ? "sauerkraut or kimchi" : "kimchi, sauerkraut, kefir yogurt, miso, or pickled vegetables"

  return {
    slug: slugify(name),
    plateId,
    plateName: plate.name,
    name,
    description: `${displayProtein} served with ${formatList(plants.slice(0, 6))}, a fermented accent, seeds, herbs, and ${finish} for a ${fallbackVariation} finish.`,
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
      `extra virgin olive oil, seeds, herbs, and ${finish} for flavour and texture`,
      input.avoid?.trim() ? `Leave out: ${input.avoid.trim()}` : "Optional finish: lemon, vinegar, lime, or herb oil",
    ],
    method: [
      `Cook or warm the ${protein} until ready, then season with salt, pepper, herbs, and a little olive oil.`,
      `Prepare the plant base with ${formatList(plants.slice(0, 5))}. Keep some elements fresh and cook or warm the heartier ingredients.`,
      `Add ${fermentedAccent}, then finish with seeds, herbs, and ${finish}.`,
      `Serve as a ${input.cookingTime || "25 minutes"} ${plate.name.replace(/^The /, "").toLowerCase()} for ${goal}, with the dressing added just before eating.`,
    ],
    shoppingSections: [
      { title: "Protein", items: [displayProtein], color: "var(--icon-green)" },
      { title: "Plants", items: plants.slice(0, 6), color: "var(--icon-lime)" },
      { title: "Finish", items: ["fermented side", "extra virgin olive oil", "seeds", "fresh herbs", finish], color: "var(--icon-orange)" },
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
    imageOptions: imageUrl ? [imageUrl] : [],
    imageModel: imageUrl ? "fallback-reference" : "static-reference",
    imagePrompt: "",
    referenceStyleUsed: false,
  }
}
