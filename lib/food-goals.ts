import type { BioticType } from "@/lib/foods"

/**
 * lib/food-goals.ts — "best foods for X" landing-page config.
 *
 * Single source of truth for the programmatic /food/for/[goal] pages AND the
 * sitemap. Each goal renders an indexable page filtered from lib/foods.ts by
 * biotic type (or the brainHealth flag). Add a goal here and it auto-generates
 * a static page + sitemap entry.
 */

export interface GoalConfig {
  label: string
  emoji: string
  headline: string
  description: string
  types: BioticType[]
  brainHealthOnly?: boolean
  color: string
  gradient: string
  metaDesc: string
}

export const GOALS: Record<string, GoalConfig> = {
  digestion: {
    label: "Digestion",
    emoji: "🌿",
    headline: "Best foods for digestion",
    description:
      "Gut health starts with what you feed it. Prebiotic and probiotic foods work together to restore microbial diversity, reduce bloating, and improve the entire digestive process — from motility to nutrient absorption.",
    types: ["prebiotic", "probiotic"],
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    metaDesc:
      "The best prebiotic and probiotic foods for better digestion and gut health — profiled for their microbiome impact.",
  },
  energy: {
    label: "Energy",
    emoji: "⚡",
    headline: "Best foods for energy",
    description:
      "Sustainable energy doesn't come from caffeine — it comes from a well-functioning metabolism and a microbiome that extracts maximum nutrition from every meal. Protein and the polyphenol-rich foods that drive postbiotic production are the foundation.",
    types: ["protein", "postbiotic"],
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    metaDesc:
      "The best protein and postbiotic-supporting foods for sustained energy and metabolic health.",
  },
  immunity: {
    label: "Immunity",
    emoji: "🛡️",
    headline: "Best foods for immunity",
    description:
      "70% of your immune system lives in your gut. Prebiotic and postbiotic-supporting foods directly feed the bacterial colonies that regulate your immune response — reducing inflammation and increasing your resilience.",
    types: ["prebiotic", "postbiotic"],
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    metaDesc:
      "The best prebiotic and postbiotic-supporting foods to strengthen your immune system through the gut microbiome.",
  },
  mood: {
    label: "Mood",
    emoji: "🧠",
    headline: "Best foods for mood",
    description:
      "Your gut produces 90% of your serotonin. Foods that nourish the gut-brain axis — particularly those linked to Lactobacillus and Bifidobacterium populations — have a direct and measurable impact on mood, focus, and mental clarity.",
    types: ["prebiotic", "probiotic", "postbiotic", "protein"],
    brainHealthOnly: true,
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    metaDesc:
      "The best gut-brain foods for mood, focus, and mental clarity — all with a proven microbiome connection.",
  },
  recovery: {
    label: "Recovery",
    emoji: "💪",
    headline: "Best foods for recovery",
    description:
      "Recovery is inflammation management. Postbiotic compounds — particularly butyrate and short-chain fatty acids — reduce systemic inflammation at the cellular level. Combined with complete proteins that rebuild tissue, these foods accelerate every aspect of physical recovery.",
    types: ["protein", "postbiotic"],
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    metaDesc:
      "The best protein and postbiotic-supporting foods for faster recovery and reduced inflammation.",
  },
  sleep: {
    label: "Sleep",
    emoji: "🌙",
    headline: "Best foods for sleep",
    description:
      "The gut-sleep axis is one of the most underappreciated relationships in health. Prebiotic fibres feed bacteria that produce GABA and serotonin precursors — the compounds your brain converts into melatonin. Consistent prebiotic intake is one of the most evidence-backed dietary strategies for sleep quality.",
    types: ["prebiotic"],
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    metaDesc:
      "The best prebiotic foods for better sleep — supporting the gut-sleep axis through microbiome nutrition.",
  },

  /* ── Expanded high-intent goals (programmatic long-tail) ──────────────── */
  "gut-health": {
    label: "Gut Health",
    emoji: "🦠",
    headline: "Best foods for gut health",
    description:
      "A healthy gut is a diverse one. The foods that build it span all three biotics — prebiotic fibres that feed your bacteria, probiotic foods that add living cultures, and the postbiotic-supporting polyphenols that help them thrive. Variety is the single most important principle.",
    types: ["prebiotic", "probiotic", "postbiotic"],
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
    metaDesc:
      "The best foods for gut health and a diverse microbiome — prebiotic, probiotic, and postbiotic, profiled for impact.",
  },
  bloating: {
    label: "Bloating",
    emoji: "🌬️",
    headline: "Best foods to ease bloating",
    description:
      "Bloating often reflects an imbalanced or under-fed microbiome. Gentle prebiotic fibres and live probiotic foods — introduced gradually — support smoother digestion and a calmer gut. Build variety up slowly rather than all at once.",
    types: ["prebiotic", "probiotic"],
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    metaDesc:
      "The best prebiotic and probiotic foods to help ease bloating and support smoother digestion. Educational, not medical advice.",
  },
  inflammation: {
    label: "Inflammation",
    emoji: "🔥",
    headline: "Best foods to fight inflammation",
    description:
      "Chronic, low-grade inflammation is shaped in the gut. Postbiotic compounds like butyrate calm the immune response from the inside out, while polyphenol-rich and prebiotic foods feed the bacteria that produce them. These are the everyday foods with the strongest anti-inflammatory signal.",
    types: ["prebiotic", "postbiotic"],
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-green))",
    metaDesc:
      "The best anti-inflammatory foods — prebiotic and postbiotic-supporting foods that calm inflammation through the gut.",
  },
  skin: {
    label: "Skin",
    emoji: "✨",
    headline: "Best foods for healthy skin",
    description:
      "The gut-skin axis is real: a balanced microbiome and lower systemic inflammation show up in clearer, calmer skin. Prebiotic fibres and polyphenol-rich foods support the bacteria and short-chain fatty acids that keep skin resilient from within.",
    types: ["prebiotic", "postbiotic"],
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-lime))",
    metaDesc:
      "The best foods for healthy skin through the gut-skin axis — prebiotic and postbiotic-supporting foods that support skin from within.",
  },
  weight: {
    label: "Weight Balance",
    emoji: "⚖️",
    headline: "Best foods for healthy weight",
    description:
      "Sustainable weight balance is a microbiome story. High-fibre prebiotic foods improve satiety and how you extract energy from food, while quality protein protects muscle and steadies appetite. Together they support a healthier relationship with food — no restriction required.",
    types: ["prebiotic", "protein"],
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    metaDesc:
      "The best high-fibre and protein foods to support healthy weight balance and satiety through the microbiome.",
  },
  stability: {
    label: "Digestive Stability",
    emoji: "🧭",
    headline: "Best foods for digestive stability",
    description:
      "Predictable, settled digestion is built on soluble fibre, steady hydration, and a balanced microbiome. Gentle prebiotic and probiotic foods — added one at a time — support firmer, more regular stools and calmer days. Always speak to your GP about any new or worsening bowel symptoms.",
    types: ["prebiotic", "probiotic"],
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    metaDesc:
      "The best foods for digestive stability and regularity — gentle prebiotic and probiotic foods. Educational, not medical advice.",
  },
}

/** All goal slugs — used for static generation, related links, and the sitemap. */
export const FOOD_GOAL_SLUGS = Object.keys(GOALS)
