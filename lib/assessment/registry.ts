/**
 * lib/assessment/registry.ts — the bridge between the new foundation→add-on
 * journey and the six existing (independent, localStorage-based) assessments.
 *
 * Each assessment keeps its own storage + scoring untouched. This module reads
 * each one's localStorage record and normalises it into a single `AssessmentSummary`
 * so the journey can detect completion and the combined report can compose them.
 * Read-only: it never writes to the underlying assessment stores.
 */

import { GLUCOSE_PILLAR_IDS } from "@/lib/glucose-assessment-data"
import { computeGlucoseResult } from "@/lib/glucose-assessment-scoring"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { StabilityAssessment } from "@/lib/stability/types"

export type FoundationKey = "you" | "family"
export type AddonKey = "stability" | "glucose" | "mind" | "performance"
export type AssessmentKey = FoundationKey | AddonKey

export interface AssessmentSummary {
  key: AssessmentKey
  kind: "foundation" | "addon"
  label: string // "You", "Family", "Stability", …
  scoreLabel: string // "Food System Score", "Stability Score", …
  score: number // 0–100
  bandLabel: string // profile type / band, e.g. "Strong Foundation"
  bandDescription?: string
  strengths: string[]
  priorities: string[]
  sevenDay: string[]
  thirtyDay?: string[]
}

export interface AssessmentMeta {
  key: AssessmentKey
  kind: "foundation" | "addon"
  label: string
  /** User-facing route that runs this assessment. */
  route: string
}

export const FOUNDATIONS: Record<FoundationKey, AssessmentMeta> = {
  you: { key: "you", kind: "foundation", label: "You", route: "/assessment/you" },
  family: { key: "family", kind: "foundation", label: "Family", route: "/assessment/family" },
}

export const ADDONS: Record<AddonKey, AssessmentMeta> = {
  stability: { key: "stability", kind: "addon", label: "Stability", route: "/stability/assessment" },
  glucose: { key: "glucose", kind: "addon", label: "Glucose", route: "/glucose/assessment" },
  mind: { key: "mind", kind: "addon", label: "Mind", route: "/assessment-mind" },
  performance: { key: "performance", kind: "addon", label: "Performance", route: "/performance-assessment" },
}

export const ADDON_KEYS: AddonKey[] = ["stability", "glucose", "mind", "performance"]
export function isAddonKey(v: string): v is AddonKey {
  return (ADDON_KEYS as string[]).includes(v)
}

/* ── localStorage keys of the six existing assessments ─────────────────────── */
const LS = {
  you: "eatobiotics-assessment",
  family: "eatobiotics-family-assessment",
  mind: "eatobiotics-mind-assessment",
  stability: "eb_stability_assessment_v1",
  glucose: "eatobetics-glucose-assessment",
  performance: "performance-assessment",
} as const

function readLS<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/* ── Adapters: existing record → normalised summary (or null if incomplete) ── */

type ResultStateLike = { result?: AssessmentResult | null }

function fromAssessmentResult(
  key: AssessmentKey,
  kind: "foundation" | "addon",
  label: string,
  scoreLabel: string,
  r: AssessmentResult,
): AssessmentSummary {
  return {
    key,
    kind,
    label,
    scoreLabel,
    score: r.overall,
    bandLabel: r.profile.type,
    bandDescription: r.profile.description,
    strengths: r.insights.filter((i) => i.strength).map((i) => i.label),
    priorities: r.insights.filter((i) => i.opportunity).map((i) => i.label),
    sevenDay: r.nextActions,
  }
}

function youSummary(): AssessmentSummary | null {
  const r = readLS<ResultStateLike>(LS.you)?.result
  return r ? fromAssessmentResult("you", "foundation", "You", "Food System Score", r) : null
}

function familySummary(): AssessmentSummary | null {
  const r = readLS<ResultStateLike>(LS.family)?.result
  return r ? fromAssessmentResult("family", "foundation", "Family", "Family Food System Score", r) : null
}

function mindSummary(): AssessmentSummary | null {
  const r = readLS<ResultStateLike>(LS.mind)?.result
  return r ? fromAssessmentResult("mind", "addon", "Mind", "Mind Score", r) : null
}

function stabilitySummary(): AssessmentSummary | null {
  const a = readLS<StabilityAssessment>(LS.stability)
  if (!a?.score) return null
  const s = a.score
  return {
    key: "stability",
    kind: "addon",
    label: "Stability",
    scoreLabel: "Stability Score",
    score: s.totalScore,
    bandLabel: s.band,
    strengths: s.positiveFactors ?? [],
    priorities: s.topRiskFactors ?? [],
    sevenDay: s.recommendedNextSteps ?? [],
  }
}

function glucoseSummary(): AssessmentSummary | null {
  const saved = readLS<{ answers?: Record<string, number> }>(LS.glucose)
  const answers = saved?.answers
  if (!answers) return null
  const allIds = (Object.values(GLUCOSE_PILLAR_IDS) as string[][]).flat()
  if (!allIds.every((id) => typeof answers[id] === "number")) return null
  const r = computeGlucoseResult(answers)
  return {
    key: "glucose",
    kind: "addon",
    label: "Glucose",
    scoreLabel: "Glucose Score",
    score: r.overall,
    bandLabel: r.profile.type,
    bandDescription: r.profile.description,
    strengths: r.insights.filter((i) => i.strength).map((i) => i.label),
    priorities: r.insights.filter((i) => i.opportunity).map((i) => i.label),
    sevenDay: r.nextActions,
    thirtyDay: r.protocol.map((w) => `${w.title}: ${w.body}`),
  }
}

// Performance scoring is inline in its client; replicate the (small, stable)
// computation from stored answers so this stays read-only.
const PERF_PILLARS: Record<string, { label: string; ids: string[]; action: string }> = {
  energy: { label: "Energy", ids: ["e1", "e2", "e3"], action: "Anchor steady daily fuel: a balanced breakfast and even meal spacing to keep energy consistent." },
  build: { label: "Build", ids: ["b1", "b2", "b3"], action: "Support strength: a palm of protein at each main meal and regular resistance movement." },
  recovery: { label: "Recovery", ids: ["r1", "r2", "r3"], action: "Protect recovery: hydration, a consistent sleep window, and food around your training." },
  protection: { label: "Protection", ids: ["p1", "p2", "p3"], action: "Add colour and variety — polyphenol-rich plants that support resilience and output." },
}

function perfProfile(overall: number): string {
  if (overall >= 75) return "Performance-Optimised"
  if (overall >= 58) return "Strong Foundation"
  if (overall >= 42) return "Developing System"
  if (overall >= 28) return "Inconsistent Fuelling"
  return "Early Performance Builder"
}

function performanceSummary(): AssessmentSummary | null {
  const saved = readLS<{ answers?: Record<string, number> }>(LS.performance)
  const answers = saved?.answers
  if (!answers) return null
  const ids = Object.values(PERF_PILLARS).flatMap((p) => p.ids)
  if (!ids.every((id) => typeof answers[id] === "number")) return null
  const sub = Object.fromEntries(
    Object.entries(PERF_PILLARS).map(([k, p]) => {
      const raw = p.ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0)
      return [k, Math.round((raw / (p.ids.length * 3)) * 100)]
    }),
  ) as Record<string, number>
  const floored = Object.values(sub).map((s) => Math.max(s, 25))
  const overall = Math.round(floored.reduce((a, b) => a + b, 0) / floored.length)
  const ordered = Object.entries(PERF_PILLARS).sort((a, b) => sub[a[0]] - sub[b[0]])
  return {
    key: "performance",
    kind: "addon",
    label: "Performance",
    scoreLabel: "Performance Score",
    score: overall,
    bandLabel: perfProfile(overall),
    strengths: ordered.filter(([k]) => sub[k] >= 58).map(([, p]) => p.label),
    priorities: ordered.filter(([k]) => sub[k] < 58).map(([, p]) => p.label),
    sevenDay: ordered.filter(([k]) => sub[k] < 58).slice(0, 3).map(([, p]) => p.action),
  }
}

const SUMMARY_FNS: Record<AssessmentKey, () => AssessmentSummary | null> = {
  you: youSummary,
  family: familySummary,
  mind: mindSummary,
  stability: stabilitySummary,
  glucose: glucoseSummary,
  performance: performanceSummary,
}

/** Normalised summary for one assessment, or null if not completed. */
export function getSummary(key: AssessmentKey): AssessmentSummary | null {
  return SUMMARY_FNS[key]()
}

/** True once the underlying assessment has a usable result in localStorage. */
export function isComplete(key: AssessmentKey): boolean {
  return getSummary(key) !== null
}
