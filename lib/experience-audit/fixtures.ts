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

/** Every fixture state, by name. Pinned so a fifth is a visible diff. */
export const AUDIT_FIXTURE_STATES = ["representative", "dense", "sparse"] as const

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
  recentAnalyses: [analysis(1), analysis(2), analysis(3)],
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

export const AUDIT_FIXTURES: Record<AuditFixtureState, LiveDashboardProps> = {
  representative,
  dense,
  sparse,
}

/** What each state is for, rendered in the audit banner beside the capture. */
export const AUDIT_FIXTURE_PURPOSE: Record<AuditFixtureState, string> = {
  representative: "Ordinary hierarchy — where does the eye land first?",
  dense: "Legitimate content maximised — what competes with the next action?",
  sparse: "First use — what does the product do when it has nothing?",
}
