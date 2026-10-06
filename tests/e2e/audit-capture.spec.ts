import { test, expect, type Page } from "@playwright/test"
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs"

import {
  AUDIT_ROOT,
  COMMITTED_ROOT,
  CORPUS_ROOT,
  mergeIntoManifest,
  readShards,
  sha256Of,
  writeShard,
  type ManifestRow,
} from "./audit-manifest"
import {
  AUDIT_CLOCK,
  AUDIT_DATE,
  AUDIT_FIXTURE_STATES,
  AUDIT_FIXTURE_TABS,
  AUDIT_STATE_FINDINGS,
} from "../../lib/experience-audit/fixtures"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0 — THE ACCOUNT CAPTURE HARNESS.

   Produces the screenshot corpus for the real LiveDashboard, and carries the
   assertions that keep two recorded findings continuously proved rather than
   proved once:

     P0-TRUST-01   a fabricated meal under "Today's Meals" beside "No meals
                   logged today"
     P0-SCIENCE-01 "your Biotics score" and a promised Prebiotic / Probiotic /
                   Postbiotic breakdown in the first-use copy

   It REPLACES `audit-verify-mock-fallback.spec.ts`, which was a throwaway probe.

   ══ THE CLOCK IS FROZEN HERE, NEVER IN THE COMPONENT ════════════════════════

   `page.clock.install({ time })` before navigation, at `AUDIT_CLOCK`. Playwright
   is 1.61.1 so this is available.

   KNOWN CONSEQUENCE, HANDLED RATHER THAN HIDDEN: `LiveDashboard` is
   `"use client"` inside a `force-dynamic` page, so Next server-renders it on
   the REAL date while the browser runs the frozen one. The week strip at
   `live-dashboard.tsx:2125-2140` computes Monday-of-week, `isToday` and
   `isFuture` from the wall clock, so the two renders can disagree and React
   may log a hydration mismatch.

   Captures are taken after hydration settles. Console errors are RECORDED in
   the manifest, not suppressed — if the mismatch turns out to be visually
   disruptive rather than merely noisy, that is a finding to report, not a
   reason to touch the component.

   ══ STORAGE, AND WHY THIS SURFACE IS THE EXCEPTION ═════════════════════════

   The protocol in `audit-manifest.ts` puts each surface's FULL corpus in the
   gitignored `corpus/`, and commits only a representative set. This surface
   predates that: 75 images were committed at `496fa76` under the old
   convention, and they stay — rewriting history mid-audit would cost more than
   the bytes are worth.

   So account writes BOTH: the full corpus to `corpus/account/` like every other
   surface, and the images that were already committed stay where they are. The
   two states added afterwards contribute representatives only.
   ════════════════════════════════════════════════════════════════════════════ */

const SURFACE = "account"
const ROUTE = "/audit/account-dashboard"
const CORPUS = `${CORPUS_ROOT}/${SURFACE}`
const COMMITTED = `${COMMITTED_ROOT}/${SURFACE}`

/**
 * The states committed at `496fa76`, before the artifact protocol existed.
 * Their images are already in the repository and are left there.
 */
const PRE_PROTOCOL_STATES = new Set([
  "representative",
  "dense",
  "sparse",
  "first-use-member",
  "returning-no-meals-today",
])

/**
 * The citation set for the two states added after the protocol: one image per
 * finding they evidence, at the width that shows it most clearly. Not a sample
 * — the specific pictures the register points at.
 */
const REPRESENTATIVE = new Set([
  "account-member-with-biotics-overview-390.png",
  "account-member-with-biotics-overview-1280.png",
  "account-weekly-report-present-overview-390.png",
  "account-weekly-report-present-overview-1280.png",
  "account-twin-present-overview-390.png",
  "account-twin-present-overview-1280.png",
])
const WIDTHS = [
  ["390", 390, 844],
  ["834", 834, 1112],
  ["1280", 1280, 900],
] as const

/** What a complete corpus is, declared rather than inferred from the output. */
const EXPECTED_ROWS = AUDIT_FIXTURE_STATES.length * WIDTHS.length * AUDIT_FIXTURE_TABS.length

/**
 * Every same-origin API request the fixture page is KNOWN to make on mount,
 * as `METHOD /path`. Pinned by value and asserted by render, because source
 * reading already got this wrong once: the fixture was documented as making
 * "no network request at all", and the first capture run recorded a 401 per
 * page load.
 *
 *   GET /api/assessment/journey — `AssessmentJourneyCard`
 *     (`components/account/dashboard-parts.tsx:33`) calls `ensureHydrated()`
 *     from a mount effect. It takes NO prop, so unlike the twin-state PUT this
 *     cannot be disarmed by fixture data. Unauthenticated it returns 401, so
 *     nothing is read and nothing is written — but it IS a request, and saying
 *     otherwise was false.
 *
 * A new entry appearing here is a real change in what the audit page touches
 * and must be understood, not appended to make a test pass.
 */
const EXPECTED_API_CALLS = ["GET /api/assessment/journey"] as const

/** Freeze the clock, navigate, and wait for the client render to settle. */
async function openFixture(page: Page, state: string, apiCalls?: Set<string>): Promise<string[]> {
  const errors: string[] = []
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  if (apiCalls) {
    page.on("request", (r) => {
      const { pathname } = new URL(r.url())
      if (pathname.startsWith("/api/")) apiCalls.add(`${r.method()} ${pathname}`)
    })
  }

  // Before navigation, so page scripts see the frozen clock from the start.
  await page.clock.install({ time: new Date(AUDIT_CLOCK) })

  /*
   * ── THE COOKIE BANNER, AND WHY IT IS DISMISSED RATHER THAN PHOTOGRAPHED ──
   *
   * The first capture run put `components/cookie-consent.tsx` over the middle
   * of every screenshot — in the 1280 first-use shot it sat directly on top of
   * the `P0-SCIENCE-01` sentence, which is the thing the image exists to show.
   *
   * So consent is pre-seeded, which is what a returning member's browser
   * carries anyway. `"declined"` (essential only), NOT `"accepted"`: declining
   * dismisses the banner without enabling the analytics SDKs, which keeps the
   * audit page's network footprint the declared one.
   *
   * THIS HIDES SOMETHING REAL. The banner IS a first-visit overlay on the
   * member dashboard, and that is an audit observation in its own right — it is
   * recorded in the screenshot index, not disposed of by being cropped out.
   */
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("eb_cookie_consent", "declined")
    } catch {
      /* private mode — the banner simply renders, as it would for that visitor */
    }
  })

  await page.goto(`${ROUTE}?state=${state}`)

  // The audit banner is server-rendered and carries the state, so it proves the
  // right fixture arrived before anything else is asserted.
  const banner = page.locator('[data-audit-fixture="true"]')
  await expect(banner).toBeVisible()
  await expect(banner).toHaveAttribute("data-audit-state", state)

  // Hydration: the dashboard's tabs are client-rendered buttons.
  await expect(page.getByRole("button", { name: /overview/i }).first()).toBeVisible()
  await page.waitForLoadState("networkidle")

  return errors
}


/**
 * Settle every scroll-triggered reveal, then return to the top.
 *
 * ── WHY THIS EXISTS, AND HOW IT WAS FOUND ──────────────────────────────────
 *
 * With `animations: "disabled"` the corpus went from 82 unstable images out of
 * 105 to 21 — and ALL TWENTY-ONE WERE AT 390. That is not a coincidence: the
 * mobile page is far taller, so a `fullPage` capture races the
 * `IntersectionObserver` in `components/scroll-reveal.tsx`, which flips
 * `data-revealed` as sections enter the viewport. Whether a given section had
 * flipped by capture time varied run to run.
 *
 * Disabling animations cannot fix that, because the reveal is a JS state change
 * rather than a transition. Scrolling the whole page first does: every observer
 * fires, every section reaches its revealed state, and the capture is of a
 * settled page.
 *
 * It changes no component. It reproduces what a person who scrolled the page
 * would see, which is the honest subject of the screenshot anyway.
 *
 * ── AND THEN THE IMAGES, WHICH WAS THE REAL REMAINDER ──────────────────────
 *
 * Scroll-settling alone left 20 of 105 images unstable. Decoding two captures
 * of the same view to raw pixels located the difference exactly: a 34x34 box at
 * (34, 2011) — the meal thumbnail beside "Fixture meal 1". Same dimensions,
 * 0.038% of bytes, one element.
 *
 * It is not randomness. `live-dashboard.tsx:1661` resolves a null `image_url`
 * to a FIXED `/food-1.webp`. It is a decode race: scrolling the image into view
 * starts the fetch, and the screenshot could be taken before the bitmap was
 * painted. So every image is waited for, which is also what a reader of the
 * screenshot assumes happened.
 */
async function settleReveals(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(320, Math.floor(window.innerHeight * 0.8))
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    }
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 120))
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 120))
  })

  // Nothing left mid-reveal.
  await page
    .waitForFunction(() => document.querySelectorAll('[data-revealed="false"]').length === 0, undefined, {
      timeout: 4000,
    })
    .catch(() => {
      /* a surface with no ScrollReveal never had any; not a failure */
    })

  // And nothing left mid-decode. `complete` alone is not enough: a failed image
  // is also "complete", so naturalWidth is what distinguishes painted from gone.
  await page
    .waitForFunction(
      () =>
        Array.from(document.images).every((i) => i.complete && (i.naturalWidth > 0 || i.currentSrc === "")),
      undefined,
      { timeout: 6000 },
    )
    .catch(() => {
      /* an image that never resolves is a finding for the audit, not a crash */
    })
}

test.describe("Account corpus — the real LiveDashboard, fixture-rendered", () => {
  mkdirSync(CORPUS, { recursive: true })
  mkdirSync(COMMITTED, { recursive: true })

  for (const state of AUDIT_FIXTURE_STATES) {
    for (const [label, width, height] of WIDTHS) {
      test(`${state} @ ${label}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        const errors = await openFixture(page, state)

        for (const tab of AUDIT_FIXTURE_TABS) {
          const button = page.getByRole("button", { name: new RegExp(tab, "i") }).first()
          if ((await button.count()) === 0) continue
          await button.click()
          await page.waitForTimeout(350)

          await settleReveals(page)

          const file = `account-${state}-${tab}-${label}.png`

          /*
           * The full corpus always goes to `corpus/`. A file is additionally
           * COPIED into the committed tree when it was already committed under
           * the pre-protocol convention, or when it is one of the citations the
           * register points at — and the hash is taken from the corpus copy, so
           * both copies are provably the same bytes.
           */
          await page.screenshot({
            path: `${CORPUS}/${file}`,
            fullPage: true,
            /*
             * ── WHY ANIMATIONS ARE DISABLED, AND HOW WE KNOW TO ──────────────
             *
             * Two identical runs of this harness produced 82 of 105 images with
             * DIFFERENT SHA-256. The 23 that matched were every one a view with
             * no content to animate — `sparse` and `first-use-member` on the
             * empty tabs — and not a single `overview` matched.
             *
             * The cause is CSS transitions on the score ring and the Biotics
             * rings. `page.clock.install` does not stop them: it fakes timers
             * and rAF, while a CSS transition runs on the compositor.
             *
             * `animations: "disabled"` finishes them and holds them at their end
             * state, which is both deterministic AND the state a reader is meant
             * to see. The component is not touched.
             */
            animations: "disabled",
          })

          const committed = PRE_PROTOCOL_STATES.has(state) || REPRESENTATIVE.has(file)
          if (committed) copyFileSync(`${CORPUS}/${file}`, `${COMMITTED}/${file}`)

          writeShard({
            file,
            surface: SURFACE,
            route: ROUTE,
            state,
            section: tab,
            viewport: `${width}x${height}`,
            frozenClock: AUDIT_CLOCK,
            evidenceKind: "fixture-rendered real component",
            component: "components/account/live-dashboard.tsx",
            findings: AUDIT_STATE_FINDINGS[state],
            consoleErrors: errors.length,
            consoleErrorTexts: errors.map((e) => e.replace(/\s+/g, " ").slice(0, 160)),
            sha256: sha256Of(`${CORPUS}/${file}`),
            storage: committed ? "committed" : "archive-only",
          })
        }
      })
    }
  }
})

/* ── What the audit page actually touches, proved by render ───────────────── */

test.describe("the fixture's network footprint", () => {
  test("is exactly the declared set, and contains no write", async ({ page }) => {
    const apiCalls = new Set<string>()

    // Every state, because the footprint is a property of the page and its
    // fixture data together — one state could carry data that wakes a request
    // the others do not.
    for (const state of AUDIT_FIXTURE_STATES) {
      await openFixture(page, state, apiCalls)
      for (const tab of AUDIT_FIXTURE_TABS) {
        const button = page.getByRole("button", { name: new RegExp(tab, "i") }).first()
        if ((await button.count()) === 0) continue
        await button.click()
        await page.waitForTimeout(200)
      }
    }

    expect(
      [...apiCalls].sort(),
      "the audit page's API footprint changed — understand the new call before widening EXPECTED_API_CALLS",
    ).toEqual([...EXPECTED_API_CALLS].sort())

    // The twin-state PUT is the one the fixture data disarms. Proved here by
    // render rather than only by the prop assertion in the unit suite.
    for (const call of apiCalls) {
      expect(call, `the audit page issued a write: ${call}`).toMatch(/^GET /)
    }
    expect([...apiCalls].join(" ")).not.toContain("/api/twin-state")
  })

  /*
   * ── THE TWIN-PRESENT STATE, PROVED BY RENDER ────────────────────────────
   *
   * `twin-present` is the one state that supplies a real twin, so it is the one
   * state where the twin-state PUT could conceivably fire. Source says it
   * cannot — `live-dashboard.tsx:857` is `if (propEmail) pushTwinState(store)`
   * and every state has `email: null`.
   *
   * That is NOT good enough here. `NOTE-FIXTURE-01` has been wrong about this
   * exact effect twice: once asserting the dashboard had no mount side effects
   * at all, and once describing the push guard as a conjunction of email AND
   * unseen milestones when it is the email alone. A third source reading is not
   * evidence.
   *
   * So the footprint is measured with a twin actually on screen.
   */
  test("twin-present issues no write, measured with a twin on screen", async ({ page }) => {
    const apiCalls = new Set<string>()
    const writes: string[] = []
    page.on("request", (r) => {
      const { pathname } = new URL(r.url())
      if (!pathname.startsWith("/api/")) return
      apiCalls.add(`${r.method()} ${pathname}`)
      if (r.method() !== "GET") writes.push(`${r.method()} ${pathname}`)
    })

    await openFixture(page, "twin-present")
    for (const tab of AUDIT_FIXTURE_TABS) {
      const button = page.getByRole("button", { name: new RegExp(tab, "i") }).first()
      if ((await button.count()) === 0) continue
      await button.click()
      await page.waitForTimeout(250)
    }
    // The push is fire-and-forget with `keepalive`, so give it room to appear.
    await page.waitForTimeout(1500)

    expect(writes, "the audit page performed a WRITE while rendering a twin").toEqual([])
    expect(
      [...apiCalls].join(" "),
      "PUT /api/twin-state fired — the fixture is no longer read-only",
    ).not.toContain("/api/twin-state")
    expect([...apiCalls].sort()).toEqual([...EXPECTED_API_CALLS].sort())
  })
})

/* ── The findings, kept continuously proved ───────────────────────────────── */

test.describe("the recorded findings still reproduce", () => {
  /*
   * ── 0R-4 · P0-TRUST-01 and P0-TRUST-02, ASSERTED AS REPAIRED ─────────────
   *
   * This test previously asserted the DEFECT reproduced — that
   * "Mackerel, kimchi & asparagus", a fabricated meal, rendered under
   * "Today's Meals" directly above "No meals logged today". 0R-4 removed it,
   * so the assertion is inverted: the fabrication must be gone and the
   * truthful empty state must remain.
   *
   * COVERED PER MANIFESTATION, deliberately. The audit caught one of four
   * MOCK_MEALS sites; a single assertion on the meal name would let somebody
   * remove one manifestation, leave another, and close the finding falsely.
   */
  test("P0-TRUST-01 · no fabricated meal, average or history renders", async ({ page }) => {
    // ── manifestation 1 · Today's Meals, Overview ──────────────────────────
    await openFixture(page, "returning-no-meals-today")
    let body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase().toLowerCase()

    // Non-vacuity: this state must reach the block at all.
    expect(body, "Today's Meals did not render — the assertion would be vacuous").toContain(
      "today's meals",
    )
    expect(
      body,
      "the fabricated meal is back under Today's Meals — P0-TRUST-01 has regressed",
    ).not.toContain("mackerel, kimchi & asparagus")

    // The truthful empty state is still there. This is a removal, not a deletion
    // of the surface.
    expect(body).toContain("no meals logged today")

    // ── manifestation 2 · the tautological "today's average" ───────────────
    expect(
      body,
      "Today's average rendered with no meals logged. Its gate was " +
        "`(todayMeals.length > 0 || true)` and its value came from MOCK_MEALS.",
    ).not.toContain("today's average")

    // ── manifestations 3 and 4 · My Meals history, count and average ───────
    for (const state of ["first-use-member", "sparse"] as const) {
      await openFixture(page, state)
      await page.getByRole("button", { name: /My Meals/i }).click()
      body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase()

      expect(body, `My Meals did not render for ${state}`).toContain("my meals")
      for (const fabricated of [
        "mackerel, kimchi & asparagus",
        "eggs, sourdough & avocado",
        "salmon salad with kimchi",
      ]) {
        expect(
          body,
          `${state} · My Meals shows the fabricated seven-day history: ${fabricated}`,
        ).not.toContain(fabricated)
      }
      expect(body, `${state} · the fabricated meal count is back`).not.toMatch(/7 meals logged/)
      expect(body, `${state} · the fabricated average is back`).not.toMatch(/average score:\s*73/)
      expect(body, `${state} · no truthful empty state`).toContain("no meals logged yet")
    }
  })

  /*
   * ── 0R-4 · P0-TRUST-02, site 3 — the Consultations tab ───────────────────
   *
   * A member with zero weekly reports was shown three fabricated consultations
   * with quotations attributed to their own reports. Not in the Experience 0
   * register; found by tracing every mock constant to every consumer.
   */
  test("P0-TRUST-02 · no fabricated consultation, quote or per-Biotic bar renders", async ({ page }) => {
    await openFixture(page, "first-use-member")
    await page.getByRole("button", { name: /Consultations/i }).click()
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase().toLowerCase()

    expect(body, "the Consultations tab did not render").toMatch(/consultation/)

    for (const [why, fabricated] of [
      ["a fabricated week label", "week 8 of 30"],
      ["a fabricated attributed quotation", "plant diversity was your strongest area"],
      ["a second fabricated quotation", "your prebiotic score held steady"],
      ["a fabricated week summary", "your best week for plant diversity"],
      ["the fused per-Biotic bars", "biotics this week"],
    ] as const) {
      expect(body, `${why} is back on the Consultations tab`).not.toContain(fabricated)
    }

    expect(body, "no truthful empty state for zero reports").toContain("no consultations yet")
  })

  /*
   * ── 0R-4 · P0-TRUST-02, site 2 — the attributed quotation on Overview ────
   */
  test("P0-TRUST-02 · the attributed frame needs a real report", async ({ page }) => {
    await openFixture(page, "returning-no-meals-today")
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase().toLowerCase()

    expect(
      body,
      "the fabricated pull quote is back under 'From your latest report' — a " +
        "quantified predicted outcome attributed to a report that does not exist",
    ).not.toMatch(/8[–-]12 points within three weeks|biggest lever right now/)
    expect(body, "the attributed frame renders with no real report").not.toMatch(
      /from your latest report/,
    )
  })

  /*
   * ── 0R-4 · P0-TRUST-03 and the absorbed P0-SCIENCE-03 at :1757 ───────────
   */
  test("P0-TRUST-03 · no false personal conclusion renders", async ({ page }) => {
    for (const state of ["returning-no-meals-today", "member-with-biotics"] as const) {
      await openFixture(page, state)
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase().toLowerCase()
      expect(
        body,
        `${state} · the 'lowest pillar' sentence is back. It was FALSE for any ` +
          `member whose lowest value is not Probiotic, under a heading claiming ` +
          `it came from their own data.`,
      ).not.toMatch(/lowest pillar/)
      expect(body, `${state} · the Your Focus Today block is back`).not.toContain(
        "your focus today",
      )
      // And the absorbed P0-SCIENCE-02: no personal per-Biotic profile.
      expect(body, `${state} · Your Biotics Profile is back`).not.toContain(
        "your biotics profile",
      )
    }
  })

  /*
   * ══ 0R-5 · THE SCIENCE FINDINGS, RENDERED ═════════════════════════════════
   *
   * Every one of these operated on REAL member data, which is why 0R-4 could
   * not close them and why source proof alone is insufficient here: the
   * prohibited thing is the construct, not the provenance of the numbers in it.
   *
   * Truthful inputs can still produce an untruthful product claim.
   */
  test("P0-SCIENCE-01 · no live surface renders a personal per-Biotic bar", async ({ page }) => {
    /*
     * SEVEN live sites, three of which the Experience 0 register named. Covered
     * per manifestation for the same reason `P0-TRUST-01` is: a single
     * assertion would let somebody remove one and close the finding falsely.
     */
    for (const state of ["returning-no-meals-today", "member-with-biotics", "twin-present"] as const) {
      await openFixture(page, state)
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase()

      /*
       * Non-vacuity: the dashboard must have rendered at all. Matched on the
       * score block rather than a tab name, which is the one thing every one of
       * these states shows.
       */
      expect(body, `${state} · the dashboard did not render`).toMatch(/food system|biotics score|your score/)

      for (const [why, pattern] of [
        ["a Prebiotic bar or row label", /\bprebiotics?\b\s*\d/],
        ["a Probiotic bar or row label", /\bprobiotics?\b\s*\d/],
        ["a Postbiotic bar or row label", /\bpostbiotics?\b\s*\d/],
      ] as const) {
        expect(
          body.match(pattern)?.[0] ?? null,
          `${state} · ${why} renders. The values are REAL — that is what makes ` +
            `this a science finding. A personal Prebiotic / Probiotic / ` +
            `Postbiotic figure is prohibited whatever its provenance.`,
        ).toBeNull()
      }

      // The first-use promise, at both of its sites.
      expect(body, `${state} · the per-Biotic promise is back`).not.toContain(
        "prebiotic, probiotic, and postbiotic value",
      )
      expect(body, `${state} · the possessive Biotics-score promise is back`).not.toContain(
        "your biotics score is built",
      )
      expect(body, `${state} · step 2 still promises a per-Biotic breakdown`).not.toContain(
        "biotics score breakdown",
      )

      // The member's own overall score is untouched — this removed a claim, not
      // a result.
      expect(body, `${state} · the overall score disappeared too`).toMatch(/\/100|\d{2}\s*\/\s*100|food system score/)
    }
  })

  test("P0-SCIENCE-01 · the weakest-Biotic focus nudge is gone from the daily loop", async ({ page }) => {
    /*
     * The fifth site, in no register entry. `DailyLoopCard` rendered
     * "Today's focus · Probiotics (23/100)" with a Biotic-coloured dot — the
     * weakest Biotic named, scored and coloured. `PillarKey` is
     * `"prebiotics" | "probiotics" | "postbiotics"`, so this printed a Biotic
     * and not an observable domain.
     */
    for (const state of ["first-use-member", "sparse"] as const) {
      await openFixture(page, state)
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase()
      expect(body, `${state} · the Biotic focus nudge is back`).not.toMatch(
        /today'?s focus\s*·\s*(?:pre|pro|post)biotics/,
      )
      expect(body, `${state} · a per-Biotic score out of 100 is back`).not.toMatch(
        /(?:pre|pro|post)biotics\s*\(\d+\/100\)/,
      )
    }
  })

  test("P0-SCIENCE-03 · the Monthly Focus mechanism is gone", async ({ page }) => {
    for (const state of ["returning-no-meals-today", "member-with-biotics"] as const) {
      await openFixture(page, state)
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase()
      for (const [why, fragment] of [
        ["the causal mechanism between two Biotics", "pulling down your biotics"],
        ["the undeived monthly heading", "this month's focus"],
        ["the asserted personal gap", "fix your fermented food gap"],
        ["the 30-day outcome promise", "30 days changes this"],
      ] as const) {
        expect(body, `${state} · ${why} is back`).not.toContain(fragment)
      }
    }
  })

  test("P0-SCIENCE-04 · the stage aura is not a Biotic verdict", async ({ page }) => {
    /*
     * ══ WHY THIS ASSERTION DISCRIMINATES ══════════════════════════════════
     *
     * The aura was `auraGradientForBiotic(twin.biotics.weakest, …)`. Every
     * captured fixture has biotics `58/44/63`, so the weakest was PROBIOTICS,
     * and the probiotics branch's inner colour is `rgba(45,170,110, …)` — the
     * brand green. The resting aura is the lime base, `rgba(168,224,99, …)`.
     *
     * So the two states produce DIFFERENT colours, and asserting lime is a
     * direct refutation of the old behaviour rather than a tautology. The
     * invariance across a VARIED weakest Biotic is proved in
     * `tests/unit/account-twin.test.ts`, because the fixture corpus cannot
     * vary it — which is itself the fixture-design defect the register records.
     */
    await openFixture(page, "twin-present")

    const aura = page.locator("#fs-stage .eb-aura").first()
    await expect(aura, "the stage aura did not render — the assertion would be vacuous").toBeAttached()
    const background = await aura.evaluate((el) => getComputedStyle(el).backgroundImage)

    expect(
      background,
      "the stage aura did not render a radial gradient at all",
    ).toMatch(/radial-gradient/)
    /*
     * ── IT IS THE INNER STOP THAT DISCRIMINATES, NOT ANY COLOUR PRESENT ────
     *
     * First written as "contains neither the probiotics green nor the
     * postbiotics yellow", which FAILED against the correct output:
     *
     *   radial-gradient(circle, rgba(168,224,99,0.384) 0%,
     *                           rgba(245,197,24,0.192) 44%, …)
     *
     * `rgba(245,197,24)` is the yellow MID of the lime tone and always has
     * been — the lime and green tones share it, and only the amber tone uses
     * it as its inner. So "contains yellow" says nothing. The assertion is on
     * the FIRST COLOUR STOP, which is the one each tone owns:
     *
     *   lime   rgba(168,224,99)      green  rgba(45,170,110)
     *   amber  rgba(245,197,24) inner, with rgba(245,166,35) as its mid
     *
     * Corrected rather than relaxed: the mistake was mine, and the inner-stop
     * form is strictly stronger than what it replaced.
     */
    const innerStop = background.match(/radial-gradient\(circle,\s*(rgba?\([^)]*\))/)?.[1] ?? ""
    expect(innerStop, "could not read the aura's first colour stop").toMatch(/^rgba?\(/)
    expect(
      innerStop,
      "the aura's inner stop is the PROBIOTICS colour — which is the weakest " +
        "Biotic in every captured fixture. P0-SCIENCE-04 has regressed: the " +
        "colour of the glow around the member's body is a comparative personal " +
        "Biotic verdict carrying no text at all.",
    ).not.toContain("45, 170, 110")
    expect(
      innerStop,
      "the aura's inner stop is the POSTBIOTICS colour",
    ).not.toContain("245, 197, 24")
    expect(
      background,
      "the aura carries the amber tone's mid stop, which only postbiotics used",
    ).not.toContain("rgba(245, 166, 35")
    expect(
      innerStop,
      "the resting aura is not the brand lime base",
    ).toContain("168, 224, 99")
  })

  test("P0-SCIENCE-05 · a ritual tick claims no bodily response", async ({ page }) => {
    await openFixture(page, "twin-present")

    const tick = page.getByRole("button", { name: /Fermented food/i }).first()
    await expect(tick, "the ritual check-in did not render").toBeVisible()
    await tick.click()

    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase()

    // Non-vacuity: the tick registered and the Twin acknowledged it.
    expect(body, "ticking the check produced no acknowledgement at all").toContain("logged for today")

    for (const [why, fragment] of [
      ["the asserted bodily response", "your body just felt that"],
      ["the Biotic mechanism", "lights up your probiotic network"],
      ["the heading's bodily claim", "your body reacts to each one"],
      ["the completed-day bodily claim", "felt all of it"],
    ] as const) {
      expect(body, `${why} is back on the daily ritual`).not.toContain(fragment)
    }

    /*
     * ── AND THE ANATOMY ITSELF ─────────────────────────────────────────────
     *
     * MALFORMED ON ITS FIRST RUN, AND CORRECTED RATHER THAN DELETED. It read
     *
     *   page.locator('[style*="left: 54%"], … , [style*="left: 50%"]').count()
     *
     * and failed, because `left: 50%` is ordinary translate-centering used all
     * over the page. A whole-page selector for a percentage cannot distinguish
     * a body coordinate from a centred element.
     *
     * What the defect actually was: a FIGURE of the member's body inside the
     * acknowledgement, with an aura and a ping placed on it. So the assertion
     * is scoped to the acknowledgement and asks whether a figure is drawn
     * there at all — which is the thing that cannot be true without anatomy.
     */
    const ack = page.locator("div", { hasText: /Logged for today/ }).last()
    await expect(ack, "the acknowledgement did not render").toBeVisible()
    expect(
      await ack.locator("img").count(),
      "the acknowledgement draws a figure of the member's body again. The " +
        "reaction panel placed an aura and a ping at a RITUAL_CHECKS " +
        "coordinate on it — the gut for a fermented food, the head for sleep.",
    ).toBe(0)
    expect(
      await ack.locator(".eb-aura, .eb-ping").count(),
      "a positioned pulse is back inside the ritual acknowledgement",
    ).toBe(0)

    // The ritual still works as a record: the streak and the rhythm bar remain.
    expect(body, "the daily ritual lost its 7-day rhythm bar").toContain("last 7 days")
  })

  test("the Account and Twin surfaces remain functional after 0R-5", async ({ page }) => {
    /*
     * The removal half of the close criterion is above. This is the other half:
     * a member may still see their observable facts, their actions and their
     * truthful history.
     */
    await openFixture(page, "twin-present")
    for (const tab of ["Overview", "My Meals", "Reports", "Consultations", "Account"] as const) {
      await page.getByRole("button", { name: new RegExp(tab, "i") }).first().click()
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")
      expect(body.length, `the ${tab} tab rendered nothing`).toBeGreaterThan(200)
    }
  })

  /*
   * ── 0R-3 · P0-TRUST-05, ASSERTED AS REPAIRED ─────────────────────────────
   *
   * This is the one half of P0-TRUST-05 that was ever customer-reachable: the
   * suggestion chip rendered on the LIVE `/account` dashboard, offering, in the
   * member's own voice, "Why is my <biotic> level my weakest, and what foods
   * would help this week?" — a personal per-Biotic verdict the product is not
   * entitled to make.
   *
   * The auto-send that made it a model premise was never live: `/account/consult`
   * is POST_V1-refused and 404s in every environment. That is verified
   * separately, and the latent architecture is covered by unit guards rather
   * than by manufacturing reachability for a refused route.
   *
   * Rendered rather than source-asserted because the claim is INTERPOLATED —
   * no Biotic word exists in `ask-twin.tsx` for a scan to find.
   */
  test("P0-TRUST-05 · no suggestion offers a personal Biotic verdict", async ({ page }) => {
    await openFixture(page, "twin-present")

    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    /*
     * Non-vacuity: the section must actually be on screen, or this proves
     * nothing. Matched case-insensitively because the overline is rendered
     * through `text-transform: uppercase`, so `innerText` returns
     * "ASK YOUR FOOD SYSTEM" rather than the source's mixed case — a detail
     * only a render shows, and the reason this assertion failed once before
     * it passed.
     */
    expect(
      body.toLowerCase(),
      "the Ask-your-Food-System section did not render — the assertion would be vacuous",
    ).toContain("ask your food system")

    // The retired premise, in every form it could take.
    for (const b of ["prebiotic", "probiotic", "postbiotic"]) {
      expect(
        body.toLowerCase(),
        `a suggestion names the member's ${b} — P0-TRUST-05 has regressed`,
      ).not.toContain(`my ${b} level`)
    }
    expect(body.toLowerCase()).not.toContain("my weakest")

    // The two clean chips survive, so this records a removal and not a deletion
    // of the whole surface.
    const chips = page.locator('a[href*="/account/consult?q="]')
    expect(await chips.count(), "the clean suggestion chips are gone too").toBeGreaterThan(0)

    // And no surviving chip carries a Biotic word in its query parameter.
    for (const href of await chips.evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""))) {
      expect(
        decodeURIComponent(href).toLowerCase(),
        `a suggestion URL still carries a Biotic premise: ${href}`,
      ).not.toMatch(/prebiotic|probiotic|postbiotic|weakest|strongest/)
    }
  })

  /*
   * ── 0R-5 · INVERTED, AS THE 0R-4 PROOFS WERE ─────────────────────────────
   *
   * Written in Experience 0 to assert that the DEFECT reproduced — that the
   * first-use block said "YOUR Biotics score is built one meal at a time" and
   * promised "an instant breakdown of its Prebiotic, Probiotic, and Postbiotic
   * value". 0R-5 repaired both, so this test failed, which is the right
   * outcome and the same handling `P0-TRUST-01`'s proof got at 0R-4.
   *
   * It keeps a NON-VACUITY half: the block must still render and still promise
   * the member something, or a repair that simply deleted the welcome copy
   * would read as a pass.
   */
  test("P0-SCIENCE-01 · the first-use copy promises only what the product delivers", async ({ page }) => {
    await openFixture(page, "first-use-member")

    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    // Non-vacuity: the first-use block is on screen and still welcomes them.
    expect(body, "the first-use block did not render at all").toMatch(/Let's build your food system/i)

    // The possessive construct: a MEAL-level score called the person's own.
    expect(
      body,
      "'your Biotics score' is back. CLAUDE.md's rule is that one meal gets a " +
        "Meal Biotics Score, never the person's Biotics Score™.",
    ).not.toMatch(/Your Biotics score/i)
    // And the promise of the three values, which Gate 5 excludes from surfaces.
    expect(body, "the per-Biotic breakdown is promised again").not.toMatch(
      /Prebiotic, Probiotic, and Postbiotic value/i,
    )
    // The replacement names only what the product can observe.
    expect(body, "the honest promise is missing").toMatch(/Meal Biotics Score/i)
  })

  /*
   * ── 0R-3 · THE LATENT HALF, LABELLED AS LATENT ───────────────────────────
   *
   * `P0-TRUST-05`'s model premise was never customer-reachable, and this is
   * what makes that a measured fact rather than a reading of the classifier.
   *
   * The consultation architecture — the `?q=` handling, the mount behaviour,
   * the message construction, the model request — is remediated and guarded by
   * `tests/unit/ai-authorship.test.ts` at source level, DELIBERATELY. No
   * fixture route is created for these pages and no reachability is
   * manufactured in order to exercise the old architecture: a test that had to
   * bypass the POST_V1 refusal to run would be asserting something about a
   * product state no customer can reach.
   *
   * If this test ever fails, the consultation surface has become reachable and
   * `P0-TRUST-05`'s latent half becomes live — at which point the rendered
   * proof it then deserves is owed before the route ships.
   */
  test("P0-TRUST-05 · the consultation surface is still refused — LATENT / POST_V1", async ({ request }) => {
    for (const route of ["/account/consult", "/account/consult/deep-dive"]) {
      const res = await request.get(route, { maxRedirects: 0 })
      expect(
        res.status(),
        `${route} is no longer refused — P0-TRUST-05's latent half is now LIVE`,
      ).toBe(404)
    }
  })

  /*
   * DEBT-CODE-01, asserted as UNREACHABLE. If this ever fails, the
   * "Your Last Analysis" fallback has become reachable and the register's
   * classification must move from code debt to a customer-facing P0.
   */
  test("DEBT-CODE-01 · the 'Your Last Analysis' fallback stays unreachable", async ({ page }) => {
    await openFixture(page, "first-use-member")
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    expect(
      body.includes("Your Last Analysis"),
      "the Your Last Analysis block rendered with zero analyses — DEBT-CODE-01 is now a P0",
    ).toBe(false)
  })
})

test.afterAll(() => {
  /*
   * Runs once PER WORKER. Each pass re-reads every shard on disk, so the last
   * worker to finish writes the complete index — and any earlier, partial write
   * says so in its own completeness line rather than looking finished.
   */
  const manifest = readShards([SURFACE])
  if (manifest.length === 0) return
  mkdirSync(AUDIT_ROOT, { recursive: true })

  // The machine-readable artifact. `tests/unit/audit-manifest.test.ts` is what
  // holds it to `expected = actual = hashed`.
  mergeIntoManifest([SURFACE], manifest)

  const complete = manifest.length === EXPECTED_ROWS
  const completeness = complete
    ? `**Complete: ${manifest.length} of ${EXPECTED_ROWS} rows** — ${AUDIT_FIXTURE_STATES.length} states × ${WIDTHS.length} widths × ${AUDIT_FIXTURE_TABS.length} tabs.`
    : `**INCOMPLETE: ${manifest.length} of ${EXPECTED_ROWS} rows.** This index was written before every capture finished, or a capture failed. Re-run \`tests/e2e/audit-capture.spec.ts\` before citing it as evidence.`

  // Distinct console-error messages across the whole corpus, with how many
  // captures saw each. This is the evidence for the hydration question, and it
  // is reported rather than suppressed.
  const errorCounts = new Map<string, number>()
  for (const r of manifest as ManifestRow[]) {
    for (const text of r.consoleErrorTexts ?? []) {
      errorCounts.set(text, (errorCounts.get(text) ?? 0) + 1)
    }
  }
  const errorSection =
    errorCounts.size === 0
      ? "No console errors were recorded during capture."
      : [...errorCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([text, n]) => `| ${n} | \`${text.replace(/\|/g, "\\|")}\` |`)
          .join("\n")

  const rows = manifest
    .map(
      (r) =>
        `| \`${r.file}\` | \`${r.route}\` | ${r.state} | ${r.section} | ${r.viewport} | ${r.frozenClock} | ${r.evidenceKind} | \`${r.component}\` | ${r.findings.join(", ") || "—"} | ${r.consoleErrors} | ${r.storage} | \`${r.sha256.slice(0, 12)}…\` |`,
    )
    .join("\n")

  writeFileSync(
    "docs/experience/audit/SCREENSHOT_INDEX.md",
    `# Experience 0 — Screenshot Index

Generated by \`tests/e2e/audit-capture.spec.ts\`. Every image records the state,
clock and evidence kind that produced it, so a reader never has to infer whether
they are looking at live UI, a fixture-rendered real component, or a route that
intentionally refuses.

**Frozen audit clock: \`${AUDIT_CLOCK}\`** — installed in the browser before
navigation. \`LiveDashboard\` is unmodified.

${completeness}

> The fixture proves what exists. It does not legitimise it.

| file | route | state | tab | viewport | frozen clock | evidence kind | component | findings | console errors | storage | sha256 |
|---|---|---|---|---|---|---|---|---|---|---|---|
${rows}

## Console errors observed during capture

Recorded, not suppressed. The frozen clock is installed in the browser while
Next server-renders \`LiveDashboard\` on the real date, so a hydration mismatch
is the expected cost of a comparable corpus — and the text below is the evidence
for whether it is merely noisy or something worse.

| captures | message (truncated to 160 chars) |
|---|---|
${errorSection}

## What these captures deliberately do not show

| | |
|---|---|
| the cookie-consent banner | Pre-dismissed (\`eb_cookie_consent = "declined"\`, essential-only) before navigation. It otherwise covers the centre of every screenshot, including the \`P0-SCIENCE-01\` sentence at 1280. **It is a real first-visit overlay on the member dashboard** and belongs in the responsive/IA findings — it is excluded from the corpus, not from the audit. |

## Surfaces with no visual evidence, by design

| route | classification | why |
|---|---|---|
| \`/report\`, \`/report-you\`, \`/report-mind\`, \`/report-family\` | \`POST_V1_ROUTES\` | the launch surface refuses them; audited at source |
| \`/reports\` | \`LEGACY_REDIRECT_ROUTES\` | redirects to \`/pricing\` |
| \`/digital-twin\` | \`POST_V1_ROUTES\` | refused; audited at source |

No refusal was removed and no screenshot manufactured for these.
`,
    "utf8",
  )
})
