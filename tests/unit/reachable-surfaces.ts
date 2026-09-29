/**
 * Which source files a customer can actually reach — derived, not hand-kept.
 *
 * ══ WHY THIS EXISTS ═════════════════════════════════════════════════════════
 *
 * `customer-surfaces.ts` is a NAMED list, deliberately, and its docblock argues
 * the case well: an automatic tree walker sweeps in Family, Mind, the book and
 * the retired renderers, and the honest response to the resulting failures
 * would be to weaken the rules until they passed.
 *
 * But a named list has a failure mode the rules themselves cannot see: a file
 * nobody remembered is a file nobody guarded. That has now happened twice in
 * this engagement — `components/home/the-framework.tsx` and
 * `components/home/how-it-works.tsx` both rendered on the holding page, both
 * carried a claim the guards ban, and both were invisible to CI because they
 * were in no corpus. Independent review found them. That is the gap.
 *
 * This module closes it from the other side. Rather than asserting that every
 * reachable file is guarded — which is the tree walker again — it computes
 * what is reachable, so a guard can ask the narrower and far more useful
 * question: *does any reachable file carry a claim without being guarded, and
 * is that set still the one we signed off?*
 *
 * ══ WHAT "REACHABLE" MEANS HERE ═════════════════════════════════════════════
 *
 * The import closure of every page route that `classifyPageRoute` does not
 * refuse. Seeds are `app/**\/page.tsx` files whose route is servable; edges are
 * `@/`-aliased and relative imports resolving inside app/, lib/ or components/.
 *
 * ══ AND WHAT IT DOES NOT ════════════════════════════════════════════════════
 *
 * It is a static import graph, so it over-approximates: a module imported by a
 * page but rendered only behind a tier gate counts as reachable. That is the
 * safe direction to be wrong in — it can only ever ask for MORE scrutiny than
 * strictly necessary. It does not follow dynamic `import()` with a computed
 * specifier, and it says nothing about API routes, which the V1 surface gate
 * never judges. Both limits are stated rather than papered over.
 */
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { dirname, join, normalize } from "node:path"
import { classifyPageRoute } from "@/lib/v1-surface"

/** Every tracked source file under app/, lib/ and components/. */
function allSourceFiles(): Set<string> {
  const out = execSync('git ls-files app lib components', { encoding: "utf-8" })
  return new Set(out.trim().split("\n").filter((f) => /\.(ts|tsx)$/.test(f)))
}

/** The route a page file serves, or null when the file is not a page. */
function routeOf(file: string): string | null {
  if (file === "app/page.tsx") return "/"
  const m = file.match(/^app\/(.*)\/page\.tsx$/)
  return m ? `/${m[1]}` : null
}

/** An import specifier resolved to a tracked file, or null when it leaves the tree. */
function resolveImport(spec: string, from: string, all: Set<string>): string | null {
  let base: string
  if (spec.startsWith("@/")) base = spec.slice(2)
  else if (spec.startsWith(".")) base = normalize(join(dirname(from), spec))
  else return null // node_modules, "next/…", "react" — not ours

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (all.has(candidate)) return candidate
  }
  return null
}

/**
 * Every file in the import closure of the servable page routes.
 *
 * Sorted, so a failure message reads the same on every machine.
 */
export function reachableSourceFiles(): string[] {
  const all = allSourceFiles()

  const seeds = [...all].filter((f) => {
    const route = routeOf(f)
    return route !== null && classifyPageRoute(route) !== "POST_V1"
  })

  const reachable = new Set<string>()
  const queue = [...seeds]
  while (queue.length) {
    const file = queue.pop()!
    if (reachable.has(file)) continue
    reachable.add(file)
    const src = readFileSync(file, "utf-8")
    for (const m of src.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const target = resolveImport(m[1], file, all)
      if (target && !reachable.has(target)) queue.push(target)
    }
  }

  return [...reachable].sort()
}

/** The seed count, exported so a guard can refuse a closure that found nothing. */
export function servablePageCount(): number {
  const all = allSourceFiles()
  return [...all].filter((f) => {
    const route = routeOf(f)
    return route !== null && classifyPageRoute(route) !== "POST_V1"
  }).length
}
