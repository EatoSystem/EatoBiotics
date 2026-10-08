import { test, expect, type Page } from "@playwright/test"

import {
  answerAll,
  completeAssessment,
  openSection,
  storage,
  FSS_PREFIX as PREFIX,
  FSS_ROUTE as ROUTE,
} from "./fss-walk"

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

/* ════════════════════════════════════════════════════════════════════════════
   Gate 5 step 2c · WHAT CHANGED, rendered

   The structure is unit-tested. This is the part only a browser can answer:
   what a returning person actually reads, in what order, and whether the
   refusal states are legible rather than blank.
   ════════════════════════════════════════════════════════════════════════════ */

test.describe("Gate 5 · what changed, as a person reads it", () => {
  /** Establish a successor from whatever is current, with a given sheet. */
  async function reassess(page: Page, option: number) {
    /*
     * Today owns the Reassess button, so a test that was last on My Plan has
     * to come back for it. Omitting this timed out on a click rather than
     * failing on an assertion, which reads like a product bug and is not one.
     */
    await openSection(page, "Today")
    await page.getByRole("button", { name: "Reassess my Food System" }).click()
    await expect(page.getByRole("radiogroup")).toBeVisible()
    await answerAll(page, option)
    await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
  }

  test("the five classes appear, the score is LAST, and nothing is causal", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    /*
     * Live the period: mark one action done and one skipped — and ASSERT the
     * marks landed. The first version used `if (await count()) click()`, so a
     * missed click silently produced zero completions and the co-occurrence
     * sentence below went missing for a reason that read like a product bug.
     */
    await openSection(page, "My Plan")
    await expect(page.getByRole("heading", { name: "Where you are on each" })).toBeVisible()
    await page.getByRole("button", { name: "Mark done" }).first().click()
    await expect(page.getByText("Done", { exact: false }).first()).toBeVisible()
    await page.getByRole("button", { name: "Skip" }).nth(1).click()

    await openSection(page, "Progress")
    await expect(page.getByText("Marked done on this device")).toBeVisible()

    await reassess(page, 3)
    await openSection(page, "Progress")

    await expect(page.getByRole("heading", { name: "What changed" })).toBeVisible()

    const text = await page.locator("body").innerText()
    /*
     * CASE-INSENSITIVE, because the section labels carry Tailwind's `uppercase`
     * and `innerText` returns the CSS-transformed text. The first version of
     * this asserted title case and failed on copy that was rendering perfectly.
     */
    const lower = text.toLowerCase()

    /* ── The five classes are all present ──────────────────────────────── */
    expect(lower).toContain("your food patterns")
    expect(lower).toContain("what you notice")
    expect(lower).toContain("your context")
    expect(lower).toContain("your actions")
    expect(lower).toContain("your food system score™")

    /* ── THE SCORE IS LAST of the five ────────────────────────────────── */
    /*
     * Read from the DOM headings, not from text indices.
     *
     * `indexOf` found "your food system score™" inside the What You Notice
     * NOTE — "they are not part of your Food System Score™" — which is
     * deliberate copy sitting two blocks earlier, so the ordering assertion was
     * reading the wrong occurrence and failing on a page that was correct.
     * The block headings are the actual hierarchy.
     */
    const headings = (
      await page.locator("section[aria-labelledby='what-changed'] h3").allInnerTexts()
    ).map((h) => h.trim().toLowerCase())

    expect(headings, "a What Changed block is missing or renamed").toEqual([
      "your food patterns",
      "what you notice",
      "your context",
      "your actions",
      "your food system score™",
    ])

    /* ── The baseline sentence is gone, because there are two now ─────── */
    expect(text).not.toContain("nothing to compare it with")

    /* ── A real move is described, anchored to the PREVIOUS assessment ── */
    expect(text).toContain("than at your previous assessment")
    expect(text).not.toMatch(/\bat baseline\b/i)

    /* ── NO CAUSAL ATTRIBUTION, anywhere on the rendered page ─────────── */
    for (const forbidden of [
      /\bbecause you\b/i,
      /\bcaused your\b/i,
      /\bit'?s working\b/i,
      /\bthese actions (improved|raised|moved)\b/i,
      /\bmoved your score\b/i,
      /\bwhat works for you\b/i,
      /\bmost improved\b/i,
      /\byour gut (is|has) (improved|better)\b/i,
    ]) {
      expect(text, `a causal or ranking claim reached the page: ${forbidden}`).not.toMatch(forbidden)
    }

    /* ── And the co-occurrence sentence refuses the join out loud ─────── */
    expect(text).toContain("we cannot tell you that one produced the other")
  })

  test("A ← B ← C: viewing C compares B↔C, and reload keeps that pair", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    await reassess(page, 3) // B, from a better sheet than A
    await reassess(page, 0) // C, from the worst sheet

    const keys = await storage(page)
    const systemC = JSON.parse(keys["system.current"])
    const recordC = JSON.parse(keys[`system.${systemC}`])
    const systemB = recordC.previousSystemId
    const recordB = JSON.parse(keys[`system.${systemB}`])
    const systemA = recordB.previousSystemId
    expect(systemA).toBeTruthy()
    expect(systemA).not.toBe(systemB)

    await openSection(page, "Progress")
    const text = await page.locator("body").innerText()

    /*
     * C answered 0 everywhere and B answered 3, so B↔C must read LOWER. A
     * answered 2, so an accidental A↔C would also read lower — which is why
     * the discriminating assertion is on the stored scores, not the adjective.
     */
    const scoreB = JSON.parse(keys[`score.${recordB.scoreId}`]).score
    const scoreC = JSON.parse(keys[`score.${recordC.scoreId}`]).score
    expect(text, "the rendered pair is not B→C").toContain(`${scoreB} → ${scoreC}`)

    const scoreA = JSON.parse(keys[`score.${JSON.parse(keys[`system.${systemA}`]).scoreId}`]).score
    if (scoreA !== scoreB) {
      expect(text, "viewing C compared against A by accident").not.toContain(`${scoreA} → ${scoreC}`)
    }

    /* Reload: the same pair, because it comes from `previousSystemId`. */
    await page.reload()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
    await openSection(page, "Progress")
    expect(await page.locator("body").innerText()).toContain(`${scoreB} → ${scoreC}`)
  })

  test("a moved question set refuses: two scores, labelled, and NO delta", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await reassess(page, 3)

    /* Tamper the CURRENT score's question-set version, in storage. */
    /*
     * Through the REAL adapter's prefix. The first version of this omitted it
     * and read null — a reminder that `storage()` above strips the prefix, so
     * a key copied out of its result is not a localStorage key.
     */
    await page.evaluate((prefix) => {
      const get = (k: string) => JSON.parse(localStorage.getItem(prefix + k)!)
      const current = get("system.current")
      const system = get(`system.${current}`)
      const key = `score.${system.scoreId}`
      const score = get(key)
      score.provenance.questionSetVersion = "questions-v1.1"
      localStorage.setItem(prefix + key, JSON.stringify(score))
    }, PREFIX)
    await page.reload()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
    await openSection(page, "Progress")

    const text = await page.locator("body").innerText()
    const lower = text.toLowerCase()
    expect(lower).toContain("shown separately")
    expect(lower).toContain("does not treat as directly comparable")
    expect(lower).toContain("previous assessment")
    expect(lower).toContain("this assessment")
    // No arrow, because there is no permitted relationship.
    expect(text, "a refused comparison rendered a delta").not.toMatch(/\d+\s*→\s*\d+/)
    // But the records are still legible — the refusal suppressed the relationship only.
    expect(text).toContain("still a complete record")
  })

  test("a moved domain schema: the score compares, the domains do not", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await reassess(page, 3)

    await page.evaluate((prefix) => {
      const get = (k: string) => JSON.parse(localStorage.getItem(prefix + k)!)
      const current = get("system.current")
      const system = get(`system.${current}`)
      const key = `score.${system.scoreId}`
      const score = get(key)
      score.domainSchemaVersion = "domains-v2.0"
      localStorage.setItem(prefix + key, JSON.stringify(score))
    }, PREFIX)
    await page.reload()
    await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
    await openSection(page, "Progress")

    const text = await page.locator("body").innerText()
    // The overall score still moves…
    expect(text).toMatch(/\d+\s*→\s*\d+/)
    // …and the five parts are explicitly not compared.
    expect(text).toContain("defined differently between these two assessments")
    expect(text, "a domain sentence survived a moved schema").not.toContain(
      "than at your previous assessment",
    )
  })

  test("identical answers twice: `the same`, and no manufactured movement", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await reassess(page, 2) // completeAssessment answers 2s as well

    await openSection(page, "Progress")
    const text = await page.locator("body").innerText()
    expect(text).toContain("is the same as at your previous assessment")
    expect(text).toContain("a real result, not a missing one")
    expect(text, "a delta appeared between two identical sheets").not.toMatch(/\d+\s*→\s*\d+/)

    /*
     * Step 2d: the unchanged observations consolidate to ONE sentence rather
     * than one line per question. Reading the previous version rendered showed
     * three "Same answer" lines above a longer note — each true, the block
     * useless, and the same noise the Context block already had.
     */
    expect(text).toContain("Your answers to all of these are the same")
    expect(text, "the consolidated sentence did not replace the per-question lines").not.toContain(
      "Same answer",
    )
  })

  test("a changed observation quotes both answers and asserts no direction", async ({ page }) => {
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await reassess(page, 3)
    await openSection(page, "Progress")

    /*
     * SCOPED TO THE OBSERVATIONS BLOCK, not the page.
     *
     * The first version scanned the whole body and failed on "fermented foods
     * arriving MORE OFTEN" — a DOMAIN sentence, where a direction is arithmetic
     * on two numbers from one instrument and is permitted. The prohibition is
     * on directional language about a SELF-REPORT, so the assertion has to be
     * about that block or it is asking the wrong question loudly.
     */
    const notice = page
      .locator("section[aria-labelledby='what-changed'] > div")
      .filter({ has: page.locator("h3", { hasText: /what you notice/i }) })
    await expect(notice).toHaveCount(1)
    const noticeText = await notice.innerText()
    const lower = noticeText.toLowerCase()

    /* Both answers are shown, labelled, with nothing between them. */
    expect(lower).toContain("previously")
    expect(lower).toContain("now")

    /*
     * NO DIRECTIONAL VERB about a self-report. `ObservationChange` carries no
     * direction, so there is nowhere for one to come from — and this asserts
     * the page agrees. A directional sentence here would need both a reviewed
     * ordinal model for the question and approved comparative copy.
     */
    for (const forbidden of [
      /\b(less|more) often\b/i,
      /\b(improved|worsened|better|worse)\b/i,
      /\b(increased|decreased)\b/i,
    ]) {
      expect(
        noticeText,
        `a directional claim about a self-report: ${forbidden}`,
      ).not.toMatch(forbidden)
    }

    /* NON-VACUITY: the block really did render two quoted answers. */
    expect(noticeText.length).toBeGreaterThan(80)
  })
})

/* ── And it reads at every width ───────────────────────────────────────── */

for (const [label, width] of [["phone", 390], ["tablet", 834], ["desktop", 1280]] as const) {
  test(`What Changed has no horizontal overflow at ${label} (${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await completeAssessment(page)
    await page.getByRole("button", { name: "Go to My Food System" }).click()

    await page.getByRole("button", { name: "Reassess my Food System" }).click()
    await expect(page.getByRole("radiogroup")).toBeVisible()
    for (let i = 0; i < 60; i += 1) {
      const group = page.getByRole("radiogroup")
      if ((await group.count()) === 0) break
      await group.first().getByRole("radio").nth(3).click()
      await page.waitForTimeout(40)
    }
    await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
    await page.getByRole("button", { name: "Go to My Food System" }).click()
    await openSection(page, "Progress")
    await expect(page.getByRole("heading", { name: "What changed" })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(overflow, `What Changed overflows horizontally at ${width}px`).toBe(false)
  })
}
