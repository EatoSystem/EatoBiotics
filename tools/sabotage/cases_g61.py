# GATE 6.1 — FOCUS TODAY. Cases 1420+.
#
# The first live capability under the Intelligence Boundary, and the first
# actual model call in the programme.
#
# ── THE INVARIANT EVERY CASE HERE ATTACKS ────────────────────────────────────
#
#   Canonical product wording is assembled by EatoBiotics from the bound
#   deterministic state. The model has no selection or authorship authority
#   over it.
#
# That replaced two weaker invariants during review, and the replacement is why
# these cases look the way they do. The first design had the model echo each
# reviewed string and a validator check exact equality — so the cases would have
# been "did the model copy the sentence accurately", and `.includes()` vs `===`
# would have been a mutation target. The second had the model return atom
# REFERENCES. Both gave the model a job it did not need; both were withdrawn.
#
# So the targets now are: can non-canonical wording become reachable, and can
# the model's one authored string acquire authority it was not given.
#
# ── WRITING THESE CASES FOUND TWO WEAK TESTS OF MY OWN ───────────────────────
#
# `FOCUS_RESPONSE_KEYS` was pinned as a hand-maintained constant BESIDE the zod
# schema, so 1425 and 1434 — adding a field to the schema — moved nothing. And
# the capability test checked keys and completeness but never that the atoms'
# TEXT came from the system, so 1422 and 1436 would have walked through. Both
# tests were strengthened before these cases were written, which is the harness
# doing its job before it ran.

FOCUS = "lib/fss/system/focus-today.ts"
ROUTE = "app/api/fss/focus-today/route.ts"
CTX = "lib/fss/system/ai-context.ts"

SYSTEM = ["tests/unit/my-food-system.test.ts"]
GATES = ["tests/unit/fss-preview-gate.test.ts"]

CASES = [
    # ── 1 · THE ECHOES STOP BEING ATTESTATIONS ──────────────────────────────
    #
    # The echoes are the whole reason `validateClaimBinding` can be exercised
    # against a response. Deriving them from the system instead of reading them
    # makes the binding check self-satisfying: it would compare the persisted
    # decision against itself and always agree.

    (1420, "the priority echo is derived from the system instead of read", FOCUS,
     "    priorityId: response.priorityIdEcho,",
     '    priorityId: system.priorities.state === "resolved" ? system.priorities.priorities[0].id : "",',
     SYSTEM),

    (1421, "the domain echo is derived, so a mismatched pair self-satisfies", FOCUS,
     "    priorityDomain: response.focusDomainEcho,",
     '    priorityDomain: system.priorities.state === "resolved" ? system.priorities.priorities[0].sourceDomain : "diversity",',
     SYSTEM),

    # Plan membership is not the same as being TODAY's action. A thirty-day
    # action binds perfectly and answers a different question.
    (1422, "a later action in the same plan is accepted as today's", FOCUS,
     "  if (response.actionIdEcho !== grounding.actionId) {",
     "  if (false) {",
     SYSTEM),

    # ── 2 · NON-CANONICAL WORDING BECOMES REACHABLE ─────────────────────────
    #
    # The load-bearing pair. Both make the customer-visible sentence something
    # other than the reviewed source, and a slip on either is a defect in the
    # resolver's relationship to the response rather than in a check.

    (1423, "the model's framing overwrites a canonical atom", FOCUS,
     "      atoms,\n      practicalFraming: response.practicalFraming,",
     '      atoms: { ...atoms, "action.practicalAction": { ...atoms["action.practicalAction"], text: response.practicalFraming } },\n      practicalFraming: response.practicalFraming,',
     SYSTEM),

    (1424, "an atom is resolved from a second source on the same object", FOCUS,
     "      text: priority.explanation,",
     "      text: priority.rationale,",
     SYSTEM),

    (1425, "a reviewed atom is resolved from the wrong record entirely", FOCUS,
     "      text: priority.headline,",
     "      text: entry.title,",
     SYSTEM),

    # ── 3 · THE SELECTOR THIS REVIEW REMOVED COMES BACK ─────────────────────
    #
    # 1426 defends an ABSENCE rather than policing a presence, which makes it
    # stronger than the case it replaced: a key-set guard derived from the schema
    # refuses the reintroduction of the very field the architecture review took
    # out. "Output fields are capability too."

    (1426, "atomRefs is added back to the response schema", FOCUS,
     "    actionIdEcho: z.string().min(1).max(200),",
     "    actionIdEcho: z.string().min(1).max(200),\n    atomRefs: z.array(z.string()).optional(),",
     SYSTEM),

    (1427, "a second free-prose field is added to the schema", FOCUS,
     "    practicalFraming: z.string().min(1).max(MAX_FRAMING),",
     "    practicalFraming: z.string().min(1).max(MAX_FRAMING),\n    extraNote: z.string().optional(),",
     SYSTEM),

    # An undeclared key silently dropped is a filter; refused is a boundary.
    (1428, "the schema stops being strict, so undeclared keys are ignored", FOCUS,
     "  .strict()",
     "",
     SYSTEM),

    # ── 4 · COMPLETENESS AND THE INVISIBLE UNION ────────────────────────────

    # -- REPOINTED. Both original aims were MIS-TARGETED, and saying why is
    #    more useful than quietly swapping them --------------------------
    #
    # 1429 first mutated the length check from `!==` to `>`, and slipped --
    # correctly. `atomsComplete` is double-guarded: the length comparison AND
    # an `every` over the pinned slot list. A missing slot fails the `every`
    # whatever the length test says, and an extra key still fails `5 > 4`. The
    # mutation was behaviourally equivalent, so the case proved nothing about
    # the invariant. It now disables the whole function, which the direct test
    # catches.
    (1429, "the atom completeness check stops checking", FOCUS,
     "  const keys = Object.keys(atoms).sort()",
     "  return true\n  const keys = Object.keys(atoms).sort()",
     SYSTEM),

    # 1430 first removed the `atomsComplete` call from `validateFocusToday`
    # and slipped -- also correctly, and for a more interesting reason:
    # `resolveAtoms` returns all four atoms or null, so that call is DEFENCE
    # IN DEPTH whose failure mode is currently unreachable. A case aimed at an
    # unreachable branch reports nothing either way, which is the decorative
    # guard this harness exists to find.
    #
    # Repointed to make the branch reachable: drop a slot at the source. The
    # direct resolver test catches the missing atom, and the completeness path
    # in `validateFocusToday` is exercised for real rather than asserted.
    (1430, "the resolver omits a reviewed atom from the set", FOCUS,
     '    "action.title": {\n      slot: "action.title",\n      text: entry.title,\n      claimClass: "personalised-recommendation",\n      sourceVersion: entry.actionSetVersion,\n    },\n',
     "",
     SYSTEM),

    # THE TYPE-INVISIBLE-TO-VITEST CASE. A fifth union member changes no runtime
    # value, so only the source bridge can see it — the sixth time this
    # programme has met that defect.
    (1431, "FocusAtomSlot gains a fifth member without the value list moving", FOCUS,
     '  | "action.practicalAction"\n\n/**',
     '  | "action.practicalAction"\n  | "action.rationale"\n\n/**',
     SYSTEM),

    # ── 5 · THE LANGUAGE LAYER, WHICH IS SUBORDINATE BUT NOT OPTIONAL ───────
    #
    # The one place language guarding is load-bearing: a response can carry
    # entirely correct ids and still argue with the decision in prose.

    (1432, "the reranking rule stops refusing priority nomination", FOCUS,
     "  for (const phrase of RERANKING_PHRASES) {",
     "  for (const phrase of [] as string[]) {",
     SYSTEM),

    (1433, "the framing rule stops refusing context-as-personal-assertion", FOCUS,
     "  for (const phrase of CONTEXT_AS_ASSERTION_PHRASES) {",
     "  for (const phrase of [] as string[]) {",
     SYSTEM),

    (1434, "the framing may name a domain other than the bound one", FOCUS,
     "    if (lower.includes(label.toLowerCase())) {",
     "    if (false) {",
     SYSTEM),

    # The silent-disable path found during implementation: an incomplete label
    # map made the cross-domain check pass by having nothing to check.
    (1435, "an incomplete label map silently disables the cross-domain check", FOCUS,
     "  if (missing.length > 0) {",
     "  if (false) {",
     SYSTEM),

    # The layering inverts: guards run over the reviewed copy instead of the
    # one authored string, so the authored string goes unchecked.
    (1436, "language guards are pointed at the atoms instead of the framing", FOCUS,
     "    framing: response.practicalFraming,",
     '    framing: atoms["action.practicalAction"].text,',
     SYSTEM),

    # ── 6 · THE GROUNDING AND THE GATE ──────────────────────────────────────

    (1437, "an unresolvable decision is explained anyway", FOCUS,
     "  if (!grounding.ok) {",
     "  if (false) {",
     SYSTEM),

    # The route's own fail-closed predicate. A model speaking about candidate
    # methodology on a real domain is the outcome the gate exists to prevent.
    (1438, "the route's preview predicate stops denying production", ROUTE,
     '  if (vercelEnv === "production") return false',
     '  if (vercelEnv === "production") return true',
     GATES),

    (1439, "the route requests a wider context projection", ROUTE,
     'const context = toAiContext("help-today-action", { system })',
     'const context = toAiContext("explain-current-priority", { system })',
     SYSTEM),

    # ── 7 · THE REVIEWED CONTENT IN THE CEILING ─────────────────────────────
    #
    # 6.1a put reviewed strings inside already-granted fields. Dropping them
    # silently returns the model to being told "action_x, category feed" and
    # never what the action is — which is where this gate started.

    (1440, "an unresolvable action still carries reviewed wording", CTX,
     "    title: resolved ? resolved.title : null,",
     '    title: resolved ? resolved.title : "Today\'s action",',
     SYSTEM),

    (1441, "the priority's reviewed explanation is dropped from the context", CTX,
     "    explanation: top.explanation,",
     '    explanation: "",',
     SYSTEM),
]
