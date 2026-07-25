import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

/**
 * Accessibility smoke suite — axe-core over ~20 representative pages, one per
 * major pattern cluster (236 pages will never get manual review; each cluster
 * shares one template, so one page covers its siblings).
 *
 * Gate: CRITICAL violations fail the build. Serious violations are logged as
 * a report (visible in CI output) without failing — promote them to failures
 * once the existing backlog is cleared, so the check lands green and stays
 * useful instead of being deleted the first week it cries wolf.
 */

const PAGES: Array<{ name: string; path: string }> = [
  { name: "homepage", path: "/" },
  { name: "waitlist gate", path: "/enter" },
  { name: "pricing", path: "/pricing" },
  { name: "assessment chooser", path: "/assessment" },
  { name: "foundation assessment", path: "/assessment/you" },
  { name: "vertical landing (you)", path: "/you" },
  { name: "vertical landing (family)", path: "/family" },
  { name: "condition vertical (adhd — covers anxiety/depression/bipolar)", path: "/adhd" },
  { name: "start funnel (covers start-family/start-mind)", path: "/start" },
  { name: "glucose pathway", path: "/glucose" },
  { name: "glp1 companion", path: "/glucose/glp1" },
  { name: "stability landing", path: "/stability" },
  { name: "food directory", path: "/food" },
  { name: "food detail (covers all /food/[slug])", path: "/food/garlic" },
  { name: "book landing", path: "/book" },
  { name: "book chapter (covers all 25 chapters)", path: "/book-chapter-1" },
  { name: "plate page (covers all four plates)", path: "/living-plate" },
  { name: "digital twin", path: "/digital-twin" },
  { name: "about", path: "/about" },
  { name: "eatosystem bridge", path: "/eatosystem" },
]

for (const { name, path } of PAGES) {
  test(`a11y: ${name} (${path})`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" })

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === "critical")
    const serious = results.violations.filter((v) => v.impact === "serious")

    if (serious.length > 0) {
      console.warn(
        `[a11y][serious][${path}] ${serious
          .map((v) => `${v.id} ×${v.nodes.length}`)
          .join(", ")} — report-only for now`
      )
    }

    expect(
      critical.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })),
      `critical accessibility violations on ${path}`
    ).toEqual([])
  })
}
