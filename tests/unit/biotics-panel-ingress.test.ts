import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

/* ════════════════════════════════════════════════════════════════════════════
   P2-FSS-ARCH-01 — THE GENERATION-CROSSING BIOTICS DEPENDENCY.

   `components/fss/system/biotics.tsx` (Generation 4) renders
   `components/agent-loop/BioticsProgressPanel` (Generation 1). The Experience 0
   audit originally concluded from "BioticsSection accepts no props" that
   personalisation was STRUCTURALLY IMPOSSIBLE there.

   ══ THAT CONCLUSION WAS OVERSTATED, AND THIS FILE IS THE CORRECTION ═════════

   Taking no props closes ONE ingress. A child component can still obtain
   personal state through:

       React context · hooks holding state · an external store ·
       localStorage / sessionStorage · URL or route state ·
       module-level globals · a network call

   So "no props" is evidence about the call site, not a property of the subtree.
   This test establishes the property the audit actually needs, over the panel's
   TRANSITIVE import closure rather than the one file.

   ══ WHY IT IS RECORDED EVEN THOUGH IT CURRENTLY PASSES CLEANLY ══════════════

   The risk is forward-looking. The panel is Generation 1 code reused by
   Generation 4, and the thing to prevent is not today's render — it is
   Generation 4 inheriting a Generation 1 capability ACCIDENTALLY, through reuse,
   the next time somebody makes the panel "a bit more useful".

   Nothing is refactored. The dependency stays; what changes is that it can no
   longer quietly grow a way to read the person.
   ════════════════════════════════════════════════════════════════════════════ */

const ENTRY = "components/agent-loop/BioticsProgressPanel.tsx"

/** Every ingress a component could use to reach personal state without a prop. */
const INGRESS: ReadonlyArray<readonly [string, RegExp]> = [
  ["React context", /\buseContext\s*\(/],
  ["a context provider or consumer", /\bcreateContext\s*\(/],
  ["component state", /\buse(?:State|Reducer|SyncExternalStore)\s*\(/],
  ["an effect, which is how state usually arrives", /\buse(?:Effect|LayoutEffect)\s*\(/],
  ["browser storage", /\b(?:localStorage|sessionStorage)\b/],
  ["IndexedDB", /\bindexedDB\b/],
  ["cookies", /\bdocument\s*\.\s*cookie\b/],
  ["URL or route state", /\buse(?:SearchParams|Params|Pathname|Router)\s*\(/],
  ["a network call", /\b(?:fetch|axios|XMLHttpRequest)\s*\(/],
  ["a module-level global", /\bwindow\s*\.\s*__/],
  ["a Supabase client", /\bsupabase\b/i],
]

/**
 * Resolve a relative or `@/` import to a file on disk.
 *
 * Only LOCAL imports are followed. A bare package specifier is out of scope:
 * this proves what the EatoBiotics subtree can reach, and a third-party module
 * that read the person would be a different and much louder problem.
 */
function resolveImport(spec: string, fromFile: string): string | null {
  let base: string
  if (spec.startsWith("@/")) base = resolve(spec.slice(2))
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec)
  else return null

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate) && !candidate.endsWith("/")) {
      try {
        if (readFileSync(candidate).length >= 0) return candidate
      } catch {
        /* a directory — keep looking */
      }
    }
  }
  return null
}

/** The panel plus everything it imports, transitively, within this repository. */
function importClosure(entry: string): string[] {
  const seen = new Set<string>()
  const queue = [resolve(entry)]

  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)

    const src = readFileSync(file, "utf8")
    for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g)) {
      const next = resolveImport(m[1], file)
      if (next && !seen.has(next)) queue.push(next)
    }
  }
  return [...seen].sort()
}

/** Comments are stripped: a docblock EXPLAINING an absence must not read as one. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

describe("P2-FSS-ARCH-01 · the Biotics panel cannot reach the person", () => {
  it("the entry point exists where Generation 4 imports it from", () => {
    expect(existsSync(ENTRY), `${ENTRY} moved — update this test and the register entry`).toBe(true)
    expect(code("components/fss/system/biotics.tsx")).toContain("BioticsProgressPanel")
  })

  it("no module in its import closure opens a personal-state ingress", () => {
    const closure = importClosure(ENTRY)
    const breaches: string[] = []

    for (const file of closure) {
      const src = code(file)
      for (const [why, pattern] of INGRESS) {
        const hit = src.match(pattern)
        if (hit) breaches.push(`${file.replace(`${resolve(".")}/`, "")} — ${why}: "${hit[0]}"`)
      }
    }

    expect(
      breaches,
      "the Biotics panel's dependency tree gained a way to read personal state — Generation 4 must not inherit a Generation 1 capability through reuse",
    ).toEqual([])
  })

  /*
   * A non-vacuity check. The closure walker returning one file, or zero, would
   * make the assertion above pass for the wrong reason — and a guard that
   * passes because it looked at nothing is the failure mode this programme has
   * found more than once.
   */
  it("the closure walker actually walked something", () => {
    const closure = importClosure(ENTRY)
    expect(closure.length, "the import closure collapsed — the walker is not resolving imports").toBeGreaterThanOrEqual(2)
    expect(closure.some((f) => f.endsWith("/lib/pillars.ts"))).toBe(true)
  })

  /*
   * The panel takes exactly one prop, and it is presentational. Pinned so that
   * adding a data prop is a visible diff rather than a quiet capability
   * increase — the call site passes none today, and that should stay a choice
   * rather than become an accident.
   */
  it("the panel's only prop is presentational", () => {
    const src = code(ENTRY)
    const signature = src.match(/export function BioticsProgressPanel\s*\(\s*\{([^}]*)\}/)
    expect(signature, "the panel's signature changed shape").toBeTruthy()
    const props = (signature?.[1] ?? "")
      .split(",")
      .map((p) => p.split(/[:=]/)[0].trim())
      .filter(Boolean)
    expect(props).toEqual(["className"])
  })
})
