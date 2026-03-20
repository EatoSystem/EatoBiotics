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
