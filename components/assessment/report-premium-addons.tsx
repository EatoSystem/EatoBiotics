"use client"

import { useState } from "react"
import { Clock, Leaf, ShoppingCart, Target, ChefHat, Check } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { cn } from "@/lib/utils"
import type { PremiumAddons } from "@/lib/assessment-report"
import type { ClaudePremiumReport } from "@/lib/claude-report"

const SEASONAL_CALENDAR = [
  { month: "January", season: "winter", foods: ["Celeriac", "Kale", "Jerusalem artichoke", "Leeks"] },
  { month: "February", season: "winter", foods: ["Purple sprouting broccoli", "Chicory", "Parsnip", "Leeks"] },
  { month: "March", season: "spring", foods: ["Wild garlic", "Watercress", "Spring onions", "Radishes"] },
  { month: "April", season: "spring", foods: ["Asparagus", "Spinach", "Rhubarb", "Wild garlic"] },
  { month: "May", season: "spring", foods: ["Asparagus", "Broad beans", "Jersey royals", "Lettuce varieties"] },
  { month: "June", season: "summer", foods: ["Strawberries", "Peas", "Courgette", "Broad beans"] },
  { month: "July", season: "summer", foods: ["Blueberries", "Fennel", "French beans", "Tomatoes"] },
  { month: "August", season: "summer", foods: ["Blackberries", "Sweetcorn", "Courgette", "Aubergine"] },
  { month: "September", season: "autumn", foods: ["Apples", "Butternut squash", "Mushrooms", "Beetroot"] },
  { month: "October", season: "autumn", foods: ["Pumpkin", "Cavolo nero", "Parsnips", "Chestnuts"] },
  { month: "November", season: "autumn", foods: ["Brussels sprouts", "Swede", "Celeriac", "Leeks"] },
  { month: "December", season: "winter", foods: ["Red cabbage", "Jerusalem artichoke", "Parsnips", "Sprouts"] },
]

const SUPPLEMENT_CARDS = {
  high: [
    {
      emoji: "🌾",
      title: "Prebiotic fibre (inulin / FOS)",
      detail:
        "With a strong base, supplemental prebiotics can extend what your food is already doing. Inulin-type fructans (e.g. chicory root extract) selectively increase Bifidobacterium. Most useful if your diversity score is 70+ but your adding score is lower.",
      look_for: "Look for: inulin, FOS, or galacto-oligosaccharides (GOS) on the label.",
    },
    {
      emoji: "🧬",
      title: "Multi-strain probiotic",
      detail:
        "At higher overall scores, a multi-strain probiotic can add microbial diversity beyond what fermented foods deliver. Look for products with 8+ strains including Lactobacillus rhamnosus and Bifidobacterium longum — the two most studied strains for gut barrier function.",
      look_for: "Look for: ≥10 billion CFU, refrigerated, with a mix of Lactobacillus and Bifidobacterium strains.",
    },
    {
      emoji: "⚡",
      title: "Butyrate (as a postbiotic)",
      detail:
        "If digestive discomfort persists despite a strong diet, tributyrin or sodium butyrate supplements deliver the postbiotic your gut bacteria would otherwise produce from fibre. Useful for gut lining support.",
      look_for: "Look for: tributyrin, sodium butyrate, or beta-hydroxybutyrate in supplement form.",
    },
  ],
  low: [
    {
      emoji: "🌾",
      title: "Prebiotic fibre — start here",
      detail:
        "At lower overall scores, the most impactful supplement is prebiotic fibre — specifically inulin or psyllium husk. These directly feed your gut bacteria when dietary fibre intake is still building. Start with a low dose (2–3g/day) to avoid bloating.",
      look_for: "Look for: psyllium husk powder, inulin, or chicory root extract.",
    },
    {
      emoji: "🧬",
      title: "Single-strain probiotic (targeted)",
      detail:
        "When the gut ecosystem is underdeveloped, a single high-dose strain is more targeted than a multi-strain blend. Lactobacillus rhamnosus GG is the most studied strain for rebuilding gut populations after disruption.",
      look_for: "Look for: L. rhamnosus GG specifically, ≥10 billion CFU, with third-party testing.",
    },
    {
      emoji: "⚡",
      title: "Glutamine for gut lining",
      detail:
        "L-glutamine is the primary fuel for enterocytes — the cells lining your gut wall. At lower scores where gut barrier integrity may be compromised, 5g/day of L-glutamine can support lining repair while your dietary habits build.",
      look_for: "Look for: pharmaceutical-grade L-glutamine powder, unflavoured.",
    },
  ],
}

const GUT_BRAIN_INSIGHTS = {
  high: [
    {
      title: "Your gut-brain axis is communicating well",
      detail:
        "A high Feeling score suggests your vagus nerve — the main gut-brain communication pathway — is functioning effectively. The postbiotics your bacteria produce (especially butyrate and propionate) are crossing the blood-brain barrier and supporting neurotransmitter production. To maintain this: keep fermented foods consistent and protect your sleep, which is the main repair window for both gut and brain.",
    },
    {
      title: "Serotonin starts in the gut",
      detail:
        "Approximately 90% of the body's serotonin is produced in the gut, not the brain. Enterochromaffin cells in your gut lining respond directly to specific bacterial metabolites. Your current food system is likely supporting this well — the key is consistency rather than change.",
    },
    {
      title: "Your cognitive clarity is likely diet-linked",
      detail:
        "Studies consistently show that microbial diversity correlates with mood stability, cognitive performance, and stress resilience. With a strong Feeling score, your food choices are likely contributing to your mental clarity. Polyphenol-rich foods (walnuts, dark chocolate, berries) specifically support this pathway.",
    },
  ],
  low: [
    {
      title: "The gut-brain axis may be disrupted",
      detail:
        "A lower Feeling score often reflects disrupted gut-brain communication. The vagus nerve sends signals in both directions — when the gut microbiome is imbalanced or inflamed, these signals can manifest as brain fog, low mood, or fatigue. This is bidirectional: stress also disrupts the gut. Addressing both simultaneously gives the fastest recovery.",
    },
    {
      title: "Inflammation is the shared mechanism",
      detail:
        "When gut bacteria ferment fibre incompletely (due to low diversity or inconsistency), less butyrate is produced. Butyrate maintains the gut lining — without it, inflammatory compounds can enter the bloodstream and cross into the brain. Increasing fibre diversity and fermented foods is the most direct dietary lever here.",
    },
    {
      title: "The gut produces 90% of your serotonin",
      detail:
        "When your gut ecosystem is disrupted, serotonin production is affected — which can affect mood, sleep, and appetite regulation beyond just digestion. Restoring microbial diversity through food is the most evidence-backed way to support this pathway from the ground up.",
    },
  ],
}

function getSupplementCards(addons: PremiumAddons): typeof SUPPLEMENT_CARDS.high {
  // Use mealTiming as a proxy for overall score range (high = 3+ personalised rules)
  // In practice this works because mealTiming content is score-dependent
  const isHighScore = addons.mealTiming[0]?.title.includes("Maintain")
  return isHighScore ? SUPPLEMENT_CARDS.high : SUPPLEMENT_CARDS.low
}

function getGutBrainInsights(addons: PremiumAddons): typeof GUT_BRAIN_INSIGHTS.high {
  const isHighScore = addons.mealTiming[0]?.title.includes("Maintain")
  return isHighScore ? GUT_BRAIN_INSIGHTS.high : GUT_BRAIN_INSIGHTS.low
}

interface ReportPremiumAddonsProps {
  addons: PremiumAddons
  claudeReport?: ClaudePremiumReport | null
}

export function ReportPremiumAddons({ addons, claudeReport }: ReportPremiumAddonsProps) {
  const [openRecipe, setOpenRecipe] = useState<number | null>(null)

  return (
    <>
      {/* ── System Story ───────────────────────────────────────────────── */}
      {claudeReport?.systemStory && (
        <section className="px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <p className="border-l-4 border-[var(--icon-green)] pl-5 font-serif text-xl italic leading-relaxed text-foreground/80 sm:text-2xl">
                &ldquo;{claudeReport.systemStory}&rdquo;
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Priority Map ────────────────────────────────────────────────── */}
      {claudeReport?.priorityMap && (
        <section className="border-t border-border bg-secondary/10 px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Your Priority Map
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The single biggest blocker and the single biggest builder in your food system right now.
              </p>
            </ScrollReveal>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ScrollReveal>
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 h-full">
                  <p className="text-xs font-bold uppercase tracking-widest text-destructive/70">
                    Biggest Blocker
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {claudeReport.priorityMap.biggestBlocker}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {claudeReport.priorityMap.blockerExplanation}
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <div className="rounded-2xl border border-[var(--icon-green)]/20 bg-[var(--icon-green)]/5 p-5 h-full">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]/70">
                    Biggest Builder
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {claudeReport.priorityMap.biggestBuilder}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {claudeReport.priorityMap.builderExplanation}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}

      {/* ── 12-Week System Strategy ──────────────────────────────────────── */}
      {claudeReport?.phasedStrategy && (
        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Your 12-Week System Strategy
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Three phases built around your specific scores and profile.
              </p>
            </ScrollReveal>
            <div className="mt-6 space-y-4">
              {claudeReport.phasedStrategy.map((phase, i) => (
                <ScrollReveal key={phase.phase} delay={i * 80}>
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{phase.phase}</p>
                          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            {phase.duration}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[var(--icon-green)]">{phase.milestone}</p>
                        <ul className="mt-3 space-y-1.5">
                          {phase.actions.map((action, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-foreground">
                              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--icon-green)]" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Deep System Interpretation ──────────────────────────────────── */}
      {claudeReport?.systemInterpretation && (
        <section className="border-t border-border bg-secondary/10 px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Your System, Interpreted
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/80 sm:text-base whitespace-pre-line">
                {claudeReport.systemInterpretation}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}
      {/* ── Meal Timing ─────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Meal Timing for Your Gut
                </h2>
                <p className="text-xs text-muted-foreground">Personalised to your profile</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 space-y-4">
            {addons.mealTiming.map((rule, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{rule.detail}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seasonal Food Guide ─────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                <Leaf size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Seasonal Food Guide
                </h2>
                <p className="text-xs text-muted-foreground">Foods to prioritise right now — Spring</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {addons.seasonalFoods.map((food, i) => (
              <ScrollReveal key={food.food} delay={i * 50}>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                  <span className="text-2xl">{food.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{food.food}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{food.why}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Weekly Shopping List ─────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
              >
                <ShoppingCart size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Your Weekly Shopping List
                </h2>
                <p className="text-xs text-muted-foreground">30 items tailored to your pillars</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {addons.shoppingList.map((cat, i) => (
              <ScrollReveal key={cat.category} delay={i * 60}>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {cat.category}
                  </p>
                  <ul className="space-y-1.5">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                        <Check size={13} className="mt-0.5 shrink-0 text-[var(--icon-green)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 90-Day Milestones ────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
              >
                <Target size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Your 90-Day Milestones
                </h2>
                <p className="text-xs text-muted-foreground">Month-by-month goals to track your progress</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 space-y-4 print:space-y-6">
            {addons.milestones.map((m, i) => (
              <ScrollReveal key={m.month} delay={i * 60}>
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
                      {m.month}
                    </div>
                    <p className="font-semibold text-foreground">Month {m.month}: {m.title}</p>
                  </div>
                  <ul className="space-y-2">
                    {m.goals.map((goal) => (
                      <li key={goal} className="flex items-start gap-3">
                        <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border print:border-foreground/30" />
                        <span className="text-sm leading-relaxed text-muted-foreground">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Biotic Recipes ───────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
              >
                <ChefHat size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Biotic Kitchen Starters
                </h2>
                <p className="text-xs text-muted-foreground">3 recipes tailored to your weakest pillars</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 space-y-3">
            {addons.recipes.map((recipe, i) => (
              <ScrollReveal key={recipe.name} delay={i * 60}>
                <div className="rounded-3xl border border-border bg-background overflow-hidden">
                  <button
                    onClick={() => setOpenRecipe(openRecipe === i ? null : i)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{recipe.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Prep: {recipe.prepTime}</p>
                    </div>
                    <div
                      className={cn(
                        "text-xs font-medium text-muted-foreground transition-transform duration-200",
                        openRecipe === i && "rotate-180"
                      )}
                    >
                      ▾
                    </div>
                  </button>
                  {openRecipe === i && (
                    <div className="border-t border-border px-5 pb-5 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Ingredients</p>
                      <ul className="space-y-1 mb-4">
                        {recipe.ingredients.map((ing) => (
                          <li key={ing} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--icon-green)]" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Method</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{recipe.method}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supplement Considerations ────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
              >
                <span className="text-base">💊</span>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Supplement Considerations
                </h2>
                <p className="text-xs text-muted-foreground">Evidence-based, not prescriptive — based on your profile</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 space-y-4">
            {getSupplementCards(addons).map((card, i) => (
              <ScrollReveal key={card.title} delay={i * 60}>
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{card.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{card.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.detail}</p>
                      <p className="mt-2 text-xs font-medium text-[var(--icon-teal)]">{card.look_for}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal>
            <p className="mt-4 text-xs text-muted-foreground/60 leading-relaxed">
              Supplements are not a substitute for food. The evidence consistently shows food-first approaches outperform supplements alone. These notes are for educational reference only — consult a registered dietitian for personal advice.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Gut-Brain Connection ─────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
              >
                <span className="text-base">🧠</span>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Your Gut-Brain Connection
                </h2>
                <p className="text-xs text-muted-foreground">What your Feeling score reveals about the gut-brain axis</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 space-y-4">
            {getGutBrainInsights(addons).map((insight, i) => (
              <ScrollReveal key={insight.title} delay={i * 60}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12-Month Seasonal Food Calendar ─────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
              >
                <span className="text-base">📅</span>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  12-Month Seasonal Food Calendar
                </h2>
                <p className="text-xs text-muted-foreground">The best prebiotic-rich foods to prioritise each month</p>
              </div>
            </div>
          </ScrollReveal>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
            {SEASONAL_CALENDAR.map((month, i) => (
              <div
                key={month.month}
                className={cn(
                  "flex items-start gap-4 px-5 py-4",
                  i !== 0 && "border-t border-border/60",
                  month.season === "spring" && "bg-[var(--icon-lime)]/3",
                  month.season === "summer" && "bg-[var(--icon-green)]/3",
                  month.season === "autumn" && "bg-[var(--icon-yellow)]/3",
                  month.season === "winter" && "bg-[var(--icon-teal)]/3",
                )}
              >
                <div className="w-20 shrink-0">
                  <p className="text-xs font-bold text-foreground">{month.month}</p>
                  <p className="text-[10px] capitalize text-muted-foreground">{month.season}</p>
                </div>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {month.foods.map((food) => (
                    <span
                      key={food}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
