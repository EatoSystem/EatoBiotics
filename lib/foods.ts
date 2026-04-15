export type BioticType = "prebiotic" | "probiotic" | "postbiotic" | "protein" | "all"

export type FoodCategory =
  | "Vegetables"
  | "Fruit"
  | "Grains & Legumes"
  | "Fermented"
  | "Fats & Oils"
  | "Protein"
  | "Herbs & Spices"
  | "Sea Vegetables"
  | "Nuts & Seeds"
  | "Dairy"

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
  brainHealth?: boolean // true = highlighted in gut-brain section
}

export const foods: Food[] = [
  // ─── PREBIOTIC FOODS ───────────────────────────────────────────────────────

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
    brainHealth: true,
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
    brainHealth: true,
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
    brainHealth: true,
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
      "Extra virgin olive oil is one of the most comprehensively studied foods for food system health. Its polyphenols — particularly oleocanthal and oleuropein — act as prebiotics, feeding beneficial bacteria, while its oleic acid content reduces gut inflammation. The Mediterranean diet's remarkable health outcomes are largely attributed to olive oil as its primary fat source.",
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
  {
    slug: "onions",
    name: "Onions",
    emoji: "🧅",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-yellow))",
    tagline: "Nature's richest source of inulin.",
    description:
      "Onions are one of the single best prebiotic foods you can eat — raw onion contains up to 7.5g of inulin per 100g, making it one of the most concentrated prebiotic sources in any kitchen. They also contain quercetin, a powerful polyphenol that has anti-inflammatory, antiviral, and antioxidant properties. Their pungent flavour comes from sulphur compounds similar to garlic.",
    howToEat:
      "Eat them raw for maximum prebiotic impact — finely sliced in salads, salsas, or sandwiches. Cooked onions still provide fibre and flavour but lose some prebiotic potency. Red onions have higher quercetin content than white. Spring onions and leeks (same family) are equally effective and milder in flavour.",
    science:
      "Inulin from onions has been shown in multiple controlled trials to significantly increase Bifidobacterium longum populations — one of the key species linked to reduced anxiety, improved digestion, and stronger gut barrier function.",
    scienceSource: "Kelly, Journal of Nutrition, 2009",
    benefits: [
      { title: "Highest Inulin Density", detail: "Up to 7.5g inulin per 100g — one of the most concentrated prebiotic foods available." },
      { title: "Quercetin Content", detail: "Powerful anti-inflammatory polyphenol that also inhibits histamine release." },
      { title: "Feeds Bifidobacterium", detail: "Selectively fuels beneficial bacteria without feeding pathogenic strains." },
      { title: "Sulphur Compounds", detail: "Similar to garlic — provide antimicrobial and cardiovascular benefits." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Kimchi", "Legumes"],
    publishedDay: 9,
  },
  {
    slug: "banana",
    name: "Banana",
    emoji: "🍌",
    category: "Fruit",
    biotic: "prebiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-yellow))",
    tagline: "Resistant starch — the prebiotic you didn't know about.",
    description:
      "Slightly underripe bananas are one of the best sources of resistant starch — a type of prebiotic fibre that escapes digestion in the small intestine and arrives intact in the colon where gut bacteria ferment it into butyrate, one of the most beneficial short-chain fatty acids. As bananas ripen, resistant starch converts to sugar — so for prebiotic benefit, eat them just before fully ripe.",
    howToEat:
      "Eat slightly green or just-ripe for maximum resistant starch. Add to overnight oats with kefir for a powerful prebiotic-probiotic breakfast combination. Freeze overripe bananas and blend from frozen for smoothies. One banana daily is sufficient — two gives roughly 5-6g of prebiotic fibre.",
    science:
      "Resistant starch from unripe bananas significantly increases butyrate-producing bacteria including Faecalibacterium prausnitzii — one of the most important protective bacteria in the human gut.",
    scienceSource: "Martínez et al., mBio, 2013",
    benefits: [
      { title: "Resistant Starch Source", detail: "Unripe bananas deliver 4-6g resistant starch per fruit — a direct prebiotic fuel source." },
      { title: "Butyrate Production", detail: "Feeds butyrate-producing bacteria that protect the gut lining and reduce inflammation." },
      { title: "Blood Sugar Friendly", detail: "Resistant starch slows glucose absorption significantly compared to ripe bananas." },
      { title: "Potassium Rich", detail: "Supports electrolyte balance, blood pressure regulation, and muscle function." },
    ],
    pairsWith: ["Kefir", "Oats", "Blueberries", "Flaxseed"],
    publishedDay: 11,
  },
  {
    slug: "leeks",
    name: "Leeks",
    emoji: "🥬",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    tagline: "Ireland's native prebiotic powerhouse.",
    description:
      "Leeks are in the same allium family as garlic and onions, and share their powerful prebiotic properties — particularly inulin and fructooligosaccharides (FOS). Widely grown across Ireland, leeks are one of the most culturally rooted gut-health foods available. They are gentler on digestion than raw onion, making them accessible even for people with sensitive guts.",
    howToEat:
      "Sauté gently in olive oil with garlic for a classic combination that maximises prebiotic benefit. Add to soups, stews, and gratins. The dark green tops are often discarded but are nutritionally the most valuable part. For Irish provenance, look for Wexford or Kildare leeks from September to April.",
    science:
      "The inulin in leeks selectively feeds Bifidobacterium and has been shown to increase short-chain fatty acid production — particularly acetate and propionate, which support colon health and metabolic function.",
    scienceSource: "Roberfroid, Journal of Nutrition, 2007",
    county: "Wexford",
    benefits: [
      { title: "Rich in Inulin", detail: "Similar prebiotic profile to garlic and onion — with a gentler flavour and easier digestion." },
      { title: "Gentle Prebiotic", detail: "Better tolerated than raw onion for people with IBS or sensitive guts." },
      { title: "Folate Source", detail: "One of the best vegetable sources of folate — essential for cell repair and DNA methylation." },
      { title: "Vitamin K", detail: "High in Vitamin K2, supporting bone health and cardiovascular function." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Onions", "Potato"],
    publishedDay: 13,
  },
  {
    slug: "flaxseed",
    name: "Flaxseed",
    emoji: "🌻",
    category: "Nuts & Seeds",
    biotic: "prebiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Ground daily. Fed daily. The omega-3 prebiotic.",
    description:
      "Ground flaxseed is a dual-action gut food — it provides both prebiotic soluble fibre (mucilage) that feeds beneficial bacteria, and alpha-linolenic acid (ALA), the plant form of omega-3 that reduces gut inflammation. Whole flaxseeds pass through undigested, so grinding them is essential. One tablespoon daily is one of the highest-impact single food habits you can build.",
    howToEat:
      "Grind fresh in a small coffee grinder and use within a week (ground flaxseed oxidises quickly). Add one tablespoon to overnight oats, smoothies, yogurt, or soups. It has almost no flavour — making it the easiest daily gut habit to maintain. Store whole seeds in the freezer and grind as needed.",
    science:
      "Flaxseed lignans and mucilage fibre have been shown to significantly increase Bifidobacterium and Lactobacillus while reducing Firmicutes/Bacteroidetes ratio — a key marker of gut dysbiosis.",
    scienceSource: "Baxter et al., Gut Microbes, 2019",
    benefits: [
      { title: "Mucilage Prebiotic Fibre", detail: "Forms a gel in the gut that selectively feeds Bifidobacterium and acts as a prebiotic." },
      { title: "Omega-3 ALA", detail: "Plant-based omega-3 that reduces intestinal inflammation and supports the gut lining." },
      { title: "Lignan Content", detail: "Flaxseed has the highest lignan content of any food — with anti-cancer and hormone-balancing properties." },
      { title: "Bowel Regularity", detail: "Mucilage fibre improves transit time and reduces constipation reliably." },
    ],
    pairsWith: ["Oats", "Kefir", "Blueberries", "Banana"],
    publishedDay: 15,
  },

  // ─── PROBIOTIC FOODS ───────────────────────────────────────────────────────

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
    brainHealth: true,
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
    brainHealth: true,
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
    slug: "yogurt",
    name: "Natural Yogurt",
    emoji: "🍦",
    category: "Dairy",
    biotic: "probiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))",
    tagline: "The everyday probiotic most people already eat.",
    description:
      "Full-fat natural yogurt is one of the most accessible probiotic foods — containing Lactobacillus bulgaricus and Streptococcus thermophilus by law in most countries. Greek yogurt concentrates the protein and cultures by straining out the whey. Look for 'live cultures' on the label — and avoid sweetened varieties which feed harmful bacteria as readily as helpful ones.",
    howToEat:
      "Eat plain full-fat yogurt with berries, seeds, and a drizzle of honey. Use as a base for overnight oats or smoothies. Mix with garlic and cucumber for a quick tzatziki. Always choose unsweetened — you can add your own natural sweetness from fruit. Greek yogurt has twice the protein of regular yogurt, making it an ideal breakfast food.",
    science:
      "Regular yogurt consumption is associated with a 19% reduction in type 2 diabetes risk, improved lactose digestion, and modest increases in microbiome diversity compared to non-fermented dairy.",
    scienceSource: "Chen et al., BMC Medicine, 2014",
    benefits: [
      { title: "Live Cultures", detail: "Contains Lactobacillus bulgaricus and Streptococcus thermophilus — beneficial probiotic strains." },
      { title: "High Protein", detail: "Greek yogurt provides 15-20g protein per 200g — ideal for muscle maintenance." },
      { title: "Calcium Source", detail: "One of the most bioavailable sources of calcium for bone and food system health." },
      { title: "Improves Lactose Digestion", detail: "The live cultures pre-digest lactose — making it tolerable for most sensitive individuals." },
    ],
    pairsWith: ["Blueberries", "Oats", "Flaxseed", "Honey"],
    publishedDay: 17,
    brainHealth: true,
  },
  {
    slug: "miso",
    name: "Miso",
    emoji: "🍜",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Japan's gut-healing umami paste.",
    description:
      "Miso is a fermented soybean paste that has been a cornerstone of Japanese cuisine and traditional medicine for over 1,000 years. The fermentation process — using Aspergillus oryzae mould — produces a rich array of live beneficial bacteria, digestive enzymes, B vitamins, and bioavailable amino acids. White miso is milder and fermented for weeks; red miso is aged for months and significantly more intense.",
    howToEat:
      "Never boil miso — heat above 70°C destroys the live cultures. Stir into soups after removing from the heat, blend into dressings, or use as a marinade. A teaspoon dissolved in warm water is a simple, powerful daily gut tonic. One tablespoon of miso paste provides roughly a billion CFU of beneficial bacteria.",
    science:
      "Regular miso consumption is associated with lower rates of gastric cancer in Japanese epidemiological studies, and miso's isoflavones have been shown to support oestrogen balance and reduce menopausal symptoms.",
    scienceSource: "Watanabe et al., Japanese Journal of Clinical Oncology, 1984",
    benefits: [
      { title: "Live Beneficial Bacteria", detail: "Rich in Aspergillus oryzae and Lactobacillus strains that directly seed the gut." },
      { title: "Umami Amino Acids", detail: "Fermentation produces bioavailable glutamine — critical for gut lining repair." },
      { title: "B Vitamin Source", detail: "Miso is one of the few plant sources of Vitamin B12 — important for nerve function." },
      { title: "Isoflavones", detail: "Soy isoflavones support hormone balance and have anti-cancer properties." },
    ],
    pairsWith: ["Garlic", "Ginger", "Seaweed", "Tofu"],
    publishedDay: 19,
  },
  {
    slug: "sourdough",
    name: "Sourdough",
    emoji: "🍞",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-green))",
    tagline: "The bread that your gut actually likes.",
    description:
      "Real sourdough — made with a live starter culture — is fermented for 12-72 hours, fundamentally changing its nutritional profile. The long fermentation process partially breaks down gluten, reduces phytic acid (which blocks mineral absorption), increases B vitamins, and creates lactic acid bacteria that benefit the gut. Industrial 'sourdough' with vinegar added is not the same thing.",
    howToEat:
      "Buy genuine sourdough from an artisan baker with a minimum 24-hour fermentation — or learn to make it. The sour taste is lactic acid, produced by the bacterial cultures. Toast lightly to preserve more of the culture. Top with avocado and kimchi for a complete prebiotic-probiotic combination. Look for whole grain or rye sourdough for maximum fibre content.",
    science:
      "Long-fermented sourdough has a significantly lower glycaemic index than commercial bread (54 vs 71) and has been shown to reduce post-meal blood glucose spikes by up to 36% compared to standard wheat bread.",
    scienceSource: "Liljeberg & Björck, American Journal of Clinical Nutrition, 1996",
    benefits: [
      { title: "Reduced Gluten Reactivity", detail: "Long fermentation partially breaks down gluten, improving tolerance in non-coeliac sensitivity." },
      { title: "Low Glycaemic Index", detail: "Significantly lower blood sugar response than commercial bread — even whole grain varieties." },
      { title: "Improved Mineral Absorption", detail: "Phytic acid reduction means more iron, zinc, and magnesium bioavailability." },
      { title: "Lactic Acid Bacteria", detail: "Live starter cultures contribute directly to gut microbiome diversity." },
    ],
    pairsWith: ["Sauerkraut", "Kimchi", "Olive Oil", "Garlic"],
    publishedDay: 21,
  },

  // ─── PROTEIN FOODS ─────────────────────────────────────────────────────────

  {
    slug: "eggs",
    name: "Eggs",
    emoji: "🥚",
    category: "Protein",
    biotic: "protein",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "The most complete protein in your kitchen.",
    description:
      "Eggs are one of the most nutritionally complete foods available — containing all nine essential amino acids, along with choline (critical for gut lining integrity and brain function), lutein, selenium, and vitamins A, B2, B12, and D. Pasture-raised eggs have significantly higher omega-3 and vitamin D content than factory-farmed equivalents. The yolk is where almost all the nutrition lives.",
    howToEat:
      "Eat the whole egg — the yolk is not the enemy. Soft-boil or poach to preserve the most nutrients. Scramble gently on low heat with olive oil. Pair with kimchi or sauerkraut for a probiotic-protein combination. Two eggs provides roughly 12g of complete protein — alongside choline and B12 that plant foods cannot easily replicate.",
    science:
      "Dietary choline from eggs is directly used to produce phosphatidylcholine — a key component of the intestinal mucus layer that protects the gut lining. Choline deficiency is associated with fatty liver disease and increased intestinal permeability.",
    scienceSource: "Zeisel & da Costa, Nutrition Reviews, 2009",
    county: "Cork",
    benefits: [
      { title: "Complete Protein", detail: "All 9 essential amino acids in highly bioavailable form — the reference protein for nutritional science." },
      { title: "Choline for Gut Lining", detail: "Choline builds phosphatidylcholine — essential for maintaining the protective mucus layer in the gut." },
      { title: "Vitamin D Source", detail: "One of the few foods naturally containing Vitamin D — critical for immune regulation and gut integrity." },
      { title: "B12 Rich", detail: "Essential for nerve function, DNA synthesis, and gut bacteria regulation." },
    ],
    pairsWith: ["Kimchi", "Sauerkraut", "Sourdough", "Olive Oil"],
    publishedDay: 23,
    brainHealth: true,
  },
  {
    slug: "wild-salmon",
    name: "Wild Salmon",
    emoji: "🐟",
    category: "Protein",
    biotic: "protein",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    tagline: "Omega-3 that feeds your gut and your brain.",
    description:
      "Wild salmon is one of the most important foods for food system health — not for its protein alone, but for its omega-3 fatty acids (EPA and DHA) which directly reduce intestinal inflammation, support the gut-brain axis, and feed the specific bacteria that produce anti-inflammatory compounds. Wild-caught salmon has 3-4x the omega-3 content of farmed salmon and significantly lower inflammatory omega-6 fat. Atlantic salmon farmed in Ireland is among the best quality in Europe.",
    howToEat:
      "Aim for 2-3 servings per week. Pan-fry skin-side down in olive oil for 5-6 minutes without flipping — the skin protects the flesh. Pair with prebiotic vegetables and olive oil for maximum gut-health synergy. Smoked salmon on sourdough with kefir cream cheese is an excellent probiotic-protein breakfast. Don't overcook — salmon should be just opaque at the centre.",
    science:
      "EPA and DHA from oily fish directly reduce gut inflammation by modulating the gut microbiome — increasing anti-inflammatory Lactobacillus and decreasing pro-inflammatory Firmicutes. Regular oily fish consumption is associated with a 30-40% reduction in colorectal cancer risk.",
    scienceSource: "Costantini et al., Nutrients, 2017",
    county: "Kerry",
    benefits: [
      { title: "EPA & DHA Omega-3", detail: "The most bioavailable form of omega-3 — directly reduces gut and systemic inflammation." },
      { title: "Gut-Brain Axis Support", detail: "Omega-3 supports serotonin production and the gut-brain communication pathway." },
      { title: "Complete Protein", detail: "30g of highly bioavailable protein per 100g serving — supports gut lining repair." },
      { title: "Astaxanthin", detail: "The antioxidant pigment giving salmon its colour — more powerful than Vitamin C for reducing oxidative stress." },
    ],
    pairsWith: ["Olive Oil", "Leeks", "Garlic", "Sauerkraut"],
    publishedDay: 25,
    brainHealth: true,
  },
  {
    slug: "lentils",
    name: "Lentils",
    emoji: "🫘",
    category: "Grains & Legumes",
    biotic: "protein",
    accentColor: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
    tagline: "The protein that also feeds your microbiome.",
    description:
      "Lentils are uniquely positioned on the EatoBiotics plate — they provide plant-based protein (18g per 100g cooked) while simultaneously acting as a prebiotic, delivering resistant starch and soluble fibre that feeds beneficial gut bacteria. They're one of the most data-supported foods for reducing cardiovascular risk, regulating blood sugar, and improving microbiome diversity. Red, green, or black — each has a slightly different fibre and protein profile.",
    howToEat:
      "Red lentils cook in 15-20 minutes without soaking — ideal for soups and dahls. Green and brown lentils hold their shape better and work well in salads and stews. Add a strip of kombu seaweed while cooking to reduce gas production. Rinse canned lentils thoroughly. Pair with olive oil and garlic for a Mediterranean-style plate that maximises gut benefit.",
    science:
      "Regular legume consumption reduces the risk of type 2 diabetes by 35%, cardiovascular disease by 22%, and is one of the strongest dietary predictors of microbiome diversity across multiple global populations.",
    scienceSource: "Kim et al., British Journal of Nutrition, 2016",
    benefits: [
      { title: "Plant Protein + Prebiotic", detail: "Unique dual action — provides protein while simultaneously feeding beneficial gut bacteria." },
      { title: "Resistant Starch", detail: "Significant resistant starch content that feeds butyrate-producing bacteria in the colon." },
      { title: "Iron & Folate", detail: "One of the best plant sources of iron and folate — essential for energy and cell repair." },
      { title: "Blood Sugar Control", detail: "Low glycaemic impact — one of the best foods for post-meal glucose stability." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Onions", "Kimchi"],
    publishedDay: 27,
  },
  {
    slug: "chicken",
    name: "Free-Range Chicken",
    emoji: "🍗",
    category: "Protein",
    biotic: "protein",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    tagline: "Ireland's most versatile clean protein.",
    description:
      "Free-range chicken is one of Ireland's most important protein foods — and when sourced well, one of the cleanest and most gut-friendly animal proteins available. It provides complete protein with all essential amino acids, glycine-rich connective tissue (especially in thighs and wings), and zinc and selenium which are critical for gut lining repair and immune function. Monaghan and Cavan are Ireland's primary poultry counties.",
    howToEat:
      "Use bone-in thighs over breast for more nutrients and better flavour. Slow-roast with garlic and olive oil. Make bone broth from the carcass — simmering for 12-24 hours releases collagen and glycine that directly repair the gut lining. Pair with fermented vegetables for a complete probiotic-protein plate. Avoid processed chicken products which contain additives that disrupt the microbiome.",
    science:
      "Bone broth from chicken contains high concentrations of glutamine and glycine — two amino acids clinically shown to reduce intestinal permeability (leaky gut) and support tight junction protein synthesis in the gut lining.",
    scienceSource: "Rao & Samak, Journal of Epithelial Biology & Pharmacology, 2012",
    county: "Monaghan",
    benefits: [
      { title: "Complete Protein", detail: "All essential amino acids in highly digestible form — ideal for gut lining repair." },
      { title: "Glycine for Gut Lining", detail: "Especially in darker cuts and bone broth — glycine directly repairs intestinal tight junctions." },
      { title: "Zinc Source", detail: "Zinc is critical for gut lining integrity — deficiency directly causes increased intestinal permeability." },
      { title: "Selenium", detail: "Essential for glutathione production — the body's primary antioxidant and gut-protective enzyme." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Sauerkraut", "Leeks"],
    publishedDay: 29,
  },
  {
    slug: "almonds",
    name: "Almonds",
    emoji: "🥜",
    category: "Nuts & Seeds",
    biotic: "protein",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-lime))",
    tagline: "The snack that secretly feeds your microbiome.",
    description:
      "Almonds are unusual among protein foods — they provide 21g protein per 100g while also acting as a prebiotic, delivering polyphenols and fibre that significantly increase Bifidobacterium and Lactobacillus populations. The almond skin is where most of the prebiotic fibre lives — blanched almonds lose much of this benefit. Raw, whole almonds with skins are the most gut-beneficial form.",
    howToEat:
      "Eat 25-30g daily (roughly a small handful) as a snack or add to overnight oats. Always choose raw, unsalted almonds with skin intact. Almond butter from whole almonds is a convenient alternative — check there's no added oil or sugar. Soaking almonds overnight makes them easier to digest and slightly increases prebiotic availability.",
    science:
      "A randomised controlled trial found that consuming 56g almonds daily for 8 weeks significantly increased Bifidobacterium and Lactobacillus while reducing Clostridium perfringens — a pathogenic species associated with gut dysbiosis.",
    scienceSource: "Barroso et al., European Journal of Nutrition, 2021",
    benefits: [
      { title: "Prebiotic Polyphenols", detail: "Almond skins contain prebiotic compounds that selectively feed Bifidobacterium." },
      { title: "Vitamin E", detail: "One of the richest plant sources of Vitamin E — a powerful antioxidant that protects gut cells." },
      { title: "Magnesium", detail: "Essential for over 300 enzymatic reactions, including gut motility and nerve function." },
      { title: "Healthy Fats", detail: "Monounsaturated oleic acid — the same fat as olive oil — reduces systemic inflammation." },
    ],
    pairsWith: ["Oats", "Kefir", "Blueberries", "Banana"],
    publishedDay: 31,
    brainHealth: true,
  },

  // ─── POSTBIOTIC FOODS ──────────────────────────────────────────────────────

  {
    slug: "cooked-cooled-potato",
    name: "Cooked & Cooled Potato",
    emoji: "🥔",
    category: "Vegetables",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Cooling transforms starch into gut medicine.",
    description:
      "Cooking a potato and then cooling it completely triggers a remarkable transformation — the digestible starch crystallises into resistant starch type 3, which escapes digestion in the small intestine and reaches the colon intact. There, gut bacteria ferment it into butyrate — the most important short-chain fatty acid for colon health. Reheating briefly preserves most of this benefit. This makes the humble potato one of the most powerful postbiotic foods available.",
    howToEat:
      "Boil or steam potatoes, then refrigerate overnight before eating. Eat cold in salads, or reheat gently — reheating doesn't destroy the resistant starch completely. Potato salad with olive oil and apple cider vinegar is an ideal preparation. New potatoes and waxy varieties (Charlotte, Jersey Royals) retain more resistant starch than floury types. Eat skin-on for additional prebiotic fibre.",
    science:
      "Resistant starch type 3 from cooked and cooled potatoes is fermented by gut bacteria into butyrate at significantly higher rates than raw potato starch — butyrate is the primary fuel for colonocytes (colon lining cells) and has anti-cancer properties.",
    scienceSource: "Baxter et al., Cell Host & Microbe, 2019",
    county: "Donegal",
    benefits: [
      { title: "Butyrate Production", detail: "Resistant starch RS3 is fermented into butyrate — the primary fuel for the cells lining your colon." },
      { title: "Anti-inflammatory", detail: "Butyrate inhibits NF-κB signalling — one of the key inflammatory pathways in the gut." },
      { title: "Colon Cancer Protection", detail: "Butyrate induces apoptosis in cancerous colon cells while protecting healthy ones." },
      { title: "Potassium & Vitamin C", detail: "One of the best whole food sources of potassium and bioavailable Vitamin C." },
    ],
    pairsWith: ["Olive Oil", "Sauerkraut", "Garlic", "Leeks"],
    publishedDay: 33,
  },
  {
    slug: "apple-cider-vinegar",
    name: "Apple Cider Vinegar",
    emoji: "🍎",
    category: "Fermented",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    tagline: "Acetic acid — the postbiotic hiding in your pantry.",
    description:
      "Raw, unfiltered apple cider vinegar with 'the mother' contains acetic acid — the primary postbiotic compound produced when bacteria ferment ethanol. Acetic acid directly inhibits the growth of pathogenic bacteria, lowers post-meal blood glucose, and acts as a mild antimicrobial in the gut. The 'mother' — the cloudy sediment — contains beneficial bacteria, enzymes, and proteins from the fermentation process.",
    howToEat:
      "One tablespoon diluted in a large glass of water before meals is the most evidence-backed use — reducing post-meal blood sugar spikes. Drizzle over salads as a dressing. Always dilute — undiluted ACV can erode tooth enamel and irritate the oesophagus. Always choose raw, unfiltered with the mother (Bragg's is the most widely available). Never take it undiluted.",
    science:
      "A systematic review found that 15-30ml of apple cider vinegar daily significantly reduced fasting blood glucose, HbA1c, and post-meal glucose responses in people with type 2 diabetes and insulin resistance.",
    scienceSource: "Shishehbor et al., Journal of Evidence-Based Integrative Medicine, 2017",
    benefits: [
      { title: "Acetic Acid Postbiotic", detail: "Directly inhibits pathogenic bacteria including E. coli and Salmonella in the digestive tract." },
      { title: "Blood Sugar Control", detail: "Slows gastric emptying and starch digestion, significantly reducing post-meal glucose spikes." },
      { title: "Antimicrobial in the Gut", detail: "Lowers gut pH slightly, creating conditions unfavourable for pathogenic bacteria." },
      { title: "Contains the Mother", detail: "Raw ACV contains live enzymes, beneficial bacteria, and proteins from fermentation." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Salad Greens", "Cooked & Cooled Potato"],
    publishedDay: 35,
  },
  {
    slug: "dark-chocolate",
    name: "Dark Chocolate",
    emoji: "🍫",
    category: "Fats & Oils",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))",
    tagline: "The gut food that tastes like a reward.",
    description:
      "Dark chocolate (85%+ cacao) is one of the most surprising gut-health foods. Its polyphenols — particularly flavanols — are metabolised by gut bacteria into postbiotic compounds including short-chain fatty acids and phenolic acids with anti-inflammatory and neuroprotective effects. The fermentation of cacao polyphenols in the colon has been shown to selectively increase Lactobacillus and Bifidobacterium while decreasing pathogenic Clostridium.",
    howToEat:
      "20-30g of 85%+ dark chocolate daily is the evidence-backed dose. The higher the cacao percentage, the more polyphenols and the less sugar. Eat it slowly — letting it melt rather than chewing preserves more polyphenol activity. Pair with blueberries for a combined polyphenol effect. Avoid milk chocolate — the milk proteins bind to the polyphenols and reduce their bioavailability.",
    science:
      "Gut bacteria ferment cacao polyphenols into anti-inflammatory phenolic acids. A 4-week trial showed 85% dark chocolate consumption significantly increased Lactobacillus and Bifidobacterium while reducing Clostridium histolyticum — a marker of gut dysbiosis.",
    scienceSource: "Tzounis et al., American Journal of Clinical Nutrition, 2011",
    benefits: [
      { title: "Postbiotic Phenolic Acids", detail: "Gut fermentation of cocoa flavanols produces anti-inflammatory phenolic metabolites." },
      { title: "Increases Bifidobacterium", detail: "Selectively feeds beneficial bacteria while reducing pathogenic Clostridium strains." },
      { title: "Neuroprotective", detail: "Phenolic metabolites cross the blood-brain barrier and reduce neuroinflammation." },
      { title: "Cardiovascular Protection", detail: "Flavanols improve blood flow, reduce blood pressure, and lower LDL oxidation." },
    ],
    pairsWith: ["Blueberries", "Kefir", "Almonds", "Banana"],
    publishedDay: 37,
    brainHealth: true,
  },
  {
    slug: "green-tea",
    name: "Green Tea",
    emoji: "🍵",
    category: "Herbs & Spices",
    biotic: "postbiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    tagline: "EGCG — the postbiotic compound in every cup.",
    description:
      "Green tea is one of the most researched plants on earth. Its primary polyphenol, EGCG (epigallocatechin gallate), is metabolised by gut bacteria into postbiotic compounds — specifically valerolactones and valeric acids — that have potent anti-inflammatory, anti-cancer, and neuroprotective effects. Regular green tea consumption is one of the strongest dietary correlates of longevity across multiple epidemiological studies in Japan.",
    howToEat:
      "Brew at 70-80°C — not boiling, which destroys EGCG and makes it bitter. Steep for 2-3 minutes. Drink 2-3 cups daily between meals for maximum absorption. Matcha (ground whole green tea leaf) provides 10-15x the EGCG of brewed green tea. Avoid adding milk — the proteins bind to the polyphenols and reduce bioavailability.",
    science:
      "EGCG metabolites produced by gut bacteria have been shown to selectively increase Akkermansia muciniphila — a species strongly associated with lean body composition, reduced inflammation, and improved gut barrier function.",
    scienceSource: "Zhao et al., Journal of Nutritional Biochemistry, 2019",
    benefits: [
      { title: "EGCG Postbiotic Metabolites", detail: "Gut bacteria convert EGCG into valerolactones — powerful anti-inflammatory postbiotics." },
      { title: "Increases Akkermansia", detail: "Selectively feeds Akkermansia muciniphila — a keystone species for gut barrier health." },
      { title: "Anti-cancer Properties", detail: "EGCG metabolites induce apoptosis in cancer cells and inhibit tumour angiogenesis." },
      { title: "Cognitive Protection", detail: "Regular consumption is linked to reduced risk of Alzheimer's and Parkinson's disease." },
    ],
    pairsWith: ["Dark Chocolate", "Blueberries", "Garlic", "Ginger"],
    publishedDay: 39,
    brainHealth: true,
  },
  {
    slug: "bone-broth",
    name: "Bone Broth",
    emoji: "🍲",
    category: "Protein",
    biotic: "postbiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Liquid gut lining — collagen in every cup.",
    description:
      "Bone broth is made by simmering animal bones for 12-48 hours — releasing collagen, gelatin, glutamine, glycine, and proline into the liquid. These compounds are direct postbiotic substrates — they bypass the microbiome and act directly on the gut lining, repairing tight junctions, reducing intestinal permeability, and providing the building blocks for mucus layer regeneration. It is one of the oldest healing foods in every food culture on earth.",
    howToEat:
      "Drink 250ml warm daily as a morning tonic or use as the base for soups, stews, and sauces. Make your own from chicken carcasses or beef bones — add apple cider vinegar to the cold water before heating to leach minerals from the bones. Skim the fat if desired. Commercial cartons are convenient but check they are made from real bones and not just stock cubes. Irish grass-fed beef bones produce superior broth.",
    science:
      "Glutamine from bone broth has been clinically shown to restore tight junction protein expression in the intestinal epithelium — directly reducing intestinal permeability. Glycine supplementation reduces gut inflammation markers in IBD patients.",
    scienceSource: "Rao & Samak, Journal of Epithelial Biology & Pharmacology, 2012",
    county: "Tipperary",
    benefits: [
      { title: "Gut Lining Repair", detail: "Glutamine directly restores tight junction proteins — the molecular seals between gut cells." },
      { title: "Collagen & Gelatin", detail: "Provides bioavailable collagen that supports the mucus layer protecting the intestinal wall." },
      { title: "Glycine", detail: "Reduces gut inflammation and supports bile acid production for fat digestion." },
      { title: "Mineral Density", detail: "Long simmering releases calcium, magnesium, phosphorus, and potassium from bones." },
    ],
    pairsWith: ["Garlic", "Leeks", "Ginger", "Apple Cider Vinegar"],
    publishedDay: 41,
  },

  // ─── NEW PREBIOTIC FOODS ──────────────────────────────────────────────────

  {
    slug: "asparagus",
    name: "Asparagus",
    emoji: "🌿",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    tagline: "A prebiotic powerhouse hiding in plain sight.",
    description:
      "Asparagus is one of the richest natural sources of inulin — the same prebiotic fibre found in garlic and onions. A single serving delivers 2-3 grams of inulin that passes through your upper digestive tract intact, arriving in the colon where Bifidobacteria ferment it into short-chain fatty acids. It also contains glutathione, one of the body's most important antioxidants.",
    howToEat:
      "Roast with olive oil and sea salt for 12 minutes at 200°C. Steam lightly and add to grain bowls. Shave raw into salads with lemon and parmesan. Grill alongside salmon for a prebiotic-protein combination.",
    science:
      "Asparagus inulin has been shown to significantly increase faecal Bifidobacterium counts within two weeks of regular consumption, with concurrent increases in butyrate production.",
    scienceSource: "Kleessen et al., British Journal of Nutrition, 1997",
    benefits: [
      { title: "Inulin Rich", detail: "2-3g of inulin per serving — a direct fuel source for beneficial Bifidobacteria." },
      { title: "Glutathione Source", detail: "Contains the body's master antioxidant, supporting liver detoxification and cellular repair." },
      { title: "Folate Dense", detail: "One of the best vegetable sources of folate, essential for DNA synthesis and cell division." },
      { title: "Anti-inflammatory", detail: "Contains saponins and flavonoids that reduce systemic inflammation." },
    ],
    pairsWith: ["Olive Oil", "Eggs", "Garlic", "Wild Salmon"],
    publishedDay: 42,
    brainHealth: true,
  },
  {
    slug: "jerusalem-artichoke",
    name: "Jerusalem Artichoke",
    emoji: "🥔",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
    tagline: "The highest inulin food on the planet.",
    description:
      "Jerusalem artichoke — also called sunchoke — contains up to 76% of its dry weight as inulin, making it the single richest source of prebiotic fibre in the human diet. This knobbly tuber feeds Bifidobacteria and Lactobacillus with remarkable efficiency. Start slowly — the high inulin content can cause gas in those not accustomed to prebiotic-rich foods.",
    howToEat:
      "Roast like potatoes with olive oil, rosemary, and garlic. Slice thinly and add raw to salads for a nutty crunch. Make a silky soup blended with leeks. Sauté with butter and thyme as a side dish.",
    science:
      "Jerusalem artichoke inulin increases Bifidobacterium populations by 10-fold in controlled feeding studies, with the most dramatic changes occurring in the first week of consumption.",
    scienceSource: "Kleessen et al., American Journal of Clinical Nutrition, 2007",
    benefits: [
      { title: "Highest Inulin Content", detail: "Up to 76% inulin by dry weight — no other food comes close as a Bifidobacterium fuel source." },
      { title: "Iron Absorption", detail: "Prebiotic fermentation increases mineral absorption, particularly iron and calcium." },
      { title: "Blood Sugar Stability", detail: "Inulin slows glucose absorption, making this an excellent low-GI carbohydrate source." },
      { title: "Potassium Rich", detail: "Contains more potassium per gram than bananas, supporting heart and muscle function." },
    ],
    pairsWith: ["Garlic", "Leeks", "Olive Oil", "Kefir"],
    publishedDay: 44,
  },
  {
    slug: "sweet-potato",
    name: "Sweet Potato",
    emoji: "🍠",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    tagline: "Cook it, cool it, and feed your microbiome.",
    description:
      "Sweet potato is a prebiotic goldmine — especially when cooked and cooled. The cooling process converts digestible starch into resistant starch, which passes through the small intestine and feeds colonic bacteria. The orange flesh is rich in beta-carotene, a powerful antioxidant that supports gut lining integrity and immune function.",
    howToEat:
      "Bake whole, cool, and use in salads for maximum resistant starch. Mash with a little butter and cinnamon. Make sweet potato wedges roasted with cumin and smoked paprika. Dice into grain bowls with tahini dressing.",
    science:
      "Cooked-and-cooled sweet potato contains up to 4% resistant starch by weight, which selectively increases butyrate-producing bacteria including Faecalibacterium prausnitzii.",
    scienceSource: "Birt et al., Advances in Nutrition, 2013",
    benefits: [
      { title: "Resistant Starch", detail: "Cooling after cooking creates resistant starch — a powerful fuel for butyrate-producing bacteria." },
      { title: "Beta-Carotene Rich", detail: "One medium sweet potato provides 400% of daily vitamin A needs via beta-carotene." },
      { title: "Gut Lining Support", detail: "Beta-carotene strengthens the intestinal mucus layer that protects against inflammation." },
      { title: "Fibre Dense", detail: "4g of fibre per medium potato, including both soluble and insoluble types." },
    ],
    pairsWith: ["Kimchi", "Olive Oil", "Yogurt", "Lentils"],
    publishedDay: 46,
  },
  {
    slug: "beetroot",
    name: "Beetroot",
    emoji: "🫒",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))",
    tagline: "Deep colour, deep microbiome benefits.",
    description:
      "Beetroot's deep red-purple colour comes from betalains — a class of polyphenol that acts as a potent prebiotic, selectively feeding beneficial gut bacteria. Beets are also rich in dietary nitrates, which the body converts to nitric oxide for improved blood flow and exercise performance. The fibre content supports regular bowel movements and microbiome diversity.",
    howToEat:
      "Roast whole in foil for 45 minutes, then peel and slice into salads. Grate raw into slaws with apple and kefir dressing. Blend into smoothies with blueberries and ginger. Pickle with apple cider vinegar for a probiotic-prebiotic combination.",
    science:
      "Beetroot betalains have been shown to increase populations of Lactobacillus and Bifidobacterium while simultaneously reducing markers of colonic inflammation.",
    scienceSource: "Clifford et al., Nutrients, 2015",
    benefits: [
      { title: "Betalain Polyphenols", detail: "Unique red-purple pigments that act as selective prebiotic fuel for beneficial bacteria." },
      { title: "Dietary Nitrates", detail: "Converted to nitric oxide in the body, improving blood flow and exercise performance." },
      { title: "Liver Support", detail: "Betaine in beetroot supports liver detoxification pathways and fat metabolism." },
      { title: "Anti-inflammatory", detail: "Betalains reduce oxidative stress and inflammation throughout the digestive tract." },
    ],
    pairsWith: ["Kefir", "Yogurt", "Garlic", "Walnuts"],
    publishedDay: 48,
  },
  {
    slug: "carrots",
    name: "Carrots",
    emoji: "🥕",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Simple, accessible, and quietly powerful.",
    description:
      "Carrots contain a unique type of soluble fibre called calcium pectate that promotes the growth of beneficial gut bacteria. Cooking breaks down cell walls to release more beta-carotene, while raw carrots provide a satisfying crunch and more intact fibre. They are one of the most accessible and affordable prebiotic vegetables available year-round.",
    howToEat:
      "Eat raw with hummus for intact prebiotic fibre. Roast with cumin and honey for sweetness. Add to soups and stews as a base vegetable. Grate into overnight oats with cinnamon and kefir.",
    science:
      "Carrot fibre has been shown to increase short-chain fatty acid production in the colon, with particular benefits for propionate — a SCFA that supports liver metabolism and blood sugar regulation.",
    scienceSource: "Slavin, Nutrients, 2013",
    benefits: [
      { title: "Calcium Pectate Fibre", detail: "A unique soluble fibre that promotes beneficial bacterial growth in the large intestine." },
      { title: "Beta-Carotene", detail: "Converted to vitamin A in the body — essential for immune function and gut lining integrity." },
      { title: "Affordable & Accessible", detail: "Available year-round, budget-friendly, and easy to incorporate into any meal." },
      { title: "Versatile Preparation", detail: "Beneficial both raw (more intact fibre) and cooked (more bioavailable beta-carotene)." },
    ],
    pairsWith: ["Olive Oil", "Garlic", "Ginger", "Lentils"],
    publishedDay: 50,
  },
  {
    slug: "mushrooms",
    name: "Mushrooms",
    emoji: "🍄",
    category: "Vegetables",
    biotic: "prebiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    tagline: "Beta-glucan from the forest floor.",
    description:
      "Mushrooms are rich in beta-glucans — the same class of prebiotic fibre found in oats, but with a different molecular structure that activates the immune system through gut-associated lymphoid tissue. They also contain unique polysaccharides that promote the growth of Bifidobacterium and support the gut-immune axis. Shiitake, maitake, and oyster mushrooms are particularly potent.",
    howToEat:
      "Sauté with garlic and thyme in olive oil. Add to stir-fries with soy sauce and ginger. Roast until crispy for umami-rich salad toppings. Make a rich mushroom broth as a base for soups.",
    science:
      "Mushroom beta-glucans have been shown to modulate the gut immune response by activating macrophages and dendritic cells in Peyer's patches — the immune sensors of the small intestine.",
    scienceSource: "Jayachandran et al., International Journal of Molecular Sciences, 2017",
    benefits: [
      { title: "Immune-Activating Beta-Glucans", detail: "Stimulate gut-associated immune cells through a unique receptor-mediated pathway." },
      { title: "Vitamin D Source", detail: "One of the only non-animal sources of vitamin D, especially when exposed to sunlight." },
      { title: "Prebiotic Polysaccharides", detail: "Unique fungal fibres that promote Bifidobacterium growth in the colon." },
      { title: "Ergothioneine", detail: "A rare antioxidant amino acid that protects cells from oxidative damage." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Miso", "Sourdough"],
    publishedDay: 52,
  },
  {
    slug: "barley",
    name: "Barley",
    emoji: "🌾",
    category: "Grains & Legumes",
    biotic: "prebiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-lime))",
    tagline: "Ancient grain, modern microbiome benefits.",
    description:
      "Barley contains the highest beta-glucan content of any grain — even more than oats. This soluble fibre forms a viscous gel in the gut that slows digestion, feeds beneficial bacteria, and produces significant amounts of butyrate. Hulled barley retains the bran layer with the most fibre, while pearl barley is quicker to cook but slightly lower in prebiotic content.",
    howToEat:
      "Use pearl barley in soups and stews. Cook hulled barley as a grain bowl base instead of rice. Add to salads with roasted vegetables and feta. Make barley risotto with mushrooms and parmesan.",
    science:
      "Barley beta-glucan consumption of 3g per day has been shown to reduce LDL cholesterol by 7% while simultaneously increasing faecal Bifidobacterium counts.",
    scienceSource: "AbuMweis et al., European Journal of Clinical Nutrition, 2010",
    benefits: [
      { title: "Highest Beta-Glucan", detail: "Contains more beta-glucan per serving than any other grain, including oats." },
      { title: "Butyrate Production", detail: "Beta-glucan fermentation produces significant butyrate — the primary fuel for colon cells." },
      { title: "Cholesterol Reduction", detail: "3g daily beta-glucan reduces LDL cholesterol by up to 7%." },
      { title: "Sustained Energy", detail: "Slow digestion provides steady blood sugar levels for hours after eating." },
    ],
    pairsWith: ["Mushrooms", "Lentils", "Garlic", "Yogurt"],
    publishedDay: 54,
  },

  // ─── NEW PROBIOTIC FOODS ──────────────────────────────────────────────────

  {
    slug: "kombucha",
    name: "Kombucha",
    emoji: "🍵",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))",
    tagline: "Living tea with a billion-year-old recipe.",
    description:
      "Kombucha is a fermented tea made by introducing a SCOBY (symbiotic culture of bacteria and yeast) to sweetened tea. The fermentation produces organic acids, B vitamins, and a diverse population of live bacteria and yeasts. The acetic acid content supports digestive function, while the polyphenols from the tea base provide additional prebiotic benefits.",
    howToEat:
      "Drink a small glass (150-200ml) with meals to aid digestion. Use as a base for salad dressings with olive oil and herbs. Mix with sparkling water for a lighter, more refreshing drink. Choose unpasteurised varieties and check sugar content — quality kombucha has less than 5g sugar per serving.",
    science:
      "Kombucha fermentation produces a complex community of Acetobacter, Gluconobacter, Lactobacillus, and various yeasts, along with organic acids that support gut pH and inhibit pathogenic bacteria.",
    scienceSource: "Jayabalan et al., Comprehensive Reviews in Food Science, 2014",
    benefits: [
      { title: "Diverse Microbe Community", detail: "Contains bacteria and yeasts not found in other fermented foods, increasing microbial diversity." },
      { title: "Organic Acids", detail: "Acetic and gluconic acids support healthy gut pH and inhibit harmful bacteria." },
      { title: "B Vitamin Production", detail: "Fermentation synthesises B1, B2, B6, and B12 — essential for energy metabolism." },
      { title: "Polyphenol Delivery", detail: "Tea polyphenols are partially fermented into more bioavailable forms." },
    ],
    pairsWith: ["Kimchi", "Sauerkraut", "Ginger", "Blueberries"],
    publishedDay: 56,
  },
  {
    slug: "tempeh",
    name: "Tempeh",
    emoji: "🫘",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    tagline: "Fermented soy with complete protein.",
    description:
      "Tempeh is a traditional Indonesian fermented food made by culturing whole soybeans with Rhizopus oligosporus — a fungus that binds the beans into a dense, nutty cake. Unlike tofu, tempeh retains the whole soybean and its fibre, while fermentation increases protein digestibility by up to 30% and reduces anti-nutritional factors like phytic acid.",
    howToEat:
      "Slice and pan-fry in sesame oil until golden and crispy. Marinate in soy sauce, garlic, and ginger before grilling. Crumble into stir-fries as a meat substitute. Steam and add to grain bowls with kimchi and vegetables.",
    science:
      "Tempeh fermentation produces significant quantities of vitamin B12 — rare in plant foods — along with bioactive peptides that have demonstrated ACE-inhibitory (blood pressure lowering) effects.",
    scienceSource: "Nout & Kiers, Journal of Applied Microbiology, 2005",
    benefits: [
      { title: "Complete Protein", detail: "All 9 essential amino acids with 20g protein per 100g — more digestible than unfermented soy." },
      { title: "Vitamin B12 Production", detail: "One of the few plant foods that naturally contains B12, produced during fermentation." },
      { title: "Reduced Anti-nutrients", detail: "Fermentation breaks down phytic acid, increasing mineral absorption by up to 60%." },
      { title: "Prebiotic Fibre", detail: "Retains the whole soybean's fibre, providing both probiotic cultures and prebiotic fuel." },
    ],
    pairsWith: ["Kimchi", "Miso", "Garlic", "Olive Oil"],
    publishedDay: 58,
  },
  {
    slug: "pickles",
    name: "Pickles",
    emoji: "🥒",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
    tagline: "Salt, water, time — the oldest probiotic recipe.",
    description:
      "Naturally fermented pickles (lacto-fermented, not vinegar-pickled) are among the simplest probiotic foods. Cucumbers submerged in saltwater develop a thriving Lactobacillus culture that produces lactic acid, preserving the vegetable and creating billions of live bacteria per serving. The key is choosing refrigerated pickles with no vinegar in the ingredient list.",
    howToEat:
      "Eat a few spears alongside any meal as a probiotic side. Chop into potato salads, grain bowls, or onto sandwiches. Drink a small amount of the brine for a concentrated dose of Lactobacillus. Make your own — cucumbers, salt, water, garlic, and dill in a jar for 3-5 days.",
    science:
      "Lacto-fermented pickles contain 1-10 billion CFU of Lactobacillus per serving, with L. plantarum and L. brevis being the dominant strains — both well-studied for their food system health benefits.",
    scienceSource: "Peres et al., Food Microbiology, 2012",
    benefits: [
      { title: "Lactobacillus Rich", detail: "Billions of live L. plantarum and L. brevis per serving — proven gut-supporting strains." },
      { title: "Electrolyte Source", detail: "The brine provides sodium and potassium for hydration and muscle function." },
      { title: "Zero Sugar", detail: "Fermentation consumes sugars, leaving a low-calorie, high-probiotic food." },
      { title: "Easy to Make", detail: "One of the simplest fermented foods to prepare at home with just salt and water." },
    ],
    pairsWith: ["Sauerkraut", "Sourdough", "Eggs", "Oats"],
    publishedDay: 60,
  },
  {
    slug: "aged-cheese",
    name: "Aged Cheese",
    emoji: "🧀",
    category: "Dairy",
    biotic: "probiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    tagline: "Time transforms milk into a living probiotic food.",
    description:
      "Aged cheeses like cheddar, gouda, parmesan, and gruyère undergo months or years of bacterial fermentation that produces diverse probiotic cultures. The long ageing process also breaks down lactose — making aged cheese tolerable for many lactose-intolerant people. Irish cheddar, made from grass-fed milk, contains higher levels of CLA and fat-soluble vitamins.",
    howToEat:
      "Grate aged parmesan over soups, salads, and grain bowls. Slice mature cheddar with apple and walnuts for a snack. Add crumbled gouda to roasted vegetables. Choose cheese aged 6+ months for maximum probiotic diversity and minimal lactose.",
    science:
      "Aged cheeses contain diverse Lactobacillus, Lactococcus, and Propionibacterium populations that survive stomach acid and reach the colon alive — contributing to microbial diversity.",
    scienceSource: "Marco et al., Current Opinion in Biotechnology, 2017",
    county: "Cork",
    benefits: [
      { title: "Diverse Probiotic Cultures", detail: "Months of ageing develops Lactobacillus, Lactococcus, and Propionibacterium communities." },
      { title: "Low Lactose", detail: "Fermentation breaks down most lactose — tolerable for many lactose-intolerant individuals." },
      { title: "CLA Content", detail: "Grass-fed cheese contains conjugated linoleic acid — an anti-inflammatory fatty acid." },
      { title: "Calcium & K2", detail: "Rich in calcium and vitamin K2, which directs calcium into bones rather than arteries." },
    ],
    pairsWith: ["Walnuts", "Sourdough", "Apple Cider Vinegar", "Oats"],
    publishedDay: 62,
  },
  {
    slug: "water-kefir",
    name: "Water Kefir",
    emoji: "🥤",
    category: "Fermented",
    biotic: "probiotic",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
    tagline: "Dairy-free probiotic fizz.",
    description:
      "Water kefir is a dairy-free fermented beverage made by culturing sugar water with water kefir grains — translucent, jelly-like granules of bacteria and yeast. It produces a lightly fizzy, tangy drink teeming with diverse probiotic strains. Unlike milk kefir, water kefir is suitable for vegans and those avoiding dairy, while still delivering significant microbial diversity.",
    howToEat:
      "Drink 150-200ml daily as a probiotic beverage. Flavour with fresh fruit juice, ginger, or lemon during a second fermentation. Use as a base for smoothies instead of plain water. Keep water kefir grains alive by feeding with sugar water every 24-48 hours.",
    science:
      "Water kefir grains harbour up to 56 different bacterial and yeast species, producing a fermented beverage with greater microbial diversity than most commercial probiotic supplements.",
    scienceSource: "Gulitz et al., International Journal of Food Microbiology, 2011",
    benefits: [
      { title: "High Microbial Diversity", detail: "Up to 56 species of bacteria and yeast — broader than most commercial probiotics." },
      { title: "Dairy-Free", detail: "A vegan-friendly probiotic option with no lactose, casein, or animal products." },
      { title: "Low Sugar", detail: "Fermentation consumes most of the sugar, leaving 2-3g per serving." },
      { title: "Refreshing Alternative", detail: "A naturally fizzy replacement for sugar-laden soft drinks." },
    ],
    pairsWith: ["Kombucha", "Blueberries", "Ginger", "Oats"],
    publishedDay: 64,
  },

  // ─── NEW POSTBIOTIC FOODS ─────────────────────────────────────────────────

  {
    slug: "turmeric",
    name: "Turmeric",
    emoji: "🟡",
    category: "Herbs & Spices",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    tagline: "The golden spice that remodels your gut bacteria.",
    description:
      "Turmeric contains curcumin — a polyphenol that reaches the colon largely intact, where gut bacteria metabolise it into more potent anti-inflammatory metabolites. This makes turmeric both a prebiotic (feeding specific bacteria) and a postbiotic generator. Curcumin also supports the integrity of the intestinal barrier and modulates the gut immune response.",
    howToEat:
      "Always combine with black pepper — piperine increases curcumin absorption by 2000%. Add to scrambled eggs, rice dishes, and soups. Make golden milk with warm milk, turmeric, black pepper, and honey. Use fresh root grated into stir-fries and smoothies.",
    science:
      "Curcumin modulates the gut microbiome by increasing Bifidobacterium and Lactobacillus while reducing pro-inflammatory Enterobacteriaceae. Its metabolites produced by gut bacteria show enhanced anti-inflammatory activity compared to curcumin itself.",
    scienceSource: "Scazzocchio et al., Nutrients, 2020",
    benefits: [
      { title: "Curcumin", detail: "A polyphenol that gut bacteria convert into potent anti-inflammatory metabolites." },
      { title: "Gut Barrier Support", detail: "Strengthens tight junctions between intestinal cells, reducing permeability." },
      { title: "Immune Modulation", detail: "Balances the gut immune response — reducing overactivation without suppressing defence." },
      { title: "Enhanced by Bacteria", detail: "Gut microbes convert curcumin into more bioactive compounds than the original spice." },
    ],
    pairsWith: ["Ginger", "Olive Oil", "Garlic", "Oats"],
    publishedDay: 66,
    brainHealth: true,
  },
  {
    slug: "ginger",
    name: "Ginger",
    emoji: "🫚",
    category: "Herbs & Spices",
    biotic: "postbiotic",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Ancient root, modern gut science.",
    description:
      "Ginger contains gingerols and shogaols — bioactive compounds that stimulate digestive enzyme production, reduce gut inflammation, and accelerate gastric emptying. These compounds are partially metabolised by gut bacteria into anti-inflammatory postbiotic metabolites. Ginger has been used for digestive support for over 5,000 years across Asian and Ayurvedic traditions.",
    howToEat:
      "Grate fresh ginger into stir-fries, soups, and curries. Brew ginger tea by steeping sliced root in hot water for 5 minutes. Add to smoothies with banana and turmeric. Pickle in rice vinegar for a probiotic-friendly condiment.",
    science:
      "Gingerols increase gastric motility by up to 50%, reduce nausea through serotonin receptor modulation, and have demonstrated significant anti-inflammatory effects in the GI tract.",
    scienceSource: "Nikkhah Bodagh et al., Food Science & Nutrition, 2019",
    benefits: [
      { title: "Digestive Stimulant", detail: "Increases gastric motility by up to 50%, reducing bloating and discomfort." },
      { title: "Anti-Nausea", detail: "Proven to reduce nausea through serotonin receptor modulation in the gut." },
      { title: "Anti-inflammatory", detail: "Gingerols reduce gut inflammation via COX-2 and NF-kB pathway inhibition." },
      { title: "Enzyme Production", detail: "Stimulates production of digestive enzymes for improved nutrient absorption." },
    ],
    pairsWith: ["Turmeric", "Garlic", "Kimchi", "Kombucha"],
    publishedDay: 68,
  },
  {
    slug: "walnuts",
    name: "Walnuts",
    emoji: "🥜",
    category: "Nuts & Seeds",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))",
    tagline: "The nut that reshapes your microbiome.",
    description:
      "Walnuts are unique among nuts for their combination of omega-3 fatty acids (ALA), polyphenols (ellagitannins), and prebiotic fibre. Gut bacteria convert walnut ellagitannins into urolithins — powerful postbiotic compounds with anti-inflammatory and anti-ageing properties. Just a handful daily has been shown to significantly shift microbiome composition toward beneficial species.",
    howToEat:
      "Eat a small handful (30g) daily as a snack. Crush and sprinkle over yogurt, oats, or salads. Add to pesto with basil and olive oil. Toast lightly to enhance flavour without destroying omega-3s.",
    science:
      "A 3-week walnut feeding study showed significant increases in Faecalibacterium, Roseburia, and Clostridium — all butyrate-producing bacteria — along with increased urolithin production.",
    scienceSource: "Holscher et al., Journal of Nutrition, 2018",
    benefits: [
      { title: "Urolithin Production", detail: "Gut bacteria convert walnut ellagitannins into urolithins — potent anti-inflammatory postbiotics." },
      { title: "Omega-3 ALA", detail: "The richest nut source of plant-based omega-3 fatty acids for reducing inflammation." },
      { title: "Microbiome Shift", detail: "Just 43g daily significantly increases butyrate-producing bacterial populations." },
      { title: "Brain-Gut Connection", detail: "The combination of omega-3s and gut-derived urolithins supports cognitive function." },
    ],
    pairsWith: ["Yogurt", "Blueberries", "Oats", "Dark Chocolate"],
    publishedDay: 70,
    brainHealth: true,
  },
  {
    slug: "cocoa-powder",
    name: "Cocoa Powder",
    emoji: "🍫",
    category: "Herbs & Spices",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Raw cacao — the original superfood.",
    description:
      "Raw cocoa powder is one of the most concentrated sources of polyphenols in the human diet — containing more flavanols per gram than blueberries, green tea, or red wine. These polyphenols reach the colon intact, where gut bacteria ferment them into anti-inflammatory postbiotic metabolites. Cocoa also contains theobromine, a gentle stimulant that supports focus without the jitters of caffeine.",
    howToEat:
      "Add 1-2 tablespoons of raw cacao powder to smoothies with banana and kefir. Stir into overnight oats. Make a hot chocolate with warm milk and a touch of honey. Choose raw cacao over Dutch-processed cocoa, which has reduced polyphenol content.",
    science:
      "Cocoa flavanols are fermented by Bifidobacterium and Lactobacillus into bioactive metabolites that reduce colonic inflammation and improve endothelial function within 2 hours of consumption.",
    scienceSource: "Tzounis et al., American Journal of Clinical Nutrition, 2011",
    benefits: [
      { title: "Highest Polyphenol Density", detail: "More flavanols per gram than any commonly consumed food — a potent prebiotic fuel." },
      { title: "Postbiotic Generator", detail: "Gut bacteria convert cocoa flavanols into anti-inflammatory metabolites." },
      { title: "Cardiovascular Support", detail: "Flavanol metabolites improve blood vessel function within hours of consumption." },
      { title: "Theobromine", detail: "A gentle stimulant that supports focus and mood without the crash of caffeine." },
    ],
    pairsWith: ["Kefir", "Banana", "Oats", "Walnuts"],
    publishedDay: 72,
  },
  {
    slug: "pomegranate",
    name: "Pomegranate",
    emoji: "🍎",
    category: "Fruit",
    biotic: "postbiotic",
    accentColor: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    tagline: "The fruit that makes your gut bacteria work hardest.",
    description:
      "Pomegranate is exceptionally rich in ellagitannins — the same class of polyphenol found in walnuts. Gut bacteria convert these into urolithins, which have potent anti-inflammatory and mitophagy-enhancing effects (helping cells clear damaged mitochondria). The juice, seeds, and pith all contain different beneficial compounds, making the whole fruit more valuable than juice alone.",
    howToEat:
      "Scatter seeds over yogurt, oats, or salads for a burst of colour and crunch. Drink a small glass (100ml) of pure juice with meals. Add seeds to grain bowls with feta and mint. Use pomegranate molasses as a salad dressing base.",
    science:
      "Urolithin A, produced by gut bacteria from pomegranate ellagitannins, has been shown to enhance mitophagy and improve muscle function in older adults — a breakthrough in ageing research.",
    scienceSource: "Andreux et al., Nature Metabolism, 2019",
    benefits: [
      { title: "Urolithin A Production", detail: "Gut bacteria convert ellagitannins into urolithin A — a compound that enhances cellular clean-up." },
      { title: "Mitophagy Enhancement", detail: "Urolithins help cells clear damaged mitochondria, supporting healthy ageing." },
      { title: "Anti-inflammatory", detail: "Multiple polyphenol classes work synergistically to reduce systemic inflammation." },
      { title: "Punicic Acid", detail: "Seed oil contains a unique fatty acid that supports gut barrier function." },
    ],
    pairsWith: ["Yogurt", "Walnuts", "Dark Chocolate", "Green Tea"],
    publishedDay: 74,
    brainHealth: true,
  },
  {
    slug: "mixed-berries",
    name: "Mixed Berries",
    emoji: "🍓",
    category: "Fruit",
    biotic: "postbiotic",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-orange))",
    tagline: "Colour diversity is polyphenol diversity.",
    description:
      "Combining different berries — strawberries, raspberries, blackberries, and blueberries — delivers a broader spectrum of polyphenols than any single berry alone. Each colour represents different compounds: red (ellagic acid), blue-purple (anthocyanins), dark (proanthocyanidins). Gut bacteria ferment these into diverse postbiotic metabolites that support different aspects of gut and systemic health.",
    howToEat:
      "Buy frozen mixed berries for year-round access at lower cost. Add to overnight oats with kefir. Blend into smoothies with banana and flaxseed. Defrost and serve over yogurt with a drizzle of honey and crushed walnuts.",
    science:
      "A diverse berry intake provides complementary polyphenol profiles that gut bacteria ferment into a wider range of anti-inflammatory metabolites than any single berry type alone.",
    scienceSource: "Nile & Park, Nutrition, 2014",
    benefits: [
      { title: "Polyphenol Diversity", detail: "Multiple berry types deliver complementary polyphenol classes for broader microbiome benefits." },
      { title: "Year-Round Access", detail: "Frozen berries retain polyphenol content and are available and affordable in any season." },
      { title: "Anthocyanin Spectrum", detail: "Different colours provide different anthocyanins — each feeding different bacterial populations." },
      { title: "Fibre Boost", detail: "Berries are among the highest-fibre fruits, supporting overall gut transit and microbial feeding." },
    ],
    pairsWith: ["Kefir", "Yogurt", "Oats", "Walnuts"],
    publishedDay: 76,
    brainHealth: true,
  },

  // ─── NEW PROTEIN FOODS ────────────────────────────────────────────────────

  {
    slug: "sardines",
    name: "Sardines",
    emoji: "🐟",
    category: "Protein",
    biotic: "protein",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-teal))",
    tagline: "Small fish, enormous gut and brain benefits.",
    description:
      "Sardines are one of the most nutrient-dense foods on the planet — packed with omega-3 EPA and DHA, complete protein, calcium (from edible bones), and vitamin D. The omega-3 fatty acids reduce gut inflammation and support the integrity of the intestinal barrier. Being low on the food chain, sardines accumulate virtually no mercury or heavy metals.",
    howToEat:
      "Eat straight from the tin on sourdough toast with lemon and olive oil. Add to pasta with garlic, chilli, and cherry tomatoes. Mash into a spread with avocado and capers. Choose sardines packed in olive oil for additional healthy fats.",
    science:
      "Omega-3 fatty acids from oily fish reduce intestinal inflammation by resolving inflammatory cascades via specialised pro-resolving mediators (SPMs), directly supporting gut barrier integrity.",
    scienceSource: "Costantini et al., International Journal of Molecular Sciences, 2017",
    county: "Kerry",
    benefits: [
      { title: "Omega-3 Rich", detail: "Among the highest sources of EPA and DHA for reducing gut and systemic inflammation." },
      { title: "Complete Protein", detail: "25g protein per 100g with all essential amino acids." },
      { title: "Low Mercury", detail: "Small fish at the bottom of the food chain — virtually no heavy metal accumulation." },
      { title: "Calcium from Bones", detail: "Edible bones provide highly bioavailable calcium — 382mg per 100g." },
    ],
    pairsWith: ["Olive Oil", "Garlic", "Sourdough", "Leeks"],
    publishedDay: 78,
    brainHealth: true,
  },
  {
    slug: "mackerel",
    name: "Mackerel",
    emoji: "🐠",
    category: "Protein",
    biotic: "protein",
    accentColor: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    tagline: "Ireland's most omega-3 rich wild fish.",
    description:
      "Atlantic mackerel is one of the richest sources of omega-3 fatty acids — providing up to 2.6g of combined EPA and DHA per 100g serving. These long-chain omega-3s are directly incorporated into cell membranes throughout the body, including gut epithelial cells, where they strengthen the intestinal barrier and reduce inflammatory signalling.",
    howToEat:
      "Grill whole mackerel with lemon and herbs for 8-10 minutes per side. Smoke and flake over salads with beetroot and horseradish. Use tinned mackerel in pâté with cream cheese and chives. Bake fillets with a mustard and oat crust.",
    science:
      "Regular oily fish consumption (2+ servings per week) is associated with increased microbial diversity, higher Lactobacillus populations, and reduced markers of intestinal permeability.",
    scienceSource: "Watson et al., Gut Microbes, 2018",
    county: "Galway",
    benefits: [
      { title: "Highest Omega-3 Content", detail: "Up to 2.6g EPA+DHA per 100g — more than any other commonly eaten fish." },
      { title: "Gut Barrier Integrity", detail: "Omega-3s are incorporated directly into gut cell membranes, strengthening the barrier." },
      { title: "Anti-inflammatory", detail: "Resolves inflammation via specialised pro-resolving mediators produced from EPA/DHA." },
      { title: "Vitamin D", detail: "One of the best dietary sources of vitamin D — essential for immune function." },
    ],
    pairsWith: ["Beetroot", "Olive Oil", "Garlic", "Sauerkraut"],
    publishedDay: 80,
  },
  {
    slug: "hemp-seeds",
    name: "Hemp Seeds",
    emoji: "🌱",
    category: "Nuts & Seeds",
    biotic: "protein",
    accentColor: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-yellow))",
    tagline: "Complete plant protein with the perfect omega ratio.",
    description:
      "Hemp seeds (hemp hearts) deliver complete protein with all 9 essential amino acids, along with an ideal 3:1 ratio of omega-6 to omega-3 fatty acids. They contain gamma-linolenic acid (GLA) — an anti-inflammatory fatty acid rarely found in foods. The high fibre content of whole hemp seeds feeds beneficial gut bacteria.",
    howToEat:
      "Sprinkle 2-3 tablespoons over salads, yogurt, or oats. Blend into smoothies for a protein boost. Add to homemade granola. Use hemp seed butter as an alternative to peanut butter.",
    science:
      "Hemp seed protein is 91-98% digestible — higher than most plant proteins — and its GLA content has been shown to modulate the inflammatory response via prostaglandin production.",
    scienceSource: "House et al., Journal of Agricultural and Food Chemistry, 2010",
    benefits: [
      { title: "Complete Plant Protein", detail: "All 9 essential amino acids with 31g protein per 100g — 91-98% digestible." },
      { title: "Ideal Omega Ratio", detail: "3:1 omega-6 to omega-3 ratio — considered optimal for anti-inflammatory balance." },
      { title: "GLA Content", detail: "Gamma-linolenic acid modulates inflammation — rarely found in other food sources." },
      { title: "Mineral Dense", detail: "Rich in magnesium, zinc, and iron — essential cofactors for gut enzyme function." },
    ],
    pairsWith: ["Yogurt", "Blueberries", "Oats", "Banana"],
    publishedDay: 82,
  },
  {
    slug: "quinoa",
    name: "Quinoa",
    emoji: "🍚",
    category: "Grains & Legumes",
    biotic: "protein",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-lime))",
    tagline: "A seed disguised as a grain — with complete protein.",
    description:
      "Quinoa is technically a seed, not a grain, delivering complete protein with all essential amino acids — unusual for plant foods. It is naturally gluten-free and rich in fibre (5g per cup cooked), saponins with immune-modulating properties, and polyphenols that feed beneficial gut bacteria. Red, black, and white quinoa each offer slightly different polyphenol profiles.",
    howToEat:
      "Use as a grain bowl base with roasted vegetables and tahini. Add to salads with herbs, lemon, and olive oil. Cook as a porridge with milk, cinnamon, and blueberries. Use quinoa flour in baking for added protein and fibre.",
    science:
      "Quinoa fibre and polyphenols have been shown to increase butyrate production in the colon while its saponins demonstrate immunomodulatory effects on gut-associated lymphoid tissue.",
    scienceSource: "Li et al., Food Chemistry, 2018",
    benefits: [
      { title: "Complete Protein", detail: "All 9 essential amino acids — 8g protein per cup, rare among plant foods." },
      { title: "Gluten-Free", detail: "Naturally gluten-free seed — suitable for coeliac and gluten-sensitive individuals." },
      { title: "Diverse Polyphenols", detail: "Red, black, and white varieties offer complementary polyphenol profiles." },
      { title: "Saponin Immunity", detail: "Natural saponins modulate immune responses via gut-associated immune tissue." },
    ],
    pairsWith: ["Olive Oil", "Lentils", "Garlic", "Kimchi"],
    publishedDay: 84,
  },
  {
    slug: "tofu",
    name: "Tofu",
    emoji: "🧊",
    category: "Protein",
    biotic: "protein",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-green))",
    tagline: "Clean protein that your gut bacteria appreciate.",
    description:
      "Tofu is a minimally processed soy product that provides high-quality plant protein along with isoflavones — phytoestrogens that gut bacteria convert into equol, a potent antioxidant. Firm tofu contains 17g protein per 100g with very little saturated fat. The soy oligosaccharides in tofu act as mild prebiotics, feeding Bifidobacterium populations.",
    howToEat:
      "Press firm tofu and pan-fry until golden. Marinate in soy sauce, ginger, and sesame before grilling. Crumble silken tofu into smoothies for protein. Add cubed tofu to miso soup with seaweed and spring onions.",
    science:
      "Soy isoflavones are converted by gut bacteria into equol — a metabolite with antioxidant activity 10 times stronger than the original isoflavone, though only 30-50% of people harbour equol-producing bacteria.",
    scienceSource: "Setchell et al., American Journal of Clinical Nutrition, 2002",
    benefits: [
      { title: "High-Quality Protein", detail: "17g complete protein per 100g with all essential amino acids." },
      { title: "Isoflavone Conversion", detail: "Gut bacteria convert isoflavones into equol — a potent antioxidant metabolite." },
      { title: "Prebiotic Oligosaccharides", detail: "Soy oligosaccharides in tofu feed Bifidobacterium populations." },
      { title: "Low Saturated Fat", detail: "A lean protein source with minimal saturated fat compared to animal proteins." },
    ],
    pairsWith: ["Miso", "Kimchi", "Garlic", "Ginger"],
    publishedDay: 86,
  },
  {
    slug: "chickpeas",
    name: "Chickpeas",
    emoji: "🫘",
    category: "Grains & Legumes",
    biotic: "protein",
    accentColor: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    tagline: "The legume that does everything.",
    description:
      "Chickpeas deliver a rare combination of plant protein (19g per 100g dried), resistant starch, and diverse prebiotic fibres including raffinose and stachyose — oligosaccharides that selectively feed Bifidobacterium. They are one of the most versatile legumes, forming the base of hummus, falafel, and countless Mediterranean and Middle Eastern dishes that epitomise gut-healthy eating patterns.",
    howToEat:
      "Make hummus with tahini, lemon, garlic, and olive oil. Roast with cumin and smoked paprika for a crunchy snack. Add to curries, soups, and stews for protein and fibre. Toss into salads with feta, cucumber, and herbs.",
    science:
      "Chickpea consumption significantly increases Bifidobacterium and Faecalibacterium prausnitzii populations while increasing butyrate and propionate production in controlled feeding studies.",
    scienceSource: "Fernando et al., British Journal of Nutrition, 2010",
    benefits: [
      { title: "Dual Protein + Fibre", detail: "19g protein and 17g fibre per 100g dried — few foods deliver both so effectively." },
      { title: "Resistant Starch", detail: "Cooked-and-cooled chickpeas develop resistant starch that feeds butyrate-producing bacteria." },
      { title: "Raffinose Prebiotic", detail: "Contains raffinose and stachyose — oligosaccharides that selectively feed Bifidobacterium." },
      { title: "Versatile Staple", detail: "Forms the base of hummus, falafel, and countless gut-healthy Mediterranean dishes." },
    ],
    pairsWith: ["Garlic", "Olive Oil", "Yogurt", "Turmeric"],
    publishedDay: 88,
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

export function getBrainHealthFoods(): Food[] {
  return foods.filter((f) => f.brainHealth)
}

export const bioticColors: Record<BioticType, string> = {
  prebiotic: "var(--icon-lime)",
  probiotic: "var(--icon-teal)",
  postbiotic: "var(--icon-orange)",
  protein: "var(--icon-yellow)",
  all: "var(--icon-green)",
}

export const bioticLabels: Record<BioticType, string> = {
  prebiotic: "Prebiotic",
  probiotic: "Probiotic",
  postbiotic: "Postbiotic",
  protein: "Protein",
  all: "All Biotics",
}
