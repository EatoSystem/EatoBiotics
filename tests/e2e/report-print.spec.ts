import { test, expect } from "@playwright/test"

/**
 * The canonical Report, printed — Phase 4B-S2 review repair.
 *
 * ══ THE BUG THIS EXISTS FOR ═════════════════════════════════════════════════
 *
 * `ScrollReveal` renders its children at `opacity: 0` until IntersectionObserver
 * reveals them. Printing does not scroll. So a reader who hits Print before
 * reaching the bottom of their Report printed the sections they had reached and
 * BLANK SPACE where the rest should have been — on paper, for a document they
 * paid €49 for.
 *
 * Nothing further down the stylesheet rescued it. Killing transitions and
 * animations does not change an opacity that was never animated, and the one
 * unconditional reveal sat behind `prefers-reduced-motion: reduce`.
 *
 * ══ WHY THE ACCESSIBILITY SUITE COULD NOT SEE IT ════════════════════════════
 *
 * Because that suite scans the Report under exactly that preference — which is
 * correct for what it measures (axe skips invisible elements, so a scan without
 * it covers the hero and little else) and is precisely what hid this. The
 * setting that makes the document scannable is the setting that makes the bug
 * disappear.
 *
 * So this test is the opposite of that one by construction:
 *
 *   • NO reduced-motion preference — the default a real reader has
 *   • NO scrolling before printing — the reader who prints straight away
 *   • a small viewport, so most of the document is genuinely below the fold
 *
 * ══ AND IT PROVES THE HAZARD IS REAL FIRST ══════════════════════════════════
 *
 * The screen-media assertion below is not decoration. Without it, a day when
 * reveals stop hiding anything at all — or a selector that quietly matches
 * nothing — would leave this test passing while measuring nothing, which is how
 * a suite ends up reporting coverage it does not have.
 */

const DOCUMENT = "article[data-foundation]"
const REVEALS = `${DOCUMENT} .sr-reveal`

test("print shows every Report block, with no reduced-motion preference and no scrolling", async ({
  page,
}) => {
  // Small enough that most of the document is below the fold. The document runs
  // to roughly 2,600px.
  await page.setViewportSize({ width: 700, height: 500 })

  const response = await page.goto("/demo/food-system-report", {
    waitUntil: "domcontentloaded",
  })
  expect(
    response?.status(),
    "the preview page must render before anything here means anything"
  ).toBe(200)

  await expect(page.locator(DOCUMENT)).toBeVisible()

  const styles = () =>
    page.$$eval(REVEALS, (els) =>
      els.map((el) => ({
        opacity: getComputedStyle(el).opacity,
        transform: getComputedStyle(el).transform,
        text: (el.textContent ?? "").trim().length,
      }))
    )

  // ── 1. On screen, unscrolled: the hazard is real ───────────────────────────
  const onScreen = await styles()
  expect(onScreen.length, "no reveal wrappers found — the selector is wrong").toBeGreaterThan(2)
  expect(
    onScreen.map((s) => s.opacity),
    "nothing was hidden, so this test would prove nothing about print"
  ).toContain("0")

  // ── 2. In print media: nothing is hidden ───────────────────────────────────
  await page.emulateMedia({ media: "print" })
  const onPaper = await styles()

  expect(onPaper.length, "reveal wrappers disappeared between the two reads").toBe(
    onScreen.length
  )
  expect(
    onPaper.map((s) => s.opacity),
    "a Report block would print as blank space"
  ).toEqual(onPaper.map(() => "1"))
  expect(
    onPaper.map((s) => s.transform),
    "a Report block would print displaced from where it belongs"
  ).toEqual(onPaper.map(() => "none"))

  // Every wrapper actually holds copy, so "all visible" is a claim about
  // content rather than about empty divs.
  expect(onPaper.every((s) => s.text > 0)).toBe(true)

  // ── 3. The blocks that are not wrapped print too ───────────────────────────
  // The closing quotation is outside the reveal system by design — it should
  // never have depended on this fix, and now it is asserted rather than assumed.
  const closing = await page.$eval('[data-band="closing"] blockquote', (el) => ({
    opacity: getComputedStyle(el).opacity,
    text: (el.textContent ?? "").trim().length,
  }))
  expect(closing.opacity).toBe("1")
  expect(closing.text).toBeGreaterThan(0)

  // ── 4. Every loop step, individually ───────────────────────────────────────
  // Four self-contained instructions, the part of the document most likely to
  // sit below the fold and the part a reader most needs on paper.
  const steps = await page.$$eval(`${DOCUMENT} ol li`, (els) =>
    els.map((el) => getComputedStyle(el).opacity)
  )
  expect(steps.length).toBe(4)
  expect(steps).toEqual(["1", "1", "1", "1"])
})
