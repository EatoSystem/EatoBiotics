/**
 * The early-access campaign, as a visitor actually sees it.
 *
 * ══ WHY THIS IS AN E2E TEST ═════════════════════════════════════════════════
 *
 * The unit tests prove the arithmetic and the source-level guards prove the
 * wiring, and between them they still let a real defect ship: the closed-state
 * copy rendered as "The first 100places are taken", because JSX collapsed the
 * whitespace between the expression and the word after it. Nothing that reads
 * the file can see that — only rendering the page can.
 *
 * The count is stubbed at the network boundary, so these run without a
 * database and assert exactly what the customer reads.
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
  // The rest of the invitation still stands.
  await expect(body).toContainText("Food System Assessment")
})
