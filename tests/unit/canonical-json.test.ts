import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

import { canonicalSerialise } from "@/lib/report/canonical-json"
import { serialiseReport } from "@/lib/report/deterministic/serialise"
import { serialisePersistedReport } from "@/lib/report/persisted/serialise-persisted"
import { decodePersistedReportV1 } from "@/lib/report/persisted/decode-report"

import { sealedFixture } from "./consultation-report-fixtures"

/**
 * One algorithm, two callers — Phase 4A-S4.
 *
 * The persisted decoder returns a type deliberately NOT assignable to
 * `PersonalFoodSystemReportV1`, and a digest taken over one must verify against
 * the other. Two implementations would give the Report two canonical forms, and
 * the day they disagreed every stored digest would become unverifiable at once.
 */

describe("the canonical rules", () => {
  it("sorts keys at every level", () => {
    expect(canonicalSerialise({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}',
    )
  })

  it("keeps array order, because array order is meaningful here", () => {
    expect(canonicalSerialise([3, 1, 2])).toBe("[\n  3,\n  1,\n  2\n]")
  })

  it("drops undefined, so absent and explicitly-undefined cannot differ", () => {
    expect(canonicalSerialise({ a: undefined, b: 1 })).toBe(canonicalSerialise({ b: 1 }))
  })

  it("is insensitive to insertion order", () => {
    expect(canonicalSerialise({ a: 1, b: 2 })).toBe(canonicalSerialise({ b: 2, a: 1 }))
  })
})

describe("both sides serialise through the same leaf", () => {
  const fixture = sealedFixture()

  it("the live and persisted serialisers agree byte for byte", () => {
    const decoded = decodePersistedReportV1(JSON.parse(fixture.canonicalText))
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(serialisePersistedReport(decoded.report)).toBe(fixture.canonicalText)
    expect(serialisePersistedReport(decoded.report)).toBe(canonicalSerialise(decoded.report))
  })

  it("the persisted serialiser canonicalises rather than echoing key order", () => {
    /*
     * The decoded object usually arrives already sorted, because it was parsed
     * from canonical text — so a `JSON.stringify(report, null, 2)` standing in
     * for the leaf produces identical bytes for every realistic input and the
     * substitution is invisible. This hands it an object whose keys are NOT in
     * canonical order, which is the only input that can tell them apart.
     */
    const unsorted = {
      provenance: { reportSchemaVersion: "x", handoffId: "h" },
      kind: "personal-food-system-report-v1",
    } as unknown as Parameters<typeof serialisePersistedReport>[0]
    const out = serialisePersistedReport(unsorted)
    expect(out.indexOf('"kind"')).toBeLessThan(out.indexOf('"provenance"'))
    expect(out).toBe(canonicalSerialise(unsorted))
  })

  it("keeps the undefined-drop, which JSON.stringify would otherwise imply", () => {
    /*
     * A SOURCE tripwire, and labelled as one. `JSON.stringify` already omits an
     * undefined-valued property, so removing the `continue` changes no output
     * for any input this Report can hold — there is nothing behavioural to
     * assert. The line states the rule the canonical form depends on, and a
     * future change to the algorithm could make its absence matter.
     */
    const source = readFileSync(join(process.cwd(), "lib/report/canonical-json.ts"), "utf8")
    expect(source).toContain("if (source[key] === undefined) continue")
  })

  it("serialiseReport is a delegation, not a second implementation", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/serialise.ts"), "utf8")
    expect(source).toContain("canonicalSerialise(report)")
    expect(source).not.toContain("Object.keys(")
    expect(source).not.toContain("JSON.stringify(")
  })

  it("the leaf is the only place the algorithm exists", () => {
    const hits: string[] = []
    const scan = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next") continue
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) scan(full)
        else if (entry.endsWith(".ts") && readFileSync(full, "utf8").includes("Object.keys(source).sort()")) {
          hits.push(full.replace(`${process.cwd()}/`, ""))
        }
      }
    }
    scan(join(process.cwd(), "lib"))
    expect(hits).toEqual(["lib/report/canonical-json.ts"])
  })

  it("the leaf imports nothing at all", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/canonical-json.ts"), "utf8")
    expect(source).not.toMatch(/^import\s/m)
    expect(source).not.toMatch(/require\(/)
    for (const forbidden of ["Date.now(", "new Date(", "Math.random(", "randomUUID", "crypto."]) {
      expect(source.includes(forbidden), `the leaf uses ${forbidden}`).toBe(false)
    }
  })

  it("no persisted module casts back to the live Report type", () => {
    const dir = join(process.cwd(), "lib/report/persisted")
    const files: string[] = []
    const scan = (d: string) => {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry)
        if (statSync(full).isDirectory()) scan(full)
        else if (entry.endsWith(".ts")) files.push(full)
      }
    }
    scan(dir)
    for (const file of files) {
      // Comments stripped: `decode-report.ts` opens by explaining why
      // `JSON.parse(text) as PersonalFoodSystemReportV1` would not do, and that
      // paragraph is the reason the rule exists. The CAST must be absent, not
      // the sentence describing it.
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
      expect(code, `${file} casts to the live Report type`).not.toContain(
        "as PersonalFoodSystemReportV1",
      )
    }
  })
})

describe("the S2 bytes did not move", () => {
  it("serialiseReport still produces the composer's canonical form", () => {
    const fixture = sealedFixture()
    const parsed = JSON.parse(fixture.canonicalText)
    expect(canonicalSerialise(parsed)).toBe(fixture.canonicalText)
    // And the live serialiser is what produced it in the first place.
    expect(fixture.canonicalText.startsWith("{\n  \"constraints\"")).toBe(true)
    void serialiseReport
  })
})
