/* ════════════════════════════════════════════════════════════════════════
   The interpretation boundary — one place where a score becomes a word.

   ── The state this replaces ───────────────────────────────────────────────

   Ten ladders turn a number into a label in this repository, and only ONE of
   them has a test. Worse, they disagree:

     lib/scoring.ts                   80 / 60 / 40 / 20   Exceptional …
     dashboard-client-data.ts:257     80 / 65 / 50 / 35   Exceptional, Strong
     analyse/result-builder.tsx:96    80 / 65 / 50 / 35   Foundation, Good
     share-client.tsx:88              80 / 65 / 50 / 35   Start, Getting There,
     meal-analysis-email.ts:14        80 / 65 / 50 / 35   Starting Out
     meal-analysis-email.ts:25        70 / 50 / 30        per-pillar strength
     agent-loop/biotics.ts:21         80 / 60 / 40 / 20   per-Biotic, other words
     report/build-food-system…:110    65 / 40             strong/building/strained
     identity-labels.ts:16            90/75/60/45/30      six tiers
     assessment-scoring.ts:104        80 / 65 / 50 / 35   a PROFILE, not a band

   `/method` publishes the FIRST of those as the product's stated methodology,
   while the result page, the share card, the dashboard and the meal email all
   describe the same number using the SECOND. A customer who reads /method and
   then reads their own result is looking at two different ladders.

   ── What this module does, and what it very deliberately does NOT do ──────

   It makes the divergence ADDRESSABLE by putting every ladder behind one
   version-aware call. It does NOT resolve the divergence: no threshold is
   merged, moved or judged here, and `interpretation-v1.0` is absent because
   the canonical thresholds are not approved.

   Every caller keeps passing the version it already used, so behaviour is
   byte-identical. That is the whole point — consolidation that changed a
   customer's band would be a scoring change smuggled in as a refactor, and
   deciding whether 60 or 65 is correct is a methodology decision with a
   reviewer attached.

   ── One thing that is NOT in here, on purpose ─────────────────────────────

   `getProfile` (lib/assessment-scoring.ts:104) is a PROFILE ladder: it returns
   a type, a tagline, a description and a colour, with three variants of
   "Developing System" selected by the weakest pillar. Six branches, five
   names. It answers a different question from "what band is this number in",
   and forcing it into this signature would flatten the thing that makes it
   useful. It is recorded below as a known related ladder and left alone.
   ════════════════════════════════════════════════════════════════════════ */

export interface Band {
  readonly label: string
  readonly color: string
  /** Inclusive lower bound. */
  readonly min: number
}

export interface InterpretationLadder {
  readonly version: string
  /** Where this ladder lives today, so the registry can be checked against it. */
  readonly source: string
  /** What it is for, in one line. */
  readonly describes: string
  /** Descending by `min`. */
  readonly bands: readonly Band[]
}

/*
 * ── The registry ─────────────────────────────────────────────────────────
 *
 * Each ladder is recorded VERBATIM, thresholds and colours as they are today.
 * These are transcriptions, not proposals. A test compares each against the
 * file it was transcribed from, so a ladder cannot be edited at source while
 * this registry goes on claiming the old numbers.
 */

/** `lib/scoring.ts` — published on /method as the product's stated methodology. */
const PUBLISHED_METHOD: InterpretationLadder = {
  version: "interpretation-legacy-published",
  source: "lib/scoring.ts",
  describes: "The ladder /method presents to the public as the EatoBiotics scale.",
  bands: [
    { label: "Exceptional", color: "var(--icon-green)", min: 80 },
    { label: "Excellent", color: "var(--icon-teal)", min: 60 },
    { label: "Good", color: "var(--icon-yellow)", min: 40 },
    { label: "Fair", color: "var(--icon-orange)", min: 20 },
    { label: "Getting Started", color: "var(--muted-foreground)", min: 0 },
  ],
}

/** The ladder every customer-facing SCORE surface actually uses. CSS-variable colours. */
const ACCOUNT_SURFACES: InterpretationLadder = {
  version: "interpretation-legacy-account",
  source: "components/analyse/result-builder.tsx, app/share/share-client.tsx, components/account/dashboard-client-data.ts",
  describes: "The ladder the result, share card and dashboard describe a score with.",
  bands: [
    { label: "Exceptional", color: "var(--icon-green)", min: 80 },
    { label: "Strong Foundation", color: "var(--icon-lime)", min: 65 },
    { label: "Good Start", color: "var(--icon-yellow)", min: 50 },
    { label: "Getting There", color: "var(--icon-orange)", min: 35 },
    { label: "Starting Out", color: "#ef4444", min: 0 },
  ],
}

/**
 * The same ladder again, in hex, because email clients cannot read CSS vars.
 *
 * Recorded SEPARATELY rather than folded into the one above. The thresholds
 * and labels agree; the colours do not, and they have already drifted once —
 * `#ef5350` here against `#ef4444` on the web. Merging them would hide a live
 * inconsistency behind a shared name.
 */
const EMAIL_SURFACES: InterpretationLadder = {
  version: "interpretation-legacy-email",
  source: "lib/email/meal-analysis-email.ts",
  describes: "The account ladder, re-specified in hex for email clients.",
  bands: [
    { label: "Exceptional", color: "#4caf7d", min: 80 },
    { label: "Strong Foundation", color: "#7fc47e", min: 65 },
    { label: "Good Start", color: "#e6b84a", min: 50 },
    { label: "Getting There", color: "#e07b4a", min: 35 },
    { label: "Starting Out", color: "#ef5350", min: 0 },
  ],
}

/**
 * A per-pillar strength ladder — the TENTH, found while building this.
 *
 * It answers the same question as `agent-loop/biotics.ts` ("how strong is this
 * one dimension?") with different cut points AND different words: 70/50/30
 * Strong·Moderate·Building·Low here, 80/60/40/20 Thriving·Strong·Building·
 * Emerging there. Neither is wrong; they simply were never reconciled, and
 * recording both is how that becomes a decision someone can take.
 */
const PILLAR_STRENGTH_EMAIL: InterpretationLadder = {
  version: "interpretation-legacy-pillar-strength-email",
  source: "lib/email/meal-analysis-email.ts (bioticBar)",
  describes: "Per-dimension strength wording inside the meal email.",
  bands: [
    { label: "Strong", color: "#4caf7d", min: 70 },
    { label: "Moderate", color: "#e6b84a", min: 50 },
    { label: "Building", color: "#e07b4a", min: 30 },
    { label: "Low", color: "#ef5350", min: 0 },
  ],
}

/** Per-Biotic wording in the agent loop. Kept distinct at source, and kept distinct here. */
const PILLAR_STRENGTH_AGENT: InterpretationLadder = {
  version: "interpretation-legacy-pillar-strength-agent",
  source: "lib/agent-loop/biotics.ts",
  describes: "Per-dimension strength wording in the agent loop.",
  bands: [
    { label: "Thriving", color: "var(--icon-green)", min: 80 },
    { label: "Strong", color: "var(--icon-teal)", min: 60 },
    { label: "Building", color: "var(--icon-yellow)", min: 40 },
    { label: "Emerging", color: "var(--icon-orange)", min: 20 },
    { label: "Getting started", color: "var(--muted-foreground)", min: 0 },
  ],
}

/** The Report's three-state band. A different shape again: three states, not five. */
const REPORT_THREE_STATE: InterpretationLadder = {
  version: "interpretation-legacy-report",
  source: "lib/report/build-food-system-report.ts",
  describes: "The paid Report's strong / building / strained framing.",
  bands: [
    { label: "strong", color: "var(--icon-green)", min: 65 },
    { label: "building", color: "var(--icon-yellow)", min: 40 },
    { label: "strained", color: "var(--icon-orange)", min: 0 },
  ],
}

export const INTERPRETATION_LADDERS: readonly InterpretationLadder[] = [
  PUBLISHED_METHOD,
  ACCOUNT_SURFACES,
  EMAIL_SURFACES,
  PILLAR_STRENGTH_EMAIL,
  PILLAR_STRENGTH_AGENT,
  REPORT_THREE_STATE,
]

/**
 * Related, and deliberately NOT a band ladder. Recorded so the count is honest.
 */
export const KNOWN_NON_BAND_LADDERS = [
  {
    source: "lib/assessment-scoring.ts (getProfile)",
    why: "A profile — type, tagline, description, colour — with three variants of one band selected by the weakest pillar. Six branches, five names.",
  },
  {
    source: "lib/identity-labels.ts (getIdentityLabel)",
    why: "Six identity tiers at 90/75/60/45/30/0. A different construct from a score band.",
  },
] as const

export class UnknownInterpretationVersionError extends Error {
  constructor(version: string) {
    super(
      `No interpretation ladder is registered for "${version}". Bands are version-aware precisely so ` +
        `that a caller cannot silently fall back to somebody else's thresholds — which is the defect ` +
        `this module exists to make visible rather than to repeat.`,
    )
    this.name = "UnknownInterpretationVersionError"
  }
}

export function ladderFor(version: string): InterpretationLadder {
  const ladder = INTERPRETATION_LADDERS.find((l) => l.version === version)
  if (!ladder) throw new UnknownInterpretationVersionError(version)
  return ladder
}

/**
 * A score, interpreted under a NAMED ladder.
 *
 * There is no default version and no fallback. A caller must say which
 * interpretation it means, because "whichever one happens to be imported here"
 * is how the same number came to be described five different ways.
 *
 * `interpretation-v1.0` is not registered: the canonical thresholds are not
 * approved, so asking for them throws rather than quietly returning a guess.
 */
export function getScoreBand(score: number, interpretationVersion: string): Band {
  const { bands } = ladderFor(interpretationVersion)
  return bands.find((b) => score >= b.min) ?? bands[bands.length - 1]
}
