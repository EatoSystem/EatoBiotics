import { test, expect } from "@playwright/test"

/**
 * Experience 0 — verify the mock-meal fallback claim on the real dashboard.
 *
 * NOT an audit deliverable. A single targeted check, written because the P0
 * recorded in the audit could not be proved with `curl`: the dashboard defaults
 * to the `overview` tab, so "Your Last Analysis" is not in the initial HTML and
 * reaching it needs a click.
 *
 * Claim under test: a member with ZERO analyses, on the meals tab, is shown
 * `MOCK_MEALS[0].meals[0]` — an invented meal — under a heading that calls it
 * theirs.
 */
const SPARSE = "/audit/account-dashboard?state=sparse"

test("sparse state: what the meals tab shows a member with no analyses", async ({ page }) => {
  await page.goto(SPARSE)
  await expect(page.locator('[data-audit-fixture="true"]')).toBeVisible()

  // The default view first, for the record.
  const overviewHtml = await page.content()
  console.log("OVERVIEW · 'Your Last Analysis' present:", overviewHtml.includes("Your Last Analysis"))
  console.log("OVERVIEW · mock meal name present:", overviewHtml.includes("Mackerel, kimchi & asparagus"))

  // Now the meals tab, which is where the fallback lives.
  const mealsTab = page.getByRole("button", { name: /meals/i }).first()
  const tabCount = await page.getByRole("button", { name: /meals/i }).count()
  console.log("meals-tab candidates found:", tabCount)

  if (tabCount > 0) {
    await mealsTab.click()
    await page.waitForTimeout(400)
    const mealsHtml = await page.content()
    console.log("MEALS · 'Your Last Analysis' present:", mealsHtml.includes("Your Last Analysis"))
    console.log("MEALS · mock meal name present:", mealsHtml.includes("Mackerel, kimchi & asparagus"))
    console.log("MEALS · 'Today\\'s Meals' present:", mealsHtml.includes("Today"))

    const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ")
    const idx = bodyText.indexOf("Your Last Analysis")
    if (idx >= 0) console.log("MEALS · context:", bodyText.slice(idx, idx + 220))
  }
})
