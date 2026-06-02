import { test, expect } from "@playwright/test"

/*
 * Synthetic funnel checks against the live (or preview) site, set via BASE_URL.
 * Smoke level + resilient (text/role based). The deeper assessment-submission
 * steps are marked TODO — finalize their selectors against the live site once
 * the dev gate is off, so they assert real DOM rather than guesses.
 */

test("homepage loads with hero and the assessment CTA", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/EatoBiotics/i)
  await expect(page.getByRole("heading", { name: /food system/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /take the free assessment/i }).first()).toBeVisible()
})

test("assessment page is reachable from the homepage CTA", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: /take the free assessment/i }).first().click()
  await expect(page).toHaveURL(/\/assessment/)
  // TODO (finalize against live site): step through the 15 questions, assert the
  // score/results screen renders, then the paid-report CTA appears.
})

test("pricing page renders the membership tiers", async ({ page }) => {
  await page.goto("/pricing")
  await expect(page.getByText(/grow/i).first()).toBeVisible()
})

test("health endpoint returns ok", async ({ request }) => {
  const res = await request.get("/api/health")
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe("ok")
})
