/* ── The numeric-timeframe gap, closed ─────────────────────────────────────
   `result within a timeframe` used to be /within (a few )?(days|weeks|months)/
   — the unit had to follow "within" immediately, so every numeric form walked
   past it: `within 3–4 weeks`, `within 30 days`, `within 2-3 weeks`. Its
   sibling `in (just )?\d+ (days|weeks)` knew no months and no ranges, and
   neither knew `by day 30`. The gap was reported in #198, #208, #210 and #211
   and never closed; #211 removed two instances as copy, which made it *less*
   visible rather than fixed.

   These fixtures pin the rule's behaviour in both directions. They import the
   real exported CLAIMS entry — not a copy of the pattern — so the rule and its
   proof cannot drift apart. Everything is whitespace-normalised first, because
   the corpus extractor joins JSX across lines and a claim that survives only
   as a multiline fragment is exactly what #198 shipped.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { CLAIMS, copyOf } from "./helpers/marketing-language"

/** The rule under test, pulled from the real list by name. */
const RULE = CLAIMS.find(([name]) => name === "result within a timeframe")?.[1]

/** Normalise the way copyOf does, so fixtures are tested as the corpus sees them. */
const norm = (s: string) => s.replace(/\s+/g, " ").trim()

describe("result within a timeframe — rule wiring", () => {
  it("is present in the exported CLAIMS list", () => {
    expect(RULE, "the rule name changed — these fixtures test nothing").toBeInstanceOf(RegExp)
  })

  it("replaced its two narrower predecessors rather than sitting beside them", () => {
    // `in N days/weeks` was folded in; leaving it would fire on
    // "retake the assessment in 30 days", a product function.
    const names = CLAIMS.map(([n]) => n)
    expect(names).not.toContain("result in N days/weeks")
    expect(names.filter((n) => n === "result within a timeframe")).toHaveLength(1)
  })
})

/** Outcome or bodily-benefit tied to a deadline — every one of these must fire. */
const RESULT_DEADLINES: Array<[string, string]> = [
  ["hyphen range", "you could see changes within 3-4 weeks"],
  ["en-dash range", "you could see changes within 3–4 weeks"],
  ["em-dash range", "you could see changes within 3—4 weeks"],
  ["'to' range", "you could see changes within 3 to 4 weeks"],
  ["within N days", "expect improvements within 30 days"],
  ["within N weeks", "a real shift within 6 weeks"],
  ["within N months", "a real shift within 2 months"],
  ["in N days", "your score improves in 30 days"],
  ["in N weeks", "your energy lifts in 3 weeks"],
  ["in N months", "better digestion in 2 months"],
  ["after N days", "energy lifts after 30 days"],
  ["after N weeks", "your digestion settles after 3 weeks"],
  ["by N weeks", "noticeable by 4 weeks"],
  ["by day N", "results by day 30"],
  // The two forms the removed rules used to own — coverage must not regress.
  ["legacy: unnumbered plural", "could steady your curve within weeks"],
  ["legacy: a few", "you may notice a difference within a few weeks"],
  ["legacy: in just N days", "results in just 30 days"],
  ["in only N weeks", "feel it in only 2 weeks"],
  ["in as little as N weeks", "in as little as 3 weeks"],
  // No outcome noun anywhere — the reason this rule uses a negative guard
  // rather than requiring a benefit word to be nearby.
  ["no outcome noun", "you'll be transformed within 6 weeks"],
]

/** Timing that is legitimate: what the customer does, what the product does,
 *  how long a plan runs, or an explicit denial. None of these may fire. */
const SAFE_TIMING: Array<[string, string]> = [
  // administrative / commercial deadlines
  ["cancel", "cancel within 30 days"],
  ["cancel a subscription", "you can cancel your subscription within 30 days of purchase"],
  ["respond", "respond within 30 days"],
  ["reply", "reply within 2 days"],
  ["delivery", "delivery within 3-5 days"],
  ["ships", "ships within 2 weeks"],
  ["refund", "request a refund within 14 days"],
  ["renewal", "renews in 30 days"],
  // plan schedules and product names
  ["30-day plan", "your 30-day plan"],
  ["30-day roadmap", "a 30-day roadmap building habits week by week"],
  ["7-day plan", "One action per day for your first week"],
  ["consistency instruction", "Stay consistent for 30 days"],
  ["dosing ramp", "increase gradually over 2–3 weeks"],
  // product functions
  ["retest", "Retest after 30 days"],
  ["retake with words between", "retake the assessment in 30 days to see your score"],
  ["reminder", "Set a reminder for 30 days from today"],
  // explicit denials — the copy that says the opposite of a promise
  ["denial: not by a date", "An illustrative estimate, not a result to expect by a date"],
  ["denial: not promised", "the things people often keep an eye on — not results promised by a date"],
  // reduplication idioms: "after week" is not a deadline
  ["week after week", "watch your score compound, week after week"],
  ["day after day", "your energy, day after day"],
  ["month after month", "month after month"],
]

describe("result within a timeframe — fires on dated outcome promises", () => {
  it.each(RESULT_DEADLINES)("flags %s", (_label, text) => {
    expect(RULE!.test(norm(text))).toBe(true)
  })

  it("survives the multiline JSX the extractor flattens", () => {
    // The #198 shape: a claim that exists only once lines are joined.
    const jsx = `
      <p className="text-sm">
        Your energy
        lifts within
        2–3 weeks
      </p>`
    expect(RULE!.test(norm(jsx))).toBe(true)
    // …and the same claim run through the real extractor, not just normalised.
    expect(RULE!.test(copyOf(jsx))).toBe(true)
  })

  it("is not defeated by an en-dash where a hyphen was expected", () => {
    const hyphen = norm("changes within 3-4 weeks")
    const enDash = norm("changes within 3–4 weeks")
    const emDash = norm("changes within 3—4 weeks")
    expect([hyphen, enDash, emDash].every((s) => RULE!.test(s))).toBe(true)
  })

  it("sees through JSX member expressions between the label and the deadline", () => {
    // The dots in {data.scoreProjection.projected} are member access, not
    // sentence ends — this is the exact shape the live claim had.
    const src = `<p>Projected score</p><span>{data.scoreProjection.projected}</span><span>After 30 days</span>`
    expect(RULE!.test(copyOf(src))).toBe(true)
  })
})

describe("result within a timeframe — accepts legitimate timing", () => {
  it.each(SAFE_TIMING)("allows %s", (_label, text) => {
    expect(RULE!.test(norm(text))).toBe(false)
  })
})

describe("the fixtures themselves cannot pass vacuously", () => {
  it("has meaningful coverage in both directions", () => {
    expect(RESULT_DEADLINES.length).toBeGreaterThanOrEqual(20)
    expect(SAFE_TIMING.length).toBeGreaterThanOrEqual(20)
  })

  it("an empty or whitespace extraction never satisfies the rule", () => {
    // A broken extractor returning "" would make every `not.toMatch` pass. The
    // corpus guard has extraction floors for this; the rule needs its own, so
    // a vacuous green here is impossible too.
    for (const empty of ["", "   ", "\n\n", copyOf("")]) {
      expect(RULE!.test(empty)).toBe(false)
    }
    // and the positive fixtures genuinely depend on their text
    expect(RULE!.test(norm(RESULT_DEADLINES[0][1]))).toBe(true)
  })
})
