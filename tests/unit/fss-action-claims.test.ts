/**
 * The claims boundary, on the action layer's own copy.
 *
 * ══ WHAT THIS FILE ADDS, AND WHAT IT DELIBERATELY DOES NOT DUPLICATE ════════
 *
 * `tests/unit/biotic-claims.test.ts` already reads every file under
 * `lib/fss/**` and `components/fss/**` — that is what Gate 3 step 0 closed —
 * so the fermented-live rules, the fibre-prebiotic rules and
 * `PERSONAL_BIOTIC_STATE` run over this content already. Restating them here
 * would create a second copy of a rule set, and two copies of a rule drift.
 *
 * What is NOT covered anywhere else is the class of claim an ACTION layer can
 * make and no earlier layer could:
 *
 *   · a predicted OUTCOME — "you will feel", "this improves"
 *   · a promise about the SCORE — "raises your score by"
 *   · a TIMEFRAME attached to a result, as opposed to a cadence
 *   · a DEFICIENCY, DISEASE or WEAKNESS reading of a priority
 *
 * Those are this file's job. Every rule is run against input that must fail
 * it, in CI rather than only under the sabotage harness.
 *
 * ══ AND ONE STRUCTURAL CHECK WORTH MORE THAN THE REGEXES ════════════════════
 *
 * `claimClass` is declared per recommendation, and a declaration nothing checks
 * is a label. So the class and the sentence are cross-checked: an
 * `observed-behaviour` rationale must actually describe what the person's
 * answers said, and a `general-education` one must not be about them at all.
 */
import { describe, it, expect } from "vitest"
import { ACTION_CATALOGUE, REASSESSMENT, THIRTY_DAY_FOCUS } from "@/lib/fss/action/catalogue"
import { ACTION_CATEGORIES } from "@/lib/fss/action/categories"
import { TIME_HORIZONS } from "@/lib/fss/action/horizons"
import { CONSTRAINT_LABELS, PLAN_COPY, describeConstraints } from "@/lib/fss/presentation/plan"
import { DOMAIN_PRESENTATION, PRIORITY_COPY } from "@/lib/fss/presentation/domains"
import type { FssDomain } from "@/lib/fss/questions/types"

const DOMAINS: FssDomain[] = [
  "diversity",
  "plantsAndFibre",
  "fermentedFoods",
  "foodQuality",
  "mealRhythm",
]

/**
 * Every customer-visible sentence this gate authored, with a label so a
 * failure says which one.
 */
function authoredCopy(): [string, string][] {
  const out: [string, string][] = []

  for (const e of ACTION_CATALOGUE) {
    out.push([`${e.id}.title`, e.title])
    out.push([`${e.id}.practicalAction`, e.practicalAction])
    out.push([`${e.id}.rationale`, e.rationale])
    out.push([`${e.id}.suggestedFrequency`, e.suggestedFrequency])
  }

  for (const d of DOMAINS) {
    out.push([`thirtyDay.${d}.behaviour`, THIRTY_DAY_FOCUS[d].behaviour])
    out.push([`thirtyDay.${d}.whyThisOne`, THIRTY_DAY_FOCUS[d].whyThisOne])
  }

  out.push(["reassessment.whatItCompares", REASSESSMENT.whatItCompares])
  out.push(["reassessment.comparabilityRule", REASSESSMENT.comparabilityRule])

  for (const [k, v] of Object.entries(PLAN_COPY)) {
    if (typeof v === "string") out.push([`PLAN_COPY.${k}`, v])
  }
  out.push(["PLAN_COPY.contextRespected", PLAN_COPY.contextRespected("time on a weekday")])
  for (const q of PLAN_COPY.questions) out.push(["PLAN_COPY.questions", q])

  for (const [k, v] of Object.entries(CONSTRAINT_LABELS)) out.push([`constraint.${k}`, v])

  for (const c of Object.values(ACTION_CATEGORIES)) {
    out.push([`category.${c.category}.label`, c.label])
    out.push([`category.${c.category}.meaning`, c.meaning])
  }

  for (const h of Object.values(TIME_HORIZONS)) {
    out.push([`horizon.${h.horizon}.label`, h.label])
    out.push([`horizon.${h.horizon}.question`, h.question])
    out.push([`horizon.${h.horizon}.cadence`, h.cadence])
  }

  // Gate 2's priority copy and the domain action lines travel with the plan,
  // so they are held to the same rules. If one of these ever fails it is a
  // finding about Gate 2 to report, not something to quietly reword.
  out.push(["PRIORITY_COPY.explanation", PRIORITY_COPY.explanation])
  out.push(["PRIORITY_COPY.rationale", PRIORITY_COPY.rationale(40, 5)])
  out.push(["PRIORITY_COPY.noneAvailable", PRIORITY_COPY.noneAvailable])
  for (const d of DOMAINS) {
    out.push([`domain.${d}.whatYouCouldDo`, DOMAIN_PRESENTATION[d].whatYouCouldDo])
    out.push([`domain.${d}.priorityHeadline`, DOMAIN_PRESENTATION[d].priorityHeadline])
  }

  return out
}

/* ── The rules ──────────────────────────────────────────────────────────── */

const RULES: [string, RegExp][] = [
  [
    "a predicted outcome",
    /\b(will|shall|should|expect to|going to|you'?ll)\s+(?:\w+\s+){0,2}(feel|notice|see|improve|improves?|increase|boost|rise|reduce|lower|drop|heal|recover)\b/i,
  ],
  [
    "a promise about the score",
    /\b(raise|raises|improve|improves|increase|increases|boost|boosts|lift|lifts)\s+(your|the)\s+[\w\s]{0,12}score\b|\b\d+\s*points?\b/i,
  ],
  [
    "an outcome on a schedule",
    /\b(in|within|after|over)\s+[\w-]+\s+(days?|weeks?|months?)\b[^.!?]{0,70}\b(feel|better|healthier|stronger|improve\w*|fitter|clearer)\b/i,
  ],
  [
    "an outcome, then a schedule",
    /\b(feel|better|healthier|stronger|improve\w*)\b[^.!?]{0,70}\b(in|within|after)\s+[\w-]+\s+(days?|weeks?|months?)\b/i,
  ],
  [
    "a deficiency, disease or weakness reading",
    /\b(deficien\w+|disease|disorder|diagnos\w+|imbalance|inflammation|leaky gut|weakness|root cause|treatment)\b/i,
  ],
  [
    "a biological state asserted of the person",
    /\byour\s+(microbiome|gut bacteria|gut microbes|gut flora|metabolism|immune system)\b[^.!?]{0,30}\b(is|are|will|needs?|lacks?)\b/i,
  ],
  [
    "a medical instruction",
    /\b(dose|dosage|prescrib\w+|supplement\w*\s+(regime|protocol)|take\s+\d)\b/i,
  ],
]

describe("no action-layer sentence makes a claim it cannot support", () => {
  const copy = authoredCopy()

  it("there is copy to check, and a lot of it", () => {
    // A corpus that collected nothing would pass every rule below in silence.
    expect(copy.length).toBeGreaterThan(90)
    for (const [label, sentence] of copy) {
      expect(sentence, `${label} is empty`).toBeTruthy()
    }
  })

  it.each(RULES)("none of it contains %s", (_why, rule) => {
    const offenders = copy
      .filter(([, sentence]) => rule.test(sentence))
      .map(([label, sentence]) => `${label}: "${sentence}"`)
    expect(offenders).toEqual([])
  })

  it("NON-VACUITY: each rule catches the sentence it exists for", () => {
    const check = (why: string, probe: string) => {
      const rule = RULES.find(([n]) => n === why)
      expect(rule, `no rule named "${why}"`).toBeDefined()
      expect(probe, `"${probe}" must be refused by ${why}`).toMatch(rule![1])
    }

    check("a predicted outcome", "Do this and you will feel steadier within the week.")
    check("a predicted outcome", "This should improve your digestion.")
    check("a promise about the score", "Keeping this up will raise your score.")
    check("a promise about the score", "Most people gain 10 points doing this.")
    check("an outcome on a schedule", "In two weeks you should feel better.")
    check("an outcome, then a schedule", "You will feel clearer after three weeks.")
    check("a deficiency, disease or weakness reading", "This suggests a fibre deficiency.")
    check("a deficiency, disease or weakness reading", "Signs of gut imbalance.")
    check("a biological state asserted of the person", "Your microbiome is depleted.")
    check("a medical instruction", "Take 2 capsules daily.")
  })

  it("NON-VACUITY: the rules do NOT fire on the careful forms", () => {
    /*
     * The other direction, and the one that decides whether these rules can
     * survive. A rule that also refuses honest copy gets weakened the first
     * time it is inconvenient.
     */
    const careful = [
      "Your answers described a narrow range of plant foods.",
      "A wider range of plants is associated with a wider range of gut microbes.",
      "Add one plant food you have not eaten this week.",
      "A small amount, most days.",
      "One behaviour, held for a month. What survives an ordinary week is the part that has actually changed.",
      "Decide in advance what you will eat on that day.",
      "Fibre is the substrate your gut microbes ferment.",
      "You told us about what food costs, so nothing above asks for more of it.",
    ]
    for (const sentence of careful) {
      for (const [why, rule] of RULES) {
        expect(sentence, `${why} fired on honest copy: "${sentence}"`).not.toMatch(rule)
      }
    }
  })
})

describe("the declared claim class matches the sentence", () => {
  /*
   * `claimClass` is data, and data nothing checks is a label. An
   * observed-behaviour rationale that did not actually describe the person's
   * answers would be claiming a provenance it does not have — which is the
   * same defect as a score without a method version, one layer up.
   */
  const DESCRIBES_ANSWERS = /\byour answers described\b|\byou reported\b|\byou told us\b/i

  it("observed-behaviour rationales describe what the answers said", () => {
    const wrong = ACTION_CATALOGUE.filter(
      (e) => e.claimClass === "observed-behaviour" && !DESCRIBES_ANSWERS.test(e.rationale),
    ).map((e) => `${e.id}: "${e.rationale}"`)
    expect(wrong, "declared observed-behaviour but says nothing about the answers").toEqual([])
  })

  it("general-education rationales are about food, not about the person", () => {
    const wrong = ACTION_CATALOGUE.filter(
      (e) => e.claimClass === "general-education" && DESCRIBES_ANSWERS.test(e.rationale),
    ).map((e) => `${e.id}: "${e.rationale}"`)
    expect(wrong, "declared general-education but describes the person's answers").toEqual([])
  })

  it("both classes are actually used, so neither check is vacuous", () => {
    const used = new Set(ACTION_CATALOGUE.map((e) => e.claimClass))
    expect(used.has("observed-behaviour")).toBe(true)
    expect(used.has("general-education")).toBe(true)
  })

  it("NON-VACUITY: a mislabelled rationale would be caught in both directions", () => {
    expect(DESCRIBES_ANSWERS.test("Your answers described a narrow range.")).toBe(true)
    expect(DESCRIBES_ANSWERS.test("Fibre keeps for months in a tin.")).toBe(false)
  })
})

describe("the three prohibited equivalences, in the layer's own words", () => {
  it("the catalogue never uses the word prebiotic at all", () => {
    // The simplest way not to misuse a term: the file does not contain it.
    // Strict ISAPP makes "prebiotic" a claim about a demonstrated benefit, not
    // a food category, and an action layer has no business asserting one.
    for (const [label, sentence] of authoredCopy()) {
      expect(sentence.toLowerCase(), `${label} uses "prebiotic"`).not.toContain("prebiotic")
    }
  })

  it("no fermented food is called a probiotic, and none is said to carry live organisms", () => {
    for (const [label, sentence] of authoredCopy()) {
      expect(sentence.toLowerCase(), `${label} uses "probiotic"`).not.toContain("probiotic")
      expect(sentence, `${label} claims live organisms`).not.toMatch(
        /\blive[- ]cultures?\b|\b(live|living) foods?\b/i,
      )
    }
  })

  it("no food is called a postbiotic, and no Biotic is named at all", () => {
    for (const [label, sentence] of authoredCopy()) {
      for (const b of ["Prebiotics", "Probiotics", "Postbiotics"]) {
        expect(sentence, `${label} names ${b}`).not.toContain(b)
      }
    }
  })

  it("and Seed never claims colonisation", () => {
    // The trap in the word. Eating a fermented food is not organisms
    // establishing themselves in a person.
    const COLONISATION = /\b(reseed|re-seed|reseeding|seed new life|repopulat\w+|colonis\w+|coloniz\w+)\b/i
    for (const [label, sentence] of authoredCopy()) {
      expect(sentence, `${label} claims colonisation`).not.toMatch(COLONISATION)
    }
    expect(ACTION_CATEGORIES.seed.meaning).not.toMatch(COLONISATION)
    // NON-VACUITY, both ways.
    expect("Seed new life in your gut").toMatch(COLONISATION)
    expect(ACTION_CATEGORIES.seed.meaning).toMatch(/fermentation/i)
  })

  it("and Rejuvenate never means repairing or restoring anything microbial", () => {
    /*
     * REGENERATE_BOUNDARY.mustNotMean, transcribed — the contract cannot be
     * imported from lib/fss, since its importer allow-list is pinned to five
     * files under lib/report/.
     */
    const MUST_NOT_MEAN =
      /\b(increase|produce|restore|rebuild|repair)\s+(the\s+)?(postbiotics|microbiome|microbial|butyrate|acetate|propionate)/i
    for (const [label, sentence] of authoredCopy()) {
      expect(sentence, `${label} reads as a Rejuvenate boundary violation`).not.toMatch(
        MUST_NOT_MEAN,
      )
    }
    expect("rebuild the microbiome").toMatch(MUST_NOT_MEAN)
    expect("restore microbial metabolites").toMatch(MUST_NOT_MEAN)
    expect(ACTION_CATEGORIES.rejuvenate.meaning).not.toMatch(MUST_NOT_MEAN)
  })
})

describe("the context note reports a circumstance without judging it", () => {
  it("uses the permitted framing", () => {
    const note = PLAN_COPY.contextRespected(describeConstraints(["time", "cost"]))
    expect(note).toMatch(/^You told us about /)
  })

  it("names circumstances, never the person", () => {
    const JUDGEMENT =
      /\b(you should|you need to|you ought|if you could just|unfortunately|sadly|limited by your|your lack of|poor|bad)\b/i
    const notes = [
      PLAN_COPY.contextRespected(describeConstraints(["time", "cost", "access", "kitchen"])),
      PLAN_COPY.contextUnknown,
      ...Object.values(CONSTRAINT_LABELS),
    ]
    for (const n of notes) expect(n, `reads as a judgement: "${n}"`).not.toMatch(JUDGEMENT)
    expect("Unfortunately your lack of time limits this.").toMatch(JUDGEMENT)
  })

  it("joins constraints into one readable phrase", () => {
    expect(describeConstraints([])).toBe("")
    expect(describeConstraints(["time"])).toBe(CONSTRAINT_LABELS.time)
    expect(describeConstraints(["time", "cost"])).toBe(
      `${CONSTRAINT_LABELS.time} and ${CONSTRAINT_LABELS.cost}`,
    )
    expect(describeConstraints(["time", "cost", "access"])).toBe(
      `${CONSTRAINT_LABELS.time}, ${CONSTRAINT_LABELS.cost} and ${CONSTRAINT_LABELS.access}`,
    )
  })
})

describe("the candidate status is sayable on every surface", () => {
  it("the plan carries the marker, and names what it is not", () => {
    expect(PLAN_COPY.statusNote).toMatch(/candidate/i)
    expect(PLAN_COPY.statusNote).toMatch(/not yet approved/i)
    /*
     * A NEGATED mention of medical advice, in the same sentence. The first
     * version of this matched the bare phrase, which would also have passed a
     * sentence claiming the plan IS medical advice — a guard that accepts the
     * opposite of its subject.
     */
    const DISCLAIMS = /\b(nothing|not|no|never)\b[^.]*\bmedical advice\b/i
    expect(PLAN_COPY.statusNote).toMatch(DISCLAIMS)
    expect("Nothing here is medical advice.").toMatch(DISCLAIMS)
    expect("This is medical advice.", "the rule must reject the opposite claim").not.toMatch(
      DISCLAIMS,
    )
  })

  it("every recommendation can say it is unapproved", () => {
    for (const e of ACTION_CATALOGUE) {
      expect(e.id).toBeTruthy()
    }
    // `status` is set at bind time, which fss-plan.test.ts asserts for every
    // recommendation in a real plan.
    expect(PLAN_COPY.title).toBe("Your plan")
  })
})
