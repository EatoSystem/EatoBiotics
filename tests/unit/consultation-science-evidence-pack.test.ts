import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK, questionTextFor, supportTextFor } from "@/lib/consultation/question-bank"

/**
 * The canonical multi-model science evidence pack must describe the bank that
 * exists — exactly.
 *
 * ── Why this test is worth its weight ────────────────────────────────────────
 *
 * The pack is a frozen factual source handed identically to three independent
 * reviewers, who then judge wording that a paying customer would actually see.
 * A drifted pack does not fail loudly; it produces three confident reviews of
 * a question nobody is shipping. That is a worse outcome than no review, and it
 * would be invisible until someone re-read both documents side by side.
 *
 * So the exactness claims the pack makes about itself — EXACT CUSTOMER WORDING,
 * EXACT SUPPORT TEXT, EXACT ANSWER OPTIONS, EXACT SEMANTIC ANSWER FIELD, EXACT
 * REPORT TARGETS — are checked here against source rather than trusted.
 *
 * ── What this deliberately is NOT ────────────────────────────────────────────
 *
 * Not a Markdown parser. It asserts substring presence, which is enough to
 * catch the failure that matters (source changed, pack did not) without
 * building a fragile document model that would itself need maintaining. The
 * pack is documentation; the guard should stay smaller than the thing it
 * guards.
 */

const PACK = join(process.cwd(), "docs/phase-3a-multi-model-science-evidence-pack.md")

const sevenFromSource = CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "required")

describe("science-review scope", () => {
  it("exactly seven questions are flagged for science review", () => {
    expect(sevenFromSource.map((q) => q.id).sort()).toEqual(
      [
        "core_environment_constraints_v1",
        "core_environment_food_avoidances_v1",
        "core_rhythm_antibiotics_v1",
        "core_signals_context_v1",
        "core_signals_energy_shape_v1",
        "core_signals_post_meal_pattern_v1",
        "core_signals_settled_days_v1",
      ].sort(),
    )
  })

  it("nothing is marked scientifically reviewed", () => {
    // The review has not happened. No model may set this, and the evidence
    // pack exists precisely because it has not.
    expect(CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "reviewed")).toEqual([])
  })
})

describe("the evidence pack matches source exactly", () => {
  const pack = existsSync(PACK) ? readFileSync(PACK, "utf8") : ""

  it("exists", () => {
    expect(existsSync(PACK)).toBe(true)
    expect(pack.length).toBeGreaterThan(10_000)
  })

  it("covers every science-review question and no others", () => {
    for (const q of sevenFromSource) {
      expect(pack, `${q.id} missing from the pack`).toContain(q.id)
    }
    // A question that stopped being flagged must not linger in the pack, or
    // reviewers would spend effort on something no longer in scope.
    //
    // The exception is a trigger: an adaptive question under review is only
    // intelligible if the reviewer can see what reveals it, so the ids of the
    // seven's applicability parents legitimately appear. Derived from source
    // rather than listed, so it cannot silently widen into "any id may appear".
    const triggers = new Set(
      sevenFromSource.map((q) => q.applicableWhen?.questionId).filter((id): id is string => Boolean(id)),
    )
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.scienceReview === "required" || triggers.has(q.id)) continue
      expect(pack, `${q.id} is in the pack but is neither under review nor a trigger`).not.toContain(q.id)
    }
  })

  it.each(sevenFromSource.map((q) => [q.id, q] as const))(
    "%s — customer wording, support text, options, answer field and report targets are verbatim",
    (_id, q) => {
      for (const foundation of q.foundations) {
        expect(pack, `${q.id} ${foundation} wording`).toContain(questionTextFor(q, foundation))
        const support = supportTextFor(q, foundation)
        if (support) expect(pack, `${q.id} ${foundation} support text`).toContain(support)
      }

      for (const o of q.options ?? []) {
        expect(pack, `${q.id} option label "${o.label}"`).toContain(o.label)
        expect(pack, `${q.id} option value "${o.value}"`).toContain(`\`${o.value}\``)
        if (o.familyLabel) expect(pack, `${q.id} family label`).toContain(o.familyLabel)
      }

      expect(pack, `${q.id} answerField`).toContain(`\`${q.answerField}\``)
      for (const t of q.reportTargets) expect(pack, `${q.id} reportTarget ${t}`).toContain(t)

      // Documentation carried as data — reviewers judge the stated intent, so
      // a paraphrase would have them assessing something the product does not
      // actually claim.
      expect(pack, `${q.id} intent`).toContain(q.intent)
      expect(pack, `${q.id} whyNeeded`).toContain(q.whyNeeded)
    },
  )

  it("represents adaptive rules and required/optional state accurately", () => {
    for (const q of sevenFromSource) {
      const rule = q.applicableWhen
      if (!rule) continue
      expect(pack, `${q.id} trigger`).toContain(rule.questionId)
      expect(pack, `${q.id} operator`).toContain(rule.operator)
      for (const v of rule.values) expect(pack, `${q.id} trigger value ${v}`).toContain(`\`${v}\``)
    }
    // The two optional ones are the two high-sensitivity ones; if that stops
    // being true the pack's sensitivity story is wrong.
    const optional = sevenFromSource.filter((q) => !q.required).map((q) => q.id).sort()
    expect(optional).toEqual(["core_environment_food_avoidances_v1", "core_rhythm_antibiotics_v1"])
    for (const id of optional) {
      expect(CONSULTATION_QUESTION_BANK.find((q) => q.id === id)?.sensitivity).toBe("high")
    }
  })

  it("carries the frozen provenance", () => {
    expect(pack).toContain("097cc6df961929742098e869066460fd49e08bef")
    expect(pack).toContain("60b5b8d97dbf14205b90853f2339eb4f0534dc15")
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

  it("contains no bibliography that would correlate the three reviews", () => {
    // Each reviewer searches independently. A shared source list would produce
    // three correlated reviews and defeat running them separately.
    expect(pack).not.toMatch(/https?:\/\/(pubmed|doi|www\.ncbi)/i)
    expect(pack).toMatch(/deliberately contains no bibliography/i)
  })
})
