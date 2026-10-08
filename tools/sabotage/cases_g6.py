# GATE 6 — EATOBIOTICS INTELLIGENCE. Cases 1400+.
#
# The two permanent rules this gate adds:
#
#   STRUCTURED TRUTH IS AUTHORITATIVE. AI IS A CONSUMER OF IT.
#
#   CONTEXT IS CAPABILITY. If the declared intent does not require a fact, the
#   model does not receive that fact.
#
# ── WHAT THESE CASES ARE AIMED AT, AND WHY IT IS A DIFFERENT TARGET ──────────
#
# Gate 6.0 makes NO model call, so there is no generated sentence to mutate.
# Every case here breaks the CONTAINMENT VESSEL instead: the taxonomy, the
# per-intent context contract, or the claim binding. That is deliberate —
# containment is the only thing 6.0 ships, and a vessel nobody tested is a
# vessel that will be found leaking by a customer rather than by this file.
#
# ── THE RECURRING DEFECT THIS FILE WAS WRITTEN AGAINST ───────────────────────
#
# A WIDENED TYPE IS INVISIBLE TO VITEST. This harness runs vitest, vitest does
# not type-check, and a union with an extra member changes no runtime value. It
# cost four slipped cases in Gate 4 and one each in Gate 5's 2d and H1 passes.
# Every type-level case below (1400, 1410) is therefore pointed at a
# SOURCE-READING assertion, and if one of them slips the answer is a stronger
# bridge, not a softer case.

ATYPES = "lib/fss/action/types.ts"
AICTX = "lib/fss/system/ai-context.ts"
AICLAIMS = "lib/fss/system/ai-claims.ts"

AMODEL = ["tests/unit/fss-action-model.test.ts"]
SYSTEM = ["tests/unit/my-food-system.test.ts"]

CASES = [
    # ── 1 · THE TAXONOMY ────────────────────────────────────────────────────
    #
    # 1033 and 1034 already cover adding `biological-inference` to the union
    # and dropping a member from the value list. These two cover the harder
    # shape: a change made CONSISTENTLY in both places, so the type↔value
    # bridge is satisfied and only a pin on the count or the names can see it.

    (1400, "a seventh claim class is added to BOTH the union and the list", ATYPES,
     '  | "plan-explanation"\n\n/**',
     '  | "plan-explanation"\n  | "outcome-projection"\n\n/**',
     AMODEL),

    (1401, "a biological inference enters by the value list rather than the union", ATYPES,
     '  "system-fact",\n  "plan-explanation",\n]',
     '  "system-fact",\n  "plan-explanation",\n  "microbiome-state",\n]',
     AMODEL),

    # ── 2 · THE PER-INTENT CONTEXT CONTRACT ─────────────────────────────────

    # EXCESS. An undeclared field granted to an intent — the plain form of
    # "context is capability" being relaxed by one line.
    (1402, "an undeclared context field is granted to the priority intent", AICTX,
     '  "explain-current-priority": [\n    "systemId",\n    "provenance",',
     '  "explain-current-priority": [\n    "systemId",\n    "observations",\n    "provenance",',
     SYSTEM),

    # OMISSION, which the plan insisted is equally a failure: subset-only
    # validation silently drops grounding, and a model missing its grounding
    # substitutes something.
    (1403, "a required context field is quietly dropped from an intent", AICTX,
     '  "help-today-action": [\n    "systemId",\n    "priority",\n    "todayAction",',
     '  "help-today-action": [\n    "systemId",\n    "todayAction",',
     SYSTEM),

    # THE WHOLE CEILING HANDED OVER. The builder stops copying out the
    # declared keys and returns the local it assembled — which is the one
    # value of that shape that exists anywhere.
    (1404, "the builder returns the entire ceiling instead of the projection", AICTX,
     '  const out: Record<string, unknown> = {}\n  for (const key of INTENT_FIELDS[intent] as readonly (keyof FoodSystemAiContextCeiling)[]) {\n    out[key] = everything[key]\n  }\n  return out as AiContextByIntent[I]',
     '  return everything as AiContextByIntent[I]',
     SYSTEM),

    # SPREAD-THEN-DELETE, prohibited by name in the plan. It looks equivalent
    # and is not: it fails the first time a ceiling field is added and the
    # delete is forgotten, and it fails having already handed the field over.
    (1405, "the projection becomes a spread of the ceiling with the denied keys deleted", AICTX,
     '  const out: Record<string, unknown> = {}\n  for (const key of INTENT_FIELDS[intent] as readonly (keyof FoodSystemAiContextCeiling)[]) {\n    out[key] = everything[key]\n  }',
     '  const out: Record<string, unknown> = { ...everything }\n  for (const key of INTENT_DENIED[intent] as readonly string[]) {\n    delete out[key]\n  }',
     SYSTEM),

    # ALL FIVE DOMAIN SCORES to the priority intent. The first tightening
    # undone: "lowest of five" is explainable from rank and count, and handing
    # over the other four invites the model to rediscover the ranking.
    (1406, "all five domain scores reach the priority intent", AICTX,
     '    "priority",\n    "decisionsUnresolvable",\n    "claimBoundary",\n  ],',
     '    "priority",\n    "domains",\n    "decisionsUnresolvable",\n    "claimBoundary",\n  ],',
     SYSTEM),

    # NON-LIMITING FOOD CONTEXT to the action intent. The second tightening
    # undone — and note it is undone INSIDE the builder, not in the contract,
    # so the key-set pin still passes and only the value assertion can see it.
    (1407, "the action intent receives every constraint, not only the limiting ones", AICTX,
     "    limitingConstraints: system.context.limiting,",
     "    limitingConstraints: Object.keys(system.context.states) as ContextConstraint[],",
     SYSTEM),

    # RECONSTRUCTING THE COMPARISON. The what-changed intent is given the raw
    # material to reach its own answer rather than the answer Gate 5 reached.
    (1408, "the what-changed intent is handed the raw observations", AICTX,
     '  "explain-what-changed": [\n    "systemId",\n    "previousSystemId",',
     '  "explain-what-changed": [\n    "systemId",\n    "observations",\n    "previousSystemId",',
     SYSTEM),

    # THE PENDING COMPARATIVE COPY, imported into the layer that feeds a model.
    # Caught at the import, which is a step earlier than the object: a sentence
    # in the module is one edit from being in the context.
    (1409, "the reviewed comparative sentences are imported into the AI layer", AICTX,
     'import type { WhatChanged } from "./changed"',
     'import { DOMAIN_CHANGE_COPY } from "@/lib/fss/presentation/changed"\nimport type { WhatChanged } from "./changed"',
     SYSTEM),

    # METHODOLOGY AS DATA. No function is imported, so the import guard is
    # satisfied; the WEIGHTS arrive as a ceiling field instead, which would let
    # a model recompute a score the engine never produced.
    (1410, "a methodology field enters the ceiling as data", AICTX,
     "  readonly claimBoundary: AiClaimBoundary\n}",
     "  readonly weights: Record<string, number>\n  readonly claimBoundary: AiClaimBoundary\n}",
     SYSTEM),

    # ── 3 · THE CLAIM BINDING ───────────────────────────────────────────────
    #
    # Every one of these makes the validator PERMIT an appeal. None of them
    # touches a sentence, because there is no sentence to touch — which is the
    # amendment's whole point, restated as a set of mutations.

    (1411, "a basis naming a priority the system never selected is permitted", AICLAIMS,
     "  if (index === -1) {",
     "  if (false) {",
     SYSTEM),

    # ── THE TWO SUBTLE APPEALS, ADDED BY THE AMENDMENT ──────────────────────
    #
    # Both carry ENTIRELY CORRECT IDS, which is what makes them worth cases of
    # their own: no id check and no membership check can see either.

    (1412, "a selected-but-lower-ranked priority passes as the current focus", AICLAIMS,
     "  if (index !== 0) {",
     "  if (false) {",
     SYSTEM),

    (1413, "evidence borrowed from another domain passes under the right priority", AICLAIMS,
     "  if (foreign.length > 0) {",
     "  if (false) {",
     SYSTEM),

    (1414, "an action from another plan is accepted as this plan's", AICLAIMS,
     "    const known = system.actions.some((a) => a.id === basis.actionId)",
     "    const known = true",
     SYSTEM),

    # The redundancy the validator carries on purpose: a basis assembled from
    # two sources can disagree with itself, and deriving one from the other
    # would hide exactly that.
    (1415, "the id is derived from the domain instead of checked against it", AICLAIMS,
     "  if (priorityIdFor(basis.priorityDomain) !== basis.priorityId) {",
     "  if (false) {",
     SYSTEM),

    # A decision that cannot be read back under its own policy version is one
    # the product does not get to explain. Removing this check makes the AI the
    # only thing willing to speak about a record nothing else can resolve.
    (1416, "an unresolvable decision is explained anyway", AICLAIMS,
     '  if (system.priorities.state !== "resolved") {',
     "  if (false) {",
     SYSTEM),

    # The structural half of the amendment: a basis with nowhere to nominate an
    # alternative. A key here is an appeal the TYPE can hold.
    (1417, "the basis gains a field in which to nominate a different priority", AICLAIMS,
     '  "evidenceIds",\n  "actionId",\n]',
     '  "evidenceIds",\n  "actionId",\n  "suggestedPriority",\n]',
     SYSTEM),
]
