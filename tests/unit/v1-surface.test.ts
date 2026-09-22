import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import ts from "typescript"

import {
  classifyPageRoute,
  isServableInV1,
  requiresAdminSurface,
  PUBLISHING_EXPORT_VARIANTS,
  BOOK_CHAPTER_COUNT,
  V1_CORE_ROUTES,
  V1_SUPPORTING_ROUTES,
  POST_V1_ROUTES,
  FIXTURE_SELF_GATED_ROUTES,
  type V1SurfaceClass,
} from "@/lib/v1-surface"
import { STATIC_PATHS } from "@/app/sitemap"

const ROOT = process.cwd()

/* ── Reading the real routing tree ───────────────────────────────────────── */

/** Every page file under `app/`, as the route Next serves it. */
function routesOnDisk(): string[] {
  const out: string[] = []
  ;(function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry === "page.tsx" || entry === "page.ts") {
        const route = dirname(full).slice(join(ROOT, "app").length) || "/"
        out.push(route)
      }
    }
  })(join(ROOT, "app"))
  return out.sort()
}

/**
 * A route pattern as a request would arrive: `[slug]` becomes a real-looking
 * segment. "sample" is deliberately a word no literal route uses, so a dynamic
 * route can never be mistaken for one of its own literal siblings —
 * `/account/report/[id]` must not collide with `/account/report/demo`.
 */
function asRequestPath(routePattern: string): string {
  return routePattern.replace(/\[([^\]]+)\]/g, "sample")
}

const ROUTES = routesOnDisk()

/* ── 1. Every route on disk is classified ────────────────────────────────── */

describe("the V1 surface classification covers the whole routing tree", () => {
  /**
   * ══ WHY THIS WALKS THE TREE, AND THE COPY GUARDS DO NOT ═══════════════════
   *
   * tests/unit/customer-surfaces.ts argues against tree-walking, and it is
   * right for what it guards: a copy rule can only be wrong about a file it
   * reads, and sweeping every file in would force the rules to be weakened
   * until they passed.
   *
   * This is the opposite problem. The question here is not "is this file's
   * wording current" but "has anybody decided whether a customer may enter
   * this route" — and for that, completeness IS the property. A route nobody
   * classified is the failure. So the tree is the corpus, and the classifier
   * must have an answer for all of it.
   */
  it("finds a plausible routing tree", () => {
    // Non-vacuity: an empty or broken walk must not pass as "all classified".
    expect(ROUTES.length).toBeGreaterThan(200)
    expect(ROUTES).toContain("/")
    expect(ROUTES).toContain("/assessment/you")
    expect(ROUTES).toContain("/book-chapter-1")
  })

  it("classifies every page route — no route is UNCLASSIFIED", () => {
    const unclassified = ROUTES.filter(
      (r) => classifyPageRoute(asRequestPath(r)) === "UNCLASSIFIED",
    )
    expect(
      unclassified,
      `these routes exist but nobody has decided whether V1 serves them:\n  ${unclassified.join("\n  ")}`,
    ).toEqual([])
  })

  it("an unclassified route is refused at runtime and reported in CI", () => {
    // The counterfactual for the rule above: a page added tomorrow.
    expect(classifyPageRoute("/a-page-nobody-classified")).toBe("UNCLASSIFIED")
    expect(isServableInV1("/a-page-nobody-classified")).toBe(false)
  })

  it("no route is claimed by two buckets", () => {
    const named = [
      ...V1_CORE_ROUTES, ...V1_SUPPORTING_ROUTES, ...POST_V1_ROUTES,
      ...FIXTURE_SELF_GATED_ROUTES,
    ]
    expect(new Set(named).size).toBe(named.length)
  })

  it("every named Post-V1 route actually exists on disk", () => {
    // A rename would otherwise leave a dead entry refusing nothing.
    const patterns = new Set(ROUTES)
    const ghosts = [...POST_V1_ROUTES, ...FIXTURE_SELF_GATED_ROUTES].filter((r) => !patterns.has(r))
    expect(ghosts, `named refused routes with no page: ${ghosts.join(", ")}`).toEqual([])
  })
})

/* ── 2. The sixteen ───────────────────────────────────────────────────────── */

describe("the frozen sixteen are the launch product", () => {
  const CORE = [
    "/", "/assessment", "/assessment/you", "/assessment/results", "/pricing",
    "/assessment/deep", "/assessment/report", "/account", "/login",
  ]
  const SUPPORTING = [
    "/privacy", "/terms", "/about", "/method", "/help",
    "/account/settings", "/account/signin",
  ]

  it("nine core pages, named literally, all serve", () => {
    expect([...V1_CORE_ROUTES]).toEqual(CORE)
    for (const r of CORE) {
      expect(classifyPageRoute(r), r).toBe("V1_CORE")
      expect(isServableInV1(r), r).toBe(true)
    }
  })

  it("seven supporting pages, named literally, all serve", () => {
    expect([...V1_SUPPORTING_ROUTES]).toEqual(SUPPORTING)
    for (const r of SUPPORTING) {
      expect(classifyPageRoute(r), r).toBe("V1_SUPPORTING")
      expect(isServableInV1(r), r).toBe(true)
    }
  })

  it("all sixteen exist on disk", () => {
    for (const r of [...CORE, ...SUPPORTING]) expect(ROUTES, r).toContain(r)
  })
})

/* ── 3. Representative behaviour per class ───────────────────────────────── */

describe("what each kind of route does", () => {
  const CASES: Array<[string, V1SurfaceClass, boolean]> = [
    // A Post-V1 singleton with no subtree — the shape a layout could not cover.
    ["/you", "POST_V1", false],
    ["/digital-twin", "POST_V1", false],
    // A Post-V1 subtree.
    ["/stability", "POST_V1", false],
    ["/stability/assessment", "POST_V1", false],
    ["/stability/tracker", "POST_V1", false],
    ["/glucose/glp1", "POST_V1", false],
    ["/glucose/glp1/check", "POST_V1", false],
    // Living Twin, Family, Plate Builder, Analyse.
    ["/account/twin", "POST_V1", false],
    ["/account/family", "POST_V1", false],
    ["/plate-builder", "POST_V1", false],
    ["/analyse", "POST_V1", false],
    ["/analyse/result/abc123", "POST_V1", false],
    // Public content stays public.
    ["/book-chapter-1", "PUBLIC_CONTENT", true],
    ["/book-chapter-25", "PUBLIC_CONTENT", true],
    ["/food/kefir", "PUBLIC_CONTENT", true],
    ["/food/for/energy", "PUBLIC_CONTENT", true],
    ["/recipe/some-recipe", "PUBLIC_CONTENT", true],
    ["/gut-brain", "POST_V1", false],  // a redirect to /mind wearing a content page's name
    ["/anxiety", "PUBLIC_CONTENT", true],
    ["/adhd", "PUBLIC_CONTENT", true],
    // Publishing exports are Step 4's, and must keep working.
    ["/book-chapter-7/print", "PUBLISHING_EXPORT", true],
    ["/book-chapter-7/reedsy", "PUBLISHING_EXPORT", true],
    ["/book-chapter-7/substack", "PUBLISHING_EXPORT", true],
    // Internal tooling keeps its own gate; this one has no opinion.
    ["/admin", "INTERNAL", true],
    ["/admin/waitlist", "INTERNAL", true],
    ["/cms", "INTERNAL", true],
    ["/cms/library/some-id", "INTERNAL", true],
    // Essentials.
    ["/auth/callback", "V1_ESSENTIAL", true],
    ["/unsubscribe", "V1_ESSENTIAL", true],
    ["/enter", "V1_ESSENTIAL", true],
    ["/c/ie", "V1_ESSENTIAL", true],
    ["/discover/abc123", "V1_ESSENTIAL", true],
    // A legacy door with a true V1 equivalent keeps redirecting.
    ["/reports", "LEGACY_REDIRECT", true],
    ["/trilogy", "LEGACY_REDIRECT", true],
    // Not this module's business.
    ["/api/health", "NOT_A_PAGE_ROUTE", true],
    ["/api/stripe/webhook", "NOT_A_PAGE_ROUTE", true],
    ["/sitemap.xml", "NOT_A_PAGE_ROUTE", true],
    ["/robots.txt", "NOT_A_PAGE_ROUTE", true],
    ["/manifest.webmanifest", "NOT_A_PAGE_ROUTE", true],
    ["/food/kefir/opengraph-image", "NOT_A_PAGE_ROUTE", true],
    ["/_next/static/chunk.js", "NOT_A_PAGE_ROUTE", true],
  ]

  for (const [path, cls, servable] of CASES) {
    it(`${path} → ${cls}`, () => {
      expect(classifyPageRoute(path)).toBe(cls)
      expect(isServableInV1(path)).toBe(servable)
    })
  }

  it("/create-my-plate refuses rather than redirecting into a refusal", () => {
    // It redirected to /myplate, which is itself Post-V1. A redirect has to
    // preserve intent; two hops to a 404 is worse than one honest one.
    expect(classifyPageRoute("/create-my-plate")).toBe("POST_V1")
    expect(classifyPageRoute("/myplate")).toBe("POST_V1")
  })

  it("a query string or fragment changes nothing", () => {
    expect(classifyPageRoute("/enter?from=%2F")).toBe("V1_ESSENTIAL")
    expect(classifyPageRoute("/assessment?signin=1")).toBe("V1_CORE")
    expect(classifyPageRoute("/stability?utm_source=x")).toBe("POST_V1")
    expect(classifyPageRoute("/pricing#plans")).toBe("V1_CORE")
  })

  it("a trailing slash changes nothing", () => {
    expect(classifyPageRoute("/pricing/")).toBe("V1_CORE")
    expect(classifyPageRoute("/stability/")).toBe("POST_V1")
    expect(classifyPageRoute("/")).toBe("V1_CORE")
  })

  it("a deeper path under a refused route is not silently allowed", () => {
    expect(isServableInV1("/stability/assessment/step-2")).toBe(false)
    expect(isServableInV1("/book-chapter-1/not-a-real-variant")).toBe(false)
  })
})

/* ── 3b. Demo and fixture routes ─────────────────────────────────────────── */

describe("demo and fixture routes cannot be entered", () => {
  const REFUSED_EVERYWHERE = [
    "/demo",
    "/demo/assessment",
    "/demo/account",
    "/demo/account/member",
    "/demo/account/consult",
    "/demo/analyse",
    "/demo/create-my-plate",
    "/analyse-demo",
    "/assessment/demo",
    "/assessment/preview",
    "/account/report/demo",
    "/account-you",
    "/account-you/member",
    "/account-you-live",
  ]

  it("every demo route except the Report preview is refused outright", () => {
    for (const p of REFUSED_EVERYWHERE) {
      expect(classifyPageRoute(p), p).toBe("POST_V1")
      expect(isServableInV1(p), p).toBe(false)
    }
  })

  /**
   * ══ THE ONE EXCEPTION, AND WHY IT IS SAFE ═════════════════════════════════
   *
   * /demo/food-system-report passes this gate and is refused by its own page.
   * That is only acceptable while the page's refusal genuinely exists, so the
   * page is parsed: it must consult a fail-closed policy and call notFound().
   * A future edit that deletes either turns "something else handles it" into
   * "nothing handles it", and this test is what notices.
   */
  it("the Report preview defers to its own page-level policy", () => {
    expect(classifyPageRoute("/demo/food-system-report")).toBe("FIXTURE_SELF_GATED")
    expect(isServableInV1("/demo/food-system-report")).toBe(true)
  })

  for (const route of FIXTURE_SELF_GATED_ROUTES) {
    it(`${route} refuses production in its own page`, () => {
      const file = join(ROOT, "app", route, "page.tsx")
      expect(existsSync(file), `${route} has no page`).toBe(true)
      const src = readFileSync(file, "utf8")
      const sf = ts.createSourceFile("page.tsx", src, ts.ScriptTarget.ESNext, true)

      // The policy is imported…
      const imported = sf.statements.some(
        (st) =>
          ts.isImportDeclaration(st) &&
          /preview-policy|activation-policy/.test((st.moduleSpecifier as ts.StringLiteral).text),
      )
      expect(imported, `${route} imports no fail-closed policy`).toBe(true)

      // …and both the policy and notFound() are actually called, not just
      // present. Calls are collected from the tree, so an import alone or a
      // mention in a comment proves nothing.
      const calls = new Set<string>()
      ;(function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          calls.add(node.expression.text)
        }
        ts.forEachChild(node, visit)
      })(sf)

      expect([...calls].some((c) => /Eligible$|Allowed$/.test(c)), `${route} never calls its policy`).toBe(true)
      expect(calls.has("notFound"), `${route} never calls notFound()`).toBe(true)
    })
  }

  it("that page-level check would fail if the policy were dropped", () => {
    // Non-vacuity, on synthetic source rather than by editing the real page.
    const gutted = `
      import { notFound } from "next/navigation"
      export default function Page() { return null }
    `
    const sf = ts.createSourceFile("page.tsx", gutted, ts.ScriptTarget.ESNext, true)
    const imported = sf.statements.some(
      (st) =>
        ts.isImportDeclaration(st) &&
        /preview-policy|activation-policy/.test((st.moduleSpecifier as ts.StringLiteral).text),
    )
    expect(imported).toBe(false)
  })
})

/* ── 4. The gate is actually wired, in the right place ───────────────────── */

describe("proxy.ts refuses Post-V1 routes before it does anything expensive", () => {
  /**
   * ══ WHY THIS PARSES ═══════════════════════════════════════════════════════
   *
   * A classifier nothing calls refuses nothing. The weak version of this test
   * greps proxy.ts for "isServableInV1" and goes green on the import line
   * alone — which is the defect class this engagement has now hit five times:
   * a guard proving a symbol is PRESENT rather than that it is USED, and used
   * where it claims.
   *
   * So the file is parsed, the `proxy` function's own statement list is read,
   * and the gate is located as a statement in it. Position is then a fact
   * about execution order, not about line numbers: the gate must come AFTER
   * the country rewrite (so /ie reaches /c/ie instead of being judged on a
   * pathname the app never serves) and BEFORE the password gate and the
   * Supabase session work.
   */
  interface GateShape {
    v1: number
    v1Count: number
    adminSurface: number
    adminSurfaceCount: number
    adminSurfaceVerifies: boolean
    passwordGate: number
    countryRewrite: number
    total: number
    returnsInside: boolean
  }

  function readProxy(source: string): GateShape {
    const sf = ts.createSourceFile("proxy.ts", source, ts.ScriptTarget.ESNext, true)
    let body: ts.Block | undefined
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && st.name?.text === "proxy" && st.body) body = st.body
    }
    expect(body, "no exported `proxy` function declaration").toBeDefined()

    const statements = body!.statements
    let v1 = -1
    let v1Count = 0
    let adminSurface = -1
    let adminSurfaceCount = 0
    let adminSurfaceVerifies = false
    let passwordGate = -1
    let countryRewrite = -1
    let returnsInside = false

    statements.forEach((st, i) => {
      if (!ts.isIfStatement(st)) return
      const cond = st.expression

      // `if (!isServableInV1(pathname))`
      if (
        ts.isPrefixUnaryExpression(cond) &&
        cond.operator === ts.SyntaxKind.ExclamationToken &&
        ts.isCallExpression(cond.operand) &&
        ts.isIdentifier(cond.operand.expression) &&
        cond.operand.expression.text === "isServableInV1"
      ) {
        // FIRST occurrence, not last. Sabotage 503 hoisted a second copy of
        // the gate above the country rewrite and left the original in place;
        // recording the last one meant the ordering assertion still saw a
        // gate in the right position while /ie was already being judged on a
        // pathname the app never serves. The earliest gate is the one that
        // decides, so it is the one measured — and a second gate is itself a
        // failure, because "before the rewrite" and "after it" cannot both be
        // true of one control.
        v1Count += 1
        if (v1 === -1) {
          v1 = i
          returnsInside = /\breturn\b/.test(st.thenStatement.getText())
        }
        return
      }
      // `if (requiresAdminSurface(pathname))`
      if (
        ts.isCallExpression(cond) &&
        ts.isIdentifier(cond.expression) &&
        cond.expression.text === "requiresAdminSurface"
      ) {
        adminSurfaceCount += 1
        if (adminSurface === -1) {
          adminSurface = i
          const body = st.thenStatement.getText()
          adminSurfaceVerifies = /verifyAdminCookieEdge\s*\(/.test(body) && /\breturn\b/.test(body)
        }
        return
      }
      // `if (isPasswordGateEnabled())`
      if (
        ts.isCallExpression(cond) &&
        ts.isIdentifier(cond.expression) &&
        cond.expression.text === "isPasswordGateEnabled"
      ) {
        passwordGate = i
        return
      }
      // `if (LANDING_SLUGS.includes(seg))`
      if (ts.isCallExpression(cond) && /LANDING_SLUGS/.test(cond.expression.getText())) {
        countryRewrite = i
      }
    })

    return {
      v1, v1Count, adminSurface, adminSurfaceCount, adminSurfaceVerifies,
      passwordGate, countryRewrite, total: statements.length, returnsInside,
    }
  }

  const shape = readProxy(readFileSync(join(ROOT, "proxy.ts"), "utf8"))

  it("the gate is a statement in proxy(), not just an import", () => {
    expect(shape.v1, "no `if (!isServableInV1(pathname))` statement in proxy()").toBeGreaterThan(-1)
    expect(shape.returnsInside, "the gate does not return").toBe(true)
  })

  it("there is exactly one of it", () => {
    expect(shape.v1Count, "more than one V1 gate in proxy() — which one decides?").toBe(1)
  })

  it("it runs after the country rewrite and before the password gate", () => {
    expect(shape.countryRewrite).toBeGreaterThan(-1)
    expect(shape.passwordGate).toBeGreaterThan(-1)
    expect(shape.v1).toBeGreaterThan(shape.countryRewrite)
    expect(shape.v1).toBeLessThan(shape.passwordGate)
  })

  it("the parse rejects a gate that has been moved or removed", () => {
    // Non-vacuity, run on every CI pass rather than only under sabotage.
    const moved = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        return NextResponse.next()
      }
    `
    const s = readProxy(moved)
    expect(s.v1).toBeGreaterThan(s.passwordGate)   // i.e. the real assertion would fail

    const removed = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
        return NextResponse.next()
      }
    `
    expect(readProxy(removed).v1).toBe(-1)

    // …and it accepts the shape the real file has, so it is discriminating
    // rather than simply strict.
    const good = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
        return NextResponse.next()
      }
    `
    const g = readProxy(good)
    expect(g.v1).toBeGreaterThan(g.countryRewrite)
    expect(g.v1).toBeLessThan(g.passwordGate)
    expect(g.v1Count).toBe(1)
    expect(g.returnsInside).toBe(true)

    // A second gate hoisted above the country rewrite: the earliest one wins,
    // so the ordering assertion must see IT and the count must object.
    const duplicated = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
      }
    `
    const d = readProxy(duplicated)
    expect(d.v1Count).toBe(2)
    expect(d.v1).toBeLessThan(d.countryRewrite)
  })

  it("the publishing-export admin check is a statement too, right after it", () => {
    expect(shape.adminSurface, "no `if (requiresAdminSurface(pathname))` statement in proxy()").toBeGreaterThan(-1)
    expect(shape.adminSurfaceCount, "more than one admin-surface check").toBe(1)
    expect(
      shape.adminSurfaceVerifies,
      "the admin-surface branch does not verify the cookie and return",
    ).toBe(true)

    // Order matters in both directions. It must come AFTER the launch-surface
    // gate — an export route moved out of the surface should be refused before
    // a cookie is even read — and BEFORE the password gate, like everything
    // else that decides whether a request is served at all.
    expect(shape.adminSurface).toBe(shape.v1 + 1)
    expect(shape.adminSurface).toBeLessThan(shape.passwordGate)
  })

  it("the parse rejects an admin check that is missing, duplicated or misordered", () => {
    const missing = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
      }
    `
    expect(readProxy(missing).adminSurface).toBe(-1)

    const before = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (requiresAdminSurface(pathname)) {
          const authed = await verifyAdminCookieEdge(c)
          if (!authed) return v1Unavailable(request)
        }
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
      }
    `
    const b = readProxy(before)
    expect(b.adminSurface).toBeLessThan(b.v1)   // the real assertion would fail

    const toothless = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (requiresAdminSurface(pathname)) { console.log("export") }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
      }
    `
    expect(readProxy(toothless).adminSurfaceVerifies).toBe(false)

    const good = `
      export async function proxy(request: NextRequest) {
        const { pathname } = request.nextUrl
        if (LANDING_SLUGS.includes(seg)) { return NextResponse.rewrite(url) }
        if (!isServableInV1(pathname)) { return v1Unavailable(request) }
        if (requiresAdminSurface(pathname)) {
          const authed = await verifyAdminCookieEdge(c)
          if (!authed) return v1Unavailable(request)
        }
        if (isPasswordGateEnabled()) { return NextResponse.redirect(url) }
      }
    `
    const g = readProxy(good)
    expect(g.adminSurface).toBe(g.v1 + 1)
    expect(g.adminSurfaceCount).toBe(1)
    expect(g.adminSurfaceVerifies).toBe(true)
  })

  it("the refusal carries 404, not a redirect into an unrelated page", () => {
    const src = readFileSync(join(ROOT, "proxy.ts"), "utf8")
    const sf = ts.createSourceFile("proxy.ts", src, ts.ScriptTarget.ESNext, true)
    let helper: ts.FunctionDeclaration | undefined
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && st.name?.text === "v1Unavailable") helper = st
    }
    expect(helper, "no v1Unavailable helper").toBeDefined()
    const text = helper!.getText()
    expect(text).toContain("404")
    expect(text).not.toContain("NextResponse.redirect")
  })
})

/* ── 4b. The publishing exports are an internal authoring surface ───────── */

describe("the publishing exports require an admin, not merely a URL", () => {
  /**
   * ══ WHAT THE DEPENDENCY CHECK FOUND ═══════════════════════════════════════
   *
   * Step 3 left these serving on the inherited premise that they were "already
   * unindexed and unlinked from production UI". The second half was false:
   * components/book/chapter/chapter-nav.tsx rendered Copy for Substack, Copy
   * for Reedsy and Print / PDF on all twenty-five PUBLIC chapter pages.
   *
   * Nothing automated consumes them — no script, no CI job, no external fetch
   * — so they are an authoring tool, they are kept, and they move behind the
   * admin cookie the /cms boundary already uses.
   */
  const EXPORTS: string[] = [
    "/book/print",
    ...Array.from({ length: BOOK_CHAPTER_COUNT }, (_, i) => i + 1).flatMap((n) =>
      PUBLISHING_EXPORT_VARIANTS.map((v) => `/book-chapter-${n}/${v}`),
    ),
  ]

  it("covers all seventy-six of them", () => {
    expect(EXPORTS.length).toBe(BOOK_CHAPTER_COUNT * PUBLISHING_EXPORT_VARIANTS.length + 1)
    for (const route of EXPORTS) {
      expect(classifyPageRoute(route), route).toBe("PUBLISHING_EXPORT")
      expect(requiresAdminSurface(route), route).toBe(true)
    }
  })

  it("every one of them exists on disk", () => {
    for (const route of EXPORTS) {
      expect(existsSync(join(ROOT, "app", route, "page.tsx")), route).toBe(true)
    }
  })

  it("the public chapter pages themselves stay outside the admin gate", () => {
    for (let n = 1; n <= BOOK_CHAPTER_COUNT; n += 1) {
      expect(requiresAdminSurface(`/book-chapter-${n}`), `chapter ${n}`).toBe(false)
      expect(classifyPageRoute(`/book-chapter-${n}`)).toBe("PUBLIC_CONTENT")
    }
  })

  it("nothing else is swept into the admin class", () => {
    const others = [
      "/", "/assessment", "/assessment/you", "/pricing", "/login", "/account",
      "/privacy", "/help", "/book", "/books", "/food", "/food/kefir", "/adhd",
      "/enter", "/unsubscribe", "/auth/callback", "/reports",
      // /admin and /cms are INTERNAL: their own controls decide, and naming
      // them here too would create a second opinion about who may enter.
      "/admin", "/admin/waitlist", "/admin/book-exports", "/cms", "/cms/library",
      "/api/health", "/sitemap.xml",
    ]
    for (const route of others) expect(requiresAdminSurface(route), route).toBe(false)
  })

  it("a new export variant is unclassified rather than inheriting access", () => {
    // The realistic mutation: somebody adds app/book-chapter-7/newsletter/.
    expect(classifyPageRoute("/book-chapter-7/newsletter")).toBe("UNCLASSIFIED")
    expect(isServableInV1("/book-chapter-7/newsletter")).toBe(false)
    expect(requiresAdminSurface("/book-chapter-7/newsletter")).toBe(false)
  })

  /**
   * ══ THE PATTERN, AND WHY IT LOOKS LIKE THIS ═══════════════════════════════
   *
   * Every link in chapter-nav.tsx is a TEMPLATE LITERAL —
   * `href={`/book-chapter-${current.number}/substack`}` — because the chapter
   * number is interpolated. A first version of this guard excluded braces from
   * the captured text, so it matched none of them: it passed because the links
   * were already gone, not because it could see them. Sabotage 605 put one
   * back and the guard stayed green.
   *
   * So the pattern captures whatever sits between matching quotes or
   * backticks, braces included, and `${…}` is then substituted with a real
   * chapter number before classifying. The non-vacuity check below asserts
   * that a templated export href IS matched, which is the thing that failed.
   */
  const HREF = /href=\{?([`"'])((?:(?!\1).)*)\1/g

  function hrefTargets(source: string): string[] {
    return [...source.matchAll(HREF)].map((m) => m[2].replace(/\$\{[^}]*\}/g, "7"))
  }

  it("the href pattern can see a templated export link", () => {
    const sample = "<Link href={`/book-chapter-${current.number}/substack`}>x</Link>"
    expect(hrefTargets(sample)).toEqual(["/book-chapter-7/substack"])
    expect(requiresAdminSurface(hrefTargets(sample)[0])).toBe(true)
  })

  it("the public chapter pages no longer link to any export", () => {
    const nav = readFileSync(join(ROOT, "components/book/chapter/chapter-nav.tsx"), "utf8")
    const targets = hrefTargets(nav)
    // Non-vacuity: the file still has links, so an empty result would mean the
    // pattern stopped working rather than that the exports went away.
    expect(targets.length, "no hrefs found in chapter-nav.tsx").toBeGreaterThan(0)
    const offenders = targets.filter((t) => requiresAdminSurface(t))
    expect(offenders, `chapter-nav links exports: ${offenders.join(", ")}`).toEqual([])
  })

  it("the author still has a way in, behind the same gate", () => {
    const page = join(ROOT, "app/admin/book-exports/page.tsx")
    expect(existsSync(page)).toBe(true)
    const src = readFileSync(page, "utf8")
    const sf = ts.createSourceFile("page.tsx", src, ts.ScriptTarget.ESNext, true)
    const calls = new Set<string>()
    ;(function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) calls.add(node.expression.text)
      ts.forEachChild(node, visit)
    })(sf)
    expect(calls.has("verifyAdminCookie"), "the export index does not verify the admin cookie").toBe(true)
    // It is under /admin, so proxy.ts does not gate it — its own check is the control.
    expect(classifyPageRoute("/admin/book-exports")).toBe("INTERNAL")
  })
})

/* ── 5. The sitemap cannot advertise a refused route ─────────────────────── */

describe("the sitemap and the launch surface agree", () => {
  it("no static sitemap path is refused at runtime", () => {
    const advertised = STATIC_PATHS.map((p) => p.path || "/")
    const refused = advertised.filter((p) => !isServableInV1(p))
    expect(refused, `sitemap advertises refused routes: ${refused.join(", ")}`).toEqual([])
  })

  it("it still advertises the V1 funnel and the public library", () => {
    const advertised = new Set(STATIC_PATHS.map((p) => p.path || "/"))
    for (const p of ["/", "/assessment", "/assessment/you", "/pricing", "/method", "/help", "/book", "/food"]) {
      expect(advertised, p).toContain(p)
    }
    // Not reduced to the sixteen: the content surface is a different thing.
    expect(advertised.size).toBeGreaterThan(16)
  })
})

/* ── 6. A served redirect must not land on a refusal ─────────────────────── */

describe("no served route redirects into a refused one", () => {
  /**
   * ══ WHY THIS EXISTS ═══════════════════════════════════════════════════════
   *
   * /gut-brain looked like content from every angle the other guards can see:
   * a page file, a sitemap entry, a Learn-menu item, a link on all four
   * condition pages. Its entire body was `redirect("/mind")`, and /mind is a
   * Food System V1 does not sell. Classifying it PUBLIC_CONTENT meant the gate
   * served it and Next then sent the customer into a 404 on the next hop.
   *
   * It was found by walking every served route against a running server, not
   * by reading the classifier — so the finding is pinned here, statically, and
   * runs on every CI pass rather than only when someone remembers to sweep.
   */
  const SERVED: V1SurfaceClass[] = [
    "V1_CORE", "V1_SUPPORTING", "V1_ESSENTIAL", "PUBLIC_CONTENT", "LEGACY_REDIRECT",
  ]

  /** The literal target of a top-level `redirect("...")`, if the page is only that. */
  function literalRedirectTarget(file: string): string | null {
    if (!existsSync(file)) return null
    const src = readFileSync(file, "utf8")
    const m = /\bredirect\(\s*"(\/[^"]*)"\s*\)/.exec(src)
    return m ? m[1] : null
  }

  const servedRoutes = ROUTES.filter((r) => SERVED.includes(classifyPageRoute(asRequestPath(r))))
  const redirects = servedRoutes
    .map((r) => [r, literalRedirectTarget(join(ROOT, "app", r === "/" ? "" : r, "page.tsx"))] as const)
    .filter((pair): pair is readonly [string, string] => pair[1] !== null)

  it("finds the redirects it is meant to check", () => {
    // Non-vacuity: /reports and /trilogy are both bare redirects today.
    const froms = redirects.map(([from]) => from)
    expect(froms).toContain("/reports")
    expect(froms).toContain("/trilogy")
  })

  it("every one of them lands somewhere V1 serves", () => {
    const bad = redirects
      .filter(([, to]) => !isServableInV1(to))
      .map(([from, to]) => `${from} → ${to} [${classifyPageRoute(to)}]`)
    expect(bad, `served redirects into refused routes:\n  ${bad.join("\n  ")}`).toEqual([])
  })

  it("and /gut-brain is refused rather than served into /mind", () => {
    expect(literalRedirectTarget(join(ROOT, "app/gut-brain/page.tsx"))).toBe("/mind")
    expect(isServableInV1("/gut-brain")).toBe(false)
  })
})

/* ── 7. Nothing a customer can reach links into a refusal ────────────────── */

describe("no served page offers a way into a Post-V1 product", () => {
  /**
   * ══ WHY THIS WALKS THE IMPORT GRAPH ═══════════════════════════════════════
   *
   * "The nav config no longer lists /stability" is a claim about one file.
   * What a customer experiences is every link rendered by every component a
   * served page pulls in, however deep. Checking lib/nav.ts alone would have
   * missed all eight of the links this found on first run — in /about, /help,
   * /food, /biotics, /waitlist, the account dashboard and the assessment
   * intro — none of which go anywhere near the nav config.
   *
   * So: start at every page the classifier says is served, follow imports to
   * a fixed point, and read the hrefs in that set. That is reachability, which
   * is the property, rather than the presence of a string in a file somebody
   * remembered to name.
   */
  const EXTS = [".tsx", ".ts"]

  function resolveSpec(spec: string, fromFile: string): string | null {
    let base: string
    if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2))
    else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec)
    else return null
    for (const e of EXTS) if (existsSync(base + e)) return base + e
    for (const e of EXTS) if (existsSync(join(base, "index" + e))) return join(base, "index" + e)
    return null
  }

  function reachableFrom(entries: string[]): Set<string> {
    const seen = new Set<string>()
    const queue = [...entries]
    while (queue.length) {
      const f = queue.pop()
      if (!f || seen.has(f) || !existsSync(f)) continue
      seen.add(f)
      const src = readFileSync(f, "utf8")
      // Both quote styles. app/layout.tsx uses single quotes, and a
      // double-quote-only pattern silently dropped the entire root layout —
      // the nav, the footer and everything they mount — from the walk. The
      // "actually reaches the site" check below is what caught that.
      for (const m of src.matchAll(/from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        const r = resolveSpec(m[1] ?? m[2], f)
        if (r) queue.push(r)
      }
    }
    return seen
  }

  const SERVED_CLASSES: V1SurfaceClass[] = [
    "V1_CORE", "V1_SUPPORTING", "V1_ESSENTIAL", "PUBLIC_CONTENT", "LEGACY_REDIRECT",
  ]
  const servedRoutes = ROUTES.filter((r) => SERVED_CLASSES.includes(classifyPageRoute(asRequestPath(r))))
  const entries = servedRoutes
    .map((r) => join(ROOT, "app", r === "/" ? "" : r, "page.tsx"))
    .concat(join(ROOT, "app/layout.tsx"))
  const files = reachableFrom(entries)

  function offendingLinks(fileSet: Set<string>): string[] {
    const out: string[] = []
    for (const f of fileSet) {
      const src = readFileSync(f, "utf8")
      // JSX attributes only — `href="/x"` and `href={"/x"}`.
      //
      // Widening this to config-object `href:` properties was tried and
      // reverted. It flagged lib/systems.ts, which carries an href for every
      // Food System as product architecture and is reachable because
      // components/home/ecosystem.tsx imports the catalog — but that
      // component no longer renders any of them as links. The pattern also
      // bought nothing it claimed to: a config whose entries ARE rendered goes
      // through `href={item.href}`, which no source pattern can resolve.
      //
      // Rendered links from data are proven where they can be: lib/nav.ts has
      // its own check below, and tests/e2e/v1-launch-surface.spec.ts crawls the
      // real DOM of served pages, which is the only place a computed href
      // becomes a real one.
      for (const m of src.matchAll(/href=\{?["'](\/[^"'#?{}]*)["']/g)) {
        const cls = classifyPageRoute(m[1])
        if (cls === "POST_V1" || cls === "UNCLASSIFIED") {
          out.push(`${f.replace(ROOT + "/", "")} → ${m[1]} [${cls}]`)
        }
      }
    }
    return [...new Set(out)].sort()
  }

  it("the walk actually reaches the site", () => {
    expect(servedRoutes.length).toBeGreaterThan(50)
    expect(files.size).toBeGreaterThan(200)
    expect([...files].some((f) => f.endsWith("/components/nav.tsx"))).toBe(true)
    expect([...files].some((f) => f.endsWith("/components/footer.tsx"))).toBe(true)
  })

  it("no reachable file links to a refused route", () => {
    const bad = offendingLinks(files)
    expect(bad, `links into refused routes:\n  ${bad.join("\n  ")}`).toEqual([])
  })

  it("the check would see such a link if one existed", () => {
    // Non-vacuity: the Post-V1 entry cards still contain exactly these links,
    // which is why they are not in the served graph any more.
    const parked = join(ROOT, "components/account/post-v1-entry-cards.tsx")
    expect(existsSync(parked)).toBe(true)
    expect(offendingLinks(new Set([parked])).length).toBeGreaterThan(0)
    expect(files.has(parked), "an unmounted Post-V1 card is back in the served graph").toBe(false)
  })

  it("the header navigation offers no refused destination", () => {
    const nav = readFileSync(join(ROOT, "lib/nav.ts"), "utf8")
    for (const m of nav.matchAll(/href:\s*["']([^"']+)["']/g)) {
      expect(isServableInV1(m[1]), `lib/nav.ts still lists ${m[1]}`).toBe(true)
    }
    // …and the funnel is still findable from the chrome.
    expect(nav).toContain('"/pricing"')
    expect(nav).toContain('"/help"')
    expect(readFileSync(join(ROOT, "components/nav.tsx"), "utf8")).toContain('href="/assessment"')
  })
})
