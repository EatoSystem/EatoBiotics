import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { buildBaseline } from "@/lib/agent-loop/baseline"
import {
  createAgentLoopSession,
  makeObservation,
  runLoop,
  generateLoopSummary,
} from "@/lib/agent-loop"
import { deterministicProvider } from "@/lib/agent-loop/providers/deterministic"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import { buildPrompts } from "@/components/account/twin/ask-twin"
import { detectPatterns } from "@/lib/account/patterns"
import { buildInsideYouChapters } from "@/lib/account/inside-you"
import { buildWeekStory } from "@/lib/account/week-story"
import { systemMapState } from "@/lib/account/system-map"
import { loopBehaviour, mealBehaviour, behaviourFor } from "@/lib/agent-loop/behaviour"
import { BIOTIC_LABELS } from "@/lib/agent-loop/biotics"
import { pillarBehaviour } from "@/lib/pillars"
import { buildSequenceEmail } from "@/lib/email/sequence-email"
import {
  DEFAULT_PROFILE_INFO,
  PROFILE_INFO,
  getProfileInfo,
} from "@/components/account/dashboard-client-data"
import type { BioticKey, BioticsSource } from "@/lib/agent-loop/types"

/* ════════════════════════════════════════════════════════════════════════════
   GATE 3.6 — the guard that reads the SENTENCES, not the source.

   ══ WHY THIS FILE EXISTS, AND WHY THE CORPUS ALONE WAS NOT ENOUGH ══════════

   `tests/unit/biotic-claims.test.ts` now reads all 22 agent-loop and account
   files, which it never did before. That was necessary and it is nowhere near
   sufficient, and the number says why:

     a SOURCE scan of those 22 files caught 1 of the 9 known claims.

   The one it caught — `menu-scan.tsx` — was the only one written as a literal.
   Every other claim was assembled at runtime:

     `${BIOTIC_LABELS[strongest]} remains your strongest area.`
     `This fed your ${BIOTIC_NAME[tb]} · meal score ${m.score}`
     `Your ${BIOTIC_LABEL[bestKey]} slipped ${rounded} points this week`

   No regex over the source can see those, because the words "Prebiotics" and
   "Postbiotics" are not in the source. They are in a lookup table two modules
   away. This is the defect class this engagement has now hit eight times, and
   `biotic-claims.test.ts` already documents it for
   `three-biotics-result.tsx` ("renders `{insight.label}` from data, so the
   words never appear in its source") and for sabotage cases 947/948, which
   composed a prohibited equation out of data bindings and walked straight
   through a source guard.

   ══ SO THIS FILE CALLS THE FUNCTIONS ═══════════════════════════════════════

   Every generator here is pure, so it can simply be RUN and its output read.
   That makes the assertion the real invariant — "no sentence this product
   generates asserts a personal Biotic state" — rather than a proxy for it.

   It is non-vacuous by construction: before the Gate 3.6 corrections every one
   of these assertions failed, and `PRE_FIX` below keeps the exact strings so
   that stays checkable after the code no longer contains them.
   ════════════════════════════════════════════════════════════════════════════ */

const BIOTICS = "(?:Prebiotics|Probiotics|Postbiotics)"
const BIOTICS_ANY = "(?:Prebiotics|Probiotics|Postbiotics|prebiotics?|probiotics?|postbiotics?)"

/**
 * The rules, over GENERATED output.
 *
 * Deliberately a superset of `PERSONAL_BIOTIC_STATE`: a generated sentence has
 * no educational register to protect, so this may be stricter than the source
 * rule. **Any** mention of a Biotic in a generated personal sentence is
 * refused, because none of these functions has a reason to name one — they
 * describe what somebody's food looked like.
 */
const GENERATED_CLAIM_RULES: [string, RegExp][] = [
  ["names a Biotic at all", new RegExp(String.raw`\b${BIOTICS_ANY}\b`)],
  ["a Biotic given a number", new RegExp(String.raw`\b${BIOTICS}\b[^.!?\n]{0,40}\d`)],
  [
    "a comparative verdict on a Biotic",
    new RegExp(
      String.raw`\b${BIOTICS}\b[^.!?\n]{0,40}\b(?:strongest|weakest|lower|higher|climbed|slipped|settled)\b`,
    ),
  ],
  [
    "a feeding or production mechanism",
    new RegExp(
      String.raw`\b(?:fed|feeds|feeding|boost\w*|replenish\w*)\b[^.!?\n]{0,25}\b(?:your|my)\s+${BIOTICS_ANY}\b|\bproducers\b|\b${BIOTICS}\s+produced\b`,
    ),
  ],
  ["a live-organism claim", /\blive[- ]cultures?\b|\badd live microbes\b/i],

  /* ══ GATE 5 — CAUSATION, THE FIFTH PRODUCT RULE ════════════════════════════
   *
   *   Compare measurements. Describe observations. Record actions.
   *   DO NOT INVENT CAUSATION.
   *
   * ── Why this rule lives HERE and not in a per-file pin ──────────────────
   *
   * Because this file CALLS the generators. `detectPatterns` is already
   * invoked below and its output already runs through these rules — so the
   * rule that refuses a causal claim reads what a customer would actually be
   * shown, rather than the source that assembles it. That distinction is the
   * whole reason this file exists: a source scan of the 22-file corpus caught
   * 1 of 9 interpolated Biotic claims in Gate 3.6.
   *
   * ── What it refuses, in three shapes ────────────────────────────────────
   *
   *   ASSERTED CAUSE        "whatever changed, it's working" · "because you
   *                         added…" · "thanks to" · "led to" · "that's why"
   *   PREDICTED OUTCOME     "one weekend swap WOULD CLOSE most of the gap" —
   *                         an action with a result attached to it
   *   ASSERTED EFFICACY     "a proven winner" · "what actually works for you"
   *
   * All three were live on `/account` when Gate 5 opened, in
   * `lib/account/patterns.ts`, reaching the dashboard, `/account/this-week`
   * and the weekly email.
   *
   * ── What it deliberately permits ────────────────────────────────────────
   *
   * A SUGGESTION. "A weekend meal built like a weekday one is the smallest
   * thing to try" names an action and promises nothing, which is what the
   * action layer has always been allowed to do. The rule targets a RESULT
   * attached to an action, not the action.
   *
   * Also permitted: "because" in a non-causal sense ("you receive this because
   * you're a member"), which is why the cause shapes are anchored to a
   * person's own doing rather than to the connective alone. The first draft of
   * this rule, run as an audit, flagged three unsubscribe footers.
   *
   * Gate 5 step 4 widens this to a `CAUSAL_CLAIMS` rule across the full
   * customer-surface corpus. This is the seeded version, so step 0's repair
   * cannot regress before step 4 arrives.
   */
  [
    "an asserted cause",
    /\bit'?s working\b|\bthey'?re working\b|\bthanks to\b|\bled to\b|\bresulted in\b|\bpaying off\b|\bthat'?s why\b|\bbecause you (?:ate|added|logged|chose|swapped|started|kept)\b/i,
  ],
  [
    "a predicted outcome attached to an action",
    /\bwould (?:close|bring|fix|raise|lift|boost|improve|love|help)\b|\bwill (?:close|bring|fix|raise|lift|boost|improve|help)\b/i,
  ],
  ["an asserted efficacy", /\bproven\b|\bwhat actually works\b|\bworking for you\b/i],
]

/*
 * ── WHY THIS HELPER REFUSES AN EMPTY ARGUMENT ────────────────────────────────
 *
 * Added after sabotage case 1093 SLIPPED. The mutation was:
 *
 *   assertClean("analysis.rationale", [turn.analysis!.rationale])
 *   → assertClean("analysis.rationale", [])
 *
 * It went green, because a loop over nothing asserts nothing. That is the
 * self-referential weakness of every test that guards generated output: the
 * cheapest way to silence it is to stop handing it the output, and a reviewer
 * skimming a diff sees a test still being called.
 *
 * So the helper will not be called vacuously. Given nothing to inspect it
 * fails and says which call site stopped supplying its subject — which makes
 * "the guard still runs" and "the guard still looks at anything" the same
 * assertion rather than two, the second of which nobody was making.
 *
 * `allowEmpty` exists for the one legitimate case: a generator that genuinely
 * produced no strings for a fixture. It has to be passed deliberately, so the
 * mutation above cannot be reproduced by accident.
 */
function assertClean(
  label: string,
  strings: readonly (string | null | undefined)[],
  allowEmpty = false,
) {
  const present = strings.filter((s): s is string => Boolean(s && s.trim()))
  if (!allowEmpty) {
    expect(
      present.length,
      `${label} — nothing was passed to assertClean, so it asserted nothing`,
    ).toBeGreaterThan(0)
  }
  for (const s of present) {
    for (const [why, rule] of GENERATED_CLAIM_RULES) {
      const hit = s.match(rule)
      expect(hit?.[0] ?? null, `${label} — ${why}: ${JSON.stringify(s)}`).toBeNull()
    }
  }
}

/* ── fixtures ──────────────────────────────────────────────────────────────── */

const SCORES: Record<string, number>[] = [
  { prebiotics: 80, probiotics: 30, postbiotics: 50 },
  { prebiotics: 30, probiotics: 80, postbiotics: 50 },
  { prebiotics: 50, probiotics: 30, postbiotics: 80 },
  { prebiotics: 80, probiotics: 50, postbiotics: 30 },
  { prebiotics: 30, probiotics: 50, postbiotics: 80 },
  { prebiotics: 50, probiotics: 80, postbiotics: 30 },
  // every sub-score under the gap threshold, so all three gap sentences fire
  { prebiotics: 20, probiotics: 20, postbiotics: 20 },
]

const SOURCES: BioticsSource[] = ["meals", "assessment"]

function baselineFor(biotics: Record<string, number>, bioticsSource: BioticsSource) {
  return buildBaseline({
    foundationKey: "you",
    score: 62,
    scoreLabel: "Emerging Balance",
    biotics: {
      prebiotics: biotics.prebiotics,
      probiotics: biotics.probiotics,
      postbiotics: biotics.postbiotics,
    },
    bioticsSource,
    strengths: [],
    priorities: [],
  })
}

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

function mealsFixture(lead: "prebiotic" | "probiotic" | "postbiotic", rising: boolean) {
  const hi = { prebiotic: 20, probiotic: 20, postbiotic: 20, [lead]: 80 }
  const lo = { prebiotic: 20, probiotic: 20, postbiotic: 20, [lead]: 40 }
  return [
    ...[1, 2, 3].map((i) => ({ name: `Recent ${i}`, score: 78, createdAt: day(i), ...(rising ? hi : lo) })),
    ...[8, 9, 10].map((i) => ({ name: `Prior ${i}`, score: 60, createdAt: day(i), ...(rising ? lo : hi) })),
  ] as AccountTwinInput["meals"]
}

/* ── 1 · the provider ─────────────────────────────────────────────────────── */

describe("the deterministic provider generates no personal Biotic state", () => {
  /*
   * All six strongest/weakest permutations × both sources. The permutations
   * matter because the sentences interpolate `strongest` and `weakest`
   * separately — a fixture that only ever makes Prebiotics strongest tests one
   * branch of a lookup and reports it as three.
   */
  for (const source of SOURCES) {
    for (const [i, biotics] of SCORES.entries()) {
      it(`analyse + recommend are clean — ${source}, fixture ${i}`, async () => {
        const baseline = baselineFor(biotics, source)
        const session = createAgentLoopSession(baseline, "foundation")
        const out = await runLoop(
          session,
          makeObservation("meal_description", "oat porridge", { score: 71 }),
          deterministicProvider,
        )
        const turn = out.session.turns[out.session.turns.length - 1]

        assertClean("analysis.changes", turn.analysis!.changes)
        // `trends` is empty on a first observation, by design.
        assertClean("analysis.trends", turn.analysis!.trends, true)
        assertClean("analysis.improving", turn.analysis!.improving)
        assertClean("analysis.needsAttention", turn.analysis!.needsAttention)
        assertClean("analysis.rationale", [turn.analysis!.rationale])
        assertClean("recommendation.action", [turn.recommendation!.action])
        assertClean("recommendation.why", [turn.recommendation!.why])
        assertClean("recommendation.disclaimer", [turn.recommendation!.disclaimer])
        assertClean("generateLoopSummary", [generateLoopSummary(out.session)])

        // The sentence must still say something: a clean empty string passes
        // every rule above and is a worse product than the claim was.
        expect(turn.analysis!.rationale.length).toBeGreaterThan(60)
        expect(turn.recommendation!.why.length).toBeGreaterThan(60)
      })
    }
  }

  it("the rationale attributes the finding to the right input", async () => {
    /*
     * The provider is called with meal-averaged sub-scores on /account and with
     * assessment answers on the foundation path. Saying "your answers" for the
     * first is a false claim about where a finding came from — small, and
     * exactly the kind this gate removes.
     */
    for (const source of SOURCES) {
      const session = createAgentLoopSession(baselineFor(SCORES[0], source), "foundation")
      const out = await runLoop(
        session,
        makeObservation("meal_description", "oats", { score: 70 }),
        deterministicProvider,
      )
      const rationale = out.session.turns.at(-1)!.analysis!.rationale
      if (source === "meals") {
        expect(rationale).toContain("Your recent meals")
        expect(rationale).not.toContain("Your answers")
      } else {
        expect(rationale).toContain("Your answers")
        expect(rationale).not.toContain("Your recent meals")
      }
    }
  })
})

/* ── 2 · the baseline's gap sentences ─────────────────────────────────────── */

describe("deriveGaps names a food pattern", () => {
  for (const source of SOURCES) {
    it(`every gap sentence is clean — ${source}`, () => {
      // All three below the threshold, so all three sentences are produced.
      const base = baselineFor({ prebiotics: 10, probiotics: 10, postbiotics: 10 }, source)
      expect(base.gaps.length).toBe(3)
      assertClean("baseline.gaps", base.gaps)
      // The fixture supplies no strengths; the gaps are the subject here.
      assertClean("baseline.strengths", base.strengths, true)
    })
  }
})

/* ── 3 · the /account learning feed, end to end ───────────────────────────── */

describe("the /account learning feed is clean, as a member receives it", () => {
  /*
   * This is the assertion that matters most, because it is the only one that
   * covers `lib/account/patterns.ts` the way a customer meets it — through
   * `buildAccountTwin`, which is what `app/account/page.tsx` calls.
   */
  for (const lead of ["prebiotic", "probiotic", "postbiotic"] as const) {
    for (const rising of [true, false]) {
      it(`feed + nextBestAction are clean — ${lead}, ${rising ? "rising" : "falling"}`, async () => {
        const meals = mealsFixture(lead, rising)
        const { twin, feed } = await buildAccountTwin({
          score: 62,
          previousScore: 58,
          profileType: "Emerging Balance",
          meals,
          streak: 3,
          biotics: { prebiotic: 30, probiotic: 12, postbiotic: 36 },
        })

        expect(feed.length).toBeGreaterThan(2)
        for (const e of feed) {
          assertClean(`feed[${e.id}].title`, [e.title])
          assertClean(`feed[${e.id}].detail`, [e.detail])
        }

        assertClean("nextBestAction.action", [twin.nextBestAction?.action])
        assertClean("nextBestAction.why", [twin.nextBestAction?.why])
        for (const t of twin.trends) assertClean(`trend ${t.label}`, [t.label, t.detail])
      })
    }
  }
})

/* ── 3b · AskTwin's suggested questions, 0R-3 ─────────────────────────────── */

describe("the /account AI suggestions carry no personal Biotic state", () => {
  /*
   * ══ 0R-3 · P0-TRUST-05 — WHY THIS IS HERE AND NOT IN A CORPUS LIST ════════
   *
   * `components/account/twin/ask-twin.tsx` built its first suggested question
   * as
   *
   *     `Why is my ${BIOTIC_NAME[twin.biotics.weakest]} level my weakest, …`
   *
   * which rendered on the LIVE `/account` dashboard as a personal per-Biotic
   * verdict in the MEMBER'S OWN VOICE — and put no Biotic word anywhere in the
   * file.
   *
   * Two documented failure modes at once, which is why nothing caught it:
   *
   *   • the file was in NO claims corpus, so 0R-1's 33-file widening missed it;
   *   • the claim is INTERPOLATED, so a string scan would have missed it even
   *     inside the corpus — the `${BIOTIC_LABELS[k]}` problem CLAUDE.md records
   *     as "a source scan of the whole corpus catches 1 of 9 interpolated
   *     claims".
   *
   * So this guard CALLS the generator over every `weakest` value and reads what
   * a member would actually be offered. A corpus entry could not have caught
   * this. This can, and it is what fails if a future edit reconnects
   * `biotics.weakest` — or any personal Biotic ranking — to suggestion
   * generation.
   */
  for (const weakest of ["prebiotic", "probiotic", "postbiotic"] as const) {
    it(`buildPrompts is clean when ${weakest} is the lowest Biotic`, async () => {
      const { twin } = await buildAccountTwin({
        score: 62,
        previousScore: 58,
        profileType: "Emerging Balance",
        meals: mealsFixture("prebiotic", true),
        streak: 3,
        biotics: { prebiotic: 60, probiotic: 60, postbiotic: 60, [weakest]: 10 },
      })

      /*
       * NON-VACUITY, first direction: the fixture must actually move the
       * weakest Biotic, or this loop would assert the same twin three times and
       * two thirds of the coverage would be imaginary.
       */
      expect(
        twin.biotics.weakest,
        `the fixture did not make ${weakest} the weakest Biotic`,
      ).toBe(`${weakest}s`)

      const prompts = buildPrompts(twin)

      /*
       * NON-VACUITY, second direction: a generator returning nothing would pass
       * every rule below. `assertClean` refuses an empty argument for the same
       * reason; this says it at the call site too, because `buildPrompts`
       * slices to three and a future edit could slice to zero.
       */
      expect(
        prompts.length,
        "buildPrompts returned no suggestions — the guard would assert nothing",
      ).toBeGreaterThan(0)

      assertClean(`AskTwin suggestions (${weakest} lowest)`, prompts)
    })
  }
})

/* ── 4 · detectPatterns, through BOTH trend branches ──────────────────────── */

describe("detectPatterns is clean on every branch it can take", () => {
  /*
   * `fortnightTrend` has an up branch and a down branch with separate strings.
   * A fixture that only reaches one tests half the code and reports it as all
   * of it, so both are forced.
   */
  for (const lead of ["prebiotic", "probiotic", "postbiotic"] as const) {
    for (const rising of [true, false]) {
      it(`${lead} ${rising ? "up" : "down"}`, () => {
        const found = detectPatterns(mealsFixture(lead, rising))
        for (const p of found) assertClean(`pattern ${p.id}`, [p.title, p.detail])
      })
    }
  }

  it("the trend branches are genuinely both exercised by these fixtures", () => {
    const ids = [
      ...detectPatterns(mealsFixture("prebiotic", true)).map((p) => p.id),
      ...detectPatterns(mealsFixture("prebiotic", false)).map((p) => p.id),
    ]
    /*
     * ── THIS ASSERTION'S ANCHOR WAS LEGITIMATELY INVALIDATED, AND INVERTED ──
     *
     * It asserted both trend branches were reached. Gate 5 step 2c routed
     * `fortnightTrend` through `canCompare` and the verdict is a PERMANENT
     * refusal: no rubric version is recorded on an `analyses` row, and the
     * scoring model is an env var, so which instrument produced a stored meal
     * score cannot be established. That is `legacy-unversioned` by definition.
     *
     * So the branches are now unreachable BY DESIGN, and the honest assertion
     * is the opposite one. Inverted rather than deleted: a silent removal here
     * would also pass if somebody re-enabled the claim.
     */
    expect(ids.some((id) => id.startsWith("trend-up")), "the trend claim is live again").toBe(false)
    expect(
      ids.some((id) => id.startsWith("trend-down")),
      "the trend claim is live again",
    ).toBe(false)
  })

  /*
   * ── AND THE SUPPRESSION IS CAUSED BY THE VERDICT, NOT BY DELETED CODE ────
   *
   * The inversion above would pass equally if `fortnightTrend` had simply been
   * deleted, or if its thresholds had been set unreachably high. Neither would
   * be the repair this step specified, and both would leave the next person
   * believing a comparability gate exists where none does.
   */
  it("the trend is suppressed BY `canCompare`, with a stated reason", async () => {
    const { mealWindowProvenance } = await import("@/lib/account/patterns")
    const { canCompare } = await import("@/lib/fss/engine/compare")

    const verdict = canCompare(mealWindowProvenance([]), mealWindowProvenance([]))
    expect(verdict.comparable).toBe(false)
    if (!verdict.comparable) {
      // The honest reason: we cannot say which instrument scored these meals.
      expect(verdict.because).toBe("legacy-unversioned")
    }

    // And the call really is in the module, ahead of the arithmetic.
    const src = readFileSync("lib/account/patterns.ts", "utf8")
    expect(src).toMatch(/if \(!canCompare\(mealWindowProvenance\(prior\), mealWindowProvenance\(recent\)\)\.comparable\)/)
  })

  /*
   * ── THE DORMANT SENTENCES STAY COVERED ──────────────────────────────────
   *
   * The two trend sentences are still in the module, behind the gate, with a
   * documented revival path (a rubric version on the row). A generator that
   * nothing reads is exactly where an unreviewed claim survives — Gate 3.7
   * found the menu-scan prompt that way.
   *
   * So they are read FROM SOURCE and run through the same rules, rather than
   * copied into this file where they could drift from what would actually
   * ship if the gate reopened.
   */
  /*
   * ── THE GATED GENERATOR IS CALLED, NOT SCANNED ──────────────────────────
   *
   * A source scan was tried first and could not do the job. Sabotage 1078
   * restores the worst claim Gate 3.6 found — "Your Prebiotics climbed N
   * points this week" — by interpolating `${bestKey}`, so the Biotic words
   * appear NOWHERE in the file. Exactly the finding that made this suite
   * exist: a corpus scan caught 1 of 9 interpolated claims.
   *
   * So `dormantFortnightTrend` is exported past its own gate and CALLED here.
   * The sentences a person would read if the gate ever reopened are read by
   * the guard today, which is the only arrangement that survives
   * interpolation.
   */
  it("the gated trend sentences are still claim-clean, read by calling them", async () => {
    const { dormantFortnightTrend } = await import("@/lib/account/patterns")

    const seen: string[] = []
    for (const [lead, rising] of [
      ["prebiotic", true],
      ["probiotic", false],
      ["postbiotic", true],
    ] as const) {
      const p = dormantFortnightTrend(mealsFixture(lead, rising), Date.now())
      expect(p, `the gated generator produced nothing for ${lead}/${rising}`).toBeTruthy()
      if (!p) continue
      seen.push(p.title, p.detail)
      assertClean(`gated trend ${p.id}`, [p.title, p.detail])
      expect(
        `${p.title} ${p.detail}`.match(/\b(Pre|Pro|Post)biotics?\b/i)?.[0] ?? null,
        `a gated trend sentence names a Biotic: ${JSON.stringify(p.title)}`,
      ).toBeNull()
    }

    // Both branches, and non-vacuity on what was actually read.
    expect(seen.length).toBeGreaterThanOrEqual(6)

    // And it stays OUT of the product: only this suite may import it.
    const importers = execSync(
      "git grep -l 'dormantFortnightTrend' -- app components lib tests || true",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      .sort()
    expect(importers, "the gated generator escaped into the product").toEqual([
      "lib/account/patterns.ts",
      "tests/unit/agent-loop-claims.test.ts",
    ])
  })

  /* ══ GATE 5 — THREE OF FIVE GENERATORS HAD NEVER BEEN READ ════════════════
   *
   * The assertion above forces both branches of ONE generator and was taken as
   * covering the module. It did not. Running the fixtures and printing the ids
   * they produce gives:
   *
   *     reached      trend-up-* · trend-down-* · best-lean-*
   *     NEVER        weekend-dip · weekend-lift · repeat-winner · rhythm
   *
   * So `weekendGap`, `repeatWinner` and `weeklyRhythm` — three live generators
   * on `/account` — had never had a single sentence read by this guard. Two of
   * the six causal claims Gate 5 removed lived in them, which is exactly why
   * they survived a file this thorough.
   *
   * It is the recurring defect: A CHECK EXERCISED ONLY BY DATA THAT SATISFIES
   * IT. The fixture decided what the guard could see, and nothing asserted the
   * fixture was enough.
   *
   * ── The repair, which is the generalisation of the line above ───────────
   *
   * Fixtures that reach every generator, plus an assertion that the set of ids
   * reached EQUALS the set the module can produce — pinned by value, so adding
   * a sixth generator fails here until it is covered.
   */

  /** Weekday meals scoring well above weekend ones. Reaches `weekendGap`. */
  function weekendFixture(dip: boolean) {
    // Anchored to a known Monday so the weekday/weekend split is not
    // whatever today happens to be — a fixture that drifts with the calendar
    // is a fixture that passes on Tuesdays.
    const monday = Date.parse("2026-09-07T12:00:00.000Z")
    const at = (offsetDays: number) =>
      new Date(monday + offsetDays * 86_400_000).toISOString()
    const meal = (name: string, score: number, offsetDays: number) => ({
      name,
      score,
      createdAt: at(offsetDays),
      prebiotic: 40,
      probiotic: 40,
      postbiotic: 40,
    })
    const weekdayScore = dip ? 80 : 50
    const weekendScore = dip ? 50 : 80
    return [
      meal("Weekday A", weekdayScore, 0),
      meal("Weekday B", weekdayScore, 1),
      meal("Weekday C", weekdayScore, 2),
      meal("Weekend A", weekendScore, 5),
      meal("Weekend B", weekendScore, 6),
      meal("Weekend C", weekendScore, 12),
    ] as AccountTwinInput["meals"]
  }

  /** The same meal twice, averaging ≥70. Reaches `repeatWinner`. */
  function repeatFixture() {
    return [
      { name: "Kefir bowl", score: 84, createdAt: day(1), prebiotic: 40, probiotic: 40, postbiotic: 40 },
      { name: "Kefir bowl", score: 80, createdAt: day(3), prebiotic: 40, probiotic: 40, postbiotic: 40 },
    ] as AccountTwinInput["meals"]
  }

  /** Meals on five distinct days inside the last seven. Reaches `weeklyRhythm`. */
  function rhythmFixture() {
    return [1, 2, 3, 4, 5].map((i) => ({
      name: `Day ${i}`,
      score: 60,
      createdAt: day(i),
      prebiotic: 40,
      probiotic: 40,
      postbiotic: 40,
    })) as AccountTwinInput["meals"]
  }

  const EVERY_FIXTURE = () => [
    ...(["prebiotic", "probiotic", "postbiotic"] as const).flatMap((lead) =>
      [true, false].map((rising) => mealsFixture(lead, rising)),
    ),
    weekendFixture(true),
    weekendFixture(false),
    repeatFixture(),
    rhythmFixture(),
  ]

  it("every generator in the module is reached by a fixture", () => {
    const reached = new Set<string>()
    for (const meals of EVERY_FIXTURE()) {
      for (const p of detectPatterns(meals)) {
        // Collapse the interpolated suffixes to the GENERATOR they came from.
        reached.add(p.id.replace(/^(trend-up|trend-down|best-lean)-.*$/, "$1"))
      }
    }
    /*
     * FOUR, not five. `fortnightTrend` is gated by a permanent `canCompare`
     * refusal (step 2c), so no fixture can reach it and pretending otherwise
     * would make this pin unsatisfiable. The two tests above are what hold the
     * gated generator: one proves the suppression is caused by the verdict,
     * the other keeps its sentences under the claim rules while dormant.
     *
     * Still pinned BY VALUE, so a SIXTH generator fails here until covered.
     */
    expect([...reached].sort(), "a generator is unreachable by every fixture").toEqual([
      "best-lean",
      "repeat-winner",
      "rhythm",
      "weekend-dip",
      "weekend-lift",
    ])
  })

  it("and every sentence every generator produces is clean", () => {
    let seen = 0
    for (const meals of EVERY_FIXTURE()) {
      for (const p of detectPatterns(meals)) {
        assertClean(`pattern ${p.id}`, [p.title, p.detail])
        seen += 1
      }
    }
    // Non-vacuity: the loop above asserted something for every generator.
    expect(seen).toBeGreaterThanOrEqual(5)
  })
})

/* ── 5 · the three remaining /account generators ──────────────────────────── */

describe("the other live account generators are clean", () => {
  async function twinFor(lead: "prebiotic" | "probiotic" | "postbiotic") {
    const { twin } = await buildAccountTwin({
      score: 62,
      previousScore: 58,
      profileType: "Emerging Balance",
      meals: mealsFixture(lead, true),
      streak: 3,
      biotics: { prebiotic: 30, probiotic: 12, postbiotic: 36 },
    })
    return twin
  }

  it("buildInsideYouChapters carries no personal Biotic number", async () => {
    const chapters = buildInsideYouChapters(await twinFor("prebiotic"))
    for (const c of chapters) {
      assertClean(`chapter ${c.key}.takeaway`, [c.takeaway])
      /*
       * `valueLabel` is "" on the three Biotic chapters by design, so handing
       * it to a claim checker asserts nothing — which `assertClean` now
       * refuses. The real invariant is that it IS empty there and non-empty
       * only where a figure is legitimately shown, so that is asserted
       * directly. (Found by the vacuity check added for case 1093, on its
       * first run — against this file.)
       */
      if (c.key === "eat") {
        expect(c.valueLabel.length, "the score chapter lost its label").toBeGreaterThan(0)
        assertClean(`chapter ${c.key}.valueLabel`, [c.valueLabel])
      } else {
        expect(c.valueLabel, `${c.key} still labels a personal Biotic value`).toBe("")
      }
      // Title and narration are EDUCATION and may name a Biotic; what they may
      // not do is attach a number or a personal verdict to one.
      for (const [why, rule] of GENERATED_CLAIM_RULES.slice(1)) {
        for (const text of [c.title, c.narration]) {
          expect(text.match(rule)?.[0] ?? null, `${c.key} — ${why}: ${text}`).toBeNull()
        }
      }
    }

    // Only the overall-score chapter carries a figure.
    const withValue = chapters.filter((c) => c.value != null)
    expect(withValue.map((c) => c.key)).toEqual(["eat"])
  })

  it("buildWeekStory names a food pattern, not a Biotic", async () => {
    const story = buildWeekStory(await twinFor("probiotic"))
    for (const beat of story) {
      assertClean("week story", [beat.title, beat.detail])
    }
  })

  it("systemMapState hands the renderer no personal Biotic state", async () => {
    const state = systemMapState(await twinFor("postbiotic"))
    expect(state.length).toBeGreaterThan(2)
    for (const h of state) {
      assertClean(`hotspot ${h.key}.action`, [h.action])
      // `what` is education and may name a Biotic; it may not carry a number.
      for (const [why, rule] of GENERATED_CLAIM_RULES.slice(1)) {
        expect(h.what.match(rule)?.[0] ?? null, `${h.key} — ${why}`).toBeNull()
      }
      for (const banned of ["score", "level", "bioticLabel"]) {
        expect(
          (h as unknown as Record<string, unknown>)[banned],
          `hotspot still carries ${banned}`,
        ).toBeUndefined()
      }
    }
  })
})

/* ── 6 · the two vocabularies, and the bridge between them ────────────────── */

describe("the behaviour vocabularies resolve for every key", () => {
  /*
   * `PILLAR_BEHAVIOUR` is keyed by DISPLAY LABEL while the loop carries
   * `BioticKey`. A silent miss there returns null and the sentence loses its
   * subject — which is why `loopBehaviour` has a fallback and why this asserts
   * the fallback is never reached in practice.
   */
  const KEYS: BioticKey[] = ["prebiotics", "probiotics", "postbiotics"]

  it("the label bridge into lib/pillars.ts holds for all three", () => {
    for (const k of KEYS) {
      expect(pillarBehaviour(BIOTIC_LABELS[k]), `no behaviour for ${k}`).toBeTruthy()
    }
  })

  it("every phrase is non-empty, names no Biotic, and carries no leading possessive", () => {
    for (const k of KEYS) {
      for (const phrase of [loopBehaviour(k), behaviourFor(k, "meals"), behaviourFor(k, "assessment")]) {
        expect(phrase.length).toBeGreaterThan(3)
        expect(phrase).not.toMatch(new RegExp(BIOTICS_ANY))
        // A leading "your" would compose into "Your your eating rhythm".
        expect(phrase, `"${phrase}" starts with a possessive`).not.toMatch(/^your\b/i)
      }
    }
    for (const k of ["prebiotic", "probiotic", "postbiotic"] as const) {
      expect(mealBehaviour(k).length).toBeGreaterThan(3)
      expect(mealBehaviour(k)).not.toMatch(new RegExp(BIOTICS_ANY))
      expect(mealBehaviour(k)).not.toMatch(/ like /)
    }
  })

  it("the meal and assessment vocabularies genuinely differ where the measures differ", () => {
    /*
     * The assessment's third dimension is rhythm (q10–q15); a meal's third
     * bucket is polyphenol-rich and resistant-starch foods. Mapping one through
     * the other produced "Your best meals lean on eating rhythm". If these two
     * ever return the same phrase for `postbiotics`, that collapse has come
     * back.
     */
    expect(behaviourFor("postbiotics", "assessment")).not.toBe(
      behaviourFor("postbiotics", "meals"),
    )
  })
})

/* ── 7 · non-vacuity, in both directions ──────────────────────────────────── */

describe("NON-VACUITY", () => {
  /**
   * The sentences this product was generating before Gate 3.6, as literals.
   *
   * They are kept here rather than read from the modules because the modules no
   * longer contain them: a non-vacuity case that reads its subject from the
   * corrected code proves only that the code is corrected, not that the rules
   * would catch a regression. Four of these were live on /account.
   */
  const PRE_FIX = [
    "Prebiotics remains your strongest area.",
    "Postbiotics appears lower — a gentle place to focus next.",
    "Your Prebiotics look settled, while Postbiotics appear lower.",
    "Focusing on Postbiotics supports the area with the most room to grow.",
    "Postbiotics appear lower than the others",
    "This fed your Prebiotics · meal score 72",
    "Your Postbiotics slipped 8 points this week",
    "Your best meals lean on Prebiotics",
    "your meals feed the producers well",
    "Prebiotics led your week.",
    "Your prebiotic level is running low — plant variety is what moves it.",
    "Fermented foods add live microbes that work alongside your own.",
    "The miso brings live cultures — exactly what your probiotic side needs.",
    "Postbiotics produced",
    "Fed by Postbiotics",
  ]

  it("every pre-Gate-3.6 sentence is caught", () => {
    for (const line of PRE_FIX) {
      expect(
        GENERATED_CLAIM_RULES.some(([, r]) => r.test(line)),
        `not caught: ${line}`,
      ).toBe(true)
    }
  })

  it("the corrected sentences are NOT caught", () => {
    for (const line of [
      "One of your stronger patterns: fibre-rich plants.",
      "The bigger opportunity right now: fermented foods.",
      "Your recent meals describe fibre-rich plants as one of your steadier patterns, and fermented foods as the greater opportunity.",
      "Room to grow in your recent meals: polyphenol-rich foods",
      "This meal brought polyphenol-rich foods · meal score 78",
      "Your meals climbed 14 points on polyphenol-rich foods this week",
      "Your best meals lean on fermented foods",
      "One fermented food a day is the whole behaviour here.",
      "Your Biotics Score™ is 74.",
    ]) {
      const hits = GENERATED_CLAIM_RULES.filter(([, r]) => r.test(line))
      expect(hits.map((h) => h[0]), `false positive: ${line}`).toEqual([])
    }
  })

  it("the harness itself is not vacuous — assertClean fails on a known claim", () => {
    expect(() => assertClean("probe", ["Your Postbiotics slipped 8 points"])).toThrow()
  })

  /* ══ GATE 5 step 0.5 — the profile taglines, READ RATHER THAN SCANNED ══════
   *
   * `getProfileInfo` is a lookup, not a generator, so the obvious guard would
   * be a per-file source pin. This calls it instead, over EVERY key the table
   * holds plus the default and an unknown type, because step 0's lesson was
   * that a guard sees only what it is handed: three live pattern generators had
   * never had a sentence read because the fixture never produced them.
   *
   * A table is the easy version of that problem — a rule aimed at one entry
   * says nothing about the other seven, and three of the eight here were
   * asserting a biological state.
   */
  it("no profile tagline asserts a biological state", () => {
    const BIOLOGY_CLAIM =
      /\b(?:your (?:inner )?(?:food system|gut|system|body|microbiome))\b[^.!?]{0,40}\b(?:is|are|working|performing|ready|thriving|healthy)\b|\bfood system health\b/i

    const taglines = [
      ...Object.values(PROFILE_INFO).map((p) => p.tagline),
      DEFAULT_PROFILE_INFO.tagline,
      getProfileInfo(null).tagline,
      getProfileInfo("Not A Real Profile").tagline,
    ]

    // Non-vacuity: every entry in the table was actually inspected.
    expect(taglines.length).toBeGreaterThanOrEqual(Object.keys(PROFILE_INFO).length + 1)

    for (const tagline of taglines) {
      expect(tagline, `a tagline asserts a biological state: ${tagline}`).not.toMatch(
        BIOLOGY_CLAIM,
      )
      // And the claim rules the rest of this file runs apply here too.
      assertClean(`tagline ${JSON.stringify(tagline)}`, [tagline])
    }
  })

  it("NON-VACUITY: the three removed taglines would all have failed", () => {
    /*
     * Kept as literals because the module no longer contains them — a
     * non-vacuity case that read its subject from the corrected table would
     * prove only that the table is corrected.
     */
    const BIOLOGY_CLAIM =
      /\b(?:your (?:inner )?(?:food system|gut|system|body|microbiome))\b[^.!?]{0,40}\b(?:is|are|working|performing|ready|thriving|healthy)\b|\bfood system health\b/i

    for (const was of [
      "Your inner food system is working hard in your favour.",
      "Your food system health is performing at its peak.",
      "Your gut is ready for more — more variety, more plants, more life.",
    ]) {
      expect(was, `the rule would not have caught: ${was}`).toMatch(BIOLOGY_CLAIM)
    }

    // …and the replacements pass, so the rule did not simply delete the voice.
    for (const now of [
      "Your answers described a wide range of foods, arriving consistently.",
      "Your answers described strong, steady food patterns across the week.",
      "Your answers described room for more — more variety, more plants, more fibre.",
    ]) {
      expect(now).not.toMatch(BIOLOGY_CLAIM)
    }
  })

  it("the lifecycle email describes the measurement, not the biology", () => {
    /*
     * `sequence-email.ts` has form here: it was still rendering a per-Biotic
     * number and a filled bar months after every page had lost them, and it is
     * where the Tranche 2C audit found a personal-Postbiotic sentence. An inbox
     * is the surface nobody re-reads.
     */
    const day0 = buildSequenceEmail({
      name: "Sam",
      email: "sam@example.com",
      score: 67,
      profileType: "Emerging Balance",
      weakestPillar: "feed",
      dayOffset: 0,
    })
    /*
     * ── `assertClean` IS THE WRONG INSTRUMENT HERE, AND THAT IS THE POINT ──
     *
     * The first version of this test called it on the rendered html and failed
     * on "Prebiotics" — because `GENERATED_CLAIM_RULES` refuses ANY mention of
     * a Biotic. That strictness is correct for the generators above, which
     * "have no educational register to protect", and wrong for an email whose
     * reviewed Tranche 2C wording deliberately NAMES the three as the
     * foundation the score is built on.
     *
     * Running it anyway would have deleted true education to satisfy a rule
     * aimed at something else — the same over-reach that nearly removed
     * `/biotics`'s own heading in Gate 3.6. `PERSONAL_BIOTIC_STATE` already
     * covers this file through the `biotic-claims.test.ts` corpus; what is
     * asserted here is the one thing that corpus cannot see, which is whether
     * the score is described as a summary of answers or as a working system.
     */
    expect(day0.html, "the score summarises answers, not a working system").not.toMatch(
      /how your food system is working/i,
    )
    expect(day0.html).toMatch(/summarises patterns in the answers you gave/i)
  })

  /**
   * The six sentences `lib/account/patterns.ts` was generating when Gate 5
   * opened, as literals.
   *
   * Kept here rather than read from the module for the reason `PRE_FIX` gives:
   * the module no longer contains them, so a non-vacuity case that read its
   * subject from the corrected code would prove only that the code is
   * corrected — not that the rule would catch a regression.
   *
   * All six were live. `detectPatterns` reaches `app/account/page.tsx` through
   * `buildAccountTwin`, plus `/account/this-week` and the weekly email.
   */
  const PRE_FIX_CAUSAL = [
    "Compared with the week before — whatever changed, it's working.",
    "Your weekday meals score higher — one weekend swap would close most of the gap.",
    "Compared with the week before — one targeted meal would bring it back.",
    "Whatever you do at weekends, your weekdays would love some of it.",
    "You've logged it 4 times at an average of 81 — a proven winner worth keeping in rotation.",
    "That rhythm is exactly how I learn what actually works for you.",
  ]

  it.each(PRE_FIX_CAUSAL)("the causation rules would have caught: %s", (claim) => {
    expect(() => assertClean("pre-fix", [claim])).toThrow()
  })

  it("but a suggestion with no result attached still passes", () => {
    /*
     * The line this rule must NOT cross. Naming an action is what the action
     * layer is for; attaching a result to it is the claim. A rule that refused
     * both would delete the product's reason to speak, which is the same
     * over-reach that nearly deleted `/biotics`'s educational heading in
     * Gate 3.6.
     */
    expect(() =>
      assertClean("suggestion", [
        "Your weekday meals scored higher than your weekend ones. A weekend meal built like a weekday one is the smallest thing to try.",
        "Compared with the week before. That is what the meals you logged described, not why they changed.",
        "The more meals I see, the more of your pattern I can describe.",
      ]),
    ).not.toThrow()
  })

  /*
   * Case 1093's counterfactual, run in CI rather than only under the harness.
   * Silencing this guard by handing it nothing must be a failure, not a pass.
   */
  it("assertClean refuses to be called with nothing to inspect", () => {
    expect(() => assertClean("probe", [])).toThrow()
    expect(() => assertClean("probe", [null, undefined, "  "])).toThrow()
    // ...unless a caller says the emptiness is expected.
    expect(() => assertClean("probe", [], true)).not.toThrow()
  })
})
