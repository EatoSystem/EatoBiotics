/**
 * The import fence around the action layer.
 *
 * ══ WHY A FENCE AND NOT A CONVENTION ════════════════════════════════════════
 *
 * Four of the things this layer must not do are expressible as imports, which
 * makes them checkable rather than hopeful:
 *
 *   AI IS NOT THE RECOMMENDATION AUTHORITY   no model client, no AI guard
 *   AN ACTION IS NOT A BIOTIC                no lib/pillars.ts, no lib/biotics
 *   THE SCIENCE CONTRACT IS CITED, NOT HELD  no lib/consultation/**
 *   THE PAID REPORT IS A DIFFERENT PRODUCT   no lib/report/** except the
 *                                            Gate 2 comparison primitive
 *
 * The third is not a preference. `consultation-science-contract-implementation`
 * pins the contract's importer set BY VALUE to five files and then asserts every
 * importer sits under `lib/report/deterministic/` or `lib/report/narrative/`.
 * A sixth importer fails CI, so `lib/fss/**` cannot import the boundary its own
 * copy must obey — it cites it in comments and transcribes the rules instead.
 * Worth having a test say so, before somebody "fixes" the missing import.
 *
 * Same shape as the fence on `components/report/canonical/`: parsed from the
 * import statements, comment-stripped, and non-vacuous.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"

/** Every file in the action layer and its presentation copy. */
function fencedFiles(): string[] {
  return execSync(
    "git ls-files --cached --others --exclude-standard lib/fss/action lib/fss/presentation",
    { encoding: "utf-8" },
  )
    .trim()
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f))
    .sort()
}

/** Import specifiers, read from the statements rather than from the whole file. */
function importsOf(file: string): string[] {
  const src = readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
  return [...src.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1])
}

/**
 * What may not be imported, and why.
 *
 * `lib/report/**` has one carve-out: `lib/fss/engine/compare.ts` is Gate 2's
 * own module and is not under lib/report at all — the catalogue imports
 * COMPARISON_LANGUAGE from THERE, which is the point of it existing. Nothing
 * in the fence needs to permit a lib/report path.
 */
const FORBIDDEN: [string, RegExp][] = [
  ["an AI model client", /@anthropic-ai\/sdk|\bopenai\b|@\/lib\/anthropic/],
  ["the AI cost guard, which only AI routes need", /@\/lib\/ai-guard/],
  ["the science contract, whose importer list is pinned elsewhere", /@\/lib\/consultation\//],
  ["the paid Report, a different product with its own versioning", /@\/lib\/report\//],
  ["the Biotic pillar vocabulary", /@\/lib\/pillars|@\/lib\/biotics/],
  ["a Supabase client", /@\/lib\/supabase|@supabase\//],
  ["the legacy scoring instrument", /@\/lib\/assessment-scoring|@\/lib\/quick-assessment/],
  ["the legacy habit nudge, which is keyed by Biotic", /@\/lib\/habit/],
]

describe("the action layer imports none of the things it must not", () => {
  const files = fencedFiles()

  it("there are files to check", () => {
    expect(files.length).toBeGreaterThanOrEqual(6)
    expect(files.some((f) => f.startsWith("lib/fss/action/"))).toBe(true)
    expect(files.some((f) => f.startsWith("lib/fss/presentation/"))).toBe(true)
  })

  it.each(FORBIDDEN)("does not import %s", (_why, pattern) => {
    const offenders: string[] = []
    for (const f of files) {
      for (const spec of importsOf(f)) {
        if (pattern.test(spec)) offenders.push(`${f} → ${spec}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it("NON-VACUITY: the import reader finds the imports that ARE there", () => {
    // A reader returning nothing would pass every rule above. These are
    // imports the layer legitimately has.
    const all = files.flatMap(importsOf)
    expect(all.length).toBeGreaterThan(8)
    expect(all).toContain("@/lib/fss/questions/types")
    expect(all.some((s) => s.includes("@/lib/fss/engine/"))).toBe(true)
    expect(all, "the action names must come from the vocabulary authority").toContain(
      "@/lib/product-vocabulary",
    )
  })

  it("NON-VACUITY: each forbidden pattern matches the specifier it is for", () => {
    const hits = (spec: string) => FORBIDDEN.some(([, p]) => p.test(spec))
    for (const spec of [
      "@anthropic-ai/sdk",
      "openai",
      "@/lib/anthropic",
      "@/lib/ai-guard",
      "@/lib/consultation/science-contract",
      "@/lib/report/deterministic/priority",
      "@/lib/pillars",
      "@/lib/supabase-server",
      "@/lib/assessment-scoring",
      "@/lib/habit",
    ]) {
      expect(hits(spec), `${spec} should be fenced out`).toBe(true)
    }
    // And the legitimate ones are not caught.
    for (const spec of [
      "@/lib/fss/engine/compare",
      "@/lib/fss/questions/types",
      "@/lib/product-vocabulary",
      "react",
    ]) {
      expect(hits(spec), `${spec} must stay allowed`).toBe(false)
    }
  })
})

describe("the plan surface never asks for a band", () => {
  /*
   * `FSS_V1_PROVENANCE.interpretationVersion` is "interpretation-v1.0", which
   * `bands.ts` deliberately leaves unregistered — so `getScoreBand` with it
   * THROWS. A plan reaching for a band would not be subtly wrong, it would
   * crash the surface, and the failure would arrive at render time rather than
   * in CI.
   *
   * It is also the right answer on its own terms: a plan is about what to do,
   * not about which tier a number sits in.
   */
  const PLAN_FILES = () =>
    execSync(
      "git ls-files --cached --others --exclude-standard lib/fss/action lib/fss/presentation components/fss",
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter((f) => /\.tsx?$/.test(f))

  it("nothing in the action layer or the candidate surface calls getScoreBand", () => {
    for (const f of PLAN_FILES()) {
      const src = readFileSync(f, "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
        .replace(/^\s*\/\/.*$/gm, " ")
      expect(src, `${f} calls getScoreBand`).not.toMatch(/getScoreBand\s*\(/)
      expect(src, `${f} imports the interpretation ladders`).not.toMatch(
        /@\/lib\/fss\/interpretation/,
      )
    }
  })

  it("and asking for that version really would throw", async () => {
    const { getScoreBand, UnknownInterpretationVersionError } = await import(
      "@/lib/fss/interpretation/bands"
    )
    const { FSS_V1_PROVENANCE } = await import("@/lib/fss/engine/provenance")
    expect(() => getScoreBand(67, FSS_V1_PROVENANCE.interpretationVersion)).toThrow(
      UnknownInterpretationVersionError,
    )
  })
})
