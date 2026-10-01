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

CLAIMS = ["tests/unit/agent-loop-claims.test.ts"]

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
]
