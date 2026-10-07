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
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs"
import { execSync } from "node:child_process"
import { PERSONAL_BIOTIC_STATE } from "@eatobiotics/claims"
import {
  MARKETING_SURFACES,
  AI_PROMPT_SURFACES,
  ACCOUNT_SURFACES,
  ASSESSMENT_SURFACES,
  REPORT_SURFACES,
  MOBILE_SURFACES,
} from "./customer-surfaces"
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
  /*
   * Gate 3.7 — the SIXTH prompt module, and it had never been in any corpus.
   *
   * Tranche 2B's own docblock above records finding a fifth
   * (`lib/biotics-prompt.ts`) after an audit had named four. This is the same
   * miss one layer out: `app/api/menu-scan/route.ts` builds a system prompt and
   * a per-request user message, and no guard had ever opened it. Its prompt told
   * the model "The member's weakest biotic is ${weakest}" and asked for "what it
   * feeds" — the exact model Gate 3.6 removed from fifteen surfaces, waiting
   * behind a refused route for someone to turn it on.
   *
   * Listed rather than derived, for the reason stated above: the ledger seeds
   * from page routes, so its import closure never reaches an API route.
   */
  "app/api/menu-scan/route.ts",
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

/**
 * Tranche 2E — the agent loop, and the account surfaces it writes prose for.
 *
 * ── Why it is a sixth list and not an append ──────────────────────────────
 *
 * It is none of the five above: not live marketing, not a customer-reachable
 * page, not a prompt, not an email, not the FSS candidate. It is a
 * DETERMINISTIC GENERATOR — rule-based, no AI — whose sentences are rendered
 * on `/account`, which is V1_CORE. Appending it to a tranche whose docblock
 * describes something else would make that docblock false, which is the same
 * reason CANDIDATE_SURFACES got its own list.
 *
 * ── The gap, which was two gaps wearing one coat ──────────────────────────
 *
 * `reachableSourceFiles()` has ALWAYS included these files — `/account` is
 * V1_CORE, so every agent-loop module is in its import closure, under both the
 * servable and the production notion. But the ledger that reads that closure
 * runs `[...FERMENTED_LIVE_CLAIMS, ...FIBRE_PREBIOTIC_CLAIMS]` and nothing
 * else, so PERSONAL_BIOTIC_STATE never saw them. Meanwhile
 * `customer-surfaces.ts` lists `live-dashboard.tsx` — the file that MOUNTS
 * these sentences — while every file that WRITES them sat outside it. The
 * guard read the importer and not the imported module, which is verbatim what
 * that file's own docblock says went wrong with `biotics-prompt.ts`.
 *
 * ── AND WHY THIS LIST ALONE DOES NOT CLOSE IT ─────────────────────────────
 *
 * A source scan of all fourteen files catches exactly ONE of the nine known
 * sites — `menu-scan.tsx`, the only one written as a literal. The other eight
 * interpolate: `${BIOTIC_LABELS[k]}`, `${BIOTIC_NAME[tb]}`,
 * `${BIOTIC_LABEL[bestKey]}`. No source-text rule can see them, which is the
 * same limit recorded below for `three-biotics-result.tsx` and the hole
 * sabotage cases 947/948 walked through.
 *
 * So this list is necessary and insufficient, and the thing that actually
 * closes the defect is `tests/unit/agent-loop-claims.test.ts`, which CALLS
 * `analyse`, `recommend`, `deriveGaps`, `buildAccountTwin` and
 * `detectPatterns` and asserts on the strings they return. Membership here
 * stops a future LITERAL; the behavioural guard stops a future interpolation.
 * Both are needed and neither is decoration.
 *
 * `BioticsProgressPanel` and all three of its consumers are included even
 * though two of them sit behind POST_V1 refusals, so a reinstated
 * `/account/twin` cannot bring the per-Biotic number model back with it.
 */
const AGENT_LOOP_SURFACES = [
  "lib/agent-loop/providers/deterministic.ts",
  "lib/agent-loop/baseline.ts",
  "lib/agent-loop/behaviour.ts",
  "lib/agent-loop/biotics.ts",
  "lib/agent-loop/account-twin.ts",
  "lib/agent-loop/engine.ts",
  "lib/agent-loop/stages.ts",
  "lib/agent-loop/twin/twin-builder.ts",
  "lib/account/patterns.ts",
  // Added DURING Gate 3.6, not planned: the sweep of /account's import closure
  // found four more live sites the audit had missed, including the person's
  // three Biotic scores drawn onto a public share PNG.
  "lib/account/inside-you.ts",
  "lib/account/share-card.ts",
  "lib/account/system-map.ts",
  "lib/account/week-story.ts",
  "components/account/twin/meal-reveal.tsx",
  "components/account/twin/share-twin.tsx",
  "components/account/twin/twin-stage.tsx",
  "components/agent-loop/BioticsProgressPanel.tsx",
  "components/agent-loop/NextBestActionCard.tsx",
  "components/agent-loop/FoodSystemLoopCard.tsx",
  "components/account/twin/twin-sections.tsx",
  "components/account/twin/twin-dashboard.tsx",
  "components/account/twin/menu-scan.tsx",
]

/*
 * ══ EXPERIENCE 0R-1 — THE THREE CORPORA THAT WERE WRITTEN AND NEVER WIRED ═══
 *
 * `ACCOUNT_SURFACES` and `ASSESSMENT_SURFACES` have existed in
 * `customer-surfaces.ts` for tranches. They were never imported here. That is
 * the whole of `P0-GUARD-01` and the Assessment gap: the lists were authored,
 * reviewed, and then not connected to the thing that enforces them.
 *
 * `REPORT_SURFACES` did not exist at all — `P0-GUARD-02`, and the surface it
 * leaves unguarded is `/assessment/report`, the live €49 product.
 *
 * Three surfaces, found outside the same scan, one at a time, over three audit
 * steps. 0R-2's derivation exists so this is the last manual widening.
 *
 * ── WHAT THE WIDENING ACTUALLY CAUGHT, AND WHY THAT IS THE POINT ────────────
 *
 * 33 files enter the corpus. They produce SEVEN (file, rule) findings — and
 * `live-dashboard.tsx`, which carries SIX P0s, produces ONE.
 *
 * Because the rest have no string to match. `P0-TRUST-01`'s fabricated meal is
 * a data fallback. `P0-SCIENCE-02`'s rings are JSX reading a prop.
 * `P0-SCIENCE-04` is a COLOUR. `P0-SCIENCE-05` is an ANATOMICAL COORDINATE.
 * `P0-TRUST-05` is a URL and an auto-send.
 *
 * So this file closes the COVERAGE gap and measures, rather than asserts, how
 * much of the debt coverage cannot reach. The FORM gap is a different
 * instrument: see `tests/unit/biotic-visual-encoding.test.ts`.
 */

/** Everything the claim rules are enforced against. */
const GUARDED_SURFACES = [
  ...LIVE_SURFACES,
  ...REACHABLE_SURFACES,
  ...PROMPT_SURFACES,
  ...EMAIL_SURFACES,
  ...CANDIDATE_SURFACES,
  ...AGENT_LOOP_SURFACES,
  // 0R-1. Deduplicated: AGENT_LOOP_SURFACES already carries several Twin files,
  // and a file guarded twice would report twice.
  ...[...ACCOUNT_SURFACES, ...ASSESSMENT_SURFACES, ...REPORT_SURFACES].filter(
    (f) =>
      ![
        ...LIVE_SURFACES,
        ...REACHABLE_SURFACES,
        ...PROMPT_SURFACES,
        ...EMAIL_SURFACES,
        ...CANDIDATE_SURFACES,
        ...AGENT_LOOP_SURFACES,
      ].includes(f),
  ),
  // P0 mobile companion. Named list; the same nine PERSONAL_BIOTIC_STATE
  // rules run over it. A per-Biotic bar in RN must fail here.
  ...MOBILE_SURFACES,
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
  /*
   * Added in Gate 3.7, and the gap it closes is embarrassing in a useful way.
   *
   * The rule above refuses `colonis\w+` by name. `app/biotics/page.tsx` — a
   * live page, inside this very corpus since Tranche 2A — said "New living
   * bacteria JOIN THE COLONY" in its cycle diagram, four screens below the
   * Probiotics card whose Phase 1 comment records removing the identical claim
   * ("eating them INTRODUCES NEW RESIDENTS to your gut"). It passed for one
   * reason: "colony" is not "colonise".
   *
   * ── WHY THE NOUN ALONE IS NOT THE RULE ───────────────────────────────────
   *
   * "Colony" is ordinary, correct microbiology in impersonal description —
   * colony-forming units, a bacterial colony — and a rule that refused the word
   * would make the page less accurate, not more. What cannot be said is
   * organisms ARRIVING AT or JOINING one, because that is establishment, which
   * is what the evidence does not support for fermented food and what this
   * product does not measure.
   *
   * So the rule needs the verb and the noun together, which is also why it is
   * narrow enough to state in one line.
   */
  ["organisms joining or establishing in a colony",
   /\b(join\w*|enter\w*|settl\w+|establish\w*|arriv\w*|add\w*|introduc\w*)\b[^.!?]{0,40}\bcolon(y|ies)\b/i],
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
  /*
   * ── ADDED AFTER SABOTAGE CASE 1090 SLIPPED ───────────────────────────────
   *
   * The value-pinned test below spreads the tranche lists DIRECTLY:
   *
   *   [...LIVE_SURFACES, ..., ...AGENT_LOOP_SURFACES].sort()
   *
   * So it never looks at `GUARDED_SURFACES`. Deleting `...AGENT_LOOP_SURFACES`
   * from the composition left every assertion green while fifteen files
   * silently stopped being scanned — the suite simply read fewer files, which
   * is the exact failure sabotage case 950 found in a sibling guard and the
   * reason the pinning test exists at all. The repair there was "assert the
   * membership, not just the rules"; it had been applied to the lists and not
   * to the thing composed FROM the lists.
   *
   * Asserted for all six tranches rather than just the new one, because the
   * hole was never specific to tranche 2E.
   */
  it("every tranche actually reaches GUARDED_SURFACES", () => {
    const tranches: [string, readonly string[]][] = [
      ["LIVE_SURFACES", LIVE_SURFACES],
      ["REACHABLE_SURFACES", REACHABLE_SURFACES],
      ["PROMPT_SURFACES", PROMPT_SURFACES],
      ["EMAIL_SURFACES", EMAIL_SURFACES],
      ["CANDIDATE_SURFACES", CANDIDATE_SURFACES],
      ["AGENT_LOOP_SURFACES", AGENT_LOOP_SURFACES],
      // 0R-1 — the three that were written and never wired.
      ["ACCOUNT_SURFACES", ACCOUNT_SURFACES],
      ["ASSESSMENT_SURFACES", ASSESSMENT_SURFACES],
      ["REPORT_SURFACES", REPORT_SURFACES],
      ["MOBILE_SURFACES", MOBILE_SURFACES],
    ]
    for (const [name, list] of tranches) {
      expect(list.length, `${name} is empty`).toBeGreaterThan(0)
      for (const file of list) {
        expect(
          GUARDED_SURFACES,
          `${file} is in ${name} but GUARDED_SURFACES does not include it`,
        ).toContain(file)
      }
    }
    // And nothing else is in there, so a file cannot be guarded by accident.
    const union = new Set(tranches.flatMap(([, l]) => l))
    for (const file of GUARDED_SURFACES) {
      expect(union, `${file} is guarded but belongs to no tranche`).toContain(file)
    }
  })

  /*
   * ══ 0R-6 · THE THREE 0R-1 TRANCHES ARE PINNED AS EXACT SETS TOO ═══════════
   *
   * Added because sabotage 1452 SLIPPED at 0R-6, and the reason it slipped is
   * the more important half.
   *
   * 1452 deletes `lib/assessment-report.ts` from `REPORT_SURFACES` — one file
   * quietly leaving the corpus. It used to be caught, but never by a membership
   * assertion: the test above removes the file from BOTH sides of its own
   * comparison, so it cannot see a deletion. What caught it was the D7 derived
   * ledger, which noticed the file was reachable, carried a claim, and now had
   * no guard.
   *
   * Then 0R-6 repaired the claims out of that file. It is clean, so D7 is
   * correctly silent, so the entry can now be dropped with nothing failing.
   *
   * ── THE LESSON, WHICH IS NOT ABOUT THIS FILE ──────────────────────────────
   *
   * A corpus entry was protected by the presence of a DEFECT in the file it
   * names. Repairing the defect removed the protection — so every file this
   * programme successfully cleans becomes a file that can silently leave the
   * scan, and the cleanest files are exactly the ones whose guard looks most
   * droppable. The corpus has to be pinned for what it IS, not for what is
   * currently wrong inside it.
   *
   * These three lists were the ones 0R-1 wrote and wired; the five older
   * tranches have been pinned as an exact set since Gate 3.7.
   */
  it("the three 0R-1 tranches are exactly the sets signed off", () => {
    expect([...ACCOUNT_SURFACES].sort()).toEqual([
      "components/account/dashboard-client-data.ts",
      "components/account/dashboard-client.tsx",
      "components/account/day8-challenge-card.tsx",
      "components/account/goal-progress-card.tsx",
      "components/account/live-dashboard.tsx",
      "components/account/monthly-progress-card.tsx",
      "components/account/progress-chart.tsx",
      "components/account/report-bridge-card.tsx",
      "components/account/score-progress-card.tsx",
      "components/account/seven-day-guide.tsx",
      "components/account/twin/ask-twin.tsx",
      "components/account/twin/meal-reveal.tsx",
      "components/account/twin/share-twin.tsx",
      "components/account/twin/twin-sections.tsx",
      "components/account/twin/twin-stage.tsx",
      "components/account/upgrade-gate.tsx",
      "components/account/welcome-screen.tsx",
      "components/agent-loop/BioticsProgressPanel.tsx",
      "components/agent-loop/NextBestActionCard.tsx",
    ])

    expect([...ASSESSMENT_SURFACES].sort()).toEqual([
      "components/assessment/assessment-intro.tsx",
      "components/assessment/assessment-results.tsx",
      "components/assessment/deep/deep-assessment-client.tsx",
      "components/assessment/paid-report-client.tsx",
      "components/assessment/personal-report-cta.tsx",
      "components/assessment/report-membership-cta.tsx",
      "components/assessment/result/biotics-score-reveal.tsx",
      "components/assessment/result/contribute-opt-in.tsx",
      "components/assessment/result/food-system-pattern.tsx",
      "components/assessment/result/food-system-profile.tsx",
      "components/assessment/result/one-free-action.tsx",
      "components/assessment/result/three-biotics-result.tsx",
      "components/assessment/score-card.tsx",
      "components/assessment/score-ring.tsx",
      "components/assessment/share-score-card.tsx",
    ])

    // The money path. Every one of these nine is in the chain that produces or
    // renders the €49 document, which is why `P0-GUARD-02` mattered.
    expect([...REPORT_SURFACES].sort()).toEqual([
      "components/assessment/full-report-client.tsx",
      "components/report/demo-report.tsx",
      "components/report/food-system-section.tsx",
      "lib/assessment-report.ts",
      "lib/fallback-paid-report.ts",
      "lib/report/addon-lens.ts",
      "lib/report/build-food-system-report.ts",
      "lib/report/framing.ts",
      "lib/report/subscores.ts",
    ])

    expect([...MOBILE_SURFACES].sort()).toEqual([
      "apps/mobile/App.tsx",
      "apps/mobile/src/config.ts",
      "apps/mobile/src/screens/MealScreen.tsx",
      "apps/mobile/src/screens/ProgressScreen.tsx",
      "apps/mobile/src/screens/SignInScreen.tsx",
      "apps/mobile/src/screens/TodayScreen.tsx",
      "lib/mobile/compose-progress.ts",
      "lib/mobile/compose-today.ts",
      "lib/mobile/next-step.ts",
      "lib/mobile/week-copy.ts",
    ])
  })

  it("the named tranches are exactly the set signed off", () => {
    expect([
      ...LIVE_SURFACES, ...REACHABLE_SURFACES, ...PROMPT_SURFACES, ...EMAIL_SURFACES,
      ...AGENT_LOOP_SURFACES,
    ].sort()).toEqual([
      "app/about/page.tsx",
      "app/api/consult/route.ts",
      "app/api/demo/consult/route.ts",
      "app/api/food-intelligence/route.ts",
      // Gate 3.7 — the sixth prompt module, found by looking rather than by CI.
      "app/api/menu-scan/route.ts",
      "app/api/report-chat/route.ts",
      "app/api/score-card/route.tsx",
      "app/biotics/page.tsx",
      "app/books/page.tsx",
      "app/discover/[code]/page.tsx",
      "app/food/page.tsx",
      "app/help/page.tsx",
      "app/method/page.tsx",
      // Tranche 2E — the agent loop and the account surfaces it writes for.
      // `/account` is V1_CORE, so these sentences are the ones a paying member
      // actually reads. Membership here stops a future literal; the
      // behavioural guard in agent-loop-claims.test.ts stops an interpolation.
      "components/account/twin/meal-reveal.tsx",
      "components/account/twin/menu-scan.tsx",
      "components/account/twin/share-twin.tsx",
      "components/account/twin/twin-dashboard.tsx",
      "components/account/twin/twin-sections.tsx",
      "components/account/twin/twin-stage.tsx",
      "components/agent-loop/BioticsProgressPanel.tsx",
      "components/agent-loop/FoodSystemLoopCard.tsx",
      "components/agent-loop/NextBestActionCard.tsx",
      "components/assessment/assessment-intro.tsx",
      "components/assessment/result/three-biotics-result.tsx",
      "components/assessment/score-card.tsx",
      "components/home/feed-seed-heal.tsx",
      "components/home/the-framework.tsx",
      "components/waitlist/food-system-experience.tsx",
      "lib/account/inside-you.ts",
      "lib/account/patterns.ts",
      "lib/account/share-card.ts",
      "lib/account/system-map.ts",
      "lib/account/week-story.ts",
      "lib/agent-loop/account-twin.ts",
      "lib/agent-loop/baseline.ts",
      "lib/agent-loop/behaviour.ts",
      "lib/agent-loop/biotics.ts",
      "lib/agent-loop/engine.ts",
      "lib/agent-loop/providers/deterministic.ts",
      "lib/agent-loop/stages.ts",
      "lib/agent-loop/twin/twin-builder.ts",
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

  /*
   * ── "GUARDED THE MOMENT IT EXISTS", PROVEN RATHER THAN CLAIMED ────────────
   *
   * The docblock above says a new candidate file is guarded as soon as it is
   * written, not as soon as it is staged. That claim rests entirely on
   * `--others`, and nothing could see the difference: by the time the suite
   * runs in CI everything is committed, so `git ls-files` alone would give the
   * same answer. Sabotage case 1061 — dropping `--others` — slipped for
   * exactly that reason.
   *
   * So the test creates the case. An untracked file under a candidate root
   * must appear in the corpus; with `--others` gone it would not.
   *
   * Removed in `finally`, including if an assertion throws, because a stray
   * file left in `lib/fss` would be picked up by every other derived corpus in
   * the repository and the failure would look like something else entirely.
   */
  it("sees a candidate file that exists but has not been staged", () => {
    const probe = "lib/fss/__corpus_probe__.ts"
    expect(existsSync(probe), "the probe path must be free before the test").toBe(false)

    try {
      writeFileSync(probe, "export const PROBE = true\n", "utf-8")
      expect(
        candidateTree(),
        "an unstaged candidate file is invisible to the corpus — has --others been dropped?",
      ).toContain(probe)
    } finally {
      if (existsSync(probe)) rmSync(probe)
    }

    expect(existsSync(probe), "the probe must not survive the test").toBe(false)
    expect(candidateTree()).not.toContain(probe)
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
      if (hit && isExposedAt0R1(file, name)) continue // 0R-1 inventory
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
      // Gate 3.7 — live on app/biotics/page.tsx's cycle diagram, inside this
      // corpus since Tranche 2A, and caught by nothing because "colony" is not
      // "colonise".
      "New living bacteria join the colony",
    ]
    for (const line of asItWas) {
      const caught = [...FERMENTED_LIVE_CLAIMS, ...FIBRE_PREBIOTIC_CLAIMS].some(([, p]) => p.test(line))
      expect(caught, `not caught: ${line}`).toBe(true)
    }
  })

  it("the colony rule refuses establishment, not the word", () => {
    /*
     * The risk in this rule is over-reach, not under-reach: "colony" is
     * ordinary microbiology, and a page that could not say it would be less
     * accurate rather than more careful. So both directions are pinned.
     */
    const caught = [
      "New living bacteria join the colony",
      "Fermented foods introduce new bacteria to the colony",
      "live cultures that settle into the existing colonies",
    ]
    for (const line of caught) {
      expect(
        FERMENTED_LIVE_CLAIMS.some(([, p]) => p.test(line)),
        `establishment not caught: ${line}`,
      ).toBe(true)
    }

    const allowed = [
      "A bacterial colony is a visible cluster grown from a single cell.",
      "Diversity is measured in colony-forming units per gram.",
      "The colonies in your gut outnumber your own cells.",
      "Beneficial bacteria multiply",
    ]
    for (const line of allowed) {
      const hits = FERMENTED_LIVE_CLAIMS.filter(([, p]) => p.test(line))
      expect(hits.map((h) => h[0]), `false positive: ${line}`).toEqual([])
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
      if (hit && isExposedAt0R1(file, name)) continue // 0R-1 inventory
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
/*
 * The regex fragments that build PERSONAL_BIOTIC_STATE live in
 * packages/claims so web and React Native share one list:
 *
 *   BIOTICS     (?:Prebiotics|Probiotics|Postbiotics)
 *   BIOTICS_ANY the same three, plus lowercase and singular forms
 *
 * `BIOTICS` alone misses "your probiotic side" (menu-scan.tsx) and "your
 * prebiotic intake" — a Biotic attributed to a person reads the same whether
 * the word is capitalised or singular, and the adjectival form is the one a
 * writer reaches for when describing somebody.
 */

/* ════════════════════════════════════════════════════════════════════════════
   GATE 3.6 — the grammar these rules were missing.

   ── What the first three rules could and could not see ────────────────────

   They knew exactly three shapes: "your X score", "X … N/100", and "low X".
   The agent loop speaks none of them. It writes:

     "Prebiotics remains your strongest area."
     "Your Prebiotics look settled, while Postbiotics appear lower."
     "Postbiotics appear lower than the others"
     "This fed your Prebiotics · meal score 72"
     "Your Postbiotics slipped 8 points this week"

   Every one of those PASSED all three rules when run against the rendered
   sentence, not merely against the source. Rule 1 wants the literal word
   `score` immediately after the Biotic, so "· meal score 72" misses by two
   words. Rule 2 wants a denominator, so "slipped 8 points" misses. Rule 3
   wants the adjective BEFORE the Biotic and in the positive degree, so
   "remains your strongest area" misses twice over.

   So this was never only a corpus gap. The defect speaks in POSSESSIVES and
   SUPERLATIVES, and the rule set knew neither.

   ── Why `is` and `are` are deliberately NOT state verbs here ──────────────

   The obvious fourth rule is "a Biotic as the subject of a copula" —
   `${BIOTICS}\s+(?:is|are|remains|appears|looks)`. It is wrong, and the
   existing false-positive cases below say why: "Prebiotics, Probiotics and
   Postbiotics are the foundation the score is built on" and "Postbiotics are
   what your gut bacteria produce when they ferment fibre" are both EDUCATION,
   both correct, and both match it. A rule that deleted those would be the
   identity risk this whole sweep is run to avoid.

   `remains / appears / looks / seems` are HEDGED state verbs. Education does
   not hedge about what a Biotic is; a personal verdict does. That is the
   discriminator, and it is why the copulas are absent.

   ── And why the possessive rule is scoped to the Biotic itself ────────────

   "your Prebiotics" is prohibited. "Postbiotics are what your gut bacteria
   produce" is not — the possessive there belongs to the bacteria. So the rule
   requires `your` IMMEDIATELY before the Biotic rather than anywhere near it.
   All fifteen educational and science-contract phrasings below pass.
   ════════════════════════════════════════════════════════════════════════════ */
/*
 * PERSONAL_BIOTIC_STATE is imported from @eatobiotics/claims so a React
 * Native client cannot invent a ninth rule. The rejected `${BIOTICS}\s+produced`
 * widening (case 1088 / app/biotics/page.tsx "Postbiotics produced") stays
 * rejected: education and a personal claim can be byte-identical, and a rule
 * that deleted the educational diagram would be the identity risk this sweep
 * exists to avoid.
 */

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0R-1 — THE DEBT THE WIDENED CORPUS EXPOSED.

   Measured, not estimated: the nine PERSONAL_BIOTIC_STATE rules applied to the
   33 files that entered GUARDED_SURFACES at 0R-1. Seven (file, rule) findings
   across four files, each reproduced below as the customer-facing text that
   matched.

   Every one is a KNOWN, RECORDED P0 — not a new discovery:

     live-dashboard.tsx    P0-TRUST-01/02/03, P0-SCIENCE-01/02/03   (0R-4, 0R-5)
     dashboard-client.tsx  the demo dashboard carrying the same construct
     demo-report.tsx       the refused /report* family               (0R-6)
     assessment-report.ts  the dev-flow Report generator, P0-SCIENCE-07 (0R-6)

   ── THIS LIST MAY ONLY SHRINK ──────────────────────────────────────────────

   Each entry is deleted by the 0R stage that removes the claim. It is NOT an
   exemption: three assertions below hold it to that, and the first fails if an
   entry outlives its defect.
   ════════════════════════════════════════════════════════════════════════════ */

const EXPOSED_AT_0R1: readonly [file: string, rule: string, example: string][] = [
  // ── /account, the real dashboard. 0R-4 and 0R-5. ──────────────────────────
  // MOCK_MEALS' fabricated insight: "The kimchi lifts your probiotic score
  // significantly." The fabricated DATA is P0-TRUST-01; this is its prose.
  [
    "components/account/live-dashboard.tsx",
    "a Biotic claimed as a person's own",
    "your probiotic",
  ],
  /*
   * "Your Prebiotics have been one of your stronger pathways, but your
   * Probiotics are pulling down your Biotics Score™."
   *
   * REACHABILITY CORRECTED AT 0R-3. This comment said "/account-you, public per
   * proxy.ts, so customer-visible". `proxy.ts:89` allowlists `/account-you`
   * past the PASSWORD GATE; `isServableInV1` still refuses it
   * (`v1-surface.ts:393`). Those are two different gates, and the proxy
   * allowlist is not reachability — the page 404s.
   *
   * The ENTRY stays: the file carries the claim string, which is what this
   * inventory records, and `dashboard-client.tsx` is also mounted by
   * `/demo/account/[tier]`. Only the justification was wrong.
   */
  [
    "components/account/dashboard-client.tsx",
    "a Biotic claimed as a person's own",
    "Your Prebiotics",
  ],

  // ── The Report family. 0R-6. ──────────────────────────────────────────────
  // demo-report.tsx is 2,357 lines behind the four refused /report* pages.
  // RETIRE rather than repair — it is a superseded product door.
  [
    "components/report/demo-report.tsx",
    "a personal score attributed to a Biotic",
    "Your Probiotics score",
  ],
  [
    "components/report/demo-report.tsx",
    "a Biotic claimed as a person's own",
    "Your Probiotics",
  ],
  [
    "components/report/demo-report.tsx",
    "a Biotic given a comparative or directional verdict",
    "Probiotics score is the single strongest",
  ],
  // assessment-report.ts generates the dev-flow Report — P0-SCIENCE-07, the
  // latent production hazard one environment variable from the €49 route.
  /*
   * ── 0R-6 CLOSED `lib/assessment-report.ts` ENTIRELY ──────────────────────
   *
   * Both of its entries are DELETED — "a personal score attributed to a Biotic"
   * ("your Prebiotics score") and "a Biotic claimed as a person's own" ("your
   * Prebiotics"). `P0-SCIENCE-07`'s repair removed `score` from
   * `PillarDeepDive`, reworded the two per-pillar summaries, and replaced the
   * week-3 focus line *"Push your Prebiotics score up and fine-tune how your
   * body responds after meals."* — which was the only place in the file where
   * either literal appeared.
   *
   * ── AND THIS ASSERTION CAUGHT ME GETTING IT WRONG ────────────────────────
   *
   * The first attempt deleted one entry and kept the other, with a comment
   * asserting that the file "still carries a Biotic claimed as a person's own
   * elsewhere in its copy". It does not. The staleness rule refused the
   * surviving row immediately, which is the inventory doing precisely the job
   * it was built for: a repaired finding cannot keep a row, and a confident
   * note about what remains is not evidence.
   */

  /* ── CATEGORY-EQUIVALENCE CLAIMS — NOT IN THE EXPERIENCE 0 REGISTER ───────
   *
   * The nine below are the reason 0R-1 runs before anything else.
   *
   * Experience 0 audited for personal Biotic STATE and found sixteen P0s. It
   * did not sweep Account and Report for CATEGORY EQUIVALENCE — "live foods"
   * as a product category, fermented food asserted to carry live cultures,
   * fibre classified as prebiotic, food claimed to colonise. Tranche 2B
   * repaired exactly this class on the marketing pages and never reached
   * these surfaces, because these surfaces were not in the corpus.
   *
   * So the widening did what the specification said it would: THE RED LIST
   * DEFINED WORK THE AUDIT HAD NOT CATALOGUED. Recorded as `P0-SCIENCE-09`.
   * ───────────────────────────────────────────────────────────────────────── */

  // /account — five surfaces, none of them previously guarded.
  ["components/account/day8-challenge-card.tsx",
   "live or living foods as a product category", "Live Foods"],
  ["components/account/goal-progress-card.tsx",
   "live or living foods as a product category", "Live Foods"],
  ["components/account/welcome-screen.tsx",
   "live or living foods as a product category", "live foods"],
  ["components/account/welcome-screen.tsx",
   "foods classified as prebiotic-rich", "prebiotic-rich"],
  ["components/account/seven-day-guide.tsx",
   "colonisation or reseeding claimed", "colonise"],
  ["components/account/dashboard-client-data.ts",
   "live cultures asserted of food", "live cultures"],

  // The Report family. Adjacent to `P0-SCIENCE-08`, which recorded mechanistic
  // claims in the food copy; these are the category-equivalence half.
  ["components/report/demo-report.tsx",
   "live cultures asserted of food", "Live Cultures"],
  ["lib/fallback-paid-report.ts",
   "live or living foods as a product category", "live food"],
  ["lib/report/addon-lens.ts",
   "live or living foods as a product category", "Live foods"],

  // Second and third rules tripped by the same files. A file is inventoried
  // per (file, RULE), not per file, so each one is deleted by the repair that
  // removes that specific claim rather than by a blanket exemption.
  ["components/account/goal-progress-card.tsx",
   "live cultures asserted of food", "live cultures"],
  ["lib/report/addon-lens.ts",
   "live cultures asserted of food", "Live-culture"],
  ["lib/fallback-paid-report.ts",
   "live foods named as a category beside fermented ones", "live or fermented food"],
] as const

/** Pinned so the list cannot grow. It moves DOWN only, with the repair. */
const ENTRIES_AT_0R1_OPEN = 17

function isExposedAt0R1(file: string, rule: string): boolean {
  return EXPOSED_AT_0R1.some(([f, r]) => f === file && r === rule)
}

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
  /*
   * ── FOUR PINS ADDED AFTER SABOTAGE SLIPPED ───────────────────────────────
   *
   * Cases 1080, 1081, 1084 and 1089 all walked through the prose rules for one
   * reason: the Biotic name is never in the source. It is a prop name, a
   * numeric literal beside an interpolated label, an object key, or
   * `{result.weakest}`. A rule that reads sentences cannot see any of them.
   *
   * Per-file pins are the right instrument for exactly this — the same reason
   * this table already exists for the reveal, the free result and the OG
   * route — because the invariant is about a FILE's wiring, not about English.
   */
  [
    "components/agent-loop/BioticsProgressPanel.tsx",
    "the biotics panel is educational: it takes no personal state, renders no number, no bar and no band word",
    [
      /*
       * The PROP, not the word. `/\bbiotics\b/` was the first attempt and it
       * flagged the panel's own `<h3>The three biotics</h3>` — the educational
       * heading the redesign exists to keep. The signature is what must stay
       * clean (case 1080).
       */
      /function BioticsProgressPanel\([^)]*biotics/,
      /biotics\s*\?\s*:/,
      // Nor render a figure, a percentage or a bar (case 1081).
      /\d{1,3}\s*\/\s*100/,
      /\bwidth:/,
      /\$\{[^}]*score[^}]*\}/,
      // Nor the per-Biotic band ladder's words.
      /\b(?:Thriving|Emerging|strongest|most room to grow)\b/,
    ],
  ],
  [
    "components/account/twin/share-twin.tsx",
    "the share PNG must not take the three sub-scores at all — a shared image is the one surface we cannot correct after the fact",
    [/\bbiotics\b/],
  ],
  [
    "lib/account/share-card.ts",
    "the card's data contract must not carry per-Biotic rows, so no caller can supply them",
    [/\bbiotics\b/],
  ],
  /*
   * ── TWO MORE PINS, ADDED AFTER CASES 1096 AND 1097 SLIPPED ───────────────
   *
   * 1096 reverted `/biotics`'s postbiotics card to "They reduce inflammation,
   * strengthen the gut lining, regulate immune response, and directly influence
   * how you feel" and NOTHING caught it. The hedged register — "associated
   * with", "may" — is used consistently across the product and enforced
   * nowhere, so it was a convention, not a rule.
   *
   * A general rule was considered and rejected. Whether an outcome claim needs
   * hedging depends on the claim: "Prebiotic fibre is what keeps that inner
   * ecosystem thriving" is fine, "postbiotics reduce inflammation" is not, and
   * the difference is epistemic rather than lexical. A regex that caught the
   * second would catch the first, and the cost of over-reach here is deleting
   * true education — the trap Tranche 2A hit with the brand lens and Gate 3.6
   * hit with "Postbiotics produced". So the four verbs are pinned to the one
   * file whose card made them, which is what this table is for.
   *
   * 1097 reverted the menu-scan prompt to "The member's weakest biotic is
   * ${weakest}". Also uncaught, for two compounding reasons: "biotic" singular
   * and lowercase is not in BIOTICS_ANY, and `${weakest}` is an interpolation,
   * so the Biotic name is nowhere in the source. A prompt is the worst place
   * for an invisible claim, because the model turns one sentence into many.
   */
  [
    "app/biotics/page.tsx",
    "the education page states mechanisms, not guaranteed outcomes — the register used everywhere else in the product (case 1096)",
    [
      /\bThey reduce inflammation\b/,
      /\bstrengthen the gut lining\b/,
      /\bregulate immune response\b/,
      /\bdirectly influence how you feel\b/,
      /\bwell-populated\b/,
      /\bmakes you feel better every day\b/,
    ],
  ],
  [
    "app/api/menu-scan/route.ts",
    "the prompt is given a food pattern, never the member's Biotic — neither the words nor the interpolated key (case 1097)",
    [
      /weakest biotic/i,
      /biotic they most need/i,
      /what it feeds/i,
      /\$\{weakest\}/,
    ],
  ],
  [
    "components/account/twin/meal-reveal.tsx",
    "the per-meal journey must not say a Biotic was produced — identical wording is correct on /biotics, which teaches the process, and wrong here, which narrates this plate (case 1088)",
    [/Postbiotics produced/, /Prebiotics feed your/],
  ],
  [
    "components/account/twin/menu-scan.tsx",
    "the menu pill must name the food pattern, never the raw Biotic key it was chosen from",
    [/\{\s*result\.weakest\s*\}/, /\{\s*p\.biotic\s*\}/],
  ],
  [
    "app/api/score-card/route.tsx",
    "the generated image must not read a sub-score from the query string; old links still carry them and are ignored",
    [/searchParams\.get\(\s*"(feed|seed|heal|prebiotics|probiotics|postbiotics)"/, /\bpScore\b/],
  ],

  /* ══ FOUR PINS ADDED AT 0R-5 ═══════════════════════════════════════════════
   *
   * ── WHY THESE ARE PINS AND NOT PROSE RULES ───────────────────────────────
   *
   * `P0-SCIENCE-01`'s surviving constructs render REAL member data. Nothing is
   * fabricated, which is precisely why 0R-4 could not close them and why the
   * prose rules cannot see them: the word "Prebiotic" is a `label` prop beside
   * a number that arrives from the database, and the band word is a lookup in
   * another module. This table exists for invariants about a FILE'S WIRING, and
   * these are four of those.
   *
   * ── A LIMITATION OF `EXPOSED_AT_0R1`, RECORDED RATHER THAN WORKED AROUND ──
   *
   * `isExposedAt0R1(file, rule)` suspends a rule for a whole FILE, and
   * `live-dashboard.tsx` now carries TWO distinct defects under the single rule
   * "a Biotic claimed as a person's own": `MOCK_MEALS`' fabricated insight
   * ("the kimchi lifts your probiotic score significantly" — 0R-9's) and the
   * Monthly Focus sentence ("your Probiotics are pulling down your Biotics
   * Score™" — 0R-5's). Repairing one cannot be PROVED through that ledger,
   * because the other keeps the rule matching.
   *
   * The inventory already carries an `example` per entry and does not consult
   * it. Scoping the suspension to the matched text — over `matchAll`, not the
   * first hit — is the strengthening this wants, and it is deliberately NOT
   * done here: it changes the ledger's semantics for all nineteen entries, and
   * 0R-5 is not the tranche for that. It is recorded in the register as an
   * instrument limitation with its fix, and the one sentence 0R-5 owns is
   * pinned below where the proof is unambiguous.
   */
  [
    "components/account/live-dashboard.tsx",
    "live /account must not render a personal per-Biotic bar, promise a per-Biotic breakdown, or carry the Monthly Focus mechanism — the values being REAL is what makes this a science finding rather than a trust one",
    [
      /*
       * The three live `ScoreBar` triples — `MealCard`, `FirstMealCelebration`
       * and the logger result. One rule covers all three because the construct
       * is identical and the label is the only thing in the source that names a
       * Biotic. The Meal Quality bars (`Diversity`, `Anti-inflammatory`) use
       * the same shared component and must keep passing.
       */
      /<ScoreBar\s+label="(?:Pre|Pro|Post)biotic"/,
      /*
       * …and the card must not be STRUCTURALLY capable of carrying them.
       *
       * THE SIGNATURE, NOT THE WORD — the `BioticsProgressPanel` lesson from
       * case 1080, and this pin repeated the mistake on its first run. Written
       * as `/biotics:\s*\{\s*prebiotic:\s*number/`, it flagged `MealEntry`,
       * which is `MOCK_MEALS`' OWN TYPE and is 0R-9's to delete with the
       * constant. The rule was narrowed rather than the scope widened — the
       * same correction 0R-4 made to its first `ScoreBar` rule.
       */
      /function MealCard\([^)]*biotics/,
      /^\s*biotics\?:/m,
      /\bmeal\.biotics\b/,
      // The first-use promise, at both of its sites.
      /Prebiotic, Probiotic, and Postbiotic value/,
      /Your Biotics score is built/,
      /Biotics score breakdown/,
      // `P0-SCIENCE-03`'s third site — the Monthly Focus card, every string of
      // which is a literal: `twin` and `displayBiotics` appear zero times in it.
      /pulling down/,
      /This month(?:&apos;|')s focus/,
      /fermented food gap/,
      /30 days changes this/,
    ],
  ],
  [
    "lib/account/meal-impact.ts",
    "the meal-impact producer may describe the meal; it must not describe the member's Biotic biology — no Biotic-named row, no score-derived band, no possessive mechanism, and no fermented-food-implies-probiotic-effect inference",
    [
      /*
       * The three score fields go from the INPUT CONTRACT, not merely from the
       * rows — the `sequence-email.ts` precedent two pins up: "a field it still
       * accepted would be an invitation to render it again".
       */
      /\b(?:pre|pro|post)biotic_score\b/,
      // The two Biotic-named rows.
      /Probiotic network/,
      /Postbiotic potential/,
      // The possessive mechanisms, including the one the 0R-2 ledger found.
      /your probiotic network/,
      /Prebiotic fibre flows down/,
      /postbiotic potential rises/,
      /postbiotic follow-through/,
      // Fermented food classified as a personal probiotic effect.
      /\bprobioticBoost\b/,
    ],
  ],
  [
    "lib/account/ritual.ts",
    "a self-reported tap may be recorded; it may not be given a body coordinate or a Biotic mechanism",
    [
      /\bnode\s*:\s*\{\s*x\s*:/,
      /lights up your probiotic network/,
      /\beffect\s*:/,
    ],
  ],
  /*
   * ── THE FIFTH SITE, FOUND BY 0R-5'S TRACE AND IN NO REGISTER ENTRY ───────
   *
   * `DailyLoopCard` rendered "Today's focus · Probiotics (23/100)" with a
   * Biotic-coloured dot, on live `/account`. `PillarKey` is
   * `"prebiotics" | "probiotics" | "postbiotics"`, so this was the weakest
   * Biotic named, scored and coloured — and `lib/habit.ts` existed for no other
   * purpose, so it is deleted (asserted in `agent-loop-claims.test.ts`).
   *
   * Pinned at the card AND at both producers, because the construct needs
   * three files to exist and removing any one of them alone leaves the rest
   * waiting.
   */
  [
    "components/account/daily-loop-card.tsx",
    "the daily loop card reports the streak; it must not name, score or colour a Biotic",
    [/\bfocus\b/, /\bPillarKey\b/, /t\.pillars\[/, /t\.pillarNudges\[/, /\/100\)/],
  ],
  [
    "app/account/page.tsx",
    "the live account page must not compute a weakest-Biotic nudge, nor hand the dashboard a per-Biotic profile",
    [/\bdailyNudge\b/, /\bfocusPillar\b/, /@\/lib\/habit/, /biotics=\{/],
  ],
  [
    "app/account/today/page.tsx",
    "the second producer of the same nudge — POST_V1-refused, and repaired with the live one so it cannot come back through the shared card",
    [/\bdailyNudge\b/, /\bfocusPillar\b/, /@\/lib\/habit/],
  ],
  [
    "components/account/twin/daily-ritual.tsx",
    "the ritual acknowledges what the member reported, never what their body did",
    [
      /Your body just felt that/i,
      /Your body reacts to each one/i,
      /felt all of it/i,
      /check\.node/,
    ],
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
      if (hit && isExposedAt0R1(file, why)) continue // known debt — see below
      expect(hit?.[0] ?? null, `${file} — ${why}: "${hit?.[0]}"`).toBeNull()
    }
  })

  /* ══ THE 0R-1 INVENTORY — THE RED LIST, HELD SO IT CANNOT GROW ════════════
   *
   * The 0R specification says to widen the corpus, let the suite go red, and
   * let the red list define the UI work. Committing a genuinely red suite would
   * leave CI red across every 0R commit and make a NEW regression
   * indistinguishable from known debt — so the red list is an ARTEFACT instead.
   *
   * Three assertions below make it load-bearing rather than an allowlist, and
   * the first is the one that matters: AN ENTRY IS ONLY ALLOWED TO EXIST WHILE
   * ITS DEFECT DOES. A row whose claim has been repaired FAILS, forcing its own
   * deletion. That is what stops a shrinking baseline becoming permanent.
   *
   * 0R's close criterion: this list is EMPTY and this constant is DELETED.
   */

  /**
   * Every rule family the widened corpus feeds. The inventory spans all of
   * them, because the widening exposed debt in three — and two of those were
   * CATEGORY-EQUIVALENCE claims the Experience 0 register never contained.
   */
  const ALL_CLAIM_RULES: [string, RegExp][] = [
    ...PERSONAL_BIOTIC_STATE,
    ...FERMENTED_LIVE_CLAIMS,
    ...FIBRE_PREBIOTIC_CLAIMS,
  ]

  it("0R-1: every inventory entry still describes a real claim", () => {
    for (const [file, why, example] of EXPOSED_AT_0R1) {
      const rule = ALL_CLAIM_RULES.find(([w]) => w === why)
      expect(rule, `${file} — no rule named "${why}"`).toBeDefined()
      const hit = renderedSource(file).match(rule![1])
      expect(
        hit?.[0] ?? null,
        `${file} — "${why}" no longer matches. The claim is GONE, so DELETE this ` +
          `inventory entry rather than leaving it. It recorded: "${example}"`,
      ).not.toBeNull()
    }
  })

  it("0R-1: the inventory may only shrink, and carries no headroom", () => {
    expect(
      EXPOSED_AT_0R1.length,
      "EXPOSED_AT_0R1 grew. A new prohibited claim on a guarded surface is a " +
        "REGRESSION, not debt to record — repair it instead of listing it.",
    ).toBeLessThanOrEqual(ENTRIES_AT_0R1_OPEN)

    /*
     * ── WHY THE CAP IS ALSO A FLOOR ─────────────────────────────────────────
     *
     * `<=` alone is a ratchet with a loose pawl. Once a repair takes the list
     * to 18 while the constant still reads 19, one NEW claim can be added back
     * and every assertion in this block passes — the shrinking-baseline failure
     * mode this inventory was built to avoid, reachable through the inventory
     * itself.
     *
     * Found by writing sabotage 1456, which raises the constant and slipped
     * against the `<=` form alone. So the constant must EQUAL the list: a
     * repair decrements both in the same commit, and buying room for a new
     * entry becomes a visible diff that fails here rather than a number nobody
     * reads.
     */
    expect(
      ENTRIES_AT_0R1_OPEN,
      `ENTRIES_AT_0R1_OPEN is ${ENTRIES_AT_0R1_OPEN} while the inventory holds ` +
        `${EXPOSED_AT_0R1.length}. The constant moves DOWN only, in the SAME ` +
        `commit as the repair that shortens the list — headroom above the list ` +
        `is room for a new claim to hide in.`,
    ).toBe(EXPOSED_AT_0R1.length)
  })

  it("0R-1: no guarded surface outside the inventory carries a claim", () => {
    const unexpected: string[] = []
    for (const file of GUARDED_SURFACES) {
      const src = renderedSource(file)
      for (const [why, pattern] of ALL_CLAIM_RULES) {
        if (src.match(pattern) && !isExposedAt0R1(file, why)) unexpected.push(`${file} — ${why}`)
      }
    }
    expect(unexpected, "a claim exists on a guarded surface and is not inventoried").toEqual([])
  })

  /*
   * ── GATE 3.6: THESE ARE NOT HYPOTHETICALS ────────────────────────────
   *
   * Every string below is a sentence the product was RENDERING when this was
   * written, reproduced as a customer received it. Seven came out of
   * `lib/agent-loop`, and four of those reached `/account`, which is V1_CORE.
   *
   * They are asserted as LITERALS rather than read back from the modules, and
   * that is the point: once the modules are corrected these sentences exist
   * nowhere else, so a case that read its subject from the fixed code would
   * prove only that the code is fixed — not that the rule catches the
   * regression. These strings ARE the regression.
   */
  it("NON-VACUITY: every sentence the agent loop was shipping is caught", () => {
    for (const line of [
      // lib/agent-loop/providers/deterministic.ts — rationale + why, live on /account
      "Prebiotics remains your strongest area.",
      "Postbiotics appears lower — a gentle place to focus next.",
      "Your Prebiotics look settled, while Postbiotics appear lower.",
      " Focusing on Postbiotics supports the area with the most room to grow.",
      // lib/agent-loop/baseline.ts — deriveGaps
      "Postbiotics appear lower than the others",
      // lib/agent-loop/account-twin.ts — the learning feed, live on /account
      "This fed your Prebiotics · meal score 72",
      // lib/account/patterns.ts — live on /account, numeric and longitudinal
      "Your Postbiotics slipped 8 points this week",
      "Your Prebiotics climbed 8 points this week",
      "Your best meals lean on Prebiotics",
      // components/account/twin/menu-scan.tsx
      "The miso brings live cultures — exactly what your probiotic side needs.",
      // lib/email/meal-analysis-email.ts — exposed by widening these rules
      "produces your Biotics Score™ — your Prebiotics, Probiotics and Postbiotics",
    ]) {
      expect(
        PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(line)),
        `not caught: ${line}`,
      ).toBe(true)
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

  /*
   * ── THE HALF THAT STOPS THIS BEING A DELETION ────────────────────────
   *
   * The possessive rule is the aggressive one, and an over-broad version of it
   * would delete the Three Biotics from the product while reporting success.
   * The two science-contract lines are here for the same reason
   * `lib/consultation/science-contract.ts` is a named permanent exception
   * elsewhere in this file: the module that PROHIBITS a claim has to be
   * allowed to state the claim it prohibits.
   *
   * Note what this list proves about the rule design. `is` and `are` are
   * absent from the state-verb rule precisely so the educational lines pass;
   * adding them back is the obvious "improvement" that would break education.
   */
  it("NON-VACUITY: educational and science-contract phrasing is NOT caught", () => {
    for (const line of [
      "Prebiotics are the fibres your gut bacteria use.",
      "Postbiotics — Rejuvenate",
      "Three simple actions inspired by the science of Prebiotics, Probiotics, and Postbiotics",
      "Postbiotics — what your food system gives back. We teach it; we don't score it.",
      "no personal Postbiotics state may be inferred from self-report",
      "Probiotics are live microorganisms that, when administered in adequate amounts, confer a health benefit.",
      "Feed · Seed · Rejuvenate are actions, never score names.",
      "Foods transformed by fermentation are not automatically Probiotics.",
      "An Assessment that produces your Biotics Score™ — built on Prebiotics, Probiotics and Postbiotics.",
    ]) {
      expect(
        PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(line)),
        `false positive: ${line}`,
      ).toBe(false)
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
/*
 * ══ WHY THIS IS (file, RULE) AND NOT (file) ═════════════════════════════════
 *
 * It was a file list until 0R-2, and the sabotage harness proved that wrong.
 *
 * 0R-2 added three files to this ledger because `PERSONAL_BIOTIC_STATE` had
 * just started running here. A file-level allowance granted each of them an
 * allowance for ALL THREE rule families at once — so two sabotage cases that
 * had been caught for their whole life began to slip:
 *
 *   s7b 1007  a colonisation claim re-added to `lib/account/meal-impact.ts`
 *   s7b 1011  "live foods" as a category re-added to `lib/assessment-scoring.ts`
 *
 * Both files were ledgered for a PERSONAL BIOTIC claim and neither had ever
 * been allowed a fermented-category one. Nothing in the suite noticed, because
 * the allowance was keyed on the filename.
 *
 * This is the same lesson `EXPOSED_AT_0R1` already encodes one screen up —
 * inventory per (file, RULE), never per file — and the ledger did not have it.
 * Recording it here rather than in a commit message, because the next person
 * to add a file to a green-making list needs to read this.
 */
const KNOWN_UNCORRECTED: readonly [file: string, rule: string][] = [
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
  ["lib/assessment-data.ts", "foods classified as prebiotic-rich"],
  ["lib/assessment-data.ts", "live cultures asserted of food"],
  ["lib/assessment-data.ts", "live foods named as a category beside fermented ones"],
  ["lib/assessment-data.ts", "live or living foods as a product category"],


  /*
   * Not debt. This is the module that PROHIBITS the claim the rule matches —
   * it lists "reseeding" among the inferences the contract forbids. A guard
   * that flagged its own contract would be asking us to delete the
   * prohibition. Permanent, justified exception.
   */
  ["lib/consultation/science-contract.ts", "a Biotic described as high or low for a person"],
  ["lib/consultation/science-contract.ts", "colonisation or reseeding claimed"],

  /* ── FOUND BY 0R-2, WHEN THE LEDGER STARTED RUNNING ALL THREE RULE SETS ───
   *
   * Three reachable files carrying a personal Biotic claim, in no corpus, and
   * invisible to this ledger until `PERSONAL_BIOTIC_STATE` was added to it.
   * Each is deleted by the 0R stage that repairs it — the test below refuses a
   * stale entry, so none can outlive its defect.
   *
   * ── TWO OF THE THREE ARE CLOSED AT 0R-5, AND THE LEDGER EARNED ITS KEEP ──
   *
   * Both entries read "a Biotic claimed as a person's own" for the one sentence
   * `lib/account/meal-impact.ts` and `lib/account/ritual.ts` shared:
   * "A fermented food lights up your probiotic network".
   *
   * Tracing those two entries is what found `P0-SCIENCE-05` to be far broader
   * than the sentence the register named — `meal-impact.ts` also produced a
   * Biotic-named ROW, a BAND WORD from `input.probiotic_score`, and a
   * fermented-food-implies-probiotic inference, all live on `/account`. The
   * entries are removed because the defects are; the rule is now pinned
   * per-file in `NO_PERSONAL_BIOTIC_NUMBER` so neither can return quietly.
   *
   * `lib/assessment-scoring.ts` below remains, and is 0R-7's.
   */

  /*
   * THE ONE THAT IS GENUINELY NEW.
   *
   * `lib/assessment-scoring.ts:152` — "Your answers suggest care around food,
   * reflected in your Prebiotics and Probiotics scores…". A personal per-Biotic
   * claim inside the FREE ASSESSMENT'S SCORING ENGINE, reachable from
   * `/assessment/results`, which is `V1_CORE`.
   *
   * Not in the Experience 0 register, not in `ASSESSMENT_SURFACES`, and not in
   * any tranche. The audit read the result COMPONENTS and never the module that
   * computes what they render — the identical mistake Gate 3.6 recorded as
   * "the guard read the importer and not the imported module", and the reason
   * D7 asked for derivation rather than another list. 0R-7.
   */
  ["lib/assessment-scoring.ts", "a Biotic claimed as a person's own"],
]

describe("no reachable surface carries a claim outside the ledger", () => {
  /*
   * ══ 0R-2 — THE D7 MECHANISM, AND WHY IT IS ONE LINE ═══════════════════════
   *
   * D7 asks for a canonical coverage mechanism so that a claims surface cannot
   * exist outside the corpus because somebody forgot a path. Reaching for a new
   * instrument would have been the wrong move: THIS LEDGER ALREADY IS THAT
   * MECHANISM. It derives the reachable closure from the route classifier,
   * subtracts what is guarded, and reports the remainder.
   *
   * Its gap was not the derivation. It was the RULE SET it ran:
   *
   *     const ALL_RULES = [...FERMENTED_LIVE_CLAIMS, ...FIBRE_PREBIOTIC_CLAIMS]
   *
   * `PERSONAL_BIOTIC_STATE` — the nine rules that carry the permanent product
   * rule, the ones Gate 3.6 widened and `P0-SCIENCE-01/02/03/06/07` all answer
   * to — was never in it. So the derivation that was supposed to catch a
   * forgotten surface was running two thirds of the rules, and a personal
   * Biotic claim on an unguarded reachable file was invisible to the one
   * instrument built to find exactly that.
   *
   * That is the third form of the same failure Experience 0 recorded three
   * times: Account outside the scan, Assessment outside the scan, Report
   * outside the scan — and now the derived safety net outside a third of the
   * rules.
   *
   * Adding it is the fix. Keeping it is the mechanism.
   */
  const ALL_RULES = [
    ...FERMENTED_LIVE_CLAIMS,
    ...FIBRE_PREBIOTIC_CLAIMS,
    ...PERSONAL_BIOTIC_STATE,
  ]

  /**
   * Every (reachable, unguarded file) × (rule it trips) — one FINDING per row,
   * not one row per file. See the note above `KNOWN_UNCORRECTED` for the two
   * sabotage cases that proved the difference is load-bearing.
   */
  function unguardedClaimFindings(): string[] {
    const guarded = new Set([...GUARDED_SURFACES, EN_DICTIONARY])
    const found: string[] = []
    for (const file of reachableSourceFiles()) {
      if (guarded.has(file)) continue
      const src = renderedSource(file)
      for (const [why, pattern] of ALL_RULES) {
        if (pattern.test(src)) found.push(`${file} — ${why}`)
      }
    }
    return found.sort()
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
    expect(unguardedClaimFindings()).toEqual(
      KNOWN_UNCORRECTED.map(([f, w]) => `${f} — ${w}`).sort(),
    )
  })

  it("the ledger has no entry that is already clean", () => {
    /*
     * The other direction, and the one that makes the ledger shrink honestly:
     * a file corrected in a later tranche must be REMOVED from this list, not
     * left behind as a stale allowance. Leaving it would quietly re-open the
     * hole for that path.
     */
    const stale = KNOWN_UNCORRECTED.filter(([file, why]) => {
      const rule = ALL_RULES.find(([w]) => w === why)
      // A rule name that no longer exists is also stale, and louder: the
      // allowance now names nothing, so it allows everything on that file.
      return !rule || !rule[1].test(renderedSource(file))
    }).map(([f, w]) => `${f} — ${w}`)
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
