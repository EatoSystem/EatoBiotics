import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { templateFor } from "@/lib/report/deterministic/content-pack"
import type { ReportProposition } from "@/lib/report/deterministic/proposition"
import { projectForRewrite } from "@/lib/report/narrative/project"
import { buildNarrativeOverlay } from "@/lib/report/narrative/overlay"

import { echoRewriter, reportFor } from "./narrative-fixtures"

/**
 * Payload minimisation — Phase 4A-S3.
 *
 * ══ THE CLAIM BEING TESTED ══════════════════════════════════════════════════
 *
 * "One approved sentence leaves the application, and nothing else." That is a
 * claim about every payload that was ever built, so it is tested two ways:
 * exhaustively against a POISONED proposition for every reviewed sentence in
 * the pack, and end-to-end against real composed Reports through a recorder
 * that keeps every object it was handed.
 */

/** Sentinels that must never appear in a payload, whatever the field. */
const SECRETS = {
  id: "SECRET-PROPOSITION-ID",
  questionId: "SECRET-QUESTION-ID",
  value: "SECRET-ANSWER-VALUE",
  field: "SECRET-SOURCE-FIELD",
  templateId: "SECRET-TEMPLATE-ID",
  target: "SECRET-TARGET",
  basis: "SECRET-BASIS",
  use: "SECRET-ALLOWED-USE",
  evidence: "SECRET-EVIDENCE-STATUS",
  capability: "SECRET-CAPABILITY",
}

/**
 * A proposition whose every field except `text` is a tracer.
 *
 * Typed loosely on purpose: the point is to model a proposition carrying
 * anything at all in its metadata, including values the real types would not
 * permit, and to show that none of it can reach the wire.
 */
function poisoned(text: string, kind: string): ReportProposition {
  return {
    id: SECRETS.id,
    kind,
    sources: [{ questionId: SECRETS.questionId, value: SECRETS.value }],
    sourceQuestionIds: [SECRETS.questionId],
    sourceFields: [SECRETS.field],
    basis: SECRETS.basis,
    allowedUse: SECRETS.use,
    target: SECRETS.target,
    templateId: SECRETS.templateId,
    text,
    evidenceStatus: SECRETS.evidence,
    requiredCapabilities: [SECRETS.capability],
  } as unknown as ReportProposition
}

/** Every reviewed sentence in the pack — the whole corpus, not a sample. */
function everyReviewedSentence(): readonly string[] {
  const out: string[] = []
  for (const question of CONSULTATION_QUESTION_BANK) {
    for (const option of question.options ?? []) {
      const template = templateFor(question.id, option.value)
      if (template) out.push(template.text)
    }
  }
  return out
}

describe("the projection carries one sentence and nothing else", () => {
  const corpus = everyReviewedSentence()

  it("covers the whole reviewed corpus, so the assertions below are exhaustive", () => {
    expect(corpus.length).toBe(112)
  })

  it("produces exactly one key, for every eligible kind and every sentence", () => {
    for (const kind of ["recap", "lever", "constraint"]) {
      for (const text of corpus) {
        const result = projectForRewrite(poisoned(text, kind))
        expect(result.ok, `${kind} was refused`).toBe(true)
        if (!result.ok) continue
        expect(Object.keys(result.request)).toEqual(["text"])
        expect(result.request.text).toBe(text)
      }
    }
  })

  it("leaks no field of a poisoned proposition, for every sentence", () => {
    for (const text of corpus) {
      const result = projectForRewrite(poisoned(text, "recap"))
      expect(result.ok).toBe(true)
      if (!result.ok) continue
      const serialised = JSON.stringify(result.request)
      for (const [field, secret] of Object.entries(SECRETS)) {
        expect(serialised, `${field} escaped in the payload`).not.toContain(secret)
      }
    }
  })

  it("refuses to build a payload for an ineligible kind", () => {
    for (const [kind, reason] of [
      ["quotation", "ineligible-quotation"],
      ["loop-step", "ineligible-loop-step"],
      ["provenance", "narrative-disabled"],
    ] as const) {
      const result = projectForRewrite(poisoned("You told us something.", kind))
      expect(result.ok).toBe(false)
      if (result.ok) continue
      expect(result.reason).toBe(reason)
    }
  })

  it("returns a frozen request, so a caller cannot decorate it after the fact", () => {
    const result = projectForRewrite(poisoned("You told us something.", "recap"))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const mutable = result.request as unknown as Record<string, unknown>
    expect(() => {
      "use strict"
      mutable.propositionId = SECRETS.id
    }).toThrow()
    expect(Object.keys(result.request)).toEqual(["text"])
  })
})

describe("nothing but the sentence crosses the boundary end to end", () => {
  for (const foundation of ["you", "family"] as const) {
    it(`${foundation}: every recorded payload is exactly { text }`, async () => {
      const report = reportFor(foundation)
      const rewriter = echoRewriter()
      await buildNarrativeOverlay({ report, rewriter, enabled: true })

      expect(rewriter.calls.length).toBeGreaterThan(0)
      for (const call of rewriter.calls) {
        expect(Object.keys(call)).toEqual(["text"])
      }
    })

    it(`${foundation}: no identifier, field name or provenance value is in any payload`, async () => {
      const report = reportFor(foundation)
      const rewriter = echoRewriter()
      await buildNarrativeOverlay({ report, rewriter, enabled: true })
      const wire = JSON.stringify(rewriter.calls)

      const forbidden = new Set<string>()
      for (const proposition of [
        ...report.systemSnapshot.propositions,
        ...report.priorityLever.propositions,
        ...(report.familyContext?.propositions ?? []),
      ]) {
        forbidden.add(proposition.id)
        forbidden.add(proposition.templateId)
        forbidden.add(String(proposition.target))
        forbidden.add(String(proposition.basis))
        forbidden.add(String(proposition.evidenceStatus))
        for (const source of proposition.sources) forbidden.add(source.questionId)
        for (const field of proposition.sourceFields) forbidden.add(field)
      }
      // The handoff id and the seal's timestamp are the two pieces of
      // finalisation data closest to the layer; neither has any business here.
      forbidden.add(report.provenance.handoffId)
      forbidden.add(report.provenance.finalisedAt)
      forbidden.add(report.provenance.bankFingerprint)

      for (const secret of forbidden) {
        expect(wire, `"${secret}" reached the rewriter`).not.toContain(secret)
      }
    })

    /**
     * The raw answer VALUE is deliberately not on the forbidden list above,
     * and pretending otherwise would be a false claim.
     *
     * A value like `fullness` is also a word in the reviewed sentence that
     * describes it — "You told us fullness that stays with you is the thing
     * you tend to notice after eating." There is no way to send that approved
     * sentence without sending that word, and no reason to: the sentence is
     * the reviewed, customer-facing rendering of the answer, which is exactly
     * what this layer exists to restyle.
     *
     * What must be true instead is stronger and checkable: the payload is
     * nothing BUT that sentence, character for character. A value can only
     * appear inside an approved sentence, never as a field of its own.
     */
    it(`${foundation}: every payload is a verbatim canonical sentence and nothing more`, async () => {
      const report = reportFor(foundation)
      const rewriter = echoRewriter()
      await buildNarrativeOverlay({ report, rewriter, enabled: true })

      const canonical = new Set(
        [
          ...report.systemSnapshot.propositions,
          ...report.priorityLever.propositions,
          ...report.constraints.propositions,
          ...(report.familyContext?.propositions ?? []),
        ].map((p) => p.text),
      )
      for (const call of rewriter.calls) {
        expect(canonical.has(call.text), `not a canonical sentence: ${call.text}`).toBe(true)
      }
    })
  }
})

describe("the payload is built in exactly one place", () => {
  const dir = join(process.cwd(), "lib", "report", "narrative")
  const read = (file: string) => readFileSync(join(dir, file), "utf8")

  it("only project.ts constructs a request object", () => {
    for (const file of [
      "contract.ts",
      "types.ts",
      "order.ts",
      "lexicons.ts",
      "validate.ts",
      "prompt.ts",
      "overlay.ts",
    ]) {
      expect(read(file), `${file} builds a payload`).not.toMatch(/\{\s*text:/)
    }
    expect(read("project.ts")).toMatch(/\{\s*text:\s*proposition\.text\s*\}/)
  })

  it("project.ts names no withheld field of a proposition", () => {
    const source = read("project.ts")
    for (const field of [
      "sources",
      "sourceQuestionIds",
      "sourceFields",
      "basis",
      "evidenceStatus",
      "templateId",
      "target",
      "requiredCapabilities",
    ]) {
      // Matched as a property access or a field declaration, so the prose
      // above the function may still explain what is being withheld — a guard
      // that forbade naming the thing it protects would forbid its own reason.
      expect(source, `project.ts reads ${field}`).not.toMatch(
        new RegExp(`proposition\\.${field}\\b|\\b${field}\\??\\s*:`),
      )
    }
  })
})
