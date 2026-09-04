import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"

/**
 * The canonical multi-model science evidence pack — a HISTORICAL SNAPSHOT.
 *
 * ── What changed at Phase 3A-S4, and why this guard changed with it ──────────
 *
 * Originally this guard asserted the pack matched the LIVE bank exactly. That
 * was right while the pack described the bank as reviewers would see it.
 *
 * S4 then implemented the adjudicated Science Contract, and the bank moved on
 * purpose: `core_rhythm_antibiotics_v1` was removed, `bodySignalMap` was
 * withdrawn from three questions' targets, Q3's intent was rewritten, and Q4's
 * label lost the word "yet". A correspondence guard would now fail, and the
 * tempting fix would be to edit the pack to match — destroying the record of
 * what the three reviewers were actually shown, which is the entire point of
 * having a frozen pack.
 *
 * So the guard was re-pointed rather than weakened. It now validates the pack
 * against the FROZEN HISTORICAL RECORD below, and — more usefully — asserts
 * that the pack and the current bank diverge in exactly the ways S4 intended.
 * An unintended drift in either direction still fails.
 *
 * ── What it still protects ───────────────────────────────────────────────────
 *
 * Provenance, methodology, the reviewer panel, the independence definition, the
 * common-output contract, the rationale-is-not-evidence statement, the absence
 * of a shared bibliography, and the non-anchoring architecture. None of that is
 * affected by S4, and none of it is relaxed here.
 *
 * Not a Markdown parser. Substring checks, deliberately — the guard should stay
 * smaller than the thing it guards.
 */

/**
 * The seven questions as the pack recorded them, at question-bank source SHA
 * 097cc6df961929742098e869066460fd49e08bef.
 *
 * Frozen. This is what reviewers reviewed. It is NOT the current bank, and
 * after S4 it deliberately never will be again.
 */
const HISTORICAL_REVIEW_SET: readonly string[] = [
  "core_environment_constraints_v1",
  "core_environment_food_avoidances_v1",
  "core_rhythm_antibiotics_v1",
  "core_signals_context_v1",
  "core_signals_energy_shape_v1",
  "core_signals_post_meal_pattern_v1",
  "core_signals_settled_days_v1",
]

const PACK = join(process.cwd(), "docs/phase-3a-multi-model-science-evidence-pack.md")


describe("the historical review set is intact", () => {
  const pack = existsSync(PACK) ? readFileSync(PACK, "utf8") : ""

  it("exists and is substantial", () => {
    expect(existsSync(PACK)).toBe(true)
    expect(pack.length).toBeGreaterThan(10_000)
  })

  it("records all seven questions the reviewers were given", () => {
    for (const id of HISTORICAL_REVIEW_SET) {
      expect(pack, `${id} missing from the historical pack`).toContain(id)
    }
  })

  it("still contains the pre-adjudication wording, un-retrofitted", () => {
    // If someone "tidied" the pack to match the post-S4 bank, these would be
    // gone — and three reviews would then cite wording nobody was shown.
    expect(pack, "Q4 label was retro-edited").toContain("I can't tell a difference yet")
    expect(pack, "Q3 intent was retro-edited").toContain(
      "Identifies what co-occurs with the signal, which is where a first change is most likely to land.",
    )
    expect(pack, "Q1/Q2/Q3 report targets were retro-edited").toContain("bodySignalMap")
  })

  it("nothing in the current bank is marked scientifically reviewed", () => {
    // Still true after S4: the multi-model process is not qualified-human
    // review, so this flag stays unset regardless of what was adjudicated.
    expect(CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "reviewed")).toEqual([])
  })
})

describe("the pack and the current bank diverge exactly as S4 intended", () => {
  const pack = existsSync(PACK) ? readFileSync(PACK, "utf8") : ""
  const currentIds = new Set(CONSULTATION_QUESTION_BANK.map((q) => q.id))

  it("the removed question is in the pack and gone from the bank", () => {
    expect(pack).toContain("core_rhythm_antibiotics_v1")
    expect(currentIds.has("core_rhythm_antibiotics_v1"), "S4 removed this question").toBe(false)
  })

  it("every other reviewed question still exists in the bank", () => {
    for (const id of HISTORICAL_REVIEW_SET) {
      if (id === "core_rhythm_antibiotics_v1") continue
      expect(currentIds.has(id), `${id} vanished without an adjudicated decision`).toBe(true)
    }
  })

  it("bodySignalMap is in the historical pack and off the current questions", () => {
    expect(pack).toContain("bodySignalMap")
    for (const id of [
      "core_signals_post_meal_pattern_v1",
      "core_signals_energy_shape_v1",
      "core_signals_context_v1",
    ]) {
      const q = CONSULTATION_QUESTION_BANK.find((x) => x.id === id)
      expect(q?.reportTargets, `${id} still targets bodySignalMap`).not.toContain("bodySignalMap")
    }
  })

  it("the surviving six still carry the science-review flag", () => {
    // "required" continues to mean a specialist/human gate is outstanding —
    // which it is, for all three gates. S4 changed what is adjudicated, not
    // whether human review remains owed.
    const flagged = CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "required").map((q) => q.id)
    expect([...flagged].sort()).toEqual(
      HISTORICAL_REVIEW_SET.filter((id) => id !== "core_rhythm_antibiotics_v1").sort(),
    )
  })
})

describe("the pack claims nothing it has not earned", () => {
  const pack = existsSync(PACK) ? readFileSync(PACK, "utf8") : ""

  it("carries the not-validated status block", () => {
    for (const line of [
      "NOT SCIENTIFICALLY VALIDATED",
      "NOT CLINICALLY VALIDATED",
      "NOT EXPERT APPROVED",
      "NOT APPROVED FOR CUSTOMER ACTIVATION",
    ]) {
      expect(pack).toContain(line)
    }
  })

  it("never asserts the questions are validated or approved", () => {
    // Only ever in the negated status lines above. A bare assertion would be a
    // claim the product has not earned and cannot support.
    const bare: RegExp[] = [
      /(?<!NOT )\bscientifically validated\b/i,
      /(?<!NOT )\bclinically validated\b/i,
      /(?<!NOT )\bexpert approved\b/i,
      /\bscience approved\b/i,
      /\bevidence[- ]based\b/i,
    ]
    for (const re of bare) {
      const hit = pack.match(re)
      expect(hit?.[0], `pack asserts "${hit?.[0]}"`).toBeUndefined()
    }
  })

  it("does not anchor reviewers to a conclusion", () => {
    // The pack must leave KEEP / REWRITE / CONTEXT ONLY / REMOVE / ESCALATE all
    // genuinely open. These phrases would each close one off.
    for (const re of [
      /\bexpected to pass\b/i,
      /\bshould pass\b/i,
      /\bwe believe (this|these) (question|questions) (is|are)\b/i,
      /\bpreviously (approved|validated) by\b/i,
      /\bmajority (of reviewers|opinion)\b/i,
    ]) {
      expect(pack.match(re)?.[0], `pack anchors: ${re}`).toBeUndefined()
    }
    // And it states plainly that removal is available.
    expect(pack).toMatch(/removal .{0,40}acceptable/i)
  })

  it("marks every proposed boundary as not scientifically approved", () => {
    // Whole line: the heading carries an em dash, which a [A-Z ] class stops
    // at — an earlier version of this matcher truncated before the very
    // disclaimer it was checking for, and passed nothing while looking strict.
    const proposedHeadings = pack.match(/^### PROPOSED .*$/gm) ?? []
    expect(proposedHeadings.length).toBeGreaterThanOrEqual(14) // 2 per question
    for (const h of proposedHeadings) {
      expect(h, `"${h}" is not marked unapproved`).toMatch(/NOT SCIENTIFICALLY APPROVED/)
    }
  })

  it("names the agreed reviewer panel", () => {
    expect(pack).toContain("**Reviewer A** — Claude")
    expect(pack).toContain("**Reviewer B** — OpenAI")
    expect(pack).toMatch(/\*\*Reviewer C\*\* — a third independent frontier model/)
    // Codex is part of the engineering workflow, not the chosen
    // literature-review surface for S2B.
    expect(pack).not.toContain("Codex")
    // No specific model version is named — the panel is by provider, so the
    // pack does not go stale the moment a model is superseded.
    expect(pack).not.toMatch(/\bgpt-?[0-9]|\bo[0-9]-(mini|preview)|\bgemini-[0-9]/i)
  })

  it("defines 'independent' precisely, so blinding is not mistaken for validation", () => {
    expect(pack).toMatch(/each AI review is performed separately and blinded/i)
    for (const disclaimed of [
      "independent clinical studies",
      "independent experimental evidence",
      "professional medical validation",
      "scientific validation",
    ]) {
      expect(pack, `independence statement omits "${disclaimed}"`).toContain(disclaimed)
    }
  })

  it("requires the common output and permits only additive supplements", () => {
    expect(pack).toContain("COMMON REVIEW OUTPUT — REQUIRED FOR ALL REVIEWERS")
    expect(pack).toContain("REVIEWER-SPECIFIC SUPPLEMENTAL ANALYSIS IS ALLOWED")
    // The distinction that matters: a supplement must not be a substitution.
    expect(pack).toMatch(/must \*\*not\*\* be removed, renamed, omitted or replaced/)
    expect(pack).toMatch(/never replace, substitute for, or excuse omitting a common field/)
  })

  it("states that internal product rationale is not evidence", () => {
    expect(pack).toContain("# Product Rationale Is Not Evidence")
    // Every rationale field the pack carries has to be named, or a reviewer
    // could reasonably read an unnamed one as vetted fact.
    for (const field of [
      "`intent`",
      "`whyNeeded`",
      "`deeperBecause`",
      "Report targets",
      "PROPOSED INTERPRETATION BOUNDARY",
      "PROPOSED PROHIBITED INFERENCES",
    ]) {
      expect(pack, `rationale disclaimer omits ${field}`).toContain(field)
    }
    expect(pack).toMatch(/not scientific evidence/i)
    expect(pack).toMatch(/accept them, narrow them, reject them/i)
  })

  it("contains no bibliography that would correlate the three reviews", () => {
    // Each reviewer searches independently. A shared source list would produce
    // three correlated reviews and defeat running them separately.
    expect(pack).not.toMatch(/https?:\/\/(pubmed|doi|www\.ncbi)/i)
    expect(pack).toMatch(/deliberately contains no bibliography/i)
  })
})
