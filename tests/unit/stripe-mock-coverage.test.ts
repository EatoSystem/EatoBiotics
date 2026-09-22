/**
 * A mock must not make the branch it claims to cover unreachable — Step 7.
 *
 * ══ WHY ═════════════════════════════════════════════════════════════════════
 *
 * `tests/unit/stripe-webhook-route.test.ts` mocked `@/lib/paid-report-session`
 * with a factory that omitted `resolvePaidReportSummary` — which
 * `app/api/stripe/webhook/route.ts` imports and calls on the €49 path — and
 * forced `isCheckoutSessionSettled` to `false`. The file looked like coverage
 * of the webhook. The `checkout.session.completed` branch, the branch that
 * turns a payment into an entitlement, had never executed once.
 *
 * This is the engagement's recurring defect class wearing a new costume: a
 * structure that proves something adjacent to the claim. Elsewhere it has been
 * a guard asserting symbol presence instead of execution order; here it is a
 * fixture asserting nothing at all, very convincingly.
 *
 * ══ WHAT THIS PROVES ════════════════════════════════════════════════════════
 *
 * For every first-party module a Stripe test file mocks, the factory must
 * export every value the routes THAT TEST ACTUALLY EXERCISES import from that
 * module. The route set is discovered from the test's own
 * `await import("@/app/…/route")` calls rather than hard-coded, so adding a
 * route to a test brings it under this guard automatically.
 *
 * It does not check what the mock RETURNS — a fixture is entitled to return
 * whatever a case needs. It checks that nothing the route depends on is simply
 * missing, which is the failure that hides a branch.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import ts from "typescript"

const TEST_FILES = [
  "tests/unit/stripe-webhook-route.test.ts",
  "tests/unit/money-paths.test.ts",
  "tests/unit/v1-paid-journey.test.ts",
]

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(file, "utf-8"), ts.ScriptTarget.Latest, true)
}

/** `@/lib/x` → `lib/x.ts` (or `.tsx`), else null for a package. */
function resolveFirstParty(spec: string): string | null {
  if (!spec.startsWith("@/")) return null
  const base = spec.slice(2)
  for (const ext of [".ts", ".tsx"]) {
    if (existsSync(base + ext)) return base + ext
  }
  return null
}

/** The property names a `vi.mock` factory's returned object literal declares. */
function factoryKeys(factory: ts.Expression): Set<string> {
  const keys = new Set<string>()
  let body: ts.Node | undefined
  if (ts.isArrowFunction(factory) || ts.isFunctionExpression(factory)) body = factory.body
  if (!body) return keys

  const collect = (obj: ts.ObjectLiteralExpression) => {
    for (const p of obj.properties) {
      if (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) keys.add(p.name.text)
    }
  }

  const visit = (n: ts.Node) => {
    if (ts.isObjectLiteralExpression(n)) collect(n)
    ts.forEachChild(n, visit)
  }
  visit(body)
  return keys
}

/** Every `vi.mock("<module>", factory)` in a test file. */
function mocksIn(sf: ts.SourceFile): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  const visit = (n: ts.Node) => {
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.expression) &&
      n.expression.expression.text === "vi" &&
      n.expression.name.text === "mock" &&
      n.arguments.length >= 2 &&
      ts.isStringLiteral(n.arguments[0])
    ) {
      out.set(n.arguments[0].text, factoryKeys(n.arguments[1]))
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return out
}

/** Route modules a test dynamically imports: `await import("@/app/…/route")`. */
function routesExercised(sf: ts.SourceFile): string[] {
  const out = new Set<string>()
  const visit = (n: ts.Node) => {
    if (
      ts.isCallExpression(n) &&
      n.expression.kind === ts.SyntaxKind.ImportKeyword &&
      n.arguments.length === 1 &&
      ts.isStringLiteral(n.arguments[0])
    ) {
      const resolved = resolveFirstParty(n.arguments[0].text)
      if (resolved && resolved.startsWith("app/")) out.add(resolved)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return [...out].sort()
}

/** Runtime (non-type) named imports a module takes from `spec`. */
function namedRuntimeImports(sf: ts.SourceFile, spec: string): string[] {
  const out = new Set<string>()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue
    if (!ts.isStringLiteral(stmt.moduleSpecifier) || stmt.moduleSpecifier.text !== spec) continue
    const clause = stmt.importClause
    if (!clause || clause.isTypeOnly) continue
    if (clause.name) out.add("default")
    const bindings = clause.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        if (!el.isTypeOnly) out.add((el.propertyName ?? el.name).text)
      }
    }
  }
  return [...out].sort()
}

/**
 * Everything wrong with one test file's mocking, as a list.
 *
 * The vacuity conditions are PROBLEMS, not separate assertions, so they are
 * reachable by a synthetic input and therefore testable. Written as bare
 * `expect`s they could never fail for any real file, so deleting them changed
 * no outcome — a check that cannot be caught being removed is a check nobody
 * is maintaining.
 */
export function coverageProblems(source: string, readRoute = parse): string[] {
  const testSf = ts.createSourceFile("t.ts", source, ts.ScriptTarget.Latest, true)
  const mocks = mocksIn(testSf)
  const routes = routesExercised(testSf)
  const problems: string[] = []

  if (mocks.size === 0) problems.push("vacuous: this file mocks nothing")
  if (routes.length === 0) problems.push("vacuous: this file exercises no route")

  for (const route of routes) {
    const routeSf = readRoute(route)
    for (const [spec, keys] of mocks) {
      if (!resolveFirstParty(spec)) continue
      for (const imported of namedRuntimeImports(routeSf, spec)) {
        if (!keys.has(imported)) problems.push(`${route} imports ${imported} from ${spec}`)
      }
    }
  }
  return problems
}

describe("Stripe test fixtures cannot hide a branch", () => {
  it.each(TEST_FILES)("%s mocks everything its routes import", (testFile) => {
    expect(coverageProblems(readFileSync(testFile, "utf-8"))).toEqual([])
  })

  it("NON-VACUITY: a file that mocks nothing is reported as vacuous", () => {
    const problems = coverageProblems(
      `const { POST } = await import("@/app/api/stripe/webhook/route")`,
    )
    expect(problems).toContain("vacuous: this file mocks nothing")
  })

  it("NON-VACUITY: a file that exercises no route is reported as vacuous", () => {
    const problems = coverageProblems(`vi.mock("@/lib/supabase", () => ({ getSupabase: () => null }))`)
    expect(problems).toContain("vacuous: this file exercises no route")
  })

  it("NON-VACUITY: a factory missing a used export is reported", () => {
    const problems = coverageProblems(
      `vi.mock("@/lib/paid-report-session", () => ({ isCheckoutSessionSettled: () => false }))
       const { POST } = await import("@/app/api/stripe/webhook/route")`,
    )
    expect(
      problems.some((p) => p.includes("resolvePaidReportSummary")),
    ).toBe(true)
  })

  it("NON-VACUITY: the import reader finds real named imports and ignores type-only ones", () => {
    const sf = ts.createSourceFile(
      "r.ts",
      `import type Stripe from "stripe"
       import { a, b } from "@/lib/thing"
       import { type C, d } from "@/lib/thing"`,
      ts.ScriptTarget.Latest,
      true,
    )
    expect(namedRuntimeImports(sf, "@/lib/thing")).toEqual(["a", "b", "d"])
  })
})
