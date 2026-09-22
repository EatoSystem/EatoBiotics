import { test, expect, type BrowserContext } from "@playwright/test"
import { createHmac } from "node:crypto"

import { chapters } from "@/lib/chapters"
import { PUBLISHING_EXPORT_VARIANTS } from "@/lib/v1-surface"

/**
 * The publishing exports, against a running server — V1 step 4.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 * The 75 chapter export routes plus /book/print are an authoring tool: the
 * author opens one, copies the chapter, and pastes it into Substack or Reedsy.
 * Nothing automated consumes them. Until step 4 they were linked from all
 * twenty-five PUBLIC chapter pages, so every reader of the book was offered
 * an internal tool.
 *
 * They are kept and gated. Both halves matter, and both are tested here:
 * an anonymous visitor gets the ordinary 404, and an authenticated author gets
 * the page. A gate that refused everyone would pass a refusal-only test while
 * quietly ending the workflow it was supposed to preserve.
 *
 * The cookie is injected rather than obtained through /api/admin/login,
 * because that route sets `secure: true` under NODE_ENV=production and the
 * test server speaks plain http. The value is the real one — the same HMAC
 * verifyAdminCookieEdge recomputes — so the proxy's check is genuinely
 * exercised, not bypassed.
 */

const ADMIN_PASSWORD = "playwright-admin-secret"   // playwright.config.ts webServer env
const ADMIN_PURPOSE = "eatobiotics-admin-v1"

function adminToken(secret = ADMIN_PASSWORD): string {
  return createHmac("sha256", secret).update(ADMIN_PURPOSE).digest("hex")
}

async function signIn(context: BrowserContext, value: string) {
  await context.addCookies([
    { name: "admin_auth", value, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" },
  ])
}

const EVERY_EXPORT = [
  "/book/print",
  ...chapters.flatMap((c) => PUBLISHING_EXPORT_VARIANTS.map((v) => `/book-chapter-${c.number}/${v}`)),
]

test("the route list under test is the real one", () => {
  expect(EVERY_EXPORT.length).toBe(chapters.length * PUBLISHING_EXPORT_VARIANTS.length + 1)
  expect(EVERY_EXPORT).toContain("/book-chapter-1/substack")
  expect(EVERY_EXPORT).toContain("/book-chapter-25/print")
})

test.describe("anonymous", () => {
  test("a public chapter page still answers 200", async ({ page }) => {
    const res = await page.goto("/book-chapter-1", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(200)
  })

  for (const variant of PUBLISHING_EXPORT_VARIANTS) {
    test(`/book-chapter-1/${variant} is refused`, async ({ request }) => {
      const res = await request.get(`/book-chapter-1/${variant}`, { maxRedirects: 0 })
      expect(res.status()).toBe(404)
      // The ordinary refusal, so an export route is indistinguishable from any
      // other route outside the surface.
      expect(res.headers()["location"]).toBeUndefined()
    })
  }

  test("/book/print is refused", async ({ request }) => {
    const res = await request.get("/book/print", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test("all seventy-six are refused, not just the ones spot-checked", async ({ request }) => {
    const open: string[] = []
    for (const route of EVERY_EXPORT) {
      const res = await request.get(route, { maxRedirects: 0 })
      if (res.status() !== 404) open.push(`${route} → ${res.status()}`)
    }
    expect(open, `export routes reachable anonymously:\n  ${open.join("\n  ")}`).toEqual([])
  })

  test("every public chapter page still answers, and offers no export link", async ({ page }) => {
    for (const chapter of chapters.slice(0, 5)) {
      const res = await page.goto(`/book-chapter-${chapter.number}`, { waitUntil: "domcontentloaded" })
      expect(res?.status(), `chapter ${chapter.number}`).toBe(200)
      const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")!))
      expect(hrefs.length, "no links found — the check would be vacuous").toBeGreaterThan(3)
      const exports = hrefs.filter((h) => /\/(print|reedsy|substack)$/.test(h))
      expect(exports, `chapter ${chapter.number} still links ${exports.join(", ")}`).toEqual([])
    }
  })

  test("/admin/book-exports shows the login rather than the list", async ({ page }) => {
    const res = await page.goto("/admin/book-exports", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(200)
    await expect(page.locator("input[type='password']")).toBeVisible()
    // By export href, not by link text and not by any /book prefix: the site
    // footer carries a legitimate link to the external Substack newsletter and
    // to /book and /books, and matching either would fail on public content
    // rather than on an export.
    const hrefs = await page.$$eval("a[href^='/book']", (as) => as.map((a) => a.getAttribute("href")!))
    expect(hrefs.length, "no /book links at all — the check would be vacuous").toBeGreaterThan(0)
    expect(hrefs.filter((h) => EVERY_EXPORT.includes(h))).toEqual([])
  })
})

test.describe("with a valid admin cookie", () => {
  test("the Substack export renders", async ({ context, page }) => {
    await signIn(context, adminToken())
    const res = await page.goto("/book-chapter-1/substack", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(200)
    await expect(page.locator("body")).toContainText(/chapter/i)
  })

  test("the Reedsy and print exports render, and so does the whole book", async ({ context }) => {
    await signIn(context, adminToken())
    // context.request, not the standalone `request` fixture: that one has its
    // own cookie jar and would send none of this, which would make every
    // assertion below a refusal test wearing an author's name.
    for (const route of ["/book-chapter-1/reedsy", "/book-chapter-1/print", "/book/print"]) {
      const res = await context.request.get(route, { maxRedirects: 0 })
      expect(res.status(), route).toBe(200)
    }
  })

  test("one export from every chapter renders", async ({ context }) => {
    await signIn(context, adminToken())
    const broken: string[] = []
    for (const chapter of chapters) {
      const route = `/book-chapter-${chapter.number}/substack`
      const res = await context.request.get(route, { maxRedirects: 0 })
      if (res.status() !== 200) broken.push(`${route} → ${res.status()}`)
    }
    expect(broken, `the author's workflow is broken for:\n  ${broken.join("\n  ")}`).toEqual([])
  })

  test("the admin index lists every export", async ({ context, page }) => {
    await signIn(context, adminToken())
    const res = await page.goto("/admin/book-exports", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(200)
    const listed = await page.$$eval("a[href^='/book']", (as) => as.map((a) => a.getAttribute("href")!))
    for (const route of EVERY_EXPORT) expect(listed, route).toContain(route)
  })
})

test.describe("with a cookie that is not valid", () => {
  test("a tampered value is refused", async ({ context }) => {
    const real = adminToken()
    await signIn(context, real.slice(0, -1) + (real.endsWith("a") ? "b" : "a"))
    const res = await context.request.get("/book-chapter-1/substack", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test("a cookie signed with the wrong secret is refused", async ({ context }) => {
    await signIn(context, adminToken("not-the-admin-password"))
    const res = await context.request.get("/book-chapter-1/substack", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test("the old forgeable sentinel is refused", async ({ context }) => {
    await signIn(context, "eatobiotics-admin-ok")
    const res = await context.request.get("/book-chapter-1/substack", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test("an empty cookie is refused", async ({ context }) => {
    await signIn(context, "")
    const res = await context.request.get("/book-chapter-1/substack", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })
})
