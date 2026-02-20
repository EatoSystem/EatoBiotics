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
      { title: "Calcium Source", detail: "One of the most bioavailable sources of calcium for bone and gut health." },
      { title: "Improves Lactose Digestion", detail: "The live cultures pre-digest lactose — making it tolerable for most sensitive individuals." },
    ],
    pairsWith: ["Blueberries", "Oats", "Flaxseed", "Honey"],
    publishedDay: 17,
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
      "Wild salmon is one of the most important foods for gut health — not for its protein alone, but for its omega-3 fatty acids (EPA and DHA) which directly reduce intestinal inflammation, support the gut-brain axis, and feed the specific bacteria that produce anti-inflammatory compounds. Wild-caught salmon has 3-4x the omega-3 content of farmed salmon and significantly lower inflammatory omega-6 fat. Atlantic salmon farmed in Ireland is among the best quality in Europe.",
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
