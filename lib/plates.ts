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
