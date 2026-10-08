import { z } from "zod"

import { FSS_DOMAINS } from "@/lib/fss/questions/domain-schema"
import type { FssDomain } from "@/lib/fss/questions/types"
import type { ClaimClass } from "@/lib/fss/action/types"
import { priorityIdFor } from "@/lib/fss/action/priority"
import { validateClaimBinding, type BindingVerdict, type ClaimBasis } from "./ai-claims"
import type { MyFoodSystem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   FOCUS TODAY — the first live capability under the Intelligence Boundary.

   One question: "What should I focus on today, and why?"

   ══ WHAT THE MODEL IS ALLOWED TO OWN, WHICH IS ONE STRING ═══════════════════

   `practicalFraming`. That is the whole of it.

   The priority was selected deterministically and persisted. The action was
   selected deterministically, constraint-filtered against the person's reported
   limiting context, and persisted. The wording of both was reviewed and lives in
   the catalogue and the presentation layer. None of that is the model's to
   decide, restate or carry.

   So the model receives the reviewed wording as CONTEXT — it must know what the
   priority and the action mean in order to frame anything usefully — and returns
   three attestations plus one framing sentence.

   ══ THREE RULES THIS MODULE IMPLEMENTS ══════════════════════════════════════

     Reviewed wording reaches the model as context. It returns from the model
     never. EatoBiotics assembles it from the bound deterministic state.

     Output fields are capability too. If the model does not need authority over
     something in the current gate, it does not get a field for it.

     Canonical product wording is assembled by EatoBiotics from the bound
     deterministic state. The model has no selection or authorship authority
     over it.

   ══ TWO DESIGNS WITHDRAWN BEFORE THIS ONE, RECORDED SO THEY STAY WITHDRAWN ══

   FIRST, the model echoed each reviewed string and a validator checked exact
   equality. That gave the model the job of transmitting canonical bytes and
   then policed it: a comma would have failed a whole response for no safety
   gain, and the property under test would have been "the model copied
   accurately" rather than "reviewed copy comes only from the reviewed source".

   SECOND, the model returned REFERENCES to the atoms it was using and the
   server resolved them. Better — no canonical text in the response — but still
   redundant: the four atoms are completely determined by the bound priority and
   action ids, and validation demanded all four, so the "selection" selected
   nothing. It would have cost an output field, a validator, sabotage surface
   and a pre-authorised capability in exchange for no change to any answer.

   THIRD, and what this module does: once the binding succeeds, the server
   attaches the complete canonical set. `resolveAtoms` does not take the model's
   response as a parameter, so model-supplied wording entering the capability is
   not a mistake that gets refused — it is a mistake with no path to occur.

   If a future gate genuinely offers several approved atoms to choose between,
   the selection capability is introduced THEN, as an explicit reviewed
   capability increase. It is not pre-authorised here.

   ══ NO MODEL CALL LIVES IN THIS FILE ════════════════════════════════════════

   The provider call sits behind `FocusTodayModel`, a one-method seam, because
   the sabotage harness mutates source and runs vitest: a suite that made live
   calls would be non-deterministic and unsabotageable. Everything below is a
   pure function over a response object, and every test feeds recorded
   responses.
   ════════════════════════════════════════════════════════════════════════ */

/* ── The atoms ─────────────────────────────────────────────────────────── */

/**
 * One slot of reviewed wording this capability is composed of.
 *
 * A SERVER-SIDE key. The model never names one, and there is no field in the
 * response for it to name one in.
 */
export type FocusAtomSlot =
  | "priority.headline"
  | "priority.explanation"
  | "action.title"
  | "action.practicalAction"

/**
 * The slots, as a value, in order.
 *
 * Pinned because `FocusAtomSlot` is a union and **a union is invisible to
 * vitest**. This programme has relearned that six times now — `FssDomain`,
 * `ClaimClass`, `ActionState`, `SectionId`, `AiIntent`, and here — so the
 * value list ships with a source-read bridge asserting the two agree, exactly
 * as `FSS_DOMAINS` and `AI_INTENTS` do.
 */
export const FOCUS_ATOM_SLOTS = [
  "priority.headline",
  "priority.explanation",
  "action.title",
  "action.practicalAction",
] as const

type Listed = (typeof FOCUS_ATOM_SLOTS)[number]
type Assert<T extends true> = T
type _EverySlotIsListed = Assert<[Exclude<FocusAtomSlot, Listed>] extends [never] ? true : false>
type _EveryListedIsASlot = Assert<[Exclude<Listed, FocusAtomSlot>] extends [never] ? true : false>

/**
 * One piece of canonical reviewed wording, with its provenance.
 *
 * `text` came from the composed system under the bound ids. It did not come
 * from a model, and the resolver's signature is what makes that true rather
 * than a convention.
 */
export interface CanonicalAtom {
  readonly slot: FocusAtomSlot
  readonly text: string
  /** The reviewed class of the source, carried rather than re-derived. */
  readonly claimClass: ClaimClass
  /** Which versioned source the wording came from. */
  readonly sourceVersion: string
}

/* ── What the model returns ────────────────────────────────────────────── */

const MAX_FRAMING = 400

/**
 * The response schema. SHAPE ONLY — it proves nothing about truth.
 *
 * `.strict()` is load-bearing: an undeclared key is a refusal, not something
 * silently dropped. A model that started returning `suggestedPriority` would
 * fail here rather than have it ignored, which is the difference between a
 * boundary and a filter.
 */
export const focusTodayModelResponseSchema = z
  .object({
    /*
     * The three echoes. NOT sources of product truth — attestations that must
     * AGREE with it. They are what lets `validateClaimBinding` be exercised
     * against the response at all, which is why they survived the simplification
     * that removed the atom references.
     */
    priorityIdEcho: z.string().min(1).max(200),
    focusDomainEcho: z.enum(FSS_DOMAINS),
    actionIdEcho: z.string().min(1).max(200),

    /** The only model-authored content in the entire capability. */
    practicalFraming: z.string().min(1).max(MAX_FRAMING),
  })
  .strict()

export type FocusTodayModelResponse = z.infer<typeof focusTodayModelResponseSchema>

/** The keys a response may carry, pinned so a seventh is a visible diff. */
export const FOCUS_RESPONSE_KEYS: readonly string[] = [
  "priorityIdEcho",
  "focusDomainEcho",
  "actionIdEcho",
  "practicalFraming",
]

/* ── What EatoBiotics produces ─────────────────────────────────────────── */

export interface FocusTodayCapability {
  readonly priorityId: string
  readonly focusDomain: FssDomain
  readonly actionId: string
  /** Complete. Assembled here, never received. */
  readonly atoms: Readonly<Record<FocusAtomSlot, CanonicalAtom>>
  readonly practicalFraming: string
}

/**
 * Why a focus answer was refused.
 *
 * Every one degrades honestly. None asks the model to infer a missing decision,
 * and none produces a partial answer — a half-rendered focus is a product
 * saying something it cannot stand behind.
 */
export type FocusRefusal =
  /** The priority decision could not be read back under its own version. */
  | "decision-unresolvable"
  /** Nothing is planned for today. A real product state, not an error. */
  | "no-action-today"
  /** The action's reviewed wording is unrecoverable, so there is no atom. */
  | "action-content-unresolvable"
  /** The response did not parse, or carried an undeclared field. */
  | "response-malformed"
  /** The echoes did not agree with the persisted decision. */
  | "binding-refused"
  /** The framing broke a language rule. */
  | "framing-refused"
  /** A required canonical atom was missing after assembly. */
  | "atoms-incomplete"

export type FocusTodayResult =
  | { readonly state: "answered"; readonly capability: FocusTodayCapability }
  | {
      readonly state: "refused"
      readonly because: FocusRefusal
      readonly explain: string
      /** Present when the refusal came from the binding authority. */
      readonly binding?: BindingVerdict
    }

/* ── 1 · Can this system be asked the question at all? ─────────────────── */

/**
 * The grounding check, run BEFORE any model call.
 *
 * Spending a provider call on a system whose basis cannot bind is waste, but
 * that is the smaller reason. The larger one: a model handed an unresolvable
 * decision and asked to explain it will explain something, and the honest
 * product answer is that there is nothing to explain.
 */
export function focusGrounding(
  system: MyFoodSystem,
):
  | { readonly ok: true; readonly priorityId: string; readonly domain: FssDomain; readonly actionId: string }
  | { readonly ok: false; readonly because: FocusRefusal; readonly explain: string } {
  if (system.priorities.state !== "resolved" || system.priorities.priorities.length === 0) {
    return {
      ok: false,
      because: "decision-unresolvable",
      explain:
        "This Food System's priority decision could not be read back under its own policy " +
        "version, so there is no persisted decision to explain.",
    }
  }

  const today = system.actions.find((a) => a.timeHorizon === "today")
  if (!today) {
    return {
      ok: false,
      because: "no-action-today",
      explain: "There is nothing planned for today in this Food System's persisted plan.",
    }
  }

  if (today.content.state !== "resolved") {
    return {
      ok: false,
      because: "action-content-unresolvable",
      explain:
        "Today's action was recorded under a catalogue version that has since moved, so the " +
        "wording it was shown with cannot be recovered. It is not restated from today's wording.",
    }
  }

  const top = system.priorities.priorities[0]
  return { ok: true, priorityId: top.id, domain: top.sourceDomain, actionId: today.id }
}

/* ── 2 · Does the response bind to the persisted decision? ─────────────── */

/**
 * Build the basis the response attests to, and check it.
 *
 * `validateClaimBinding` is **reused unchanged** from Gate 6.0c. Its six
 * refusals already cover a different priority, a selected-but-lower-ranked
 * priority, evidence borrowed from another domain, and an action from another
 * plan — so this layer invents no authority of its own. It assembles a
 * `ClaimBasis` from the attestations and asks the existing authority.
 */
export function bindResponse(args: {
  readonly system: MyFoodSystem
  readonly response: FocusTodayModelResponse
}): BindingVerdict {
  const { system, response } = args

  /*
   * Evidence is taken from the BOUND priority, not from the response — there is
   * no field for the model to supply evidence ids in, and there should not be.
   * The basis is an attestation about which decision is being explained; the
   * evidence behind that decision is the deterministic system's to state.
   */
  const evidenceIds =
    system.priorities.state === "resolved" && system.priorities.priorities.length > 0
      ? system.priorities.priorities[0].evidence.map((e) => e.questionId)
      : []

  const basis: ClaimBasis = {
    claimClass: "plan-explanation",
    priorityId: response.priorityIdEcho,
    priorityDomain: response.focusDomainEcho,
    evidenceIds,
    actionId: response.actionIdEcho,
  }

  return validateClaimBinding({ system, basis })
}

/* ── 3 · Assemble the canonical wording ───────────────────────────────── */

/**
 * The complete canonical atom set for a bound priority and action.
 *
 * ══ THE SIGNATURE IS THE SAFETY PROPERTY ════════════════════════════════════
 *
 * There is no `response` parameter, and there must never be one. That is what
 * makes "model-supplied wording reached the customer" unreachable rather than
 * refused — the same move as the type-only AI context ceiling: the mistake is
 * not available.
 *
 * It also means an atom belonging to another priority or another action is
 * structurally out of reach, because the only inputs are the bound ids. There
 * is no check for it, because there is no way to ask for it.
 *
 * Returns null when either id does not resolve, which the caller turns into a
 * refusal rather than a partial answer.
 */
export function resolveAtoms(
  system: MyFoodSystem,
  priorityId: string,
  actionId: string,
): Readonly<Record<FocusAtomSlot, CanonicalAtom>> | null {
  if (system.priorities.state !== "resolved") return null
  const priority = system.priorities.priorities.find((p) => p.id === priorityId)
  if (!priority) return null

  const action = system.actions.find((a) => a.id === actionId)
  if (!action || action.content.state !== "resolved") return null
  const entry = action.content.recommendation

  return {
    "priority.headline": {
      slot: "priority.headline",
      text: priority.headline,
      /*
       * A headline naming where to start is a statement about the persisted
       * decision, which is exactly `plan-explanation`.
       */
      claimClass: "plan-explanation",
      sourceVersion: priority.provenance.fssMethodVersion,
    },
    "priority.explanation": {
      slot: "priority.explanation",
      text: priority.explanation,
      claimClass: "plan-explanation",
      sourceVersion: priority.provenance.fssMethodVersion,
    },
    "action.title": {
      slot: "action.title",
      text: entry.title,
      claimClass: "personalised-recommendation",
      sourceVersion: entry.actionSetVersion,
    },
    "action.practicalAction": {
      slot: "action.practicalAction",
      text: entry.practicalAction,
      claimClass: "personalised-recommendation",
      sourceVersion: entry.actionSetVersion,
    },
  }
}

/**
 * Is the assembled set complete?
 *
 * Completeness, not comparison — there is no model text to compare against.
 * TypeScript enforces the `Record` at compile time and **vitest cannot see
 * that**, which is why this exists as a runtime check over the pinned slot
 * list.
 */
export function atomsComplete(
  atoms: Readonly<Record<string, CanonicalAtom>>,
): boolean {
  const keys = Object.keys(atoms).sort()
  if (keys.length !== FOCUS_ATOM_SLOTS.length) return false
  const expected = [...FOCUS_ATOM_SLOTS].sort()
  return keys.every((k, i) => k === expected[i]) &&
    FOCUS_ATOM_SLOTS.every((slot) => typeof atoms[slot]?.text === "string" && atoms[slot].text.length > 0)
}

/* ── 4 · Guard the one string the model authored ──────────────────────── */

/**
 * Phrasing that nominates a priority rather than explaining one.
 *
 * This is the ONE place language guarding is load-bearing, and the reason is
 * precise: a response can carry entirely correct ids and still say "Meal Rhythm
 * is actually more important for you". The binding cannot see that, because the
 * contradiction lives in prose the binding never reads.
 *
 * It remains SEPARATE FROM and SUBORDINATE TO the binding. The binding decides
 * which priority the prose may describe; this catches prose that describes it
 * and then argues with it.
 */
export const RERANKING_PHRASES: readonly string[] = [
  "instead",
  "more important",
  "most important",
  "real priority",
  "actual priority",
  "bigger priority",
  "i would prioritise",
  "i would prioritize",
  "i'd prioritise",
  "i'd prioritize",
  "should focus on",
  "matters more",
  "a better place to start",
]

/**
 * Phrasing that turns reported context into a claim about the person.
 *
 * The distinction, which is finer than it first looks:
 *
 *   PERMITTED   "A simple way to approach this is to add it to a meal you're
 *               already making."
 *   REFUSED     "Because you're too busy to cook…"
 *
 * The first frames the action against a constraint the plan already recognised.
 * The second asserts something about the person — that they are too busy — which
 * no deterministic component concluded, in the one layer with no authority to
 * conclude it. Food Context shapes what is reasonable to suggest; it is not
 * evidence about who somebody is.
 */
export const CONTEXT_AS_ASSERTION_PHRASES: readonly string[] = [
  "because you're too",
  "because you are too",
  "since you're too",
  "since you are too",
  "because you don't have",
  "because you do not have",
  "because you lack",
  "as you struggle",
  "you clearly",
  "you obviously",
  "given how little",
]

export type FramingVerdict =
  | { readonly clean: true }
  | { readonly clean: false; readonly because: string; readonly matched: string }

/**
 * May this framing be shown?
 *
 * Reads ONLY `practicalFraming`. It does not read the atoms — guarding reviewed
 * copy would be this layer second-guessing a review that already happened, and
 * sabotage 1426 exists for the inversion.
 */
export function validateFraming(args: {
  readonly framing: string
  readonly boundDomain: FssDomain
  /** The reviewed label of every domain, so a foreign one can be spotted. */
  readonly domainLabels: Readonly<Record<FssDomain, string>>
}): FramingVerdict {
  const { framing, boundDomain, domainLabels } = args

  /*
   * ── AN INCOMPLETE LABEL MAP THROWS RATHER THAN QUIETLY PASSING ──────────
   *
   * The foreign-domain check reads these labels, so a missing one disables part
   * of the check — and the first draft of this function skipped falsy labels,
   * which meant an empty map silently waved every cross-domain framing through.
   * That is the shape of defect this programme keeps finding: a guard that
   * passes because it was handed nothing to check.
   *
   * Labels are a PARAMETER rather than an import so this module imports no
   * presentation layer and the Gate 6.0d prose fence holds. The cost of that
   * choice is that the caller can under-supply, so the cost is paid here, once,
   * loudly. A wiring bug is not a model failure and must not be reported as a
   * refusal — it throws.
   */
  const missing = FSS_DOMAINS.filter((d) => !domainLabels[d] || domainLabels[d].length === 0)
  if (missing.length > 0) {
    throw new Error(
      `validateFraming needs a label for every domain; missing: ${missing.join(", ")}. ` +
        "An incomplete map would silently disable the cross-domain check.",
    )
  }

  const lower = framing.toLowerCase()

  for (const phrase of RERANKING_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        clean: false,
        because:
          "The framing nominates or reorders a priority. It may explain the persisted decision " +
          "and may not appeal it.",
        matched: phrase,
      }
    }
  }

  for (const phrase of CONTEXT_AS_ASSERTION_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        clean: false,
        because:
          "The framing turns reported context into an assertion about the person. Context shapes " +
          "what is reasonable to suggest; it is not evidence about who somebody is.",
        matched: phrase,
      }
    }
  }

  /*
   * Naming another domain is the subtler half of the same appeal: "Diversity is
   * your focus, though Meal Rhythm is where the real gap is" carries correct
   * ids and argues for a different domain in prose.
   */
  for (const domain of FSS_DOMAINS) {
    if (domain === boundDomain) continue
    const label = domainLabels[domain]
    if (lower.includes(label.toLowerCase())) {
      return {
        clean: false,
        because:
          "The framing names a domain other than the bound priority's, which argues for another " +
          "domain under the right heading.",
        matched: label,
      }
    }
  }

  return { clean: true }
}

/* ── 5 · The whole validation, in order ───────────────────────────────── */

/**
 * Turn a raw model response into a capability, or refuse.
 *
 * Pure, total, and it makes no model call. The ordering matters: shape, then
 * binding, then assembly, then language — so a response that fails the binding
 * is never language-checked, and a failure never produces a partial answer.
 *
 * There is **no repair and no retry**. A model coached until it passes is a
 * validator negotiating with its subject.
 */
export function validateFocusToday(args: {
  readonly system: MyFoodSystem
  readonly raw: unknown
  readonly domainLabels: Readonly<Record<FssDomain, string>>
}): FocusTodayResult {
  const { system, raw, domainLabels } = args

  const grounding = focusGrounding(system)
  if (!grounding.ok) {
    return { state: "refused", because: grounding.because, explain: grounding.explain }
  }

  /* 1 · SHAPE. */
  const parsed = focusTodayModelResponseSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      state: "refused",
      because: "response-malformed",
      explain: `The response did not match the declared schema: ${parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ")}`,
    }
  }
  const response = parsed.data

  /* 2 · BINDING, by the existing authority. */
  const binding = bindResponse({ system, response })
  if (!binding.bound) {
    return {
      state: "refused",
      because: "binding-refused",
      explain: binding.explain,
      binding,
    }
  }

  /*
   * The action attestation is checked by `validateClaimBinding` for plan
   * membership, which is not the same as being TODAY's action. A response
   * naming a legitimate thirty-day action would bind and answer the wrong
   * question, so the horizon is checked here.
   */
  if (response.actionIdEcho !== grounding.actionId) {
    return {
      state: "refused",
      because: "binding-refused",
      explain:
        `The response names action "${response.actionIdEcho}", which is in this plan but is not ` +
        "today's action. The question asked was about today.",
    }
  }

  /* 3 · CANONICAL ASSEMBLY. The response is not a parameter. */
  const atoms = resolveAtoms(system, grounding.priorityId, grounding.actionId)
  if (!atoms || !atomsComplete(atoms)) {
    return {
      state: "refused",
      because: "atoms-incomplete",
      explain:
        "The reviewed wording for this priority and action could not be assembled in full. A " +
        "partial answer is not shown.",
    }
  }

  /* 4 · LANGUAGE, over the one authored string only. */
  const framing = validateFraming({
    framing: response.practicalFraming,
    boundDomain: grounding.domain,
    domainLabels,
  })
  if (!framing.clean) {
    return {
      state: "refused",
      because: "framing-refused",
      explain: `${framing.because} (matched: "${framing.matched}")`,
    }
  }

  /* 5 · ANSWERED. */
  return {
    state: "answered",
    capability: {
      priorityId: grounding.priorityId,
      focusDomain: grounding.domain,
      actionId: grounding.actionId,
      atoms,
      practicalFraming: response.practicalFraming,
    },
  }
}

/* ── The provider seam ────────────────────────────────────────────────── */

/**
 * The one method that talks to a model.
 *
 * An interface rather than a call so every test above runs without a provider
 * and the sabotage harness can mutate the validators. The route supplies the
 * real implementation; `priorityIdFor` is re-exported through nothing — it is
 * imported here only so a future basis assembly cannot drift from the id scheme.
 */
export interface FocusTodayModel {
  ask(args: {
    readonly context: unknown
    readonly expectedPriorityId: string
    readonly expectedActionId: string
  }): Promise<unknown>
}

/** Guards against an id scheme drift between this module and the authority. */
export function expectedPriorityIdFor(domain: FssDomain): string {
  return priorityIdFor(domain)
}
