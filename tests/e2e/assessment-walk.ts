import { expect, type Page } from "@playwright/test"

/* ════════════════════════════════════════════════════════════════════════════
   THE LIVE ASSESSMENT WALK — Generation 2.

   `/assessment` is `V1_CORE` and is the free product: the top of the commercial
   funnel and the only instrument a non-paying person ever completes. It is a
   different thing from the Generation 4 candidate assessment captured in step 4,
   and `tests/e2e/fss-walk.ts` drives that one.

   ══ SIXTEEN SCORED QUESTIONS, AND NOTHING ELSE ══════════════════════════════

   `lib/assessment-data.ts` holds 16 questions. There is NO What You Notice and
   NO Food Context here — those exist in the paid deep assessment and in FSS-v1.
   That absence is a finding of the audit rather than a gap in this harness, and
   it is why no "varied context" scenario appears below: the product does not
   support one, and manufacturing it would be inventing evidence.

   ══ THREE VIEWS, ONE ROUTE ══════════════════════════════════════════════════

   `assessment-client.tsx` holds `view: "intro" | "questions" | "results"` and
   persists the whole state to `localStorage` on every change, so resume is a
   real product behaviour rather than something this harness simulates.
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * The front door is a FOUNDATION CHOOSER, not the assessment.
 *
 * `/assessment` renders `FoundationChooser` — "You" or "Family". The actual
 * instrument lives at `/assessment/you`. A planning note that called the two
 * routes duplicates was WRONG and is corrected in the audit document; they are
 * two distinct steps, which is why the journey has one more gate than expected.
 */
export const ASSESSMENT_ROUTE = "/assessment"
export const ASSESSMENT_YOU_ROUTE = "/assessment/you"

/** The live assessment's localStorage key (`lib/assessment-storage.ts:15`). */
export const ASSESSMENT_KEY = "eatobiotics-assessment"

/** Shared with every other corpus, so dated copy is comparable across surfaces. */
export const ASSESSMENT_CLOCK = "2026-10-03T09:00:00.000Z"

/**
 * Pre-dismiss the cookie banner. `"declined"`, never `"accepted"`: declining
 * removes the overlay without enabling the analytics SDKs, so the capture's
 * network footprint stays what the audit says it is.
 */
export async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("eb_cookie_consent", "declined")
    } catch {
      /* private mode — the banner renders, as it would for that visitor */
    }
  })
}

/**
 * Pin `Date` only.
 *
 * `clock.install` would fake timers too, and this is a real interactive flow
 * with in-page scheduling — the same reasoning recorded in `fss-walk.ts`.
 */
export async function freezeDate(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(ASSESSMENT_CLOCK))
}

/** Land on the intro, before anything has been answered. */
export async function openChooser(page: Page): Promise<void> {
  await page.goto(ASSESSMENT_ROUTE)
  await page.waitForLoadState("networkidle")
  await expect(page.getByRole("heading", { name: /foundation/i }).first()).toBeVisible()
}

/** The You intro — a marketing page with the lead form partway down it. */
export async function openIntro(page: Page): Promise<void> {
  await page.goto(ASSESSMENT_YOU_ROUTE)
  await page.waitForLoadState("networkidle")
  await expect(page.locator("#lead-name")).toHaveCount(1)
}

/**
 * Block every write the journey would otherwise perform.
 *
 * ── WHY THIS IS ENGINEERED RATHER THAN OBSERVED ───────────────────────────
 *
 * Completing the assessment POSTs `/api/submit-lead`, which UPSERTS INTO
 * `leads` and can INSERT INTO `referrals`, and `/api/send-results-email`, which
 * sends real email through Resend. The standing rule for agent sessions is
 * read-only against production Supabase.
 *
 * This container happens to carry no Supabase or Resend credentials, so those
 * routes are inert here — but "it happens to be safe where I ran it" is exactly
 * the reasoning `NOTE-FIXTURE-01` records as insufficient. The capture must be
 * unable to write ANYWHERE it runs, so the requests are aborted at the browser
 * and never reach the server.
 *
 * Aborting is deliberate rather than stubbing a 200: the UI's real behaviour
 * when the call fails is itself part of what the audit is looking at.
 */
export async function blockWrites(page: Page): Promise<string[]> {
  const attempted: string[] = []
  await page.route("**/api/**", async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    if (req.method() !== "GET") {
      attempted.push(`${req.method()} ${path}`)
      await route.abort()
      return
    }
    await route.continue()
  })
  return attempted
}

/**
 * Enter the question flow.
 *
 * ── THE FRONT DOOR IS A LEAD FORM ─────────────────────────────────────────
 *
 * Not a "start" button. `assessment-intro.tsx` requires NAME, EMAIL, AGE
 * BRACKET and an explicit HEALTH-DATA CONSENT checkbox, all validated, before
 * question one is reachable. That is a finding in its own right and it is why
 * this helper is longer than a click.
 *
 * The email is an obviously-synthetic audit address so that nothing in a log
 * anywhere could be mistaken for a real person.
 */
export async function startQuestions(page: Page): Promise<void> {
  await page.locator("#lead-name").fill("Audit Fixture")
  await page.locator("#lead-email").fill("audit-fixture@example.invalid")

  /*
   * Age bracket is a <select>, and the FIRST real option is "Under 16", which
   * the product correctly refuses: "EatoBiotics is for people aged 16 and over,
   * so we can't continue with this assessment."
   *
   * So an adult bracket is chosen by label rather than by index. The age gate
   * working is itself a finding, and it is recorded in the audit rather than
   * worked around silently.
   */
  await page.locator("select").first().selectOption({ label: "30–39" })

  await page.getByRole("checkbox").first().check()

  await page.locator("form button[type=submit]").or(page.locator("form button").last()).first().click()
  await expect(page.locator("fieldset label").first()).toBeVisible({ timeout: 10_000 })
}

/** How many questions have been answered so far, read from storage. */
export async function answeredCount(page: Page): Promise<number> {
  return page.evaluate((key) => {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return 0
      const s = JSON.parse(raw) as { answers?: Record<string, unknown> }
      return Object.keys(s.answers ?? {}).length
    } catch {
      return 0
    }
  }, ASSESSMENT_KEY)
}

/**
 * Answer `count` questions, choosing option `pick(i)` for each.
 *
 * Returns the number actually answered, so a caller can assert it rather than
 * assume it — a silently short loop would produce a half-finished assessment
 * that still looked like a captured state.
 */
export async function answer(
  page: Page,
  pick: (index: number) => number,
  count = 60,
): Promise<number> {
  let done = 0
  for (let i = 0; i < count; i += 1) {
    const options = page.locator("fieldset label")
    const n = await options.count()
    if (n === 0) break

    /*
     * Click the LABEL, not the input. `assessment-question.tsx` keeps a native
     * radio/checkbox `sr-only` and makes the card its label — good semantics,
     * but the input is not visible, so clicking it directly fails.
     */
    await options.nth(Math.max(0, Math.min(pick(i), n - 1))).click()
    await page.waitForTimeout(60)

    /*
     * And the flow does NOT auto-advance: `handleNext` is wired to an explicit
     * control, so a harness that only selected would photograph question one
     * sixteen times.
     */
    const next = page.getByRole("button", { name: /next|continue|see (?:my )?results|finish/i }).last()
    if ((await next.count()) === 0) break
    if (await next.isDisabled().catch(() => false)) break
    await next.click()
    await page.waitForTimeout(120)
    done += 1
  }
  return done
}

/** Every option at the same index — the uniform sheet. */
export const uniform = (): number => 2

/**
 * A varying sheet, so the scored domains do not all land on one value.
 *
 * The uniform sheet produces a single profile type and a flat result, which
 * would let the audit photograph one branch of Results and imply it is the
 * page. Offsets are fixed rather than random, so the corpus is reproducible.
 */
export const varied = (index: number): number => [0, 3, 1, 2, 3, 0, 2, 1][index % 8]

/** The lowest available option throughout — the bottom of the score range. */
export const low = (): number => 0

/** The highest available option throughout — the top of the score range. */
export const high = (): number => 4

/**
 * Wait for the completed result to render.
 *
 * Anchored on the result's own `<h1>` — "Your Biotics Score™" in
 * `biotics-score-reveal.tsx:52`. An earlier, looser matcher
 * (`/your score|food system/i`) matched the HEADER NAV's "Understand My Food
 * System" link, which is hidden at 390, so the wait failed on mobile for a
 * reason that had nothing to do with the result.
 */
export async function expectResults(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /Your Biotics Score/i }).first()).toBeVisible({
    timeout: 20_000,
  })
  // And the questions really are finished, not merely scrolled past.
  await expect(page.locator("fieldset label")).toHaveCount(0)
}

/** Clear the saved assessment, so the next visit is a genuine first visit. */
export async function clearAssessment(page: Page): Promise<void> {
  await page.evaluate((key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* nothing to clear */
    }
  }, ASSESSMENT_KEY)
}
