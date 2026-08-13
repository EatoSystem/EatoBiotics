import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import {
  GENERATION_SOURCES,
  isGenerationSource,
  readGenerationSource,
  withGenerationSource,
  sessionTag,
  type GenerationSource,
} from "@/lib/report/generation-provenance"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { reconcileAddonLens } from "@/lib/report/addon-lens"
import { ensureFoodSystem, buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { parseFoodSystemReport } from "@/lib/report/food-system-report-types"
import { overallReportStatus, reportViewState } from "@/lib/report-status"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import { sanitizeLensAnswers, lensQuestionId } from "@/lib/assessment/addon-questions"
import type { DeepReport } from "@/lib/claude-report"

/**
 * Report-content provenance.
 *
 * The gap this closes: when Claude answered but the merged foodSystem failed
 * validation, the route shipped the derived base and left `report_error` null —
 * so the row was indistinguishable from a clean generation, and #222 could not
 * prove a real model run had happened.
 *
 * The marker describes the CONTENT, which is what makes reuse correct: re-serving
 * a stored report, or attaching a derived lens to it, does not change who wrote
 * the prose.
 */

const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }
const overall = computeOverall(SUB)
const profile = getProfile(overall, SUB)

const core = (mode: "you" | "family" | "combined" = "combined") =>
  buildFoodSystemReport({ mode, subScores: SUB, overall, profile })

const fallback = (mode: "you" | "family" | "combined" = "combined") =>
  buildFallbackPaidReport({
    tier: "premium", overall, subScores: { ...SUB }, profile,
    questions: [], answers: {}, mode,
  }) as DeepReport

const lensAnswers = (addon: AddonType) =>
  sanitizeLensAnswers(addon, { [lensQuestionId(addon, 1)]: "unpredictable" })

describe("the source value is a closed, validated set", () => {
  it("recognises exactly the five documented states", () => {
    expect([...GENERATION_SOURCES].sort()).toEqual([
      "claude_generated",
      "deterministic_claude_error",
      "deterministic_no_api_key",
      "deterministic_validation_failure",
      "legacy_unknown",
    ])
  })

  it.each(GENERATION_SOURCES)("%s is accepted", (s) => expect(isGenerationSource(s)).toBe(true))

  it.each([["unknown string", "reused"], ["empty", ""], ["number", 7], ["object", {}], ["null", null]])(
    "rejects %s",
    (_l, v) => expect(isGenerationSource(v)).toBe(false),
  )
})

describe("reading provenance off a stored report", () => {
  it.each(GENERATION_SOURCES)("round-trips %s", (source) => {
    const stamped = withGenerationSource(fallback(), source)
    expect(readGenerationSource(stamped)).toBe(source)
  })

  it.each([
    ["a legacy report with no _meta", fallback()],
    ["_meta present but empty", { ...fallback(), _meta: {} }],
    ["_meta not an object", { ...fallback(), _meta: "claude_generated" }],
    ["an unrecognised value", { ...fallback(), _meta: { generationSource: "reused" } }],
    ["null", null],
    ["a string", "nope"],
  ])("%s reads as legacy_unknown", (_label, input) => {
    expect(readGenerationSource(input)).toBe("legacy_unknown")
  })
})

/**
 * The success path builds its report by spreading Claude's own parsed response.
 * If the stamp were applied before that spread, a model could choose its own
 * provenance.
 */
describe("the server is the only writer", () => {
  it("overwrites a model-supplied _meta", () => {
    const hostile = {
      ...fallback(),
      _meta: { generationSource: "claude_generated", injected: "ZZQX" },
    } as unknown as DeepReport
    const stamped = withGenerationSource(hostile, "deterministic_validation_failure")
    expect(readGenerationSource(stamped)).toBe("deterministic_validation_failure")
  })

  it("does not mutate the report it is given", () => {
    const original = fallback()
    const before = JSON.stringify(original)
    withGenerationSource(original, "claude_generated")
    expect(JSON.stringify(original)).toBe(before)
  })

  it("changes nothing but _meta — scores and content are untouched", () => {
    const before = fallback()
    const after = withGenerationSource(before, "claude_generated")
    const strip = (r: DeepReport) => {
      const { _meta: _drop, ...rest } = r as DeepReport & { _meta?: unknown }
      return JSON.stringify(rest)
    }
    expect(strip(after)).toBe(strip(before))
    expect(after.foodSystem!.bioticScores).toEqual(before.foodSystem!.bioticScores)
    expect(after.foodSystem!.systemSnapshot).toEqual(before.foodSystem!.systemSnapshot)
  })

  it.each(GENERATION_SOURCES)("a report stamped %s still validates", (source) => {
    const stamped = withGenerationSource(fallback(), source)
    expect(parseFoodSystemReport(stamped.foodSystem)).not.toBeNull()
  })
})

/**
 * Reuse preserves the ORIGINAL source. Enriching a stored report — adding a
 * food-system block or an add-on lens it lacked — is derivation, not generation,
 * and must not relabel it.
 */
describe("reuse preserves the original provenance", () => {
  const storedWith = (source: GenerationSource) =>
    withGenerationSource(fallback(), source) as DeepReport

  it.each(GENERATION_SOURCES)("a reused %s report keeps its source", (source) => {
    const stored = storedWith(source)
    const reused = reconcileAddonLens(
      ensureFoodSystem(stored, { mode: "combined", subScores: SUB, overall, profile }),
      { addon: null, answers: {}, isFamily: false },
    )
    expect(readGenerationSource(reused)).toBe(source)
  })

  it("a legacy report without _meta reads legacy_unknown, and stays valid", () => {
    const legacy = fallback()
    expect((legacy as { _meta?: unknown })._meta).toBeUndefined()
    const reused = ensureFoodSystem(legacy, { mode: "combined", subScores: SUB, overall, profile })
    expect(readGenerationSource(reused)).toBe("legacy_unknown")
    expect(parseFoodSystemReport(reused.foodSystem)).not.toBeNull()
  })

  it.each(ADDON_KEYS)("%s: enriching a missing lens on reuse does not relabel", (addon) => {
    // A report generated deterministically, later reused by a customer entitled
    // to a lens it never had. The lens is derived and attached — the prose was
    // still not written by Claude.
    const stored = withGenerationSource(
      { ...fallback(), foodSystem: core() } as DeepReport,
      "deterministic_no_api_key",
    )
    expect(stored.foodSystem!.lens).toBeUndefined()

    const enriched = reconcileAddonLens(stored, {
      addon, answers: lensAnswers(addon), isFamily: false,
    })

    expect(enriched.foodSystem!.lens!.key).toBe(addon)
    expect(readGenerationSource(enriched)).toBe("deterministic_no_api_key")
    expect(readGenerationSource(enriched)).not.toBe("claude_generated")
  })

  it.each(ADDON_KEYS)("%s: a claude_generated report keeps its source through enrichment", (addon) => {
    const stored = withGenerationSource(
      { ...fallback(), foodSystem: core() } as DeepReport,
      "claude_generated",
    )
    const enriched = reconcileAddonLens(stored, {
      addon, answers: lensAnswers(addon), isFamily: false,
    })
    expect(readGenerationSource(enriched)).toBe("claude_generated")
  })

  it("no add-on: reuse leaves the report and its source untouched", () => {
    const stored = withGenerationSource(fallback("you"), "claude_generated")
    const reused = reconcileAddonLens(stored, { addon: null, answers: {}, isFamily: false })
    expect(readGenerationSource(reused)).toBe("claude_generated")
    expect(reused.foodSystem!.lens).toBeUndefined()
  })
})

/**
 * The marker must be inert. A deterministic fallback is still a successfully
 * delivered report, and provenance must not leak into delivery decisions.
 */
describe("delivery semantics are unaffected", () => {
  it.each(GENERATION_SOURCES)("%s: overall status depends only on pdf/email", (source) => {
    const stamped = withGenerationSource(fallback(), source)
    expect(stamped).toBeTruthy()
    // reportOk is hardcoded true by the route: a report always exists.
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: true })).toBe("complete")
    expect(overallReportStatus({ reportOk: true, pdfOk: false, emailOk: true })).toBe("partial")
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: false })).toBe("partial")
  })

  it.each(GENERATION_SOURCES)("%s: customer access depends only on status + presence", (source) => {
    const stamped = withGenerationSource(fallback(), source)
    expect(reportViewState("complete", Boolean(stamped))).toBe("view")
    expect(reportViewState("partial", Boolean(stamped))).toBe("view_delivery_pending")
    expect(reportViewState("complete", false)).toBe("resume_questionnaire")
  })

  it("a deterministic fallback is a complete, deliverable report", () => {
    const r = withGenerationSource(fallback(), "deterministic_validation_failure")
    expect(parseFoodSystemReport(r.foodSystem)).not.toBeNull()
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: true })).toBe("complete")
  })
})

describe("the correlation tag never carries the session id", () => {
  it("is a short one-way hash", () => {
    const id = "cs_test_a1b2c3d4e5f6g7h8"
    const tag = sessionTag(id)
    expect(tag).toMatch(/^[0-9a-f]{12}$/)
    expect(tag).not.toContain(id)
    expect(id).not.toContain(tag)
  })

  it("is stable and distinct per session", () => {
    expect(sessionTag("cs_a")).toBe(sessionTag("cs_a"))
    expect(sessionTag("cs_a")).not.toBe(sessionTag("cs_b"))
  })
})

/**
 * Route wiring. Source inspection, deliberately: the Claude call cannot be
 * exercised here, so the only way to pin which branch stamps which value is to
 * read it.
 */
describe("the route stamps every branch correctly", () => {
  const src = () => readFileSync("app/api/submit-deep-assessment/route.ts", "utf8")

  it.each([
    ["no API key", 'generationSource = "deterministic_no_api_key"'],
    ["Claude threw", 'generationSource = "deterministic_claude_error"'],
    ["reuse preserves", "generationSource = readGenerationSource(existingRow.report_json)"],
  ])("%s", (_label, needle) => expect(src()).toContain(needle))

  it("validation failure and success are decided by the same validated result", () => {
    expect(src()).toContain(
      'generationSource = validFoodSystem ? "claude_generated" : "deterministic_validation_failure"',
    )
  })

  it("stamps after the branches, so a model-supplied _meta cannot win", () => {
    const s = src()
    const stampAt = s.indexOf("report = withGenerationSource(report, generationSource)")
    expect(stampAt).toBeGreaterThan(-1)
    // After the spread of Claude's parsed response…
    expect(stampAt).toBeGreaterThan(s.indexOf("...(parsed as DeepReport)"))
    // …and before the row is persisted.
    expect(stampAt).toBeLessThan(s.indexOf("report_json: report"))
  })

  it("adds the operational message the validation-failure branch was missing", () => {
    expect(src()).toContain(
      'reportError = "Claude returned a foodSystem that failed validation — used derived base"',
    )
  })

  it("logs one structured event carrying only operational fields", () => {
    const s = src()
    const call = s.slice(s.indexOf("logGenerationSource({"), s.indexOf("// Step 6"))

    // Exactly the allowed keys — an added field has to be a deliberate edit here.
    const keys = [...call.matchAll(/^\s{4}(\w+)[,:]/gm)].map((m) => m[1]).sort()
    expect(keys).toEqual(["addon", "mode", "reuse", "sessionTag", "source", "tier"])

    // The raw session id is hashed, never logged directly.
    expect(call).toContain("sessionTag: sessionTag(sessionId)")
    expect(call.replace("sessionTag: sessionTag(sessionId)", "")).not.toContain("sessionId")

    // Nothing identifying or content-bearing. `existingRow?.report_json` is a
    // boolean coercion for the reuse flag, not logged content — so this checks
    // for the report OBJECT being passed, not the substring.
    expect(call).not.toMatch(/\banswers\b|\bquestions\b|leadName|\bemail\b|\bprofile\b/)
    expect(call).not.toMatch(/report_json: |report,|pdfUrl/)
  })

  it("does not let provenance reach overall_status or the owner alert", () => {
    const s = src()
    const statusBlock = s.slice(s.indexOf("const overall_status = overallReportStatus("))
    expect(statusBlock.slice(0, 400)).not.toContain("generationSource")
    const alertBlock = s.slice(s.indexOf("submit-deep-assessment-partial"))
    expect(alertBlock.slice(0, 500)).not.toContain("generationSource")
  })
})
