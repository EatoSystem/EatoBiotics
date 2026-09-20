import { test, expect } from "@playwright/test"

/**
 * The V1 launch surface, checked against a running server.
 *
 * ══ WHY THIS EXISTS ALONGSIDE THE UNIT TEST ═════════════════════════════════
 *
 * tests/unit/v1-surface.test.ts proves the classification is complete and that
 * proxy.ts calls it in the right place. Neither fact is the same as "a request
 * for /stability gets a 404 from the real middleware chain", and the gap
 * between them is where this phase's only genuine surprise lived: /gut-brain
 * classified as content, served, and then redirected to /mind — a refused
 * route — one hop later. Static reasoning could not see that; a request could.
 *
 * ══ THE DEMO ROUTES ════════════════════════════════════════════════════════
 *
 * Every demo and fixture route refuses here too, in every environment, which
 * is stronger than the brief asked for and simpler to prove. The single
 * exception is /demo/food-system-report: the gate passes it through and the
 * page's own fail-closed preview policy decides, because proxy.ts runs in the
 * edge runtime where `process.env` is fixed at build time and cannot tell
 * preview from production. playwright.config.ts sets VERCEL_ENV=preview, which
 * that page — a server component in the Node runtime — reads correctly, so the
 * accessibility and print specs still have their document.
 */

/** Routes a V1 customer must be able to reach. */
const SERVED: Array<[string, string]> = [
  ["/", "homepage"],
  ["/assessment", "assessment chooser"],
  ["/assessment/you", "the free assessment"],
  ["/assessment/results", "results"],
  ["/pricing", "pricing"],
  ["/login", "sign in"],
  ["/privacy", "privacy"],
  ["/terms", "terms"],
  ["/about", "about"],
  ["/method", "how it works"],
  ["/help", "help"],
  ["/account/signin", "account sign-in"],
  ["/unsubscribe", "email opt-out"],
  ["/enter", "the private-beta gate"],
]

/** Public content, which is not product and stays reachable. */
const CONTENT: Array<[string, string]> = [
  ["/book-chapter-1", "a canonical book chapter"],
  ["/book-chapter-25", "the last chapter"],
  ["/food", "the food library"],
  ["/food/garlic", "a food profile"],
  ["/book", "the book landing"],
  ["/biotics", "the biotics explainer"],
  ["/adhd", "a condition explainer"],
  ["/anxiety", "a condition explainer"],
]

/** Step 4 owns these. Step 3 must not have disturbed them. */
const PUBLISHING_EXPORTS = ["/book-chapter-7/print", "/book-chapter-7/reedsy", "/book-chapter-7/substack"]

/** One route from each excluded product group. */
const REFUSED: Array<[string, string]> = [
  ["/you", "the You system landing"],
  ["/family", "the Family system landing"],
  ["/food-systems", "the systems catalogue"],
  ["/stability", "Stability"],
  ["/stability/assessment", "a Stability subtree route"],
  ["/glucose/glp1", "the GLP-1 companion"],
  ["/mind", "Mind"],
  ["/gut-brain", "a redirect into Mind"],
  ["/account/twin", "Living Twin"],
  ["/account/today", "the daily ritual"],
  ["/account/glp1", "the GLP-1 tracker"],
  ["/account/family", "Family in the account"],
  ["/plate-builder", "Plate Builder"],
  ["/myplate", "a plate entry point"],
  ["/analyse", "meal analysis"],
  ["/report-you", "a superseded sample report"],
  ["/start", "a superseded funnel entry"],
  ["/digital-twin", "a superseded product page"],
  ["/demo", "the demo index"],
  ["/demo/assessment", "a demo experience"],
  ["/demo/account/member", "a demo dashboard"],
  ["/analyse-demo", "a demo meal analysis"],
  ["/assessment/demo", "a demo assessment"],
  ["/account-you", "the mock account dashboard"],
  ["/account-you-live", "the live sandbox dashboard"],
]

test.describe("the V1 launch product is reachable", () => {
  for (const [path, what] of SERVED) {
    test(`${what} (${path}) answers`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" })
      // 200, or a redirect the app chose for itself (the paid pages and the
      // authenticated account send an anonymous visitor to /assessment).
      expect(res?.status(), path).toBeLessThan(400)
    })
  }
})

test.describe("public content stays public", () => {
  for (const [path, what] of CONTENT) {
    test(`${what} (${path}) answers 200`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" })
      expect(res?.status(), path).toBe(200)
    })
  }

  for (const path of PUBLISHING_EXPORTS) {
    test(`the publishing export ${path} is untouched`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" })
      expect(res?.status(), path).toBe(200)
    })
  }
})

test.describe("Post-V1 products cannot be entered by URL", () => {
  for (const [path, what] of REFUSED) {
    test(`${what} (${path}) is refused`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" })
      expect(res?.status(), `${path} should not be reachable`).toBe(404)
    })
  }

  test("the canonical Report preview is the one fixture the gate passes through", async ({ page }) => {
    // …and this runner is VERCEL_ENV=preview, so its own policy allows it.
    // In production that same policy refuses; see lib/v1-surface.ts.
    const res = await page.goto("/demo/food-system-report", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(200)
  })

  test("an unclassified route is refused too", async ({ page }) => {
    const res = await page.goto("/a-route-nobody-classified", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(404)
  })

  test("the refusal is a real 404, not a soft one", async ({ request }) => {
    // A rewrite that returned 200 with a "not found" page would tell every
    // crawler and monitor that the request succeeded.
    const res = await request.get("/stability", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
    expect(res.headers()["location"]).toBeUndefined()
  })
})

test.describe("the gate is not an authorisation system", () => {
  test("admin keeps its own auth behaviour, and is not globally denied", async ({ request }) => {
    // /admin is INTERNAL: this gate has no opinion, so whatever comes back is
    // the admin login's own answer — anything but the V1 refusal.
    const res = await request.get("/admin", { maxRedirects: 0 })
    expect([200, 302, 303, 307, 308, 401, 403]).toContain(res.status())
  })

  test("/cms still 404s from proxy.ts's own default-deny", async ({ request }) => {
    const res = await request.get("/cms", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test("API routes are never judged by the launch surface", async ({ request }) => {
    const res = await request.get("/api/health", { maxRedirects: 0 })
    expect(res.status()).toBeLessThan(400)
  })
})

test.describe("navigation offers no refused destination", () => {
  /**
   * Crawls the RENDERED DOM, which is the only place a computed href becomes
   * a real one. The unit-level link audit reads `href="/x"` out of source and
   * therefore cannot see `href={item.href}` — a card list, a nav config, a
   * catalog. This can, because by the time the browser has the page the
   * expression has been evaluated.
   */
  const CRAWLED = ["/", "/assessment", "/pricing", "/about", "/help", "/food", "/book", "/adhd"]

  for (const from of CRAWLED) {
    test(`every in-site link on ${from} resolves`, async ({ page, request }) => {
      await page.goto(from, { waitUntil: "domcontentloaded" })
      const hrefs = await page.$$eval("a[href^='/']", (as) =>
        [...new Set(as.map((a) => a.getAttribute("href")!).filter(Boolean))],
      )
      expect(hrefs.length, `no in-site links found on ${from} — the check would be vacuous`).toBeGreaterThan(5)

      const dead: string[] = []
      for (const href of hrefs) {
        const res = await request.get(href, { maxRedirects: 0 })
        if (res.status() === 404) dead.push(`${href} → 404`)
      }
      expect(dead, `${from} links into refused routes:\n  ${dead.join("\n  ")}`).toEqual([])
    })
  }

  test("the funnel is still findable from the homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator("nav a[href='/assessment']").first()).toBeVisible()
    await expect(page.locator("nav a[href='/pricing']").first()).toBeVisible()
    await expect(page.locator("nav a[href='/']").first()).toBeVisible()
  })
})
