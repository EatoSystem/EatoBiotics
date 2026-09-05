import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * Phase 3B is NOT activated for paying customers (§5, §47, §49).
 *
 * ══ THE INVARIANT ═══════════════════════════════════════════════════════════
 *
 * `/assessment/deep?session_id=…` — the route a real buyer reaches from Stripe,
 * from a resume link and from email — must still render the legacy client. The
 * deterministic experience is reachable only by asking for it explicitly, on a
 * path that carries no payment and touches no database row.
 *
 * ══ WHY THE NESTING IS THE WHOLE SAFETY ARGUMENT ════════════════════════════
 *
 * The preview branch lives INSIDE the pre-existing `demo === "true"` check. So
 * `?deterministic=true` on its own does nothing at all, and every paid entry
 * point would have to start emitting `demo=true` before a customer could land
 * on it by accident. Hoisting that check to the top level would convert a
 * preview into a production backdoor while looking like a tidy-up, so this file
 * asserts the nesting itself — not merely that both words appear somewhere.
 *
 * This guard is temporary by design. Activation is a later, deliberate change,
 * and it will change these assertions on purpose.
 */

const PAGE = join(process.cwd(), "app/assessment/deep/page.tsx")
const source = readFileSync(PAGE, "utf8")

/** The body of the `if (demo === "true")` block. */
function demoBlock(): string {
  const start = source.indexOf('if (demo === "true") {')
  expect(start, 'the demo branch must exist').toBeGreaterThan(-1)
  const realFlow = source.indexOf("// ── Real flow ")
  expect(realFlow).toBeGreaterThan(start)
  return source.slice(start, realFlow)
}

describe("the deterministic experience is reachable only as an explicit preview", () => {
  it("the preview check is nested inside the demo branch", () => {
    expect(demoBlock()).toContain('if (deterministic === "true")')
  })

  it("there is exactly one deterministic check, and it is that one", () => {
    const all = source.match(/deterministic === "true"/g) ?? []
    expect(all).toHaveLength(1)
  })

  it("the deterministic client is rendered only inside the demo branch", () => {
    const uses = (source.match(/<DeterministicConsultationClient/g) ?? []).length
    expect(uses).toBe(1)
    expect(demoBlock()).toContain("<DeterministicConsultationClient")
  })

  it("the preview returns before any Stripe call", () => {
    const previewAt = source.indexOf('if (deterministic === "true")')
    const stripeAt = source.indexOf("stripe.checkout.sessions.retrieve")
    expect(previewAt).toBeGreaterThan(-1)
    expect(stripeAt).toBeGreaterThan(previewAt)
  })

  it("the preview reads no session id, tier, scores or saved answers", () => {
    const block = demoBlock()
    const preview = block.slice(block.indexOf('if (deterministic === "true")'), block.indexOf("const demoTier"))
    for (const forbidden of ["session_id", "savedQuestions", "savedAnswers", "freeScores", "tier"]) {
      expect(preview, `preview reads ${forbidden}`).not.toContain(forbidden)
    }
  })
})

describe("the real paid route still resolves to the legacy client", () => {
  it("the settled-checkout path renders DeepAssessmentClient", () => {
    const realFlow = source.slice(source.indexOf("// ── Real flow "))
    expect(realFlow).toContain("<DeepAssessmentClient")
    expect(realFlow).not.toContain("DeterministicConsultationClient")
  })

  it("settlement, report-state redirect and resume are all still in place", () => {
    const realFlow = source.slice(source.indexOf("// ── Real flow "))
    expect(realFlow).toContain("isCheckoutSessionSettled")
    expect(realFlow).toContain("reportViewState")
    expect(realFlow).toContain("savedQuestions")
    expect(realFlow).toContain("resolvePaidReportSummary")
  })

  it("a request with no session id still redirects away", () => {
    expect(source).toContain("if (!session_id) {")
  })
})

describe("no paid surface emits the preview parameters", () => {
  /** Every source file that could construct a link into the Consultation. */
  function sourceFiles(): string[] {
    const out: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(process.cwd(), dir))) {
        const rel = `${dir}/${entry}`
        const abs = join(process.cwd(), rel)
        if (statSync(abs).isDirectory()) {
          if (entry === "node_modules" || entry === ".next") continue
          walk(rel)
        } else if (/\.(ts|tsx)$/.test(entry)) {
          out.push(rel)
        }
      }
    }
    for (const root of ["app", "components", "lib"]) walk(root)
    return out
  }

  it("nothing but the page itself mentions the preview parameter", () => {
    const offenders = sourceFiles().filter((f) => {
      if (f === "app/assessment/deep/page.tsx") return false
      return readFileSync(join(process.cwd(), f), "utf8").includes("deterministic=true")
    })
    expect(offenders).toEqual([])
  })

  it("no checkout, webhook or email path builds a demo Consultation link", () => {
    // `demo=true` is the outer gate. A paid surface emitting it would open the
    // preview to real customers even without the inner parameter.
    const paid = sourceFiles().filter((f) =>
      /checkout|stripe|email|webhook|paid-report/.test(f),
    )
    expect(paid.length).toBeGreaterThan(5) // the search is actually finding files
    for (const f of paid) {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      expect(src, `${f} builds a demo Consultation link`).not.toMatch(/assessment\/deep\?[^"'`]*demo=true/)
    }
  })
})

describe("the preview is identifiable from inside the page", () => {
  it("the client renders a standing in-development notice", () => {
    const client = readFileSync(
      join(process.cwd(), "components/assessment/consultation/deterministic-consultation-client.tsx"),
      "utf8",
    )
    expect(client).toContain("Preview — in development")
    expect(client).toMatch(/not the live paid Consultation/i)
    expect(client).toMatch(/nothing is saved/i)
    expect(client).toMatch(/no\s*\n?\s*Report is generated/i)
  })

  it("the notice is not conditional on anything a URL can turn off", () => {
    const client = readFileSync(
      join(process.cwd(), "components/assessment/consultation/deterministic-consultation-client.tsx"),
      "utf8",
    )
    // `preview` defaults to true, and the page passes nothing — so the only way
    // to remove the notice is to edit the component.
    expect(client).toContain("preview = true")
    expect(readFileSync(PAGE, "utf8")).not.toContain("preview={false}")
  })
})
