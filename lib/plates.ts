export interface Plate {
  number: string
  name: string
  role: string
  personalityWord: string
  message: string
  description: string
  emphasis: string
  supports: string[]
  question: string
  arcWord: string
  protein: string
  image: string          // food photography
  plateImage: string     // illustrated plate PNG
  slug: string           // URL path
  topBar: string
  accent: string
  accentClass: string
  borderColor: string
  tagBg: string
  emotional: string
  bioticsLabel: string
  dna: string            // 2-3 sentence plate DNA description
  dnaPoints: string[]    // 4-5 defining characteristics
  dnaImage: string       // food photo for the DNA section
  benefits: { label: string; desc: string }[]
  benefitsImage: string  // food photo for the health benefits section
  systemRole: string     // role in the broader Food System Inside You
}

export const PLATES: Plate[] = [
  {
    number: "1.1",
    name: "The Food System Bowl",
    role: "Foundation",
    personalityWord: "Balanced",
    message: "This is how EatoBiotics begins.",
    description:
      "The entry point. The clearest, most balanced, most welcoming plate in the system. Built to introduce the central idea of EatoBiotics: not only feeding you, but feeding the ecosystem inside you.",
    emphasis: "Balance",
    supports: ["digestion", "energy", "resilience"],
    question: "What is EatoBiotics?",
    arcWord: "awareness",
    protein: "Trout",
    image: "/food-1.png",
    plateImage: "/plate-bowl.png",
    slug: "food-system-bowl",
    topBar: "var(--icon-lime)",
    accent: "var(--icon-lime)",
    accentClass: "text-icon-lime",
    borderColor: "border-icon-lime/20",
    tagBg: "bg-icon-lime/10",
    emotional: "clear and foundational",
    bioticsLabel: "Prebiotic + Probiotic support",
    dna: "The Food System Bowl is the system's entry point — the clearest, most complete expression of what EatoBiotics is. Four quadrants in balanced proportion: a generous prebiotic base, a probiotic side, a quality protein, and the healthy fats and polyphenols that finish the job. Nothing is overstated. Nothing is missing.",
    dnaPoints: [
      "Widest prebiotic base — leafy greens, legumes, and root vegetables in one plate",
      "One fermented food as the probiotic side — yogurt, kimchi, or kefir",
      "Trout as the rotating protein — omega-3 rich and anti-inflammatory",
      "Avocado, olive oil, or seeds complete the postbiotic builders",
      "Built for balance — every quadrant carries equal weight",
    ],
    dnaImage: "/food-17.png",
    benefits: [
      { label: "Digestion", desc: "High fibre from multiple plant sources feeds the microbiome and supports regular, healthy digestion." },
      { label: "Sustained Energy", desc: "Balanced macronutrients — fibre, fat, and protein — prevent blood sugar spikes and keep energy stable all day." },
      { label: "Gut Diversity", desc: "Multiple plant varieties in one plate feed different bacterial strains, building a more resilient microbiome over time." },
      { label: "Resilience", desc: "Consistent prebiotic intake builds long-term microbiome resilience against stress, illness, and disruption." },
    ],
    benefitsImage: "/food-21.png",
    systemRole: "The Food System Bowl is where the journey begins. Without a solid foundation, the rest of the weekly system has nothing to build on. This plate introduces your microbiome to the full EatoBiotics framework — prebiotic, probiotic, protein, and postbiotic — all at once. Come back to this plate whenever you need to reset.",
  },
  {
    number: "1.2",
    name: "The Immunity, Mood & Energy Plate",
    role: "Function",
    personalityWord: "Functional",
    message: "Support the system, and the system supports more of you.",
    description:
      "Shows that the microbiome affects far more than digestion. A vibrant plate designed to support immunity, steadier energy, emotional resilience, and recovery through the EatoBiotics framework.",
    emphasis: "Function and support",
    supports: ["immunity", "mood", "energy", "recovery"],
    question: "Why does this matter to how I feel?",
    arcWord: "function",
    protein: "Chicken",
    image: "/food-2.png",
    plateImage: "/plate-immunity.png",
    slug: "energy-plate",
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
    accent: "var(--icon-yellow)",
    accentClass: "text-icon-yellow",
    borderColor: "border-icon-yellow/20",
    tagBg: "bg-icon-yellow/10",
    emotional: "bright and functional",
    bioticsLabel: "Prebiotic + Probiotic + Postbiotic support",
    dna: "The Immunity, Mood & Energy Plate expands the system beyond digestion. Built around what the microbiome produces — the compounds that regulate immunity, stabilise mood, and sustain energy. It is bright, vibrant, and deliberately functional. More colour means more polyphenols. More fermented food means more postbiotic output.",
    dnaPoints: [
      "Higher polyphenol content — dark berries, red cabbage, and purple vegetables",
      "Increased fermented food volume for more probiotic diversity and postbiotic output",
      "Colourful prebiotic base — different colours feed different bacterial families",
      "Healthy fats support brain function and reduce neuroinflammation",
      "Designed around the gut-brain axis — the system inside your mind",
    ],
    dnaImage: "/food-18.png",
    benefits: [
      { label: "Immunity", desc: "Fermented foods and prebiotic fibre strengthen the gut barrier — your body's first line of immune defence." },
      { label: "Mood", desc: "90% of serotonin is produced in the gut. This plate creates the bacterial environment and precursors for stable, steady mood." },
      { label: "Energy", desc: "High fibre and healthy fats slow glucose absorption, eliminating the energy peaks and crashes of processed food." },
      { label: "Recovery", desc: "Anti-inflammatory polyphenols and omega-3 fats reduce systemic inflammation and support faster physical and mental recovery." },
    ],
    benefitsImage: "/food-22.png",
    systemRole: "Plate 1.2 is the system's proof of concept. It shows that feeding your gut correctly doesn't just improve digestion — it changes how you feel, think, and recover. This is the plate that makes The Food System Inside You feel real for most people.",
  },
  {
    number: "1.3",
    name: "The Living Plate",
    role: "Richness",
    personalityWord: "Abundant",
    message: "The system thrives when it is fed with richness and variety.",
    description:
      "A fibre-rich, plant-diverse plate built to express the full range of what a thriving microbiome needs — colour, abundance, variety, and nourishment. Diversity is the goal.",
    emphasis: "Diversity and abundance",
    supports: ["richness", "diversity", "nourishment", "consistency"],
    question: "What does a thriving internal system need?",
    arcWord: "nourishment",
    protein: "Tofu",
    image: "/food-7.png",
    plateImage: "/plate-living.png",
    slug: "living-plate",
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow))",
    accent: "var(--icon-teal)",
    accentClass: "text-icon-teal",
    borderColor: "border-icon-teal/20",
    tagBg: "bg-icon-teal/10",
    emotional: "abundant and alive",
    bioticsLabel: "Prebiotic + Probiotic + Protein Balance",
    dna: "The Living Plate is the most plant-rich expression of the EatoBiotics system. Built around diversity as a principle — not just variety for its own sake, but because each plant colour, texture, and structure feeds a different family of gut bacteria. More variety. More colour. More life. The microbiome thrives when it is fed with richness.",
    dnaPoints: [
      "Most plant-diverse plate in the system — aims for 15–20 distinct plant varieties",
      "Full spectrum of colour — each colour signals different prebiotic polyphenols",
      "Tofu as plant protein — a fully plant-based expression of the four-quadrant framework",
      "High live fermented food content — the 'living' element of the plate's name",
      "Designed to maximise short-chain fatty acid production through fibre diversity",
    ],
    dnaImage: "/food-19.png",
    benefits: [
      { label: "Microbiome Diversity", desc: "Different plant species feed different bacterial families. The Living Plate is the fastest way to increase gut species richness." },
      { label: "Postbiotic Production", desc: "Diverse fibre types produce a broader range of short-chain fatty acids — the postbiotics that regulate inflammation, immunity, and mood." },
      { label: "Nourishment", desc: "A wide range of plant foods delivers a comprehensive micronutrient profile — vitamins, minerals, and antioxidants the body cannot produce itself." },
      { label: "Consistency", desc: "Abundance makes consistency easier. The Living Plate never feels like restriction — it feels like exploration and pleasure." },
    ],
    benefitsImage: "/food-21.png",
    systemRole: "The Living Plate represents the system at its most expressive. It proves that eating for your microbiome is not about eating less — it is about eating more of the right things. In the weekly arc, this plate deepens everything Plates 1.1 and 1.2 introduced. Diversity is the goal. The Living Plate is where that goal becomes a daily practice.",
  },
  {
    number: "1.4",
    name: "The Rebuild Plate",
    role: "Restoration",
    personalityWord: "Restorative",
    message: "Not perfection. Rebuilding.",
    description:
      "Closes the weekly sequence with resilience, recovery, and restoration. Designed to support rebuilding through better daily inputs and weekly consistency — calm, purposeful, and hopeful.",
    emphasis: "Restoration and resilience",
    supports: ["rebuilding", "steadiness", "recovery"],
    question: "How do I begin improving and restoring it?",
    arcWord: "rebuilding",
    protein: "Chicken",
    image: "/food-4.png",
    plateImage: "/plate-rebuild.png",
    slug: "build-plate",
    topBar: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    accent: "var(--icon-orange)",
    accentClass: "text-icon-orange",
    borderColor: "border-icon-orange/20",
    tagBg: "bg-icon-orange/10",
    emotional: "calm, restorative, and hopeful",
    bioticsLabel: "Prebiotic + Probiotic + Postbiotic support",
    dna: "The Rebuild Plate closes the weekly sequence with intention. Where Plate 1.3 is abundance, this plate is groundedness. Warm, earthy ingredients — sweet potato, root vegetables, gentle grains — support the gut lining and reduce inflammation. Not built for performance. Built for restoration. The system at its most patient and purposeful.",
    dnaPoints: [
      "Warming, grounding foods — sweet potato, root vegetables, and whole grains",
      "Gut-lining support — glutamine-rich ingredients help repair the intestinal barrier",
      "Gentle probiotic choices — kefir and yogurt for easier recovery and rebalancing",
      "Anti-inflammatory focus — olive oil, avocado, and turmeric calm systemic inflammation",
      "Lower glycaemic load — stable blood sugar supports steady mood through the weekly reset",
    ],
    dnaImage: "/food-20.png",
    benefits: [
      { label: "Gut Repair", desc: "Warming foods and glutamine-rich proteins support repair of the intestinal lining — especially important after a high-stress or disrupted week." },
      { label: "Steadiness", desc: "Complex carbohydrates from sweet potato and whole grains provide slow-release energy and help stabilise cortisol levels." },
      { label: "Recovery", desc: "Anti-inflammatory fats and polyphenols reduce soreness and systemic inflammation, and support better sleep quality." },
      { label: "Resilience", desc: "Completing the weekly arc — even imperfectly — builds the long-term microbiome resilience that the whole system depends on." },
    ],
    benefitsImage: "/food-22.png",
    systemRole: "The Rebuild Plate is the system's answer to imperfection. Not every week goes to plan. This plate closes the loop with intention — reminding you that the goal is not a perfect plate, but a consistent practice. In The Food System Inside You, restoration is as important as nourishment. This plate is where the next week begins.",
  },
]

export const FRAMEWORK_PARTS = [
  {
    label: "Prebiotic Base",
    desc: "Fibres and plant foods that feed beneficial bacteria",
    color: "var(--icon-lime)",
    examples: "Garlic · Oats · Onions · Asparagus · Legumes",
  },
  {
    label: "Probiotic Side",
    desc: "Fermented foods that help strengthen microbial diversity",
    color: "var(--icon-teal)",
    examples: "Kimchi · Sauerkraut · Yogurt · Kefir · Miso",
  },
  {
    label: "Protein Balance",
    desc: "A rotating protein source that anchors the meal",
    color: "var(--icon-green)",
    examples: "Salmon · Trout · Eggs · Tempeh · Beans",
  },
  {
    label: "Postbiotic Builders",
    desc: "Healthy fats, herbs, polyphenols, and supportive extras",
    color: "var(--icon-orange)",
    examples: "Avocado · Olive oil · Seeds · Berries · Walnuts",
  },
]

export function getPlateBySlug(slug: string): Plate | undefined {
  return PLATES.find((p) => p.slug === slug)
}
