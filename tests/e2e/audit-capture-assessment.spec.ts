import { test, expect, type Page } from "@playwright/test"
import { mkdirSync } from "node:fs"

import {
  COMMITTED_ROOT,
  CORPUS_ROOT,
  mergeIntoManifest,
  readShards,
  sha256Of,
  copyToCommitted,
  writeShard,
} from "./audit-manifest"
import {
  answer,
  answeredCount,
  blockWrites,
  ASSESSMENT_CLOCK,
  ASSESSMENT_ROUTE,
  clearAssessment,
  expectResults,
  freezeDate,
  high,
  low,
  openChooser,
  openIntro,
  seedConsent,
  startQuestions,
  uniform,
  varied,
} from "./assessment-walk"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0 — THE LIVE ASSESSMENT AND ITS RESULTS.

   `/assessment` is `V1_CORE`: the free product, the top of the commercial
   funnel, and the only instrument a non-paying person completes. It is
   Generation 2, sitting between the Generation 1 dashboard and the Generation 4
   Food System, which is why its evidence answers the architectural question
   Experience 0 exists for:

     Does the journey terminate in a report, or does it establish My Food
     System?

   ══ WHAT IS NOT CAPTURED, AND WHY THAT IS THE FINDING ═══════════════════════

   No "What You Notice" state and no "Food Context" state, because THE PRODUCT
   HAS NEITHER HERE. `lib/assessment-data.ts` is 16 scored questions; the
   observation and context models live in the paid deep assessment and in
   FSS-v1. Manufacturing those states would be inventing evidence, and their
   absence is itself the structural answer: the free instrument cannot establish
   a Food System because it never gathers what one is made of.

   ══ FOUR ANSWER SHEETS, BECAUSE RESULTS BRANCHES ════════════════════════════

   Results renders a profile type and profile-dependent copy. A single sheet
   would photograph one branch and imply it is the page, so low, varied and high
   are all captured. Offsets are fixed, never random.
   ════════════════════════════════════════════════════════════════════════════ */

const SURFACE = "assessment"
const CORPUS = `${CORPUS_ROOT}/${SURFACE}`
const COMMITTED = `${COMMITTED_ROOT}/${SURFACE}`
const COMPONENT = "components/assessment/assessment-client.tsx"

const WIDTHS = [
  ["390", 390, 844],
  ["834", 834, 1112],
  ["1280", 1280, 900],
] as const

/** The citation set the audit document points at. */
const REPRESENTATIVE = new Set([
  "assessment-intro-entry-390.png",
  "assessment-intro-entry-1280.png",
  "assessment-questions-first-390.png",
  "assessment-questions-first-1280.png",
  "assessment-results-varied-390.png",
  "assessment-results-varied-1280.png",
  "assessment-resume-interrupted-1280.png",
])

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(320, Math.floor(window.innerHeight * 0.8))
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    }
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 150))
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 150))
  })
  await page
    .waitForFunction(() => document.querySelectorAll('[data-revealed="false"]').length === 0, undefined, {
      timeout: 5000,
    })
    .catch(() => {})
  await page
    .waitForFunction(
      () => Array.from(document.images).every((i) => i.complete && (i.naturalWidth > 0 || i.currentSrc === "")),
      undefined,
      { timeout: 8000 },
    )
    .catch(() => {})
}

async function capture(
  page: Page,
  state: string,
  section: string,
  label: string,
  width: number,
  height: number,
  errors: string[],
): Promise<void> {
  await settle(page)
  const file = `${SURFACE}-${state}-${section}-${label}.png`
  await page.screenshot({ path: `${CORPUS}/${file}`, fullPage: true, animations: "disabled" })

  /*
   * 0R-6R · gated. Without EATOBIOTICS_AUDIT_WRITE_FROZEN=1 nothing is copied
   * into the committed set and the row records "archive-only".
   */
  const committed =
    REPRESENTATIVE.has(file) && copyToCommitted(`${CORPUS}/${file}`, COMMITTED, file) === "committed"

  writeShard({
    file,
    surface: SURFACE,
    route: ASSESSMENT_ROUTE,
    state,
    section,
    viewport: `${width}x${height}`,
    frozenClock: ASSESSMENT_CLOCK,
    evidenceKind: "real live UI",
    component: COMPONENT,
    findings: [],
    consoleErrors: errors.length,
    consoleErrorTexts: errors.map((e) => e.replace(/\s+/g, " ").slice(0, 160)),
    sha256: sha256Of(`${CORPUS}/${file}`),
    storage: committed ? "committed" : "archive-only",
  })
}

function recordErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  return errors
}

async function prepare(page: Page, width: number, height: number): Promise<string[]> {
  await page.setViewportSize({ width, height })
  const errors = recordErrors(page)
  await seedConsent(page)
  await freezeDate(page)
  // Nothing this capture does may reach a database or an inbox. See blockWrites.
  await blockWrites(page)
  return errors
}

/* ── The journey, in order ────────────────────────────────────────────────── */

test.describe("Assessment corpus — entry, questions, completion", () => {
  mkdirSync(CORPUS, { recursive: true })
  mkdirSync(COMMITTED, { recursive: true })

  for (const [label, width, height] of WIDTHS) {
    test(`journey @ ${label}`, async ({ page }) => {
      const errors = await prepare(page, width, height)

      // 1 · the front door is a FOUNDATION CHOOSER, not the assessment
      await openChooser(page)
      await capture(page, "chooser", "foundation", label, width, height, errors)

      // 2 · the You intro, which is a marketing page wrapped around a lead form
      await openIntro(page)
      await capture(page, "intro", "entry", label, width, height, errors)

      // 3 · the first question — the hierarchy test
      await startQuestions(page)
      await capture(page, "questions", "first", label, width, height, errors)

      // 4 · mid-flow, where progress comprehension actually matters
      await answer(page, varied, 6)
      await capture(page, "questions", "mid", label, width, height, errors)

      // 5 · completion
      await answer(page, varied)
      await expectResults(page)
      await capture(page, "results", "varied", label, width, height, errors)
    })

    test(`low and high results @ ${label}`, async ({ page }) => {
      const errors = await prepare(page, width, height)

      await openIntro(page)
      await clearAssessment(page)
      await page.reload()
      await startQuestions(page)
      await answer(page, low)
      await expectResults(page)
      await capture(page, "results", "low", label, width, height, errors)

      // A second, independent run at the other end of the range. The YOU route,
      // not `/assessment` — that is the foundation chooser and has no form.
      await clearAssessment(page)
      await openIntro(page)
      await startQuestions(page)
      await answer(page, high)
      await expectResults(page)
      await capture(page, "results", "high", label, width, height, errors)
    })

    test(`resume after interruption @ ${label}`, async ({ page }) => {
      const errors = await prepare(page, width, height)

      await openIntro(page)
      await clearAssessment(page)
      await page.reload()
      await startQuestions(page)
      await answer(page, uniform, 5)

      /*
       * Resume is a REAL product behaviour, not a harness simulation:
       * `assessment-client.tsx` persists the whole state to localStorage on
       * every change. Reloading is exactly what an interrupted person does.
       */
      const before = await answeredCount(page)
      expect(before, "nothing was answered, so there is no interruption to resume").toBeGreaterThan(0)

      await page.reload()
      await page.waitForLoadState("networkidle")
      await capture(page, "resume", "interrupted", label, width, height, errors)

      const after = await answeredCount(page)
      expect(after, "answers did not survive the reload").toBe(before)
    })
  }
})

/* ── The claims assertions, kept continuously proved ──────────────────────── */

test.describe("what Results may and may not say", () => {
  /*
   * `three-biotics-result.tsx` records in its own docblock that each card once
   * carried `{insight.score}` and an "X out of 100" per-Biotic value, and that
   * the numbers were removed while the guidance was kept.
   *
   * VERIFIED BY RENDER rather than trusted. This is the exact claim class this
   * programme has watched regress four times in four different forms, and a
   * docblock describing a past fix is not evidence of a present state.
   */
  test("Results carries no personal per-Biotic number", async ({ page }) => {
    await prepare(page, 1280, 900)
    await openIntro(page)
    await clearAssessment(page)
    await page.reload()
    await startQuestions(page)
    await answer(page, varied)
    await expectResults(page)

    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    for (const biotic of ["Prebiotic", "Probiotic", "Postbiotic"]) {
      // "Prebiotic 72", "Probiotic: 40", "Postbiotic 18 out of 100"
      expect(
        body,
        `Results renders a number against ${biotic} — the per-Biotic value has returned`,
      ).not.toMatch(new RegExp(`${biotic}s?\\b[^.!?\\n]{0,20}\\b\\d{1,3}\\b`, "i"))
    }

    // And the possessive form the permanent rule names explicitly.
    expect(body).not.toMatch(/\byour\s+(?:pre|pro|post)biotics?\s+(?:score|level|state)\b/i)
  })

  /*
   * P0-TRUST-04 — "Appears strongest" over text calling that Biotic the thinner
   * part. Kept continuously proved, because `food-system-pattern.tsx`'s own
   * docblock records this exact contradiction being found and fixed ONCE, for
   * the equal-scores case. It survives in the sibling branch.
   */
  test("P0-TRUST-04 · the strongest card may contradict its own heading", async ({ page }) => {
    await prepare(page, 1280, 900)
    await openIntro(page)
    await clearAssessment(page)
    await page.reload()
    await startQuestions(page)
    await answer(page, varied)
    await expectResults(page)

    const card = page.locator("div", { has: page.getByText("Appears strongest", { exact: true }) }).last()
    const text = (await card.innerText()).replace(/\s+/g, " ")

    /*
     * If this test FAILS, the contradiction has been repaired and the register
     * entry should move to resolved — it is written to fail on a fix, not to
     * demand the defect stay.
     */
    expect(
      text,
      "the 'Appears strongest' card no longer carries thinner-part copy — has P0-TRUST-04 been repaired?",
    ).toMatch(/thinner part|room for more|there is room/i)
  })
})

test.afterAll(() => {
  const rows = readShards([SURFACE])
  if (rows.length === 0) return
  mergeIntoManifest([SURFACE], rows)
})
