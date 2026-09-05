import { test, expect, type Page } from "@playwright/test"

/**
 * Phase 3B — the deterministic Consultation preview, driven in a real browser.
 *
 * ══ WHY THIS SUITE EXISTS ALONGSIDE THE UNIT TESTS ══════════════════════════
 *
 * `tests/unit/consultation-session.test.ts` proves the RULES (an option must
 * not advance, Continue must refuse an unanswered required question, Back must
 * land on the previous applicable question). What it cannot prove is that the
 * component wires a real click, a real keypress and real focus to those rules —
 * the repository has no jsdom, and a simulated DOM would be a poor stand-in for
 * radio-group arrow-key behaviour and focus management anyway.
 *
 * So this suite does the parts only a browser can answer honestly.
 *
 * ══ SAFETY ══════════════════════════════════════════════════════════════════
 *
 * The preview path takes no payment, needs no Supabase row, and writes nothing.
 * There is no Stripe interaction anywhere in this file, and no production
 * mutation is possible from it.
 */

const PREVIEW = "/assessment/deep?demo=true&deterministic=true"
const FAMILY = `${PREVIEW}&foundation=family`

/**
 * The question currently on screen, WITHOUT the screen-reader position prefix.
 *
 * The heading carries "Your Signals. Question 1 of 4." for assistive
 * technology, and that prefix legitimately changes when an adaptive branch
 * opens — the section really does get longer. Comparing the whole heading would
 * therefore report a question change every time the count moved, which is the
 * opposite of what these tests are checking.
 */
async function heading(page: Page): Promise<string> {
  const full = (await page.getByRole("heading", { level: 2 }).first().innerText()).trim()
  return full.replace(/^[\s\S]*?Question\s+\d+\s+of\s+\d+\.\s*/, "").trim()
}

/**
 * Choose an option by clicking its card.
 *
 * The inputs are real radios/checkboxes but visually hidden, with the card as
 * their `<label>` — the same pattern the free Assessment uses. A real person
 * clicks the card, so the test does too; Playwright's `.check()` refuses,
 * correctly, because the input itself has no clickable area.
 */
async function chooseOption(page: Page, index = 0) {
  await page.locator("fieldset label").nth(index).click()
}

/** Choose the option whose card carries this exact label. */
async function chooseLabelled(page: Page, label: string) {
  await page.locator("fieldset label").filter({ hasText: new RegExp(`^${label}$`) }).click()
}

async function beginConsultation(page: Page, url = PREVIEW) {
  const response = await page.goto(url)
  expect(response?.status(), `${url} must render, not error`).toBe(200)
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Food System Consultation")
  await page.getByRole("button", { name: /Begin (My|Our) Consultation/ }).click()
}

test.describe("Scenario 1 — the You baseline walk", () => {
  test("Orientation, answer, Back, Continue, through to the pre-Review state", async ({ page }) => {
    await beginConsultation(page)

    const first = await heading(page)
    expect(first.length).toBeGreaterThan(10)

    // Selecting an option must NOT advance. This is the frozen §10 rule, and
    // the legacy client fails it by design (each option schedules an advance).
    await chooseOption(page)
    await page.waitForTimeout(600) // longer than the legacy 350ms timer
    expect(await heading(page)).toBe(first)

    // Continue advances.
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    const second = await heading(page)
    expect(second).not.toBe(first)

    // Back returns, with the answer preserved.
    await page.getByRole("button", { name: "Back", exact: true }).click()
    expect(await heading(page)).toBe(first)
    await expect(page.getByRole("radio").first()).toBeChecked()

    // Walk the rest of the Consultation to the end.
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    await completeRemaining(page)

    await expect(
      page.getByRole("heading", { name: /answers are ready to review/i }),
    ).toBeVisible()
    await expect(page.getByText(/Phase 3C/)).toBeVisible()
  })

  test("a required question refuses Continue and says why", async ({ page }) => {
    await beginConsultation(page)
    const first = await heading(page)

    await page.getByRole("button", { name: "Continue", exact: true }).click()
    expect(await heading(page)).toBe(first)
    await expect(page.locator('p[role="alert"]')).toContainText(/choose an answer/i)

    // Repeated presses never get through.
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole("button", { name: "Continue", exact: true }).click()
    }
    expect(await heading(page)).toBe(first)
  })

  test("the preview is labelled and promises nothing it does not do", async ({ page }) => {
    await page.goto(PREVIEW)
    await expect(page.getByText(/Preview — in development/)).toBeVisible()
    const body = await page.locator("body").innerText()
    expect(body).not.toMatch(/\d+\s*minutes/i)
    expect(body).not.toMatch(/instantly saved|generating your/i)
  })
})

test.describe("Scenario 2 — the adaptive You path", () => {
  test("a substantive signal opens the branch, and the avoidance question appears", async ({
    page,
  }) => {
    await beginConsultation(page)

    // Q1: choose "Bloating or wind" — a substantive signal.
    await chooseLabelled(page, "Bloating or wind")
    await page.getByRole("button", { name: "Continue", exact: true }).click()

    const seen: string[] = []
    await completeRemaining(page, {
      onQuestion: (text) => seen.push(text),
      choose: { "work around": "A food allergy" },
    })

    // The two signal branches and the avoidance branch were all reached.
    expect(seen.some((t) => /usually also true|usually different/i.test(t))).toBe(true)
    expect(seen.some((t) => /should it avoid/i.test(t))).toBe(true)
    await expect(
      page.getByRole("heading", { name: /answers are ready to review/i }),
    ).toBeVisible()
  })

  test("the avoidance question is optional and can be passed unanswered", async ({ page }) => {
    await beginConsultation(page)
    await advanceUntil(page, /work around/i, { choose: { "": "first" } })
    await chooseLabelled(page, "A food allergy")
    await page.getByRole("button", { name: "Continue", exact: true }).click()

    await expect(page.getByText("Optional", { exact: true })).toBeVisible()
    const avoidance = await heading(page)
    expect(avoidance).toMatch(/should it avoid/i)

    // No answer, and Continue is accepted.
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    expect(await heading(page)).not.toBe(avoidance)
  })
})

test.describe("Scenario 3 — changing a parent answer closes the branch", () => {
  test("the avoidance question disappears when the constraint is changed", async ({ page }) => {
    await beginConsultation(page)
    await advanceUntil(page, /work around/i, { choose: { "": "first" } })

    const constraints = await heading(page)
    await chooseLabelled(page, "A food allergy")
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    expect(await heading(page)).toMatch(/should it avoid/i)

    // Answer it, then go back and remove the trigger.
    await chooseLabelled(page, "Eggs")
    await page.getByRole("button", { name: "Back", exact: true }).click()
    expect(await heading(page)).toBe(constraints)

    await chooseLabelled(page, "A food allergy") // untick
    await chooseLabelled(page, "A limited food budget")
    await page.getByRole("button", { name: "Continue", exact: true }).click()

    // The branch is gone: Continue lands somewhere else entirely.
    expect(await heading(page)).not.toMatch(/should it avoid/i)

    // And Back from there returns to the constraints question, not the
    // closed branch.
    await page.getByRole("button", { name: "Back", exact: true }).click()
    expect(await heading(page)).toBe(constraints)
  })
})

test.describe("Scenario 4 — Family", () => {
  test("household wording throughout, and its own questions", async ({ page }) => {
    await beginConsultation(page, FAMILY)
    const body = await page.locator("body").innerText()
    expect(body).toMatch(/household/i)

    const seen: string[] = []
    await completeRemaining(page, { onQuestion: (t) => seen.push(t) })

    // Family asks about the household, never the personal post-meal signal.
    expect(seen.some((t) => /household/i.test(t))).toBe(true)
    expect(seen.some((t) => /what do you tend to notice first/i.test(t))).toBe(false)
    await expect(
      page.getByRole("heading", { name: /answers are ready to review/i }),
    ).toBeVisible()
  })
})

/**
 * Every element whose right edge escapes the viewport WITHOUT an ancestor that
 * clips it — i.e. the ones that actually push document scrollWidth out.
 *
 * A bare "scrollWidth − clientWidth" assertion reports a number and nothing
 * else, and the first failure of this test cost a CI run to diagnose: 1px, from
 * the global footer's legal-link row, on every page in the site. Naming the
 * offending rectangles means the next failure explains itself.
 *
 * Deliberately ignores content inside a scroll container: the section-journey
 * strip is `overflow-x-auto` and its items are MEANT to extend past the
 * viewport and scroll within their own box.
 */
async function unclippedOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const isClipped = (el: Element) => {
      let p = el.parentElement
      while (p && p !== document.documentElement) {
        if (/hidden|auto|scroll|clip/.test(getComputedStyle(p).overflowX)) return true
        p = p.parentElement
      }
      return false
    }
    return [...document.querySelectorAll("*")]
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.right > vw + 0.01)
      .filter(({ el }) => !isClipped(el))
      .map(({ el, rect }) => `${el.tagName}.${String(el.className).slice(0, 60)} right=${rect.right.toFixed(2)} vw=${vw}`)
  })
}

test.describe("Scenario 5 — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("no horizontal overflow, and both controls are reachable", async ({ page }) => {
    await beginConsultation(page)

    // Named offenders first, so a failure says WHICH element, not just "1".
    expect(await unclippedOverflow(page)).toEqual([])

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    await chooseOption(page)
    const continueButton = page.getByRole("button", { name: "Continue", exact: true })
    await expect(continueButton).toBeVisible()
    const box = await continueButton.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)

    await continueButton.click()
    await expect(page.getByRole("button", { name: "Back", exact: true })).toBeVisible()

    expect(await unclippedOverflow(page)).toEqual([])
    const afterAdvance = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(afterAdvance).toBeLessThanOrEqual(0)

    // The section-journey strip is allowed to scroll inside its own box — that
    // is what `overflow-x-auto` is for — but it must never widen the document.
    const journey = await page.locator("ol").first().boundingBox()
    expect(journey!.x + journey!.width).toBeLessThanOrEqual(390)
  })
})

test.describe("Scenario 6 — keyboard only", () => {
  test("the Consultation can be answered and advanced without a mouse", async ({ page }) => {
    await page.goto(PREVIEW)

    // Reach and press Begin with the keyboard alone.
    const begin = page.getByRole("button", { name: /Begin My Consultation/ })
    await begin.focus()
    await page.keyboard.press("Enter")
    const first = await heading(page)

    // Focus lands on the question heading, so the change is announced.
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedTag).toBe("H2")

    // Arrow keys move through the radio group AND select — which is exactly
    // why selection must not advance. Three presses, still the same question.
    await page.keyboard.press("Tab")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    expect(await heading(page)).toBe(first)
    await expect(page.getByRole("radio").nth(3)).toBeChecked()

    // Continue is reachable by keyboard and advances.
    await page.getByRole("button", { name: "Continue", exact: true }).focus()
    await page.keyboard.press("Enter")
    expect(await heading(page)).not.toBe(first)
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("H2")
  })

  test("a refused Continue moves focus to the message", async ({ page }) => {
    await beginConsultation(page)
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute("role"))
    expect(focusedRole).toBe("alert")
  })
})

/* ══ Helpers ═══════════════════════════════════════════════════════════════ */

interface WalkOptions {
  onQuestion?: (text: string) => void
  /** Map of a question-text fragment to the option label to click. */
  choose?: Record<string, string>
}

/** Answer the current question in whatever way it accepts. */
async function answerCurrent(page: Page, options: WalkOptions) {
  const text = await heading(page)
  options.onQuestion?.(text)

  for (const [fragment, label] of Object.entries(options.choose ?? {})) {
    if (fragment && text.toLowerCase().includes(fragment.toLowerCase())) {
      await chooseLabelled(page, label)
      return
    }
  }

  const radios = page.getByRole("radio")
  if ((await radios.count()) > 0) {
    await chooseOption(page)
    return
  }
  const boxes = page.getByRole("checkbox")
  if ((await boxes.count()) > 0) {
    await chooseOption(page)
    return
  }
  const textarea = page.locator("textarea")
  if ((await textarea.count()) > 0) {
    await textarea.fill("Something I would like to be different in three months.")
  }
}

/** Answer and Continue until the pre-Review state appears. */
async function completeRemaining(page: Page, options: WalkOptions = {}) {
  for (let i = 0; i < 25; i += 1) {
    if (await page.getByRole("heading", { name: /answers are ready to review/i }).isVisible()) {
      return
    }
    await answerCurrent(page, options)
    await page.getByRole("button", { name: /^(Continue|Finish)$/ }).click()
  }
  throw new Error("the Consultation did not reach its final state within 25 questions")
}

/** Answer and Continue until the current question matches. */
async function advanceUntil(page: Page, match: RegExp, options: WalkOptions = {}) {
  for (let i = 0; i < 25; i += 1) {
    if (match.test(await heading(page))) return
    await answerCurrent(page, options)
    await page.getByRole("button", { name: /^(Continue|Finish)$/ }).click()
  }
  throw new Error(`never reached a question matching ${match}`)
}
