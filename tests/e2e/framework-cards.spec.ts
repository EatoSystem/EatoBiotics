import { test, expect, type Page } from "@playwright/test"
import { ACTIONS, BIOTICS } from "../../lib/product-vocabulary"

/**
 * The framework cards, as a browser actually renders them.
 *
 * tests/unit/score-hierarchy.test.ts polices the same invariant by reading the
 * source, and there is one thing it structurally cannot do: these cards print
 * their words from `{p.title}` and `{biotic.science}`, so a page can say
 * "Feed = Prebiotics" without those words appearing in any file. Sabotage cases
 * 947 and 948 proved that by walking through the source rule untouched.
 *
 * So this suite reads the rendered page. It covers both components, because the
 * homepage and the holding page use different ones:
 *
 *   /       → components/home/feed-seed-heal.tsx
 *   /enter  → components/home/the-framework.tsx  (also /c/[country])
 */

const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/enter", name: "holding page" },
]

/** Reveal everything: ScrollReveal renders at opacity 0 until observed. */
async function revealAll(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y)
    await page.waitForTimeout(80)
  }
  await page.waitForTimeout(400)
}

for (const { path, name } of PAGES) {
  test(`${name}: each framework card leads with the action and names the biotic`, async ({ page }) => {
    await page.goto(path)
    await revealAll(page)
    const body = await page.locator("body").innerText()

    for (const action of ACTIONS) {
      expect(body, `${path} must show the action "${action}"`).toContain(action)
    }
    for (const biotic of BIOTICS) {
      expect(body, `${path} must show the biotic "${biotic}"`).toContain(biotic)
    }
  })

  test(`${name}: no card asserts the action IS the biotic`, async ({ page }) => {
    await page.goto(path)
    await revealAll(page)
    const body = await page.locator("body").innerText()

    for (const action of ACTIONS) {
      for (const biotic of BIOTICS) {
        // Adjacency across a line break is the shipped layout. An operator
        // between them on one line is the equation.
        const equation = new RegExp(`\\b${action}\\b[ \\t]*(?:=|:|—|-|\\bis\\b)[ \\t]*\\b${biotic}\\b`, "i")
        expect(body, `${path} must not assert "${action} = ${biotic}"`).not.toMatch(equation)
      }
    }
  })
}

test('the homepage cards no longer hedge with "Inspired by"', async ({ page }) => {
  await page.goto("/")
  await revealAll(page)
  const body = page.locator("body")

  await expect(body).not.toContainText("Inspired by Prebiotics")
  await expect(body).not.toContainText("Scientific foundation:")
  // The relationship is still stated — once, for the whole section. If this
  // goes, the cards are pairing the two with nothing relating them anywhere.
  await expect(body).toContainText("inspired by the science of")
})

test("the holding page card images are described by the food, not the verb", async ({ page }) => {
  await page.goto("/enter")
  await revealAll(page)

  const alts = await page.locator("img").evaluateAll((els) =>
    els.map((e) => (e as HTMLImageElement).alt).filter(Boolean),
  )
  expect(alts.length, "the holding page must render described images").toBeGreaterThan(0)
  for (const action of ACTIONS) {
    expect(alts, `no image may be described as "${action}"`).not.toContain(action)
  }
})
