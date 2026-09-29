/**
 * Biotic claims: what the product may say about Prebiotics, Probiotics and
 * Postbiotics.
 *
 * ══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════
 *
 * EatoBiotics adopted the strict ISAPP definitions:
 *
 *   Prebiotic  — a substrate selectively utilised by host microorganisms,
 *                conferring a health benefit.
 *   Probiotic  — live microorganisms that, in adequate amounts, confer a
 *                health benefit on the host.
 *   Postbiotic — a preparation of inanimate microorganisms and/or their
 *                components that confers a health benefit on the host.
 *
 * Three non-equivalences follow, and each was being breached in shipped copy:
 *
 *   fermented food  ≠ probiotic
 *   dietary fibre   ≠ prebiotic
 *   microbial metabolite ≠ postbiotic
 *
 * The holding page carried "Living microorganisms found in fermented foods
 * like yogurt, kimchi, sauerkraut, and kefir" — a claim not reliably true of
 * its own named examples, since sauerkraut and kimchi are frequently
 * pasteurised and several fermented foods are heated before eating. The
 * 60-second flow asked "How often do living foods reach your gut?" and told
 * people fermented foods "deliver living bacteria straight to your gut".
 *
 * ══ THE GENERAL RULE THIS ENFORCES ══════════════════════════════════════════
 *
 *   Measure what the assessment can observe.
 *   Teach the biology accurately.
 *   Never make the educational concept pretend to be the measured variable.
 *
 * ══ SCOPE, STATED HONESTLY ══════════════════════════════════════════════════
 *
 * This is Phase 1 Tranche 1: the surfaces a visitor can reach TODAY, while the
 * password gate serves /enter. The canonical assessment surfaces, the Family
 * funnel and the account/share surfaces carry the same class of claim and are
 * NOT yet covered — see the Tranche 2+ list in the design specification. A
 * guard that silently implied whole-product coverage would be worse than one
 * that says where it stops.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { MARKETING_SURFACES } from "./customer-surfaces"

/** Source with comments stripped — developer notes are not customer copy. */
function renderedSource(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/**
 * The surfaces a visitor reaches today.
 *
 * `/enter` renders WaitlistHero → FoodSystemExperience, then PowersEverything,
 * HowItWorks, TheFramework, ScorePreview, Ecosystem, FirstCourse. The four
 * below are the ones that speak about the Biotics.
 */
const LIVE_SURFACES = [
  "lib/quick-assessment.ts",
  "components/waitlist/food-system-experience.tsx",
  "components/home/the-framework.tsx",
  "components/home/feed-seed-heal.tsx",
]

/** English dictionary copy is checked separately — same rules, one locale. */
const EN_DICTIONARY = "lib/i18n/dictionaries.ts"

/**
 * The surfaces that must not promise the canonical score before it exists.
 *
 * Module scope rather than inside its own describe, so the membership
 * assertions below can pin it too.
 */
const PRE_LAUNCH = [
  "app/enter/page.tsx",
  "components/waitlist/food-system-experience.tsx",
  "components/waitlist/first-course.tsx",
  "components/home/how-it-works.tsx",
]

/**
 * Claim shapes that assert live organisms in fermented food.
 *
 * ══ VERB-ANCHORED, NOT PROXIMITY-BASED ══════════════════════════════════════
 *
 * The first version matched "ferment*" and "live/living" within 80 characters
 * of each other. That flagged two things it should not have:
 *
 *   • `pillar: "probiotics"` sitting near the fermented question in
 *     quick-assessment.ts — a DATA KEY, not customer copy;
 *   • the corrected copy itself — "Live microorganisms with a demonstrated
 *     benefit — not every fermented food contains them" — which contains both
 *     terms precisely BECAUSE it is drawing the distinction.
 *
 * A rule that fires on the sentence written to fix the problem is not a rule
 * about the problem. These match the assertion instead: a verb of containing
 * or delivering, a locating verb, or the noun phrase itself.
 */
const FERMENTED_LIVE_CLAIMS: [string, RegExp][] = [
  ["fermented food asserted to deliver or contain live organisms",
   /ferment\w*[^.!?]{0,60}\b(deliver|contain|bring|provide|give|carr(y|ies)|pack|full of|rich in)\w*[^.!?]{0,40}\b(live|living)\b/i],
  ["live organisms located in fermented food",
   /\b(live|living)\b[^.!?]{0,50}\b(found|present|contained)\b[^.!?]{0,40}ferment/i],
  ["live or living foods as a product category",
   /\b(live|living) foods?\b/i],
  ["live cultures asserted of food",
   /\blive[- ]cultures?\b|\bliving cultures?\b/i],
  ["fermented food equated with probiotics",
   /ferment\w*\s+(foods?\s+)?(are|is)\s+(a\s+)?probiotics?\b|\bfor live probiotics\b/i],
  ["colonisation or reseeding claimed",
   /\b(reseed|re-seed|reseeding|seed new life|repopulat\w+|colonis\w+|coloniz\w+)\b/i],
]

/** Claim shapes that assert fibre IS prebiotic, rather than being associated. */
const FIBRE_PREBIOTIC_CLAIMS: [string, RegExp][] = [
  ["fibre classified as prebiotic", /\bfibre?\b[^.!?]{0,30}\b(is|are)\b[^.!?]{0,20}prebiotic/i],
  ["foods classified as prebiotic-rich", /\bprebiotic-rich\b/i],
]

describe("the corpus this guard reads cannot silently shrink", () => {
  /*
   * ══ THE DEFECT THIS CLOSES ═════════════════════════════════════════════════
   *
   * Every rule below reads a hand-kept list of paths. That gives the guard a
   * blind spot the rules themselves cannot see: DELETING a path fails nothing.
   * The suite stays green, having simply scanned one file fewer. Sabotage case
   * 950 walked straight through exactly this in a sibling guard, and the repair
   * there was the same as the repair here — assert the membership, not just the
   * rules.
   *
   * Two assertions, deliberately different in kind:
   *
   *   1. the lists are pinned BY VALUE, so a removal is a failing diff rather
   *      than a quieter scan;
   *   2. the component surfaces must ALSO be in the shared corpus
   *      (tests/unit/customer-surfaces.ts), so a file cannot leave the three
   *      vocabulary guards and remain covered only here.
   *
   * `lib/quick-assessment.ts` and `lib/i18n/dictionaries.ts` are deliberately
   * NOT in MARKETING_SURFACES — that list names rendered surfaces, and these
   * two are data modules. They are pinned by (1) instead, which is why (1)
   * exists rather than deferring wholesale to the shared corpus.
   */
  it("LIVE_SURFACES is exactly the surfaces that speak about the Biotics", () => {
    expect([...LIVE_SURFACES].sort()).toEqual([
      "components/home/feed-seed-heal.tsx",
      "components/home/the-framework.tsx",
      "components/waitlist/food-system-experience.tsx",
      "lib/quick-assessment.ts",
    ])
  })

  it("the rendered surfaces are in the shared vocabulary corpus too", () => {
    for (const file of LIVE_SURFACES.filter((f) => f.startsWith("components/"))) {
      expect(MARKETING_SURFACES, `${file} must stay in MARKETING_SURFACES`).toContain(file)
    }
  })

  it("the pre-launch list is pinned by value as well", () => {
    expect([...PRE_LAUNCH].sort()).toEqual([
      "app/enter/page.tsx",
      "components/home/how-it-works.tsx",
      "components/waitlist/first-course.tsx",
      "components/waitlist/food-system-experience.tsx",
    ])
  })
})

describe("fermented food is never equated with live organisms or probiotics", () => {
  it.each(LIVE_SURFACES)("%s makes no live-organism claim", (file) => {
    const copy = renderedSource(file)
    for (const [name, pattern] of FERMENTED_LIVE_CLAIMS) {
      const hit = copy.match(pattern)
      expect(hit?.[0] ?? null, `${file} — ${name}: "${hit?.[0]}"`).toBeNull()
    }
  })

  it("the English dictionary makes no live-organism claim either", () => {
    // The five locales translate the same strings; the English source is the
    // reviewed one (REVIEWED_LOCALES = ["en"]) and is what this can read.
    const copy = renderedSource(EN_DICTIONARY)
    for (const [name, pattern] of FERMENTED_LIVE_CLAIMS) {
      const hit = copy.match(pattern)
      expect(hit?.[0] ?? null, `dictionaries.ts — ${name}: "${hit?.[0]}"`).toBeNull()
    }
  })

  it("NON-VACUITY: the copy that was shipping would be caught", () => {
    const asItWas = [
      "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir.",
      "Fermented foods deliver living bacteria straight to your gut.",
      "How often do living foods reach your gut?",
      "Yoghurt, kefir, kimchi, sauerkraut, miso — they seed new life into your microbiome.",
    ]
    for (const line of asItWas) {
      const caught = FERMENTED_LIVE_CLAIMS.some(([, p]) => p.test(line))
      expect(caught, `not caught: ${line}`).toBe(true)
    }
  })

  it("does not fire on copy that is merely ABOUT fermentation", () => {
    const fine = [
      "Yoghurt, kefir, kimchi, sauerkraut, miso — foods transformed by fermentation.",
      "How often do you eat fermented foods?",
      "Fermentation is one of the oldest ways people have transformed food.",
    ]
    for (const line of fine) {
      const caught = FERMENTED_LIVE_CLAIMS.some(([, p]) => p.test(line))
      expect(caught, `false positive on: ${line}`).toBe(false)
    }
  })
})

describe("fibre is never classified as prebiotic", () => {
  it.each(LIVE_SURFACES)("%s makes no prebiotic classification claim", (file) => {
    const copy = renderedSource(file)
    for (const [name, pattern] of FIBRE_PREBIOTIC_CLAIMS) {
      const hit = copy.match(pattern)
      expect(hit?.[0] ?? null, `${file} — ${name}: "${hit?.[0]}"`).toBeNull()
    }
  })

  it("NON-VACUITY: 'prebiotic-rich foods' would be caught", () => {
    const line = "Do you regularly eat prebiotic-rich foods — oats, garlic, onion?"
    expect(FIBRE_PREBIOTIC_CLAIMS.some(([, p]) => p.test(line))).toBe(true)
  })
})

describe("no Biotic carries a personal number", () => {
  /*
   * The reveal rendered `Prebiotics — Feed 67`, `Probiotics — Seed 67`,
   * `Postbiotics — Rejuvenate 67`. `Postbiotics — 67` is a personal postbiotic
   * state as a number, which POSTBIOTICS_INFERENCE_BOUNDARY prohibits by name.
   *
   * Checked structurally: the reveal must not read per-pillar values out of
   * `subScores` at all. The overall score is untouched and still rendered —
   * it is computed by the same arithmetic as before.
   */
  it("the reveal reads no per-Biotic score", () => {
    const src = renderedSource("components/waitlist/food-system-experience.tsx")
    expect(src, "the reveal must not read per-pillar sub-scores").not.toMatch(
      /subScores\s*\[/,
    )
    expect(src, "the reveal must not read a named pillar score").not.toMatch(
      /subScores\.(prebiotics|probiotics|postbiotics|feed|seed|heal)/,
    )
  })

  it("the overall score is still shown — this removed a claim, not the result", () => {
    const src = renderedSource("components/waitlist/food-system-experience.tsx")
    expect(src).toMatch(/result\.overall/)
    expect(src).toMatch(/Biotics Score/)
  })

  it("NON-VACUITY: reading a pillar score back in would be caught", () => {
    const sabotaged = `const value = result.subScores[key]`
    expect(/subScores\s*\[/.test(sabotaged)).toBe(true)
  })
})

describe("the pre-launch surface does not promise the canonical score", () => {
  /*
   * Transitional vocabulary policy: "Food System Score" is not retired — it is
   * the chosen destination — but a pre-launch page must not present it as the
   * result of a five-question flow. Forbidden here; required on canonical
   * surfaces once the methodology is approved.
   */
  it.each(PRE_LAUNCH)("%s does not claim a Food System Score", (file) => {
    expect(renderedSource(file)).not.toMatch(/\bfood system score\b/i)
  })

  it("NON-VACUITY: the claim that was shipping would be caught", () => {
    expect(/\bfood system score\b/i.test("See your Food System Score instantly.")).toBe(true)
  })
})
