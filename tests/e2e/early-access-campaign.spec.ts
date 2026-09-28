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
 */
async function seenOnArrival(page: import("@playwright/test").Page, text: RegExp) {
  const el = page.locator("span,p", { hasText: text }).first()
  const height = page.viewportSize()?.height ?? 720
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    const ok = await (async () => {
      if (!(await el.isVisible().catch(() => false))) return false
      const box = await el.boundingBox().catch(() => null)
      if (!box || box.y >= height) return false
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
  await withTotal(page, 37)
  await expect(page.locator("body")).toContainText("63 of 100 early-access places left")
})

test("offers every place before anyone has joined", async ({ page }) => {
  await withTotal(page, 0)
  await expect(page.locator("body")).toContainText("100 of 100 early-access places left")
})

test("has one place left at ninety-nine", async ({ page }) => {
  await withTotal(page, 99)
  await expect(page.locator("body")).toContainText("1 of 100 early-access places left")
})

test("closes at a hundred, and still invites the visitor in", async ({ page }) => {
  await withTotal(page, 100)
  const body = page.locator("body")
  await expect(body).toContainText("The first 100 places are taken")
  await expect(body).toContainText("you'll still hear first")
  await expect(body).not.toContainText("places left")
})

test("stays closed past a hundred rather than going negative", async ({ page }) => {
  await withTotal(page, 148)
  await expect(page.locator("body")).toContainText("The first 100 places are taken")
  await expect(page.locator("body")).not.toContainText("-48")
})

test("invents no scarcity when the count cannot be fetched", async ({ page }) => {
  await withTotal(page, null)
  const body = page.locator("body")
  await expect(body).not.toContainText("early-access places left")
  await expect(body).not.toContainText("places are taken")
  // The invitation still stands, and the pill falls back to its old wording.
  await expect(body).toContainText("Coming soon")
  await expect(body).toContainText("Food System Assessment")
})

/* ══ And where the visitor actually meets it ═════════════════════════════ */

test("the places are visible on arrival, without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await withTotal(page, 1)
  expect(
    await seenOnArrival(page, /early-access places left/i),
    "the campaign must be in the first screenful, painted — not merely in the DOM",
  ).toBe(true)
})

test("and on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await withTotal(page, 1)
  expect(await seenOnArrival(page, /early-access places left/i)).toBe(true)
})

test("the closed state is visible on arrival too", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await withTotal(page, 100)
  expect(await seenOnArrival(page, /places are taken/i)).toBe(true)
})

test("NON-VACUITY: something genuinely below the fold is not reported as seen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await withTotal(page, 1)
  // If this read as "seen on arrival", the check would be measuring nothing.
  expect(await seenOnArrival(page, /The science is global/i)).toBe(false)
})
