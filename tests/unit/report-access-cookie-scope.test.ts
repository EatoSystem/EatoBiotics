import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createServer, type Server } from "node:http"
import { existsSync } from "node:fs"
import type { AddressInfo } from "node:net"

import { REPORT_ACCESS_COOKIE_NAME, REPORT_ROUTE_BASE } from "@/lib/report/access/capability"

/**
 * Path-scoped cookie coexistence, PROVEN BY EXECUTION — Phase 4B-S1.
 *
 * ══ THE CLAIM UNDER TEST ════════════════════════════════════════════════════
 *
 * A customer may hold several purchased Reports at once. The design says that
 * works because each Report's capability cookie is scoped to that Report's
 * path, so cookies with the SAME NAME coexist and each request carries only the
 * one that matches.
 *
 * That is a claim about browsers and RFC 6265, not about our code. This phase's
 * habit is to run the thing rather than read the manual about it — Migration
 * 49's review found that PostgreSQL refuses a partial unique index as a foreign
 * key target only because somebody executed it — so a real Chromium is pointed
 * at a real HTTP server and asked.
 *
 * ══ WHAT THIS ALSO SETTLES ══════════════════════════════════════════════════
 *
 * If the browser sends only the matching cookie, then a request carries at most
 * ONE cookie of this name, and the open question about whether a server
 * framework returns the first or all same-name cookies stops mattering for
 * correctness. `ReportAccessProof` still takes a LIST rather than a string,
 * because a design that is correct either way costs nothing and a design that
 * depends on the answer is one framework upgrade from being wrong.
 *
 * ══ WHY IT SKIPS ════════════════════════════════════════════════════════════
 *
 * CI installs Chromium at step 12 and runs Vitest at step 6, so the browser is
 * genuinely absent when this runs there. It skips visibly rather than failing,
 * exactly as the Postgres truth tables do, and the always-on unit assertions in
 * `report-access-capability.test.ts` cover the parts that need no browser.
 */

/**
 * Resolve a browser without trusting `chromium.executablePath()`.
 *
 * That call returns a version-pinned path for the @playwright/test build in
 * package.json, and this image ships a different revision — it answered
 * `chromium-1228` while only `chromium-1194` exists on disk. Looking for what
 * is actually there is the difference between a real check and a silent skip.
 */
function findChromium(): string | null {
  const candidates = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  ]
  for (const candidate of candidates) if (existsSync(candidate)) return candidate
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { chromium } = require("@playwright/test") as typeof import("@playwright/test")
    const resolved = chromium.executablePath()
    if (resolved && existsSync(resolved)) return resolved
  } catch {
    /* Playwright absent entirely. */
  }
  return null
}

const EXECUTABLE = findChromium()
const HANDOFF_A = "aaaaaaaa-1111-4111-8111-111111111111"
const HANDOFF_B = "bbbbbbbb-2222-4222-8222-222222222222"
const SECRET_A = "secret-for-report-a"
const SECRET_B = "secret-for-report-b"

let server: Server | null = null
let origin = ""

beforeAll(async () => {
  if (!EXECUTABLE) return
  server = createServer((req, res) => {
    const url = req.url ?? "/"
    if (url === "/mint") {
      // Two cookies, same name, different Report paths. `Secure` is omitted
      // ONLY because this fixture speaks http on loopback; production sets it,
      // and `reportCookieAttributes` is the single place that decides.
      res.setHeader("Set-Cookie", [
        `${REPORT_ACCESS_COOKIE_NAME}=${HANDOFF_A}.${SECRET_A}; Path=${REPORT_ROUTE_BASE}/${HANDOFF_A}; HttpOnly; SameSite=Lax`,
        `${REPORT_ACCESS_COOKIE_NAME}=${HANDOFF_B}.${SECRET_B}; Path=${REPORT_ROUTE_BASE}/${HANDOFF_B}; HttpOnly; SameSite=Lax`,
      ])
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end("<html><body>minted</body></html>")
      return
    }
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end(`<html><body><pre id="cookies">${req.headers.cookie ?? ""}</pre></body></html>`)
  })
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve))
  origin = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`
}, 60_000)

afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()))
})

const maybe = EXECUTABLE ? describe : describe.skip

maybe("a real browser keeps per-Report cookies apart", () => {
  it("sends each Report only its own cookie, and never the other one", async () => {
    const { chromium } = await import("@playwright/test")
    const browser = await chromium.launch({ executablePath: EXECUTABLE!, headless: true })
    try {
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto(`${origin}/mint`)

      const read = async (path: string) => {
        await page.goto(`${origin}${path}`)
        return (await page.textContent("#cookies")) ?? ""
      }

      const atA = await read(`${REPORT_ROUTE_BASE}/${HANDOFF_A}`)
      const atB = await read(`${REPORT_ROUTE_BASE}/${HANDOFF_B}`)

      // Each Report sees its own secret...
      expect(atA).toContain(SECRET_A)
      expect(atB).toContain(SECRET_B)
      // ...and never the other's. This is the property that lets a customer
      // hold two purchased Reports at once.
      expect(atA).not.toContain(SECRET_B)
      expect(atB).not.toContain(SECRET_A)

      // Both really are stored — the isolation above is scoping, not one
      // cookie having overwritten the other.
      const stored = await context.cookies()
      const ours = stored.filter((c) => c.name === REPORT_ACCESS_COOKIE_NAME)
      expect(ours).toHaveLength(2)
      expect(ours.map((c) => c.path).sort()).toEqual(
        [`${REPORT_ROUTE_BASE}/${HANDOFF_A}`, `${REPORT_ROUTE_BASE}/${HANDOFF_B}`].sort(),
      )

      // Exactly one cookie of this name per request, which is why the "first or
      // all?" framework question cannot change a correctness outcome.
      expect(atA.split(REPORT_ACCESS_COOKIE_NAME).length - 1).toBe(1)

      // The parent path carries none of them. A cookie set there would be sent
      // to every Report and would shadow the scoped ones.
      expect(await read(REPORT_ROUTE_BASE)).not.toContain(REPORT_ACCESS_COOKIE_NAME)
      expect(await read("/")).not.toContain(REPORT_ACCESS_COOKIE_NAME)

      await context.close()
    } finally {
      await browser.close()
    }
  }, 60_000)

  it("a parent-path cookie WOULD shadow the scoped ones", async () => {
    // Non-vacuity for the guard that forbids a parent-path copy. The rule is
    // only worth enforcing if breaking it actually breaks something, so this
    // plants one and watches it reach a Report it was never issued for.
    const { chromium } = await import("@playwright/test")
    const browser = await chromium.launch({ executablePath: EXECUTABLE!, headless: true })
    try {
      const context = await browser.newContext()
      await context.addCookies([
        {
          name: REPORT_ACCESS_COOKIE_NAME,
          value: "parent-path-copy",
          domain: "127.0.0.1",
          path: "/",
        },
      ])
      const page = await context.newPage()
      await page.goto(`${origin}${REPORT_ROUTE_BASE}/${HANDOFF_A}`)
      expect((await page.textContent("#cookies")) ?? "").toContain("parent-path-copy")
      await context.close()
    } finally {
      await browser.close()
    }
  }, 60_000)
})
