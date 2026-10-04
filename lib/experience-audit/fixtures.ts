import type { AccountTwinInput } from "@/lib/agent-loop/account-twin"
import type {
  LiveDashboardProps,
  LivePaidReport,
  RealAnalysis,
} from "@/components/account/live-dashboard"

/* ════════════════════════════════════════════════════════════════════════
   EXPERIENCE AUDIT FIXTURES — deterministic props for the real dashboard.

   ══ THESE ARE AUDIT INSTRUMENTS, NOT SEED DATA ══════════════════════════════

   Every value here is invented and obviously so. Nothing is copied from a
   customer, nothing is read from Supabase, and nothing is written anywhere.
   The names are deliberately neutral and the numbers deliberately round, so
   that a screenshot of this can never be mistaken for a screenshot of a
   person.

   ══ THE ONE CONSTRAINT THAT IS LOAD-BEARING ═════════════════════════════════

   `email` IS NULL IN EVERY STATE, AND MUST STAY NULL.

   `live-dashboard.tsx:860` calls `pushTwinState(store)` from a MOUNT EFFECT,
   and `lib/account/twin-state-sync.ts:67` does
   `fetch("/api/twin-state", { method: "PUT", keepalive: true })`. It fires when
   `propEmail` is truthy AND `twin` carries unseen milestones.

   So a fixture that passed a plausible-looking email beside a twin would PUT
   to a real API from a page whose entire purpose is to touch nothing. The
   "no network calls" property of this fixture is ENGINEERED HERE, not observed
   in passing — and `tests/unit/experience-audit-fixture.test.ts` asserts that
   no state in this file carries an email.

   The visible cost is that the dashboard renders without an email address in
   its account tab. That is the correct trade: an audit instrument that
   silently wrote to production would invalidate the audit.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * THE FROZEN AUDIT INSTANT.
 *
 * One constant, used three ways: fixture dates are authored relative to it, the
 * capture harness installs it in the browser with `page.clock`, and the
 * screenshot manifest records it beside every image. Same fixture data + same
 * clock + same viewport = reproducible image.
 *
 * ── WHY IT IS LOAD-BEARING, AND WHY NOT FOR THE REASON IT LOOKS LIKE ──────
 *
 * The two states that expose `P0-TRUST-01` and the first-use copy do NOT need
 * it: zero analyses is clock-independent, and past-dated analyses are past
 * under any clock. Their REACHABILITY does not depend on this value.
 *
 * It is needed for REPRODUCIBILITY, because other regions of the dashboard read
 * the wall clock directly. `live-dashboard.tsx:863` derives `todayStr` from
 * `new Date()`, and the week strip at `:2125-2140` computes Monday-of-week,
 * `isToday` and `isFuture` the same way. Without a frozen clock the same
 * fixture renders a different week every day and the corpus stops being
 * comparable between captures.
 *
 * Two different claims, both true, and worth keeping apart.
 *
 * ── FROZEN AT THE CAPTURE LAYER, NEVER IN THE COMPONENT ───────────────────
 *
 * `LiveDashboard` is not modified and must not be. The clock is installed by
 * the Playwright harness before navigation. Known consequence: the component is
 * `"use client"` inside a `force-dynamic` page, so Next server-renders it on the
 * real date while the browser runs this one — the week strip disagrees between
 * the two renders and React logs a hydration mismatch. Captures taken after
 * hydration settles are correct; the harness waits for it, asserts the frozen
 * date reached the DOM, and records console errors in the manifest rather than
 * suppressing them.
 */
export const AUDIT_CLOCK = "2026-10-03T09:00:00.000Z"

/** The frozen instant's date component, which is what `todayStr` compares to. */
export const AUDIT_DATE = "2026-10-03"

/** Every fixture state, by name. Pinned so a sixth is a visible diff. */
export const AUDIT_FIXTURE_STATES = [
  "representative",
  "dense",
  "sparse",
  "first-use-member",
  "returning-no-meals-today",
  "member-with-biotics",
  "weekly-report-present",
  "twin-present",
] as const

export type AuditFixtureState = (typeof AUDIT_FIXTURE_STATES)[number]

/** The dashboard's own tabs, which are its real information architecture. */
export const AUDIT_FIXTURE_TABS = [
  "overview",
  "meals",
  "reports",
  "consultations",
  "account",
] as const

export type AuditFixtureTab = (typeof AUDIT_FIXTURE_TABS)[number]

/* ── Builders ─────────────────────────────────────────────────────────── */

/**
 * One invented analysis.
 *
 * `created_at` is a FIXED ISO string rather than a relative date, because a
 * fixture that shifts with the clock produces screenshots that cannot be
 * compared between captures. The dashboard formats these for display, so the
 * rendered times are stable too.
 */
function analysis(i: number, overrides: Partial<RealAnalysis> = {}): RealAnalysis {
  const day = String(10 + (i % 20)).padStart(2, "0")
  return {
    id: `audit-analysis-${i}`,
    meal_name: `Fixture meal ${i}`,
    meal_type: ["Breakfast", "Lunch", "Dinner", "Snack"][i % 4],
    image_url: null,
    biotics_score: 40 + ((i * 7) % 50),
    prebiotic_score: 20 + ((i * 5) % 25),
    probiotic_score: 10 + ((i * 3) % 15),
    postbiotic_score: 5 + ((i * 2) % 10),
    quality_diversity: 3 + (i % 5),
    quality_anti_inflammatory: 2 + (i % 4),
    nutrition_json: { calories: 400 + i * 10, protein: 20, carbs: 45, fat: 15, fibre: 8 },
    insight: `Fixture insight for meal ${i}. This sentence exists to occupy the space real copy would.`,
    tags: ["Fixture tag", "Another tag"],
    created_at: `2026-09-${day}T12:00:00.000Z`,
    ...overrides,
  }
}

function report(i: number, overrides: Partial<LivePaidReport> = {}): LivePaidReport {
  return {
    sessionId: `audit-session-${i}`,
    tier: "personal",
    createdAt: `2026-0${1 + (i % 9)}-15T09:00:00.000Z`,
    profileType: "Fixture Profile",
    overall: 50 + ((i * 11) % 40),
    pdfUrl: null,
    status: "complete",
    emailStatus: "sent",
    ...overrides,
  }
}

/* ── The states ───────────────────────────────────────────────────────── */

/**
 * A · REPRESENTATIVE — the ordinary hierarchy.
 *
 * Enough real-looking content that the dashboard's normal reading order is
 * visible: a score with a previous score, a handful of analyses, one purchased
 * report, a modest streak. This is the state the audit reasons about when
 * asking "where does the eye land first".
 *
 * ── ONE ANALYSIS IS DATED ON THE AUDIT INSTANT, DELIBERATELY ──────────────
 *
 * Without it this state has no meals "today" and therefore triggers
 * `P0-TRUST-01` itself — so the state meant to show NORMAL behaviour would have
 * been showing the defect, and the defect would have appeared in two states
 * while `returning-no-meals-today` claimed to isolate it.
 *
 * With it, the two states have two distinct jobs and no overlap:
 * representative shows the product working, `returning-no-meals-today` shows it
 * fabricating.
 */
const representative: LiveDashboardProps = {
  name: "Fixture Member",
  email: null, // see the header — load-bearing
  ageBracket: "35-44",
  membershipTier: "member",
  membershipStatus: "active",
  streak: 4,
  score: 67,
  previousScore: 61,
  profileType: "Fixture Profile",
  recentAnalyses: [
    // Dated ON the frozen instant, so `todayMeals` is non-empty and the real
    // branch renders. This is what makes this state "representative".
    analysis(1, { created_at: `${AUDIT_DATE}T08:15:00.000Z` }),
    analysis(2),
    analysis(3),
  ],
  scoreHistory: [
    { score: 58, date: "2026-07-01" },
    { score: 61, date: "2026-08-01" },
    { score: 67, date: "2026-09-01" },
  ],
  paidReports: [report(1)],
  memberStartedAt: "2026-06-01T00:00:00.000Z",
  nextBillingDate: "2026-11-01T00:00:00.000Z",
  referralCode: "FIXTURE",
  twin: null, // no twin → the mount push cannot fire even if email were set
  retest: null,
}

/**
 * B · DENSE — legitimate content maximised.
 *
 * Not nonsense volume: the most content the component can legitimately be
 * asked to hold, so that overflow, card density, wrapping, long names and
 * visual competition become visible rather than theoretical. Twelve analyses,
 * six reports, a long display name, a full score history.
 *
 * This is the state that answers "what competes with the next action".
 */
const dense: LiveDashboardProps = {
  ...representative,
  name: "Fixture Member With A Considerably Longer Display Name",
  streak: 86,
  score: 88,
  previousScore: 52,
  recentAnalyses: Array.from({ length: 12 }, (_, i) => analysis(i + 1)),
  scoreHistory: Array.from({ length: 12 }, (_, i) => ({
    score: 50 + ((i * 3) % 40),
    date: `2026-${String(1 + (i % 9)).padStart(2, "0")}-01`,
  })),
  paidReports: Array.from({ length: 6 }, (_, i) => report(i + 1)),
}

/**
 * C · SPARSE / FIRST USE — and the reason this state exists.
 *
 * A signed-in member who has done nothing yet: no analyses, no score history,
 * no reports, no twin, no streak.
 *
 * ── THIS STATE IS THE AUDIT'S FIRST P0, MADE VISIBLE ──────────────────────
 *
 * With `recentAnalyses: []`, `live-dashboard.tsx:870` sets
 * `latestAnalysis = null`, and `:1640-42` then renders
 * `<MealCard meal={MOCK_MEALS[0].meals[0]} />` UNDER THE HEADING "Your Last
 * Analysis". `:1653` does the same for "Today's Meals".
 *
 * So the real product shows an invented meal — a name, an insight, nutrition
 * figures and per-Biotic bars — labelled as this person's own. The fixture does
 * not create that behaviour and must not be read as doing so: the mock data is
 * inside the production component, at `:170`, and `isMock` at `:1654` shows the
 * code knows.
 *
 * The screenshots of this state are the evidence for that finding.
 */
const sparse: LiveDashboardProps = {
  name: "Fixture Member",
  email: null,
  ageBracket: null,
  membershipTier: "free",
  membershipStatus: "active",
  streak: 0,
  score: null,
  previousScore: null,
  profileType: null,
  recentAnalyses: [],
  scoreHistory: [],
  paidReports: [],
  memberStartedAt: null,
  nextBillingDate: null,
  referralCode: null,
  twin: null,
  retest: null,
}

/**
 * D · FIRST USE AS A PAYING MEMBER.
 *
 * `sparse` above is free-tier, so it could not capture what a SUBSCRIBER sees
 * on their first visit — and that is the audience the first-use copy is
 * written for. Member tier, active status, and nothing logged.
 *
 * This is the state that captures `P0-SCIENCE-01`: the welcome block, gated on
 * `recentAnalyses.length === 0`, promises "an instant breakdown of its
 * Prebiotic, Probiotic, and Postbiotic value" and calls the meal-level
 * construct "your Biotics score".
 */
const firstUseMember: LiveDashboardProps = {
  name: "Fixture Member",
  email: null,
  ageBracket: "35-44",
  membershipTier: "member",
  membershipStatus: "active",
  streak: 0,
  score: null,
  previousScore: null,
  profileType: null,
  recentAnalyses: [],
  scoreHistory: [],
  paidReports: [],
  memberStartedAt: `${AUDIT_DATE}T00:00:00.000Z`,
  nextBillingDate: "2026-11-03T00:00:00.000Z",
  referralCode: "FIXTURE",
  twin: null,
  retest: null,
}

/**
 * E · RETURNING, WITH NOTHING LOGGED TODAY — the state that proves
 * `P0-TRUST-01`.
 *
 * Analyses exist, so the enclosing block at `live-dashboard.tsx:1332`
 * (`recentAnalyses.length > 0`) renders. None of them is dated on the frozen
 * audit instant, so `todayMeals` (`:864`) is empty, so `:1653` falls through to
 * `MOCK_MEALS[0].meals`.
 *
 * The rendered result is a fabricated meal with a fabricated score under
 * "Today's Meals", directly above "No meals logged today".
 *
 * Every date here is deliberately BEFORE `AUDIT_DATE`, which makes the state
 * clock-independent in its reachability: past is past under any clock. The
 * frozen instant matters for the week strip's reproducibility, not for whether
 * this defect appears.
 */
const returningNoMealsToday: LiveDashboardProps = {
  ...representative,
  streak: 11,
  recentAnalyses: [
    analysis(4, { created_at: "2026-10-01T19:25:00.000Z" }),
    analysis(5, { created_at: "2026-09-30T12:40:00.000Z" }),
    analysis(6, { created_at: "2026-09-28T08:05:00.000Z" }),
  ],
}

/**
 * F · MEMBER WITH BIOTICS — the same rings, with GENUINE data.
 *
 * Every other state passes no `biotics`, so `live-dashboard.tsx:817` falls back
 * to the hardcoded `{ prebiotic: 71, probiotic: 23, postbiotic: 48 }` and the
 * "Your Biotics Profile" rings were only ever observed in their FABRICATED
 * form. That left the register unable to say whether the construct is wrong
 * only when invented, or wrong always.
 *
 * This state answers it: real per-Biotic values, so the rings, the numbers and
 * the band words render from data a member actually produced. If they still
 * violate the permanent product rule — and they do, because the rule forbids
 * the FORM, not the provenance — then `P0-SCIENCE-02` is independent of
 * `P0-TRUST-02` and the two need separate remediation.
 */
const memberWithBiotics: LiveDashboardProps = {
  ...representative,
  biotics: { prebiotic: 58, probiotic: 44, postbiotic: 63 },
}

/**
 * G · WEEKLY REPORT PRESENT — the attributed quotation, with a real source.
 *
 * `:1843` renders a pull-quote under "From your Week N report". With no
 * `weeklyReport` it substitutes a hardcoded prediction — "shift your overall
 * Biotics number by 8-12 points within three weeks" — and attributes that
 * invention to the member's own report.
 *
 * This state supplies a genuine report with a genuine `pullQuote`, so the audit
 * can separate two different defects that currently look like one:
 *
 *   the FALLBACK is fabricated and misattributed  → a trust defect
 *   the FRAME quotes a per-Biotic claim as the member's own → a science defect
 *
 * The `pullQuote` here is deliberately ORDINARY and non-predictive, so anything
 * claims-bearing that still renders comes from the component, not the fixture.
 */
const weeklyReportPresent: LiveDashboardProps = {
  ...representative,
  weeklyReport: {
    id: "audit-weekly-1",
    week_starting: "2026-09-28",
    content: "Fixture weekly report body. This text exists to occupy the space real copy would.",
    report_json: {
      weekStarting: "2026-09-28",
      weekNumber: 14,
      mealCount: 9,
      averageScore: 68,
      previousWeekAverage: 64,
      pillars: { prebiotic: 58, probiotic: 44, postbiotic: 63 },
      pullQuote: "You logged nine meals this week, three more than the week before.",
      narrative: "Fixture narrative. This sentence exists to occupy the space real copy would.",
      focusAction: "Fixture focus action.",
      weekSummaryTitle: "Fixture week summary",
      mealsThisWeek: [
        { id: "audit-analysis-1", name: "Fixture meal 1", type: "Breakfast", score: 47, date: "2026-09-29" },
        { id: "audit-analysis-2", name: "Fixture meal 2", type: "Lunch", score: 54, date: "2026-09-30" },
      ],
    },
  },
}

/**
 * Deterministic input for the REAL twin builder.
 *
 * ── WHY A BUILDER INPUT AND NOT A TWIN ────────────────────────────────────
 *
 * `FoodSystemDigitalTwin` is a large composed type. Hand-writing one would
 * produce a shape I invented, and the audit would then be reading my fiction
 * rather than what `/account` actually renders. So the fixture supplies the
 * INPUT and `app/audit/account-dashboard/page.tsx` calls `buildAccountTwin` —
 * the same function `app/account/page.tsx:279` calls.
 *
 * Every value is fixed. The meal dates are absolute and sit before
 * `AUDIT_DATE`, so the twin's content does not shift with the clock.
 */
export const TWIN_FIXTURE_INPUT: AccountTwinInput = {
  score: 67,
  previousScore: 61,
  profileType: "Fixture Profile",
  biotics: { prebiotic: 58, probiotic: 44, postbiotic: 63 },
  streak: 4,
  meals: [
    { name: "Fixture meal 1", score: 71, prebiotic: 60, probiotic: 48, postbiotic: 65, createdAt: `${AUDIT_DATE}T08:15:00.000Z` },
    { name: "Fixture meal 2", score: 54, prebiotic: 50, probiotic: 30, postbiotic: 58, createdAt: "2026-10-01T19:25:00.000Z" },
    { name: "Fixture meal 3", score: 62, prebiotic: 55, probiotic: 41, postbiotic: 60, createdAt: "2026-09-30T12:40:00.000Z" },
  ],
}

/**
 * H · TWIN PRESENT — the nine LIVE Twin components, rendered at last.
 *
 * `live-dashboard.tsx` imports nine components from `components/account/twin/`
 * — `TwinStage`, `TodayStrip`, `TwinSections`, `QuickLog`, `InsideYouTeaser`,
 * `DailyRitual`, `AskTwin`, `MeetTwinChecklist`, `MeetBodyHero`. They are LIVE
 * on `/account`, which is `V1_CORE`.
 *
 * Every other state passes `twin: null`, so this audit had photographed none of
 * them. Their claims were live and unexamined by render — the precise situation
 * that produced five P0s on the rest of the dashboard.
 *
 * ── THE SAFETY BOUNDARY IS UNCHANGED, NOT RELAXED ─────────────────────────
 *
 * `email` stays NULL here as everywhere else. `live-dashboard.tsx:857` reads
 * `if (propEmail) pushTwinState(store)`, so the twin-state PUT cannot fire
 * without an email — and that is asserted BY RENDER in the capture harness's
 * network-footprint test, not inferred from this comment.
 *
 * `NOTE-FIXTURE-01` has been wrong about this effect twice. It is not trusted a
 * third time.
 */
const twinPresent: LiveDashboardProps = {
  ...representative,
  biotics: { prebiotic: 58, probiotic: 44, postbiotic: 63 },
  // twin + twinFeed are supplied by the page, which builds them with the real
  // builder — see TWIN_FIXTURE_INPUT above.
}

export const AUDIT_FIXTURES: Record<AuditFixtureState, LiveDashboardProps> = {
  representative,
  dense,
  sparse,
  "first-use-member": firstUseMember,
  "returning-no-meals-today": returningNoMealsToday,
  "member-with-biotics": memberWithBiotics,
  "weekly-report-present": weeklyReportPresent,
  "twin-present": twinPresent,
}

/** What each state is for, rendered in the audit banner beside the capture. */
export const AUDIT_FIXTURE_PURPOSE: Record<AuditFixtureState, string> = {
  representative: "Ordinary hierarchy — where does the eye land first?",
  dense: "Legitimate content maximised — what competes with the next action?",
  sparse: "First use, free tier — what does the product do when it has nothing?",
  "first-use-member":
    "First use as a PAYING member — the first-use Biotics copy a subscriber sees (P0-SCIENCE-01)",
  "returning-no-meals-today":
    "Analyses exist, none today — the fabricated-meal path (P0-TRUST-01)",
  "member-with-biotics":
    "Real per-Biotic data — are the rings wrong only when invented, or always? (P0-SCIENCE-02)",
  "weekly-report-present":
    "A genuine weekly report — is the prediction the fallback, or the frame? (P0-SCIENCE-03)",
  "twin-present":
    "The nine LIVE Twin components, rendered — what does the Digital Twin actually claim?",
}

/**
 * Which recorded finding each state is evidence for, so the screenshot manifest
 * can cite it without a human re-deriving the link.
 */
export const AUDIT_STATE_FINDINGS: Record<AuditFixtureState, readonly string[]> = {
  representative: [],
  dense: [],
  sparse: ["P0-SCIENCE-01"],
  "first-use-member": ["P0-SCIENCE-01"],
  "returning-no-meals-today": ["P0-TRUST-01", "P0-SCIENCE-01"],
  "member-with-biotics": ["P0-SCIENCE-02", "P0-TRUST-02"],
  "weekly-report-present": ["P0-SCIENCE-03"],
  "twin-present": [],
}
