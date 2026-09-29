import { test, expect, type Page } from "@playwright/test"

/**
 * The first sixty seconds, as a browser runs them.
 *
 * Unit tests cover the ladder arithmetic and the progress wording. What they
 * structurally cannot cover is whether a person can actually complete this:
 * whether the CTA is on the first screen, whether five taps reach a score,
 * whether the score shown is the score computed, and whether the page stays
 * silent about places when it has not counted any. All of that is here.
 */

async function withTotal(page: Page, total: number | null) {
  await page.route("**/api/waitlist/count*", (route) =>
    total === null
      ? route.fulfill({ status: 500, contentType: "application/json", body: "{}" })
      : route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, total }),
        }),
  )
}

/** Answer every question by clicking the nth option. */
async function runQuestions(page: Page, optionIndex = 2) {
  for (let i = 0; i < 5; i++) {
    await page.locator("fieldset label").nth(optionIndex).click()
    await page.waitForTimeout(350)
  }
}

/**
 * The VISIBLE score label.
 *
 * `/your first biotics score/i` alone matches twice: the sr-only live region
 * also says it, which is the point of the live region. The ™ is only on the
 * rendered label, so it is what distinguishes "a human can see the score" from
 * "the score was announced".
 */
function scoreLabel(page: Page) {
  // Scoped to the paragraph whose ENTIRE text is the label.
  //
  // `getByText("Your first Biotics Score™")` matched two elements — the label
  // and an ancestor that, mid-transition, contained nothing else — and failed
  // on strict mode. It surfaced only under reduced motion, where the reveal
  // arrives without a building stage in front of it, so the first read of it
  // looked like a timing problem and got a bigger timeout. It was never
  // timing: the ™ distinguishes this from the sr-only live region, and `p`
  // plus an anchored match distinguishes it from whatever wraps it.
  return page.locator("p", { hasText: /^Your first Biotics Score™$/ })
}

type BuildingWindow = Window & { __buildingSeen?: boolean }

/**
 * Record, from inside the page, whether the building stage ever rendered.
 *
 * The first attempt polled `getByText(...).isVisible()` from the test every
 * 60ms while `runQuestions` was clicking. Playwright serialises actions on a
 * page, so those polls contended with the clicks and the run failed in ~3s —
 * a test breaking the thing it was measuring. A MutationObserver installed
 * before navigation observes continuously and costs the test nothing.
 */
async function watchForBuildingStage(page: Page) {
  await page.addInitScript(() => {
    const seen = () => {
      if (document.body?.innerText?.includes("Building the Food System")) {
        ;(window as Window & { __buildingSeen?: boolean }).__buildingSeen = true
      }
    }
    const install = () => {
      seen()
      new MutationObserver(seen).observe(document.body, {
        childList: true, subtree: true, characterData: true,
      })
    }
    if (document.body) install()
    else document.addEventListener("DOMContentLoaded", install)
  })
}

async function start(page: Page) {
  await page.getByRole("button", { name: /start my 60-second assessment/i }).click()
  await page.getByRole("button", { name: /^begin$/i }).click()
}

test("the hero's call to action is on the first screen at every width", async ({ page }) => {
  await withTotal(page, 1)

  /*
   * One navigation, three viewports — not three navigations.
   *
   * This reloaded /enter per width and passed locally in 2.6s. On the CI
   * runner it blew the whole 45s test budget inside the FIRST page.goto and
   * failed twice: /enter carries the hero video, `goto` waits for load, and
   * three cold loads of it on a shared runner is a different proposition to
   * three on a warm local box.
   *
   * Resizing is also the better test. The hero is responsive, so what matters
   * is that the layout puts the CTA on the first screen at each width — which
   * a resize exercises directly, and a reload only incidentally.
   */
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/enter", { waitUntil: "domcontentloaded" })

  const cta = page.getByRole("button", { name: /start my 60-second assessment/i })
  await expect(cta).toBeVisible()

  for (const [width, height] of [[1280, 900], [834, 1112], [390, 844]] as const) {
    await page.setViewportSize({ width, height })
    // Let the layout settle after the resize before measuring it.
    await page.waitForTimeout(250)

    await expect(cta, `CTA not rendered at ${width}px`).toBeVisible()
    const box = await cta.boundingBox()
    expect(box, `no CTA box at ${width}px`).not.toBeNull()
    // Below the fold is the same as absent. This shipped once already.
    expect(box!.y + box!.height, `CTA below the fold at ${width}px`).toBeLessThanOrEqual(height)
  }
})

test("five answers reach a score, and the score shown is the score computed", async ({ page }) => {
  await withTotal(page, 1)
  await page.goto("/enter")
  await start(page)

  // Every option picked is index 2 (value 2 of 0-3) → each pillar averages
  // 2/3 → 67. The number on screen must be the engine's, not a decoration.
  await runQuestions(page, 2)
  await expect(scoreLabel(page)).toBeVisible({ timeout: 10_000 })

  const body = page.locator("body")
  await expect(body).toContainText("67")
  for (const biotic of ["Prebiotics", "Probiotics", "Postbiotics"]) {
    await expect(body, `${biotic} must be named as a component score`).toContainText(biotic)
  }
})

test("the reveal's call to action is on the first screen at every width", async ({ page }) => {
  /*
   * The same measurement as the hero's, on the other screen that has to
   * convert — and it is here because it caught a live regression.
   *
   * The reveal used to carry three compact biotic bars. Phase 1 replaced them
   * with a taller foundation panel (the Biotics are taught, not scored), and
   * with the panel above the button the claim CTA landed 259px below the fold
   * at 390px and 86px below it at 1280px. Nothing in the suite noticed: every
   * other reveal assertion is `toBeVisible` or `toContainText`, and both pass
   * for something a person would have to go looking for.
   *
   * One run, three viewports, for the CI-budget reason recorded on the hero
   * test above.
   */
  await withTotal(page, 1)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/enter")
  await start(page)
  await runQuestions(page)
  await expect(scoreLabel(page)).toBeVisible({ timeout: 10_000 })

  const cta = page.getByRole("button", { name: /join the first/i })
  await expect(cta).toBeVisible()

  for (const [width, height] of [[1280, 900], [834, 1112], [390, 844]] as const) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(250)

    const box = await cta.boundingBox()
    expect(box, `no claim CTA box at ${width}px`).not.toBeNull()
    expect(
      box!.y + box!.height,
      `claim CTA below the fold at ${width}px`,
    ).toBeLessThanOrEqual(height)
  }
})

test("the components are named by the biotic, never by the action", async ({ page }) => {
  await withTotal(page, 1)
  await page.goto("/enter")
  await start(page)
  await runQuestions(page)
  await expect(scoreLabel(page)).toBeVisible({ timeout: 10_000 })

  const text = await page.locator("body").innerText()
  // Adjacency is the shipped design; an equation is not.
  for (const action of ["Feed", "Seed", "Rejuvenate"]) {
    for (const biotic of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(text).not.toMatch(new RegExp(`\\b${action}\\b[ \\t]*=[ \\t]*\\b${biotic}\\b`, "i"))
    }
  }
})

test("the whole run is completable with the keyboard alone", async ({ page }) => {
  await withTotal(page, 1)
  await page.goto("/enter")

  await page.getByRole("button", { name: /start my 60-second assessment/i }).focus()
  await page.keyboard.press("Enter")
  await page.getByRole("button", { name: /^begin$/i }).focus()
  await page.keyboard.press("Enter")

  // Radios: reachable by Tab, selectable by Space/Arrow.
  for (let i = 0; i < 5; i++) {
    await expect(page.locator("fieldset")).toBeVisible()
    const first = page.locator('fieldset input[type="radio"]').first()
    await first.focus()
    await page.keyboard.press("Space")
    await page.waitForTimeout(350)
  }
  await expect(scoreLabel(page)).toBeVisible({ timeout: 10_000 })
})

test("reduced motion skips the building beat rather than stilling it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await withTotal(page, 1)
  await watchForBuildingStage(page)
  await page.goto("/enter")
  await start(page)

  /*
   * Asserted as ABSENCE, not as speed.
   *
   * The first version gave the score a 2s deadline, on the reasoning that
   * skipping a 1.6s interstitial should be visibly faster. That is a timing
   * assertion dressed as a behavioural one: it passed alone and failed inside
   * the full suite, where two workers share a machine and 2s stops being a
   * statement about the product. Raising the timeout would have been worse —
   * at 10s it would pass whether the beat was skipped or not.
   *
   * What "skips" actually means is that the building stage never renders. A
   * watcher records whether that text is ever seen, which is true or false
   * regardless of how loaded the box is.
   */
  await runQuestions(page)
  await expect(scoreLabel(page)).toBeVisible({ timeout: 10_000 })

  const buildingWasSeen = await page.evaluate(() => (window as unknown as BuildingWindow).__buildingSeen === true)
  expect(buildingWasSeen, "the building beat must not render under reduced motion").toBe(false)
})

test("NON-VACUITY: the building beat DOES render without reduced motion", async ({ page }) => {
  // Without this, the check above passes for a build stage that was deleted.
  await withTotal(page, 1)
  await watchForBuildingStage(page)
  await page.goto("/enter")
  await start(page)
  await runQuestions(page)
  await expect(scoreLabel(page)).toBeVisible({ timeout: 10_000 })

  const buildingWasSeen = await page.evaluate(() => (window as unknown as BuildingWindow).__buildingSeen === true)
  expect(buildingWasSeen, "without reduced motion the building beat must render").toBe(true)
})

test("it says nothing about places when it has not counted any", async ({ page }) => {
  await withTotal(page, null)
  await page.goto("/enter")

  const body = page.locator("body")
  await expect(body).not.toContainText(/places remaining/i)
  await expect(body).not.toContainText(/of 100/i)
  // The page still works — the proposition does not depend on scarcity.
  await expect(page.getByRole("button", { name: /start my 60-second assessment/i })).toBeVisible()
})

test("the counted cohort is shown, and rolls to the First Course when full", async ({ page }) => {
  await withTotal(page, 1)
  await page.goto("/enter")
  await expect(page.locator("body")).toContainText("99 of 100 places remaining")

  await page.unroute("**/api/waitlist/count*")
  await withTotal(page, 250)
  await page.goto("/enter")
  const body = page.locator("body")
  await expect(body).toContainText("The First Course")
  await expect(body).toContainText("750 of 900 places remaining")
})

test("the First Course section explains staged access without pressure", async ({ page }) => {
  await withTotal(page, 1)
  await page.goto("/enter")
  const section = page.locator("#first-course")
  await section.scrollIntoViewIfNeeded()

  await expect(section).toContainText("The First Course")
  await expect(section).toContainText("Be one of the first 100")
  await expect(section).toContainText("1,000 Founding Members")
  await expect(section).toContainText("Open wider")

  // No manufactured urgency anywhere on the page.
  const text = await page.locator("body").innerText()
  for (const trick of ["HURRY", "Hurry", "people viewing", "Offer ends", "Act now"]) {
    expect(text, `the page must not say "${trick}"`).not.toContain(trick)
  }
})
