/* ── Claude Report Types ─────────────────────────────────────────────── */
// Pure TypeScript interfaces for Claude JSON output — no imports needed.
// Used by: app/api/generate-report/route.ts and all report display components.

export interface ClaudeStarterReport {
  /** 2–3 sentence personalised intro based on their specific scores */
  opening: string
  /** What their specific score means for their internal food system */
  scoreInterpretation: string
  /** 3 strength labels (pillar or habit names) */
  strengths: string[]
  /** 3 explanations — why each is a strength for THIS person */
  strengthExplanations: string[]
  /** 3 opportunity labels */
  opportunities: string[]
  /** 3 explanations — why each matters for THIS person */
  opportunityExplanations: string[]
  /** 7 daily actions, Monday–Sunday */
  sevenDayPlan: Array<{ day: string; action: string }>
  /** Warm closing paragraph connecting personal system to bigger picture */
  closing: string
}

export interface ClaudeFullReport extends ClaudeStarterReport {
  /** Deep analysis of connections between pillar scores */
  habitAnalysis: string
  /** What Consistency + Feeling combined reveals about system stability */
  rhythmInsight: string
  /** How their current food system affects daily experience */
  energyBreakdown: string
  /** 4-week personalised roadmap */
  thirtyDayRoadmap: Array<{
    week: number
    focus: string
    theme: string
    actions: string[]
  }>
}

export interface ClaudePremiumReport extends ClaudeFullReport {
  /** The single biggest blocker and biggest builder in their system */
  priorityMap: {
    biggestBlocker: string
    blockerExplanation: string
    biggestBuilder: string
    builderExplanation: string
  }
  /** 3-phase improvement strategy */
  phasedStrategy: Array<{
    phase: string
    duration: string
    milestone: string
    actions: string[]
  }>
  /** Deep cross-pillar narrative analysis */
  systemInterpretation: string
  /** "Your System, Your Story" — personal, motivating narrative, 3–4 sentences */
  systemStory: string
}

export type ClaudeReportOutput =
  | ClaudeStarterReport
  | ClaudeFullReport
  | ClaudePremiumReport

// ── Deep Report Types (Paid Deep Assessment) ───────────────────────────────
// These extend the base Claude report types with fields that require
// the user's deep assessment answers — not just their pillar scores.

export interface ScoreProjection {
  /** Conservative target score — realistic with basic habit changes */
  low: number
  /** Optimistic target score — achievable with full protocol adherence */
  high: number
  /** e.g. "10–12 weeks" */
  timeline: string
  /** 3 specific changes that will drive this improvement */
  keyDrivers: string[]
}

export interface DeepStarterReport extends ClaudeStarterReport {
  /** 2 paragraphs connecting deep answers to their pattern */
  deepInsight: string
  /** The single most impactful discovery from their deep answers */
  topTrigger: string
  topTriggerExplanation: string
  /** Where their score could realistically go with consistent effort */
  scoreProjection: ScoreProjection
  /** One sentence connecting their biggest finding to what membership tracking enables */
  membershipBridge: string
}

export interface DeepFullReport extends ClaudeFullReport {
  deepInsight: string
  /** How sleep / stress / exercise connect to their gut pillar scores */
  lifestyleConnection: string
  topTrigger: string
  topTriggerExplanation: string
  /** 5 foods chosen specifically for this person based on their deep answers */
  specificFoodList: Array<{
    food: string
    emoji: string
    /** References their actual answers — e.g. "Since you mentioned eating at your desk..." */
    whyForThem: string
    howToUse: string
  }>
  scoreProjection: ScoreProjection
  membershipBridge: string
}

export interface DeepPremiumReport extends ClaudePremiumReport {
  deepInsight: string
  lifestyleConnection: string
  /** Summary of the 3 gut-diagnostic question answers */
  gutDiagnosticSummary: string
  /** Cross-references symptom answers with pillar scores */
  symptomPattern: string
  topTrigger: string
  topTriggerExplanation: string
  specificFoodList: Array<{
    food: string
    emoji: string
    whyForThem: string
    howToUse: string
  }>
  scoreProjection: ScoreProjection
  membershipBridge: string
}

export type DeepReport = DeepStarterReport | DeepFullReport | DeepPremiumReport
