import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import ts from "typescript"
import { isFoodSystemV1PreviewEligible } from "@/lib/fss/preview/preview-policy"
import { isCanonicalReportPreviewEligible } from "@/lib/report/presentation/preview-policy"
import { classifyPageRoute, FIXTURE_SELF_GATED_ROUTES, isServableInV1 } from "@/lib/v1-surface"
import { STATIC_PATHS } from "@/app/sitemap"
import { NAV_LINKS, NAV_GROUPS } from "@/lib/nav"

const ROUTE = "/preview/food-system-v1"
const PAGE = "app/preview/food-system-v1/page.tsx"
const POLICY = "lib/fss/preview/preview-policy.ts"

/**
 * ══ THE ONE GATE, TESTED AS IF IT WERE THE ONLY THING STANDING THERE ════════
 *
 * Because it is. The founder's instruction was one well-tested fail-closed
 * mechanism rather than two overlapping ones for the appearance of safety —
 * which is right, and which means this file carries the whole weight.
 *
 * What it is protecting against is not a hacker. It is an ordinary sequence of
 * events: somebody shares a preview URL, it gets indexed or forwarded, and a
 * page rendering "Your Food System Score™" from unapproved methodology becomes
 * a thing people have seen. Every assertion below is about making that
 * impossible by construction rather than by care.
 */

describe("1–2 · non-production runtimes can reach it", () => {
  it("a local dev server can", () => {
    expect(isFoodSystemV1PreviewEligible({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv)).toBe(true)
  })

  it("a test runner can", () => {
    expect(isFoodSystemV1PreviewEligible({ NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv)).toBe(true)
  })

  it("a Vercel preview deployment can", () => {
    expect(isFoodSystemV1PreviewEligible({ VERCEL_ENV: "preview" } as unknown as NodeJS.ProcessEnv)).toBe(true)
    expect(isFoodSystemV1PreviewEligible({ VERCEL_ENV: "development" } as unknown as NodeJS.ProcessEnv)).toBe(true)
  })
})

describe("3 · production is refused, and so is anything unproven", () => {
  it("VERCEL_ENV=production is refused", () => {
    expect(isFoodSystemV1PreviewEligible({ VERCEL_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe(false)
  })

  it("production is refused even when NODE_ENV claims otherwise", () => {
    expect(
      isFoodSystemV1PreviewEligible({ VERCEL_ENV: "production", NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv),
    ).toBe(false)
  })

  it("an empty environment is refused — absence is not evidence of safety", () => {
    expect(isFoodSystemV1PreviewEligible({} as unknown as NodeJS.ProcessEnv)).toBe(false)
  })

  it("an unrecognised VERCEL_ENV is refused", () => {
    for (const v of ["staging", "prod", "PRODUCTION", "preview ", "", "true"]) {
      expect(isFoodSystemV1PreviewEligible({ VERCEL_ENV: v } as unknown as NodeJS.ProcessEnv), v).toBe(false)
    }
  })

  it("NODE_ENV=production with no Vercel is refused", () => {
    expect(isFoodSystemV1PreviewEligible({ NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe(false)
  })

  it("the page refuses with notFound(), not a redirect or an explanation", () => {
    /*
     * A redirect or a "not available here" page CONFIRMS the route exists,
     * which is a smaller leak than serving it and still a leak. notFound() is
     * indistinguishable from a URL that was never built.
     */
    const src = readFileSync(PAGE, "utf-8")
    expect(src).toMatch(/if\s*\(!isFoodSystemV1PreviewEligible\(\)\)\s*notFound\(\)/)
    expect(src).not.toMatch(/\bredirect\(/)
  })
})

describe("4–7 · nothing from the REQUEST can override the refusal", () => {
  /*
   * These four are asserted STRUCTURALLY rather than by simulating requests,
   * and that is the stronger claim. A behavioural test proves a query parameter
   * does not work today; this proves the decision cannot see one at all,
   * because the only input the policy accepts is the environment.
   */
  /*
   * COMMENTS STRIPPED BEFORE MATCHING, and this is not a detail. The first
   * version of these rules failed — against the policy's own docblock, which
   * explains at length that no query parameter, cookie or auth state can
   * override the refusal. The guard was reading the sentence describing the
   * prohibition and calling it a violation.
   *
   * That is the FIFTH time this exact shape has appeared in this engagement: a
   * rule that punishes a file for documenting what it refuses to do. The other
   * guards here strip comments for the same reason, and the fix is never to
   * soften the rule.
   */
  const strip = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

  const policySrc = strip(readFileSync(POLICY, "utf-8"))
  const pageSrc = strip(readFileSync(PAGE, "utf-8"))

  it("the policy's only parameter is the environment", () => {
    const sf = ts.createSourceFile(POLICY, policySrc, ts.ScriptTarget.Latest, true)
    let fn: ts.FunctionDeclaration | undefined
    sf.forEachChild((n) => {
      if (ts.isFunctionDeclaration(n) && n.name?.text === "isFoodSystemV1PreviewEligible") fn = n
    })
    expect(fn, "policy function not found").toBeTruthy()
    expect(fn!.parameters).toHaveLength(1)
    expect(fn!.parameters[0].name.getText(sf)).toBe("env")
  })

  it.each([
    ["a query parameter", /searchParams|URLSearchParams|\bquery\b/],
    ["a header", /headers\(|request\.headers|\bHeaders\b/],
    ["a cookie", /cookies\(|\bcookie/i],
    ["auth state", /getUser|getSupabase|session|auth/i],
  ])("the policy cannot read %s", (_what, pattern) => {
    expect(pattern.test(policySrc), `${POLICY} reads ${_what}`).toBe(false)
  })

  it("the page calls the policy with NO arguments", () => {
    // Passing anything would open a channel for a caller to decide the answer.
    expect(pageSrc).toMatch(/isFoodSystemV1PreviewEligible\(\)/)
    expect(pageSrc).not.toMatch(/isFoodSystemV1PreviewEligible\([^)]+\)/)
  })

  it("the policy is not client-readable — nothing NEXT_PUBLIC_", () => {
    expect(policySrc).not.toContain("NEXT_PUBLIC_")
  })

  it("no environment variable can TURN IT ON either", () => {
    /*
     * The gate reads VERCEL_ENV and NODE_ENV and nothing else. A dedicated
     * enable-flag would be the obvious next thing somebody adds, and it would
     * make production reachable with one dashboard edit.
     */
    const envReads = [...policySrc.matchAll(/env\.([A-Z_]+)/g)].map((m) => m[1])
    expect([...new Set(envReads)].sort()).toEqual(["NODE_ENV", "VERCEL_ENV"])
  })

  it("production stays refused against a kitchen sink of would-be overrides", () => {
    expect(
      isFoodSystemV1PreviewEligible({
        VERCEL_ENV: "production",
        NODE_ENV: "development",
        ENABLE_FSS_PREVIEW: "true",
        FSS_V1_PREVIEW: "1",
        NEXT_PUBLIC_FSS_PREVIEW: "true",
        PREVIEW: "true",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false)
  })
})

describe("the two preview gates are independent, and identical in behaviour", () => {
  /*
   * Duplicated six lines rather than a shared helper, because these are gates
   * on independent unfinished features and a shared helper is a shared switch.
   * The duplication is only defensible if it stays faithful, so it is pinned
   * across every environment either one will ever see.
   */
  const ENVS: NodeJS.ProcessEnv[] = [
    {}, { NODE_ENV: "development" }, { NODE_ENV: "test" }, { NODE_ENV: "production" },
    { VERCEL_ENV: "production" }, { VERCEL_ENV: "preview" }, { VERCEL_ENV: "development" },
    { VERCEL_ENV: "staging" }, { VERCEL_ENV: "production", NODE_ENV: "development" },
  ] as unknown as NodeJS.ProcessEnv[]

  it.each(ENVS.map((e) => [JSON.stringify(e), e] as const))("agree for %s", (_label, env) => {
    expect(isFoodSystemV1PreviewEligible(env)).toBe(isCanonicalReportPreviewEligible(env))
  })
})

describe("8 · the route stays classified", () => {
  it("is FIXTURE_SELF_GATED", () => {
    expect(classifyPageRoute(ROUTE)).toBe("FIXTURE_SELF_GATED")
  })

  it("is in the named registry", () => {
    expect(FIXTURE_SELF_GATED_ROUTES).toContain(ROUTE)
  })

  it("the proxy passes it through, because the PAGE decides", () => {
    /*
     * Not an oversight. lib/v1-surface.ts records the finding: proxy.ts runs on
     * the edge, where Next compiles process.env at BUILD time, so an edge check
     * reports whatever was true when `next build` ran. The page is a Node-
     * runtime server component and reads the variable correctly.
     */
    expect(isServableInV1(ROUTE)).toBe(true)
  })

  it("a sibling under /preview is UNCLASSIFIED, not silently allowed", () => {
    // The class covers this route, not the segment. A second preview page must
    // be classified deliberately rather than inheriting a pass.
    expect(classifyPageRoute("/preview/something-else")).toBe("UNCLASSIFIED")
  })
})

describe("9 · nothing links to it", () => {
  it("is absent from the navigation config", () => {
    const hrefs = [
      ...NAV_LINKS.map((l) => l.href),
      ...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)),
    ]
    expect(hrefs).not.toContain(ROUTE)
    expect(hrefs.some((h) => h.startsWith("/preview/"))).toBe(false)
  })

  it("no file under app/ or components/ links to it", () => {
    /*
     * The route is refused in production, so a link would be a dead end rather
     * than a leak — but a dead link in navigation is its own defect, and this
     * is how the repository already guards its refused routes.
     */
    let hits = ""
    try {
      hits = execFileSync("grep", ["-rl", `href="${ROUTE}"`, "app", "components", "lib"], {
        encoding: "utf-8",
      })
    } catch {
      hits = "" // grep exits 1 when nothing matches, which is the pass
    }
    expect(hits.trim()).toBe("")
  })
})

describe("10 · search engines cannot index it", () => {
  it("the page is noindex", () => {
    expect(readFileSync(PAGE, "utf-8")).toMatch(/robots:\s*"noindex"/)
  })

  it("is absent from the sitemap", () => {
    expect(STATIC_PATHS.map((p) => p.path)).not.toContain(ROUTE)
  })

  it("NON-VACUITY: the sitemap is not simply empty", () => {
    expect(STATIC_PATHS.length).toBeGreaterThan(10)
    expect(STATIC_PATHS.map((p) => p.path)).toContain("/assessment")
  })
})
