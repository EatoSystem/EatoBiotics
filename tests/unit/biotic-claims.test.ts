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
import { execSync } from "node:child_process"
import { MARKETING_SURFACES, AI_PROMPT_SURFACES } from "./customer-surfaces"
import { reachableSourceFiles, servablePageCount } from "./reachable-surfaces"

/** Source with comments stripped — developer notes are not customer copy. */
function renderedSource(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/**
 * Tranche 1 — the surfaces a visitor reaches while the password gate serves
 * `/enter`.
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

/**
 * Tranche 2A — the surfaces a customer can reach once the gate is off.
 *
 * Seven pages, the free result's share card and the image it generates, and
 * `lib/pillars.ts`, the canonical vocabulary module they all read from.
 * `/c/[country]` is deliberately absent: its only match was the brand lens,
 * which the rule no longer treats as a claim.
 */
const REACHABLE_SURFACES = [
  // The classifier of record. It left the ledger in Tranche 2D: its last two
  // matches were a LABEL-READING INSTRUCTION ("look for 'live cultures' on the
  // label") and the category term "prebiotic-rich" applied to inulin — which
  // genuinely IS a prebiotic under strict ISAPP. Both were reworded rather
  // than exempted, so the rules keep their edge and this file is now guarded
  // like any other rather than allowed wholesale.
  "lib/foods.ts",
  "app/help/page.tsx",
  "app/biotics/page.tsx",
  "app/method/page.tsx",
  "app/about/page.tsx",
  "app/food/page.tsx",
  "app/books/page.tsx",
  "app/discover/[code]/page.tsx",
  "components/assessment/score-card.tsx",
  "components/assessment/result/three-biotics-result.tsx",
  "components/assessment/assessment-intro.tsx",
  "lib/assessment/biotics.ts",
  "app/api/score-card/route.tsx",
  "lib/pillars.ts",
]

/**
 * Tranche 2B — the system prompts.
 *
 * None is reachable by a customer today: every route that calls one classifies
 * as POST_V1. They are here anyway, and first in priority among the unreached,
 * because a prompt sentence does not stay one sentence — it is regenerated into
 * many customer-facing forms, addressed to one person at a time, in wording
 * nobody reviews.
 *
 * They are named rather than derived. `reachableSourceFiles()` seeds from page
 * routes, so its import closure never reaches an API route and the ledger below
 * cannot see a prompt at all. Stated plainly so nobody reads that ledger as
 * covering these.
 */
const PROMPT_SURFACES = [
  "lib/biotics-prompt.ts",
  "app/api/consult/route.ts",
  "app/api/demo/consult/route.ts",
  "app/api/report-chat/route.ts",
  "app/api/food-intelligence/route.ts",
]

/**
 * Lifecycle email templates — Tranche 2C.
 *
 * ── The gap these close, which was the worst one yet ─────────────────────────
 *
 * These templates were inside `EMAIL_SURFACES` in customer-surfaces.ts, so the
 * three VOCABULARY guards read them. No CLAIM rule ever did. The result:
 * `sequence-email.ts` was still rendering a number and a filled bar for each
 * Biotic — "Probiotics 54/100" — and still writing "Your Postbiotics score
 * reflects…", months after Tranche 1 removed exactly that from the reveal and
 * Tranche 2A removed it from /assessment/you, the share card and the generated
 * OG image.
 *
 * Being in one guard's corpus is not being guarded. That is the same shape as
 * the-framework.tsx, how-it-works.tsx and the three unlisted prompt modules,
 * and it is the fourth time it has been found by looking rather than by CI.
 *
 * An email is also the least recoverable surface in the product: a page can be
 * corrected and re-rendered, a share card regenerates per request, but a
 * delivered email is final.
 */
const EMAIL_SURFACES = [
  "lib/email/sequence-email.ts",
  "lib/email/results-email.ts",
  "lib/email/paid-report-email.ts",
  "lib/email/nudge-email.ts",
  "lib/email/trial-winback-email.ts",
  "lib/email/meal-analysis-email.ts",
]

/**
 * The FSS-v1 candidate — a fifth tranche, and the first one guarded BEFORE it
 * can be reached rather than after.
 *
 * ── Why it is its own list ────────────────────────────────────────────────────
 *
 * The four lists above each carry a tranche meaning: live, customer-reachable,
 * a prompt, an email. The candidate is none of those. It sits behind a
 * fail-closed preview gate, nothing links to it, and production refuses it
 * outright. Appending it to one of those lists would make that list's docblock
 * false, so it joins as a fifth and says what it is.
 *
 * ── Why it needs guarding at all, given nobody can reach it ──────────────────
 *
 * Because "nobody can reach it" is a property of a gate, and a gate is one edit
 * from being wrong — and because this is the layer that will carry the
 * product's recommendations. Every earlier tranche was added AFTER a claim had
 * already shipped: Tranche 1 after the reveal, 2A after the result page and the
 * share image, 2C after `sequence-email.ts` had been rendering per-Biotic
 * numbers for months. Each time the finding came from reading rather than from
 * CI, and each time the file was simply in no corpus.
 *
 * ── What it was checked by until now, which was not nothing but was close ────
 *
 * The derived ledger at the bottom of this file, and only that. Because
 * `/preview/food-system-v1` classifies FIXTURE_SELF_GATED rather than POST_V1,
 * it seeds `reachableSourceFiles()`, so the candidate closure was inside the
 * ledger corpus — which runs exactly two rule sets, the fermented-live and
 * fibre-prebiotic ones. `PERSONAL_BIOTIC_STATE` and the per-file number rules
 * never saw it. It passes all of them today; the point is that it was passing
 * unobserved.
 *
 * ── DERIVED, not hand-kept, and that is the whole repair ─────────────────────
 *
 * Every other tranche here is a named list, which is defensible for finished
 * surfaces and indefensible for one still being built: a list is guarded
 * because somebody remembered, and Gate 3 adds a module a week. So these three
 * roots are enumerated from the tree. A new candidate file is guarded the
 * moment it exists, which is the property every previous tranche lacked, and
 * the thing a developer would have to do to escape the rules is delete a
 * directory from CANDIDATE_ROOTS — which a test below refuses.
 *
 * ── Why `--others`, which is not decoration ──────────────────────────────────
 *
 * `git ls-files` alone lists TRACKED files, so a module that exists on disk but
 * has not been staged is invisible to it. That was true the first time this ran
 * against Gate 3's own new files: three modules sat in `lib/fss/action/`, the
 * corpus reported the same count as before, and every rule passed by not
 * looking. In CI it would never show, because CI only ever sees committed work —
 * which makes it precisely the kind of hole that is found late.
 *
 * `--others --exclude-standard` adds untracked-but-not-ignored files, so the
 * guard reads what a developer has written rather than what they have staged.
 * "Guarded the moment it exists" is otherwise just a comment.
 */
const CANDIDATE_ROOTS = ["lib/fss", "components/fss", "app/preview/food-system-v1"]

/** Tracked AND untracked-not-ignored, so a file is guarded the moment it exists. */
function candidateTree(): string[] {
  return execSync(`git ls-files --cached --others --exclude-standard ${CANDIDATE_ROOTS.join(" ")}`, {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .sort()
}

const CANDIDATE_SURFACES = candidateTree()

/** Everything the claim rules are enforced against. */
const GUARDED_SURFACES = [
  ...LIVE_SURFACES,
  ...REACHABLE_SURFACES,
  ...PROMPT_SURFACES,
  ...EMAIL_SURFACES,
  ...CANDIDATE_SURFACES,
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
  "components/waitlist/hundred-systems.tsx",
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
 *
 * ══ AND ONE EXCLUSION, WHICH IS NOT A WEAKENING ═════════════════════════════
 *
 * "live/living foods" carries a negative lookahead for "system", because
 * EatoBiotics' positioning line is "The Food System Inside You" and
 * /c/[country] and /discover/[code] both render the variant "the living food
 * system inside you". Without the lookahead the rule flags the brand.
 *
 * That matters more than a tidy regex. This guard is about to be pointed at
 * every reachable surface, and a rule that cannot tell a product-category
 * claim from the positioning line would have the sweep delete the sentence the
 * product is named after — the exact risk a broad claims cleanup runs. What is
 * prohibited is "live foods" as a CATEGORY OF FOOD ("Live foods (Probiotics)",
 * "How often do living foods reach your gut?"). "The living food system inside
 * you" is a lens on a person, makes no claim about what is in a jar, and
 * stays. Both directions are pinned below.
 */
const FERMENTED_LIVE_CLAIMS: [string, RegExp][] = [
  ["fermented food asserted to deliver or contain live organisms",
   /ferment\w*[^.!?]{0,60}\b(deliver|contain|bring|provide|give|carr(y|ies)|pack|full of|rich in)\w*[^.!?]{0,40}\b(live|living)\b/i],
  ["live organisms located in fermented food",
   /\b(live|living)\b[^.!?]{0,50}\b(found|present|contained)\b[^.!?]{0,40}ferment/i],
  ["live or living foods as a product category",
   /\b(live|living) foods?\b(?!\s+system)/i],
  /*
   * One narrow exemption, and it is worth reading because the first attempt at
   * it was wrong.
   *
   * "Live cultures" is the claim — "Probiotics: live cultures from fermented
   * foods". But "live-culture cheese" names a product type that genuinely
   * exists, and it sits inside prompt food lists that Tranche 2B froze
   * deliberately so no Meal Biotics Score could move on a wording edit.
   *
   * The first fix allowed any hyphenated SINGULAR, reasoning that a compound
   * modifier is an adjective. That let `"live-culture exposure"` through in
   * lib/report/subscores.ts — a claim about a person, not a product, and one
   * the ledger was correctly holding. A structural rule about hyphens cannot
   * tell the two apart, because the difference is what the word modifies.
   *
   * So the exemption is ENUMERATED instead: exactly the cheese phrasing the
   * frozen food lists contain, and nothing else. Small enough to read, and it
   * cannot quietly widen. Both directions are pinned below.
   */
  ["live cultures asserted of food",
   /\blive[- ]cultures?\b(?!\s+(and aged\s+)?cheese)|\bliving cultures?\b/i],
  ["fermented food equated with probiotics",
   /ferment\w*\s+(foods?\s+)?(are|is)\s+(a\s+)?probiotics?\b|\bfor live probiotics\b/i],
  ["colonisation or reseeding claimed",
   /\b(reseed|re-seed|reseeding|seed new life|repopulat\w+|colonis\w+|coloniz\w+)\b/i],
  // Added in Tranche 2A. "Live and fermented foods" reads as one category with
  // two names, which is the equivalence in its quietest form — and it was the
  // most visible claim left on the corrected free result, sitting directly
  // under the word "Probiotics". Narrow on purpose: it matches the conjunction,
  // not every sentence containing both words.
  ["live foods named as a category beside fermented ones",
   /\blive (and|or) fermented foods?\b/i],
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
  /*
   * The named tranches are pinned by value; the candidate tranche is pinned by
   * its RULE instead, below. Two different disciplines for two different kinds
   * of list, and conflating them would break the one that matters: a finished
   * surface should not leave the corpus silently, and an unfinished one should
   * not have to be remembered into it.
   */
  it("the named tranches are exactly the set signed off", () => {
    expect([...LIVE_SURFACES, ...REACHABLE_SURFACES, ...PROMPT_SURFACES, ...EMAIL_SURFACES].sort()).toEqual([
      "app/about/page.tsx",
      "app/api/consult/route.ts",
      "app/api/demo/consult/route.ts",
      "app/api/food-intelligence/route.ts",
      "app/api/report-chat/route.ts",
      "app/api/score-card/route.tsx",
      "app/biotics/page.tsx",
      "app/books/page.tsx",
      "app/discover/[code]/page.tsx",
      "app/food/page.tsx",
      "app/help/page.tsx",
      "app/method/page.tsx",
      "components/assessment/assessment-intro.tsx",
      "components/assessment/result/three-biotics-result.tsx",
      "components/assessment/score-card.tsx",
      "components/home/feed-seed-heal.tsx",
      "components/home/the-framework.tsx",
      "components/waitlist/food-system-experience.tsx",
      "lib/assessment/biotics.ts",
      "lib/biotics-prompt.ts",
      // Tranche 2C — lifecycle email. Added deliberately, and the reason is
      // worth keeping: these were read by the vocabulary guards and by no
      // claim rule, which is how a per-Biotic number and bar survived in
      // sequence-email.ts long after every page had lost it.
      "lib/email/meal-analysis-email.ts",
      "lib/email/nudge-email.ts",
      "lib/email/paid-report-email.ts",
      "lib/email/results-email.ts",
      "lib/email/sequence-email.ts",
      "lib/email/trial-winback-email.ts",
      "lib/foods.ts",
      "lib/pillars.ts",
      "lib/quick-assessment.ts",
    ])
  })

  /*
   * The candidate tranche's invariant is coverage, not membership. These three
   * assertions are what stop the derivation becoming decorative:
   *
   *   1. it found something — an empty glob would pass every rule vacuously,
   *      which is how a derived corpus fails silently;
   *   2. all three roots are represented — so deleting one from CANDIDATE_ROOTS
   *      to make a file pass is a visible failure rather than a quiet one;
   *   3. every tracked .ts/.tsx under those roots is in GUARDED_SURFACES — the
   *      actual property, asserted directly.
   */
  it("every candidate file is guarded, and the derivation is not empty", () => {
    expect(CANDIDATE_SURFACES.length).toBeGreaterThanOrEqual(16)

    for (const root of CANDIDATE_ROOTS) {
      expect(
        CANDIDATE_SURFACES.some((f) => f.startsWith(`${root}/`)),
        `no file was collected from ${root} — has the root been removed or renamed?`,
      ).toBe(true)
    }

    for (const file of candidateTree()) {
      expect(GUARDED_SURFACES, `${file} is in the candidate tree but not guarded`).toContain(file)
    }
  })

  it("the rendered marketing surfaces are in the shared vocabulary corpus too", () => {
    for (const file of LIVE_SURFACES.filter((f) => f.startsWith("components/"))) {
      expect(MARKETING_SURFACES, `${file} must stay in MARKETING_SURFACES`).toContain(file)
    }
  })

  it("the pre-launch list is pinned by value as well", () => {
    expect([...PRE_LAUNCH].sort()).toEqual([
      "app/enter/page.tsx",
      "components/home/how-it-works.tsx",
      "components/waitlist/food-system-experience.tsx",
      "components/waitlist/hundred-systems.tsx",
    ])
  })
})

describe("fermented food is never equated with live organisms or probiotics", () => {
  it.each(GUARDED_SURFACES)("%s makes no live-organism claim", (file) => {
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
      // Tranche 2A additions — all four were live on a page a customer could open.
      "Probiotics are live cultures from fermented foods (yogurt, kefir, kimchi, sauerkraut, miso).",
      "Live foods (Probiotics)",
      "Probiotics add living cultures to diversify them.",
      "Prebiotic-rich foods that support the gut-sleep axis",
    ]
    for (const line of asItWas) {
      const caught = [...FERMENTED_LIVE_CLAIMS, ...FIBRE_PREBIOTIC_CLAIMS].some(([, p]) => p.test(line))
      expect(caught, `not caught: ${line}`).toBe(true)
    }
  })

  it("the cheese exemption covers a product, and nothing else", () => {
    /*
     * The enumerated exemption, pinned in both directions. Its whole risk is
     * quiet widening: an exemption that grew to cover "live-culture exposure"
     * or "live-culture foods" would excuse the claim it was written around.
     */
    const stillCaught = [
      "Probiotics: live cultures from fermented foods (yoghurt, kefir, kimchi)",
      "Adding (fermented and live-culture foods)",
      "probiotics: \"live-culture exposure\"",
      "Greek yogurt = probiotic (live cultures)",
      "Foods with living cultures",
    ]
    for (const line of stillCaught) {
      const caught = FERMENTED_LIVE_CLAIMS.some(([, p]) => p.test(line))
      expect(caught, `exemption widened — not caught: ${line}`).toBe(true)
    }

    const exempt = [
      "kombucha, sourdough, live-culture and aged cheese, etc.",
      "kimchi, sauerkraut, miso, tempeh, kombucha, live-culture cheese",
    ]
    for (const line of exempt) {
      const caught = FERMENTED_LIVE_CLAIMS.some(([, p]) => p.test(line))
      expect(caught, `frozen food-list entry wrongly flagged: ${line}`).toBe(false)
    }
  })

  it("the brand's own positioning line is NOT a live-foods claim", () => {
    /*
     * The counterfactual for the exclusion documented above. Without the
     * negative lookahead each of these matches, and a sweep run on this rule
     * would have edited the sentence EatoBiotics is named after.
     *
     * Asserted in CI, not only under the sabotage harness, because this is the
     * direction a claims cleanup fails in quietly: an over-broad rule produces
     * a green suite and a product that no longer sounds like itself.
     */
    const brand = [
      "the living food system inside you",
      "Discover your Food System Type — a 60-second discovery of the living food system inside you.",
      "Your living Food System responds to what you feed it.",
    ]
    for (const line of brand) {
      const caught = FERMENTED_LIVE_CLAIMS.some(([, p]) => p.test(line))
      expect(caught, `false positive on the brand lens: ${line}`).toBe(false)
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
  it.each(GUARDED_SURFACES)("%s makes no prebiotic classification claim", (file) => {
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

/**
 * Every surface that could attach a number to a Biotic, and the expression it
 * would have to use to do it.
 *
 * ══ WHY THIS IS A TABLE AND NOT ONE REGEX ═══════════════════════════════════
 *
 * There is no text pattern for "a personal biological state expressed as a
 * number". The claim is made differently in each place — a sub-score lookup, a
 * field on an insight row, a template interpolation, a query parameter read —
 * and a rule loose enough to catch all four would catch the honest code too.
 *
 * So each surface names the expression that would reconstitute the claim
 * THERE, with its reason. That is narrower than a general rule and it is what
 * makes it falsifiable: sabotage cases 970-972 put each claim back, and each
 * one has to turn this red.
 *
 * The three lists arrived the hard way. The first version of this guard
 * checked only the reveal, so when the claim was removed from the free result
 * and the shared card image, three sabotage cases walked straight through — a
 * guard asserting the presence of selected symbols rather than the property it
 * documents, which is the recurring defect in this codebase.
 */
/**
 * The personal per-Biotic state, written as a SENTENCE rather than rendered as
 * a number.
 *
 * NO_PERSONAL_BIOTIC_NUMBER below is structural and per-file: it refuses the
 * expressions that would put a value on screen. It cannot see prose, and prose
 * is where the claim actually survived longest — `sequence-email.ts` was still
 * saying "Your Postbiotics score reflects your meal rhythm" after every bar
 * and digit had been removed from every page.
 *
 * A sentence asserting a personal Biotic score is the same claim as the digit.
 * POSTBIOTICS_INFERENCE_BOUNDARY prohibits "personal Postbiotics state" and
 * "low Postbiotics" as SUBJECTS, not as number formats.
 *
 * The overall Biotics Score™ is deliberately untouched by these rules — it is
 * the product's score, it is computed by the same arithmetic as ever, and
 * "Your Biotics Score is 74/100" is a true statement about a thing we measure.
 */
const BIOTICS = "(?:Prebiotics|Probiotics|Postbiotics)"
const PERSONAL_BIOTIC_STATE: [string, RegExp][] = [
  ["a personal score attributed to a Biotic",
   new RegExp(String.raw`\b(?:Your|My|your|my)\s+${BIOTICS}\s+score\b`)],
  ["a Biotic given a numeric value", new RegExp(String.raw`\b${BIOTICS}\b[^.!?\n]{0,30}\b\d{1,3}\s*(?:\/\s*100|out of 100)\b`)],
  ["a Biotic described as high or low for a person",
   new RegExp(String.raw`\b(?:low|high|weak|strong)\s+${BIOTICS}\b`)],
]

const NO_PERSONAL_BIOTIC_NUMBER: [string, string, RegExp[]][] = [
  [
    "components/waitlist/food-system-experience.tsx",
    "the pre-launch reveal must not read per-pillar sub-scores",
    [/subScores\s*\[/, /subScores\.(prebiotics|probiotics|postbiotics|feed|seed|heal)/],
  ],
  [
    "components/assessment/result/three-biotics-result.tsx",
    "the free result's Biotic cards must not read the pillar's score",
    [/insight\.score/],
  ],
  [
    "components/assessment/score-card.tsx",
    "the share card must not take the three sub-scores at all — the props are gone, and the share text was where the claim actually travelled",
    [/\b(feed|seed|heal)\b/],
  ],
  [
    "lib/email/sequence-email.ts",
    "the nurture email must not take the three sub-scores at all — the fields are gone from its contract, because a field it still accepted would be an invitation to render it again",
    [/\b(feedScore|seedScore|healScore)\b/],
  ],
  [
    "app/api/score-card/route.tsx",
    "the generated image must not read a sub-score from the query string; old links still carry them and are ignored",
    [/searchParams\.get\(\s*"(feed|seed|heal|prebiotics|probiotics|postbiotics)"/, /\bpScore\b/],
  ],
]

describe("no Biotic carries a personal number", () => {
  /*
   * The reveal rendered `Prebiotics — Feed 67`, `Probiotics — Seed 67`,
   * `Postbiotics — Rejuvenate 67`, and the free result rendered
   * `Postbiotics: 64 out of 100` with a bar. A per-Biotic number is a personal
   * postbiotic state, which POSTBIOTICS_INFERENCE_BOUNDARY prohibits by name,
   * and under strict ISAPP a questionnaire reaches none of the three.
   *
   * The overall score is untouched everywhere and still rendered — it is
   * computed by the same arithmetic as before. This removed a claim, not a
   * result.
   */
  it.each(NO_PERSONAL_BIOTIC_NUMBER)("%s carries no per-Biotic value", (file, why, patterns) => {
    const src = renderedSource(file)
    for (const pattern of patterns) {
      expect(src, `${file} — ${why}`).not.toMatch(pattern)
    }
  })

  it.each(GUARDED_SURFACES)("%s asserts no personal Biotic state in prose", (file) => {
    const src = renderedSource(file)
    for (const [why, pattern] of PERSONAL_BIOTIC_STATE) {
      const hit = src.match(pattern)
      expect(hit?.[0] ?? null, `${file} — ${why}: "${hit?.[0]}"`).toBeNull()
    }
  })

  it("NON-VACUITY: the sentences that were shipping would each be caught", () => {
    for (const line of [
      "Your Prebiotics score reflects how much fibre you eat.",
      "My Postbiotics score went up this month.",
      "Postbiotics: 64 out of 100",
      "Probiotics 54/100",
      "a low Postbiotics result",
    ]) {
      expect(
        PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(line)),
        `not caught: ${line}`,
      ).toBe(true)
    }
  })

  it("NON-VACUITY: the overall score and the unscored Biotics are NOT caught", () => {
    for (const line of [
      "Your Biotics Score™ is 74/100.",
      "Prebiotics, Probiotics and Postbiotics are the foundation the score is built on.",
      "Postbiotics are what your gut bacteria produce when they ferment fibre.",
    ]) {
      expect(
        PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(line)),
        `false positive: ${line}`,
      ).toBe(false)
    }
  })

  it("the three surfaces still NAME all three Biotics", () => {
    /*
     * The other half, and the one that stops this being a deletion. Type D:
     * educational Biotics content is preserved and improved, never demoted for
     * being unscored. A "fix" that quietly dropped Postbiotics from the free
     * result would pass every rule above and be a worse product.
     *
     * Two of the three carry the names as literals. The third does not, and
     * cannot: `three-biotics-result.tsx` renders `{insight.label}` from data,
     * so the words never appear in its source — the same limit that let
     * sabotage cases 947/948 write an equation out of data bindings and walk
     * through a source guard. For that file the structural equivalent is
     * asserted instead: it still renders the label and still shows the
     * educational line from BIOTIC_INTRO.
     */
    for (const file of [
      "components/assessment/score-card.tsx",
      "app/api/score-card/route.tsx",
    ]) {
      const src = renderedSource(file)
      for (const biotic of ["Prebiotics", "Probiotics", "Postbiotics"]) {
        expect(src, `${file} must still name ${biotic}`).toMatch(new RegExp(`\\b${biotic}\\b`))
      }
    }

    const cards = renderedSource("components/assessment/result/three-biotics-result.tsx")
    expect(cards, "the free result must still render each Biotic's name").toMatch(/insight\.label/)
    expect(cards, "the free result must still teach what each Biotic is").toMatch(/BIOTIC_INTRO/)
  })

  it("the overall score is still shown — this removed a claim, not the result", () => {
    const src = renderedSource("components/waitlist/food-system-experience.tsx")
    expect(src).toMatch(/result\.overall/)
    expect(src).toMatch(/Biotics Score/)
  })

  it("NON-VACUITY: each claim, put back, would be caught", () => {
    const sabotaged: [string, string][] = [
      ["components/waitlist/food-system-experience.tsx", "const value = result.subScores[key]"],
      ["components/assessment/result/three-biotics-result.tsx", "<span>{insight.score}</span>"],
      ["components/assessment/score-card.tsx", "text: `scores are ${feed}, ${seed}, ${heal}`"],
      ["app/api/score-card/route.tsx", 'const feed = Number(searchParams.get("feed") ?? 0)'],
    ]
    for (const [file, line] of sabotaged) {
      const entry = NO_PERSONAL_BIOTIC_NUMBER.find(([f]) => f === file)!
      expect(entry[2].some((p) => p.test(line)), `not caught for ${file}: ${line}`).toBe(true)
    }
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

/**
 * ══ THE LEDGER ══════════════════════════════════════════════════════════════
 *
 * Every reachable file that still carries a claim and is not yet guarded.
 *
 * This is NOT an exclusion list. An exclusion list says "ignore these"; this
 * says "these are known, counted, and the set may not grow". It exists because
 * the alternative designs are both worse:
 *
 *   • asserting that every reachable file carrying a claim is corrected would
 *     be red today, and the honest way to green it is to correct 22 more files
 *     — the €49 Report path, the account surfaces, the condition pages and the
 *     frozen assessment items — which is the whole-product rewrite this phase
 *     was explicitly told not to do;
 *   • saying nothing leaves the original failure mode intact: a file nobody
 *     remembered is a file nobody guarded, which is how `the-framework.tsx`
 *     and `how-it-works.tsx` both shipped banned copy with a green suite.
 *
 * So the set is pinned by value. A NEW reachable file that starts carrying a
 * claim fails this test. A corrected file that regresses fails it. And the
 * list shrinks as 2B/2C/2D land — each removal a visible diff rather than a
 * quiet one.
 *
 * `lib/consultation/science-contract.ts` is in here for an honest reason and
 * should be read differently from the rest: it matches the colonisation rule
 * because it is the module PROHIBITING colonisation claims. It is a false
 * positive of the rule, not debt, and it is listed rather than special-cased
 * so that nobody has to trust a comment to know why it is absent.
 */
const KNOWN_UNCORRECTED = [
  /*
   * ══ WHAT IS LEFT, AND WHY EACH ONE IS LEFT ═════════════════════════════════
   *
   * Tranche 2C cleared the €49 Report path and lifecycle email; Tranche 2D
   * cleared the account, twin, condition and demo surfaces. Twenty-two entries
   * became three, and none of the three is unfinished work — each is blocked
   * on a decision that is not a claims decision.
   */

  /*
   * q6 — "Do you regularly eat prebiotic-rich foods…" — is INSIDE the
   * methodology-freeze hash. Its wording is a scoring input: changing the
   * examples changes what people answer, and score provenance does not exist
   * yet, so old and new results would be silently incomparable. Deferred to
   * FSS Phase 3, gated on scientific sign-off. Correcting it to make a ledger
   * green would be the exact trade this phase refuses.
   */
  "lib/assessment-data.ts",


  /*
   * Not debt. This is the module that PROHIBITS the claim the rule matches —
   * it lists "reseeding" among the inferences the contract forbids. A guard
   * that flagged its own contract would be asking us to delete the
   * prohibition. Permanent, justified exception.
   */
  "lib/consultation/science-contract.ts",
]

describe("no reachable surface carries a claim outside the ledger", () => {
  const ALL_RULES = [...FERMENTED_LIVE_CLAIMS, ...FIBRE_PREBIOTIC_CLAIMS]

  /** Reachable files carrying a claim, minus the ones already guarded. */
  function unguardedClaimFiles(): string[] {
    const guarded = new Set([...GUARDED_SURFACES, EN_DICTIONARY])
    return reachableSourceFiles()
      .filter((f) => !guarded.has(f))
      .filter((f) => ALL_RULES.some(([, p]) => p.test(renderedSource(f))))
      .sort()
  }

  it("the reachable set was actually computed", () => {
    /*
     * The vacuity check this whole mechanism turns on. An empty closure — a
     * renamed app directory, a classifier that refuses everything, a git
     * command that returned nothing — would make every assertion below pass
     * while proving nothing at all.
     */
    expect(servablePageCount(), "no servable page routes found").toBeGreaterThan(50)
    expect(reachableSourceFiles().length, "import closure looks empty").toBeGreaterThan(200)
  })

  it("is exactly the ledger — no additions", () => {
    expect(unguardedClaimFiles()).toEqual([...KNOWN_UNCORRECTED].sort())
  })

  it("the ledger has no entry that is already clean", () => {
    /*
     * The other direction, and the one that makes the ledger shrink honestly:
     * a file corrected in a later tranche must be REMOVED from this list, not
     * left behind as a stale allowance. Leaving it would quietly re-open the
     * hole for that path.
     */
    const stale = KNOWN_UNCORRECTED.filter(
      (f) => !ALL_RULES.some(([, p]) => p.test(renderedSource(f))),
    )
    expect(stale, "corrected — remove from KNOWN_UNCORRECTED").toEqual([])
  })
})

/**
 * ══ THE RUBRIC CANNOT MOVE ON A CLAIMS EDIT ═════════════════════════════════
 *
 * These prompts are claims and scoring rubrics in the same sentence:
 * "Probiotics — live cultures from fermented foods … (up to 25 pts)". Rewording
 * the first half while nudging the second is the exact way a claims repair
 * would become a silent scoring change, and nothing else in this repository
 * would notice — a prompt has no golden output to diff.
 *
 * So Tranche 2B's rule was: words only, every point value and threshold frozen.
 * This is what makes that a checked fact rather than an assurance. It pins the
 * allocations by value, so a wording edit that also moves a number fails here
 * even though the claim rules stay green.
 *
 * Deliberately NOT asserted: that the three rubrics agree with each other. They
 * do not, and that is recorded rather than repaired — see the note below.
 */
const MEAL_RUBRIC = [
  "• Prebiotic richness — up to 45 pts: 4+ different plant/fibre foods=45 | 3=40 | 2=32 | 1=20 | 0=0",
  "• Probiotic presence — up to 25 pts: 2+ fermented foods=25 | 1=20 | none=10",
  "• Postbiotic support — up to 15 pts: 1+ food that supports postbiotic production=15 | none=5",
  "• Protein quality — up to 15 pts: high-quality protein=15 | some=12 | none=0",
]

describe("the meal scoring rubric survives the claims repair unchanged", () => {
  it.each([
    "lib/biotics-prompt.ts",
    "app/api/consult/route.ts",
    "app/api/demo/consult/route.ts",
  ])("%s carries the rubric byte-for-byte", (file) => {
    const src = readFileSync(file, "utf-8")
    for (const line of MEAL_RUBRIC) {
      expect(src, `${file} — rubric line changed: ${line}`).toContain(line)
    }
  })

  it("food-intelligence's point ceilings are unchanged", () => {
    const src = readFileSync("app/api/food-intelligence/route.ts", "utf-8")
    for (const line of [
      "- Prebiotic richness (fibre-rich plant foods): up to 45 pts",
      "- Probiotic presence (foods transformed by fermentation): up to 25 pts",
      "- Postbiotic presence (health compounds from fermentation): up to 15 pts",
      "- Protein quality for gut lining: up to 15 pts",
    ]) {
      expect(src).toContain(line)
    }
  })

  it("NON-VACUITY: moving a single point value would be caught", () => {
    const sabotaged = MEAL_RUBRIC[1].replace("none=10", "none=12")
    expect(MEAL_RUBRIC.includes(sabotaged)).toBe(false)
  })
})

describe("no prompt states a weighting it did not get from the implementation", () => {
  /*
   * ══ A LEGACY INCONSISTENCY, PRESERVED ON PURPOSE ════════════════════════
   *
   * The prompts disagree about the scoring model. consult, biotics-prompt and
   * food-intelligence all use 45 / 25 / 15 / 15 (prebiotic / probiotic /
   * postbiotic / protein). report-chat told members "prebiotic 45% + probiotic
   * 30% + postbiotic 25%" — different weights, and no protein at all.
   *
   * It is NOT reconciled here. Aligning them means deciding which is correct,
   * which is a scoring decision, and it belongs to the FSS-v1 methodology
   * review alongside the 20-point floor and the 40/20/40 question-count
   * artefact. 45/30/25 is not propagated anywhere and report-chat is not
   * aligned to 45/25/15/15.
   *
   * What IS enforced is narrower and safe: report-chat computes nothing — it
   * receives already-calculated scores and answers questions about them — so
   * its weighting sentence was pure prose, and prose that disagreed with the
   * implementation. It now says the score comes from the scoring model, and
   * tells the model not to invent a weighting. That last clause matters:
   * deleting a stated weighting without it would invite a fabricated one,
   * which is worse than a wrong one, because nobody could predict it.
   */
  const CHAT = readFileSync("app/api/report-chat/route.ts", "utf-8")

  it("report-chat states no weighting", () => {
    expect(CHAT, "a percentage weighting is back in report-chat").not.toMatch(
      /prebiotic\s*\d+%|probiotic\s*\d+%|postbiotic\s*\d+%/i,
    )
  })

  it("report-chat forbids inventing one", () => {
    expect(CHAT).toMatch(/do not invent a weighting/i)
  })

  it("NON-VACUITY: the weighting that was shipping would be caught", () => {
    const asItWas = "Overall = prebiotic 45% + probiotic 30% + postbiotic 25%."
    expect(/prebiotic\s*\d+%|probiotic\s*\d+%|postbiotic\s*\d+%/i.test(asItWas)).toBe(true)
  })

  it("the operative rubrics are untouched — this rule is not applied to them", () => {
    /*
     * The other half of the condition. consult and biotics-prompt APPLY their
     * rubric to produce a Meal Biotics Score; neutralising those would change
     * scoring semantics outright, so they keep their point allocations and are
     * deliberately outside this rule. Asserted so the exemption is visible
     * rather than implied by absence.
     */
    for (const file of ["app/api/consult/route.ts", "lib/biotics-prompt.ts"]) {
      expect(readFileSync(file, "utf-8"), `${file} must keep its operative rubric`).toContain(
        "up to 45 pts",
      )
    }
  })
})

describe("the prompts keep the discipline they already had", () => {
  /*
   * ══ TYPE D, ENFORCED ════════════════════════════════════════════════════
   *
   * Educational Biotics content is preserved and improved, never demoted. The
   * three teaching prompts were already exemplary about Postbiotics before any
   * of this work — "Postbiotics are OUTPUTS, never ingredients", "never say a
   * food is a postbiotic" — and the risk in a claims sweep is not that someone
   * adds a claim there but that someone deletes the sentence stopping one.
   *
   * Sabotage case 988 did exactly that and walked straight through: every
   * claim rule stayed green while the prohibition was replaced with the claim
   * it prohibits. A rule set that only bans things cannot notice the loss of a
   * safeguard, so this asserts the safeguard's presence — the one place where
   * a presence assertion is the right instrument, because presence is the
   * property.
   */
  const POSTBIOTIC_DISCIPLINE: [string, RegExp][] = [
    ["lib/biotics-prompt.ts", /never say a food "is a postbiotic"/i],
    ["lib/biotics-prompt.ts", /Never describe a food as "a postbiotic"/i],
    ["app/api/consult/route.ts", /No food is "a postbiotic"/i],
    ["app/api/demo/consult/route.ts", /No food is "a postbiotic"/i],
  ]

  it.each(POSTBIOTIC_DISCIPLINE)("%s keeps its postbiotic prohibition", (file, rule) => {
    expect(readFileSync(file, "utf-8"), `${file} lost its postbiotic prohibition`).toMatch(rule)
  })

  it("no prompt calls a food a postbiotic", () => {
    /*
     * The negative half, and it took two tries to get right.
     *
     * The obvious rule — a copula, `(is|are) (a )?postbiotic` — cannot work
     * here. These prompts QUOTE the forbidden phrase in order to forbid it
     * ("No food is \"a postbiotic\""), and one of them writes "If someone asks
     * which foods are postbiotics, correct the premise warmly". A rule that
     * fires on a file for defending itself is worse than no rule: the only way
     * to green it is to delete the safeguard. It is the comment-vs-code trap
     * wearing a third costume.
     *
     * So the copula rule is gone. What remains matches the LOCATION claim —
     * postbiotics said to be in food — which is the shape the prohibition
     * exists to stop and which no safeguard sentence uses. The deletion of a
     * safeguard is caught by the presence assertions above instead, which is
     * the right instrument for it.
     */
    const FOOD_IS_POSTBIOTIC: [string, RegExp][] = [
      ["foods described as postbiotic-rich", /\bpostbiotic-rich\b(?!")/i],
      ["postbiotics located in food",
       /\bpostbiotics?\b[^.!?]{0,60}\b(in|inside|within)\s+(these\s+|the\s+|your\s+)?foods?\b/i],
    ]
    for (const file of PROMPT_SURFACES) {
      const src = renderedSource(file)
      for (const [name, pattern] of FOOD_IS_POSTBIOTIC) {
        const hit = src.match(pattern)
        expect(hit?.[0] ?? null, `${file} — ${name}: "${hit?.[0]}"`).toBeNull()
      }
    }
  })

  it("NON-VACUITY: the location claim is caught, the safeguard is not", () => {
    const located = /\bpostbiotics?\b[^.!?]{0,60}\b(in|inside|within)\s+(these\s+|the\s+|your\s+)?foods?\b/i
    // Exactly what sabotage case 988 wrote in place of the prohibition.
    expect(located.test("Postbiotics are the beneficial compounds in these foods.")).toBe(true)
    expect(/\bpostbiotic-rich\b(?!")/i.test("Eat postbiotic-rich foods daily.")).toBe(true)
    // And the sentences that FORBID the claim must not trip it, or the only
    // way to a green suite would be to delete the safeguard.
    for (const safeguard of [
      'No food is "a postbiotic" and none is "postbiotic-rich"',
      "If someone asks which foods are postbiotics, correct the premise warmly",
      'never say a food "is a postbiotic" or is "postbiotic-rich"',
    ]) {
      expect(located.test(safeguard), `fires on the safeguard: ${safeguard}`).toBe(false)
    }
  })
})

describe("every prompt this guard names is in the shared prompt corpus", () => {
  /*
   * Sabotage case 987 removed lib/biotics-prompt.ts from AI_PROMPT_SURFACES and
   * nothing failed, because this file keeps its own PROMPT_SURFACES list. Two
   * lists that can disagree are two lists that eventually will — the argument
   * customer-surfaces.ts makes in its own docblock, applied to itself.
   */
  it.each(PROMPT_SURFACES)("%s is in AI_PROMPT_SURFACES", (file) => {
    expect(AI_PROMPT_SURFACES, `${file} must stay in AI_PROMPT_SURFACES`).toContain(file)
  })
})
