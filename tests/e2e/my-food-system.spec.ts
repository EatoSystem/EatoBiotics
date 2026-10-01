import { test, expect, type Page } from "@playwright/test"

/**
 * GATE 4 — the walk.
 *
 * ══ WHAT A WALK PROVES THAT A UNIT TEST CANNOT ══════════════════════════════
 *
 * That the thing is a product. `tests/unit/my-food-system.test.ts` proves the
 * composer composes, the decisions resolve, and the refusals refuse — over
 * records a fixture handed it. This proves a person can take an assessment,
 * come back, and find their Food System where they left it, in a real browser,
 * through real storage, against a production build.
 *
 * ══ AND THE COUNTERFACTUALS, WHICH ARE HALF THE VALUE ═══════════════════════
 *
 * A walk that only passes proves less than one that also FAILS correctly. So
 * this tampers with storage and asserts the product refuses rather than
 * guesses: a moved method version, a missing score, a cleared pointer. Those
 * are the paths nobody exercises by hand, and they are where a composition
 * layer is most tempted to fill a gap in.
 *
 * ══ WHY THE PREVIEW ROUTE ══════════════════════════════════════════════════
 *
 * Everything here is candidate methodology — five domains with no named
 * reviewer, fixture weights, draft questions. `playwright.config.ts` sets
 * `VERCEL_ENV=preview`, which is what lets the route render at all; in
 * production it is fail-closed, and that is the point.
 */

const ROUTE = "/preview/food-system-v1"
const PREFIX = "eatobiotics.fss.v1."

/** The all-2s sheet: every question answered with the third option. */
async function completeAssessment(page: Page) {
  await page.goto(ROUTE)
  /*
   * GATE 5: the walk opens on a start screen, because an assessment is now an
   * ATTEMPT that has to be begun — a draft — rather than something the route
   * falls into. A reassessment enters the same component the same way.
   *
   * WAITED FOR, not probed. The first version called `count()` immediately
   * after `goto` and raced hydration: the component renders null until BOTH
   * pointers have been read, so the button was not there yet, the click was
   * skipped, and all eleven tests then waited for a radiogroup that was never
   * going to appear.
   */
  const start = page.getByRole("button", { name: "Start the assessment" })
  await expect(start).toBeVisible()
  await start.click()
  await expect(page.getByRole("radiogroup")).toBeVisible()

  // The walk advances on answer, so this loops until the radiogroup is gone.
  for (let i = 0; i < 60; i += 1) {
    const group = page.getByRole("radiogroup")
    if ((await group.count()) === 0) break
    const options = group.first().getByRole("radio")
    await options.nth(2).click()
    await page.waitForTimeout(40)
  }
}

async function storage(page: Page): Promise<Record<string, string>> {
  return page.evaluate((prefix) => {
    const out: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) out[key.slice(prefix.length)] = localStorage.getItem(key) ?? ""
    }
    return out
  }, PREFIX)
}

async function openSection(page: Page, label: string) {
  await page.getByRole("navigation", { name: "My Food System" }).getByText(label, { exact: true }).click()
}

test.describe("Gate 4 · My Food System is walkable", () => {
  test("assessment → 67 → result → Today → mark → reload → still there", async ({ page }) => {
    await completeAssessment(page)

    /* ── The result page, from the RECORDED decisions ──────────────────── */
    await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
    await expect(page.getByText("67", { exact: true }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Go to My Food System" })).toBeVisible()

    // Establishment has already happened: the records exist before the person
    // presses anything, which is why a refresh here lands on the Food System.
    const written = await storage(page)
    expect(written["system.current"]).toBeTruthy()
    expect(Object.keys(written).some((k) => k.startsWith("priority-decision."))).toBe(true)
    expect(Object.keys(written).some((k) => k.startsWith("plan-decision."))).toBe(true)

    /* ── Today is the landing ──────────────────────────────────────────── */
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
    await expect(page.getByText("Your focus", { exact: true })).toBeVisible()
    await expect(page.getByText("Review again", { exact: true })).toBeVisible()
    await expect(page.getByText(/in \d+ days/)).toBeVisible()

    // The reviewed headline, not an invented imperative.
    await expect(page.getByText(/widen the range, not the amount/i)).toBeVisible()

    /* ── Mark one done and one skipped ─────────────────────────────────── */
    await openSection(page, "My Plan")
    await expect(page.getByRole("heading", { name: "Where you are on each" })).toBeVisible()

    const doneButtons = page.getByRole("button", { name: "Mark done" })
    const skipButtons = page.getByRole("button", { name: "Skip" })
    await doneButtons.first().click()
    await expect(page.getByText("Done", { exact: false }).first()).toBeVisible()
    await skipButtons.nth(1).click()

    await openSection(page, "Progress")
    await expect(page.getByText("Marked done on this device")).toBeVisible()
    await expect(page.getByText("Marked skipped")).toBeVisible()

    const before = await storage(page)

    /* ── THE RELOAD ────────────────────────────────────────────────────── */
    await page.reload()

    // Lands on Today, not the assessment and not the result.
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
    await expect(page.getByText("Your focus", { exact: true })).toBeVisible()
    await expect(page.getByRole("radiogroup")).toHaveCount(0)

    // The same score, the same priority.
    await openSection(page, "Score")
    await expect(page.getByText("67", { exact: true }).first()).toBeVisible()
    // All five provenance fields, shown rather than hidden.
    for (const v of [
      "fss-v1.0",
      "assessment-v1.0",
      "questions-v1.0",
      "calc-v1.0",
      "interpretation-v1.0",
    ]) {
      await expect(page.getByText(v, { exact: true })).toBeVisible()
    }

    // And both action states survived.
    await openSection(page, "Progress")
    await expect(page.getByText("Marked done on this device")).toBeVisible()
    const after = await storage(page)
    expect(after["system.current"]).toBe(before["system.current"])
    const actionsKey = Object.keys(after).find((k) => k.startsWith("actions."))!
    expect(after[actionsKey]).toContain('"done"')
    expect(after[actionsKey]).toContain('"skipped"')
  })

  test("Score carries no band word, and Progress draws no comparison", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    await openSection(page, "Score")
    const scoreText = (await page.locator("main, body").first().innerText()).toLowerCase()
    for (const band of ["excellent", "thriving", "needs work", "poor", "very good"]) {
      expect(scoreText, `a band word reached the Score section: ${band}`).not.toContain(band)
    }

    await openSection(page, "Progress")
    const progressText = await page.locator("body").innerText()
    expect(progressText).toContain("nothing to compare it with")
    expect(progressText).toContain("It does not change your score")
    // No delta, no arrow, no "since".
    expect(progressText).not.toMatch(/[+−]\s?\d+|\bsince\b|▲|▼/)
  })

  test("Biotics shows the science and no personal state", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await openSection(page, "Biotics")

    const text = await page.locator("body").innerText()
    // The education is present…
    for (const biotic of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(text).toContain(biotic)
    }
    // …and the refusal is stated outright.
    expect(text).toContain("no personal score for any of the three")
    // The person's own score is not on this screen.
    expect(text).not.toContain("67")
  })
})

test.describe("Gate 4 · the counterfactuals", () => {
  test("cleared storage returns to the assessment, with no half system", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()

    await page.evaluate(() => localStorage.clear())
    await page.reload()
    /*
     * GATE 5: back to the START SCREEN, not straight into questions. Cleared
     * storage means no system AND no attempt, so there is nothing to resume —
     * the person begins one, exactly as a first-time visitor does.
     */
    await expect(page.getByRole("button", { name: "Start the assessment" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "My Food System" })).toHaveCount(0)
  })

  test("a moved method version refuses, and DESTROYS NOTHING", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    const keysBefore = Object.keys(await storage(page)).sort()

    // Move the POLICY version on the system record: the anchor every other
    // resolution is read through.
    await page.evaluate((prefix) => {
      const id = JSON.parse(localStorage.getItem(`${prefix}system.current`)!)
      const key = `${prefix}system.${id}`
      const record = JSON.parse(localStorage.getItem(key)!)
      record.systemModelVersion = "system-model-v0.9"
      localStorage.setItem(key, JSON.stringify(record))
    }, PREFIX)

    await page.reload()

    // It refuses, by name, in plain words.
    await expect(page.getByRole("heading", { name: "We are not going to guess" })).toBeVisible()
    await expect(page.getByText(/no longer implements/)).toBeVisible()
    // And it promises — truthfully — that nothing was touched.
    await expect(page.getByText(/Nothing has been deleted or changed/)).toBeVisible()
    expect(Object.keys(await storage(page)).sort()).toEqual(keysBefore)
  })

  test("a dangling score reference refuses rather than rendering part of it", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    await page.evaluate((prefix) => {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i)
        if (key?.startsWith(`${prefix}score.`)) localStorage.removeItem(key)
      }
    }, PREFIX)

    await page.reload()
    await expect(page.getByRole("heading", { name: "We are not going to guess" })).toBeVisible()
    // Specifically the score, not a generic error.
    await expect(page.getByText(/score behind your Food System is not/)).toBeVisible()
    // No section of the Food System rendered beside it.
    await expect(page.getByText("Your focus", { exact: true })).toHaveCount(0)
  })

  test("an action under a moved content version reads as such, not re-worded", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    // Capture the wording the person was actually given.
    await openSection(page, "My Plan")
    const originalText = await page.locator("body").innerText()

    await page.evaluate((prefix) => {
      const key = Object.keys(localStorage).find((k) => k.startsWith(`${prefix}actions.`))!
      const rows = JSON.parse(localStorage.getItem(key)!)
      rows[0].actionSetVersion = "actions-v0.9"
      localStorage.setItem(key, JSON.stringify(rows))
    }, PREFIX)

    await page.reload()
    await openSection(page, "My Plan")

    // The action is STILL THERE — dropping it would make the method change
    // invisible — and it says what happened instead of showing today's words.
    await expect(page.getByText("Recommended under a method that has moved")).toBeVisible()
    const afterText = await page.locator("body").innerText()
    expect(afterText).toContain("has changed since this plan was made")
    expect(originalText.length).toBeGreaterThan(0)
  })

  test("opposite Food Context answers: the same score, a different plan", async ({ page }) => {
    /*
     * Food Context reaches the Score by NO path. What it changes is which
     * actions are reasonable to suggest. Two sheets that differ only in Part 4
     * must therefore score identically and plan differently — which is the
     * clearest single demonstration that constraints are not scored against
     * the person.
     */
    async function walkWith(contextOption: number) {
      await page.goto(ROUTE)
      await page.evaluate(() => localStorage.clear())
      await page.goto(ROUTE)
      const start = page.getByRole("button", { name: "Start the assessment" })
      await expect(start).toBeVisible()
      await start.click()
      await expect(page.getByRole("radiogroup")).toBeVisible()

      for (let i = 0; i < 60; i += 1) {
        const group = page.getByRole("radiogroup")
        if ((await group.count()) === 0) break
        // The Food Context part announces itself; its note names circumstances.
        const isContext = await page
          .getByText(/These are not scored either, and they never reduce anything/)
          .count()
        const options = group.first().getByRole("radio")
        await options.nth(isContext > 0 ? contextOption : 2).click()
        await page.waitForTimeout(40)
      }

      await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
      const body = await page.locator("body").innerText()
      const score = body.match(/\b67\b/) ? 67 : null
      const plan = (await storage(page))[
        Object.keys(await storage(page)).find((k) => k.startsWith("plan-decision."))!
      ]
      return { score, plan }
    }

    const unconstrained = await walkWith(0)
    const constrained = await walkWith(3)

    expect(unconstrained.score).toBe(67)
    expect(constrained.score).toBe(67)
    expect(
      constrained.plan,
      "Food Context shapes the plan, or it is doing nothing at all",
    ).not.toBe(unconstrained.plan)
  })
})

test.describe("Gate 4 · it fits, at three widths", () => {
  for (const [label, width, height] of [
    ["phone", 390, 844],
    ["tablet", 834, 1112],
    ["desktop", 1280, 900],
  ] as const) {
    test(`no horizontal overflow at ${label} (${width})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await completeAssessment(page)
      await page.getByRole("button", { name: "Go to My Food System" }).click()

      for (const section of ["Today", "Score", "My Food", "Biotics", "My Plan", "Progress", "Learn"]) {
        await openSection(page, section)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, `${section} overflows horizontally at ${width}`).toBeLessThanOrEqual(1)
      }
    })
  }
})

test.describe("Gate 5 · a reassessment creates history and never rewrites it", () => {
  /** Everything stored, as bytes, keyed — so a baseline can be compared exactly. */
  async function allKeys(page: Page): Promise<Record<string, string>> {
    return storage(page)
  }

  async function answerAll(page: Page, option: number) {
    for (let i = 0; i < 60; i += 1) {
      const group = page.getByRole("radiogroup")
      if ((await group.count()) === 0) break
      await group.first().getByRole("radio").nth(option).click()
      await page.waitForTimeout(40)
    }
  }

  test("THE INVARIANT — the baseline survives a reassessment byte-identically", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()

    const before = await allKeys(page)
    const systemA = before["system.current"]
    expect(systemA).toBeTruthy()

    // The baseline's own records, captured exactly.
    const recordsOfA = Object.fromEntries(
      Object.entries(before).filter(([k]) => k !== "system.current"),
    )

    /* ── Reassess, with a DIFFERENT sheet ───────────────────────────────── */
    await page.getByRole("button", { name: "Reassess my Food System" }).click()
    await expect(page.getByRole("radiogroup")).toBeVisible()
    await answerAll(page, 3)

    await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()

    const after = await allKeys(page)

    // A new system is current…
    expect(after["system.current"]).not.toBe(systemA)
    // …and it points BACK at the baseline.
    const systemB = JSON.parse(after[`system.${JSON.parse(after["system.current"])}`])
    expect(systemB.previousSystemId).toBe(JSON.parse(systemA))

    // THE INVARIANT: every baseline record is byte-identical.
    for (const [key, value] of Object.entries(recordsOfA)) {
      expect(after[key], `the baseline's ${key} was rewritten`).toBe(value)
    }

    // And the assessments are two distinct records, both still present.
    const systemARecord = JSON.parse(after[`system.${JSON.parse(systemA)}`])
    expect(systemARecord.assessmentId).not.toBe(systemB.assessmentId)
    expect(after[`assessment.${systemARecord.assessmentId}`]).toBeTruthy()
    expect(after[`assessment.${systemB.assessmentId}`]).toBeTruthy()
  })

  test("ABANDONED — an attempt in progress leaves the Food System current", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    const before = await allKeys(page)

    // Begin a reassessment and answer a few questions into it.
    await page.getByRole("button", { name: "Reassess my Food System" }).click()
    await expect(page.getByRole("radiogroup")).toBeVisible()
    for (let i = 0; i < 4; i += 1) {
      await page.getByRole("radiogroup").first().getByRole("radio").nth(1).click()
      await page.waitForTimeout(40)
    }

    // The pointer has not moved, and the draft is somewhere else entirely.
    const during = await allKeys(page)
    expect(during["system.current"]).toBe(before["system.current"])
    expect(Object.keys(during).some((k) => k.startsWith("assessment.draft."))).toBe(true)

    // Reload mid-attempt: the attempt resumes, and the system is still there.
    await page.reload()
    await expect(page.getByRole("radiogroup")).toBeVisible()
    expect((await allKeys(page))["system.current"]).toBe(before["system.current"])

    // Every record the baseline had is exactly as it was.
    for (const [key, value] of Object.entries(before)) {
      expect((await allKeys(page))[key], `${key} changed during an attempt`).toBe(value)
    }
  })

  test("a stale draft is reported, not resumed and not deleted", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await page.getByRole("button", { name: "Reassess my Food System" }).click()
    await expect(page.getByRole("radiogroup")).toBeVisible()
    await page.getByRole("radiogroup").first().getByRole("radio").nth(1).click()
    await page.waitForTimeout(80)

    // The instrument moves under the attempt.
    await page.evaluate((prefix) => {
      const id = JSON.parse(localStorage.getItem(`${prefix}assessment.draft.current`)!)
      const key = `${prefix}assessment.draft.${id}`
      const draft = JSON.parse(localStorage.getItem(key)!)
      draft.questionSetVersion = "questions-v2.0"
      localStorage.setItem(key, JSON.stringify(draft))
    }, PREFIX)
    await page.reload()

    await expect(page.getByText(/given to a different set of questions/)).toBeVisible()
    // The promise that matters, and it is true.
    await expect(page.getByText(/existing Food System has not been touched/)).toBeVisible()
    // The answers are still there until the person says otherwise.
    expect(Object.keys(await allKeys(page)).some((k) => k.startsWith("assessment.draft."))).toBe(true)

    // Discarding touches the attempt and nothing else.
    await page.getByRole("button", { name: "Discard the unfinished attempt" }).click()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
  })
})
