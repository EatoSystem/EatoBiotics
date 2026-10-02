# GATE 5 — REASSESSMENT & WHAT CHANGED. Cases 1300+.
#
# The fifth product rule:
#
#   Compare measurements. Describe observations. Record actions.
#   DO NOT INVENT CAUSATION.
#
# Step 0 covers the three shapes that were LIVE on /account when this gate
# opened. The rest of the file fills in as the gate proceeds.
#
# ── WHY THESE MUTATE A GENERATOR AND NOT A COMPONENT ─────────────────────────
#
# Because the guard that catches them CALLS the generator. tests/unit/
# agent-loop-claims.test.ts runs `detectPatterns` and reads what comes back, so
# a mutation to the sentence it returns is caught by the thing a customer would
# actually have been shown. A source-scanning guard caught 1 of 9 interpolated
# claims in Gate 3.6; that lesson is what these cases are aimed at.

PATTERNS = "lib/account/patterns.ts"
DASHBOARD = "components/account/dashboard-client-data.ts"
EMAIL = "lib/email/sequence-email.ts"
ESTABLISH = "lib/fss/system/establish.ts"
DRAFT = "lib/fss/system/draft.ts"
VALIDATE = "lib/fss/system/validate.ts"
REPO = "lib/fss/persistence/repository.ts"
ASSESS_TSX = "components/fss/candidate-assessment.tsx"
COMPARE = "lib/fss/engine/compare.ts"
COMPARE_SYS = "lib/fss/system/compare-systems.ts"
CHANGED = "lib/fss/system/changed.ts"
CHANGED_COPY = "lib/fss/presentation/changed.ts"
RETEST = "lib/account/retest.ts"
COMPOSE = "lib/fss/system/compose.ts"
SCHEMA = "lib/fss/questions/domain-schema.ts"
QTYPES = "lib/fss/questions/types.ts"

CLAIMS = ["tests/unit/agent-loop-claims.test.ts"]
SYSTEM = ["tests/unit/my-food-system.test.ts"]
PERSIST = ["tests/unit/fss-persistence.test.ts"]
ENGINE = ["tests/unit/fss-engine.test.ts"]

CASES = [
    (1300, "the trend detail asserts the change was caused by something", PATTERNS,
     '        detail: "Compared with the week before. That is what the meals you logged described, not why they changed.",\n        icon: "momentum",',
     '        detail: "Compared with the week before — whatever changed, it\'s working.",\n        icon: "momentum",',
     CLAIMS),

    (1301, "a suggested action gains a predicted outcome", PATTERNS,
     '        detail: "Your weekday meals scored higher than your weekend ones. A weekend meal built like a weekday one is the smallest thing to try.",',
     '        detail: "Your weekday meals score higher — one weekend swap would close most of the gap.",',
     CLAIMS),

    (1302, "a repeated meal is called proven", PATTERNS,
     "    detail: `You've logged it ${best.count} times, at an average of ${best.score} — one of your highest-scoring repeats.`,",
     "    detail: `You've logged it ${best.count} times at an average of ${best.score} — a proven winner worth keeping in rotation.`,",
     CLAIMS),

    (1303, "the product claims it can determine what works", PATTERNS,
     '    detail: "The more meals I see, the more of your pattern I can describe.",',
     '    detail: "That rhythm is exactly how I learn what actually works for you.",',
     CLAIMS),

    # The guard's own non-vacuity. Deleting the causation rules must fail the
    # six pre-fix literals, not quietly pass them.
    # ANCHOR CORRECTED after the case SLIPPED: the first version inserted a
    # DISABLED duplicate rule before the real one, which left the real one
    # running. A case whose mutation does not actually remove the thing it
    # names proves nothing — the same shape as case 945, which reported caught
    # for its whole life.
    (1304, "the causation rule is blinded in the behavioural guard",
     "tests/unit/agent-loop-claims.test.ts",
     "/\\bit'?s working\\b|\\bthey'?re working\\b|",
     "/\\bzzz_never_matches\\b|",
     CLAIMS),

    # The coverage hole itself. Narrowing the fixture set back to what it was
    # makes three live generators invisible to the guard again.
    (1305, "the fixture set stops reaching three of the five generators",
     "tests/unit/agent-loop-claims.test.ts",
     "    weekendFixture(true),\n    weekendFixture(false),\n    repeatFixture(),\n    rhythmFixture(),",
     "  ",
     CLAIMS),

    # ── Step 0.5 · the two remaining known claims ───────────────────────────
    #
    # Each restores one personal-biology claim. The guard that catches them
    # CALLS `getProfileInfo` over every key in the table rather than scanning
    # the file, because a rule aimed at one entry says nothing about the other
    # seven — and three of the eight were asserting a biological state.
    (1306, "the demo dashboard asserts an inner food system is working", DASHBOARD,
     'tagline: "Your answers described a wide range of foods, arriving consistently."',
     'tagline: "Your inner food system is working hard in your favour."',
     CLAIMS),

    (1307, "a legacy profile asserts food system health is performing", DASHBOARD,
     'tagline: "Your answers described strong, steady food patterns across the week."',
     'tagline: "Your food system health is performing at its peak."',
     CLAIMS),

    (1308, "a legacy profile asserts the gut is ready for more", DASHBOARD,
     'tagline: "Your answers described room for more — more variety, more plants, more fibre."',
     'tagline: "Your gut is ready for more — more variety, more plants, more life."',
     CLAIMS),

    (1309, "the lifecycle email turns the score into a claim about the body", EMAIL,
     "your Biotics Score\u2122 summarises patterns in the answers you gave about how you currently eat",
     "your Biotics Score\u2122 reflects something real about how your food system is working right now",
     CLAIMS),

    # And the guard's own coverage: narrowing it to one tagline must fail,
    # because that is precisely how three of eight went unread.
    (1310, "the tagline guard stops reading the whole table", "tests/unit/agent-loop-claims.test.ts",
     "      ...Object.values(PROFILE_INFO).map((p) => p.tagline),",
     "      PROFILE_INFO[\"Strong Foundation\"].tagline,",
     CLAIMS),

    # ── Step 1 · a reassessment creates history and never rewrites it ───────
    #
    # The defect this step exists to prevent, restored: the in-progress
    # assessment written to a canonical slot, so a second one lands on the
    # first one's record.
    (1311, "the draft is written to a canonical assessment slot", "lib/fss/persistence/local.ts",
     'const DRAFT_PREFIX = "assessment.draft."',
     'const DRAFT_PREFIX = "assessment."',
     # TEST LIST CORRECTED: the guard that reads the REAL adapter's keys lives
     # in the persistence suite. The system suite runs against an in-memory
     # fixture that hard-codes its own key strings, which is exactly why this
     # one line went unguarded until a sabotage case asked.
     PERSIST),

    (1312, "the completed assessment reuses one id for every attempt", ESTABLISH,
     "    id: draft.id,\n    assessmentVersion: draft.assessmentVersion,",
     '    id: "candidate",\n    assessmentVersion: draft.assessmentVersion,',
     SYSTEM),

    (1313, "the chain link is dropped, so history collapses to a single system", ESTABLISH,
     "    previousSystemId: draft.previousSystemId,",
     "    previousSystemId: null,",
     SYSTEM),

    (1314, "the predecessor is read fresh instead of from the attempt", ESTABLISH,
     "    previousSystemId: draft.previousSystemId,",
     "    previousSystemId: await repo.loadCurrentSystemId(),",
     SYSTEM),

    (1315, "a missing predecessor stops failing closed", VALIDATE,
     '    if (!previousSystem || previousSystem.id !== system.previousSystemId) {\n      return fail("previous-system-unresolvable")\n    }',
     '    if (false) {\n      return fail("previous-system-unresolvable")\n    }',
     SYSTEM),

    (1316, "any assessment id is accepted again, minted or not", VALIDATE,
     '  if (!isMintedId(system.assessmentId, "assessment") && system.assessmentId !== LEGACY_ASSESSMENT_ID) {\n    return fail("assessment-id-not-minted")\n  }',
     '  if (false) {\n    return fail("assessment-id-not-minted")\n  }',
     SYSTEM),

    # The draft cleared BEFORE the commit point: a failed establishment then
    # loses somebody's answers as well as their new system.
    (1317, "the draft is discarded before the pointer is written", ESTABLISH,
     "  failure = await step(7, () => repo.setCurrentSystem(systemId))\n  if (failure) return { ok: false, failure }",
     "  await abandonDraft({ repo, draftId: draft.id }).catch(() => {})\n  failure = await step(7, () => repo.setCurrentSystem(systemId))\n  if (failure) return { ok: false, failure }",
     SYSTEM),

    (1318, "a stale draft is resumed under an instrument that has moved", DRAFT,
     '  if (draft.questionSetVersion !== set.questionSetVersion) return { state: "stale", draft }',
     '  if (false) return { state: "stale", draft }',
     SYSTEM),

    (1319, "a stored cursor is trusted over the answers it describes", DRAFT,
     "  return stored <= derived ? stored : derived",
     "  return stored",
     SYSTEM),

    (1320, "abandoning an attempt also clears the established system", DRAFT,
     "  await args.repo.clearCurrentDraft()\n  await args.repo.deleteDraft(args.draftId)",
     "  await args.repo.clearCurrentDraft()\n  await args.repo.deleteDraft(args.draftId)\n  await args.repo.clearCurrentSystem()",
     SYSTEM),

    # ── STEP 2A · the fifth comparability axis ───────────────────────────────
    #
    # These mutate the BOUNDARY, not a delta, because step 2a produces no
    # delta. The cases that restore a per-domain change under a moved schema
    # belong to 2b, where the first subtraction exists.
    #
    # 1324 is the one this step was built around: a sixth domain added without
    # moving the version. It breaks `tsc` too — but the harness runs vitest,
    # and a widened TYPE is invisible to vitest. That is precisely how four
    # Gate 4 mutations got through, so the guard reads the union as SOURCE.

    (1321, "domain comparability stops refusing a schema that moved", COMPARE,
     '  if (a === b) return { comparable: true, via: "same-domain-schema" }',
     '  return { comparable: true, via: "same-domain-schema" }\n  if (a === b) return { comparable: true, via: "same-domain-schema" }',
     ENGINE),

    # The pair that is EQUAL because both are absent. An implementation that
    # checks equality before presence lets exactly these through, and they are
    # every score written before the anchor existed.
    (1322, "an absent domain schema is treated as a match", COMPARE,
     "  if (!a || !b) {",
     "  if (false) {",
     ENGINE),

    (1323, "a compatibility pair is invented for the domain schema", COMPARE,
     "export const COMPARABLE_DOMAIN_SCHEMAS: readonly (readonly [string, string])[] = []",
     'export const COMPARABLE_DOMAIN_SCHEMAS: readonly (readonly [string, string])[] = [\n  ["domains-v1.0", "domains-v2.0"],\n]',
     ENGINE),

    (1324, "a sixth scored domain appears without the schema version moving", QTYPES,
     '  | "mealRhythm"',
     '  | "mealRhythm"\n  | "hydration"',
     ENGINE),

    (1325, "the domain list diverges from the union it is meant to mirror", SCHEMA,
     '  "mealRhythm",\n] as const',
     '] as const',
     ENGINE),

    # Present in memory, absent from storage — the shape where a field looks
    # written and is not. The guard reads it back THROUGH the repository.
    (1326, "the stored score stops recording which domains composed it", ESTABLISH,
     "    domainSchemaVersion: DOMAIN_SCHEMA_VERSION,",
     "    ...(false ? { domainSchemaVersion: DOMAIN_SCHEMA_VERSION } : {}),",
     SYSTEM),

    # ── STEP 2B · can these two Food Systems be compared, and in what ways? ──
    #
    # A comparison is a relationship between two immutable Food Systems, not
    # between two loose scores. These attack the resolution of the pair, the
    # two verdicts gating it, and the states that exist because the verdicts
    # can disagree.

    # THE ONE THAT NEEDED A SPECIFIC TEST TO BE CATCHABLE. "Latest two by date"
    # agrees with the chain whenever you are viewing the newest system, so the
    # guard views B while C exists and is newer.
    (1327, "the pair is chosen by date instead of by the chain", COMPARE_SYS,
     "  const previous = await repo.loadSystem(current.previousSystemId)",
     "  const all = await Promise.all(\n    [current.previousSystemId, await repo.loadCurrentSystemId()].map((i) =>\n      i ? repo.loadSystem(i) : null,\n    ),\n  )\n  const previous = all\n    .filter((s): s is NonNullable<typeof s> => s !== null && s.id !== current.id)\n    .sort((x, y) => y.establishedAt.localeCompare(x.establishedAt))[0]",
     SYSTEM),

    (1328, "a moved domain schema still produces per-domain deltas", COMPARE_SYS,
     '  if (!domainVerdict.comparable) {\n    return { state: "score-only-comparable", ...common, scoreVerdict, domainVerdict, score }\n  }',
     "",
     SYSTEM),

    (1329, "a refused score comparison returns a delta anyway", COMPARE_SYS,
     '  if (!scoreVerdict.comparable) {\n    return { state: "refused", ...common, scoreVerdict, domainVerdict }\n  }',
     "",
     SYSTEM),

    # Availability collapsed into comparability: an absent number invented as a
    # zero, which manufactures a score of 0 and a delta out of nothing.
    (1330, "a withheld score is treated as zero rather than as no number", COMPARE_SYS,
     "  if (typeof a !== \"number\" || typeof b !== \"number\") return null",
     "  if (typeof a !== \"number\" || typeof b !== \"number\") {\n    return { previous: a ?? 0, current: b ?? 0, delta: (b ?? 0) - (a ?? 0), direction: direction((b ?? 0) - (a ?? 0)) }\n  }",
     SYSTEM),

    # A record problem dressed up as a methodological statement.
    (1331, "a missing predecessor record is reported as a refusal", COMPARE_SYS,
     '      failed: "previous-system-record-missing",',
     '      failed: "score-record-missing",',
     SYSTEM),

    (1332, "disagreeing domain sets under one schema version are tolerated", COMPARE_SYS,
     '  if (before.size !== after.size) return "disagree"\n  for (const name of after.keys()) if (!before.has(name)) return "disagree"',
     "",
     SYSTEM),

    (1333, "a legacy score is upgraded because its neighbour is current", COMPARE_SYS,
     "  const scoreVerdict = canCompare(previousScore.provenance, currentScore.provenance)",
     "  const scoreVerdict = canCompare(currentScore.provenance, currentScore.provenance)",
     SYSTEM),

    # Invariant 3: no subtraction outside the comparison module. Mutates a REAL
    # candidate component, which is where this would actually appear.
    (1334, "a component computes its own score delta", "components/fss/system/progress.tsx",
     "  const { progress, review } = slice",
     "  const { progress, review } = slice\n  const previousScore = 0\n  const currentScore = 0\n  const drift = currentScore - previousScore\n  void drift",
     SYSTEM),

    # The key-set pin: prose arriving in a module that is specified to hold none.
    (1335, "the comparison gains a prose field", COMPARE_SYS,
     '  return { state: "fully-comparable", ...common, scoreVerdict, domainVerdict, score, domains }',
     '  return { state: "fully-comparable", ...common, scoreVerdict, domainVerdict, score, domains, headline: "Your score moved" }',
     SYSTEM),
# ── STEP 2C · what can be honestly said changed ──────────────────────────
    #
    # 2b decided whether comparison is allowed; these attack what is said about
    # an allowed one. The causality boundary is the subject of most of them.

    # THE CALL THIS STEP TURNS ON. B's actions were created moments ago and are
    # all `planned`, so counting them shows "0 of N done" right after every
    # reassessment and erases the period's record.
    (1336, "the new system's untouched plan is counted instead of the lived one", CHANGED,
     "  const actions = countActions(await repo.loadActions(previous.scoreId))",
     "  const actions = countActions(await repo.loadActions(current.scoreId))",
     SYSTEM),

    (1337, "a refused comparison still compares the unscored answers", CHANGED,
     "  if (!comparison.scoreVerdict.comparable) {\n    return { state: \"available\", comparison, actions }\n  }",
     "",
     SYSTEM),

    # An empty list renders as "nothing changed", which is a claim.
    (1338, "withheld observations become an empty list instead of absent", CHANGED,
     "    return { state: \"available\", comparison, actions }\n  }\n\n  const previousAssessment",
     "    return { state: \"available\", comparison, actions, observations: [], context: [] }\n  }\n\n  const previousAssessment",
     SYSTEM),

    # A direction on an observation is the first step to "your energy improved".
    (1339, "an observation change gains a direction", CHANGED,
     "      return { questionId: q.id, order: q.order, question: q.text, previous, current, state }",
     "      return { questionId: q.id, order: q.order, question: q.text, previous, current, state, direction: (b ?? 0) > (a ?? 0) ? \"higher\" : \"lower\" }",
     SYSTEM),

    (1340, "a context change carries the value behind it", CHANGED,
     "      state: was === is ? \"unchanged\" : is ? \"appeared\" : \"disappeared\",",
     "      state: was === is ? \"unchanged\" : is ? \"appeared\" : \"disappeared\",\n      value: b.states[constraint],",
     SYSTEM),

    (1341, "the action total stops iterating the state union", CHANGED,
     "  const total = ACTION_STATES.reduce((n, s) => n + of(s), 0)",
     "  const total = of(\"planned\") + of(\"done\")",
     SYSTEM),

    # ── the copy ─────────────────────────────────────────────────────────────

    (1342, "the co-occurrence sentence drops its refusal of the join", CHANGED_COPY,
     "`You marked ${done} actions done in the same period that these answers changed. Both happened; we cannot tell you that one produced the other, and a month holds a great deal besides.`",
     "`You marked ${done} actions done, and these answers changed because of it.`",
     SYSTEM),

    (1343, "the score note claims a measurement of the body", CHANGED_COPY,
     '"Both numbers come from the same version of the assessment, so the change describes a change in the answers you gave about how you eat. It is not a measurement of your gut, and it does not say what caused the difference.",',
     '"Both numbers come from the same version of the assessment, so your gut has measurably improved.",',
     SYSTEM),

    (1344, "a constraint lifting is rendered as an improvement", CHANGED_COPY,
     "  contextDisappeared: (label: string) => `You no longer describe ${label} as being in the way.`,",
     "  contextDisappeared: (label: string) => `${label} improved for you since last time.`,",
     SYSTEM),

    (1345, "the action facts claim the person did the thing", CHANGED_COPY,
     "    `You marked ${done} of ${total} planned actions done during this period.`,",
     "    `You completed ${done} of ${total} actions, and it is working.`,",
     SYSTEM),

    (1346, "a domain change sentence is anchored to baseline again", CHANGED_COPY,
     '      "Your answers described a wider range of plant foods than at your previous assessment.",',
     '      "Your answers described a wider range of plant foods than at baseline.",',
     SYSTEM),

    # ── one longitudinal authority ───────────────────────────────────────────

    (1347, "the meal window claims a provenance it does not have", PATTERNS,
     "  return LEGACY_PROVENANCE",
     "  return FSS_V1_PROVENANCE",
     CLAIMS),

    (1348, "the fortnight trend subtracts without asking", PATTERNS,
     "  if (!canCompare(mealWindowProvenance(prior), mealWindowProvenance(recent)).comparable) {\n    return null\n  }",
     "",
     CLAIMS),

    (1349, "the Day-75 retest subtracts without asking", RETEST,
     "    const verdict = canCompare(provenance.previous, provenance.latest)\n    if (!verdict.comparable) {\n      return { kind: \"compare-refused\", baseline, latest, days, because: verdict.explain }\n    }",
     "",
     SYSTEM),

    (1350, "Progress reports one score when there are two", COMPOSE,
     "    scoresAvailable: system.previousSystemId === null ? 1 : 2,",
     "    scoresAvailable: 1,",
     SYSTEM),
]
