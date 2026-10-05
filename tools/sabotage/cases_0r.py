# EXPERIENCE 0R TRANCHE 1 — THE ENFORCEMENT BOUNDARY. Cases 1450+.
#
# 0R-1 widened the claims corpus by 33 files and recorded what that exposed as
# a shrinking inventory. 0R-2 closed the D7 gap in the derived ledger and added
# the first data-flow guard over non-textual claim forms.
#
# Neither tranche repaired a product surface. Both are pure enforcement, which
# makes them the one kind of work this harness is most needed for:
#
# ── THE INVARIANT EVERY CASE HERE ATTACKS ────────────────────────────────────
#
#   A guard whose only output is "green" cannot be distinguished from a guard
#   that looks at nothing. The widening, the inventory and the form track must
#   each be provably load-bearing, or 0R has recorded debt it is not actually
#   holding.
#
# So the targets are: can a corpus leave the scan again, can a rule family leave
# the scan again, can the inventory GROW, can an entry OUTLIVE its defect, and
# can a module leave the form instrument while staying inventoried.
#
# ── THESE CASES ARE AIMED AT TEST SOURCE, DELIBERATELY ───────────────────────
#
# Most cases in this harness mutate production code. Tranche 1 ships no
# production change at all, so its deliverable IS the instrument — and the
# precedent exists: case 1310 mutates `agent-loop-claims.test.ts` for the same
# reason. Three cases (1456, 1461, 1462) do mutate production files, because
# "the widening sees a NEW claim" can only be proved by introducing one.
#
# ── WRITING THESE CASES FOUND TWO WEAK TESTS OF MY OWN ───────────────────────
#
# Both inventories pinned their length with `toBeLessThanOrEqual`, which is a
# ratchet with a loose pawl: after a repair takes the list below the cap, the
# gap is room for one new claim. 1456 and 1462 slipped against that form. Both
# constants now have to EQUAL their list.
#
# And `it.each(VISUAL_MODULES)` only looks at what the list names, so removing
# an inventoried file from `VISUAL_MODULES` deleted it from the instrument and
# broke nothing — 1461. Membership is now asserted both ways round.
#
# Two tests strengthened before the suite ran, which is the harness doing its
# job in advance of its own first execution.

CLAIMS = "tests/unit/biotic-claims.test.ts"
CORPUS = "tests/unit/customer-surfaces.ts"
VISUAL = "tests/unit/biotic-visual-encoding.test.ts"

SUBSCORES = "lib/report/subscores.ts"
SYSTEM_MAP = "lib/account/system-map.ts"
STAGE_MOOD = "lib/account/stage-mood.ts"

C = [CLAIMS]
V = [VISUAL]

CASES = [
    # ── 1 · A CORPUS LEAVES THE SCAN AGAIN ──────────────────────────────────
    #
    # `P0-GUARD-01` and `P0-GUARD-02` were both this exact state: the corpus
    # existed, the guard worked, and the two were never joined. The tranche
    # membership assertion is what makes reverting that a failure rather than a
    # silent narrowing.

    (1450, "the Account corpus is dropped from GUARDED_SURFACES (P0-GUARD-01 reopens)", CLAIMS,
     "  ...[...ACCOUNT_SURFACES, ...ASSESSMENT_SURFACES, ...REPORT_SURFACES].filter(",
     "  ...[...ASSESSMENT_SURFACES, ...REPORT_SURFACES].filter(",
     C),

    (1451, "the Report corpus is dropped from GUARDED_SURFACES (P0-GUARD-02 reopens)", CLAIMS,
     "  ...[...ACCOUNT_SURFACES, ...ASSESSMENT_SURFACES, ...REPORT_SURFACES].filter(",
     "  ...[...ACCOUNT_SURFACES, ...ASSESSMENT_SURFACES].filter(",
     C),

    # A quieter form of the same thing, and the one a manual list invites: not
    # dropping the corpus, dropping one FILE out of it. Nothing in the tranche
    # membership test notices — a file removed from the tranche is removed from
    # both sides of that assertion. The D7 ledger is what catches it, because
    # `lib/assessment-report.ts` is reachable and carries a claim, so losing its
    # guard puts it in `unguardedClaimFiles()` and out of agreement with
    # `KNOWN_UNCORRECTED`. This is 0R-2 protecting 0R-1.
    (1452, "one file quietly leaves the Report corpus, and D7 catches it", CORPUS,
     '  "lib/assessment-report.ts",',
     "",
     C),

    # ── 2 · A RULE FAMILY LEAVES THE SCAN ───────────────────────────────────
    #
    # The widening feeds THREE rule families, which the pre-flight measurement
    # got wrong by measuring one. Dropping a family from the inventory's rule
    # set would make every entry it names unresolvable.

    (1453, "PERSONAL_BIOTIC_STATE leaves the inventory's rule set", CLAIMS,
     "  const ALL_CLAIM_RULES: [string, RegExp][] = [\n    ...PERSONAL_BIOTIC_STATE,",
     "  const ALL_CLAIM_RULES: [string, RegExp][] = [",
     C),

    (1454, "FERMENTED_LIVE_CLAIMS leaves the inventory's rule set", CLAIMS,
     "    ...FERMENTED_LIVE_CLAIMS,\n    ...FIBRE_PREBIOTIC_CLAIMS,\n  ]\n\n  it(\"0R-1: every inventory entry still describes a real claim\"",
     "    ...FIBRE_PREBIOTIC_CLAIMS,\n  ]\n\n  it(\"0R-1: every inventory entry still describes a real claim\"",
     C),

    # THE D7 DEFECT ITSELF, restored. The derived ledger ran two thirds of the
    # rules for its whole life, so a personal Biotic claim on an unguarded
    # reachable file was invisible to the one instrument built to find exactly
    # that. Removing the line that fixed it must not be quiet.
    (1455, "the derived ledger loses PERSONAL_BIOTIC_STATE again (the D7 gap)", CLAIMS,
     "    ...FIBRE_PREBIOTIC_CLAIMS,\n    ...PERSONAL_BIOTIC_STATE,\n  ]",
     "    ...FIBRE_PREBIOTIC_CLAIMS,\n  ]",
     C),

    # ── 3 · THE INVENTORY GROWS, OR OUTLIVES ITS DEBT ───────────────────────
    #
    # The whole value of a shrinking baseline is that it cannot become
    # permanent and cannot become a parking space. Both halves get a case.

    (1456, "the cap is raised to buy room for a new claim", CLAIMS,
     "const ENTRIES_AT_0R1_OPEN = 19",
     "const ENTRIES_AT_0R1_OPEN = 25",
     C),

    # An entry for a file that does not carry the claim it names. This is the
    # shape an allowlist takes when somebody adds a path to make a suite green,
    # and the "still describes a real claim" assertion is the only thing
    # standing between the inventory and that.
    (1457, "a bogus inventory entry is added for a clean file", CLAIMS,
     '  ["lib/fallback-paid-report.ts",\n   "live foods named as a category beside fermented ones", "live or fermented food"],',
     '  ["lib/fallback-paid-report.ts",\n   "live foods named as a category beside fermented ones", "live or fermented food"],\n'
     '  ["lib/report/subscores.ts", "a Biotic claimed as a person\'s own", "nothing of the kind"],',
     C),

    # ── 4 · THE WIDENING SEES A NEW CLAIM ───────────────────────────────────
    #
    # The one case that proves the corpus widening does product work rather
    # than bookkeeping: a prohibited sentence introduced on a file that entered
    # the scan at 0R-1 and is NOT in the inventory. Before 0R-1 this file was
    # outside every claims guard in the repository.

    (1458, "a personal Biotic claim is introduced on a newly guarded Report module", SUBSCORES,
     "export const PATHWAY_LABEL: Record<BioticScoreKey, string> = {",
     'export const PATHWAY_SUMMARY = "Your Prebiotics are strong."\n\n'
     "export const PATHWAY_LABEL: Record<BioticScoreKey, string> = {",
     C),

    # ── 5 · THE FORM TRACK ──────────────────────────────────────────────────
    #
    # `P0-SCIENCE-04` is a verdict encoded as a COLOUR and survived four claim
    # sweeps because it contains no prohibited string. These cases attack the
    # data-flow instrument that finally sees it.

    (1459, "the visual sink stops recognising a colour", VISUAL,
     '  ["a colour or gradient", /\\b(?:\\w*[Gg]radient\\w*|\\w*[Cc]olou?r\\w*|\\w*[Tt]int\\w*|\\w*[Aa]ura\\w*)\\b/],',
     '  ["a colour or gradient", /\\bnosuchsinkanywhere\\b/],',
     V),

    (1460, "the anatomical-coordinate rule stops matching the real shape", VISUAL,
     "const ANATOMICAL_COORDINATE = /\\bnode\\s*:\\s*\\{\\s*x\\s*:/",
     "const ANATOMICAL_COORDINATE = /\\bnode\\s*:\\s*\\{\\s*zz\\s*:/",
     V),

    # Removing a file from the instrument is not repairing it. twin-stage.tsx
    # carries BOTH forms — the aura colour and the body coordinate — so this is
    # the single most consequential file to be able to drop silently.
    (1461, "an inventoried module is dropped from VISUAL_MODULES", VISUAL,
     '  "components/account/twin/twin-stage.tsx",\n  "components/account/twin/daily-ritual.tsx",',
     '  "components/account/twin/daily-ritual.tsx",',
     V),

    (1462, "the visual cap is raised to buy room for a new encoding", VISUAL,
     "const VISUAL_ENTRIES_AT_OPEN = 4",
     "const VISUAL_ENTRIES_AT_OPEN = 8",
     V),

    # ── 6 · A NEW ENCODING APPEARS ──────────────────────────────────────────
    #
    # The form track's equivalent of 1458, and it takes two cases because
    # `P0-SCIENCE-04` and `P0-SCIENCE-05` are different forms: a Biotic reaching
    # a colour, and a self-report reaching a point on the body.
    #
    # Both targets are one step from the defect already, which is what makes
    # them the right targets. `system-map.ts` reads a `BioticKey` and has no
    # visual sink; `stage-mood.ts` produces an aura and reads no Biotic.

    (1463, "a Biotic-keyed module gains a colour, completing the flow", SYSTEM_MAP,
     "  /** The biotic this system leans on most. */\n  biotic: BioticKey",
     "  /** The biotic this system leans on most. */\n  biotic: BioticKey\n"
     "  /** Aura colour drawn from that biotic. */\n  auraColour: string",
     V),

    # ── 7 · THE LEDGER'S GRANULARITY ────────────────────────────────────────
    #
    # Added after s7b 1007 and 1011 SLIPPED against this tranche's own work.
    # `KNOWN_UNCORRECTED` was a file list, so the three files 0R-2 added to it
    # for a personal-Biotic claim silently acquired an allowance for the
    # fermented and fibre rule families too, and two long-standing cases went
    # quiet. The ledger is now (file, RULE), and these two cases are what keep
    # it that way: both attack the staleness assertion, which is the only thing
    # that makes a pair's RULE half mean anything.

    (1465, "a ledger entry names a rule its file does not trip", CLAIMS,
     '  ["lib/account/ritual.ts", "a Biotic claimed as a person\'s own"],',
     '  ["lib/account/ritual.ts", "a Biotic claimed as a person\'s own"],\n'
     '  ["lib/account/ritual.ts", "colonisation or reseeding claimed"],',
     C),

    # The louder half. An entry whose rule name matches nothing in ALL_RULES
    # does not allow one claim — it names no claim at all, so a reader would
    # take the file as covered while the pair constrains nothing.
    (1466, "a ledger entry names a rule that does not exist", CLAIMS,
     '  ["lib/assessment-scoring.ts", "a Biotic claimed as a person\'s own"],',
     '  ["lib/assessment-scoring.ts", "whatever it happens to say"],',
     C),

    (1464, "a self-report module gains an anatomical coordinate", STAGE_MOOD,
     "    auraMult: Number((fedMult * nightDamp).toFixed(2)),",
     "    node: { x: 50, y: 52 },\n    auraMult: Number((fedMult * nightDamp).toFixed(2)),",
     V),
]
