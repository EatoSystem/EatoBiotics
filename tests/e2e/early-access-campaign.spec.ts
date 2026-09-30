/**
 * The early-access campaign, as a visitor actually sees it.
 *
 * ══ WHY THIS IS AN E2E TEST, AND WHY IT CHECKS VISIBILITY ═══════════════════
 *
 * The unit tests prove the arithmetic and the source guards prove the wiring.
 * Between them they let two defects reach a reviewer:
 *
 *  1. the closed copy rendered "The first 100places are taken", because JSX
 *     collapsed the whitespace around the expression;
 *  2. the whole campaign sat 1372px down the page at `opacity: 0`, inside a
 *     ScrollReveal that only fades its children in once scrolled to.
 *
 * Every case here originally used `toContainText`, which passes for an element
 * that is in the DOM, invisible, and a thousand pixels below the fold. Nothing
 * that reads source can see either defect, and neither can a text assertion.
 * `seenOnArrival` can.
 *
 * The count is stubbed at the network boundary, so these run with no database.
 *
 * ══ IT FOLLOWED ITS SUBJECT ═════════════════════════════════════════════════
 *
 * The copy these cases read used to be a pill saying "63 of 100 early-access
 * places left". The campaign became a LADDER — 100 Systems, then 1,000
 * Course — and the pill became components/waitlist/cohort-line.tsx. The
 * assertions moved with it rather than being deleted: what this file uniquely
 * owns is not the wording but `seenOnArrival`, and that discipline applies to
 * whatever the line currently says.
 *
 * The arithmetic of the ladder lives in tests/unit/early-access.test.ts and
 * the run-through in tests/e2e/food-system-experience.spec.ts. This file asks
 * one question: can a human see it on arrival.
 */
import { test, expect } from "@playwright/test"

async function withTotal(page: import("@playwright/test").Page, total: number | null) {
  await page.route("**/api/waitlist/count", (route) =>
    total === null
      ? route.abort()
      : route.fulfill({ json: { ok: true, total, today: 0, recent: [] } }),
  )
  await page.goto("/enter", { waitUntil: "domcontentloaded" })
}

/**
 * Is the element inside the first screenful, and actually painted?
 *
 * Polled rather than sampled once: the count arrives by fetch and ScrollReveal
 * runs a 700ms fade, so a single measurement taken too early reports "not
 * seen" for a line that does appear. A line that NEVER appears still fails,
 * which is the case that matters.
 *
 * ── WHOLE box, not its top edge ────────────────────────────────────────────
 *
 * This asked `box.y >= height`, which is true only when the element STARTS
 * below the fold. So a line whose first row was visible and whose second row
 * was cut off passed as "seen on arrival" — and one was: at 390×844 the
 * cohort line occupied y 823–859 and this returned true for it, in the guard
 * whose whole purpose is that the counted programme is not something a
 * visitor has to go looking for. Half a sentence about how many places are
 * left is worse than none, because the half that survives is the number.
 *
 * It now requires the entire box inside the viewport. A guard that measures
 * only the near edge of an element is measuring whether it BEGINS on screen,
 * which is not what "visible without scrolling" means to a reader.
 */
async function seenOnArrival(page: import("@playwright/test").Page, text: RegExp) {
  const el = page.locator("span,p", { hasText: text }).first()
  const height = page.viewportSize()?.height ?? 720
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    const ok = await (async () => {
      if (!(await el.isVisible().catch(() => false))) return false
      const box = await el.boundingBox().catch(() => null)
      if (!box || box.y < 0 || box.y + box.height > height) return false
      const opacity = await el
        .evaluate((n) =>
          getComputedStyle((n as HTMLElement).closest(".sr-reveal") ?? (n as HTMLElement)).opacity,
        )
        .catch(() => "0")
      return Number(opacity) > 0.9
    })()
    if (ok) return true
    await page.waitForTimeout(150)
  }
  return false
}

/* ══ What it says ════════════════════════════════════════════════════════ */

test("counts the places down, with a space between the number and the word", async ({ page }) => {
  // The spacing is not a nitpick: JSX once collapsed the gap around the
  // expression and shipped "The first 100places are taken".
  await withTotal(page, 37)
  await expect(page.locator("body")).toContainText("63 of 100 systems remaining")
})

test("offers every place before anyone has joined", async ({ page }) => {
  await withTotal(page, 0)
  await expect(page.locator("body")).toContainText("100 of 100 systems remaining")
})

test("has one place left at ninety-nine", async ({ page }) => {
  await withTotal(page, 99)
  await expect(page.locator("body")).toContainText("1 of 100 systems remaining")
})

test("rolls into 1,000 Systems at a hundred rather than closing the door", async ({ page }) => {
  await withTotal(page, 100)
  const body = page.locator("body")
  await expect(body).toContainText("1,000 Systems")
  await expect(body).toContainText("900 of 900 systems remaining")
  await expect(body).not.toContainText("100 of 100 systems remaining")
})

test("stays on the last rung past the end rather than going negative", async ({ page }) => {
  await withTotal(page, 4321)
  const body = page.locator("body")
  await expect(body).toContainText("systems are taken")
  await expect(body).not.toContainText("-3321")
})

test("invents no scarcity when the count cannot be fetched", async ({ page }) => {
  await withTotal(page, null)
  const body = page.locator("body")
  await expect(body).not.toContainText("systems remaining")
  await expect(body).not.toContainText("systems are taken")
  // The invitation still stands — the proposition never depended on scarcity.
  // The line it checks changed with the hero: the product is no longer sold
  // on how long it takes, so what must survive an unknown count is the
  // proposition itself.
  await expect(body).toContainText("Understand your own food system")
  await expect(body).toContainText("Food System Assessment")
})

/* ══ And where the visitor actually meets it ═════════════════════════════ */

test("the places are visible on arrival, without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await withTotal(page, 1)
  expect(
    await seenOnArrival(page, /systems remaining/i),
    "the campaign must be in the first screenful, painted — not merely in the DOM",
  ).toBe(true)
})

test("and on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await withTotal(page, 1)
  expect(await seenOnArrival(page, /systems remaining/i)).toBe(true)
})

test("the full state is visible on arrival too", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await withTotal(page, 4321)
  expect(await seenOnArrival(page, /systems are taken/i)).toBe(true)
})

test("NON-VACUITY: something genuinely below the fold is not reported as seen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await withTotal(page, 1)

  /*
   * This anchored on "The science is global" until that section was removed
   * from the holding page — at which point the check would still have PASSED,
   * because the text was simply absent. A non-vacuity guard that goes green
   * when its subject disappears is the thing it exists to prevent.
   *
   * So it anchors on a section that is still rendered, and asserts BOTH halves:
   * the text exists on the page, and it is not in the first screenful.
   */
  await expect(page.locator("body")).toContainText("One Food System")
  expect(await seenOnArrival(page, /One Food System/i)).toBe(false)
})

test("the two withdrawn sections are gone from the holding page", async ({ page }) => {
  await withTotal(page, 1)
  const body = page.locator("body")
  await expect(body).not.toContainText("Honest By Design")
  await expect(body).not.toContainText("What you can use today")
  await expect(body).not.toContainText("The science is global")
  await expect(body).not.toContainText("Every way the world eats")
  // The rest of the showcase still stands, so this is a removal, not a break.
  await expect(body).toContainText("Three biotics")
  await expect(body).toContainText("One Food System")
})
