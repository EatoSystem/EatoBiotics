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
import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"

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
  /*
   * 0R-6R · `state` and `score` are gone. See the block above the report
   * interface. A node is now a label, a reviewed explanation and a token —
   * which is what a body signal honestly is, and all a pathway node could
   * honestly be.
   */
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
  /*
   * 0R-6R · `whatYourAnswersSuggest` is gone. It was
   * `BAND_SUGGESTS[pathway][band(score)]` — a possessive sentence about this
   * member's state in one Biotic, rendered under the label "What your answers
   * suggest" on the web and in the PDF. The other three fields are general
   * education and are untouched.
   */
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
 * A lens citation.
 *
 * Deliberately richer than `EvidenceNote` above, and deliberately separate from
 * it. The core report's notes are a claim and a source; a lens note additionally
 * carries the publishing body, the year, and — the field that matters most —
 * an explicit `limitation`.
 *
 * The limitation is not a disclaimer bolted on afterwards. Every source in this
 * product sits next to a statement about someone's body, and the honest gap
 * between "population evidence exists" and "this applies to you" is exactly
 * where a reader is most likely to over-read. Printing what a source does NOT
 * show, beside what it does, is the only way a citation makes a paid report
 * more trustworthy rather than merely more decorated.
 *
 * `EvidenceNote` is left untouched: it is consumed by the core report in
 * components/report/food-system-section.tsx and lib/pdf/food-system-pdf.tsx.
 */
export interface LensEvidenceNote {
  title: string
  /** Publishing body or journal. */
  organisation: string
  /** Free text — "2017, reviewed 2025" is as valid as "2019". */
  year: string
  url: string
  /** What this source actually supports, in the lens's context. */
  whatItSupports: string
  /** What it does not show. Rendered to the customer, never omitted. */
  limitation: string
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

/**
 * The lens chapter a purchased add-on produces.
 *
 * ── What this is not ─────────────────────────────────────────────────────────
 *
 * There is deliberately no score here. Inventing a "Stability Score" or a
 * "Mind Score" out of four questionnaire answers would make the chapter look
 * more personalised while being less honest: nothing in the assessment
 * validates such a number, and once printed it would be read as a measurement.
 * The lens interprets a pattern; it does not grade one.
 *
 * The core Feed/Seed/Heal scores are read here, never written. A lens explains
 * how its area connects to those three pathways — it cannot move them.
 */
export interface FoodSystemLens {
  /** Canonical add-on key. */
  key: AddonType
  /** Customer-facing name, e.g. "The Mind Food System". */
  name: string
  /** Short label for headers, e.g. "Mind". */
  shortLabel: string
  /** What this lens examines — fixed per add-on, not generated. */
  examines: string
  /** Answer-linked summary of what their responses describe. */
  patternSummary: string
  /** How this lens connects to each of the three pathways. */
  pathwayConnections: Array<{
    pathway: BioticScoreKey
    connection: string
  }>
  /** 2–3 things worth noticing. Observations, never diagnoses. */
  signals: Array<{ label: string; whatToNotice: string }>
  /*
   * 0R-6R · `pathway` is gone.
   *
   * This field's own docstring said "derived from the priority pathway", which
   * is the core report's argmin — printed by `lens-section.tsx:99` and by the
   * PDF as "Where it matters most: Prebiotics". `pathwayConnections` above is
   * untouched: it connects the lens to all three symmetrically, which is
   * education, and the prohibited thing was singling one out as this reader's.
   */
  priorityConnection: {
    why: string
  }
  /**
   * 2–3 actions expressed as additions to the EXISTING 30-day loop, by week.
   * Not a second plan: a lens that issued its own competing schedule would
   * leave the reader with two calendars and no idea which to follow.
   */
  loopAdditions: Array<{ week: number; action: string }>
  /**
   * At least two verified sources, each with its own limitation. Required
   * whenever a lens exists — a lens chapter making health-adjacent statements
   * with no citation is exactly what the evidence contract exists to prevent.
   */
  evidenceNotes: LensEvidenceNote[]
  /** Fixed per-add-on safety wording. Never model-generated, never paraphrased. */
  safetyNote: string
  /** Accent token, reused from the system's own branding. */
  accent: string
}

/* ═══════════════════════════════════════════════════════════════════════════
   0R-6R · `P0-SCIENCE-07` AND `P0-SCIENCE-06` ARE CLOSED AT THIS BOUNDARY.

   This file is the product model five surfaces read: the web section, both
   PDFs, the fallback report, the add-on lens and the AI merge. While it carried
   three per-Biotic numbers and three band states, removing them from two
   renderers would have been a decision not to show today what the model still
   asserted exists.

       IF A PRODUCT TYPE SAYS A PERSONAL CONSTRUCT EXISTS, EVERY DOWNSTREAM
       CONSUMER IS INVITED TO TREAT IT AS TRUTH.

   ── WHAT LEFT THE CONTRACT, AND WHAT IT WAS RENDERING ──────────────────────

     bioticScores                three numerals "71/100" in food-system-section
                                 (PathwayScores) and on the body figure in both
                                 PDFs, each in that Biotic's colour.
     FoodSystemNode.state        a band word per Biotic — "Well supported",
                                 "Room to grow" — coloured by STATE_ACCENT, on
                                 the web NodeCard, the PDF node cards and the
                                 ring around the figure of the member's body.
     FoodSystemNode.score        "{node.score}/100" beside it.
     EducationModule
       .whatYourAnswersSuggest   BAND_SUGGESTS[pathway][band(score)] — possessive
                                 per-Biotic prose under "What your answers
                                 suggest".
     systemSnapshot
       .strongestPathway         the argmax, and
       .priorityPathway          the argmin, over three unmeasured scores. They
                                 chose the snapshot sentence, the main lever,
                                 the accent colour, the five foods, the priority
                                 chapter and all four weeks of the 30-day loop.

   `bodySignalMap` kept its nodes and lost the same two fields: its `state` was
   `BAND_STATE[band(biotics[driver])]`, so four body signals each exposed the
   band of a driver Biotic and the set reconstructed the triple. The test
   applied to every field was: WOULD THIS ALLOW A DOWNSTREAM CONSUMER TO
   RECONSTRUCT OR ASSERT A PERSONAL BIOTIC STATE?

   ── WHAT THE REPORT MAY STILL CARRY ───────────────────────────────────────

   `overallScore` — the Biotics Score™, which is the product EatoBiotics
   actually sells — observable food-system facts, reviewed general Three-Biotics
   education (`plainEnglish`, `whyItMatters`, `actionBridge`), non-ranked
   actions, and taxonomy keys used only to organise reviewed material.

   ── AND WHY NOTHING REPLACED THE SELECTOR ─────────────────────────────────

   No authorised selector exists: the FSS-v1 weights refuse to score outside a
   DEV_ONLY fixture context, and the deterministic Report core is pre-activation.
   `PILLAR_BEHAVIOUR` would have supplied a safer LABEL for the same argmin, and
   that was refused — A SAFER LABEL DOES NOT LEGITIMISE AN UNSUPPORTED SELECTOR.
   Personalised priority may return when a reviewed decision rule exists over a
   construct the product is entitled to rank.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface FoodSystemReport {
  mode: ReportMode
  title: string
  subtitle: string
  /** ISO 8601. */
  generatedAt: string
  confidence: ReportConfidence
  /** The Biotics Score™ — one whole-system figure, and the product sold. */
  overallScore: number

  /** Chapter 1 — the one-line story, before any detail. */
  systemSnapshot: {
    oneLine: string
    dominantPattern: string
    mainLever: string
  }

  visualTheme: {
    primaryAccent: VisualAccent
    bodyAssetPath: string
    gradient: VisualAccent[]
  }

  /*
   * 0R-6R · `foodSystemMap` is gone.
   *
   * It held the three pathway nodes — Chapter 2, "Your Food System, Part by
   * Part — where each pathway stands right now" — and every field that made a
   * node worth rendering was the prohibited construct: a per-Biotic band, a
   * per-Biotic score, and `BAND_SUGGESTS[pathway][band]`.
   *
   * It is removed rather than left as an always-empty array. An empty array is
   * a field waiting to be filled, and the schema's own `.min(1)` said what the
   * contract expected — which is how emptying it was caught.
   */
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
  /**
   * Chapter 9b — the purchased add-on's lens. Present only when a lens was
   * bought, so every report that predates add-ons, and every report bought
   * without one, is unchanged.
   *
   * Placed after the 30-day loop and before evidence/closing: it is a lens ON
   * the food system, so it has to come after the system has been explained, and
   * the mission page stays last.
   */
  lens?: FoodSystemLens

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
  explanation: z.string().min(1),
  visualToken: visualTokenSchema,
})

const educationModuleSchema = z.object({
  title: z.string().min(1).max(160),
  visualToken: visualTokenSchema,
  plainEnglish: z.string().min(1),
  whyItMatters: z.string().min(1),
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

const evidenceNoteSchema = z.object({
  claim: z.string().min(1),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
})

const lensEvidenceNoteSchema = z.object({
  title: z.string().min(10),
  organisation: z.string().min(3),
  year: z.string().min(4),
  url: z.string().url(),
  whatItSupports: z.string().min(40),
  // Enforced as substantial: a one-word limitation would satisfy the shape
  // while defeating the point of having the field.
  limitation: z.string().min(40),
})

export const foodSystemReportSchema = z.object({
  mode: z.enum(["you", "family", "mind", "combined"]),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300),
  generatedAt: z.string().min(1),
  confidence: z.enum(["snapshot", "pattern", "tracked"]),
  overallScore: scoreSchema,
  systemSnapshot: z.object({
    oneLine: z.string().min(1),
    dominantPattern: z.string().min(1),
    mainLever: z.string().min(1),
  }),
  visualTheme: z.object({
    primaryAccent: accentSchema,
    bodyAssetPath: z.string().min(1),
    gradient: z.array(accentSchema).min(1),
  }),
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
  evidenceNotes: z.array(evidenceNoteSchema),
  safetyFooter: z.string().min(1),

  /**
   * Optional so that every report predating add-ons — and every report bought
   * without one — validates exactly as before.
   *
   * When it IS present the bar is high: empty strings, an empty pathway list,
   * no signals, no actions or no evidence all fail. A lens chapter that renders
   * as blank headings is worse than no chapter, because the customer paid for
   * it, so "present but hollow" must not validate.
   */
  lens: z
    .object({
      key: z.enum(ADDON_KEYS as unknown as [AddonType, ...AddonType[]]),
      name: z.string().min(1),
      shortLabel: z.string().min(1),
      examines: z.string().min(20),
      patternSummary: z.string().min(40),
      pathwayConnections: z
        .array(z.object({ pathway: pathwaySchema, connection: z.string().min(20) }))
        .min(1),
      signals: z
        .array(z.object({ label: z.string().min(1), whatToNotice: z.string().min(20) }))
        .min(2)
        .max(3),
      priorityConnection: z.object({ why: z.string().min(20) }),
      loopAdditions: z
        .array(z.object({ week: z.number().int().min(1).max(4), action: z.string().min(20) }))
        .min(2)
        .max(3),
      // Required, and at least two. The lens is optional as a whole; a lens
      // that exists without evidence is not.
      evidenceNotes: z.array(lensEvidenceNoteSchema).min(2),
      safetyNote: z.string().min(20),
      accent: z.string().min(1),
    })
    .optional(),
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
