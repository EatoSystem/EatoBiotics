import { test, expect, type Page } from "@playwright/test"
import { copyFileSync, mkdirSync } from "node:fs"

import {
  COMMITTED_ROOT,
  CORPUS_ROOT,
  mergeIntoManifest,
  readShards,
  sha256Of,
  writeShard,
  type ManifestRow,
} from "./audit-manifest"
import {
  ASSESSMENT_CLOCK,
  answer,
  blockWrites,
  freezeDate,
  openIntro,
  seedConsent,
  startQuestions,
  varied,
  low,
  high,
} from "./assessment-walk"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0 STEP 7 — THE REPORTS CAPTURE HARNESS.

   ══ THE PREMISE THE SOURCE OVERTURNED ═══════════════════════════════════════

   The step-7 brief called the report family "intentionally refused, source-mode
   only". That is true of FOUR routes and false of the two that matter most:

     /assessment/report        V1_CORE_ROUTES — the LIVE, SOLD, €49 Personal
                               Food System Report. Not refused. The classifier
                               says so in its own words: "that is
                               /assessment/report, which stays. No money path is
                               refused here."
     /demo/food-system-report  FIXTURE_SELF_GATED_ROUTES — the canonical
                               deterministic Report preview, which the a11y and
                               print suites already render.

   So this surface gets RENDERED evidence, at the same evidentiary standard as
   Account, Assessment and the Twin. The eight refused routes stay refused and
   are re-verified 404 below; no fixture is built for them and no screenshot is
   manufactured.

   ══ HOW THE PAID REPORT IS REACHED, AND WHAT THAT COSTS ═════════════════════

   `playwright.config.ts` sets EATOBIOTICS_ALLOW_UNVERIFIED_PAID_FLOW, which
   `isUnverifiedPaidFlowAllowed` honours ONLY together with a provably
   non-production runtime. The page then returns <FullReportClient tier="full" />,
   which composes the document CLIENT-SIDE from the assessment in localStorage.

   So the capture makes no Stripe call, no Supabase read and no payment — and
   the content it photographs is derived from answers this harness actually gave
   through the real assessment UI, with writes aborted at the browser.

   `the flag changes reachability, not content` below is the assertion that
   makes this evidence rather than decoration. A flag that altered what the
   document CLAIMS would invalidate every finding taken from these images.

   ══ THREE SHEETS, BECAUSE THE REPORT BRANCHES ═══════════════════════════════

   The legacy Report ranks the member's Biotic pathways and leads with the
   weakest. A single sheet would photograph one branch and imply it is the
   document, which is the mistake step 4 corrected on My Food System.
   ════════════════════════════════════════════════════════════════════════════ */

const SURFACE = "reports"
const CORPUS = `${CORPUS_ROOT}/${SURFACE}`
const COMMITTED = `${COMMITTED_ROOT}/${SURFACE}`

/** The paid Report is reached with any session id once the flag is honoured. */
const PAID_ROUTE = "/assessment/report?session_id=audit-fixture"
const CANONICAL_ROUTE = "/demo/food-system-report"

/**
 * The three answer sheets, and what each exists to show.
 *
 * Fixed offsets, never random — the corpus has to be reproducible, and
 * `varied` is the same function the assessment corpus used in step 5 so the two
 * surfaces are comparable.
 */
const SHEETS = [
  ["varied", varied, "differentiated pathways — the ordinary case"],
  ["low", low, "the bottom of the score range"],
  ["high", high, "the top of the score range"],
] as const

const WIDTHS = [
  ["390", 390, 844],
  ["834", 834, 1112],
  ["1280", 1280, 900],
] as const

/** Declared rather than inferred from the output, as on every other surface. */
const EXPECTED_ROWS = SHEETS.length * WIDTHS.length + WIDTHS.length

/**
 * The citation set: one image per finding, at the width that shows it, plus the
 * canonical Report at both extremes so the two documents can be compared side
 * by side in the audit. Not a sample — the specific pictures the register
 * points at.
 */
const REPRESENTATIVE = new Set([
  "reports-paid-varied-1280.png",
  "reports-paid-varied-390.png",
  "reports-paid-low-1280.png",
  "reports-canonical-1280.png",
  "reports-canonical-390.png",
])

/**
 * Every refused report route, re-verified rather than read from
 * `POST_V1_ROUTES`. Step 6 established the habit: the classifier's intent and
 * the server's answer are different facts.
 */
const REFUSED = [
  "/report",
  "/report-you",
  "/report-mind",
  "/report-family",
  "/account/report/demo",
  "/account/doctor-report",
  "/stability/report",
] as const

/** Complete a real assessment, writes aborted, and land on the paid Report. */
async function walkToPaidReport(
  page: Page,
  pick: (i: number) => number,
): Promise<{ attemptedWrites: string[]; console: string[] }> {
  const errors: string[] = []
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })

  await seedConsent(page)
  const attemptedWrites = await blockWrites(page)
  await freezeDate(page)

  await openIntro(page)
  await startQuestions(page)
  const answered = await answer(page, pick)
  expect(answered, "the assessment did not complete, so the Report has no input").toBeGreaterThan(10)

  await page.goto(PAID_ROUTE)
  await page.waitForLoadState("networkidle")
  return { attemptedWrites, console: errors }
}

/** Settle scroll-reveals and decode images, as the account harness does. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 400))
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 300))
    await Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map((i) => i.decode().catch(() => undefined)),
    )
  })
  await page.waitForTimeout(250)
}

async function capture(
  page: Page,
  file: string,
  row: Omit<ManifestRow, "file" | "sha256" | "storage">,
): Promise<void> {
  mkdirSync(CORPUS, { recursive: true })
  const path = `${CORPUS}/${file}`
  await settle(page)
  await page.screenshot({ path, fullPage: true, animations: "disabled" })

  const storage = REPRESENTATIVE.has(file) ? "committed" : "archive-only"
  if (storage === "committed") {
    mkdirSync(COMMITTED, { recursive: true })
    copyFileSync(path, `${COMMITTED}/${file}`)
  }
  writeShard({ ...row, file, sha256: sha256Of(path), storage })
}

/*
 * Serial, so ONE worker owns every shard and the completeness check below sees
 * all of them. Under `fullyParallel` each worker runs its own `afterAll` when
 * its slice finishes, and an early worker reported "10 of 12" for a corpus that
 * was in fact complete — the same shard/worker race `audit-manifest.ts` was
 * built for, surfacing in the assertion rather than in the manifest.
 */
test.describe.configure({ mode: "serial" })

test.describe("Reports corpus — the two surfaces that are NOT refused", () => {
  for (const [sheet, pick, why] of SHEETS) {
    for (const [label, width, height] of WIDTHS) {
      test(`paid €49 Report · ${sheet} @ ${label}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        const { attemptedWrites, console: errors } = await walkToPaidReport(page, pick)

        // The walk passes through the assessment, which attempts submit-lead
        // and send-results-email. Both are aborted at the browser, so nothing
        // reached a database or an inbox — recorded, not hidden.
        expect(
          attemptedWrites.every((w) => w.startsWith("POST /api/")),
          "an unexpected write shape was attempted",
        ).toBe(true)

        await capture(page, `reports-paid-${sheet}-${label}.png`, {
          surface: SURFACE,
          route: PAID_ROUTE,
          state: `paid-${sheet}`,
          section: why,
          viewport: `${width}x${height}`,
          frozenClock: ASSESSMENT_CLOCK,
          evidenceKind: "real live UI",
          component: "components/assessment/full-report-client.tsx",
          findings: [],
          consoleErrors: errors.length,
          consoleErrorTexts: errors.map((e) => e.replace(/\s+/g, " ").slice(0, 160)),
        })
      })
    }
  }

  for (const [label, width, height] of WIDTHS) {
    test(`canonical deterministic Report @ ${label}`, async ({ page }) => {
      const errors: string[] = []
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text())
      })
      await page.setViewportSize({ width, height })
      await seedConsent(page)
      await freezeDate(page)
      await page.goto(CANONICAL_ROUTE)
      await page.waitForLoadState("networkidle")

      // The fixture composes at FINALISED_AT, so the document is the same on
      // every run regardless of when it is captured.
      await expect(page.locator("body")).toBeVisible()

      await capture(page, `reports-canonical-${label}.png`, {
        surface: SURFACE,
        route: CANONICAL_ROUTE,
        state: "canonical-preview",
        section: "the Phase 4B-S2 fixture Report, real composer and renderer",
        viewport: `${width}x${height}`,
        frozenClock: ASSESSMENT_CLOCK,
        evidenceKind: "fixture-rendered real component",
        component: "components/report/canonical/canonical-report.tsx",
        findings: [],
        consoleErrors: errors.length,
        consoleErrorTexts: errors.map((e) => e.replace(/\s+/g, " ").slice(0, 160)),
      })
    })
  }

  test.afterAll(() => {
    const rows = readShards([SURFACE])
    expect(
      rows.length,
      `the reports corpus is incomplete: ${rows.length} of ${EXPECTED_ROWS}`,
    ).toBe(EXPECTED_ROWS)
    mergeIntoManifest([SURFACE], rows)
  })
})

test.describe("what the audit must prove before citing these images", () => {
  /**
   * THE ASSERTION THAT MAKES THE CAPTURE EVIDENCE.
   *
   * The paid Report is reached through a flag. If that flag changed what the
   * document SAYS rather than only whether it can be opened, every finding
   * taken from these images would be a finding about the harness.
   *
   * `isUnverifiedPaidFlowAllowed` is consulted exactly once in
   * `app/assessment/report/page.tsx`, before any Stripe call, and it selects
   * BETWEEN RENDERING PATHS — it is not threaded into the report builders. This
   * test holds that structurally: neither the client nor the generators may
   * read the flag at all.
   */
  test("the paid-flow flag changes reachability, not content", async () => {
    const { readFileSync } = await import("node:fs")
    const { UNVERIFIED_PAID_FLOW_FLAG } = await import("@/lib/paid-flow-policy")

    const mustNotRead = [
      "components/assessment/full-report-client.tsx",
      "components/assessment/paid-report-client.tsx",
      "lib/assessment-report.ts",
      "lib/fallback-paid-report.ts",
      "lib/report/build-food-system-report.ts",
      "lib/report/subscores.ts",
      "lib/report/framing.ts",
    ]
    for (const file of mustNotRead) {
      const src = readFileSync(file, "utf8")
      expect(
        src.includes(UNVERIFIED_PAID_FLOW_FLAG) || src.includes("isUnverifiedPaidFlowAllowed"),
        `${file} reads the paid-flow flag, so the captured Report's CONTENT depends on how it was reached — the capture is not evidence`,
      ).toBe(false)
    }

    // And the page consults it once, to choose a branch.
    const page = readFileSync("app/assessment/report/page.tsx", "utf8")
    const uses = page.match(/isUnverifiedPaidFlowAllowed\(/g) ?? []
    expect(uses.length, "the paid page's flag usage changed shape").toBe(1)
  })

  test("every refused report route still refuses", async ({ request }) => {
    for (const route of REFUSED) {
      const res = await request.get(route, { maxRedirects: 0 })
      expect(res.status(), `${route} is no longer refused`).toBe(404)
    }
  })

  test("/reports still redirects to /pricing", async ({ request }) => {
    const res = await request.get("/reports", { maxRedirects: 0 })
    expect([307, 308]).toContain(res.status())
    expect(res.headers()["location"]).toContain("/pricing")
  })

  /**
   * The canonical Report preview reads no database, takes no payment and holds
   * no customer data — its own docblock says so. Proved by render rather than
   * trusted, for the reason `NOTE-FIXTURE-01` exists.
   */
  test("the canonical Report preview issues no write", async ({ page }) => {
    const writes: string[] = []
    page.on("request", (r) => {
      const { pathname } = new URL(r.url())
      if (pathname.startsWith("/api/") && r.method() !== "GET") {
        writes.push(`${r.method()} ${pathname}`)
      }
    })
    await seedConsent(page)
    await page.goto(CANONICAL_ROUTE)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1200)
    expect(writes, "the canonical Report preview performed a WRITE").toEqual([])
  })
})

test.describe("what the render established, stated at its true reach", () => {
  /**
   * WHAT THIS DOES AND DOES NOT PROVE — the correction that matters most.
   *
   * I expected the flag to render the document a paying customer receives. It
   * does not, and `app/assessment/report/page.tsx:128` says so in its own
   * words: `FullReportClient` "renders tier-shaped content with none of their
   * answers in it; showing it would look like fulfilment while quietly
   * substituting someone else's report for theirs."
   *
   * A settled Stripe session returns `PaidReportClient` with a `DeepReport`
   * read from Supabase. This audit cannot read that and will not fabricate one,
   * so the production paid document stays SOURCE-MODE.
   *
   * What IS rendered here is `FullReportClient`, reachable only through the
   * unverified dev flow and through `/assessment/demo` (POST_V1, refused). So
   * it is NOT production-reachable — and it is one `isUnverifiedPaidFlowAllowed`
   * away from being served on the €49 route, which is why it is captured rather
   * than dismissed.
   */
  test("the dev-flow Report renders three personal per-Biotic scores out of 100", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await walkToPaidReport(page, varied)
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    // "Probiotics … 33/100", and "Your probiotics score has clear room to grow".
    for (const biotic of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(
        new RegExp(`${biotic}\\s+\\d{1,3}/100`, "i").test(text),
        `${biotic} no longer carries a personal /100 score in the dev-flow Report — a real product change; re-read the step-7 audit rather than deleting this test`,
      ).toBe(true)
    }
    expect(
      /your (pre|pro|post)biotics score/i.test(text),
      "the possessive per-Biotic phrasing is gone — re-read the step-7 audit",
    ).toBe(true)
  })

  /**
   * THE PRODUCTION PAID CHAIN — source, because it cannot be rendered.
   *
   * A paying customer's document is `PaidReportClient`, and the chain that puts
   * a personal Biotic ranking in front of them is four hops:
   *
   *   build-food-system-report.ts:457-469  composes `dominantPattern` as
   *     "… Prebiotics is well supported while Probiotics is thinner" /
   *     "… Prebiotics is your strongest pathway, and Probiotics is where your
   *      answers point to the clearest first step"
   *   → systemSnapshot.dominantPattern            (:513)
   *   → food-system-section.tsx:398               renders it
   *   → PaidReportClient                          renders FoodSystemSection
   *   → /assessment/report                        V1_CORE, settled session
   *
   * Pinned at source so the audit's claim about the money path cannot rot
   * silently, and so a repair has something that fails when it lands.
   */
  test("the production paid Report composes a personal Biotic ranking", async () => {
    const { readFileSync } = await import("node:fs")

    const builder = readFileSync("lib/report/build-food-system-report.ts", "utf8")
    expect(
      /strongest pathway/i.test(builder) && /PATHWAY_LABEL\[(strongest|priority)Pathway\]/.test(builder),
      "build-food-system-report no longer names a strongest/priority pathway — re-read the step-7 audit",
    ).toBe(true)

    const section = readFileSync("components/report/food-system-section.tsx", "utf8")
    expect(
      section.includes("systemSnapshot.dominantPattern"),
      "FoodSystemSection no longer renders dominantPattern — the chain changed",
    ).toBe(true)

    const client = readFileSync("components/assessment/paid-report-client.tsx", "utf8")
    expect(
      client.includes("PATHWAY_LABEL["),
      "PaidReportClient no longer names a pathway — re-read the step-7 audit",
    ).toBe(true)
  })

  /**
   * The contrast that answers the step's central question: the canonical Report
   * takes the OPPOSITE position, structurally. `capabilities.ts` holds
   * `bioticsLanguage` false and `BIOTICS_TOKENS` is a withheld lexicon, so no
   * customer-facing Biotics word should appear in the rendered document.
   */
  test("the canonical Report renders no customer-facing Biotics language", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await seedConsent(page)
    await page.goto(CANONICAL_ROUTE)
    await page.waitForLoadState("networkidle")
    const text = await page.locator("body").innerText()

    expect(
      /\b(prebiotic|probiotic|postbiotic)s?\b/i.test(text),
      "the canonical Report has started naming the Biotics — the claims gate in lib/report/deterministic/capabilities.ts has opened",
    ).toBe(false)
  })
})
