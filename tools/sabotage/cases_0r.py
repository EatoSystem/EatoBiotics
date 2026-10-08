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
ASK_TWIN = "components/account/twin/ask-twin.tsx"
CONSULT = "app/account/consult/consult-client.tsx"
TEXTCHAT = "components/eatobiotic/text-chat.tsx"
DASH = "components/account/live-dashboard.tsx"
SYSTEM_MAP = "lib/account/system-map.ts"
STAGE_MOOD = "lib/account/stage-mood.ts"
# 0R-5.
TWIN_VISUAL = "lib/account/twin-visual.ts"
TWIN_STAGE = "components/account/twin/twin-stage.tsx"
RITUAL = "lib/account/ritual.ts"
DAILY_RITUAL = "components/account/twin/daily-ritual.tsx"
MEAL_IMPACT = "lib/account/meal-impact.ts"
LOOP_CARD = "components/account/daily-loop-card.tsx"
ACCOUNT_PAGE = "app/account/page.tsx"
QUICK_LOG = "components/account/twin/quick-log.tsx"
# 0R-6 — the paid path.
FULL_REPORT = "components/assessment/full-report-client.tsx"
ASSESS_REPORT = "lib/assessment-report.ts"
PAID_POLICY = "lib/paid-flow-policy.ts"

C = [CLAIMS]
V = [VISUAL]
# 0R-3. The behavioural guard lives where CLAUDE.md says a generator of
# customer-facing prose belongs; the authorship boundary has its own file.
LOOP = ["tests/unit/agent-loop-claims.test.ts"]
AUTH = ["tests/unit/ai-authorship.test.ts"]
FAB = ["tests/unit/live-dashboard-fabrication.test.ts"]
# 0R-6. `P1-VOCAB-01` and `P0-SCIENCE-07` both land in the vocabulary suite:
# the first because CLAUDE.md rules the retired name there, the second because
# the spec names that file and the reachability pin lives beside it.
VOCAB = ["tests/unit/retired-vocabulary.test.ts"]

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
    # ── RENAMED BY WHAT 0R-6 DID TO IT ─────────────────────────────────────
    #
    # The title said "and D7 catches it", and at 0R-6 that stopped being true.
    # D7 caught it because `lib/assessment-report.ts` was reachable and carried
    # a claim, so losing its guard put it in `unguardedClaimFiles()`. 0R-6
    # repaired the claims out of that file, D7 went correctly silent, and the
    # entry became droppable with nothing failing — SLIPPED.
    #
    # The deeper problem, which is now written into the test: a corpus entry
    # was protected by the presence of a DEFECT in the file it names. Every
    # file this programme successfully cleans becomes a file that can silently
    # leave the scan, and the cleanest files are the ones whose guard entry
    # looks most droppable. `biotic-claims.test.ts` now pins all three 0R-1
    # tranches as exact sets, for what they ARE rather than for what is
    # currently wrong inside them.
    (1452, "one file quietly leaves the Report corpus", CORPUS,
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
     # 0R-6 · the cap moved 19 -> 17 when both `lib/assessment-report.ts`
     # entries were repaired, so the anchor moved with it. An anchor pinned to
     # a shrinking number has to follow the number, or the case reports
     # ANCHOR MISSING and silently stops testing anything.
     "const ENTRIES_AT_0R1_OPEN = 17",
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

    (1462, "the module pin drops its three newest entries", VISUAL,
     # REPOINTED AT 0R-5, not retired. This read
     #   find "const VISUAL_ENTRIES_AT_OPEN = 4" → "= 8"
     # and its property was "the inventory cap can be raised to buy room for a
     # new encoding". 0R-5 repaired all four inventoried encodings, so the
     # inventory AND its cap are deleted — the anchor vanished because the
     # defect did, which is the outcome the case wanted.
     #
     # The residual risk moved with it. With no inventory left to cross-check
     # against, `MODULES_AT_0R5_CLOSE` is the only thing stopping a module
     # leaving the instrument, so that is what this case now attacks: empty the
     # pin and it stops pinning. Case 1508 attacks the other half, by shortening
     # `VISUAL_MODULES` itself.
     # 0R-6 · the tail of MODULES_AT_0R5_CLOSE gained the paid Report, so the
     # old two-line anchor no longer matched. Same lesson as 1456 above.
     #
     # 0R-6R · AND AGAIN, for the third time, which is the lesson itself: AN
     # ANCHOR PINNED TO A SHRINKING NUMBER HAS TO FOLLOW THE NUMBER. Three
     # modules were added at 0R-6R, so the tail moved once more. The attack and
     # the contract are unchanged — drop entries and the literal stops equalling
     # the list.
     '  // 0R-6R · the three live paid renderers. See the block in VISUAL_MODULES.\n'
     '  "components/report/food-system-section.tsx",\n'
     '  "lib/pdf/food-system-pdf.tsx",\n'
     '  "lib/pdf/report-pdf.tsx",\n] as const',
     "] as const",
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
     # REPOINTED AT 0R-5. The anchor was `biotic: BioticKey` on
     # `SystemHotspot`, which 0R-5 removed — its last reader was `twin-stage`
     # passing it into a colour function, and it now passes a static `tone`.
     #
     # The PROPERTY is unchanged and still worth attacking: a module that holds
     # a per-Biotic value and also produces a colour completes the prohibited
     # flow. So the mutation puts such a field BACK, beside the `tone` already
     # there.
     #
     # ── RE-AIMED AT 0R-6R, AND IT SLIPPED FIRST ───────────────────────────
     #
     # The mutation was `biotic: BioticKey`, and 0R-6R RETIRED the rule that saw
     # it after measuring that the rule fires on exactly four things in the whole
     # module list and not one is a defect: two comments recording removals, and
     # two taxonomy keys. Its own `PRE_REPAIR` subject asserted that a SIGNATURE
     # was the defect, and the identical signature — `bioticAccent(key:
     # BioticScoreKey)` — is the product's legitimate education palette.
     #
     # So the case was aimed at the wrong thing, which is the one condition
     # under which a slip is fixed in the CASE rather than the test. 0R-2's
     # actual finding was always the per-Biotic READ at the call site, and that
     # is what this now restores: the real `meal-impact.ts` shape, a per-Biotic
     # score on a record that also carries a colour.
     "  tone: AuraTone",
     "  tone: AuraTone\n  /** Derived from the member's per-Biotic score. */\n  prebiotic_score: number",
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
     # REPOINTED AT 0R-5. It keyed on the `ritual.ts` ledger entry, which 0R-5
     # removed because the defect is repaired — so the anchor vanished for the
     # right reason. Re-aimed at `lib/assessment-scoring.ts`, the one 0R-2
     # finding still open (0R-7's), so the property — "an entry may not name a
     # rule its file does not trip" — keeps a live subject.
     '  ["lib/assessment-scoring.ts", "a Biotic claimed as a person\'s own"],',
     '  ["lib/assessment-scoring.ts", "a Biotic claimed as a person\'s own"],\n'
     '  ["lib/assessment-scoring.ts", "colonisation or reseeding claimed"],',
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

    # ── 8 · 0R-3 · AUTHORSHIP AND AI PREMISE INTEGRITY ──────────────────────
    #
    # P0-TRUST-05 was a chain: a product-authored personal premise became a
    # query parameter, was auto-sent on mount as the member's own first message,
    # and the model answered ON that premise. Nine layers carried one
    # undifferentiated `Message[]`; two of them changed authorship and seven
    # could not tell.
    #
    # The repair is structural — a suggestion can only reach `setInput`, and a
    # sender can only be called with the member's draft — so these cases attack
    # the construction path rather than a label.

    # THE PREMISE ITSELF. The claim was INTERPOLATED, so it put no Biotic word
    # in the file and no corpus scan could ever have seen it. Only a guard that
    # CALLS the generator catches this, which is why the case targets production
    # source and runs the behavioural suite.
    (1467, "a suggested question is derived from the weakest Biotic again", ASK_TWIN,
     "  const prompts: string[] = []",
     "  const prompts: string[] = []\n"
     "  prompts.push(`Why is my ${twin.biotics.weakest} level my weakest?`)",
     LOOP),

    # THE SILENT TRANSFORMATION. `?q=` may initialise a draft and nothing else.
    (1468, "the q parameter auto-sends on mount again", CONSULT,
     "    if (q) setInput(decodeURIComponent(q))",
     "    if (q) void sendMessage(decodeURIComponent(q))",
     AUTH),

    # A SUGGESTION SPEAKING FOR THE MEMBER. One gesture, but the text is still
    # product-authored and arrives stamped `role: "user"`.
    (1469, "a starter chip sends instead of drafting", CONSULT,
     "                    onClick={() => { setInput(q); inputRef.current?.focus() }}",
     "                    onClick={() => sendMessage(q)}",
     AUTH),

    # THE SAME DEFECT IN THE SECOND CLIENT. `text-chat.tsx` was not in the
    # register; it was found by tracing the class rather than the instance.
    (1470, "the second chat client's chip sends instead of drafting", TEXTCHAT,
     "              onClick={() => setInput(chip)}",
     "              onClick={() => send(chip)}",
     AUTH),

    # THE HOLE THE NARROW RULE WOULD HAVE LEFT. The argument IS the draft, so
    # the draft rule permits it; only "no effect may send" refuses it.
    (1471, "a send is moved into an effect with non-empty deps", CONSULT,
     "  useEffect(() => {\n    bottomRef.current?.scrollIntoView({ behavior: \"smooth\" })\n  }, [messages])",
     "  useEffect(() => {\n    bottomRef.current?.scrollIntoView({ behavior: \"smooth\" })\n    if (input) void sendMessage(input)\n  }, [messages])",
     AUTH),

    # CHANNEL 3 FOLDED INTO CHANNEL 1. Deterministic product fact travels
    # server-side as system context; concatenating it into the authored text
    # makes the product the author of the member's words.
    (1472, "product context is folded into the member's authored text", CONSULT,
     "    const userMsg: Message = { role: \"user\", content: text.trim() }",
     "    const memberProfile = `score ${overallScore}`\n"
     "    const userMsg: Message = { role: \"user\", content: `${text.trim()} (${memberProfile})` }",
     AUTH),

    # THE GUARD'S OWN VACUITY CHECK. Renaming the sender must not silently
    # empty the instrument — `senderName` reads the declaration rather than
    # hardcoding, and refuses when it finds nothing.
    (1473, "the sender is renamed so the guard can no longer find it", CONSULT,
     "  async function sendMessage(text: string) {",
     "  async function dispatchToModel(text: string) {",
     AUTH),

    # ── 9 · 0R-4 · FABRICATED MEMBER DATA ───────────────────────────────────
    #
    # The audit caught ONE of four live MOCK_MEALS manifestations, and knew
    # nothing of MOCK_CONSULTATIONS at all. So these cases attack the ROOT
    # property — a live member surface consuming a mock member-history constant
    # — rather than the four sentences that happened to be found.

    (1474, "Today's Meals falls back to fabricated meals again", DASH,
     "                {todayMeals.map((meal, i) => {",
     "                {(todayMeals.length > 0 ? todayMeals : MOCK_MEALS[0].meals).map((meal, i) => {",
     FAB),

    # The gate somebody already disabled once. `|| true` reads as a condition
    # and is not one.
    (1475, "the average gate is disabled with a tautology again", DASH,
     "                {todayMeals.length > 0 && todayAvg !== null && (",
     "                {(todayMeals.length > 0 || true) && (",
     FAB),

    (1476, "a meal count falls back to a literal again", DASH,
     "            const totalMeals = recentAnalyses.length",
     "            const totalMeals = analysesByDate.length > 0 ? recentAnalyses.length : 7",
     FAB),

    # The whole point of the root-level rule: a NEW mock constant, under a name
    # no existing rule knows, consumed on a live surface.
    # NOTE: first written so that it DECLARED `MOCK_HISTORY` without ever
    # reading it, and slipped — correctly, because the rule is about
    # CONSUMPTION and nothing consumed it. The case was aimed at the right
    # property and performed the wrong mutation. It now completes the ternary,
    # so the constant is genuinely read on a live surface.
    (1477, "a new mock constant is consumed on a live surface", DASH,
     "            const groups = analysesByDate.map(({ date, meals }) => ({\n"
     "              date,\n"
     "              cards: meals.map(a => realToMealEntry(a)),\n"
     "            }))",
     "            const MOCK_HISTORY = [{ date: \"Today\", cards: [] }]\n"
     "            const groups = analysesByDate.length > 0 ? analysesByDate.map(({ date, meals }) => ({\n"
     "              date,\n"
     "              cards: meals.map(a => realToMealEntry(a)),\n"
     "            })) : MOCK_HISTORY",
     FAB),

    (1478, "the attributed quotation gets a content fallback again", DASH,
     "                  {weeklyReport?.report_json?.pullQuote && (",
     "                  {(weeklyReport?.report_json?.pullQuote ?? \"Your probiotic score is your biggest lever right now.\") && (",
     FAB),

    (1479, "the report count falls back to a demo array's length again", DASH,
     "        const count     = reports.length",
     "        const count     = reports.length ?? MOCK_CONSULTATIONS.length",
     FAB),

    # The fused science construct. Restoring it makes the report card
    # structurally capable of rendering a personal per-Biotic state again.
    (1480, "the report card renders per-Biotic bars again", DASH,
     "      {/* Pull quote */}",
     "      {card.pillars && (\n"
     "        <div><p>Biotics this week</p>\n"
     "          <ScoreBar label=\"Prebiotic\" score={card.pillars.prebiotic} />\n"
     "        </div>\n"
     "      )}\n"
     "      {/* Pull quote */}",
     FAB),

    # The close condition: a new tab has not been audited for fabrication, so
    # 0R-4's claim does not extend to it.
    (1481, "a new live tab appears without a fabrication audit", DASH,
     '      {tab === "account" && (',
     '      {tab === "insights" && <div />}\n      {tab === "account" && (',
     FAB),

    # ══ 0R-5 · THE LIVE SCIENCE CONSTRUCTS. Cases 1482+. ═════════════════════
    #
    # Every one of these mutations restores a construct that rendered REAL
    # member data, which is the whole distinction the tranche exists to prove:
    # a guard that only refuses FABRICATION would pass all of them.
    #
    # ── WRITING THEM FOUND TWO DEFECTS IN MY OWN INSTRUMENTS ────────────────
    #
    # The widened per-Biotic-score rule in `biotic-visual-encoding.test.ts` was
    # written as `biotics\s*\.\s*(?:pre|pro|post)biotic\b`, which does NOT
    # match `twin.biotics.prebiotics.score` — the plural defeats the word
    # boundary — and that is the exact path the worst live site used. And the
    # non-vacuity case for the bar was a single `style` line, which carries no
    # Biotic read at all: the signature and the call site were the other two
    # thirds of the flow. The rule was widened and the case corrected.

    # ── A · the three ScoreBar triples, one case each ───────────────────────
    (1482, "the MealCard per-Biotic bars come back", DASH,
     "      {/* Meal Quality */}\n"
     "      <div className=\"px-4 pb-3 pt-3\">",
     "      <div className=\"px-4 pb-3 pt-3\">\n"
     "        <ScoreBar label=\"Prebiotic\"  score={0} />\n"
     "      </div>\n"
     "      {/* Meal Quality */}\n"
     "      <div className=\"px-4 pb-3 pt-3\">",
     C),

    (1483, "the first-meal celebration's per-Biotic bars come back", DASH,
     "        {result.insight && (",
     "        <ScoreBar label=\"Probiotic\"  score={result.probiotic_score} />\n"
     "        {result.insight && (",
     C),

    (1484, "the logger result's per-Biotic bars come back", DASH,
     "                  {/* ── MEAL QUALITY ── */}",
     "                  <ScoreBar label=\"Postbiotic\" score={0} />\n"
     "                  {/* ── MEAL QUALITY ── */}",
     C),

    # The card must not be STRUCTURALLY capable of carrying them — the prop
    # type, not only the render.
    (1485, "MealCard accepts a per-Biotic triple again", DASH,
     "function MealCard({ meal }: { meal: { image: string; name: string; time: string; type: string; score: number; insight: string; quality:",
     "function MealCard({ meal }: { meal: { image: string; name: string; time: string; type: string; score: number; insight: string; biotics: { prebiotic: number }; quality:",
     C),

    # The promise, at both of its sites. The register named only the paragraph.
    (1486, "the first-use copy promises a per-Biotic breakdown again", DASH,
     "                Log your first meal and we&apos;ll give it a Meal Biotics Score out of 100",
     "                Your Biotics score is built one meal at a time — an instant breakdown of its Prebiotic, Probiotic, and Postbiotic value",
     C),

    (1487, "step 2 promises a per-Biotic breakdown again", DASH,
     '{ n: "2", text: "Get its Meal Biotics Score straight away" }',
     '{ n: "2", text: "Get your instant Biotics score breakdown" }',
     C),

    # ── B · the Monthly Focus mechanism ─────────────────────────────────────
    (1488, "the Monthly Focus causal mechanism comes back", DASH,
     "            {/* Assessment journey + combined report (renders only when a foundation exists) */}",
     "            <p>Your Prebiotics have been strong but your Probiotics are pulling down your Biotics Score.</p>\n"
     "            {/* Assessment journey + combined report (renders only when a foundation exists) */}",
     C),

    # ── the fifth site, in no register entry ────────────────────────────────
    (1489, "the daily loop card names and scores a Biotic again", LOOP_CARD,
     "export interface DailyLoopData {\n"
     "  streak: { current: number; longest: number; loggedToday: boolean; daysSinceLast: number | null }\n"
     "}",
     "export interface DailyLoopData {\n"
     "  streak: { current: number; longest: number; loggedToday: boolean; daysSinceLast: number | null }\n"
     "  focus: { key: PillarKey; color: string; score: number } | null\n"
     "}",
     C),

    (1490, "the account page computes a weakest-Biotic nudge again", ACCOUNT_PAGE,
     "  const dailyLoop: DailyLoopData = { streak: streakInfo }",
     "  const dailyLoop: DailyLoopData = { streak: streakInfo, focus: dailyNudge({ prebiotics: 1, probiotics: 2, postbiotics: 3 }) }",
     C),

    (1491, "the account page is handed a per-Biotic profile again", ACCOUNT_PAGE,
     "        recentAnalyses={recentAnalyses}",
     "        biotics={bioticsProfile}\n        recentAnalyses={recentAnalyses}",
     C),

    # ── the sixth site: the worst of them, and ungated ──────────────────────
    (1492, "the Twin stage renders named per-Biotic bars again", TWIN_STAGE,
     "            <div className=\"mt-5\">\n"
     "              {checklist ?? <Sparkline twin={twin} />}\n"
     "            </div>",
     "            <div className=\"mt-5\">\n"
     "              {checklist ?? <Sparkline twin={twin} />}\n"
     "              <div style={{ width: `${twin.biotics.prebiotics.score}%`, color: \"#A8E063\" }} />\n"
     "            </div>",
     V),

    # ── the seventh site: the QuickLog result contract ──────────────────────
    (1493, "QuickLogResult carries the three per-Biotic fields again", QUICK_LOG,
     "export interface QuickLogResult {\n"
     "  meal_name: string\n"
     "  biotics_score: number\n"
     "  insight: string",
     "export interface QuickLogResult {\n"
     "  meal_name: string\n"
     "  biotics_score: number\n"
     "  prebiotic_score: number\n"
     "  insight: string",
     V),

    # ── C · the Biotic → colour flow ────────────────────────────────────────
    # ── RE-AIMED AT 0R-6R, FOR THE SAME REASON AS 1463, AND IT SLIPPED FIRST ─
    #
    # The mutation was the SIGNATURE: `auraGradientForTone(tone: AuraTone)` back
    # to `(biotic: BioticKey)`. The rule that saw that was retired at 0R-6R as a
    # false-positive generator, so the case stopped landing — and the case was
    # the thing that was wrong, because `twin-visual.ts`'s own repair note says
    # so in as many words: "`AuraTone` is a name for a colour and nothing else.
    # `twin.biotics.weakest` is a verdict."
    #
    # The defect is the READ, so the mutation is now the read: a convenience
    # wrapper that re-derives the tone from a per-Biotic score, which is how this
    # construct returned in four separate components after each earlier removal.
    # Case 1495 attacks the call site; this one attacks the producer.
    (1494, "the aura is re-derived from a per-Biotic score inside twin-visual", TWIN_VISUAL,
     "export function auraGradientForTone(tone: AuraTone, intensity = 0.6): string {",
     "export function auraGradientForBiotic(\n"
     "  twin: { biotics: { prebiotics: { score: number } } },\n"
     "  intensity = 0.6,\n"
     "): string {\n"
     '  return auraGradientForTone(twin.biotics.prebiotics.score >= 50 ? "warm" : "cool", intensity)\n'
     "}\n\n"
     "export function auraGradientForTone(tone: AuraTone, intensity = 0.6): string {",
     V),

    (1495, "the stage aura is chosen by the weakest Biotic again", TWIN_STAGE,
     "      : restingAuraGradient(visual.confidence)",
     "      : auraGradientForTone(twin.biotics.weakest, visual.confidence)",
     V),

    (1496, "TwinVisualState computes a Biotic-derived gradient again", TWIN_VISUAL,
     "    momentumLabel: MOMENTUM_LABEL[momentum],",
     "    auraGradient: auraGradientForTone(twin.biotics.strongest, confidence),\n"
     "    momentumLabel: MOMENTUM_LABEL[momentum],",
     V),

    # ── D · the self-report → anatomy chain ─────────────────────────────────
    (1497, "a ritual check gets a body coordinate again", RITUAL,
     '  { key: "fermented", label: "Fermented food", ack: "Noted — that\'s today\'s fermented food logged.", color: "#2DAA6E" },',
     '  { key: "fermented", label: "Fermented food", ack: "Noted.", color: "#2DAA6E", node: { x: 54, y: 56 } },',
     V),

    (1498, "a ritual check asserts a Biotic effect again", RITUAL,
     "export interface RitualCheck {\n"
     "  key: keyof RitualDay\n"
     "  label: string",
     "export interface RitualCheck {\n"
     "  key: keyof RitualDay\n"
     "  effect: string\n"
     "  label: string",
     C),

    (1499, "the ritual asserts a bodily response again", DAILY_RITUAL,
     "        <p className=\"text-[10px] font-bold uppercase tracking-widest\" style={{ color: \"var(--icon-green)\" }}>Logged for today</p>",
     "        <p className=\"text-[10px] font-bold uppercase tracking-widest\" style={{ color: \"var(--icon-green)\" }}>Your body just felt that</p>",
     C),

    (1500, "the ritual heading claims the body reacts again", DAILY_RITUAL,
     '{ritualComplete(ritual) ? "A full day logged — all five." : "Tap what\'s true today. It all goes into the picture."}',
     '{ritualComplete(ritual) ? "A full day — your Food System felt all of it." : "Tap what\'s true today. Your body reacts to each one."}',
     C),

    # ── D · the meal-impact per-Biotic pipeline ─────────────────────────────
    # The behavioural case the brief asked for by name: a per-Biotic score must
    # not be able to alter any customer-facing label, band or mechanism.
    (1501, "meal-impact accepts a per-Biotic score again", MEAL_IMPACT,
     "export interface MealImpactInput {\n"
     "  meal_name: string\n"
     "  tags?: string[]\n"
     "}",
     "export interface MealImpactInput {\n"
     "  meal_name: string\n"
     "  probiotic_score: number\n"
     "  tags?: string[]\n"
     "}",
     C),

    (1502, "a Biotic-named row comes back on the meal card", MEAL_IMPACT,
     '    key: "fibre",\n    label: "Fibre",',
     '    key: "fibre",\n    label: "Probiotic network",',
     C),

    (1503, "a fermented food is classified as a personal probiotic effect again", MEAL_IMPACT,
     '  const fibreBoost = hasTag(tags, "High Fibre")',
     '  const probioticBoost = hasTag(tags, "Fermented Foods")\n  const fibreBoost = probioticBoost || hasTag(tags, "High Fibre")',
     C),

    (1504, "the fibre row's possessive Biotic mechanism comes back", MEAL_IMPACT,
     '    effect: fibreBoost ? "Beans, grains or vegetables brought fibre to this plate" : "Not much fibre in this one",',
     '    effect: fibreBoost ? "Prebiotic fibre flows down to feed your microbes" : "Not much fibre in this one",',
     LOOP),

    # ── A LIMITATION OF THIS HARNESS, REPORTED RATHER THAN FAKED ────────────
    #
    # `agent-loop-claims.test.ts` asserts that `lib/habit.ts` DOES NOT EXIST —
    # its whole exported surface was `focusPillar` ("the weakest pillar") and
    # `dailyNudge`, so there is no version of it a customer surface may use.
    #
    # That property cannot be sabotaged here. `run.py` mutates a find/replace
    # inside an existing file; it cannot CREATE one, and `collectable()`
    # deliberately refuses targets outside `tests/**`. A case that pretended to
    # restore the module would be testing the harness's own plumbing.
    #
    # Recorded instead of engineered around, and the assertion is still
    # non-vacuous: it fails the moment the file reappears, which is the only
    # way the construct can return as a module.

    # ── the instruments themselves: can 0R-5's own proofs be switched off? ──
    # ── RE-AIMED AT 0R-6R · THE SINK WAS NARROWED, SO ITS ANCHOR MOVED ─────
    #
    # 0R-6R narrowed this sink from ANY `width:` to a DERIVED extent, because
    # pointing the instrument at a PDF made `width: 80` on a table column match
    # and kept `report-pdf.tsx` red after its "Your 3 Biotics" bar was deleted.
    # The case's purpose is unchanged — null the sink and the extent-only
    # non-vacuity subject must fail — and it is re-anchored on the narrower rule.
    (1506, "the extent sink is nulled, leaving colour as the only sink", VISUAL,
     "    /\\bwidth\\s*:\\s*(?:`[^`]*\\$\\{|\\$\\{|\\w+\\s*[*+]|[`\"']?\\$)|\\bstrokeDasharray\\s*:\\s*(?:`|\\{|\\w)|\\bscale\\s*\\(\\s*(?:\\$\\{|\\w+\\s*[*+]|[a-z])/,",
     "    /(?!x)x/,",
     V),

    (1507, "the per-Biotic score rule leaves the form track", VISUAL,
     "    /\\b(?:pre|pro|post)biotic_score\\b|\\bbiotics\\s*\\.\\s*(?:pre|pro|post)biotics?\\b/,",
     "    /\\bnever_matches_anything\\b/,",
     V),

    (1508, "a module leaves the form instrument", VISUAL,
     '  "lib/account/meal-impact.ts",\n  "components/account/twin/meal-impact.tsx",',
     "",
     V),

    (1509, "the inline-fabrication rule stops reading values", FAB[0],
     '    return /:\\s*-?[1-9]\\d*(?:\\.\\d+)?\\b/.test(literal) || /:\\s*"[^"]+"/.test(literal)',
     "    return false",
     FAB),

    # ══ 0R-6 · THE PAID PATH · cases 1510+ ═════════════════════════════════
    #
    # Three findings were repaired and one is HELD. The cases split the same
    # way, and the held one is the interesting half: an inventory that records
    # debt it cannot repair has to be attacked harder than one that records a
    # repair, because the only thing standing between "measured debt" and
    # "forgotten debt" is the contract on the entry.

    # ── E · `P0-SCIENCE-07` · the per-Biotic score in the dev-flow Report ───

    (1510, "the per-Biotic score and its denominator come back on the deep-dive card", FULL_REPORT,
     '<p className="text-base font-semibold text-foreground">{dive.label}</p>',
     '<p className="text-base font-semibold text-foreground">{dive.label}</p>\n'
     '            <span className="text-xs">{dive.score}/100</span>',
     VOCAB),

    (1511, "the possessive room-to-grow claim comes back", FULL_REPORT,
     "              The three pillars, and what to eat for each. Tap a pillar to expand.",
     "              Your probiotics score has clear room to grow. Tap each pillar to expand.",
     VOCAB),

    # ── THE SELECTION HALF, AND IT SLIPPED FIRST TIME ──────────────────────
    #
    # 1512 restores `score: number` to `PillarDeepDive`. On the first run it
    # SLIPPED, and the reason is worth keeping: the only thing holding that
    # field out was the TYPE, and `tsc` is not what this harness runs. A field
    # with no reader breaks no vitest assertion, so the selection half of
    # `-07` was guarded by a check the sabotage driver never invokes.
    #
    # Fixed by strengthening the TEST, per the standing rule: the `-07` describe
    # now reads `lib/assessment-report.ts` and refuses both the field and the
    # sort over it. Type-level absence is not enforcement when the enforcing
    # tool is outside the loop.
    (1512, "PillarDeepDive carries a per-Biotic score again", ASSESS_REPORT,
     "export interface PillarDeepDive {\n  pillar: PillarKey",
     "export interface PillarDeepDive {\n  pillar: PillarKey\n  score: number",
     VOCAB + C),

    # ── F · `-07`'s SECOND close condition: the route cannot serve it ───────
    #
    # The spec requires the construct gone AND the route unable to serve it
    # under any environment. These two attack the second part, which was GREEN
    # when written — and a pin that is green on arrival is worth nothing until
    # something proves it refuses the shape that preceded it.

    (1513, "the pre-S7R Stripe-key bypass returns, re-opening the dev Report", PAID_POLICY,
     '  if (env[UNVERIFIED_PAID_FLOW_FLAG] !== "true") return false',
     "  if (!process.env.STRIPE_SECRET_KEY) return true",
     VOCAB),

    (1514, "production stops being refused unconditionally", PAID_POLICY,
     '  if (vercelEnv === "production") return false',
     '  if (vercelEnv === "production" && process.env.FORCE !== "1") return false',
     VOCAB),

    # ── G · `P1-VOCAB-01` · a retired name that exists in no source string ──
    #
    # The form this tranche named: `{p}` under `capitalize` prints "Heal",
    # which the case-sensitive `RETIRED` rule cannot see because the source
    # holds only the lowercase stored key. So the case attacks the STRUCTURE —
    # a stored key rendered directly — which is the only thing a source
    # instrument can express about it.

    (1515, "the raw stored pathway key is rendered to the customer again", FULL_REPORT,
     "{ACTION_FOR_PATHWAY_KEY[p] ?? p}",
     "{p}",
     VOCAB),

    (1516, "the pathway tag silently regains text-transform: capitalize", FULL_REPORT,
     '{ACTION_FOR_PATHWAY_KEY[p] ?? p}',
     '{p.toLowerCase()}',
     VOCAB),

    # The instrument itself, and this one found a real omission in my own
    # guard before it ever ran: `it.each(PATHWAY_TAG_SURFACES)` looks only at
    # what the list names, so deleting the single entry deleted the test and
    # broke nothing — sabotage 1461's lesson, one tranche after it was written
    # down. The list is now pinned to a literal, and this is what holds it.
    (1517, "the pathway-tag surface list is emptied to silence the rule", VOCAB[0],
     'const PATHWAY_TAG_SURFACES = ["components/assessment/full-report-client.tsx"] as const',
     "const PATHWAY_TAG_SURFACES = [] as const",
     VOCAB),

    # ── H · `P0-SCIENCE-06` AND `-07` · THE PAID PATH, AFTER THE REPAIR ────
    #
    # 0R-6 held `-06` as measured debt: three `it.fails` in the behavioural
    # suite and one entry in `BLOCKED_AT_0R6`. 0R-6R closed it instead, on the
    # ruling that
    #
    #     the absence of an authorised replacement selector is a legitimate
    #     blocker to REPLACEMENT. It is not permission to retain the invalid
    #     selector.
    #
    # So the three held assertions are plain `it`s, the blocked inventory is
    # DELETED, and `orderedByNeed` no longer exists. Cases 1518-1521 were aimed
    # at the HELD state and all four anchors vanished with it — which is the
    # correct outcome for a case aimed at debt that has been paid, and the
    # reason they are re-aimed here rather than deleted: the properties they
    # proved (an instrument cannot be switched off, a proof cannot become a
    # tautology) outlive the particular defect.

    # The record rule is the one 0R-6R added and then narrowed twice, and after
    # the second narrowing it is the ONLY rule that sees the shape the three
    # paid renderers shipped. Case 1507's lesson in a new place: nulling it must
    # fail, which is what the `PathwayScores` non-vacuity subject is for.
    (1518, "the per-Biotic RECORD rule is nulled", VISUAL,
     "    /\\b\\w+\\s*:\\s*Record<\\s*BioticScoreKey\\s*,\\s*number\\s*>|\\b\\w+\\s*:\\s*Partial<\\s*Record<\\s*BioticScoreKey\\b/,",
     "    /(?!x)x/,",
     V),

    # Same property as 1461 and 1508 — a module may be ADDED to the instrument,
    # never silently removed — pointed at the three renderers 0R-6R added. These
    # are the files where the construct was found live on the money path, so
    # they are the three most consequential to be able to drop.
    (1519, "the three live paid renderers leave VISUAL_MODULES", VISUAL,
     '   */\n  "components/report/food-system-section.tsx",\n'
     '  "lib/pdf/food-system-pdf.tsx",\n  "lib/pdf/report-pdf.tsx",\n]',
     "   */\n]",
     V),

    # ── A PROOF THAT CAN BECOME A TAUTOLOGY IS NOT A PROOF ─────────────────
    #
    # 1520 used to convert the held `it.fails` to a plain `it`. That conversion
    # has HAPPENED, so the case was re-aimed at the weakness writing it exposed:
    # the permutation assertion reads `new Set(...).size === 1` over
    # `PERMUTATIONS`, and with one entry that is trivially true. Truncating the
    # array turns the close proof for the whole `-06` repair into a tautology in
    # a single edit — the `it.each` weakness in a different shape.
    #
    # Both files that carry the six orderings gained a pin: six entries, six
    # distinct orderings, one shared multiset. This is what holds it.
    (1520, "the permutation set is truncated, making the close proof vacuous", LOOP[0],
     "    { prebiotics: 23, probiotics: 48, postbiotics: 71 },\n"
     "    { prebiotics: 48, probiotics: 71, postbiotics: 23 },\n"
     "    { prebiotics: 23, probiotics: 71, postbiotics: 48 },\n"
     "    { prebiotics: 71, probiotics: 48, postbiotics: 23 },\n"
     "    { prebiotics: 48, probiotics: 23, postbiotics: 71 },\n  ]",
     "  ]",
     LOOP),

    # ── AND THE OTHER DIRECTION: DOES THE PROOF NOTICE A RESTORED SELECTOR? ─
    #
    # 1521's history is this tranche's most useful record of a case being
    # wrong twice. It first replaced `priorityPathway` alone, leaving
    # `strongestPathway` — half a construct, so the Report still varied and the
    # held assertion still failed. Re-aimed at `orderedByNeed`, it STILL
    # varied, because the report object carried `score` and `state` per Biotic;
    # measuring why is what found `P0-SCIENCE-07` live on the paid path. It then
    # settled on `dominantPattern`, whose ranking sentence 0R-6R deleted.
    #
    # So it is re-aimed a third time, at the selector site that survives as a
    # single edit: `toolOrder`. Sorting the five foods a paying customer is
    # shown by the member's three sub-scores is the clearest form of the hidden
    # ranking, and the permutation assertion must see it return.
    (1521, "the five foods are ordered by the member's sub-scores again",
     "lib/report/build-food-system-report.ts",
     "  const toolOrder = Object.keys(TOOLS) as BioticScoreKey[]",
     "  const _s = input.subScores as Record<string, number>\n"
     "  const toolOrder = (Object.keys(TOOLS) as BioticScoreKey[]).sort(\n"
     "    (a, b) => Number(_s[a] ?? 0) - Number(_s[b] ?? 0),\n  )",
     LOOP),

    # ── I · 0R-6R · THE TYPE BOUNDARY ──────────────────────────────────────
    #
    # The ruling that set the depth of the `-07` repair:
    #
    #     IF A PRODUCT TYPE SAYS A PERSONAL CONSTRUCT EXISTS, EVERY DOWNSTREAM
    #     CONSUMER IS INVITED TO TREAT IT AS TRUTH.
    #
    # `FoodSystemReport` is read by the web section, both PDFs, the fallback
    # report, the add-on lens and the AI merge. These two cases restore the
    # fields rather than any sentence, because the point of closing at the model
    # is that no renderer can be handed the construct in the first place.

    (1522, "the canonical Report type can represent three per-Biotic scores again",
     "lib/report/food-system-report-types.ts",
     "  /** The Biotics Score™ — one whole-system figure, and the product sold. */\n"
     "  overallScore: number",
     "  /** The Biotics Score™ — one whole-system figure, and the product sold. */\n"
     "  overallScore: number\n"
     "  bioticScores: { prebiotics: number; probiotics: number; postbiotics: number }",
     VOCAB),

    (1523, "a Report node can carry a per-Biotic score again",
     "lib/report/food-system-report-types.ts",
     "  explanation: string\n  visualToken: ReportVisualToken\n}",
     "  score: number\n  explanation: string\n  visualToken: ReportVisualToken\n}",
     VOCAB),

    # Deleting the function is what makes "Report construction cannot recreate
    # the ranking" a property of the code rather than a claim in a document. An
    # exported sort over three per-Biotic scores, in the module every report
    # surface already imports, is one line from being called again.
    (1524, "orderedByNeed is restored to the module every Report surface imports",
     SUBSCORES,
     "export function normalizeToBiotics(sub: IncomingSubScores | null | undefined): BioticScores | null {",
     "export function orderedByNeed(sub: BioticScores) {\n"
     "  return Object.entries(sub).sort((a, b) => a[1] - b[1])\n}\n\n"
     "export function normalizeToBiotics(sub: IncomingSubScores | null | undefined): BioticScores | null {",
     VOCAB),

    # Step one of recreating the whole construct, and the step that is easiest
    # to justify in a review: "the builder just needs the scores for X". It
    # needs them for nothing. The builder reads `input.overall` and no more.
    (1525, "the builder reads the three sub-scores again",
     "lib/report/build-food-system-report.ts",
     "  const snapshotOneLine = `Your answers give ${who} food system a Biotics Score",
     "  const biotics = normalizeToBiotics(input.subScores)\n"
     "  const snapshotOneLine = `Your answers give ${who} food system a Biotics Score",
     VOCAB),

    # ── J · 0R-6R · THE FOUR LIVE RENDERERS ────────────────────────────────
    #
    # One case each, in the form the file actually shipped. A band word is the
    # construct in words — "not as a number, not as a bar, not as a band word"
    # — so these restore a band word rather than a score, which is the smaller
    # and therefore more likely regression.

    (1526, "the web Report's ring captions each pathway with a band word again",
     "components/report/food-system-section.tsx",
     '      <span className="min-w-0">\n'
     '        <span className="block text-sm font-bold text-foreground">\n'
     "          {PATHWAY_LABEL[pathway]}\n        </span>\n      </span>",
     '      <span className="min-w-0">\n'
     '        <span className="block text-sm font-bold text-foreground">\n'
     "          {PATHWAY_LABEL[pathway]}\n        </span>\n"
     '        <span className="block text-xs text-muted-foreground">Well supported</span>\n'
     "      </span>",
     ["tests/unit/food-system-section.test.ts"]),

    # `BodyFigure` drew the three scores and their band words ON a figure of the
    # member's body, inside three rings — the anatomy construct `P0-SCIENCE-05`
    # removed from the Twin, in the downloadable PDF.
    (1527, "the PDF body figure regains a band word under each pathway",
     "lib/pdf/food-system-pdf.tsx",
     "            <Text style={s.scoreLabel}>{PATHWAY_LABEL[k]}</Text>",
     "            <Text style={s.scoreLabel}>{PATHWAY_LABEL[k]}</Text>\n"
     "            <Text style={s.scoreLabel}>Well supported</Text>",
     ["tests/unit/paid-pdf-biotic-claims.test.ts"]),

    # The TENTH site of this tranche, and the one found by rendering rather than
    # by reading: the web boundary was closed and the PDF cover read
    # `profile.tagline` directly. The refused string names no Biotic and
    # contains no band word, so every other rule in that file passes it.
    (1528, "the PDF cover prints the authored tagline instead of the refusal",
     "lib/pdf/report-pdf.tsx",
     "      {heroTaglineFor({ profile }) && (\n"
     "        <Text style={styles.coverTagline}>{heroTaglineFor({ profile })}</Text>",
     "      {profile.tagline && (\n"
     "        <Text style={styles.coverTagline}>{profile.tagline}</Text>",
     ["tests/unit/paid-pdf-biotic-claims.test.ts"]),

    # `heroTaglineFor` was going to be deleted outright, until removing its
    # `mixed` override exposed what the override had been covering: for a high
    # scorer `getProfile` authors "all three pathways being well supported" — a
    # band word over the member's three Biotics. The function's whole remaining
    # job is to refuse that and the "one pathway thinner than the rest" shape.
    (1529, "heroTaglineFor stops refusing and passes the authored ranking through",
     "lib/report/framing.ts",
     "  if (PERSONAL_PATHWAY_STATE.test(authored)) return null\n  return authored",
     "  return authored",
     ["tests/unit/hero-tagline-agreement.test.ts",
      "tests/unit/paid-report-presentation.test.ts"]),

    # ── K · 0R-6R · THE BOUNDARY THAT PROTECTS A PROTECTED ROUTE ───────────
    #
    # `generate-pdf.ts` exists to drop `freeScores.subScores` between the
    # protected `submit-deep-assessment` route and a component that may no
    # longer see it. Both shapes typecheck, so only a runtime guard can tell
    # them apart — and the obvious proof does not work: `renderToBuffer` is not
    # byte-deterministic even for identical input, which was measured, not
    # assumed.
    (1530, "the PDF boundary forwards freeScores whole, sub-scores and all",
     "lib/pdf/generate-pdf.ts",
     "    freeScores: { overall: freeScores.overall, profile: freeScores.profile },",
     "    freeScores,",
     ["tests/unit/pdf-boundary-subscores.test.ts"]),

    # ── L · 0R-6R · THE FALLBACK REPORT AND THE LENS ───────────────────────
    #
    # `fallback-paid-report.ts` is what a paying customer receives WHEN
    # GENERATION FAILS, so its ~30 ranked sentences were live and deterministic.
    (1531, "the fallback report's opening names the thinnest pathway again",
     "lib/fallback-paid-report.ts",
     "  const scoreLead = `Your ${ctx.input.profile.type} score of ${ctx.input.overall}/100 suggests ${who} food system`",
     "  const _ranked = Object.entries((ctx.input.subScores ?? {}) as Record<string, number>).sort(\n"
     "    (a, b) => a[1] - b[1],\n  )\n"
     "  const scoreLead = `Your ${ctx.input.profile.type} score of ${ctx.input.overall}/100 suggests ${who} food system, with ${_ranked[0]?.[0]} the thinnest pathway in your answers,`",
     ["tests/unit/fallback-report-pathways.test.ts"]),

    # The lens's own comment always said a lens may not nominate its priority.
    # 0R-6R added the half that was missing: neither may the core.
    (1532, "the lens chapter names a pathway in its priority connection again",
     "lib/report/addon-lens.ts",
     "      why: `This lens meets your Food System score through all three pathways. ${body.priorityWhy}`,",
     "      why: `Prebiotics is where this lens meets your Food System score. ${body.priorityWhy}`,",
     ["tests/unit/addon-lens.test.ts"]),

    # ── M · 0R-6R · THE FROZEN AUDIT EVIDENCE ──────────────────────────────
    #
    # `docs/experience/audit/screenshots/`, `manifest.json` and
    # `SCREENSHOT_INDEX.md` were last written at the Experience 0 freeze, and
    # EVERY Playwright run since rewrote them — six tranches each left those
    # files dirty and each restored them by hand. The gate is one exact-string
    # check and three call sites, so each is attacked separately.

    (1533, "the frozen-write gate becomes a truthiness check",
     "tests/e2e/audit-manifest.ts",
     '  return process.env[WRITE_FROZEN_FLAG] === "1"',
     "  return Boolean(process.env[WRITE_FROZEN_FLAG])",
     ["tests/unit/audit-evidence-immutability.test.ts"]),

    # Found while writing this case: nothing CALLED `copyToCommitted`, so
    # deleting the one statement that declines the write broke no assertion.
    # The suite now exercises the function against a temporary directory.
    (1534, "copyToCommitted copies into the frozen tree unconditionally",
     "tests/e2e/audit-manifest.ts",
     '  if (!frozenWritesAllowed()) return "archive-only"\n',
     "",
     ["tests/unit/audit-evidence-immutability.test.ts"]),

    (1535, "the manifest target is hard-coded back to the frozen file",
     "tests/e2e/audit-manifest.ts",
     "  return frozenWritesAllowed() ? MANIFEST_JSON : `${CORPUS_ROOT}/manifest.json`",
     "  return MANIFEST_JSON",
     ["tests/unit/audit-evidence-immutability.test.ts"]),

    (1536, "the screenshot index is written to its hard-coded frozen path",
     "tests/e2e/audit-capture.spec.ts",
     "    screenshotIndexTarget(),",
     '    "docs/experience/audit/SCREENSHOT_INDEX.md",',
     ["tests/unit/audit-evidence-immutability.test.ts"]),

    (1537, "a capture spec writes the committed set directly again",
     "tests/e2e/audit-capture-reports.spec.ts",
     "    ? copyToCommitted(path, COMMITTED, file)",
     "    ? copyFileSync(path, `${COMMITTED}/${file}`)",
     ["tests/unit/audit-evidence-immutability.test.ts"]),
]
