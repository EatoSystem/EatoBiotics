import { test, expect, type Page } from "@playwright/test"

/**
 * Cancelling renewal, then reloading, on the REAL `LiveDashboard`.
 *
 * `/account` needs a production Supabase session, so this drives the audit
 * fixture route that mounts the same component from fixed props (see
 * `app/audit/account-dashboard/page.tsx`). No Stripe call leaves the browser:
 * the cancel request is fulfilled here.
 *
 * What a reload of `/account` shows is decided server-side, by reading the
 * Stripe subscription on every load and mapping it with
 * `lib/stripe-renewal.ts` — covered against the real page in
 * `tests/unit/account-renewal-display.test.ts`. Here `renewal=cancelled` hands
 * the dashboard that derived state, and the page is reloaded to show it is
 * rendered from the request rather than left over from the click.
 */

const ROUTE = "/audit/account-dashboard?state=representative"
const PAID_THROUGH = "2026-11-01T00:00:00.000Z"

async function openAccountTab(page: Page) {
  const tab = page.getByRole("button", { name: /account/i }).first()
  // The tabs are client-rendered; a click before hydration does nothing.
  await expect(async () => {
    await tab.click()
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible({ timeout: 1_000 })
  }).toPass({ timeout: 20_000 })
}

async function expectRenewalCancelled(page: Page) {
  const notice = page.getByTestId("renewal-cancelled")
  await expect(notice).toBeVisible()
  await notice.scrollIntoViewIfNeeded()
  await expect(notice).toContainText("Renewal cancelled")
  await expect(notice).toContainText("Your membership remains active until 1 November 2026.")
  await expect(page.getByText(/Next billing/)).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Cancel plan" })).toHaveCount(0)
}

test.describe("renewal cancellation on the account dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Keep the cookie banner from covering the screenshots.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("eb_cookie_consent", "declined")
      } catch {
        /* private mode — the banner simply renders */
      }
    })
  })

  test("an active subscription shows its next billing date and the cancel option", async ({ page }, testInfo) => {
    await page.goto(ROUTE)
    await openAccountTab(page)
    await expect(page.getByText("Next billing 1 Nov 2026")).toBeVisible()
    await expect(page.getByRole("button", { name: "Cancel plan" })).toBeVisible()
    await expect(page.getByTestId("renewal-cancelled")).toHaveCount(0)
    await page.getByRole("button", { name: "Cancel plan" }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath("active-subscription.png") })
  })

  test("cancelling shows Renewal cancelled, and it persists across reloads", async ({ page }, testInfo) => {
    let cancelRequests = 0
    await page.route("**/api/stripe/cancel-subscription", async (route) => {
      cancelRequests++
      await route.fulfill({ json: { ok: true, accessUntil: PAID_THROUGH } })
    })

    await page.goto(ROUTE)
    await openAccountTab(page)
    await page.getByRole("button", { name: "Cancel plan" }).click()
    await page.getByRole("button", { name: "Yes, cancel plan" }).click()
    await expectRenewalCancelled(page)
    expect(cancelRequests).toBe(1)
    await page.screenshot({ path: testInfo.outputPath("after-cancel.png") })

    await page.goto(`${ROUTE}&renewal=cancelled`)
    for (const pass of ["first-load", "reloaded"]) {
      if (pass === "reloaded") await page.reload()
      await openAccountTab(page)
      await expectRenewalCancelled(page)
      await page.screenshot({ path: testInfo.outputPath(`${pass}.png`) })
    }
    expect(cancelRequests).toBe(1)
  })
})
