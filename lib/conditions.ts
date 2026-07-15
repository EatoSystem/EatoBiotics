/**
 * lib/conditions.ts — the condition-vertical catalog (ADHD / anxiety /
 * depression / bipolar landing pages).
 *
 * The four condition verticals were 32 near-identical components (8 files × 4
 * directories) differing only in icon, accent colours, and copy. This config
 * plus components/condition/* replaces them one vertical at a time, following
 * the same factory pattern as the 25 book chapters
 * (components/book/chapter/chapter-page-factory.tsx).
 *
 * RULE FOR MIGRATING A VERTICAL: copy the existing prose VERBATIM from the
 * old components into this config — never re-write it. The condition copy is
 * clinically-reviewed-adjacent language ("may", "emerging research",
 * non-diagnostic framing); paraphrasing during refactors is how accuracy
 * drift happens. Each migration should be verified with a rendered-HTML diff
 * against the old page before the old components are deleted.
 */

import type { LucideIcon } from "lucide-react"
import { Zap, Leaf, Activity, Flame } from "lucide-react"

export type ConditionKey = "adhd"

export interface ScienceCard {
  icon: LucideIcon
  title: string
  body: string
  color: string
}

export interface PathwayStep {
  number: string
  title: string
  body: string
  color: string
}

export interface FoodSpotlight {
  slug: string
  benefit: string
}

export interface ConditionDef {
  key: ConditionKey
  /** Display name as used in headings ("ADHD"). */
  label: string
  /** Badge icon + accent used in the hero eyebrow. */
  badgeIcon: LucideIcon
  hero: {
    /** Paragraph under the H1 — verbatim from the original vertical. */
    body: string
    secondaryCtaLabel: string
  }
  body: {
    heading: string
    paragraphs: [string, string, string]
  }
  science: {
    heading: string
    intro: string
    cards: ScienceCard[]
  }
  pathway: {
    intro: string
    steps: PathwayStep[]
  }
  foodSupport: {
    intro: string
    increase: string[]
    reduce: string[]
  }
  foods: {
    heading: string
    intro: string
    spotlights: FoodSpotlight[]
    libraryCtaLabel: string
  }
  cta: {
    gradientLine: string
    plainLine: string
    body: string
  }
  disclaimer: string
  seo: {
    title: string
    description: string
    ogTitle: string
    ogDescription: string
  }
}

export const CONDITIONS: Record<ConditionKey, ConditionDef> = {
  adhd: {
    key: "adhd",
    label: "ADHD",
    badgeIcon: Zap,
    hero: {
      body:
        "ADHD is shaped by genetics, brain development, environment, and many other factors. Emerging research suggests the gut-brain axis may also play a role — influencing dopamine pathways, neuroinflammation, and the microbial diversity linked to cognitive function. Food is not a treatment, but it can be one part of building a more supportive internal environment for focus and attention.",
      secondaryCtaLabel: "Explore Brain Foods",
    },
    body: {
      heading: "Understanding ADHD Through the Body",
      paragraphs: [
        "ADHD is a neurodevelopmental condition with roots in genetics and brain wiring. It is not caused by diet, and it cannot be resolved by diet alone. Anyone experiencing ADHD deserves professional assessment and support — and, where appropriate, evidence-based treatment that may include medication, therapy, and behavioural strategies.",
        "What emerging research is beginning to suggest is that the gut-brain axis may be one contributing factor in the ADHD landscape. Gut microbial diversity has been linked to dopamine precursor availability, inflammatory signalling, and aspects of cognitive function connected to focus and executive control. Omega-3 fatty acids — produced by the bacteria fed through specific foods — have shown promise in supporting neuronal membrane health in several studies.",
        "EatoBiotics frames this through the food system lens: building a more diverse, omega-3-rich, and consistent eating pattern is one foundational thing that may support cognitive health over time. This sits alongside professional care — not as a replacement for it.",
      ],
    },
    science: {
      heading: "How the gut may influence focus and attention",
      intro:
        "Four areas where the gut-brain connection intersects with what research knows about ADHD, cognitive function, and attention.",
      cards: [
        {
          icon: Zap,
          title: "Dopamine Pathways",
          body: "Dopamine — central to focus, motivation, and reward — is influenced by the gut microbiome through its role in producing dopamine precursors and regulating the availability of tryptophan, tyrosine, and other building blocks.",
          color: "var(--icon-yellow)",
        },
        {
          icon: Leaf,
          title: "Omega-3 & Brain Function",
          body: "EPA and DHA omega-3 fatty acids are critical structural components of neuronal membranes. Several studies suggest omega-3 supplementation may support attention and reduce hyperactivity, particularly in those with lower baseline intake.",
          color: "var(--icon-teal)",
        },
        {
          icon: Activity,
          title: "Gut Diversity & Cognition",
          body: "Lower gut microbial diversity has been observed in children and adults with ADHD in some studies. Diverse gut ecosystems are associated with more varied short-chain fatty acid production, which may influence brain development and cognitive flexibility.",
          color: "var(--icon-green)",
        },
        {
          icon: Flame,
          title: "Inflammation & Attention",
          body: "Neuroinflammation — driven in part by gut permeability and low microbial diversity — may impair executive function, working memory, and attention regulation. Anti-inflammatory dietary patterns are associated with better cognitive outcomes.",
          color: "var(--icon-orange)",
        },
      ],
    },
    pathway: {
      intro:
        "Food does not directly treat ADHD — but here is how it interacts with the biological systems connected to focus, attention, and cognitive function.",
      steps: [
        {
          number: "01",
          title: "You eat omega-3-rich and fibre-rich foods",
          body: "Oily fish, seeds, plant diversity, and fermented foods provide the building blocks for neuronal membrane health and a diverse gut ecosystem.",
          color: "var(--icon-lime)",
        },
        {
          number: "02",
          title: "Gut bacteria produce key compounds",
          body: "A diverse microbiome ferments fibre into short-chain fatty acids, regulates dopamine precursor availability, and supports anti-inflammatory signalling.",
          color: "var(--icon-green)",
        },
        {
          number: "03",
          title: "Signals reach the brain",
          body: "Omega-3s integrate into neuronal membranes, SCFAs reduce neuroinflammation, and gut signals travel via the vagus nerve to brain regions governing attention.",
          color: "var(--icon-teal)",
        },
        {
          number: "04",
          title: "Focus and regulation respond",
          body: "A better-nourished gut and brain environment may support more available dopamine signalling, reduced neuroinflammation, and improved executive function over time.",
          color: "var(--icon-yellow)",
        },
      ],
    },
    foodSupport: {
      intro:
        "Food is not a treatment for ADHD. But building a diet rich in omega-3s, plant diversity, and structured eating patterns may support the neurological and gut systems connected to focus, attention, and cognitive flexibility.",
      increase: [
        "Omega-3 rich foods — oily fish, walnuts, flaxseed, chia seeds",
        "Protein-rich meals — support dopamine and norepinephrine production",
        "Plant diversity — 30+ different plants weekly for microbiome depth",
        "Fermented foods — kefir, yogurt, kimchi, sauerkraut",
        "Structured, regular meal timing — reduces glucose variability",
      ],
      reduce: [
        "Food additives and artificial colours — some linked to hyperactivity in children",
        "Excess sugar and refined carbohydrates — spikes and crashes impair focus",
        "Ultra-processed snacks — low in fibre, disruptive to the gut microbiome",
        "Skipping breakfast — impairs morning cognitive function and glucose stability",
        "Highly inflammatory dietary patterns — may worsen neuroinflammation",
      ],
    },
    foods: {
      heading: "Foods that feed focus",
      intro:
        "These foods support the gut, dopamine, and anti-inflammatory pathways most connected to focus and cognitive function. A starting point, not a protocol.",
      spotlights: [
        { slug: "wild-salmon", benefit: "The richest whole-food source of EPA and DHA omega-3s" },
        { slug: "oats", benefit: "Slow-release carbs that support steady glucose and sustained focus" },
        { slug: "blueberries", benefit: "Polyphenols that support brain circulation and cognitive health" },
        { slug: "kefir", benefit: "Live cultures that diversify the gut microbiome" },
        { slug: "kimchi", benefit: "Fermented food linked to microbial diversity and gut resilience" },
        { slug: "yogurt", benefit: "Probiotic bacteria that may support dopamine precursor pathways" },
      ],
      libraryCtaLabel: "See all brain foods in the library",
    },
    cta: {
      gradientLine: "See how well your food system",
      plainLine: "is supporting your focus.",
      body:
        "The Mind Assessment reveals how well your food habits are supporting gut diversity, omega-3 nourishment, daily rhythm, and mental clarity. In five minutes, you'll get a clear picture of where your system is already working — and where to start.",
    },
    disclaimer:
      "This page is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. ADHD is a neurodevelopmental condition that should be assessed and managed with the support of a qualified healthcare professional. Dietary changes are not a substitute for evidence-based treatment, which may include medication, behavioural therapy, and structured support. Food can support the body's internal systems, but it is one factor among many. Nothing on this page should be interpreted as a recommendation to change or discontinue any prescribed treatment.",
    seo: {
      title: "ADHD & Your Food System | EatoBiotics",
      description:
        "Learn how the gut-brain connection, dopamine pathways, omega-3s, and microbial diversity may influence focus and attention. Explore the EatoBiotics approach to supporting the food system inside you.",
      ogTitle: "ADHD & Your Food System — EatoBiotics",
      ogDescription:
        "How gut health, dopamine, omega-3 fatty acids, and food patterns may play a role in supporting focus and cognitive function.",
    },
  },
}

export function getCondition(key: ConditionKey): ConditionDef {
  return CONDITIONS[key]
}
