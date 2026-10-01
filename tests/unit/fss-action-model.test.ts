/**
 * The FSS-v1 action model — the typed objects, and the absences.
 *
 * ══ WHAT THIS FILE IS FOR ═══════════════════════════════════════════════════
 *
 * Gate 3's architecture is mostly made of things that are NOT in the types: no
 * biological-inference claim class, no number on an action category, no Biotic
 * anywhere, no domain→category mapping table, no horizon beyond thirty days.
 *
 * An absence nothing checks is an absence until the first person who needs a
 * quick fix. Every one of those five is asserted here, and every assertion is
 * run against input that must fail it — because "the symbol is present" checks
 * passing over behaviour that was already gone is the recurring defect this
 * codebase keeps finding.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { ACTIONS, BIOTICS } from "@/lib/product-vocabulary"
import {
  ACTION_SET_VERSION,
  CLAIM_CLASSES,
  PRIORITY_MAX,
  THIS_WEEK_MAX,
  type ClaimClass,
} from "@/lib/fss/action/types"
import {
  ACTION_CATEGORIES,
  ACTION_CATEGORY_ORDER,
  actionCategory,
} from "@/lib/fss/action/categories"
import {
  DEFERRED_HORIZONS,
  TIME_HORIZONS,
  TIME_HORIZON_ORDER,
  timeHorizon,
} from "@/lib/fss/action/horizons"

/** Every file in the action layer — tracked or merely written. */
function actionLayerFiles(): string[] {
  return execSync("git ls-files --cached --others --exclude-standard lib/fss/action", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter((f) => /\.ts$/.test(f))
    .sort()
}

/** Source with comments stripped — a docblock quoting a rule is not the rule. */
function renderedSource(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/** Every leaf value in an object, however deep. */
function leafValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(leafValues)
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(leafValues)
  return [value]
}

describe("the claim classes separate four kinds of statement, and offer no fifth", () => {
  it("there are exactly four", () => {
    expect(CLAIM_CLASSES).toEqual([
      "observed-behaviour",
      "self-reported",
      "general-education",
      "personalised-recommendation",
    ])
  })

  /*
   * The whole of requirement 7, in one assertion. The four permitted moves come
   * from the claims boundary's own table; biological inference is listed there
   * as "not available", and here it is not representable.
   *
   * A reviewer asked to approve a fifth member would be looking at a diff that
   * adds a biological claim class by name — which is the visibility that makes
   * this better than a comment.
   */
  it("NONE of them is a biological inference, by name or by shape", () => {
    for (const c of CLAIM_CLASSES) {
      expect(c, `"${c}" names a biological inference`).not.toMatch(
        /biolog|physiolog|microbiom|metabol|clinical|diagnos|infer/i,
      )
    }
  })

  it("NON-VACUITY: the rule would catch a fifth member that named one", () => {
    const rule = /biolog|physiolog|microbiom|metabol|clinical|diagnos|infer/i
    for (const forbidden of [
      "biological-inference",
      "microbiome-state",
      "clinical-observation",
      "metabolic-inference",
    ]) {
      expect(forbidden).toMatch(rule)
    }
    // And it does not fire on the four that are legitimate.
    for (const c of CLAIM_CLASSES) expect(c).not.toMatch(rule)
  })

  it("the type and the value list cannot drift apart", () => {
    // A compile-time check that the array covers the union: if a member were
    // added to ClaimClass and not to CLAIM_CLASSES, this stops type-checking.
    const exhaustive: Record<ClaimClass, true> = {
      "observed-behaviour": true,
      "self-reported": true,
      "general-education": true,
      "personalised-recommendation": true,
    }
    expect(Object.keys(exhaustive).sort()).toEqual([...CLAIM_CLASSES].sort())
  })
})

describe("Feed · Seed · Rejuvenate are action categories, carrying no number", () => {
  it("names come from the vocabulary authority, not from lib/pillars.ts", () => {
    expect(ACTION_CATEGORY_ORDER.map((c) => ACTION_CATEGORIES[c].label)).toEqual([...ACTIONS])
  })

  /*
   * The constitution's ACTION row: "may never say any number attached to Feed,
   * Seed or Rejuvenate." A score, a weight, an index, a count — any of them
   * turns an action into the thing the score hierarchy exists to keep it from
   * being. So the check is not "there is no field called score", it is "there
   * is no number anywhere in this record".
   */
  it("NO numeric value appears anywhere in the category record", () => {
    for (const leaf of leafValues(ACTION_CATEGORIES)) {
      expect(typeof leaf, `a number reached the action categories: ${String(leaf)}`).not.toBe(
        "number",
      )
    }
  })

  it("NON-VACUITY: the same walk finds an injected number", () => {
    const sabotaged = {
      ...ACTION_CATEGORIES,
      feed: { ...ACTION_CATEGORIES.feed, weight: 0.4 },
    }
    expect(leafValues(sabotaged).some((v) => typeof v === "number")).toBe(true)
    // And a nested one, since the record is two levels deep.
    expect(leafValues({ a: { b: { c: 7 } } }).some((v) => typeof v === "number")).toBe(true)
  })

  it("carries no Biotic — not as a field, not as a value", () => {
    expect(Object.keys(ACTION_CATEGORIES.feed).sort()).toEqual([
      "category",
      "color",
      "label",
      "meaning",
    ])
    for (const leaf of leafValues(ACTION_CATEGORIES)) {
      if (typeof leaf !== "string") continue
      for (const b of BIOTICS) {
        expect(leaf, `an action category names ${b}`).not.toContain(b)
      }
    }
  })

  it("and the module imports nothing that would make an action a Biotic", () => {
    const src = renderedSource("lib/fss/action/categories.ts")
    expect(src, "categories.ts must not import lib/pillars.ts").not.toMatch(/lib\/pillars/)
    expect(src, "categories.ts must not import lib/biotics.ts").not.toMatch(/lib\/biotics/)
  })

  it("resolves by key", () => {
    expect(actionCategory("rejuvenate").label).toBe("Rejuvenate")
    expect(ACTION_CATEGORY_ORDER).toHaveLength(3)
  })
})

describe("no table maps a domain to an action category", () => {
  /*
   * The decision this protects: an action is Feed because of what it IS, not
   * because of which domain surfaced it. A mapping table would be wrong three
   * ways — five domains into three categories has no honest answer for
   * foodQuality, a keyed lookup between two vocabularies is the exact defect
   * `lib/report/food-swaps.ts` documents having shipped (twenty of twenty-five
   * swaps unreachable for every report), and composed with lib/pillars.ts's
   * action→Biotic map it reconstitutes domain→Biotic.
   */
  const DOMAIN_TO_CATEGORY =
    /\b(diversity|plantsAndFibre|fermentedFoods|foodQuality|mealRhythm)\s*:\s*"(feed|seed|rejuvenate)"/
  const TYPED_MAP = /Record<\s*FssDomain\s*,\s*ActionCategory\s*>|Record<\s*ActionCategory\s*,\s*FssDomain\s*>/

  it("no file in the action layer contains one", () => {
    const files = actionLayerFiles()
    expect(files.length).toBeGreaterThanOrEqual(3)
    for (const f of files) {
      const src = renderedSource(f)
      expect(src, `${f} maps a domain straight to an action category`).not.toMatch(
        DOMAIN_TO_CATEGORY,
      )
      expect(src, `${f} declares a domain↔category map type`).not.toMatch(TYPED_MAP)
    }
  })

  it("NON-VACUITY: both shapes of the map would be caught", () => {
    expect('  mealRhythm: "rejuvenate",').toMatch(DOMAIN_TO_CATEGORY)
    expect('foodQuality:"feed"').toMatch(DOMAIN_TO_CATEGORY)
    expect("const M: Record<FssDomain, ActionCategory> = {").toMatch(TYPED_MAP)
    expect("const M: Record<ActionCategory , FssDomain> = {").toMatch(TYPED_MAP)
    // A recommendation naming its own category is the shipped design, not a map.
    expect('category: "feed",').not.toMatch(DOMAIN_TO_CATEGORY)
    expect("domain: \"mealRhythm\",\n  category: \"rejuvenate\",").not.toMatch(DOMAIN_TO_CATEGORY)
  })
})

describe("the horizons are three, and no longer one is implemented", () => {
  it("exactly Today, This week, The next 30 days", () => {
    expect(TIME_HORIZON_ORDER).toEqual(["today", "this-week", "thirty-days"])
    expect(TIME_HORIZON_ORDER.map((h) => TIME_HORIZONS[h].label)).toEqual([
      "Today",
      "This week",
      "The next 30 days",
    ])
    expect(timeHorizon("today").label).toBe("Today")
  })

  it("the longer horizons are recorded as deferred rather than silently missing", () => {
    // Same discipline as KNOWN_NON_BAND_LADDERS in the interpretation module:
    // say what is being left alone, so the count is honest.
    expect(DEFERRED_HORIZONS.map((d) => d.name)).toEqual(["ninety-days", "one-year"])
    for (const d of DEFERRED_HORIZONS) expect(d.why.length).toBeGreaterThan(20)
  })

  it("and no deferred horizon has leaked into the implemented set", () => {
    const implemented = Object.keys(TIME_HORIZONS)
    for (const d of DEFERRED_HORIZONS) {
      expect(implemented, `${d.name} is deferred but implemented`).not.toContain(d.name)
    }
    expect(implemented).toHaveLength(3)
  })

  /*
   * The cadence rule, on the horizon copy itself. A horizon says when you do
   * it; it never says when it works. The claims suite checks the catalogue;
   * this checks the three horizon descriptions, which are the sentences most
   * likely to drift into a promise because they are the ones about time.
   */
  it("no horizon description predicts an outcome", () => {
    const PREDICTION =
      /\b(will|should|expect to)\s+(feel|see|notice|improve|increase|rise|drop)\b|\bby then\b|\bresults? (in|within)\b|\braise your score\b/i
    for (const h of TIME_HORIZON_ORDER) {
      const meta = TIME_HORIZONS[h]
      for (const sentence of [meta.label, meta.question, meta.cadence]) {
        expect(sentence, `${h} predicts an outcome: "${sentence}"`).not.toMatch(PREDICTION)
      }
    }
  })

  it("NON-VACUITY: a predicted outcome on a horizon would be caught", () => {
    const PREDICTION =
      /\b(will|should|expect to)\s+(feel|see|notice|improve|increase|rise|drop)\b|\bby then\b|\bresults? (in|within)\b|\braise your score\b/i
    for (const bad of [
      "In a week you will feel steadier.",
      "Thirty days of this should improve your diversity.",
      "Expect to notice a difference.",
      "This will raise your score.",
      "Results within two weeks.",
    ]) {
      expect(bad, `"${bad}" must be refused`).toMatch(PREDICTION)
    }
    // The shipped cadences are not predictions, and must not read as ones.
    for (const h of TIME_HORIZON_ORDER) {
      expect(TIME_HORIZONS[h].cadence).not.toMatch(PREDICTION)
    }
  })
})

describe("versions and caps", () => {
  it("the action set carries its own version, distinct from the score's", () => {
    expect(ACTION_SET_VERSION).toBe("actions-v1.0")
  })

  it("ScoreProvenance was NOT widened to carry it", async () => {
    /*
     * The reason this is a test and not a note: a stored recommendation needs
     * both the scoring method and the content version, and the obvious move is
     * a sixth provenance field. That would change what every Gate 2 score
     * claims about itself, and Gate 2's tests pin the five by value. The €49
     * Report reached the same conclusion — composerVersion and
     * contentPackVersion sit BESIDE its schema version, not inside it.
     */
    const { FSS_V1_PROVENANCE } = await import("@/lib/fss/engine/provenance")
    expect(Object.keys(FSS_V1_PROVENANCE).sort()).toEqual([
      "assessmentVersion",
      "calculationVersion",
      "fssMethodVersion",
      "interpretationVersion",
      "questionSetVersion",
    ])
    expect(Object.keys(FSS_V1_PROVENANCE)).not.toContain("actionSetVersion")
  })

  it("the caps are the ones the gate specified", () => {
    expect(PRIORITY_MAX).toBe(3)
    expect(THIS_WEEK_MAX).toBe(3)
  })
})
