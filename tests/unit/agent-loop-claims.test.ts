import { describe, expect, it } from "vitest"
import { buildBaseline } from "@/lib/agent-loop/baseline"
import {
  createAgentLoopSession,
  makeObservation,
  runLoop,
  generateLoopSummary,
} from "@/lib/agent-loop"
import { deterministicProvider } from "@/lib/agent-loop/providers/deterministic"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import { detectPatterns } from "@/lib/account/patterns"
import { buildInsideYouChapters } from "@/lib/account/inside-you"
import { buildWeekStory } from "@/lib/account/week-story"
import { systemMapState } from "@/lib/account/system-map"
import { loopBehaviour, mealBehaviour, behaviourFor } from "@/lib/agent-loop/behaviour"
import { BIOTIC_LABELS } from "@/lib/agent-loop/biotics"
import { pillarBehaviour } from "@/lib/pillars"
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
    expect(ids.some((id) => id.startsWith("trend-up")), "no up-trend fixture").toBe(true)
    expect(ids.some((id) => id.startsWith("trend-down")), "no down-trend fixture").toBe(true)
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
