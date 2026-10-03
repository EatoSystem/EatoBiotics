import { test, expect, type Page } from "@playwright/test"
import { copyFileSync, mkdirSync } from "node:fs"

import {
  COMMITTED_ROOT,
  CORPUS_ROOT,
  mergeIntoManifest,
  readShards,
  sha256Of,
  writeShard,
} from "./audit-manifest"
import {
  answerAll,
  answerVaried,
  completeAssessment,
  enterSystem,
  freezeDate,
  FSS_CLOCK,
  FSS_ROUTE,
  FSS_SECTION_LABELS,
  openSection,
  reassess,
  seedConsent,
  tamperQuestionSetVersion,
  tamperSystemModelVersion,
} from "./fss-walk"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0 — MY FOOD SYSTEM, UNDER THE SAME SCRUTINY AS ACCOUNT.

   Generation 1 was examined and found to carry five P0s. This captures
   Generation 4 at the SAME evidentiary standard, because the question is not
   whether it is nicer:

     Does My Food System remain calm, truthful and coherent when subjected to
     exactly the scrutiny that broke Account?

   Newer is not evidence. If this surface earns the north star it earns it the
   way the other one lost it — by render.

   ══ THE SAME THREE SETTLING MEASURES, FOR THE SAME REASONS ══════════════════

   `animations: "disabled"`, scroll-reveal settling and image-decode waiting all
   earned their place on the account corpus, where they took the unstable count
   from 82 of 105 to 14. They are not re-derived here.

   ══ WHAT IS DIFFERENT FROM ACCOUNT ══════════════════════════════════════════

   Account is a fixture page rendering one component from props. This is the
   REAL preview route driven through the REAL flow — assessment, establishment,
   reassessment, tampering — against real localStorage. There is no fixture to
   disagree with the product, which is a genuinely stronger form of evidence and
   is worth saying plainly when the two corpora are compared.
   ════════════════════════════════════════════════════════════════════════════ */

const SURFACE = "my-food-system"
const CORPUS = `${CORPUS_ROOT}/${SURFACE}`
const COMMITTED = `${COMMITTED_ROOT}/${SURFACE}`
const COMPONENT = "components/fss/my-food-system.tsx"

const WIDTHS = [
  ["390", 390, 844],
  ["834", 834, 1112],
  ["1280", 1280, 900],
] as const

/**
 * The citation set: the pictures the audit document points at. One per question
 * the step exists to answer, not a sample.
 */
const REPRESENTATIVE = new Set([
  "my-food-system-established-today-390.png",
  "my-food-system-established-today-1280.png",
  "my-food-system-established-biotics-1280.png",
  "my-food-system-established-score-1280.png",
  "my-food-system-reassessed-progress-1280.png",
  "my-food-system-unavailable-refusal-1280.png",
  "my-food-system-varied-score-1280.png",
  "my-food-system-varied-today-390.png",
])

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(320, Math.floor(window.innerHeight * 0.8))
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    }
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 120))
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 120))
  })
  await page
    .waitForFunction(() => document.querySelectorAll('[data-revealed="false"]').length === 0, undefined, {
      timeout: 4000,
    })
    .catch(() => {})
  await page
    .waitForFunction(
      () => Array.from(document.images).every((i) => i.complete && (i.naturalWidth > 0 || i.currentSrc === "")),
      undefined,
      { timeout: 6000 },
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

  const committed = REPRESENTATIVE.has(file)
  if (committed) copyFileSync(`${CORPUS}/${file}`, `${COMMITTED}/${file}`)

  writeShard({
    file,
    surface: SURFACE,
    route: FSS_ROUTE,
    state,
    section,
    viewport: `${width}x${height}`,
    frozenClock: FSS_CLOCK,
    evidenceKind: "real live UI, preview-gated",
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

/* ── The seven areas, in three system variants ────────────────────────────── */

test.describe("My Food System corpus — the seven locked areas", () => {
  mkdirSync(CORPUS, { recursive: true })
  mkdirSync(COMMITTED, { recursive: true })

  for (const [label, width, height] of WIDTHS) {
    test(`established @ ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const errors = recordErrors(page)
      await seedConsent(page)
      await freezeDate(page)
      await completeAssessment(page)
      await enterSystem(page)

      for (const section of FSS_SECTION_LABELS) {
        await openSection(page, section)
        await capture(page, "established", section.toLowerCase().replace(/\s+/g, "-"), label, width, height, errors)
      }
    })

    test(`reassessed @ ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const errors = recordErrors(page)
      await seedConsent(page)
      await freezeDate(page)
      await completeAssessment(page)
      await enterSystem(page)
      // A different answer sheet, so What Changed has something to describe.
      await reassess(page, 3)

      for (const section of FSS_SECTION_LABELS) {
        await openSection(page, section)
        await capture(page, "reassessed", section.toLowerCase().replace(/\s+/g, "-"), label, width, height, errors)
      }
    })

    test(`varied @ ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const errors = recordErrors(page)
      await seedConsent(page)
      await freezeDate(page)

      /*
       * A varying answer sheet, so the five domains do NOT all read the same.
       * The uniform sheet is what the behaviour spec uses and it is correct
       * there; for an audit it hides whether the five-row list, the score
       * reveal and the priority ordering cope with real spread.
       */
      await page.goto(FSS_ROUTE)
      await page.getByRole("button", { name: "Start the assessment" }).click()
      await expect(page.getByRole("radiogroup")).toBeVisible()
      await answerVaried(page)
      await enterSystem(page)

      for (const section of FSS_SECTION_LABELS) {
        await openSection(page, section)
        await capture(page, "varied", section.toLowerCase().replace(/\s+/g, "-"), label, width, height, errors)
      }
    })

    test(`comparison-refused @ ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const errors = recordErrors(page)
      await seedConsent(page)
      await freezeDate(page)
      await completeAssessment(page)
      await enterSystem(page)
      await reassess(page, 3)

      // The methods no longer agree, so no delta may be shown. A REFUSAL IS A
      // DESIGNED OUTCOME, not an error path, and it has to be photographed.
      await tamperQuestionSetVersion(page)
      await page.reload()
      await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()

      await openSection(page, "Progress")
      await capture(page, "comparison-refused", "progress", label, width, height, errors)
    })
  }
})

/* ── The route states, which are part of this surface too ─────────────────── */

test.describe("My Food System corpus — route states", () => {
  for (const [label, width, height] of WIDTHS) {
    test(`route states @ ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const errors = recordErrors(page)
      await seedConsent(page)
      await freezeDate(page)

      // 1 · no system, no attempt — a first visit.
      await page.goto(FSS_ROUTE)
      await expect(page.getByRole("button", { name: "Start the assessment" })).toBeVisible()
      await capture(page, "assessment-start", "entry", label, width, height, errors)

      // 2 · an attempt in progress — the only state holding a partial record.
      await page.getByRole("button", { name: "Start the assessment" }).click()
      await expect(page.getByRole("radiogroup")).toBeVisible()
      await capture(page, "assessment-in-progress", "question", label, width, height, errors)

      /*
       * 3 · just established — score, priority and plan, before the shell.
       *
       * `answerAll`, NOT `completeAssessment`: a draft is already open from
       * step 2, so the route no longer shows a start screen. Calling the full
       * helper here failed on exactly that, which is the helper being correct
       * rather than the walk being wrong.
       */
      await answerAll(page, 2)
      await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
      await capture(page, "result", "score-reveal", label, width, height, errors)

      // 4 · a current system that does not validate.
      await enterSystem(page)
      await tamperSystemModelVersion(page)
      await page.reload()
      await expect(page.getByRole("heading", { name: "We are not going to guess" })).toBeVisible()
      await capture(page, "unavailable", "refusal", label, width, height, errors)
    })
  }
})

test.afterAll(() => {
  const rows = readShards([SURFACE])
  if (rows.length === 0) return
  mergeIntoManifest([SURFACE], rows)
})
