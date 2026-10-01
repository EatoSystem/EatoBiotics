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

CLAIMS = ["tests/unit/agent-loop-claims.test.ts"]
SYSTEM = ["tests/unit/my-food-system.test.ts"]
PERSIST = ["tests/unit/fss-persistence.test.ts"]

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
]
