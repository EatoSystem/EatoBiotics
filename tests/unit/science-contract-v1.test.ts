import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Integrity guard for the frozen Phase 3A Science Contract v1.0.
 *
 * ── Why this reads no source ─────────────────────────────────────────────────
 *
 * This is a HISTORICAL SNAPSHOT guard, deliberately. The contract records what
 * was adjudicated about the bank as it stood at
 * `097cc6df961929742098e869066460fd49e08bef`. Phase 3A-S4 will act on that
 * adjudication — removing `core_rhythm_antibiotics_v1`, re-targeting three
 * questions away from `bodySignalMap`, rewording Q4's label — after which the
 * live bank deliberately will NOT match the contract's question list.
 *
 * A guard that compared this document against the live bank would therefore
 * start failing the moment S4 succeeded, and the tempting fix would be to edit
 * the contract to match the new bank — destroying the record of what was
 * decided and why. So this guard pins the DOCUMENT, not the correspondence.
 *
 * ── What it protects ─────────────────────────────────────────────────────────
 *
 * The contract is the authoritative artifact for S4. The two things most worth
 * protecting are the ones a later well-meaning edit could quietly reverse: an
 * evidence status being upgraded, and the vocabulary drifting toward claims the
 * process did not earn.
 */

const CONTRACT = join(process.cwd(), "docs/phase-3a-science-contract-v1.md")

const doc = existsSync(CONTRACT) ? readFileSync(CONTRACT, "utf8") : ""

/** The adjudicated outcome, frozen. Changing a row here is changing the science
 *  contract, which requires a new adjudication rather than a test edit. */
const ADJUDICATED: Array<[question: string, status: string, decision: string]> = [
  ["core_signals_post_meal_pattern_v1", "CONTEXT_ONLY", "KEEP"],
  ["core_signals_energy_shape_v1", "CONTEXT_ONLY", "KEEP"],
  ["core_signals_context_v1", "CONTEXT_ONLY", "KEEP"],
  ["core_signals_settled_days_v1", "CONTEXT_ONLY", "KEEP"],
  ["core_rhythm_antibiotics_v1", "PROHIBITED", "REMOVE"],
  ["core_environment_constraints_v1", "SUPPORTED", "KEEP"],
  ["core_environment_food_avoidances_v1", "SUPPORTED", "KEEP"],
]

describe("the science contract exists and is frozen", () => {
  it("exists and is substantial", () => {
    expect(existsSync(CONTRACT)).toBe(true)
    expect(doc.length).toBeGreaterThan(10_000)
  })

  it("carries the frozen status block", () => {
    for (const line of [
      "# FROZEN ADJUDICATED SCIENCE CONTRACT",
      "# NOT CLINICAL VALIDATION",
      "# NOT PROFESSIONAL MEDICAL APPROVAL",
      "# NOT PRODUCT ACTIVATION",
    ]) {
      expect(doc).toContain(line)
    }
  })

  it("records both provenance layers without conflating them", () => {
    expect(doc).toContain("097cc6df961929742098e869066460fd49e08bef")
    expect(doc).toContain("1fd3f7ca99733e16dac698ea081b65786cb4a314")
    expect(doc).toMatch(/different provenance layers/i)
  })

  it.each(ADJUDICATED)("%s is recorded as %s / %s", (question, status, decision) => {
    const row = doc.split("\n").find((l) => l.includes(question) && l.includes("|"))
    expect(row, `${question} has no matrix row`).toBeTruthy()
    expect(row, `${question} status`).toContain(status)
    expect(row, `${question} decision`).toContain(decision)
  })

  it("keeps the antibiotic removal unambiguous", () => {
    // The most consequential decision in the contract, and the easiest to
    // soften later into "optional" or "deferred".
    expect(doc).toMatch(/\*\*REMOVE\*\*/)
    expect(doc).toMatch(/final adjudicated decision/i)
    expect(doc).toMatch(/No six-month threshold is approved/i)
    expect(doc).toMatch(/No two-year threshold is approved/i)
    expect(doc).toMatch(/No replacement antibiotic-history question is required/i)
  })
})

describe("the contract claims nothing the process did not earn", () => {
  it("uses only the approved status vocabulary", () => {
    for (const status of ["SUPPORTED", "CONTEXT_ONLY", "PROHIBITED", "SPECIALIST_REVIEW"]) {
      expect(doc).toContain(status)
    }
  })

  it("never asserts clinical or scientific validation of the outcome", () => {
    /*
     * Asserted as a property of every occurrence, not by a lookbehind.
     *
     * A governance document has to NAME the terms it forbids — "the terms
     * clinically validated, scientifically validated … are not used" is the
     * prohibition itself. A lookbehind for a preceding "not" fails on exactly
     * that sentence, because the negation comes after the term. Requiring each
     * occurrence to sit in a negated sentence catches a real assertion whatever
     * order the words arrive in, and does not need the prohibition block carved
     * out by hand.
     */
    const sentences = doc.split(/(?<=[.!?])\s+|\n\n+/)
    for (const term of [
      "clinically validated",
      "scientifically validated",
      "medical approval",
      "expert approved",
      "regulatory approval",
    ]) {
      for (const s of sentences) {
        if (!s.toLowerCase().includes(term)) continue
        expect(
          /\bnot\b|\bnever\b|\bwithout\b/i.test(s),
          `contract asserts "${term}" without negation: ${s.trim().slice(0, 160)}`,
        ).toBe(true)
      }
    }
  })

  it("states that model agreement is not evidence", () => {
    expect(doc).toMatch(/Evidence outranks model agreement/i)
    expect(doc).toMatch(/do not equal professional validation/i)
  })
})

describe("the load-bearing safety rules are present", () => {
  it("carries the aggregation rule as a first-class heading", () => {
    expect(doc).toContain("# Aggregation Does Not Upgrade Evidence")
    expect(doc).toMatch(/Multiple self-reports remain multiple self-reports/i)
  })

  it("keeps unresolvedSpecificAvoidance meaning missing information, not risk", () => {
    expect(doc).toContain("unresolvedSpecificAvoidance")
    expect(doc).toMatch(/does not have enough specific information/i)
    expect(doc).toMatch(/never call an unselected food "safe"/i)
    // It must not be allowed to become a clinical risk score.
    expect(doc).toMatch(/does \*\*not\*\* mean high clinical risk|not.{0,20}mean high clinical risk/i)
  })

  it("keeps prefer-not-to-say distinct from no-constraint", () => {
    expect(doc).toMatch(/UNRESOLVED \/ UNDISCLOSED/)
    expect(doc).toMatch(/does \*\*not\*\* mean \*\*NO CONSTRAINT\*\*|not.{0,20}mean.{0,20}NO CONSTRAINT/i)
  })

  it("keeps the bundled-value and lighter-meals guards", () => {
    expect(doc).toMatch(/bundled values remain bundled/i)
    expect(doc).toContain("stress-sleep")
    expect(doc).toMatch(/lighter.meals safety guard/i)
    expect(doc).toMatch(/progressive restriction/i)
  })

  it("closes the softer postbiotics verbs, not only 'quantify'", () => {
    // The S1 proposed boundary only covered quantification. The adjudicated
    // version has to close the verbs through which the same claim returns.
    for (const verb of ["indicate", "reflect", "correspond to", "result from", "reveal"]) {
      expect(doc.toLowerCase(), `postbiotics boundary omits "${verb}"`).toContain(verb)
    }
  })

  it("bounds Regenerate without redesigning it", () => {
    expect(doc).toMatch(/`Regenerate` must not scientifically mean/i)
    expect(doc).toMatch(/butyrate/i)
    expect(doc).toMatch(/not attempted in S3/i)
  })
})

describe("S3 defers rather than implements", () => {
  it("labels the S4 scope as not implemented here", () => {
    expect(doc).toContain("# Required Phase 3A-S4 Implementation Changes")
    expect(doc).toMatch(/None of these are implemented in S3/i)
  })

  it("protects the historical S1 evidence pack from being rewritten", () => {
    // The audit trail is the point. A contract that permits editing the pack to
    // match the post-S4 bank would erase what reviewers were actually shown.
    expect(doc).toMatch(/Do not edit the historical S1 evidence pack/i)
    expect(doc).toMatch(/historical snapshot|audit trail/i)
  })

  it("records the three targeted specialist gates", () => {
    expect(doc).toMatch(/allergy \/ dietetic|allergy\/dietetic/i)
    expect(doc).toMatch(/Safety-netting wording/i)
    expect(doc).toMatch(/Irish\/EU legal/i)
    // Targeted, not blanket.
    expect(doc).toMatch(/\*\*does not\*\* automatically require/i)
    expect(doc).toMatch(/targeted.{0,20}to:/i)
  })

  it("states the bank is still dormant", () => {
    expect(doc).toMatch(/merged and dormant/i)
    expect(doc).toMatch(/Phase 3B \| NOT STARTED|Phase 3B.{0,20}NOT STARTED/i)
  })
})
