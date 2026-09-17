import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import {
  CONTENT_PACK_VERSION,
  STRUCTURAL_COPY,
} from "@/lib/report/deterministic/content-pack"
import {
  knownContentPackVersions,
  presentationCopyFor,
} from "@/lib/report/presentation/frozen-copy"
import { toPresentation, type PresentationReport } from "@/lib/report/presentation/model"
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
 * Unwrap a successful projection.
 *
 * `toPresentation` returns a result union because an unknown content-pack
 * version must refuse rather than fall back to today's wording. Every test
 * below that is not ABOUT that refusal asserts success first, so a regression
 * that starts refusing everything fails loudly here instead of quietly
 * satisfying assertions about an empty model.
 */
function present(report: PersonalFoodSystemReportV1): PresentationReport {
  const result = toPresentation(report)
  expect(result.ok, result.ok ? "" : result.reason).toBe(true)
  if (!result.ok) throw new Error(result.reason)
  return result.report
}

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
    const keys = everyKey(present(report))
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
    const serialised = JSON.stringify(present(YOU))
    for (const id of ids) {
      expect(serialised.includes(id), `leaked id: ${id}`).toBe(false)
    }
  })

  it("never carries a templateId or a bank fingerprint as a value", () => {
    const serialised = JSON.stringify(present(YOU))
    for (const template of YOU.systemSnapshot.propositions.map((p) => p.templateId)) {
      expect(serialised.includes(template), `leaked template: ${template}`).toBe(false)
    }
    expect(serialised.includes(YOU.provenance.bankFingerprint)).toBe(false)
    expect(serialised.includes(YOU.provenance.handoffId)).toBe(false)
    expect(serialised.includes(YOU.provenance.composerVersion)).toBe(false)
  })

  it("emits exactly the allowed top-level fields", () => {
    expect(Object.keys(present(YOU)).sort()).toEqual([
      "blocks",
      "finalisedAt",
      "foundation",
    ])
  })

  it("carries finalisedAt, and no other provenance", () => {
    const model = present(YOU)
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
    // The loop heading. `thirtyDayLoop` is an array, not a section, so it
    // carries no title of its own — but the reviewed pack has one, so this is
    // canonical copy rather than an allowance. The first version of this file
    // whitelisted a string the model had invented; that exception is gone, and
    // "invents nothing" now has none.
    strings.add(STRUCTURAL_COPY.thirtyDayLoopTitle)
    return strings
  }

  it.each([
    ["you", YOU],
    ["family", FAMILY],
    ["undisclosed", UNDISCLOSED],
  ])("every customer-visible string in the %s model is canonical", (_name, report) => {
    const allowed = canonicalStrings(report)
    const model = present(report)

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
    const serialised = JSON.stringify(present(YOU))
    for (const word of ["score", "band", "percent", "rating", "grade", "total"]) {
      expect(serialised.toLowerCase().includes(`"${word}"`), word).toBe(false)
    }
  })
})

describe("presentation copy is bound to the Report's own version", () => {
  /**
   * The loop heading is the one customer-visible string a Report cannot carry
   * itself. This layer got it wrong twice: it invented one, then read the LIVE
   * content pack — which would wrap tomorrow's wording around today's immutable
   * bytes the day `CONTENT_PACK_VERSION` moves. It now comes from a frozen
   * registry keyed by the Report's own recorded version.
   */

  it("a v1 Report always receives the frozen v1 title", () => {
    expect(YOU.provenance.contentPackVersion).toBe("content-pack-v1")
    const loop = present(YOU).blocks.find((b) => b.kind === "loop")
    expect(loop && loop.kind === "loop" && loop.title).toBe(
      presentationCopyFor("content-pack-v1")?.thirtyDayLoopTitle,
    )
  })

  it("the LIVE pack is not the runtime authority for a v1 Report", () => {
    // The heart of the repair. A Report recorded under v1 is presented while a
    // different "current" wording exists; the v1 output must not move. Asserted
    // against the frozen registry rather than the live constant, so the day the
    // live constant changes this test still describes v1.
    const frozenV1 = presentationCopyFor("content-pack-v1")!.thirtyDayLoopTitle
    const pretendCurrent = "A LATER PACK WOULD SAY SOMETHING ELSE"
    expect(frozenV1).not.toBe(pretendCurrent)

    const loop = present(YOU).blocks.find((b) => b.kind === "loop")
    const title = loop && loop.kind === "loop" ? loop.title : ""
    expect(title).toBe(frozenV1)
    expect(title).not.toBe(pretendCurrent)
  })

  it("an unknown content-pack version fails closed", () => {
    // Never a fallback to the newest entry: that would silently re-word exactly
    // the Reports too old for this build to describe.
    const fromTheFuture: PersonalFoodSystemReportV1 = {
      ...YOU,
      provenance: { ...YOU.provenance, contentPackVersion: "content-pack-v99" },
    }
    const result = toPresentation(fromTheFuture)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("unsupported-content-pack-version")
  })

  it("refuses before building any block, so nothing half-rendered escapes", () => {
    const blank: PersonalFoodSystemReportV1 = {
      ...YOU,
      provenance: { ...YOU.provenance, contentPackVersion: "" },
    }
    const result = toPresentation(blank)
    expect(result.ok).toBe(false)
    expect("report" in result).toBe(false)
  })

  it("never emits contentPackVersion into a successful model", () => {
    const serialised = JSON.stringify(present(YOU))
    expect(serialised).not.toContain("contentPackVersion")
    expect(serialised).not.toContain(YOU.provenance.contentPackVersion)
  })

  it("does not carry the heading this file once invented", () => {
    expect(presentationCopyFor("content-pack-v1")!.thirtyDayLoopTitle).not.toBe(
      "Your first thirty days",
    )
    expect(JSON.stringify(present(YOU))).not.toContain("Your first thirty days")
  })
})

describe("the frozen registry cannot drift with the live pack", () => {
  const STRIP_BLOCK = /\/\*[\s\S]*?\*\//g
  const STRIP_LINE = /(^|[^:])\/\/.*$/gm

  it("no file under lib/report/presentation imports the content pack", () => {
    // The assertion that matters most: it makes the bug impossible rather than
    // merely fixed, and it is the whole reason the strings are transcribed
    // instead of imported. Comments are stripped first — this layer TALKS about
    // the live pack at length, and a guard that matched its own explanation
    // would be "fixed" by deleting the explanation.
    const dir = join(process.cwd(), "lib/report/presentation")
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts"))
    expect(files.length).toBeGreaterThanOrEqual(3)

    for (const file of files) {
      const code = readFileSync(join(dir, file), "utf8")
        .replace(STRIP_BLOCK, "")
        .replace(STRIP_LINE, "$1")
      expect(code.includes("deterministic/content-pack"), `${file} imports the live pack`).toBe(
        false,
      )
      expect(code.includes("STRUCTURAL_COPY"), `${file} reads STRUCTURAL_COPY`).toBe(false)
    }
  })

  it("the guard would catch a real import", () => {
    // Non-vacuity: the comment-stripping must not have removed so much that
    // nothing could ever match.
    // Assembled from pieces rather than written as a literal: a literal copy of
    // the real import line is indistinguishable from the real import line, and
    // the last edit to this file rewrote it along with the genuine one.
    const packPath = ["@/lib", "report", "deterministic", "content-pack"].join("/")
    const planted = `import { ${"STRUCTURAL"}_COPY } from "${packPath}"`
    const stripped = planted.replace(STRIP_BLOCK, "").replace(STRIP_LINE, "$1")
    expect(stripped.includes("deterministic/content-pack")).toBe(true)
    expect(stripped.includes("STRUCTURAL_COPY")).toBe(true)
  })

  it("v1 was transcribed correctly, while v1 is still current", () => {
    // A tripwire, not a coupling. Duplication risks being wrong from day one,
    // so while CONTENT_PACK_VERSION is v1 the frozen wording must match the
    // live wording. Guarded on the current version so it retires itself when v2
    // lands rather than failing for the wrong reason — the same shape as S4's
    // Migration 48 digest pin. Tests may import the live pack; source may not.
    if (CONTENT_PACK_VERSION !== "content-pack-v1") return
    expect(presentationCopyFor("content-pack-v1")!.thirtyDayLoopTitle).toBe(
      STRUCTURAL_COPY.thirtyDayLoopTitle,
    )
  })

  it("knows exactly the versions it has frozen", () => {
    expect(knownContentPackVersions()).toEqual(["content-pack-v1"])
  })
})

describe("the quotation is atomic", () => {
  it("carries the lead-in and the quoted words as one unsplit string", () => {
    // `proposition.ts` builds it as `${quotationLeadIn} “${answer}”`, and
    // `compose.ts` records the intent: the customer's words appear in quotation
    // marks AFTER a lead-in that attributes them. A renderer may style the
    // whole sentence; it may not cut the reviewed string to isolate the quote.
    const quotation = present(YOU).blocks.find((b) => b.kind === "quotation")
    expect(quotation && quotation.kind === "quotation" && quotation.text).toBe(YOU.quotation?.text)
  })

  it("keeps the attribution attached to the words", () => {
    const quotation = present(YOU).blocks.find((b) => b.kind === "quotation")
    const text = quotation && quotation.kind === "quotation" ? quotation.text : ""
    expect(text.startsWith(STRUCTURAL_COPY.quotationLeadIn)).toBe(true)
    expect(text.length).toBeGreaterThan(STRUCTURAL_COPY.quotationLeadIn.length)
    // The model exposes no second field holding the bare answer — the only way
    // to render the quote is to render the whole attributed sentence.
    expect(Object.keys(quotation ?? {}).sort()).toEqual(["key", "kind", "printBreak", "region", "text"])
  })
})

describe("structural render keys", () => {
  it("are unique across a whole Report", () => {
    for (const report of [YOU, FAMILY, UNDISCLOSED]) {
      const model = present(report)
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
    const first = present(reportFor("you"))
    const second = present(reportFor("you"))
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it("read as region and ordinal", () => {
    expect(renderKey("loop", 2)).toBe("loop:2")
    expect(renderKey("lever")).toBe("lever")
  })
})

describe("block composition against real composer output", () => {
  it("orders the you Report snapshot → lever → loop → quotation", () => {
    expect(present(YOU).blocks.map((b) => b.region)).toEqual([
      "snapshot",
      "lever",
      "loop",
      "quotation",
    ])
  })

  it("places household context after the loop and before the quotation", () => {
    expect(present(FAMILY).blocks.map((b) => b.region)).toEqual([
      "snapshot",
      "lever",
      "loop",
      "family",
      "quotation",
    ])
  })

  it("carries exactly one priority lever", () => {
    const lever = present(YOU).blocks.find((b) => b.kind === "lever")
    expect(lever).toBeDefined()
    expect(lever && "line" in lever && typeof lever.line.text).toBe("string")
  })

  it("carries four loop beats, in week order", () => {
    const loop = present(YOU).blocks.find((b) => b.kind === "loop")
    expect(loop && loop.kind === "loop" && loop.steps.map((s) => s.week)).toEqual([1, 2, 3, 4])
  })

  it("surfaces the reviewed safety note when the state calls for one", () => {
    expect(UNDISCLOSED.safety.note).toBeTruthy()
    const note = present(UNDISCLOSED).blocks.find((b) => b.kind === "note")
    expect(note && note.kind === "note" && note.text).toBe(UNDISCLOSED.safety.note)
  })

  it("omits the constraints block rather than rendering an empty heading", () => {
    // A heading with nothing under it reads as a hole where a promise was.
    expect(YOU.constraints.propositions).toHaveLength(0)
    expect(present(YOU).blocks.some((b) => b.region === "constraints")).toBe(false)
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
describe("the pre-activation blocker is written down", () => {
  /**
   * Same discipline as `consultation-report-privacy.test.ts`, which guards the
   * S4 activation prerequisite in CLAUDE.md. A blocker that lives only in a
   * commit message is a note; a blocker somebody can delete without a test
   * failing is a note with extra steps.
   */
  const claude = readFileSync(join(process.cwd(), "CLAUDE.md"), "utf8")

  it("CLAUDE.md records the constraints-known blocker", () => {
    for (const phrase of [
      "PRE-ACTIVATION BLOCKER",
      "constraints-known",
      "specificFoods",
      "CONTENT_PACK_VERSION",
    ]) {
      expect(claude, `CLAUDE.md does not mention ${phrase}`).toContain(phrase)
    }
  })

  it("says plainly that the renderer must not invent the acknowledgement", () => {
    expect(claude).toContain("must not invent the acknowledgement")
    expect(claude).toContain("must not read trusted")
  })

  it("names the separate versioned repair rather than implying a renderer fix", () => {
    expect(claude).toContain("separate versioned deterministic-core")
  })
})

describe("the silent-constraints state, pinned rather than hidden", () => {
  it("a customer who declared constraints is told nothing about them", () => {
    expect(CONSTRAINTS_KNOWN.safety.state).toBe("constraints-known")
    expect(CONSTRAINTS_KNOWN.constraints.propositions).toHaveLength(0)
    expect(CONSTRAINTS_KNOWN.safety.note).toBeUndefined()

    const regions = present(CONSTRAINTS_KNOWN).blocks.map((b) => b.region)
    expect(regions).not.toContain("constraints")
    expect(regions).not.toContain("safety")
  })
})
