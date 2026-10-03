import { test, expect, type Page } from "@playwright/test"
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"

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

   ══ WHY ROWS GO TO DISK ONE AT A TIME ══════════════════════════════════════

   `fullyParallel: true`, so the tests in this file are distributed across
   workers and EACH WORKER LOADS ITS OWN COPY OF THIS MODULE. A module-level
   array therefore collects one worker's rows, and a per-worker `afterAll` that
   wrote the index overwrote it with that subset — which is how the first run
   produced a 45-row index beside 75 images and still read as complete.

   So every capture writes its own shard, and the merge reads whatever is on
   disk and STATES its own completeness. A partial index now says it is partial
   instead of looking finished.
   ════════════════════════════════════════════════════════════════════════════ */

const ROUTE = "/audit/account-dashboard"
const OUT = "docs/experience/audit/screenshots/account"
const SHARDS = "docs/experience/audit/.manifest-shards"
const WIDTHS = [
  ["390", 390, 844],
  ["834", 834, 1112],
  ["1280", 1280, 900],
] as const

/** What a complete corpus is, declared rather than inferred from the output. */
const EXPECTED_ROWS = AUDIT_FIXTURE_STATES.length * WIDTHS.length * AUDIT_FIXTURE_TABS.length

interface ManifestRow {
  file: string
  route: string
  state: string
  tab: string
  viewport: string
  frozenClock: string
  evidenceKind: string
  component: string
  findings: readonly string[]
  consoleErrors: number
  /**
   * The actual messages, truncated. A COUNT alone cannot answer the question
   * the plan asked — whether the frozen-clock hydration mismatch is merely
   * noisy or visually disruptive — so the text is recorded and listed below
   * the table rather than reduced to a number nobody can interpret.
   */
  consoleErrorTexts: readonly string[]
}

function writeShard(row: ManifestRow): void {
  mkdirSync(SHARDS, { recursive: true })
  writeFileSync(`${SHARDS}/${row.file}.json`, JSON.stringify(row), "utf8")
}

/**
 * Every row this corpus is supposed to contain, as a filename set. The merge
 * keeps only these, so a shard from a run with a different state list cannot
 * leak in and nothing has to be deleted while other workers are still writing.
 */
function expectedShardNames(): ReadonlySet<string> {
  const names = new Set<string>()
  for (const state of AUDIT_FIXTURE_STATES) {
    for (const [label] of WIDTHS) {
      for (const tab of AUDIT_FIXTURE_TABS) {
        names.add(`account-${state}-${tab}-${label}.png.json`)
      }
    }
  }
  return names
}

function readShards(): ManifestRow[] {
  const wanted = expectedShardNames()
  let names: string[]
  try {
    names = readdirSync(SHARDS).filter((n) => wanted.has(n))
  } catch {
    return []
  }
  return names
    .map((n) => JSON.parse(readFileSync(`${SHARDS}/${n}`, "utf8")) as ManifestRow)
    .sort(
      (a, b) =>
        AUDIT_FIXTURE_STATES.indexOf(a.state as (typeof AUDIT_FIXTURE_STATES)[number]) -
          AUDIT_FIXTURE_STATES.indexOf(b.state as (typeof AUDIT_FIXTURE_STATES)[number]) ||
        a.viewport.localeCompare(b.viewport) ||
        AUDIT_FIXTURE_TABS.indexOf(a.tab as (typeof AUDIT_FIXTURE_TABS)[number]) -
          AUDIT_FIXTURE_TABS.indexOf(b.tab as (typeof AUDIT_FIXTURE_TABS)[number]),
    )
}

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

test.describe("Account corpus — the real LiveDashboard, fixture-rendered", () => {
  mkdirSync(OUT, { recursive: true })

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

          const file = `account-${state}-${tab}-${label}.png`
          await page.screenshot({ path: `${OUT}/${file}`, fullPage: true })

          writeShard({
            file,
            route: ROUTE,
            state,
            tab,
            viewport: `${width}x${height}`,
            frozenClock: AUDIT_CLOCK,
            evidenceKind: "fixture-rendered real component",
            component: "components/account/live-dashboard.tsx",
            findings: AUDIT_STATE_FINDINGS[state],
            consoleErrors: errors.length,
            consoleErrorTexts: errors.map((e) => e.replace(/\s+/g, " ").slice(0, 160)),
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
})

/* ── The findings, kept continuously proved ───────────────────────────────── */

test.describe("the recorded findings still reproduce", () => {
  test("P0-TRUST-01 · a fabricated meal sits beside 'No meals logged today'", async ({ page }) => {
    await openFixture(page, "returning-no-meals-today")

    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    // The fabricated meal is MOCK_MEALS[0].meals[0] from the production file.
    expect(body, "the fabricated meal no longer renders — has the defect been repaired?").toContain(
      "Mackerel, kimchi & asparagus",
    )
    expect(body).toContain("No meals logged today")

    // The contradiction is the finding: both on one screen, mock above empty.
    const mockAt = body.indexOf("Mackerel, kimchi & asparagus")
    const emptyAt = body.indexOf("No meals logged today")
    expect(mockAt).toBeGreaterThan(-1)
    expect(emptyAt).toBeGreaterThan(mockAt)

    // And no fixture meal is dated today, which is what makes it fire.
    expect(body).not.toContain(AUDIT_DATE)
  })

  test("P0-SCIENCE-01 · first-use copy promises a per-Biotic breakdown", async ({ page }) => {
    await openFixture(page, "first-use-member")

    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ")

    // A meal-level construct called the person's own score.
    expect(body, "the 'your Biotics score' phrasing changed — re-check P0-SCIENCE-01").toMatch(
      /Your Biotics score/i,
    )
    // And the promise of the three values, which Gate 5 excludes from surfaces.
    expect(body).toMatch(/Prebiotic, Probiotic, and Postbiotic value/i)
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
  const manifest = readShards()
  if (manifest.length === 0) return
  mkdirSync("docs/experience/audit", { recursive: true })

  const complete = manifest.length === EXPECTED_ROWS
  const completeness = complete
    ? `**Complete: ${manifest.length} of ${EXPECTED_ROWS} rows** — ${AUDIT_FIXTURE_STATES.length} states × ${WIDTHS.length} widths × ${AUDIT_FIXTURE_TABS.length} tabs.`
    : `**INCOMPLETE: ${manifest.length} of ${EXPECTED_ROWS} rows.** This index was written before every capture finished, or a capture failed. Re-run \`tests/e2e/audit-capture.spec.ts\` before citing it as evidence.`

  // Distinct console-error messages across the whole corpus, with how many
  // captures saw each. This is the evidence for the hydration question, and it
  // is reported rather than suppressed.
  const errorCounts = new Map<string, number>()
  for (const r of manifest) {
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
        `| \`${r.file}\` | \`${r.route}\` | ${r.state} | ${r.tab} | ${r.viewport} | ${r.frozenClock} | ${r.evidenceKind} | \`${r.component}\` | ${r.findings.join(", ") || "—"} | ${r.consoleErrors} |`,
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

| file | route | state | tab | viewport | frozen clock | evidence kind | component | findings | console errors |
|---|---|---|---|---|---|---|---|---|---|
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
