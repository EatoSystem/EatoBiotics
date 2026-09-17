import { describe, it, expect } from "vitest"

import { toPresentation } from "@/lib/report/presentation/model"
import { renderKey } from "@/lib/report/presentation/keys"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

import { reportFor } from "./narrative-fixtures"

/**
 * The Presentation Model — Phase 4B-S2.
 *
 * ══ WHY EVERY FIXTURE COMES FROM THE REAL COMPOSER ══════════════════════════
 *
 * `reportFor` composes through `composePersonalFoodSystemReport`. A hand-written
 * mock Report would be a fiction that drifts from what the composer actually
 * emits, and a projection proven against a fiction proves nothing about the
 * document a customer would receive.
 */

const YOU = reportFor("you")
const FAMILY = reportFor("family")

/** Practical constraint: not safety, not a declined disclosure, not "none". */
const CONSTRAINTS_KNOWN = reportFor("you", {
  core_environment_constraints_v1: ["budget"],
})

/** A declined disclosure. Never equivalent to "nothing to work around". */
const UNDISCLOSED = reportFor("you", {
  core_environment_constraints_v1: ["prefer-not-to-say"],
})

/**
 * Every field on the canonical document that must never cross the boundary.
 *
 * Checked as KEYS ANYWHERE in the serialised model rather than field by field:
 * a leak nested three levels down in a block nobody thought about is exactly
 * the leak a per-field assertion misses.
 */
const FORBIDDEN_KEYS = [
  "id",
  "kind0", // placeholder replaced below; `kind` is a legitimate model discriminator
  "sources",
  "sourceQuestionIds",
  "sourceFields",
  "basis",
  "allowedUse",
  "target",
  "templateId",
  "evidenceStatus",
  "requiredCapabilities",
  "suppressionReasons",
  "specificFoodsSuppressed",
  "state",
  "provenance",
  "handoffId",
  "bankVersion",
  "bankFingerprint",
  "scienceContractVersion",
  "finalisationVersion",
  "reportUseRecordVersion",
  "composerVersion",
  "contentPackVersion",
  "capabilitiesAtCompose",
  "reportSchemaVersion",
].filter((k) => k !== "kind0")

function everyKey(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) everyKey(entry, found)
    return found
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      found.add(key)
      everyKey(entry, found)
    }
  }
  return found
}

describe("the exposure boundary", () => {
  it.each([
    ["you", YOU],
    ["family", FAMILY],
    ["constraints-known", CONSTRAINTS_KNOWN],
    ["undisclosed", UNDISCLOSED],
  ])("emits no engine field anywhere in the %s model", (_name, report) => {
    const keys = everyKey(toPresentation(report))
    // Non-vacuity: a walker that found nothing would pass every assertion below.
    expect(keys.size).toBeGreaterThan(5)
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(keys.has(forbidden), `leaked key: ${forbidden}`).toBe(false)
    }
  })

  it("never carries a proposition id as a value, even under a renamed key", () => {
    // A leak does not have to keep its field name. Every proposition id in the
    // canonical Report is searched for as a SUBSTRING of the serialised model.
    const ids = [
      ...YOU.systemSnapshot.propositions,
      ...YOU.priorityLever.propositions,
      ...YOU.constraints.propositions,
      ...YOU.thirtyDayLoop.map((step) => step.proposition),
      ...(YOU.quotation ? [YOU.quotation] : []),
    ].map((p) => p.id)

    expect(ids.length).toBeGreaterThan(3)
    const serialised = JSON.stringify(toPresentation(YOU))
    for (const id of ids) {
      expect(serialised.includes(id), `leaked id: ${id}`).toBe(false)
    }
  })

  it("never carries a templateId or a bank fingerprint as a value", () => {
    const serialised = JSON.stringify(toPresentation(YOU))
    for (const template of YOU.systemSnapshot.propositions.map((p) => p.templateId)) {
      expect(serialised.includes(template), `leaked template: ${template}`).toBe(false)
    }
    expect(serialised.includes(YOU.provenance.bankFingerprint)).toBe(false)
    expect(serialised.includes(YOU.provenance.handoffId)).toBe(false)
    expect(serialised.includes(YOU.provenance.composerVersion)).toBe(false)
  })

  it("emits exactly the allowed top-level fields", () => {
    expect(Object.keys(toPresentation(YOU)).sort()).toEqual([
      "blocks",
      "finalisedAt",
      "foundation",
    ])
  })

  it("carries finalisedAt, and no other provenance", () => {
    const model = toPresentation(YOU)
    expect(model.finalisedAt).toBe(YOU.provenance.finalisedAt)
    expect(JSON.stringify(model).includes(YOU.provenance.scienceContractVersion)).toBe(false)
  })
})

describe("the model invents nothing", () => {
  function canonicalStrings(report: PersonalFoodSystemReportV1): Set<string> {
    const strings = new Set<string>([
      report.systemSnapshot.title,
      report.priorityLever.title,
      report.constraints.title,
      ...report.systemSnapshot.propositions.map((p) => p.text),
      ...report.priorityLever.propositions.map((p) => p.text),
      ...report.constraints.propositions.map((p) => p.text),
      ...report.thirtyDayLoop.map((s) => s.proposition.text),
      ...report.thirtyDayLoop.map((s) => s.beat),
    ])
    if (report.familyContext) {
      strings.add(report.familyContext.title)
      for (const p of report.familyContext.propositions) strings.add(p.text)
    }
    if (report.quotation) strings.add(report.quotation.text)
    if (report.safety.note) strings.add(report.safety.note)
    // The one heading the presentation layer supplies, because the canonical
    // document has no title for the loop — it is an array, not a section.
    strings.add("Your first thirty days")
    return strings
  }

  it.each([
    ["you", YOU],
    ["family", FAMILY],
    ["undisclosed", UNDISCLOSED],
  ])("every customer-visible string in the %s model is canonical", (_name, report) => {
    const allowed = canonicalStrings(report)
    const model = toPresentation(report)

    let checked = 0
    for (const block of model.blocks) {
      if ("title" in block) {
        expect(allowed.has(block.title), `invented title: ${block.title}`).toBe(true)
        checked += 1
      }
      if (block.kind === "prose") {
        for (const line of block.lines) {
          expect(allowed.has(line.text), `invented line: ${line.text}`).toBe(true)
          checked += 1
        }
      }
      if (block.kind === "lever") {
        expect(allowed.has(block.line.text)).toBe(true)
        checked += 1
      }
      if (block.kind === "loop") {
        for (const step of block.steps) {
          expect(allowed.has(step.text)).toBe(true)
          expect(allowed.has(step.beat)).toBe(true)
          checked += 2
        }
      }
      if (block.kind === "quotation" || block.kind === "note") {
        expect(allowed.has(block.text)).toBe(true)
        checked += 1
      }
    }
    // Non-vacuity again: a model with no blocks would pass the loop above.
    expect(checked).toBeGreaterThan(8)
  })

  it("adds no score, band or metric of any kind", () => {
    // The canonical document has no metric by design. A presentation layer that
    // computed one would be asserting something no content pack authorised.
    const serialised = JSON.stringify(toPresentation(YOU))
    for (const word of ["score", "band", "percent", "rating", "grade", "total"]) {
      expect(serialised.toLowerCase().includes(`"${word}"`), word).toBe(false)
    }
  })
})

describe("structural render keys", () => {
  it("are unique across a whole Report", () => {
    for (const report of [YOU, FAMILY, UNDISCLOSED]) {
      const model = toPresentation(report)
      const keys: string[] = []
      for (const block of model.blocks) {
        keys.push(block.key)
        if (block.kind === "prose") keys.push(...block.lines.map((l) => l.key))
        if (block.kind === "lever") keys.push(block.line.key)
        if (block.kind === "loop") keys.push(...block.steps.map((s) => s.key))
      }
      expect(keys.length).toBeGreaterThan(8)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it("are derived from position, so they are identical across two compositions", () => {
    const first = toPresentation(reportFor("you"))
    const second = toPresentation(reportFor("you"))
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it("read as region and ordinal", () => {
    expect(renderKey("loop", 2)).toBe("loop:2")
    expect(renderKey("lever")).toBe("lever")
  })
})

describe("block composition against real composer output", () => {
  it("orders the you Report snapshot → lever → loop → quotation", () => {
    expect(toPresentation(YOU).blocks.map((b) => b.region)).toEqual([
      "snapshot",
      "lever",
      "loop",
      "quotation",
    ])
  })

  it("places household context after the loop and before the quotation", () => {
    expect(toPresentation(FAMILY).blocks.map((b) => b.region)).toEqual([
      "snapshot",
      "lever",
      "loop",
      "family",
      "quotation",
    ])
  })

  it("carries exactly one priority lever", () => {
    const lever = toPresentation(YOU).blocks.find((b) => b.kind === "lever")
    expect(lever).toBeDefined()
    expect(lever && "line" in lever && typeof lever.line.text).toBe("string")
  })

  it("carries four loop beats, in week order", () => {
    const loop = toPresentation(YOU).blocks.find((b) => b.kind === "loop")
    expect(loop && loop.kind === "loop" && loop.steps.map((s) => s.week)).toEqual([1, 2, 3, 4])
  })

  it("surfaces the reviewed safety note when the state calls for one", () => {
    expect(UNDISCLOSED.safety.note).toBeTruthy()
    const note = toPresentation(UNDISCLOSED).blocks.find((b) => b.kind === "note")
    expect(note && note.kind === "note" && note.text).toBe(UNDISCLOSED.safety.note)
  })

  it("omits the constraints block rather than rendering an empty heading", () => {
    // A heading with nothing under it reads as a hole where a promise was.
    expect(YOU.constraints.propositions).toHaveLength(0)
    expect(toPresentation(YOU).blocks.some((b) => b.region === "constraints")).toBe(false)
  })
})

/*
 * ══ A PRODUCT GAP THIS PHASE FOUND AND DID NOT PAPER OVER ═══════════════════
 *
 * `constraints-known` is the state where a customer TOLD us what they work
 * around. All fifteen constraint sentences are suppressed by the open dietetic
 * gate, and `report-safety.ts` sets a note only for `unresolved-avoidance`,
 * `undisclosed` and `contradictory` — not for this one.
 *
 * So the Report says NOTHING about constraints the customer disclosed. The test
 * below pins that as the current truth rather than hiding it. A renderer must
 * not invent reassuring copy to fill the silence — that would be exactly the
 * "adding information the canonical Report does not contain" this phase
 * forbids — so closing it belongs to whoever owns the content pack and the
 * gate, and it is raised in the PR rather than patched here.
 */
describe("the silent-constraints state, pinned rather than hidden", () => {
  it("a customer who declared constraints is told nothing about them", () => {
    expect(CONSTRAINTS_KNOWN.safety.state).toBe("constraints-known")
    expect(CONSTRAINTS_KNOWN.constraints.propositions).toHaveLength(0)
    expect(CONSTRAINTS_KNOWN.safety.note).toBeUndefined()

    const regions = toPresentation(CONSTRAINTS_KNOWN).blocks.map((b) => b.region)
    expect(regions).not.toContain("constraints")
    expect(regions).not.toContain("safety")
  })
})
