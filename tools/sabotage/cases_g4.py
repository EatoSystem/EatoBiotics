# GATE 4 — MY FOOD SYSTEM. Cases 1200+.
#
# Numbered from 1200 rather than 1100: cases_s7b already holds 1100 and 1101
# (the Gate 3.7 additions for the permanent product rule). The suites run
# separately so a collision breaks nothing, but two cases sharing a number is
# exactly the ambiguity the anchor audit exists to remove, one level up.
#
# The invariants under test, in the order the gate argues them:
#
#   a SELECTION is a decision, written down and read back — never re-made;
#   the policy version and the catalogue version are separate anchors;
#   the review cadence resolves through the POLICY, not the catalogue;
#   `system.current` is written LAST, after validation;
#   a strict write reports failure; the lenient one is for the assessment only;
#   validation REFUSES and never repairs;
#   the composer is pure and re-exports nothing;
#   a stored record holds ids and versions, never prose;
#   Biotics is handed nothing;
#   Progress holds no second score and moves no number;
#   an unresolvable action is rendered, not hidden;
#   there are exactly seven sections, and Today is the landing;
#   `toAiContext` has a shape and no caller.
#
# ── A NOTE ON WHAT CANNOT BE COVERED HERE ────────────────────────────────────
#
# This harness mutates source and runs vitest. A property that only exists once
# a page is RENDERED cannot be covered by it — Playwright serves a prebuilt
# .next that the mutation never reaches, so a rendered property would report
# SLIPPED whatever happened. That lesson is recorded at the top of cases_s7b.py
# (case 945, which reported caught for its whole life while proving nothing).
#
# So the Today screen's six-line restraint, the tab bar, and the no-overflow
# measurements are Playwright's job in tests/e2e/my-food-system.spec.ts, and
# they are deliberately absent from this file rather than faked into it.

REPO = "lib/fss/persistence/repository.ts"
LOCAL = "lib/fss/persistence/local.ts"
COMPOSE = "lib/fss/system/compose.ts"
DECISIONS = "lib/fss/system/decisions.ts"
ESTABLISH = "lib/fss/system/establish.ts"
REVIEW = "lib/fss/system/review.ts"
VALIDATE = "lib/fss/system/validate.ts"
VERSION = "lib/fss/system/version.ts"
SECTIONS = "lib/fss/system/sections.ts"
AICTX = "lib/fss/system/ai-context.ts"
LOAD = "lib/fss/system/load.ts"
RESULT = "components/fss/candidate-result.tsx"
BIOTICS_TSX = "components/fss/system/biotics.tsx"

SYSTEM = ["tests/unit/my-food-system.test.ts"]
PERSIST = ["tests/unit/fss-persistence.test.ts"]
PRIORITY = ["tests/unit/fss-priority.test.ts"]
BOTH = SYSTEM + PERSIST

CASES = [
    # ── A · a selection is a decision ───────────────────────────────────────
    #
    # The case this whole gate exists for. The composer re-selects instead of
    # reading what was recorded, so reopening an old Food System silently shows
    # today's priority — with the person's own completed actions hanging off a
    # plan they were never given.
    (1200, "the composer re-selects the priority instead of loading the decision", COMPOSE,
     "  const priorities = resolvePriorityDecision({ decision: priorityDecision, score, set, answers })",
     "  const priorities = { state: \"resolved\" as const, priorities: resolvePriorities({ score: score as never, set, answers }) }",
     SYSTEM + PERSIST),

    (1201, "a moved policy version silently substitutes today's reasoning", DECISIONS,
     "  if (!isCurrentSystemModel(decision.systemModelVersion)) {\n    return refuse(\"policy-version-moved\")\n  }",
     "  if (false) {\n    return refuse(\"policy-version-moved\")\n  }",
     SYSTEM),

    (1202, "a moved catalogue version silently shows today's wording", DECISIONS,
     '  if (decision.actionSetVersion !== ACTION_SET_VERSION) return refuse("content-version-moved")',
     '  if (false) return refuse("content-version-moved")',
     SYSTEM),

    (1203, "a withdrawn entry falls back to another catalogue entry", DECISIONS,
     '    if (!entry) return refuse("entry-withdrawn")',
     "    if (!entry) return bindRecommendation(ACTION_CATALOGUE[0], priorities[0], provenance)",
     SYSTEM),

    (1204, "the recorded priority id is ignored in favour of the domain", DECISIONS,
     '    if (s.priorityId !== priorityIdFor(s.sourceDomain)) return refuse("decision-inconsistent")',
     '    if (false) return refuse("decision-inconsistent")',
     SYSTEM),

    # An unresolvable priority with a resolved plan: the plan's reasoning is
    # missing, and it is presented as complete.
    (1205, "a plan resolves even though its priorities could not be explained", COMPOSE,
     "  const plan =\n    priorities.state === \"resolved\"",
     "  const plan =\n    priorities.state !== \"__never__\"",
     SYSTEM),

    # ── B · the two version anchors ─────────────────────────────────────────
    (1206, "the policy anchor is collapsed into the catalogue version", VERSION,
     'export const SYSTEM_MODEL_VERSION = "system-model-v1.0" as const',
     'export const SYSTEM_MODEL_VERSION = "actions-v1.0" as const',
     SYSTEM + PERSIST),

    (1207, "the review cadence is hung on the catalogue version instead", REVIEW,
     "  if (!isCurrentSystemModel(args.systemModelVersion)) {",
     "  if (args.systemModelVersion !== ACTION_SET_VERSION) {",
     SYSTEM),

    (1208, "a moved policy still produces a review date, from today's cadence", REVIEW,
     "    return {\n      state: \"unresolvable\",\n      setUnderVersion: args.systemModelVersion,\n      comparabilityRule: COMPARISON_LANGUAGE.rule,\n    }",
     "    return {\n      state: \"set\",\n      dueAt: addDays(args.establishedAt, REASSESSMENT.afterDays),\n      afterDays: REASSESSMENT.afterDays,\n      setUnderVersion: args.systemModelVersion,\n      whatItCompares: REASSESSMENT.whatItCompares,\n      comparabilityRule: REASSESSMENT.comparabilityRule,\n    }",
     SYSTEM),

    # The Gate 3.5 defect, reintroduced: past tense to somebody with one result.
    (1209, "the review point asserts a change that has not happened", REVIEW,
     "      comparabilityRule: COMPARISON_LANGUAGE.rule,",
     "      comparabilityRule: COMPARISON_LANGUAGE.methodChanged,",
     SYSTEM),

    # ── C · system.current is the commit point ──────────────────────────────
    #
    # The pointer written before the records. Everything still works, right up
    # until a write fails and a half-created system is already current.
    (1210, "the pointer is written first, before anything it points at", ESTABLISH,
     "  /* ── 2-5 · every write strict, each step reporting its own number ─────── */",
     "  await repo.setCurrentSystem(systemId)\n\n  /* ── 2-5 · every write strict, each step reporting its own number ─────── */",
     PERSIST),

    (1211, "the pointer is written before validation rather than after", ESTABLISH,
     "  /* ── 6 · validate before committing, not after ────────────────────────── */",
     "  await repo.setCurrentSystem(systemId)\n\n  /* ── 6 · validate before committing, not after ────────────────────────── */",
     PERSIST),

    (1212, "a failed validation no longer stops the commit", ESTABLISH,
     '  if (!verdict.ok) {\n    return { ok: false, failure: { step: 6, reason: "validation-failed", failed: verdict.failed } }\n  }',
     "  if (false) {\n    return { ok: false, failure: { step: 6, reason: \"validation-failed\", failed: \"score-missing\" } }\n  }",
     # TEST LIST CORRECTED: establishment is exercised in the system suite, not
     # the persistence one. The case slipped because it named the wrong tests,
     # which is a defect in the case's aim rather than in what it is aiming at.
     BOTH),

    # ── D · two write behaviours, named apart ───────────────────────────────
    (1213, "the strict write swallows its failure like the lenient one", LOCAL,
     "  } catch (cause) {\n    throw new RepositoryWriteFailed(key, cause)\n  }",
     "  } catch {\n    // swallowed\n  }",
     PERSIST),

    (1214, "a server-side strict write silently does nothing", LOCAL,
     '  if (typeof window === "undefined") {\n    throw new RepositoryWriteFailed(key, "no window — this write only happens in the browser")\n  }',
     '  if (typeof window === "undefined") {\n    return\n  }',
     PERSIST),

    (1215, "the establishment path uses the lenient write for the score", LOCAL,
     "  async saveScore(score: StoredScore): Promise<void> {\n    writeStrict(`score.${score.id}`, score)",
     "  async saveScore(score: StoredScore): Promise<void> {\n    write(`score.${score.id}`, score)",
     PERSIST),

    # ── E · validation refuses, never repairs ───────────────────────────────
    (1216, "validation accepts a dangling score reference", VALIDATE,
     "    system.assessmentId !== assessment.id ||\n    system.scoreId !== score.id ||",
     "    system.assessmentId !== assessment.id ||\n    false ||",
     SYSTEM),

    (1217, "validation accepts a score with no usable provenance", VALIDATE,
     '  if (!provenanceWellFormed(score.provenance)) return fail("provenance-malformed")',
     '  if (false) return fail("provenance-malformed")',
     SYSTEM),

    (1218, "validation treats a legacy-unversioned provenance as malformed", VALIDATE,
     "  return fields.every((v) => typeof v === \"string\" && v.trim().length > 0)",
     "  return fields.every((v) => typeof v === \"string\" && v.trim().length > 0 && v !== \"legacy-unversioned\")",
     SYSTEM),

    (1219, "a failed read clears the pointer, destroying the Food System", LOAD,
     '  if (!verdict.ok) return { state: "unavailable", failed: verdict.failed, systemId }',
     '  if (!verdict.ok) {\n    await repo.clearCurrentSystem()\n    return { state: "unavailable", failed: verdict.failed, systemId }\n  }',
     SYSTEM),

    (1220, "a missing system record is reported as a missing assessment", LOAD,
     '  if (!system) return { state: "unavailable", failed: "system-record-missing", systemId }',
     '  if (!system) return { state: "unavailable", failed: "assessment-missing", systemId }',
     SYSTEM),

    # ── F · the composer is pure, and re-exports nothing ────────────────────
    (1221, "the composer re-exports the score as a convenience field", COMPOSE,
     "    scoreId: score.id,\n    score,",
     "    scoreId: score.id,\n    score,\n    scoreValue: score.score,",
     SYSTEM),

    (1222, "the composer reads a clock", COMPOSE,
     "    review: resolveReviewPoint({\n      establishedAt: system.establishedAt,",
     "    review: resolveReviewPoint({\n      establishedAt: new Date().toISOString() || system.establishedAt,",
     SYSTEM),

    # ── G · a stored record holds no prose ──────────────────────────────────
    (1223, "the priority decision stores the headline it was explained with", DECISIONS,
     "    selected: args.priorities.map((p, rank) => ({\n      priorityId: p.id,\n      sourceDomain: p.sourceDomain,\n      rank,\n    })),",
     "    selected: args.priorities.map((p, rank) => ({\n      priorityId: p.id,\n      sourceDomain: p.sourceDomain,\n      rank,\n      headline: p.headline,\n    })),",
     PERSIST),

    (1224, "the plan decision stores the action's practical wording", DECISIONS,
     "    todayRecommendationId: plan.today?.id ?? null,",
     "    todayRecommendationId: plan.today?.id ?? null,\n    todayPracticalAction: plan.today?.practicalAction ?? null,",
     PERSIST),

    # ── H · human state ─────────────────────────────────────────────────────
    (1225, "a fourth action state is added", REPO,
     'export type ActionState = "planned" | "done" | "skipped"',
     'export type ActionState = "planned" | "done" | "skipped" | "accepted"',
     BOTH),

    (1226, "a terminal state is made irreversible", "lib/fss/system/actions.ts",
     "  const target = existing.find((a) => a.id === actionId)\n  if (!target) return { ok: false, reason: \"action-not-found\" }",
     "  const target = existing.find((a) => a.id === actionId)\n  if (!target) return { ok: false, reason: \"action-not-found\" }\n  if (target.state === \"done\") return { ok: true, actions: existing }",
     SYSTEM),

    (1227, "an unresolvable action is dropped instead of rendered", COMPOSE,
     "  const resolvedActions: readonly ResolvedAction[] = actions\n    .slice()",
     "  const resolvedActions: readonly ResolvedAction[] = actions\n    .filter((a) => resolveStoredAction(a).state === \"resolved\")\n    .slice()",
     SYSTEM),

    (1228, "a ResolvedAction gains an outcome field", "lib/fss/system/types.ts",
     "  /** The reviewed content, looked up by id and version — or the refusal. */\n  readonly content: StoredActionResolution\n}",
     "  /** The reviewed content, looked up by id and version — or the refusal. */\n  readonly content: StoredActionResolution\n  readonly improvement: string\n}",
     SYSTEM),

    # ── I · Progress claims nothing ─────────────────────────────────────────
    (1229, "Progress is handed the score, so a comparison becomes possible", SECTIONS,
     "  select: (system) => ({ progress: system.progress, review: system.review }),",
     "  select: (system) => ({ progress: system.progress, review: system.review, score: system.score }),",
     SYSTEM),

    (1230, "a second score becomes representable without Gate 5 saying so", "lib/fss/system/types.ts",
     "  readonly scoresAvailable: 1",
     "  readonly scoresAvailable: number",
     SYSTEM),

    (1231, "marking an action done moves a number in Progress", COMPOSE,
     "    baselineEstablishedAt: system.establishedAt,\n    scoresAvailable: system.previousSystemId === null ? 1 : 2,",
     "    baselineEstablishedAt: system.establishedAt,\n    scoresAvailable: 1,\n    adjusted: (score.score ?? 0) + actions.filter((a) => a.state === \"done\").length,",
     SYSTEM),

    # ── J · the sections ────────────────────────────────────────────────────
    #
    # Biotics handed the aggregate. The permanent product rule has been broken
    # four times in four forms; this is the form a composition layer makes
    # available.
    (1232, "the Biotics section is handed the whole aggregate", SECTIONS,
     "  /** Nothing. See the header. */\n  select: () => null,",
     "  select: (system) => system as never,",
     SYSTEM),

    (1233, "the Biotics component takes a slice it could render", BIOTICS_TSX,
     "export function BioticsSection() {",
     "export function BioticsSection({ score }: { score?: number }) {\n  void score",
     SYSTEM),

    (1234, "an eighth section is added to the navigation", "lib/fss/presentation/system.ts",
     'export type SectionId = "today" | "score" | "my-food" | "biotics" | "my-plan" | "progress" | "learn"',
     'export type SectionId = "today" | "score" | "my-food" | "biotics" | "my-plan" | "progress" | "learn" | "insights"',
     SYSTEM),

    (1235, "Today stops being the default landing", "lib/fss/presentation/system.ts",
     'export const DEFAULT_SECTION: SectionId = "today"',
     'export const DEFAULT_SECTION: SectionId = "score"',
     SYSTEM),

    (1236, "Learn is handed the score alongside its domains", SECTIONS,
     "  select: (system) => ({\n    domains:\n      system.priorities.state === \"resolved\"",
     "  select: (system) => ({\n    score: system.score.score,\n    domains:\n      system.priorities.state === \"resolved\"",
     SYSTEM),

    # ── K · the AI interface ────────────────────────────────────────────────
    (1237, "the AI context gains a prompt field", AICTX,
     "  /* ── Identity and provenance ─────────────────────────────────────────── */\n  readonly systemId: string",
     "  readonly systemPrompt: string\n  /* ── Identity and provenance ─────────────────────────────────────────── */\n  readonly systemId: string",
     SYSTEM),

    (1238, "the interface-only package is given a working body", AICTX,
     "  throw new Error(\n    \"toAiContext is an interface, not an implementation.",
     "  return {} as FoodSystemAiContext\n  throw new Error(\n    \"toAiContext is an interface, not an implementation.",
     SYSTEM),

    # ── L · the fences ──────────────────────────────────────────────────────
    (1239, "the system layer imports the Report layer", COMPOSE,
     'import { canCompare } from "@/lib/fss/engine/compare"',
     'import { canCompare } from "@/lib/fss/engine/compare"\nimport { REPORT_SCHEMA_VERSION } from "@/lib/report/schema"',
     SYSTEM),

    (1240, "the system layer reaches for a Supabase client", LOAD,
     'import type { FoodSystemRepository } from "@/lib/fss/persistence/repository"',
     'import type { FoodSystemRepository } from "@/lib/fss/persistence/repository"\nimport { supabase } from "@/lib/supabase"',
     SYSTEM),

    # ── M · one selector, and only establishment selects ────────────────────
    (1241, "the result page selects for itself again", RESULT,
     'import type { FoodSystemPlan, ResolvedPriority } from "@/lib/fss/action/types"',
     'import type { FoodSystemPlan, ResolvedPriority } from "@/lib/fss/action/types"\nimport { resolvePriorities } from "@/lib/fss/action/priority"',
     PRIORITY + PERSIST),

    # ── N · the one defect only reading the rendered page found ─────────────
    #
    # Today's single insight is `PRIORITY_COPY.explanation`, which explains the
    # RANKING. Swapping it back to the band description — which the gate's own
    # plan originally specified — puts "widen the range, not the amount" on the
    # same screen as "your answers described a wide range of plant foods". Both
    # sentences reviewed, both true, contradicting each other where they appear.
    (1243, "Today's insight describes the domain instead of explaining the ranking", SECTIONS,
     "      insight: focus ? focus.explanation : null,",
     "      insight: focus\n        ? DOMAIN_PRESENTATION[focus.sourceDomain].whereYouAre(focus.domainScore)\n        : null,",
     SYSTEM),

    (1242, "the describer re-asserts the selection rule it was handed", "lib/fss/action/priority.ts",
     "  const { domain, domainScore, answered, total, scoredDomains, set, answers, provenance } = args\n  return {",
     "  const { domain, domainScore, answered, total, scoredDomains, set, answers, provenance } = args\n  if (domainScore > 50) throw new Error(\"not the lowest\")\n  return {",
     SYSTEM),
]
