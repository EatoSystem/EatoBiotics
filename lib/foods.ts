export type BioticType = "prebiotic" | "probiotic" | "postbiotic" | "all"

export type FoodCategory =
  | "Vegetables"
  | "Fruit"
  | "Grains & Legumes"
  | "Fermented"
  | "Fats & Oils"
  | "Protein"
  | "Herbs & Spices"
  | "Sea Vegetables"

export interface FoodBenefit {
  title: string
  detail: string
}

export interface Food {
  slug: string
  name: string
  emoji: string
  category: FoodCategory
  biotic: BioticType
  accentColor: string
  gradient: string
  tagline: string
  description: string
  howToEat: string
  science: string
  scienceSource: string
  county?: string // Irish county association if applicable
  benefits: FoodBenefit[]
  pairsWith: string[]
  publishedDay: number // 1-365, used to determine which day of the year this food appears
}

export const foods: Food[] = [
  {
    slug: "kimchi",
    name: "Kimchi",
    emoji: "🥬",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Korea's gift to your gut.",
    description:
      "Kimchi is a traditional Korean fermented vegetable dish — typically cabbage and radish seasoned with chilli, garlic, ginger, and salt. The fermentation process produces billions of live Lactobacillus bacteria, making it one of the most potent probiotic foods on the planet. Its sharp, complex flavour is a sign of microbial life at work.",
    howToEat:
      "Add two tablespoons alongside any meal — eggs, rice, soup, or simply on sourdough toast. No cooking needed. Heat destroys the live cultures, so serve it cold or at room temperature. Start with a tablespoon a day if your gut isn't used to fermented foods.",
    science:
      "A 2021 Stanford study found that a high-fermented-food diet — including kimchi — significantly increased microbiome diversity and decreased markers of inflammation in healthy adults over 10 weeks.",
    scienceSource: "Wastyk et al., Cell, 2021",
    benefits: [
      { title: "Adds Live Cultures", detail: "Introduces Lactobacillus and other beneficial bacteria directly into your gut." },
      { title: "Reduces Inflammation", detail: "Fermented foods are consistently linked to lower inflammatory markers in clinical studies." },
      { title: "Supports Immunity", detail: "70% of your immune system lives in your gut — a diverse microbiome is your first line of defence." },
      { title: "Improves Digestion", detail: "The live enzymes in kimchi help break down food and ease bloating." },
    ],
    pairsWith: ["Garlic", "Oats", "Eggs", "Brown Rice"],
    publishedDay: 1,
  },
  {
    slug: "garlic",
    name: "Garlic",
    emoji: "🧄",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    tagline: "The oldest medicine in your kitchen.",
    description:
      "Garlic contains inulin and fructooligosaccharides (FOS) — powerful prebiotic fibres that your body cannot digest but your gut bacteria thrive on. Raw garlic is particularly potent, containing allicin — a sulphur compound with antimicrobial and anti-inflammatory properties. One of the most well-studied prebiotic foods in existence.",
    howToEat:
      "Crush a clove and leave it for 10 minutes before cooking — this activates the allicin. Add to dressings, stir-fries, soups, or roast whole bulbs and spread on sourdough. For maximum prebiotic benefit, eat some raw — chop finely and add to salads or hummus.",
    science:
      "Studies show that garlic's fructooligosaccharides selectively feed Bifidobacterium and Lactobacillus — two of the most beneficial bacterial families in the human gut.",
    scienceSource: "Niness, Journal of Nutrition, 1999",
    benefits: [
      { title: "Feeds Beneficial Bacteria", detail: "Inulin in garlic is a direct fuel source for Bifidobacterium and Lactobacillus." },
      { title: "Antimicrobial Properties", detail: "Allicin inhibits the growth of harmful bacteria without damaging beneficial strains." },
      { title: "Reduces Blood Pressure", detail: "Regular garlic consumption is consistently linked to improved cardiovascular markers." },
      { title: "Anti-inflammatory", detail: "Multiple sulphur compounds in garlic reduce systemic inflammation across the body." },
    ],
    pairsWith: ["Kimchi", "Olive Oil", "Onions", "Ginger"],
    publishedDay: 2,
  },
  {
    slug: "oats",
    name: "Oats",
    emoji: "🌾",
    category: "Grains & Legumes",
    biotic: "prebiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Beta-glucan — the fibre your gut bacteria love most.",
    description:
      "Oats are rich in beta-glucan — a soluble fibre that forms a gel in your digestive tract, slowing glucose absorption and feeding beneficial gut bacteria. They're one of the most researched prebiotic foods, consistently linked to improved gut microbiome diversity, lower cholesterol, and better blood sugar control. A staple of the EatoBiotics plate.",
    howToEat:
      "Overnight oats are the easiest win — combine rolled oats with kefir or yogurt and leave overnight. The combination of prebiotic oats and probiotic kefir is a direct one-two punch for your microbiome. Cook them slowly with water for maximum beta-glucan release. Add banana and ground flaxseed for additional prebiotic benefit.",
    science:
      "Beta-glucan from oats has been shown to significantly increase populations of Bifidobacterium and Lactobacillus while also reducing LDL cholesterol by up to 10%.",
    scienceSource: "Thies et al., British Journal of Nutrition, 2014",
    benefits: [
      { title: "Beta-Glucan Rich", detail: "The highest source of beta-glucan of any grain — 3-4g per serving of rolled oats." },
      { title: "Feeds the Microbiome", detail: "Directly increases Bifidobacterium populations — one of the most beneficial gut bacterial families." },
      { title: "Blood Sugar Regulation", detail: "Slows glucose absorption, reducing post-meal blood sugar spikes." },
      { title: "Cholesterol Reduction", detail: "Beta-glucan binds to bile acids in the digestive tract, lowering LDL cholesterol." },
    ],
    pairsWith: ["Kefir", "Banana", "Blueberries", "Flaxseed"],
    publishedDay: 3,
  },
  {
    slug: "kefir",
    name: "Kefir",
    emoji: "🥛",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    tagline: "The most potent fermented drink you can make at home.",
    description:
      "Kefir is a fermented milk drink made with kefir grains — a symbiotic culture of bacteria and yeast. It contains significantly more live cultures than yogurt, with up to 61 strains of bacteria and yeast documented. Originally from the Caucasus mountains, it has been consumed for centuries as a medicine for digestion, immunity, and longevity.",
    howToEat:
      "Drink 150-200ml daily, ideally in the morning. Use it as the base for overnight oats, blend into smoothies, or pour over fruit and seeds. Kefir made from oat milk or coconut milk works well if you avoid dairy. The slightly sour, effervescent taste is a sign the cultures are alive and active.",
    science:
      "Kefir has been shown to reduce symptoms of lactose intolerance, improve gut barrier function, and significantly increase microbiome diversity — even in people who don't respond well to other probiotics.",
    scienceSource: "Rosa et al., Nutrients, 2017",
    benefits: [
      { title: "Highest Probiotic Density", detail: "Up to 61 documented strains of bacteria and yeast — far more than standard yogurt." },
      { title: "Gut Barrier Support", detail: "Strengthens the intestinal lining, reducing leaky gut and systemic inflammation." },
      { title: "Lactose Tolerance", detail: "The fermentation process breaks down lactose, making it tolerable for most lactose-sensitive people." },
      { title: "Anti-cancer Properties", detail: "Kefir peptides have demonstrated anti-tumour activity in multiple in vitro studies." },
    ],
    pairsWith: ["Oats", "Blueberries", "Banana", "Flaxseed"],
    publishedDay: 4,
  },
  {
    slug: "blueberries",
    name: "Blueberries",
    emoji: "🫐",
    category: "Fruit",
    biotic: "prebiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    tagline: "Small fruit. Massive microbiome impact.",
    description:
      "Blueberries are one of the richest sources of polyphenols — plant compounds that act as powerful prebiotics, selectively feeding beneficial gut bacteria. Their deep blue-purple colour comes from anthocyanins, a class of polyphenol that reaches the colon largely intact and is fermented by gut bacteria into anti-inflammatory short-chain fatty acids.",
    howToEat:
      "A handful (80-100g) daily is all you need. Add to overnight oats with kefir, blend into smoothies, or eat fresh with full-fat yogurt. Frozen blueberries retain their polyphenol content and are often more economical. Wild blueberries have a higher polyphenol density than cultivated varieties.",
    science:
      "Regular blueberry consumption has been shown to increase Bifidobacterium populations by up to 33% and reduce markers of gut inflammation — effects driven primarily by their polyphenol content.",
    scienceSource: "Vendrame et al., Journal of Nutrition, 2011",
    benefits: [
      { title: "Polyphenol Powerhouse", detail: "One of the highest polyphenol densities of any commonly eaten fruit." },
      { title: "Feeds Beneficial Bacteria", detail: "Anthocyanins reach the colon intact and selectively feed Bifidobacterium." },
      { title: "Reduces Inflammation", detail: "Polyphenol fermentation produces anti-inflammatory short-chain fatty acids." },
      { title: "Brain Health", detail: "Regular consumption is linked to improved memory and cognitive function in older adults." },
    ],
    pairsWith: ["Kefir", "Oats", "Yogurt", "Flaxseed"],
    publishedDay: 5,
  },
  {
    slug: "sauerkraut",
    name: "Sauerkraut",
    emoji: "🥗",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    tagline: "Two ingredients. Billions of bacteria.",
    description:
      "Sauerkraut is simply cabbage and salt — fermented for days or weeks until teeming with live Lactobacillus bacteria. It's one of the oldest fermented foods in human history, eaten across Europe for centuries as a preservation method and digestive medicine. Raw, unpasteurised sauerkraut is a living food. Pasteurised versions sold in jars have no live cultures.",
    howToEat:
      "Two tablespoons alongside any meal. Always buy raw and refrigerated — not the shelf-stable pasteurised version which has no live cultures. Add to salads, grain bowls, or alongside eggs. You can make your own with nothing but a cabbage, salt, and a jar — it takes 5 days.",
    science:
      "A single serving of homemade sauerkraut can contain more live bacteria than an entire bottle of probiotic supplements — with greater strain diversity.",
    scienceSource: "Parvez et al., Journal of Applied Microbiology, 2006",
    benefits: [
      { title: "Dense in Live Cultures", detail: "Billions of CFU of Lactobacillus per serving — in a form your gut can absorb." },
      { title: "Vitamin C Rich", detail: "Fermentation increases bioavailable Vitamin C — historically used to prevent scurvy at sea." },
      { title: "Digestive Enzyme Source", detail: "Contains natural digestive enzymes that help break down food more efficiently." },
      { title: "Mood Support", detail: "Lactobacillus strains in sauerkraut produce GABA — a neurotransmitter that reduces anxiety." },
    ],
    pairsWith: ["Garlic", "Kimchi", "Eggs", "Sourdough"],
    publishedDay: 6,
  },
  {
    slug: "olive-oil",
    name: "Olive Oil",
    emoji: "🫒",
    category: "Fats & Oils",
    biotic: "prebiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-yellow))",
    tagline: "The Mediterranean microbiome in a bottle.",
    description:
      "Extra virgin olive oil is one of the most comprehensively studied foods for gut health. Its polyphenols — particularly oleocanthal and oleuropein — act as prebiotics, feeding beneficial bacteria, while its oleic acid content reduces gut inflammation. The Mediterranean diet's remarkable health outcomes are largely attributed to olive oil as its primary fat source.",
    howToEat:
      "Use extra virgin olive oil as your default cooking fat and finishing oil. Drizzle generously over vegetables, salads, soups, and grains. Don't fear the calories — the polyphenols are worth it. Buy cold-pressed, in dark glass bottles, and use within 6 months of opening for maximum polyphenol content.",
    science:
      "Oleocanthal in extra virgin olive oil has anti-inflammatory effects similar to ibuprofen at culinary doses, while olive oil polyphenols selectively increase Bifidobacterium and Lactobacillus populations.",
    scienceSource: "Beauchamp et al., Nature, 2005",
    benefits: [
      { title: "Anti-inflammatory", detail: "Oleocanthal inhibits COX-1 and COX-2 enzymes — the same pathway as ibuprofen." },
      { title: "Prebiotic Polyphenols", detail: "Oleuropein and hydroxytyrosol selectively feed beneficial gut bacteria." },
      { title: "Heart Protection", detail: "Oleic acid reduces LDL oxidation and cardiovascular inflammation." },
      { title: "Gut Barrier Support", detail: "Reduces intestinal permeability and strengthens tight junction proteins in the gut lining." },
    ],
    pairsWith: ["Garlic", "Vegetables", "Legumes", "Sourdough"],
    publishedDay: 7,
  },
]

// Get today's food based on the day of the year
export function getTodaysFood(): Food {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  // Cycle through foods based on day of year
  const index = (dayOfYear - 1) % foods.length
  return foods[index]
}

export function getFoodBySlug(slug: string): Food | undefined {
  return foods.find((f) => f.slug === slug)
}

export function getFoodsByBiotic(biotic: BioticType): Food[] {
  if (biotic === "all") return foods
  return foods.filter((f) => f.biotic === biotic)
}

export function getFoodsByCategory(category: FoodCategory): Food[] {
  return foods.filter((f) => f.category === category)
}

export const bioticColors: Record<BioticType, string> = {
  prebiotic: "var(--icon-lime)",
  probiotic: "var(--icon-teal)",
  postbiotic: "var(--icon-orange)",
  all: "var(--icon-green)",
}

export const bioticLabels: Record<BioticType, string> = {
  prebiotic: "Prebiotic",
  probiotic: "Probiotic",
  postbiotic: "Postbiotic",
  all: "All Biotics",
}
