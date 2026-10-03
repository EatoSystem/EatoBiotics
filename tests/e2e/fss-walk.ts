import { expect, type Page } from "@playwright/test"

/* ════════════════════════════════════════════════════════════════════════════
   THE MY FOOD SYSTEM WALK — one definition, two consumers.

   `tests/e2e/my-food-system.spec.ts` asserts the product behaves; the Experience
   0 capture harness photographs it. Both have to drive the same flow, and a
   second copy of "how you complete the candidate assessment" would drift from
   the first the moment a question is added.

   EXTRACTED, NOT REWRITTEN. Every function below is moved verbatim from that
   spec, including the reasons its comments give for the waits — those waits
   were each paid for by a real failure and none of them is decorative.

   One genuine defect the extraction fixes: `answerAll` existed TWICE in that
   file, at :352 and :472, in two different describe blocks. Identical bodies,
   two maintenance points. There is now one.

   ══ WHY THE PREVIEW ROUTE ══════════════════════════════════════════════════

   Everything here is candidate methodology — five domains with no named
   reviewer, fixture weights, draft questions. `playwright.config.ts` sets
   `VERCEL_ENV=preview`, which is what lets the route render at all; in
   production it is fail-closed, and that is the point.
   ════════════════════════════════════════════════════════════════════════════ */

export const FSS_ROUTE = "/preview/food-system-v1"

/**
 * The audit instant, shared with the account corpus.
 *
 * ── WHY `setFixedTime` AND NOT `install` ──────────────────────────────────
 *
 * This surface computes "Review again in 30 days" and "Baseline established
 * <date>" from a real `now`, so without a fixed clock the corpus renders a
 * different date every day and stops being comparable.
 *
 * But unlike the account fixture this is a REAL flow with real interactions,
 * and `clock.install` fakes `setTimeout`/`setInterval`/`rAF` — anything the
 * page schedules would stall. `setFixedTime` pins `Date` only, which is
 * exactly the dependency, and leaves timers running.
 */
export const FSS_CLOCK = "2026-10-03T09:00:00.000Z"

/** The real adapter's localStorage prefix. Keys read out of `storage()` have it stripped. */
export const FSS_PREFIX = "eatobiotics.fss.v1."

/** The seven locked areas, by their rendered nav labels, in `SECTION_ORDER`. */
export const FSS_SECTION_LABELS = [
  "Today",
  "Score",
  "My Food",
  "Biotics",
  "My Plan",
  "Progress",
  "Learn",
] as const

export type FssSectionLabel = (typeof FSS_SECTION_LABELS)[number]

/**
 * Answer every remaining question with the same option index.
 *
 * The walk advances on answer, so this loops until the radiogroup is gone
 * rather than counting questions — a question set that grows does not break it.
 */
export async function answerAll(page: Page, option: number): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    const group = page.getByRole("radiogroup")
    if ((await group.count()) === 0) break
    await group.first().getByRole("radio").nth(option).click()
    await page.waitForTimeout(40)
  }
}

/**
 * Pre-dismiss the cookie banner, exactly as the account harness does.
 *
 * `"declined"` (essential only), never `"accepted"`: declining removes the
 * overlay without enabling the analytics SDKs, so the capture's network
 * footprint stays what the audit says it is. Must run BEFORE the first
 * navigation.
 *
 * It hides something real — the banner IS a first-visit overlay — and that is
 * recorded in the screenshot index rather than disposed of by cropping.
 */
export async function freezeDate(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(FSS_CLOCK))
}

/**
 * Answer every remaining question with a VARYING option, so the five domains
 * do not all score the same.
 *
 * `answerAll` gives every domain an identical value — fine for asserting
 * behaviour, useless for auditing a five-row list or a score reveal, because a
 * reader cannot tell whether the layout copes with real spread. It also
 * produces an implausible 67 to 100 jump on reassessment.
 */
export async function answerVaried(page: Page, offsets: readonly number[] = [0, 3, 1, 2, 3, 0, 2]): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    const group = page.getByRole("radiogroup")
    if ((await group.count()) === 0) break
    const radios = group.first().getByRole("radio")
    const n = await radios.count()
    await radios.nth(Math.min(offsets[i % offsets.length], Math.max(0, n - 1))).click()
    await page.waitForTimeout(40)
  }
}

export async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("eb_cookie_consent", "declined")
    } catch {
      /* private mode — the banner renders, as it would for that visitor */
    }
  })
}

/** The all-2s sheet: every question answered with the third option. */
export async function completeAssessment(page: Page): Promise<void> {
  await page.goto(FSS_ROUTE)
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
  await answerAll(page, 2)
}

/** Every `eatobiotics.fss.v1.` key, with the prefix stripped. */
export async function storage(page: Page): Promise<Record<string, string>> {
  return page.evaluate((prefix) => {
    const out: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) out[key.slice(prefix.length)] = localStorage.getItem(key) ?? ""
    }
    return out
  }, FSS_PREFIX)
}

export async function openSection(page: Page, label: string): Promise<void> {
  await page.getByRole("navigation", { name: "My Food System" }).getByText(label, { exact: true }).click()
}

/** From the result screen into the system shell. */
export async function enterSystem(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Go to My Food System" }).click()
  await expect(page.getByRole("heading", { name: "My Food System" })).toBeVisible()
}

/**
 * Establish a second system, so Progress has something to compare.
 *
 * Today owns the Reassess button, so a caller that was last on My Plan has to
 * come back for it. Omitting this timed out on a click rather than failing on
 * an assertion, which reads like a product bug and is not one.
 */
export async function reassess(page: Page, option: number): Promise<void> {
  await openSection(page, "Today")
  await page.getByRole("button", { name: "Reassess my Food System" }).click()
  await expect(page.getByRole("radiogroup")).toBeVisible()
  await answerAll(page, option)
  await expect(page.getByText("Your Food System Score™").first()).toBeVisible()
  await enterSystem(page)
}

/**
 * Move the CURRENT score's question-set version in storage, so `canCompare`
 * refuses. Read through the REAL adapter's prefix: `storage()` strips it, so a
 * key copied out of that result is not a localStorage key.
 */
export async function tamperQuestionSetVersion(page: Page): Promise<void> {
  await page.evaluate((prefix) => {
    const get = (k: string) => JSON.parse(localStorage.getItem(prefix + k)!)
    const current = get("system.current")
    const system = get(`system.${current}`)
    const key = `score.${system.scoreId}`
    const score = get(key)
    score.provenance.questionSetVersion = "questions-v1.1"
    localStorage.setItem(prefix + key, JSON.stringify(score))
  }, FSS_PREFIX)
}

/**
 * Move the POLICY version on the system record — the anchor every other
 * resolution is read through — so the shell refuses and renders
 * `SystemUnavailable` instead of a partial Food System.
 */
export async function tamperSystemModelVersion(page: Page): Promise<void> {
  await page.evaluate((prefix) => {
    const id = JSON.parse(localStorage.getItem(`${prefix}system.current`)!)
    const key = `${prefix}system.${id}`
    const record = JSON.parse(localStorage.getItem(key)!)
    record.systemModelVersion = "system-model-v0.9"
    localStorage.setItem(key, JSON.stringify(record))
  }, FSS_PREFIX)
}
