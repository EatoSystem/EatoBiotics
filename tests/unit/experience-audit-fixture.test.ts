import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

import { isExperienceAuditFixtureEligible } from "@/lib/experience-audit/fixture-policy"
import {
  AUDIT_CLOCK,
  AUDIT_DATE,
  AUDIT_FIXTURES,
  AUDIT_FIXTURE_PURPOSE,
  AUDIT_FIXTURE_STATES,
  AUDIT_FIXTURE_TABS,
  AUDIT_STATE_FINDINGS,
} from "@/lib/experience-audit/fixtures"
import { FIXTURE_SELF_GATED_ROUTES, classifyPageRoute, isServableInV1 } from "@/lib/v1-surface"
import { STATIC_PATHS } from "@/app/sitemap"
import { NAV_LINKS, NAV_GROUPS } from "@/lib/nav"

/* ════════════════════════════════════════════════════════════════════════════
   THE EXPERIENCE AUDIT FIXTURE — gating and containment, proved.

   The fixture renders the real member dashboard populated with invented data.
   Two things therefore have to be true, and neither may rest on a runtime
   check alone:

     it is unreachable in every production configuration;
     it writes nothing and reads no customer data — no Supabase, no Stripe, no
     auth, no persistence.

   ══ A CLAIM THIS FILE USED TO MAKE, AND RENDERED EVIDENCE DISPROVED ═════════

   It said the fixture makes "no network request at all". That was FALSE, and
   the capture harness caught it: every page load recorded one console error,
   a 401 from `GET /api/assessment/journey`. `AssessmentJourneyCard`
   (`components/account/dashboard-parts.tsx:33`) calls `ensureHydrated()` from
   a mount effect, and it takes NO prop — so no fixture data can disarm it.
   Unauthenticated the route refuses, so nothing is read and nothing written,
   but the request happens.

   Source inspection can establish possibility. Rendered evidence establishes
   reachability — including the reachability of a side effect the fixture's
   author had asserted away.

   So there are TWO mount-time effects, and only one of them is engineered:

     PUT /api/twin-state           `live-dashboard.tsx:860` → `pushTwinState`,
                                   fires only when `propEmail` is truthy AND
                                   `twin` carries unseen milestones. DISARMED
                                   by fixture data, and asserted below.
     GET /api/assessment/journey   unconditional, prop-independent, refused 401.
                                   NOT disarmable. Declared, not prevented.

   The exact footprint is pinned by RENDER in `tests/e2e/audit-capture.spec.ts`
   (`EXPECTED_API_CALLS`), which is the only place that can see a third one
   appear. This file pins the half that fixture data controls.
   ════════════════════════════════════════════════════════════════════════════ */

const ROUTE = "/audit/account-dashboard"
const PAGE = "app/audit/account-dashboard/page.tsx"
const FIXTURES_SRC = "lib/experience-audit/fixtures.ts"

describe("the audit fixture is unreachable in production", () => {
  /*
   * Every production-shaped environment, asserted individually rather than
   * only through the four-way equivalence test in `fss-preview-gate.test.ts`.
   * Equivalence proves the four gates agree; it would still pass if all four
   * agreed on the wrong answer. This proves the answer.
   */
  const PRODUCTION_SHAPED: NodeJS.ProcessEnv[] = [
    { VERCEL_ENV: "production" },
    { VERCEL_ENV: "production", NODE_ENV: "development" },
    { VERCEL_ENV: "production", NODE_ENV: "test" },
    { VERCEL_ENV: "production", NODE_ENV: "production" },
    { NODE_ENV: "production" },
    {},
    { VERCEL_ENV: "staging" },
    { VERCEL_ENV: "" },
    { VERCEL_ENV: "Production" },
    { VERCEL_ENV: "PRODUCTION" },
  ] as unknown as NodeJS.ProcessEnv[]

  it.each(PRODUCTION_SHAPED.map((e) => [JSON.stringify(e), e] as const))(
    "denies %s",
    (_label, env) => {
      expect(isExperienceAuditFixtureEligible(env)).toBe(false)
    },
  )

  /*
   * And the inverse, so the test is not vacuous: it must actually serve the
   * runtimes a reviewer and the capture suite use. A gate that denied
   * everything would pass every assertion above and be useless.
   */
  const PERMITTED: NodeJS.ProcessEnv[] = [
    { VERCEL_ENV: "preview" },
    { VERCEL_ENV: "development" },
    { NODE_ENV: "development" },
    { NODE_ENV: "test" },
  ] as unknown as NodeJS.ProcessEnv[]

  it.each(PERMITTED.map((e) => [JSON.stringify(e), e] as const))("serves %s", (_label, env) => {
    expect(isExperienceAuditFixtureEligible(env)).toBe(true)
  })
})

describe("the audit fixture is classified, unlisted and unlinked", () => {
  it("is FIXTURE_SELF_GATED, so the proxy passes it and the page refuses", () => {
    expect(classifyPageRoute(ROUTE)).toBe("FIXTURE_SELF_GATED")
    expect(isServableInV1(ROUTE)).toBe(true)
    expect([...FIXTURE_SELF_GATED_ROUTES]).toContain(ROUTE)
  })

  it("is absent from the sitemap and from navigation", () => {
    // STATIC_PATHS holds { path, priority, changeFrequency }, not strings.
    expect(STATIC_PATHS.map((p) => p.path)).not.toContain(ROUTE)

    // NavGroup's children are `items`, not `links`.
    const navHrefs = [
      ...NAV_LINKS.map((l) => l.href),
      ...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)),
    ]
    expect(navHrefs, "the audit fixture appeared in navigation").not.toContain(ROUTE)
    expect(navHrefs.length, "the nav parse found nothing to check").toBeGreaterThan(0)
  })

  it("is noindex and nofollow", () => {
    const src = readFileSync(PAGE, "utf8")
    expect(src).toMatch(/robots:\s*"noindex, nofollow"/)
  })
})

describe("the audit fixture touches nothing", () => {
  const pageSrc = () => readFileSync(PAGE, "utf8")
  const fixturesSrc = () => readFileSync(FIXTURES_SRC, "utf8")

  it("imports no Supabase, no Stripe, and no authentication", () => {
    for (const src of [pageSrc(), fixturesSrc()]) {
      const imports = [...src.matchAll(/^import[\s\S]*?from "([^"]+)"/gm)].map((m) => m[1])
      for (const spec of imports) {
        expect(/supabase/i.test(spec), `imports ${spec}`).toBe(false)
        expect(/stripe/i.test(spec), `imports ${spec}`).toBe(false)
        expect(/supabase-server|getUser|membership/i.test(spec), `imports ${spec}`).toBe(false)
      }
    }
  })

  /*
   * The demo route renders `dashboard-client.tsx`, the ten-tab mock that
   * CLAUDE.md warns is never what a member sees. The entire reason this fixture
   * exists is to avoid auditing that component, so depending on anything from
   * the demo tree would defeat the point.
   */
  it("depends on nothing in the demo tree and never imports the ten-tab mock", () => {
    /*
     * Scanned over CODE, not comments. The first version of this test fired on
     * the fixture page's OWN header, which names `app/demo/account/page.tsx`
     * and `dashboard-client.tsx` while explaining why it deliberately uses
     * neither — a comment documenting an avoidance, flagged for naming the
     * thing it avoids.
     *
     * Fourth time this session: `caused` inside a disclaimer, `proven` inside
     * `provenance`, `"raw"` inside a note recording its absence, and now this.
     */
    for (const raw of [pageSrc(), fixturesSrc()]) {
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ")
      expect(code).not.toMatch(/app\/demo|dashboard-client|dashboard-client-data/)
      // NON-VACUITY: the stripped source still holds the real import.
      expect(code).toMatch(/live-dashboard|LiveDashboardProps/)
    }
  })

  it("renders the REAL dashboard, which is the whole point", () => {
    const src = pageSrc()
    expect(src).toMatch(/from "@\/components\/account\/live-dashboard"/)
    expect(src).toMatch(/<LiveDashboard/)
  })

  /*
   * ── THE CONSTRAINT THAT CARRIES THE NO-WRITE PROPERTY ────────────────────
   *
   * `pushTwinState` fires from a mount effect when `propEmail` is truthy and
   * `twin` has unseen milestones. Either being absent is enough to stop it;
   * both are asserted absent, because a later fixture edit that added a
   * plausible email would otherwise silently make the audit page PUT to a real
   * API — from the one page in the repository whose purpose is to touch
   * nothing.
   *
   * This is the write, and it is the one the fixture genuinely prevents. The
   * unconditional journey GET is a different matter: see the header.
   */
  it("no fixture state can trigger the twin-state push", () => {
    for (const state of AUDIT_FIXTURE_STATES) {
      const props = AUDIT_FIXTURES[state] as Record<string, unknown>
      expect(props.email, `state "${state}" carries an email — the twin push can fire`).toBeNull()
      expect(props.twin, `state "${state}" carries a twin — the twin push can fire`).toBeNull()
    }
  })

  it("carries no real-looking personal data", () => {
    const src = fixturesSrc()
    // No email addresses at all, in any form.
    expect(src).not.toMatch(/[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
    // Every name is visibly a fixture.
    for (const state of AUDIT_FIXTURE_STATES) {
      const name = (AUDIT_FIXTURES[state] as Record<string, unknown>).name
      expect(String(name)).toMatch(/Fixture/)
    }
  })
})

describe("the audit fixture states are deliberate, not one everything-on screenshot", () => {
  it("the five states are pinned, and each says what it is for", () => {
    expect([...AUDIT_FIXTURE_STATES]).toEqual([
      "representative",
      "dense",
      "sparse",
      "first-use-member",
      "returning-no-meals-today",
    ])
    for (const state of AUDIT_FIXTURE_STATES) {
      expect(AUDIT_FIXTURE_PURPOSE[state]?.length ?? 0).toBeGreaterThan(20)
      // Every state declares which findings it is evidence for, even if none.
      expect(Array.isArray(AUDIT_STATE_FINDINGS[state])).toBe(true)
    }
  })

  /* ══ THE FROZEN CLOCK, AND WHAT EACH STATE PROVES ABOUT IT ════════════════
   *
   * The clock is installed by the capture harness, never by the component. The
   * two defect-exposing states are deliberately clock-INDEPENDENT in their
   * reachability — zero analyses is clock-independent, and past-dated analyses
   * are past under any clock — so the defects appear whether or not the freeze
   * works. The freeze exists for reproducibility of the week strip and other
   * wall-clock regions.
   * ═══════════════════════════════════════════════════════════════════════ */

  it("the audit clock is a fixed instant and its date agrees with it", () => {
    expect(AUDIT_CLOCK).toBe("2026-10-03T09:00:00.000Z")
    expect(AUDIT_DATE).toBe("2026-10-03")
    // The date must be the clock's own date, or `todayStr` comparisons lie.
    expect(AUDIT_CLOCK.startsWith(AUDIT_DATE)).toBe(true)
  })

  it("representative has a meal ON the audit date, so it shows the NORMAL case", () => {
    /*
     * Without this the state meant to show ordinary hierarchy would itself
     * trigger P0-TRUST-01, and the defect would appear in two states while
     * `returning-no-meals-today` claimed to isolate it.
     */
    const analyses = (AUDIT_FIXTURES.representative as Record<string, unknown>)
      .recentAnalyses as { created_at: string }[]
    expect(
      analyses.some((a) => a.created_at.startsWith(AUDIT_DATE)),
      "representative has no meal today — it would show the fabricated-meal path",
    ).toBe(true)
  })

  it("returning-no-meals-today has analyses but NONE on the audit date", () => {
    const props = AUDIT_FIXTURES["returning-no-meals-today"] as Record<string, unknown>
    const analyses = props.recentAnalyses as { created_at: string }[]

    // Both halves matter: the enclosing block needs analyses to exist (:1332),
    // and `todayMeals` must be empty for the fallback to fire (:864, :1653).
    expect(analyses.length, "no analyses — the enclosing block would not render").toBeGreaterThan(0)
    expect(
      analyses.some((a) => a.created_at.startsWith(AUDIT_DATE)),
      "a meal is dated today — the fabricated-meal path would not fire",
    ).toBe(false)

    expect(AUDIT_STATE_FINDINGS["returning-no-meals-today"]).toContain("P0-TRUST-01")
  })

  it("first-use-member is member-tier with nothing logged", () => {
    const props = AUDIT_FIXTURES["first-use-member"] as Record<string, unknown>
    expect(props.membershipTier).toBe("member")
    expect(props.membershipStatus).toBe("active")
    expect((props.recentAnalyses as unknown[]).length).toBe(0)

    // The free-tier sparse state cannot stand in for this one.
    expect((AUDIT_FIXTURES.sparse as Record<string, unknown>).membershipTier).toBe("free")
    expect(AUDIT_STATE_FINDINGS["first-use-member"]).toContain("P0-SCIENCE-01")
  })

  it("the tabs are the dashboard's own information architecture", () => {
    expect([...AUDIT_FIXTURE_TABS]).toEqual([
      "overview",
      "meals",
      "reports",
      "consultations",
      "account",
    ])

    // Derived from the component, not guessed: its Tab union must match.
    const src = readFileSync("components/account/live-dashboard.tsx", "utf8")
    const decl = src.match(/^type Tab = ([^\n]+)/m)
    expect(decl, "the Tab union moved").not.toBeNull()
    const declared = [...decl![1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    expect(declared.sort()).toEqual([...AUDIT_FIXTURE_TABS].sort())
  })

  /*
   * The states must be genuinely different, or they are one screenshot taken
   * three times. Measured on the fields that drive the dashboard's density.
   */
  it("the states differ materially in what they give the component", () => {
    const counts = AUDIT_FIXTURE_STATES.map((s) => {
      const p = AUDIT_FIXTURES[s] as Record<string, unknown>
      return {
        state: s,
        analyses: (p.recentAnalyses as unknown[]).length,
        reports: (p.paidReports as unknown[]).length,
        history: (p.scoreHistory as unknown[]).length,
      }
    })

    const sparse = counts.find((c) => c.state === "sparse")!
    const dense = counts.find((c) => c.state === "dense")!
    const rep = counts.find((c) => c.state === "representative")!

    // Sparse is genuinely empty — this is the state that exposes the mock
    // fallback in the production component.
    expect(sparse.analyses).toBe(0)
    expect(sparse.reports).toBe(0)
    expect(sparse.history).toBe(0)

    // And dense is genuinely denser than representative, on every axis.
    expect(dense.analyses).toBeGreaterThan(rep.analyses)
    expect(dense.reports).toBeGreaterThan(rep.reports)
    expect(dense.history).toBeGreaterThan(rep.history)
  })

  /*
   * Fixed dates, not relative ones. A fixture whose content shifts with the
   * clock produces screenshots that cannot be compared between captures, which
   * would quietly destroy the corpus's value as evidence.
   */
  it("every fixture date is fixed, so captures are comparable over time", () => {
    /*
     * Scanned over CODE. The AUDIT_CLOCK header explains that
     * `live-dashboard.tsx:863` derives `todayStr` from `new Date()`, so an
     * unstripped scan fires on the comment describing the very thing the
     * fixtures avoid.
     *
     * FIFTH time this session, and the first that was avoidable: `caused` in a
     * disclaimer, `proven` in `provenance`, `"raw"` in a note recording its
     * absence, `app/demo` in a header explaining why it is unused — and now
     * this. Having hit it four times, this guard should have been written
     * comment-stripped to begin with.
     */
    const raw = readFileSync(FIXTURES_SRC, "utf8")
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ")

    for (const forbidden of ["Date.now", "new Date(", "toISOString"]) {
      expect(code, `fixtures use ${forbidden} — captures would drift`).not.toContain(forbidden)
    }
    // NON-VACUITY: the stripped code still holds real fixed dates.
    expect(code).toMatch(/2026-\d\d-\d\dT/)
  })
})
