/**
 * The shared educational Food System report model.
 *
 * ── What this is for ─────────────────────────────────────────────────────────
 *
 * Reports today are a score plus prose plus a food list. The target described in
 * docs/assessment-report-improvement-brief-for-claude.md is a guided tour of the
 * reader's internal food ecosystem: teach the mechanism, then explain what their
 * answers suggest, then recommend. This model is the data contract for that —
 * one structure the web report and the PDF can both render, so the two cannot
 * drift into telling different stories.
 *
 * ── How it relates to DeepReport ─────────────────────────────────────────────
 *
 * It does NOT replace DeepReport. It hangs off it as an optional `foodSystem`
 * block (lib/claude-report.ts), because DeepReport is what paid-report-client,
 * lib/pdf/report-pdf and app/assessment/report all consume today. Replacing it
 * would force the web/PDF redesign, which is a later phase. Optional field means
 * existing renderers keep working untouched while the richer data starts being
 * captured — so by the time the redesign lands, real reports already carry it.
 *
 * ── Deriving vs generating ───────────────────────────────────────────────────
 *
 * Most of this is derivable from the assessment result rather than narrative:
 * bioticScores, strongest/priority pathway, visualTheme, the food-system map
 * states, the 30-day loop skeleton. Only the explanatory copy genuinely needs a
 * model. build-food-system-report.ts derives everything derivable and merges
 * generated narrative over it, so fallback and generated reports satisfy this
 * contract by construction rather than by hoping for eleven well-formed sections.
 *
 * ── Health language ──────────────────────────────────────────────────────────
 *
 * Every string field here is customer-facing and must stay educational and
 * non-diagnostic: "your answers suggest", "may support", "is associated with".
 * Never "you have", "this treats", "this reduces". The safety footer is not
 * optional and its wording is fixed — see SAFETY_FOOTER.
 */

import { z } from "zod"
import type { BioticKey, VisualAccent } from "./visual-token"
import type { BioticScoreKey } from "./subscores"

export type { BioticKey, BioticScoreKey, VisualAccent }

/** Which assessment produced the report. */
export type ReportMode = "you" | "family" | "mind" | "combined"

/**
 * How much the report can fairly claim to know.
 *
 * `snapshot` — one assessment, a single point in time. Most reports.
 * `pattern`  — repeat assessments, so a direction is visible.
 * `tracked`  — ongoing logging, so the report reflects behaviour not recall.
 *
 * This exists so the report can be honest about its own confidence rather than
 * presenting a single questionnaire as a settled picture.
 */
export type ReportConfidence = "snapshot" | "pattern" | "tracked"

export type BodyZone =
  | "gut"
  | "brain"
  | "energy"
  | "immune"
  | "sleep"
  | "whole-body"
  | "family-table"

export type VisualTokenType =
  | "biotic-capsule"
  | "body-zone"
  | "habit"
  | "food-group"
  | "family-rhythm"

/**
 * How a section should be rendered, without naming a raw colour.
 *
 * `accent` is a brand accent NAME, deliberately not a hex value: renderers
 * resolve it through accentFill/accentText (visual-token.ts), which is what
 * keeps readable text on the AA-safe -text variants. A model returning
 * "#A8E063" here would bypass that and reintroduce the contrast bug #187 fixed.
 */
export interface ReportVisualToken {
  type: VisualTokenType
  accent: VisualAccent
  /** A lucide-react export name, e.g. "Wheat". */
  iconName?: string
  assetPath?: string
  bodyZone?: BodyZone
}

/** A part of the system, and how it is currently doing. */
export interface FoodSystemNode {
  id: string
  label: string
  state: "strong" | "building" | "strained" | "unknown"
  score?: number
  explanation: string
  visualToken: ReportVisualToken
}

/**
 * One teaching unit. The field order is the argument order the brief asks for:
 * explain the thing, say why it matters, connect it to this reader's answers,
 * and only then bridge to an action.
 */
export interface EducationModule {
  title: string
  visualToken: ReportVisualToken
  plainEnglish: string
  whyItMatters: string
  whatYourAnswersSuggest: string
  actionBridge: string
}

/** A food framed as a system tool: what it does, and why it suits this reader. */
export interface ReportFoodTool {
  food: string
  biotic: BioticKey
  visualToken: ReportVisualToken
  mechanism: string
  whyForThisCustomer: string
  howToUse: string
  swap?: string
  familyAdaptation?: string
}

export interface EvidenceNote {
  claim: string
  sourceTitle: string
  sourceUrl: string
}

/**
 * The closing mission page headline. Fixed copy, fixed line breaks — it is the
 * brand's closing statement, not a field to paraphrase. Typed as a readonly
 * 4-tuple so a well-meaning edit to three or five lines fails to compile.
 */
export const CLOSING_HEADLINE_LINES = [
  "Build the Food System",
  "inside you",
  "- and help build the Food System",
  "around you.",
] as const

export type ClosingHeadlineLines = typeof CLOSING_HEADLINE_LINES

/**
 * Fixed, non-optional. EatoBiotics is educational and non-medical, and every
 * report has to say so in the same words — a footer that varies per report is a
 * footer nobody can rely on.
 */
export const SAFETY_FOOTER =
  "This report is educational and based on your food-pattern answers. It is not a " +
  "diagnosis, treatment plan, or substitute for medical advice. If you have a " +
  "medical condition, are pregnant, are immunocompromised, are making major diet " +
  "changes, or are concerned about symptoms, speak with a qualified health " +
  "professional."

export interface FoodSystemReport {
  mode: ReportMode
  title: string
  subtitle: string
  /** ISO 8601. */
  generatedAt: string
  confidence: ReportConfidence
  overallScore: number
  /** Three pathways only — "synbiotic" classifies a food, not a score. */
  bioticScores: Record<BioticScoreKey, number>

  /** Chapter 1 — the one-line story, before any detail. */
  systemSnapshot: {
    oneLine: string
    strongestPathway: BioticScoreKey
    priorityPathway: BioticScoreKey
    dominantPattern: string
    mainLever: string
  }

  visualTheme: {
    primaryAccent: VisualAccent
    bodyAssetPath: string
    gradient: VisualAccent[]
  }

  /** Chapter 2 — inputs → microbes → outputs → signals → next action. */
  foodSystemMap: FoodSystemNode[]
  /** Chapters 2–4 — teach before recommending. */
  educationModules: EducationModule[]
  /** Chapter 5 — body signals, phrased as food-pattern clues, never diagnoses. */
  bodySignalMap: FoodSystemNode[]
  /** Chapter 6 — the one thing to do first. */
  priorityLever: {
    title: string
    whyThisFirst: string
    firstStep: string
    whatToNotice: string
  }
  /** Chapter 7 — foods as tools, with mechanisms. */
  foodTools: ReportFoodTool[]
  /** Chapter 8 — four weeks, one focus each. */
  thirtyDayLoop: Array<{
    week: number
    focus: string
    action: string
    why: string
  }>
  /** Chapter 9 — only present for family reports. */
  familyContext?: {
    householdPattern: string
    constraints: string[]
    memberNotes: string[]
    sharedLever: string
  }
  /** Chapter 10 — inside-out. */
  closingMissionPage: {
    headlineLines: ClosingHeadlineLines
    insideYou: string
    aroundYou: string
    nextAction: string
    visualToken: ReportVisualToken
  }

  evidenceNotes: EvidenceNote[]
  safetyFooter: string
}

/* ── Validation ──────────────────────────────────────────────────────────────
 *
 * Claude output reached report_json through `JSON.parse(cleaned) as DeepReport`
 * — a bare cast, so a malformed or truncated response was persisted and later
 * rendered with no check at all. These schemas exist to close that.
 *
 * Note zod strips unknown keys by default. That is wanted here (a model adding
 * a stray field should not fail the report) but it also means every field this
 * app relies on MUST be listed — the same trap that silently dropped
 * moved/slept from twin-state sync. See lib/account/twin-state-schema.ts.
 */

const bioticKeySchema = z.enum(["prebiotics", "probiotics", "postbiotics", "synbiotic"])
const accentSchema = z.enum(["lime", "green", "teal", "yellow", "orange"])

export const visualTokenSchema = z.object({
  type: z.enum(["biotic-capsule", "body-zone", "habit", "food-group", "family-rhythm"]),
  accent: accentSchema,
  iconName: z.string().max(40).optional(),
  assetPath: z.string().max(200).optional(),
  bodyZone: z
    .enum(["gut", "brain", "energy", "immune", "sleep", "whole-body", "family-table"])
    .optional(),
})

const nodeSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  state: z.enum(["strong", "building", "strained", "unknown"]),
  score: z.number().min(0).max(100).optional(),
  explanation: z.string().min(1),
  visualToken: visualTokenSchema,
})

const educationModuleSchema = z.object({
  title: z.string().min(1).max(160),
  visualToken: visualTokenSchema,
  plainEnglish: z.string().min(1),
  whyItMatters: z.string().min(1),
  whatYourAnswersSuggest: z.string().min(1),
  actionBridge: z.string().min(1),
})

const foodToolSchema = z.object({
  food: z.string().min(1).max(120),
  biotic: bioticKeySchema,
  visualToken: visualTokenSchema,
  mechanism: z.string().min(1),
  whyForThisCustomer: z.string().min(1),
  howToUse: z.string().min(1),
  swap: z.string().optional(),
  familyAdaptation: z.string().optional(),
})

const scoreSchema = z.number().min(0).max(100)
const pathwaySchema = z.enum(["prebiotics", "probiotics", "postbiotics"])

export const foodSystemReportSchema = z.object({
  mode: z.enum(["you", "family", "mind", "combined"]),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300),
  generatedAt: z.string().min(1),
  confidence: z.enum(["snapshot", "pattern", "tracked"]),
  overallScore: scoreSchema,
  bioticScores: z.object({
    prebiotics: scoreSchema,
    probiotics: scoreSchema,
    postbiotics: scoreSchema,
  }),
  systemSnapshot: z.object({
    oneLine: z.string().min(1),
    strongestPathway: pathwaySchema,
    priorityPathway: pathwaySchema,
    dominantPattern: z.string().min(1),
    mainLever: z.string().min(1),
  }),
  visualTheme: z.object({
    primaryAccent: accentSchema,
    bodyAssetPath: z.string().min(1),
    gradient: z.array(accentSchema).min(1),
  }),
  foodSystemMap: z.array(nodeSchema).min(1),
  educationModules: z.array(educationModuleSchema).min(1),
  bodySignalMap: z.array(nodeSchema).min(1),
  priorityLever: z.object({
    title: z.string().min(1),
    whyThisFirst: z.string().min(1),
    firstStep: z.string().min(1),
    whatToNotice: z.string().min(1),
  }),
  foodTools: z.array(foodToolSchema).min(1),
  thirtyDayLoop: z
    .array(
      z.object({
        week: z.number().int().min(1).max(4),
        focus: z.string().min(1),
        action: z.string().min(1),
        why: z.string().min(1),
      }),
    )
    .length(4),
  familyContext: z
    .object({
      householdPattern: z.string().min(1),
      constraints: z.array(z.string()),
      memberNotes: z.array(z.string()),
      sharedLever: z.string().min(1),
    })
    .optional(),
  closingMissionPage: z.object({
    // Pinned to the exact four lines. A model paraphrasing the brand's closing
    // statement fails validation rather than shipping its own version.
    headlineLines: z.tuple([
      z.literal(CLOSING_HEADLINE_LINES[0]),
      z.literal(CLOSING_HEADLINE_LINES[1]),
      z.literal(CLOSING_HEADLINE_LINES[2]),
      z.literal(CLOSING_HEADLINE_LINES[3]),
    ]),
    insideYou: z.string().min(1),
    aroundYou: z.string().min(1),
    nextAction: z.string().min(1),
    visualToken: visualTokenSchema,
  }),
  evidenceNotes: z.array(
    z.object({
      claim: z.string().min(1),
      sourceTitle: z.string().min(1),
      sourceUrl: z.string().url(),
    }),
  ),
  safetyFooter: z.string().min(1),
})

export type ValidatedFoodSystemReport = z.infer<typeof foodSystemReportSchema>

/** Returns the report when valid, or null — callers fall back rather than throw. */
export function parseFoodSystemReport(value: unknown): FoodSystemReport | null {
  const result = foodSystemReportSchema.safeParse(value)
  if (!result.success) return null
  // The zod shape mirrors FoodSystemReport field for field; the cast bridges
  // zod's inferred tuple/enum literals to the declared interface.
  return result.data as unknown as FoodSystemReport
}
