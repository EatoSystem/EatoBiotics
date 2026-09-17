import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

/**
 * Accessibility smoke suite — axe-core over ~20 representative pages, one per
 * major pattern cluster (236 pages will never get manual review; each cluster
 * shares one template, so one page covers its siblings).
 *
 * Gate: every CRITICAL violation fails, and every SERIOUS one except
 * colour-contrast. Serious used to be entirely report-only, which meant a new
 * missing form label or broken landmark could land unnoticed; those now fail.
 * Colour-contrast stays reported rather than gated for two reasons, both in the
 * coverage note below: it has a real backlog, and it is the one rule whose
 * result depends on how much of the page happens to have revealed by scan time.
 *
 * Every page must also return HTTP 200 before it is scanned. This is not
 * belt-and-braces: `/pricing` builds a Supabase client during render, CI builds
 * with no env configured by design, so it returned 500 and axe silently scanned
 * Next's error shell — which has no violations, so the test passed and reported
 * coverage it did not have. A suite that cannot tell a page from an error page
 * is worse than no suite, because it is trusted.
 *
 * ── KNOWN COVERAGE LIMIT — read before trusting a green run ────────────────
 *
 * This suite only sees content that is above the fold.
 *
 * ScrollReveal (used across ~136 files) renders its children at `opacity: 0`
 * until they scroll into view, and axe correctly skips invisible elements. A
 * scan at load therefore covers the hero and little else. Measured over these
 * same 20 pages, all of it colour-contrast:
 *
 *     as scanned here (no motion preference) ...........   0 violations
 *     with content actually rendered (reducedMotion) ... ~610 violations
 *
 * The cause is roughly 1,100 call sites that set text colour to a raw brand hue.
 * Three forms, all equivalent for our purposes: the `text-icon-…` utilities, an
 * inline style setting `color` to a raw `--icon-…` custom property, and the
 * arbitrary-value form of that same thing (a `text-` class wrapping the custom
 * property in square brackets). On white the raw hues run 1.55:1–2.96:1 and
 * fail AA.
 *
 * A note on how those names are written here, because it bit us: Tailwind v4's
 * scanner reads comments, and an earlier version of this paragraph spelled the
 * arbitrary-value form out literally with a `*` wildcard inside the brackets.
 * The scanner lifted it as a real class and emitted `color: var(--icon-*)`,
 * which is not valid CSS — that broke `next dev` for every page while leaving
 * `next build` green, so CI never saw it (#217). Hence `…` rather than `*`, and
 * hence the bracket form described in words instead of written out. If you need
 * a literal example, put it somewhere the scanner does not read.
 *
 * ── Why the obvious fix is wrong ───────────────────────────────────────────
 *
 * Remapping `.text-icon-…` to the AA-safe `--icon-…-text` variants looks like a
 * one-line win and is not: those variants are calibrated on white, and on
 * --foreground the polarity inverts — raw passes (4.91:1–9.36:1), -text fails
 * (2.96:1–3.02:1). A blanket remap fixes every light surface by breaking every
 * dark band. It was tried in #184 and reverted; app/globals.css carries the
 * table.
 *
 * The sweep therefore has to be ground-aware, and that is its hard part:
 *
 *   1. Mark dark sections with a class. They cannot be detected any other way —
 *      they use bg-foreground, bg-black, arbitrary hex, and translucent tints
 *      over dark parents. This is the real work.
 *   2. Then remap globally, with `.on-dark .text-icon-…` overriding back to raw.
 *   3. Verify with axe on both light and dark surfaces — axe composites alpha
 *      correctly, which hand-rolled background-walking does not.
 *   4. Only then set `reducedMotion: "reduce"` in playwright.config.ts and move
 *      color-contrast into the gate above. Deep and green on the same commit.
 *
 * Until then: a green run here means "no critical or serious violations in the
 * content axe could see", which is a weaker claim than it looks.
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
    const response = await page.goto(path, { waitUntil: "domcontentloaded" })

    // Scanning an error page finds nothing and proves nothing. Fail loudly
    // instead, so a route that breaks in this environment cannot masquerade as
    // an accessible one.
    expect(
      response?.status(),
      `${path} must render before it can be scanned — a non-200 means axe would be ` +
        `auditing Next's error shell rather than the page`
    ).toBe(200)

    // Never measure an element mid-transition. axe reads whatever opacity an
    // element is at, so a half-faded eyebrow composites against its background
    // and reports a ratio no user ever sees — #398133 reads as #3f8539 mid-fade,
    // 4.3:1 instead of 4.8:1. That was a ~1-in-8 flake on /pricing.
    //
    // Killing transitions makes every element snap to its settled state, so the
    // scan is deterministic without changing what is in scope: elements that
    // have not been revealed stay at opacity 0 and are skipped either way.
    // Sleeping instead would change the depth (more reveals fire while waiting),
    // which is a different decision — see the coverage note above.
    await page.addStyleTag({
      content: `*, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }`,
    })

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()

    // Fail on every critical violation, and on every serious one except
    // colour-contrast. Contrast is the one rule with a known backlog (see the
    // coverage note above) and the one rule whose result depends on how much of
    // the page has revealed by scan time — so gating on it would be both red and
    // flaky. Everything else at serious is structural and deterministic, so it
    // gates properly: a new missing label or broken landmark fails the build
    // today rather than waiting for the contrast sweep.
    const blocking = results.violations.filter(
      (v) =>
        v.impact === "critical" ||
        (v.impact === "serious" && v.id !== "color-contrast")
    )

    const contrast = results.violations.find((v) => v.id === "color-contrast")
    if (contrast) {
      console.warn(
        `[a11y][contrast][${path}] ${contrast.nodes.length} node(s) — known backlog, ` +
          `not gated. Counted here only for what axe could see; see the coverage note.`
      )
    }

    expect(
      blocking.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        example: v.nodes[0]?.target.join(" "),
      })),
      `blocking accessibility violations on ${path}`
    ).toEqual([])
  })
}

/**
 * The canonical Report — scanned DEEP, and gated on contrast.
 *
 * ══ WHY THIS ONE IS DIFFERENT ═══════════════════════════════════════════════
 *
 * Everything above is scanned as a visitor lands on it, which means above the
 * fold and little else: `ScrollReveal` renders its children at `opacity: 0`
 * until they scroll in, and axe correctly skips invisible elements. Over those
 * twenty pages that is 0 violations scanned versus ~610 with the content
 * actually rendered. A green run on a revealed document would prove almost
 * nothing.
 *
 * So this test asks the browser for `prefers-reduced-motion: reduce`, which the
 * stylesheet already answers by showing every revealed block at once. Not a
 * test-only hack — it is a real user setting, and it is how a reader with that
 * preference sees this document. The whole Report is then in scope.
 *
 * ══ WHY CONTRAST GATES HERE AND NOWHERE ELSE ════════════════════════════════
 *
 * The contrast backlog above is ~1,100 pre-existing call sites painting text
 * with a raw brand hue. This document has none: every colour it uses is chosen
 * against the ground it sits on, and a unit test asserts no raw hue is ever
 * used as a text colour. There is no backlog to be flaky about, so the one page
 * that can afford the stricter gate takes it — and a €49 document is the page
 * that should.
 *
 * The route is fenced to non-production runtimes and returns 404 anywhere else,
 * so the 200 check below is also a check that the fence let a test runner in.
 */
test.describe("canonical Report document", () => {
  // `reducedMotion` lives under contextOptions in this Playwright version.
  test.use({ contextOptions: { reducedMotion: "reduce" } })

  const DOCUMENT = "article[data-foundation]"

  test("a11y: canonical report preview (/demo/food-system-report)", async ({ page }) => {
    const response = await page.goto("/demo/food-system-report", {
      waitUntil: "domcontentloaded",
    })
    expect(
      response?.status(),
      "the preview page must render before it can be scanned — a non-200 here means " +
        "either the page is broken or the preview fence denied this runtime"
    ).toBe(200)

    // Every block visible, not just the hero. The assertion is on the LAST
    // block in document order, so it is also a check that the reduced-motion
    // preference actually revealed the whole document.
    await expect(page.locator(`${DOCUMENT} blockquote`)).toBeVisible()

    await page.addStyleTag({
      content: `*, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }`,
    })

    const summarise = (violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) =>
      violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        example: v.nodes[0]?.target.join(" "),
      }))

    // ── Scan 1: the whole page, gated like every other page above ──────────
    //
    // Contrast exempted here and ONLY here, because this scan includes the
    // shared nav and footer, which carry the ~1,100-call-site backlog described
    // in the coverage note. Gating the document on chrome it does not own would
    // be red for reasons nobody reviewing this document can fix.
    const wholePage = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
    expect(
      summarise(
        wholePage.violations.filter(
          (v) => v.impact === "critical" || (v.impact === "serious" && v.id !== "color-contrast")
        )
      ),
      "blocking accessibility violations on the canonical Report page"
    ).toEqual([])

    // ── Scan 2: the document itself, with NO contrast exemption ─────────────
    //
    // This is the €49 artifact, and it has no backlog: every colour it uses is
    // resolved against the ground it sits on, and a unit test asserts no raw
    // brand hue is ever used as a text colour. So the one surface that can
    // afford the stricter gate takes it.
    const document = await new AxeBuilder({ page })
      .include(DOCUMENT)
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()

    // Non-vacuity: a selector that matched nothing would pass silently, which
    // is exactly how a suite ends up reporting coverage it does not have.
    expect(await page.locator(DOCUMENT).count()).toBe(1)

    expect(
      summarise(
        document.violations.filter((v) => v.impact === "critical" || v.impact === "serious")
      ),
      "blocking accessibility violations INSIDE the canonical Report document"
    ).toEqual([])
  })
})
