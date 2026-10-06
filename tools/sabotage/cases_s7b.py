# V1 step 7B — the holding page. Cases 930+.
#
# The invariants under test:
#   /waitlist stays refused, and stays DECIDED rather than merely unlisted;
#   the password gate does not wave it through;
#   no served page links to it or re-advertises the retired offer;
#   the holding page's COPY is inside the vocabulary guard corpus;
#   staged access promises access, never a price, and never a number that was
#     not counted;
#   the framework cards lead with the action and name the biotic;
#   the 60-second experience says sixty seconds honestly, computes nothing of
#     its own, and never calls a five-question result the full product.
#
# ── ONE CASE WAS REMOVED, AND IT IS WORTH KNOWING WHY ────────────────────────
#
# Case 945 asserted that the campaign could not be demoted below the fold. Its
# test list named tests/e2e/early-access-campaign.spec.ts — a PLAYWRIGHT spec.
# run.py runs `npx vitest run <tests>`, and vitest.config.ts includes only
# `tests/**/*.test.ts`, so vitest found no test files and exited non-zero. A
# non-zero exit is how this harness reads "caught", so 945 reported caught for
# every mutation, including none at all. It proved nothing for its whole life.
#
# The property it cared about is real and still covered — by Playwright, in
# both early-access-campaign.spec.ts and food-system-experience.spec.ts, the
# latter measuring the CTA against the viewport at three widths. But it cannot
# be covered HERE: this harness mutates source, and a Playwright run serves a
# prebuilt .next that the mutation never reaches, so a rendered property would
# report SLIPPED no matter what. The limitation is stated rather than worked
# around, and run.py now refuses a case whose tests vitest cannot collect, so
# this cannot happen again quietly.

SURFACE = "lib/v1-surface.ts"
PROXY = "proxy.ts"
BOOK = "app/book/page.tsx"
CORPUS = "tests/unit/customer-surfaces.ts"
EARLY = "lib/waitlist/early-access.ts"
FOUNDING = "lib/waitlist/founding-access.ts"
WLROUTE = "app/api/waitlist/route.ts"
COUNT = "app/api/waitlist/count/route.ts"
FRAMEWORK = "components/home/the-framework.tsx"
FEEDSEED = "components/home/feed-seed-heal.tsx"
EXPERIENCE = "components/waitlist/food-system-experience.tsx"
COHORTLINE = "components/waitlist/cohort-line.tsx"
# Was first-course.tsx; the section it tested is 100 Systems now.
FIRSTCOURSE = "components/waitlist/hundred-systems.tsx"
EMAIL = "lib/email/waitlist-email.ts"
DICT = "lib/i18n/dictionaries.ts"
QUICK = "lib/quick-assessment.ts"
HOWITWORKS = "components/home/how-it-works.tsx"
BIOTICTEST = "tests/unit/biotic-claims.test.ts"
REACHTEST = "tests/unit/reachable-surfaces.ts"
THREEBIOTICS = "components/assessment/result/three-biotics-result.tsx"
SCORECARD = "components/assessment/score-card.tsx"
OGCARD = "app/api/score-card/route.tsx"
HELP = "app/help/page.tsx"
BIOTICSPAGE = "app/biotics/page.tsx"
PILLARS = "lib/pillars.ts"
BPROMPT = "lib/biotics-prompt.ts"
REPORTBUILD = "lib/report/build-food-system-report.ts"
SWAPS = "lib/report/food-swaps.ts"
SUBSCORES = "lib/report/subscores.ts"
ASSESSREPORT = "lib/assessment-report.ts"
SEQEMAIL = "lib/email/sequence-email.ts"
RESULTSEMAIL = "lib/email/results-email.ts"
CORPUSTEST = "tests/unit/biotic-claims.test.ts"
FOODS = "lib/foods.ts"
CONSTITUTION = "docs/EATOBIOTICS_PRODUCT_CONSTITUTION_v1.md"
FSSSPEC = "docs/fss/FSS_V1_SPEC.md"
CLAIMSB = "docs/fss/FSS_V1_CLAIMS_BOUNDARY.md"
CONSTTEST = ["tests/unit/product-constitution.test.ts"]

# ── Gate 2 ──────────────────────────────────────────────────────────────
QV1 = "lib/fss/questions/v1.ts"
QRESOLVE = "lib/fss/questions/resolve.ts"
FWEIGHTS = "lib/fss/engine/weights.ts"
FSCORE = "lib/fss/engine/score.ts"
FCOMPARE = "lib/fss/engine/compare.ts"
FBANDS = "lib/fss/interpretation/bands.ts"
FPOLICY = "lib/fss/preview/preview-policy.ts"
FPAGE = "app/preview/food-system-v1/page.tsx"
FLOCAL = "lib/fss/persistence/local.ts"
QSET = ["tests/unit/fss-question-set.test.ts"]
FENGINE = ["tests/unit/fss-engine.test.ts"]
FINTERP = ["tests/unit/fss-interpretation.test.ts"]
FGATE = ["tests/unit/fss-preview-gate.test.ts", "tests/unit/v1-surface.test.ts"]
FPERSIST = ["tests/unit/fss-persistence.test.ts"]
MEALIMPACT = "lib/account/meal-impact.ts"
SCOREPREVIEW = "components/home/score-preview.tsx"
DEPFOODS = "components/depression/depression-foods.tsx"
ASCORING = "lib/assessment-scoring.ts"
CONSULT = "app/api/consult/route.ts"
DEMOCONSULT = "app/api/demo/consult/route.ts"
CHAT = "app/api/report-chat/route.ts"
FOODINT = "app/api/food-intelligence/route.ts"
CORPUSFILE = "tests/unit/customer-surfaces.ts"
HUNDRED = "components/waitlist/hundred-systems.tsx"
ENTERHERO = "app/enter/waitlist-hero.tsx"

HOLDING = ["tests/unit/holding-page.test.ts"]
EARLYT = ["tests/unit/early-access.test.ts"]
SURFACET = ["tests/unit/v1-surface.test.ts"]
HIER = ["tests/unit/score-hierarchy.test.ts"]
BIOTIC = ["tests/unit/biotic-claims.test.ts"]
# 0R-5: case 1007 was repointed here — see its note below.
RITUAL = "lib/account/ritual.ts"
RETIRED = ["tests/unit/retired-vocabulary.test.ts"]
VOCAB = ["tests/unit/retired-vocabulary.test.ts"]

# ── Gate 3 — the action model. Cases 1031+. ─────────────────────────────
#
# The invariants under test:
#   an action category carries no number and no Biotic;
#   no table maps a domain to an action category;
#   a recommendation carries its claim boundary and both versions;
#   Your Food Context shapes the plan and reaches the Score by no path;
#   the most constrained person still gets a plan;
#   Today is one action for the PLAN, not one per priority;
#   a priority is selected by exact ties, with no tolerance;
#   a stored action is refused rather than resolved against moved content;
#   the candidate tree stays inside the guard corpus.
ACATS = "lib/fss/action/categories.ts"
ATYPES = "lib/fss/action/types.ts"
APRIORITY = "lib/fss/action/priority.ts"
ACONTEXT = "lib/fss/action/context.ts"
ACATALOGUE = "lib/fss/action/catalogue.ts"
APLAN = "lib/fss/action/plan.ts"
ASTORED = "lib/fss/action/stored.ts"
AHORIZONS = "lib/fss/action/horizons.ts"
APRESENT = "lib/fss/presentation/plan.ts"
FDOMAINS = "lib/fss/presentation/domains.ts"
AMODEL = ["tests/unit/fss-action-model.test.ts"]
APRIORT = ["tests/unit/fss-priority.test.ts"]
APLANT = ["tests/unit/fss-plan.test.ts"]
ACATT = ["tests/unit/fss-action-catalogue.test.ts"]
ACLAIMS = ["tests/unit/fss-action-claims.test.ts"]
AFENCE = ["tests/unit/fss-action-fence.test.ts"]

# ── Gate 3.5 — live vocabulary clean ───────────────────────────────────
RETEST = "components/account/retest-card.tsx"
DETERM = "lib/agent-loop/providers/deterministic.ts"
TWINBUILD = "lib/agent-loop/twin/twin-builder.ts"
WEEKSTORY = "lib/account/week-story.ts"

# ── Gate 3.6 — personal Biotic prose clean ───────────────────────
#
# Every mutation below restores a sentence or a number that was SHIPPING when
# Gate 3.6 began, four of them on /account, which is V1_CORE.
#
# The test list that matters here is ALCLAIMS — tests/unit/agent-loop-claims.
# test.ts, which CALLS the generators and reads their output. The claims corpus
# in biotic-claims.test.ts is also listed where the mutation is a literal,
# because for those two it is the corpus that catches it. Where it is an
# interpolation, only the behavioural guard can.
BEHAVIOUR = "lib/agent-loop/behaviour.ts"
BASELINE = "lib/agent-loop/baseline.ts"
ACCTWIN = "lib/agent-loop/account-twin.ts"
PATTERNS = "lib/account/patterns.ts"
BPANEL = "components/agent-loop/BioticsProgressPanel.tsx"
SYSMAP = "lib/account/system-map.ts"
SHARECARD = "lib/account/share-card.ts"
SHARETWIN = "components/account/twin/share-twin.tsx"
INSIDEYOU = "lib/account/inside-you.ts"
MENUSCAN = "components/account/twin/menu-scan.tsx"
MEALREVEAL = "components/account/twin/meal-reveal.tsx"
BCLAIMSFILE = "tests/unit/biotic-claims.test.ts"

# ── Gate 3.7 — the Gate 4 pre-flight ──────────────────────────────────────
BIOTICSPAGE = "app/biotics/page.tsx"
MENUSCAN_ROUTE = "app/api/menu-scan/route.ts"
CLAUDEMD = "CLAUDE.md"
CMDTEST = ["tests/unit/claude-md-accuracy.test.ts"]
ALCLAIMS = ["tests/unit/agent-loop-claims.test.ts"]
BCLAIMS = ["tests/unit/biotic-claims.test.ts"]
EDUTAIN = ["tests/unit/twin-edutainment.test.ts"]
TPATTERNS = ["tests/unit/twin-patterns.test.ts"]
ALOOP = ["tests/unit/agent-loop.test.ts"]

CASES = [
    (930, "/waitlist is served again", SURFACE,
     '  "/waitlist",\n  "/start",\n',
     '  "/start",\n',
     HOLDING),

    (931, "/waitlist is put back in the gate allowlist", PROXY,
     '    pathname === "/enter" ||\n',
     '    pathname === "/enter" ||\n    pathname === "/waitlist" ||\n',
     HOLDING),

    (932, "the holding page links to the retired offer again", EXPERIENCE,
     '        <a\n          href="#how-it-works"\n',
     '        <a href="/waitlist">See what&apos;s coming — Book, App &amp; Course</a>\n'
     '        <a\n          href="#how-it-works"\n',
     HOLDING),

    # DISAMBIGUATED in Gate 3.7: app/book/page.tsx carries two byte-identical
    # substack link blocks (~129 and ~230). Anchored on the first through its
    # wrapper's margin class, the only thing that differs between them.
    (933, "a book page links back into the refused route", BOOK,
     '            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">\n'
     '              <a\n                href="https://eatobiotics.substack.com/"\n',
     '            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">\n'
     '              <a href="/waitlist">See all three launches</a>\n'
     '              <a\n                href="https://eatobiotics.substack.com/"\n',
     HOLDING + SURFACET),

    (934, "the holding page leaves the vocabulary guard corpus", CORPUS,
     '  "app/enter/page.tsx",\n  "app/enter/waitlist-hero.tsx",\n',
     '',
     HOLDING),

    # RE-ANCHORED. Same invariant — staged access promises ACCESS, never a
    # price — on the section that replaced the one it was written against.
    (935, "early access starts claiming a discount", FIRSTCOURSE,
     '            {first.through} Systems\n',
     '            {first.through} Systems — 50% off\n',
     HOLDING),

    (936, "a deadline is announced even when nobody configured one", FOUNDING,
     '  if (!value) return null\n',
     '  if (!value) return "soon"\n',
     HOLDING),

    (937, "an already-passed deadline is still advertised as scarcity", FOUNDING,
     '  if (closes.getTime() <= now) return null\n',
     '',
     HOLDING),

    # ── Staged access: the ladder ───────────────────────────────────────────
    (938, "the first cohort never closes — its capacity is raised out of reach",
     EARLY,
     '  { id: "first-100", name: "100 Systems", through: 100 },\n',
     '  { id: "first-100", name: "100 Systems", through: 1000000 },\n',
     EARLYT),

    (939, "places remaining is allowed to go negative", EARLY,
     '  const remaining = isFull ? 0 : Math.max(cohort.through - t, 0)\n',
     '  const remaining = cohort.through - t\n',
     EARLYT),

    (940, "scarcity is fabricated when the count is unknown", EARLY,
     '  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return null\n',
     '  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return 0\n',
     EARLYT),

    (941, "the cohort is taken newest-first, inviting the wrong hundred", EARLY,
     'export const EARLY_ACCESS_COHORT_ORDER = "created_at:asc" as const\n',
     'export const EARLY_ACCESS_COHORT_ORDER = "created_at:desc" as const\n',
     EARLYT),

    (942, "the counter stops filtering to the waitlist and counts every lead",
     COUNT,
     '      .select("*", { count: "exact", head: true })\n'
     '      .eq("assessment_type", "waitlist"),\n'
     '    supabase\n',
     '      .select("*", { count: "exact", head: true }),\n'
     '    supabase\n',
     EARLYT),

    (943, "a place is claimed past the final cohort", EARLY,
     '  const cohort = COHORTS.find((c) => place <= c.through)\n  return cohort ? { place, cohort } : null\n',
     '  const cohort = COHORTS.find((c) => place <= c.through) ?? COHORTS[COHORTS.length - 1]\n  return { place, cohort }\n',
     EARLYT),

    (944, "a repeat signup is renumbered, moving someone's place", WLROUTE,
     '      if (isNew) {\n        const { count } = await supabase\n',
     '      if (true) {\n        const { count } = await supabase\n',
     EARLYT),

    # Re-anchored: `COHORTS` became the `ladder` parameter when openCohort was
    # made injectable so the ascending check could be reached from a test.
    (946, "a later cohort can open before an earlier one fills", EARLY,
     '  const index = ladder.findIndex((c) => t < c.through)\n',
     '  const index = ladder.length - 1\n',
     EARLYT),

    (947, "the ladder is allowed to run backwards", EARLY,
     '  if (ladder.length === 0 || !cohortLadderIsAscending(ladder)) return null\n',
     '  if (ladder.length === 0) return null\n',
     EARLYT),

    (948, "the confirmation email goes back to a hardcoded first hundred",
     EMAIL,
     '#${earlyAccessPlace.place} of ${earlyAccessPlace.cohort.name}',
     '#${earlyAccessPlace.place} of the first 100',
     EARLYT),

    (949, "the CTA invites people into a cohort that is already full", EARLY,
     '  if (!cohort || !cohort.isOpen) return "Join the waitlist"\n',
     '  if (!cohort) return "Join the waitlist"\n',
     EARLYT),

    (950, "the holding page framework drops out of the guard corpus", CORPUS,
     '  "components/home/the-framework.tsx",\n',
     '',
     HOLDING),

    # ── The framework cards ─────────────────────────────────────────────────
    (951, "the section intro stops relating the actions to the science",
     FEEDSEED,
     '            Three simple actions inspired by the science of Prebiotics, Probiotics, and\n'
     '            Postbiotics.\n',
     '            Three simple actions.\n',
     HIER),

    (952, "a card asserts the action IS the biotic", FEEDSEED,
     '                  {p.science}\n',
     '                  {p.title} = {p.science}\n',
     HIER),

    (953, "the holding page card asserts the same equation", FRAMEWORK,
     '                      {biotic.science}\n                    </p>\n',
     '                      {biotic.action} = {biotic.science}\n                    </p>\n',
     HIER),

    (954, "the framework image is described by the verb, not the food",
     FRAMEWORK,
     '                      alt={biotic.science}\n',
     '                      alt={biotic.action}\n',
     HIER),

    # ── The 60-second experience ────────────────────────────────────────────
    # ── RE-ANCHORED, 2026-09-30 ────────────────────────────────────────────
    #
    # 955 and 957 tested that "sixty seconds" was arithmetic rather than a
    # slogan, and that the countdown claimed no precision it lacked. The
    # arithmetic was sound; the CLAIM is retired — EatoBiotics is about
    # understanding a food system over time, and a stopwatch on every screen
    # argues the opposite. SECONDS_PER_QUESTION went with it.
    #
    # Both are re-aimed at the property that replaced it: the progress cue
    # reports POSITION and never a unit of time. Said out loud rather than
    # quietly dropped, because a case that loses its subject and disappears is
    # how coverage shrinks without anyone deciding to shrink it.

    (955, "the progress cue starts counting time again", EXPERIENCE,
     '  if (left === 1) return "Last question"\n',
     '  if (left === 1) return "~12 seconds left"\n',
     EARLYT),

    (956, "the progress line stops telling you where you are", EXPERIENCE,
     '  if (answered === 0) return "Let\'s begin"\n  return `${left} to go`\n',
     '  return ""\n',
     EARLYT),

    (957, "a time claim returns to the hero", EXPERIENCE,
     '        Understand your own food system, what shapes it, and how to improve it\n        over time.\n',
     '        Understand yours in 60 seconds.\n',
     HOLDING),

    (958, "the five-question result is presented as the full Biotics Score",
     EXPERIENCE,
     '        Your first Biotics Score™\n',
     '        Your Biotics Score™\n',
     HOLDING),

    # RE-ANCHORED. This deleted the free product's name from the First Course
    # section's bullet list. That section is gone and 100 Systems deliberately
    # does not sell, so the claim step is now the SOLE place the promise names
    # the product — which makes it unambiguously load-bearing. Same invariant,
    # one subject instead of two.
    (959, "the promise stops naming the free product", EXPERIENCE,
     'You&rsquo;ll be among the first to take the full Food System Assessment.',
     'You&rsquo;ll be among the first in when we open.',
     HOLDING),

    (960, "the score is revealed before every question is answered", EXPERIENCE,
     '  const complete = QUICK_QUESTIONS.every((q) => typeof answers[q.id] === "number")\n  return complete ? computeQuickResult(answers) : null\n',
     '  return computeQuickResult(answers)\n',
     EARLYT),

    (961, "the cohort line invents a number when nothing was counted", EARLY,
     '  if (!cohort) return null\n  if (cohort.isOpen) return `${cohort.remaining} of ${cohort.capacity} systems remaining`\n',
     '  if (cohort.isOpen) return `${cohort.remaining} of ${cohort.capacity} systems remaining`\n',
     EARLYT),

    (962, "the join request stops carrying UTM attribution", "lib/waitlist/join.ts",
     '  const { utm, ...rest } = input\n  return { ...rest, ...(utm ?? {}) }\n',
     '  const { utm: _utm, ...rest } = input\n  return { ...rest }\n',
     EARLYT),

    # ── Biotic claims — Phase 1 Tranche 1 ───────────────────────────────────
    #
    # EatoBiotics adopted the strict ISAPP definitions, and three
    # non-equivalences follow: fermented food is not a probiotic, fibre is not a
    # prebiotic, a metabolite is not a postbiotic. Every case below restores a
    # claim that was ACTUALLY SHIPPING on /enter until this tranche — these are
    # regressions, not hypotheticals.
    #
    # 968 is the one worth reading twice. It does not break a rule; it deletes a
    # FILE from the guard's own corpus. That is the case-950 class, and before
    # the membership assertions were added it would have slipped: the suite
    # stays green having simply scanned one file fewer.

    (963, "the probiotics definition reverts to live organisms in fermented food",
     DICT,
     '        whatItIs: "Live microorganisms that, in the right amounts, have a demonstrated benefit. Not every fermented food contains them.",\n',
     '        whatItIs: "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir.",\n',
     BIOTIC),

    (964, "the fermented question asks about living foods reaching the gut",
     QUICK,
     '    text: "How often do you eat fermented foods?",\n',
     '    text: "How often do living foods reach your gut?",\n',
     BIOTIC),

    (965, "a Biotic gets a personal number again", EXPERIENCE,
     '                  <span className="text-sm font-semibold text-foreground">{engine.label}</span>\n',
     '                  <span className="text-sm font-semibold text-foreground">{engine.label} {result.subScores[pillar]}</span>\n',
     BIOTIC),

    (966, "foods are classified as prebiotic-rich", FRAMEWORK,
     '      "The fibers and compounds in everyday foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus -- the fuel your microbiome runs on.",\n',
     '      "The prebiotic-rich foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus.",\n',
     BIOTIC),

    # Aimed at retired-vocabulary rather than biotic-claims on purpose: this
    # proves the CORPUS ADDITION works. how-it-works.tsx shipped the banned term
    # on the holding page while no vocabulary guard read the file at all, so the
    # case that matters is the one that would have stayed green before it joined
    # MARKETING_SURFACES.
    (967, "the four-step explainer promises the canonical score again",
     HOWITWORKS,
     '    line: "See your Biotics Score™ instantly.",\n',
     '    line: "See your Food System Score instantly.",\n',
     RETIRED),

    # DISAMBIGUATED in Gate 3.7: the 2-space tranche entry is a SUBSTRING of
    # the same path indented 6 spaces in the value-pinned list, so the anchor
    # matched twice and did not say which list it meant. Widened onto its
    # neighbour, whose sort order differs between the two lists. The mutation
    # and the invariant are unchanged.
    (968, "a surface is quietly dropped from the claims corpus", BIOTICTEST,
     '  "components/home/the-framework.tsx",\n  "components/home/feed-seed-heal.tsx",\n',
     '  "components/home/the-framework.tsx",\n',
     BIOTIC),

    (969, "the fermented-food tip promises live probiotics again", DICT,
     '    probiotics: "Try a fermented food like yoghurt, kimchi or kombucha this week.",\n',
     '    probiotics: "Try a fermented food like yoghurt, kimchi or kombucha for live probiotics.",\n',
     BIOTIC),

    # ── Tranche 2A — the claims a customer can reach ────────────────────────
    #
    # 970-972 are the same claim in its three remaining homes: the free
    # result's cards, its share text, and the image that carries it into social
    # feeds. 975 is the false-positive counterfactual — a rule that cannot tell
    # a product-category claim from the brand's positioning line would have a
    # sweep edit the sentence the product is named after. 976-978 aim at the
    # ledger, which is the mechanism that makes a NEW reachable claim fail on
    # its own rather than waiting for someone to remember the file.

    (970, "a Biotic gets a personal number back on the free result",
     THREEBIOTICS,
     '          <p className="text-base font-semibold text-foreground">{insight.label}</p>\n',
     '          <p className="text-base font-semibold text-foreground">{insight.label} {insight.score}</p>\n',
     BIOTIC),

    (971, "the share text goes back to three personal Biotic scores", SCORECARD,
     '          text: `My Biotics Score is ${score}/100 — ${profile}. Take the free Food System Assessment to discover yours.`,\n',
     '          text: `My Prebiotics, Probiotics, and Postbiotics scores are ${feed}, ${seed}, and ${heal}. Take the free Food System Assessment to discover yours.`,\n',
     BIOTIC),

    (972, "the shared card image renders the three numbers again", OGCARD,
     '    { label: "Prebiotics",  color: "#7fc47e" },\n',
     '    { label: "Prebiotics",  color: "#7fc47e", score: Number(searchParams.get("feed") ?? 0) },\n',
     BIOTIC),

    (973, "the help page equates probiotics with fermented foods again", HELP,
     'Probiotics are live microorganisms that, in adequate amounts, have a demonstrated benefit;',
     'Probiotics are live cultures from fermented foods;',
     BIOTIC),

    (974, "the framework page locates live organisms in fermented food again",
     BIOTICSPAGE,
     '      "Live microorganisms that, in adequate amounts, have a demonstrated benefit — met in practice through foods transformed by fermentation.",\n',
     '      "Living bacteria and yeasts found in fermented foods that replenish the microbial community in your gut.",\n',
     BIOTIC),

    (975, "the rule stops telling the brand lens from a product category",
     BIOTICTEST,
     '   /\\b(live|living) foods?\\b(?!\\s+system)/i],\n',
     '   /\\b(live|living) foods?\\b/i],\n',
     BIOTIC),

    # DISAMBIGUATED in Gate 3.7: the 2-space tranche entry is a SUBSTRING of
    # the same path indented 6 spaces in the value-pinned list, so the anchor
    # matched twice and did not say which list it meant. Widened onto its
    # neighbour, whose sort order differs between the two lists.
    (976, "a corrected reachable surface is dropped from the guarded set",
     BIOTICTEST,
     '  "app/help/page.tsx",\n  "app/biotics/page.tsx",\n',
     '  "app/help/page.tsx",\n',
     BIOTIC),

    # RE-ANCHORED in Tranche 2C. This named lib/report/food-swaps.ts, which was
    # corrected and removed from the ledger -- the anchor was legitimately
    # invalidated rather than the case being wrong, so it moves to a file still
    # in the ledger instead of being deleted.
    # DISAMBIGUATED in Gate 3.7: the 2-space tranche entry is a SUBSTRING of
    # the same path indented 6 spaces in the value-pinned list, so the anchor
    # matched twice and did not say which list it meant. Widened onto its
    # neighbour, whose sort order differs between the two lists.
    (977, "a ledger entry is deleted while the file still carries the claim",
     BIOTICTEST,
     '  "lib/foods.ts",\n  "app/help/page.tsx",\n',
     '  "app/help/page.tsx",\n',
     BIOTIC),

    (978, "the reachable closure is narrowed until it proves nothing",
     REACHTEST,
     # RE-ANCHORED for Gate 3 step 0, which extracted the seed filter into
     # isSeed() so a second notion of "reachable" could exist. The mutation is
     # unchanged in intent: narrow the closure until it proves nothing.
     '  if (klass === "POST_V1") return false',
     '  if (klass !== "NOTHING_MATCHES_THIS") return false',
     BIOTIC),

    (979, "the canonical nudge promises live probiotics again", PILLARS,
     '    nudge: "Try a fermented food like yoghurt, kimchi, or kombucha this week.",\n',
     '    nudge: "Try a fermented food like yoghurt, kimchi, or kombucha for live probiotics.",\n',
     BIOTIC),

    # ── Tranche 2B — the prompts that regenerate the claim ──────────────────
    #
    # A prompt sentence does not stay one sentence: it is regenerated into many
    # customer-facing forms, addressed to one person at a time, in wording
    # nobody reviews. 985 is the one to read twice -- it moves a POINT VALUE
    # under cover of a wording edit, which is how a claims repair would become
    # a silent scoring change with every claims rule still green.

    (980, "the shared classifier calls fermented foods live cultures again",
     BPROMPT,
     '- probiotic: foods transformed by fermentation (yogurt, kefir, kimchi,',
     '- probiotic: live cultures / fermented foods (yogurt, kefir, kimchi,',
     BIOTIC),

    (981, "the consultation prompt claims colonisation again", CONSULT,
     '  Mechanism: fermentation-derived microorganisms that survive the journey mostly pass through',
     '  Mechanism: introduce viable bacteria strains that temporarily colonise and competitively exclude pathogens. They pass through',
     BIOTIC),

    (982, "the demo consultation reverts to the live-cultures definition",
     DEMOCONSULT,
     'Probiotics \u2014 live microorganisms that, in adequate amounts, have a demonstrated benefit;',
     'Probiotics \u2014 live cultures from fermented foods that replenish the microbiome;',
     BIOTIC),

    (983, "the report chat reverts to the live-cultures definition", CHAT,
     '- Probiotics: live microorganisms with a demonstrated benefit;',
     '- Probiotics: live cultures from fermented foods;',
     BIOTIC),

    (984, "the intelligence prompt reverts to fermented-foods-with-live-cultures",
     FOODINT,
     '- Probiotic presence (foods transformed by fermentation): up to 25 pts',
     '- Probiotic presence (fermented foods with live cultures): up to 25 pts',
     BIOTIC),

    (985, "a point value moves under cover of a wording edit", BPROMPT,
     '\u2022 Probiotic presence \u2014 up to 25 pts: 2+ fermented foods=25 | 1=20 | none=10',
     '\u2022 Probiotic presence \u2014 up to 25 pts: 2+ fermented foods=25 | 1=20 | none=15',
     BIOTIC),

    (986, "the report chat hard-codes a weighting again", CHAT,
     'SCORING: scores are 0\u2013100 and are calculated by the current EatoBiotics scoring model.',
     'SCORING: 0\u2013100 per pillar. Overall = prebiotic 45% + probiotic 30% + postbiotic 25%.',
     BIOTIC),

    (987, "a prompt module is dropped from the shared corpus", CORPUSFILE,
     '  "lib/biotics-prompt.ts",\n',
     '',
     BIOTIC),

    (988, "the consultation loses its Postbiotics discipline", CONSULT,
     '  Postbiotics are OUTPUTS, never ingredients. No food is "a postbiotic"',
     '  Postbiotics are the beneficial compounds in these foods. No food here is "a probiotic"',
     BIOTIC),

    (989, "the cheese exemption is widened into a category allowance",
     BIOTICTEST,
     '   /\\blive[- ]cultures?\\b(?!\\s+(and aged\\s+)?cheese)|\\bliving cultures?\\b/i],\n',
     '   /\\blive cultures?\\b|\\bliving cultures?\\b/i],\n',
     BIOTIC),

    # ── The holding-page redesign ───────────────────────────────────────────

    (990, "the join CTA reverts to the retired cohort name", EARLY,
     '  return "Add My System"\n',
     '  return `Join ${cohortNameInSentence(cohort.cohort)}`\n',
     EARLYT),

    (991, "a cohort id is renamed along with its label", EARLY,
     '  { id: "first-100", name: "100 Systems", through: 100 },\n',
     '  { id: "hundred-systems", name: "100 Systems", through: 100 },\n',
     EARLYT),

    (992, "the availability line renders when nothing was counted", HUNDRED,
     '          {cohort && cohort.isOpen ? (\n',
     '          {cohort === null || cohort.isOpen ? (\n',
     HOLDING),

    (993, "100 Systems stays on screen through the assessment", ENTERHERO,
     '      {idle ? <HundredSystems /> : null}\n',
     '      <HundredSystems />\n',
     HOLDING),

    (994, "retired programme vocabulary returns to the section", HUNDRED,
     '            {first.through} Systems\n',
     '            The First {first.through}\n',
     HOLDING),

    (995, "the section stops reading its number from the ladder", HUNDRED,
     '            {first.through} Systems\n',
     '            100 Systems\n',
     EARLYT),

    # ── The artwork swap ────────────────────────────────────────────────────
    #
    # Geometry cannot be sabotaged here (see the header), but an asset path and
    # an alt string are plain source, so these two can be.

    (996, "the section borrows another product's artwork again", HUNDRED,
     '              src="/hundred-systems.png"\n',
     '              src="/eatobiotic-hero.png"\n',
     HOLDING),

    (997, "the picture is replaced and its description is left behind", HUNDRED,
     '              alt="A crowd of people, each figure carrying their own lit food system"\n',
     '              alt="Individual food systems, each one a person"\n',
     HOLDING),

    # ── Tranche 2C — the EUR49 Report path and lifecycle email ──────────────

    (998, "the Report's probiotics definition reverts to the equivalence", REPORTBUILD,
     '    "Probiotics are live microorganisms that, in adequate amounts, have a demonstrated benefit.',
     '    "Probiotics are the live cultures in fermented foods.',
     BIOTIC),

    (999, "the Report reintroduces live foods as a category", REPORTBUILD,
     '      "Your answers suggest fermented foods are rare at the moment.',
     '      "Your answers suggest live foods are rare at the moment.',
     BIOTIC),

    (1000, "a swap reason asserts a live-culture count again", SWAPS,
     'reason: "Vinegar pickles are not fermented at all',
     'reason: "Vinegar pickles have no live cultures. Lacto-fermented versions provide hundreds of millions of bacteria per serving. Also not fermented at all',
     BIOTIC),

    (1001, "the pathway meaning reverts to live-culture exposure", SUBSCORES,
     '  probiotics: "fermented foods in your week",',
     '  probiotics: "live-culture exposure",',
     BIOTIC),

    (1002, "the assessment report re-asserts what a fermented food contains",
     ASSESSREPORT,
     '        why: "Naturally fermented cabbage. Whether it is still unpasteurised',
     '        why: "Naturally fermented cabbage contains hundreds of millions of live bacteria per gram. Whether it is still unpasteurised',
     BIOTIC),

    (1003, "the nurture email states a personal Biotic score again", SEQEMAIL,
     '  feed: "Your answers described how much fibre and plant variety reaches your gut.',
     '  feed: "Your Prebiotics score reflects how much fibre and plant diversity you are giving your gut bacteria.',
     BIOTIC),

    # RE-AIMED in Tranche 2C. The first form fabricated a digit from
    # String(key).length -- not a regression anyone would write, and the
    # sub-score fields had already been removed from the template's contract,
    # so it tested an impossibility rather than a risk. It now mutates the way
    # this would actually come back: by reading a sub-score again.
    (1004, "the email's pillar block reads a per-Biotic sub-score again",
     SEQEMAIL,
     '            const label = PILLAR_LABELS[key]\n',
     '            const label = PILLAR_LABELS[key] + " " + (opts as unknown as { feedScore: number }).feedScore\n',
     BIOTIC),

    (1005, "the retired Fermented Foods label reverts in a live email",
     RESULTSEMAIL,
     '  adding: "Fermented Foods",',
     '  adding: "Live Foods",',
     BIOTIC),

    (1006, "lifecycle email is dropped from the claims corpus", CORPUSTEST,
     '  "lib/email/sequence-email.ts",\n  "lib/email/results-email.ts",\n',
     '  "lib/email/results-email.ts",\n',
     BIOTIC),

    # ── Tranche 2D — account, twin, condition and demo surfaces ─────────────

    # ── REPOINTED AT 0R-5, AND THE FIRST ATTEMPT WAS WRONG ─────────────────
    #
    # The anchor was the `why` of `meal-impact.ts`'s PROBIOTIC row, which 0R-5
    # deleted whole: the row was `P0-SCIENCE-05`'s live per-Biotic construct —
    # a Biotic-named label, a band word from `input.probiotic_score`, and a
    # possessive mechanism. The anchor vanished because the row did, which is
    # the outcome this case wanted.
    #
    # First re-aimed at the FIBRE row's `why` in the same file, and it SLIPPED.
    # The rule that caught the original is "fermented food asserted to deliver
    # or contain live organisms", and it needs the word FERMENTED — which 0R-5
    # removed from that module along with the row. Moving the claim to a fibre
    # row changed the property, not just the anchor.
    #
    # Re-aimed instead at `lib/account/ritual.ts`, which still names a fermented
    # food on a live surface, so the property keeps a real subject. The earlier
    # miss is left recorded: a lexically-keyed rule follows the WORD, and
    # repointing a case must follow the word too.
    (1007, "a self-report acknowledgement says a fermented food delivers live organisms", RITUAL,
     '''  { key: "fermented", label: "Fermented food", ack: "Noted — that's today's fermented food logged.", color: "#2DAA6E" },''',
     '''  { key: "fermented", label: "Fermented food", ack: "Noted — that fermented food delivers live cultures into your gut.", color: "#2DAA6E" },''',
     BIOTIC),

    (1008, "the dashboard says a food delivers live cultures", SCOREPREVIEW,
     '      description: "Fermented foods",',
     '      description: "Fermented & live foods",',
     BIOTIC),

    (1009, "a condition page re-asserts what a fermented food contains",
     DEPFOODS,
     '  { slug: "kimchi", benefit: "Vegetables transformed by lacto-fermentation" },',
     '  { slug: "kimchi", benefit: "Fermented food rich in diverse live cultures" },',
     BIOTIC),

    (1010, "the food knowledge base asserts direct introduction again", FOODS,
     '{ title: "Lacto-fermented", detail: "Fermented by Lactobacillus rather than preserved in vinegar',
     '{ title: "Adds Live Cultures", detail: "Introduces Lactobacillus directly into your gut rather than preserved in vinegar',
     BIOTIC),

    (1011, "the scoring module reintroduces live foods as a category", ASCORING,
     '"Foods transformed by fermentation are the one pathway that brings microbial material in from outside',
     '"Fermented and live foods are the most direct way to introduce new microbes, bringing material in from outside',
     BIOTIC),

    (1012, "a corrected file is left behind in the ledger as a stale allowance",
     CORPUSTEST,
     # Anchor repointed at 0R tranche 1: KNOWN_UNCORRECTED became
     # (file, RULE) pairs after s7b 1007/1011 proved a file-level allowance
     # covers rule families it was never granted. The case is unchanged in what
     # it attacks — a ledger entry for a file that carries no claim at all.
     # `lib/pillars.ts` is the canonical education module and is genuinely
     # clean, which is why biotic-visual-encoding.test.ts uses it as its
     # known-clean control too.
     '  ["lib/assessment-data.ts", "foods classified as prebiotic-rich"],\n',
     '  ["lib/assessment-data.ts", "foods classified as prebiotic-rich"],\n'
     '  ["lib/pillars.ts", "a Biotic claimed as a person\'s own"],\n',
     BIOTIC),

    # ── Work Package B — the constitution and the FSS-v1 documents ──────────

    (1013, "the candidate label is dropped from the constitution", CONSTITUTION,
     '> ### FSS-v1 Candidate Domains — Frozen for Scientific Review, Not Yet Scientifically Approved',
     '> ### The Five FSS-v1 Domains',
     CONSTTEST),

    (1014, "the specification calls the candidate model validated", FSSSPEC,
     '**Status: CANDIDATE. Specification only. Nothing here is implemented, and\nimplementing it would not validate it.**',
     '**Status: the FSS-v1 methodology is scientifically validated and ready to ship.**',
     CONSTTEST),

    (1015, "the claims boundary stops refusing to relax the contract", CLAIMSB,
     '> **If review concludes the rule must be relaxed to permit the name, that is\n> the signal the name is wrong — not the rule.**',
     '> Where the rule blocks the name, the rule should be relaxed accordingly.',
     CONSTTEST),

    (1016, "the constitution drops the stored-key protection", CONSTITUTION,
     '**Stored keys never move.**',
     '**Stored keys may be renamed for clarity.**',
     CONSTTEST),

    # ── Gate 2 — the candidate model ────────────────────────────────────────

    (1017, "a legacy question pin is silently updated to whatever it is now",
     QV1,
     '{ kind: "legacy-ref", id: "q6", pin: "223dab5d7ca24c1a55bc7d2b50e498454f3d05b6baeb6507368b3d920a64a6e2"',
     '{ kind: "legacy-ref", id: "q6", pin: "0000000000000000000000000000000000000000000000000000000000000000"',
     QSET),

    (1018, "a scored item is quietly moved into an unscored layer", QV1,
     'part: "what-you-eat", sectionTitle: "Diversity", contributes: "fss", domain: "diversity" },\n  { kind: "legacy-ref", id: "q2"',
     'part: "what-you-eat", sectionTitle: "Diversity", contributes: "what-you-notice" },\n  { kind: "legacy-ref", id: "q2"',
     QSET),

    (1019, "Food Context is given a domain, so it can reach the Score", QV1,
     "const YOUR_FOOD_CONTEXT: ManifestEntry[] = CANDIDATE_ITEMS.filter(\n  (i) => i.contributes === \"food-context\",\n)",
     "const YOUR_FOOD_CONTEXT: ManifestEntry[] = CANDIDATE_ITEMS.filter(\n  (i) => i.contributes === \"food-context\",\n).map((i) => ({ ...i, contributes: \"fss\" as const, domain: \"mealRhythm\" as const }))",
     QSET),

    (1020, "the resolver stops checking pins", QRESOLVE,
     '  if (actual !== entry.pin) {',
     '  if (false) {',
     QSET),

    (1021, "an approved-weights export appears beside the fixture", FWEIGHTS,
     'export const DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS: DomainWeights = {',
     'export const APPROVED_FSS_V1_WEIGHTS: DomainWeights = {\n  diversity: 0.2, plantsAndFibre: 0.2, fermentedFoods: 0.2, foodQuality: 0.2, mealRhythm: 0.2,\n}\nexport const DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS: DomainWeights = {',
     FENGINE),

    (1022, "the fixture context becomes optional, so weights need no permission",
     FWEIGHTS,
     '  if (context?.__nonProductionFixture !== "DEV_ONLY — not approved methodology") {',
     '  if (false) {',
     FENGINE),

    (1023, "the 20-point floor returns", FSCORE,
     '  return { domain, state: "scored", score: Math.round((mean / 3) * 100), answered, total }',
     '  return { domain, state: "scored", score: Math.max(Math.round((mean / 3) * 100), 20), answered, total }',
     FENGINE),

    (1024, "an insufficient domain is scored as zero instead of withholding",
     FSCORE,
     '  if (insufficient.length > 0) {',
     '  if (false) {',
     FENGINE),

    (1025, "a legacy-unversioned score becomes comparable", FCOMPARE,
     '  if (isLegacyUnversioned(a) || isLegacyUnversioned(b)) {',
     '  if (false) {',
     FENGINE),

    (1026, "two band ladders are silently merged into one threshold set",
     FBANDS,
     '    { label: "Strong Foundation", color: "var(--icon-lime)", min: 65 },',
     '    { label: "Strong Foundation", color: "var(--icon-lime)", min: 60 },',
     FINTERP),

    (1027, "getScoreBand gains a default version, so callers stop choosing",
     FBANDS,
     'export function getScoreBand(score: number, interpretationVersion: string): Band {',
     'export function getScoreBand(score: number, interpretationVersion = "interpretation-legacy-account"): Band {',
     FINTERP),

    (1028, "the preview gate lets an environment variable turn it on", FPOLICY,
     '  if (vercelEnv === "production") return false',
     '  if (env.ENABLE_FSS_PREVIEW === "true") return true\n  if (vercelEnv === "production") return false',
     FGATE),

    (1029, "the preview page is baked at build time again", FPAGE,
     'export const dynamic = "force-dynamic"',
     'export const revalidate = 3600',
     FGATE),

    (1030, "the candidate runtime is pointed at Supabase", FLOCAL,
     '  return new LocalStorageRepository()',
     '  return process.env.VERCEL_ENV ? new SupabaseRepositoryDisabled() : new LocalStorageRepository()',
     FPERSIST),
    # ── Gate 3 — the action model ─────────────────────────────────────────

    (1031, "an action category gains a numeric value", ACATS,
     '    color: "var(--icon-green)",',
     '    color: "var(--icon-green)",\n    weight: 0.4,',
     AMODEL),

    (1032, "a domain is mapped straight to an action category", ACATS,
     'export function actionCategory(',
     'export const DOMAIN_CATEGORY = { mealRhythm: "rejuvenate" } as const\n\nexport function actionCategory(',
     AMODEL),

    (1033, "a biological-inference claim class is added", ATYPES,
     # REPOINTED in Gate 6.0. The old anchor keyed on a blank line after
     # `personalised-recommendation`, which was the union's last member; Gate 6
     # grew the union to six and put JSDoc between members, so that anchor no
     # longer exists. Same mutation, aimed at the new end of the union — the
     # case is unchanged in what it proves.
     '  | "plan-explanation"\n\n/**',
     '  | "plan-explanation"\n  | "biological-inference"\n\n/**',
     AMODEL),

    (1034, "the claim-class list drops a member, so the union and the data drift", ATYPES,
     # REPOINTED in Gate 6.0, same cause as 1033: CLAIM_CLASSES grew to six, so
     # the old tail of the value list no longer exists. Same mutation — drop a
     # member from the DATA while the union keeps it — aimed at the new tail.
     '  "system-fact",\n  "plan-explanation",\n]',
     '  "system-fact",\n]',
     AMODEL),

    (1035, "the priority selector gains a tolerance", APRIORITY,
     '  const chosen = scored.filter((d) => d.score === lowest).slice(0, PRIORITY_MAX)',
     '  const chosen = scored.filter((d) => d.score <= lowest + 10).slice(0, PRIORITY_MAX)',
     APRIORT),

    (1036, "priorities stop excluding insufficient domains", APRIORITY,
     '    (d): d is Extract<typeof d, { state: "scored" }> => d.state === "scored",',
     '    (d): d is Extract<typeof d, { state: "scored" }> => true,',
     APRIORT),

    (1037, "a priority quotes an item from another domain as its evidence", APRIORITY,
     '    .filter((q) => q.contributes === "fss" && q.domain === domain)',
     '    .filter((q) => q.contributes === "fss")',
     APRIORT),

    (1038, "unscored items reach the evidence", APRIORITY,
     '    .filter((q) => q.contributes === "fss" && q.domain === domain)',
     '    .filter((q) => q.domain === domain || q.contributes === "food-context")',
     APRIORT),

    (1039, "the Gate 2 priority sentence is quietly reworded", FDOMAINS,
     'which usually makes it the most direct place to start rather than the most important one.',
     'which makes it the most important thing for you to fix.',
     APRIORT),

    (1040, "Your Food Context reaches the score path", ACONTEXT,
     '    const usable = q !== undefined && q.contributes === "food-context"',
     '    const usable = q !== undefined',
     ACATT),

    (1041, "an unanswered context item is read as limiting, starving the plan", ACONTEXT,
     'const UNKNOWN_STATE: ConstraintState = "workable"',
     'const UNKNOWN_STATE: ConstraintState = "limiting"',
     ACATT),

    (1042, "the context filter stops filtering", ACONTEXT,
     '  return requires.every((c) => context.states[c] !== "limiting")',
     '  return true',
     APLANT),

    (1043, "the unconditional options are removed, so a constrained person gets nothing",
     ACATALOGUE,
     '    claimClass: "observed-behaviour",\n    requires: [],\n  },\n  {\n    id: "diversity-week-rotate",',
     '    claimClass: "observed-behaviour",\n    requires: ["time"],\n  },\n  {\n    id: "diversity-week-rotate",',
     ACATT),

    (1044, "a thirty-day entry is added, making the month a fourth list", ACATALOGUE,
     '    timeHorizon: "this-week",\n    title: "Rotate instead of repeating",',
     '    timeHorizon: "thirty-days",\n    title: "Rotate instead of repeating",',
     ACATT),

    (1045, "every domain is padded to all three categories", ACATALOGUE,
     '    category: "rejuvenate",\n    timeHorizon: "today",\n    title: "Protect today\'s meal that usually slips",',
     '    category: "seed",\n    timeHorizon: "today",\n    title: "Protect today\'s meal that usually slips",',
     ACATT),
    # ── RE-ANCHORED IN GATE 4 ────────────────────────────────────────────────
    #
    # `bind` was exported as `bindRecommendation` and `thirtyDayFocus` as
    # `describeThirtyDayFocus`, so Gate 4's stored-decision reader could bind
    # recorded catalogue ids through the SAME functions rather than a second
    # copy of them. Both anchors below named the old symbols and became
    # unresolvable — caught by the anchor audit, not by the suite, which
    # reported 171/171 either way.
    #
    # The invariants under test are untouched: ONE action for the plan rather
    # than one per priority, and ONE priority for the month. Only the symbol
    # names moved.

    (1046, "Today returns one action per priority instead of one for the plan", APLAN,
     '      today = bindRecommendation(candidate, p, provenance)\n      break',
     '      today = bindRecommendation(candidate, p, provenance)',
     APLANT),

    (1047, "the weekly set fills from the first priority only", APLAN,
     '      const next = q.rest.shift()',
     '      const next = queues[0].rest.shift()',
     APLANT),

    # RE-AIMED TWICE, and the second time found the real defect.
    #
    # v1 removed the outer `while` condition — not the binding cap, so a no-op.
    # v2 removed the inner `break` — also a no-op, because PRIORITY_MAX is 3 and
    # one pass of the loop can therefore add at most 3.
    #
    # v3 raises the cap itself, which is what somebody would actually do. That
    # exposed the real weakness: the plan test asserted
    # `length <= THIS_WEEK_MAX`, which is a tautology — raising the constant
    # raises the bound being checked. The test now asserts the LITERAL 3.
    (1048, "the weekly cap is raised, so the plan becomes a list", ATYPES,
     'export const THIS_WEEK_MAX = 3',
     'export const THIS_WEEK_MAX = 12',
     APLANT + AMODEL),

    (1049, "the thirty-day focus takes every priority rather than one", APLAN,
     '    thirtyDays: describeThirtyDayFocus(priorities[0]),',
     '    thirtyDays: describeThirtyDayFocus(priorities[priorities.length - 1]),',
     APLANT),

    (1050, "a recommendation loses its claim boundary", ACATALOGUE,
     '    claimClass: "general-education",\n    requires: ["cost", "access"],',
     '    claimClass: "observed-behaviour",\n    requires: ["cost", "access"],',
     ACLAIMS),

    (1051, "an outcome prediction is attached to a horizon", AHORIZONS,
     '      "One behaviour, held for a month. What survives an ordinary week is the part that has actually changed.",',
     '      "One behaviour, held for a month. You will feel the difference by then.",',
     AMODEL),

    (1052, "a recommendation promises to raise the score", ACATALOGUE,
     '      "Across this week, swap in three plant foods you do not usually buy, rather than more of the ones you already do.",',
     '      "Across this week, swap in three plant foods you do not usually buy. This will raise your score.",',
     ACLAIMS),

    (1053, "a rationale reads a deficiency into the answers", ACATALOGUE,
     '      "Your answers described a steady amount coming from a narrow set of sources.",',
     '      "Your answers described a likely fibre deficiency.",',
     ACLAIMS),

    (1054, "the plan imports the paid Report's deterministic core", APLAN,
     'import { ACTION_CATALOGUE, REASSESSMENT, THIRTY_DAY_FOCUS } from "./catalogue"',
     'import { choosePriority } from "@/lib/report/deterministic/priority"\nimport { ACTION_CATALOGUE, REASSESSMENT, THIRTY_DAY_FOCUS } from "./catalogue"',
     AFENCE),

    (1055, "the action layer reaches for the Biotic pillar vocabulary", ACATS,
     'import { ACTIONS } from "@/lib/product-vocabulary"',
     'import { PILLARS } from "@/lib/pillars"\nimport { ACTIONS } from "@/lib/product-vocabulary"',
     AFENCE),

    (1056, "the plan surface asks for a band with the unregistered version", APRESENT,
     'export const PLAN_COPY = {',
     'import { getScoreBand } from "@/lib/fss/interpretation/bands"\n\nexport const PLAN_COPY = {',
     AFENCE),

    (1057, "a stored action resolves against moved content instead of refusing", ASTORED,
     '  if (stored.actionSetVersion !== ACTION_SET_VERSION) {\n    return unresolvable("content-version-moved")\n  }',
     '',
     FPERSIST),

    (1058, "a withdrawn entry falls back to the first in the catalogue", ASTORED,
     '  if (!entry) return unresolvable("entry-withdrawn")',
     '  const resolved = entry ?? ACTION_CATALOGUE[0]\n  if (!resolved) return unresolvable("entry-withdrawn")',
     FPERSIST),

    (1059, "a stored action keeps the prose instead of the id", ASTORED,
     '    recommendationId: r.id,',
     '    recommendationId: r.practicalAction,',
     FPERSIST),

    (1060, "the candidate tree leaves the claims corpus", BIOTICTEST,
     'const CANDIDATE_ROOTS = ["lib/fss", "components/fss", "app/preview/food-system-v1"]',
     'const CANDIDATE_ROOTS = ["app/preview/food-system-v1"]',
     BIOTIC),

    (1061, "the derived corpus goes back to staged files only", BIOTICTEST,
     'return execSync(`git ls-files --cached --others --exclude-standard ${CANDIDATE_ROOTS.join(" ")}`, {',
     'return execSync(`git ls-files ${CANDIDATE_ROOTS.join(" ")}`, {',
     BIOTIC),

    (1062, "the withheld score name becomes reachable from a servable page",
     "app/pricing/page.tsx",
     'export default',
     'const LEAK = "Your Food System Score"\n\nexport default',
     RETIRED),
    # ── Gate 3.5 — the withheld name, and the comparability claim ─────────

    (1063, "the retest card claims a before/after improvement again", RETEST,
     "  const shareText = `I'm tracking my Biotics Score\u2122 with EatoBiotics",
     "  const shareText = `My Biotics Score went from ${state.baseline.score} to ${state.latest.score}` + `I'm tracking my Biotics Score\u2122 with EatoBiotics",
     RETIRED),

    # RE-AIMED. v1 removed only the FIRST of the sentence's two wrapped lines,
    # leaving "describes what your answers said — not a measurement of your
    # health." in place — which is the half the guard asserts, so the mutation
    # did not do what its own description said. The whole paragraph goes now.
    (1064, "the retest card drops the line saying what the two numbers are", RETEST,
     "        Both numbers came from the same assessment, taken {state.days} days apart. The difference\n        describes what your answers said \u2014 not a measurement of your health.",
     "        ",
     RETIRED),

    (1065, "a live surface takes the withheld score name back", TWINBUILD,
     'export const SCORE_TREND_LABEL = "Biotics Score\u2122"',
     'export const SCORE_TREND_LABEL = "Food System Score"',
     RETIRED),

    (1066, "the agent provider predicts a score movement again", DETERM,
     "are usually the most direct place to start.`",
     "tend to move your Food System Score most.`",
     RETIRED),

    # RE-ANCHORED in Gate 3.6. The sentence this case pins said "your answers";
    # buildAccountTwin assembles the week story from MEALS, so Gate 3.6
    # corrected the attribution and the old anchor no longer exists. The case's
    # intent is untouched — the mutation still credits the meals for moving a
    # number, which is the claim it was written to catch.
    (1067, "the week story credits the meals for the change", WEEKSTORY,
     '? "That is what your meals said this time. Let us see whether it holds."',
     '? "Your meals are moving the number \u2014 I can feel the momentum."',
     RETIRED),

    (1068, "the cleared ledger is widened again instead of a surface being fixed",
     "tests/unit/retired-vocabulary.test.ts",
     '    "lib/assessment/registry.ts",\n    "lib/cms/taxonomy.ts",\n  ]',
     '    "lib/assessment/registry.ts",\n    "lib/cms/taxonomy.ts",\n    "lib/account/share-card.ts",\n  ]',
     RETIRED),
    # ── Gate 3.6 — the provider's prose ──────────────────────────

    (1069, "the provider's rationale names the Biotics again", DETERM,
     "`${described} ${behaviourFor(strongest, src)} as one of your steadier patterns, `",
     "`Your ${BIOTIC_LABELS[strongest]} look settled, while ${BIOTIC_LABELS[weakest]} appear lower. `",
     ALCLAIMS),

    (1070, "the improving line goes back to a superlative on a Biotic", DETERM,
     "improving.push(`One of your stronger patterns: ${behaviourFor(strongest, src)}.`)",
     "improving.push(`${BIOTIC_LABELS[strongest]} remains your strongest area.`)",
     ALCLAIMS),

    (1071, "the next-best-action's why names the Biotic it targets", DETERM,
     "` Focusing on ${behaviourFor(target, baseline.bioticsSource)} is where there is the most room right now.`",
     "` Focusing on ${BIOTIC_LABELS[target]} supports the area with the most room to grow.`",
     ALCLAIMS),

    # The attribution, not the vocabulary. On /account the numbers are averaged
    # MEALS; "your answers described" is a false claim about where a finding
    # came from, and it is the kind that reads as harmless.
    (1072, "the provider claims the finding came from the assessment on every path", DETERM,
     'const described = src === "meals" ? "Your recent meals describe" : "Your answers described"',
     'const described = "Your answers described"',
     ALCLAIMS),

    (1073, "the two vocabularies collapse back into one", BEHAVIOUR,
     "  const hint = BIOTIC_FOOD_HINTS[MEAL_TO_LOOP[key]]\n  if (!hint) return BEHAVIOUR_UNKNOWN\n  return hint.split(\" like \")[0]",
     "  return loopBehaviour(MEAL_TO_LOOP[key])",
     ALCLAIMS),

    # The doubled-possessive repair. Only rendering the sentence shows it.
    (1074, "loopBehaviour stops stripping the leading possessive", BEHAVIOUR,
     '  return phrase.replace(/^your\\s+/i, "")',
     "  return phrase",
     ALCLAIMS),

    (1075, "loopBehaviour returns the Biotic label instead of the behaviour", BEHAVIOUR,
     "  const phrase = pillarBehaviour(BIOTIC_LABELS[key])",
     "  const phrase: string | null = BIOTIC_LABELS[key]",
     ALCLAIMS),

    # ── the baseline and the /account feed ───────────────────────

    (1076, "deriveGaps names a Biotic as lower than the others", BASELINE,
     "gaps.push(`Room to grow in ${where}: ${behaviourFor(k, source)}`)",
     "gaps.push(`${k[0].toUpperCase()}${k.slice(1)} appear lower than the others`)",
     ALCLAIMS),

    (1077, "the learning feed says a meal fed the member's Prebiotics", ACCTWIN,
     "      detail: `This meal brought ${mealBehaviour(tb)} \u00b7 meal score ${m.score}`,",
     "      detail: `This fed your ${tb[0].toUpperCase()}${tb.slice(1)}s \u00b7 meal score ${m.score}`,",
     ALCLAIMS),

    # The worst single claim found: personal, numeric, directional, longitudinal.
    (1078, "the fortnight trend makes a Biotic its subject again", PATTERNS,
     "        title: `Your meals climbed ${rounded} points on ${mealBehaviour(bestKey)} this week`,",
     "        title: `Your ${bestKey[0].toUpperCase()}${bestKey.slice(1)}s climbed ${rounded} points this week`,",
     ALCLAIMS),

    (1079, "the best-meals hint claims the meals feed the producers", PATTERNS,
     '  postbiotic: "polyphenol-rich foods are your superpower",',
     '  postbiotic: "your meals feed the producers well",',
     ALCLAIMS),

    # ── the panels and surfaces that lost their data ────────────────

    (1080, "the biotics panel takes a personal score prop back", BPANEL,
     'export function BioticsProgressPanel({ className = "" }: { className?: string }) {',
     'export function BioticsProgressPanel({ className = "", biotics }: { className?: string; biotics?: { prebiotics: { score: number } } }) {\n  void biotics?.prebiotics.score',
     BCLAIMS),

    (1081, "the biotics panel renders a per-Biotic number again", BPANEL,
     "                <p className=\"text-sm font-medium text-foreground\">{pillar.label}</p>",
     "                <p className=\"text-sm font-medium text-foreground\">{pillar.label} 67 / 100</p>",
     BCLAIMS),

    (1082, "the system map hands the stage a personal Biotic score again", SYSMAP,
     "export function systemMapState(_twin: FoodSystemDigitalTwin): SystemHotspotState[] {\n  return SYSTEM_HOTSPOTS.map((h) => ({ ...h }))",
     "export function systemMapState(_twin: FoodSystemDigitalTwin): SystemHotspotState[] {\n  return SYSTEM_HOTSPOTS.map((h) => ({ ...h, score: _twin.biotics[h.biotic].score }))",
     ALCLAIMS + EDUTAIN),

    (1083, "a hotspot action claims it feeds the producers", SYSMAP,
     '    action: "Add resistant starch this week \u2014 cooked-and-cooled oats or potato, legumes, onions.",',
     '    action: "Feed the producers: cooked-and-cooled oats, legumes and onions help your microbes make more.",',
     ALCLAIMS),

    # The most public form of the claim, and the one nobody can see once posted.
    (1084, "the share card draws the member's three Biotic scores again", SHARETWIN,
     "        momentumLabel: visual.momentumLabel,\n      })",
     "        momentumLabel: visual.momentumLabel,\n        biotics: [{ label: \"Prebiotics\", value: twin.biotics.prebiotics.score, color: \"#A8E063\" }],\n      })",
     BCLAIMS),

    (1085, "the Inside You chapters carry a personal Biotic level again", INSIDEYOU,
     '      value: null,\n      valueLabel: "",\n      takeaway:\n        "Plant variety is what moves this one',
     '      value: twin.biotics.prebiotics.score,\n      valueLabel: "Your prebiotic level today",\n      takeaway:\n        "Plant variety is what moves this one',
     ALCLAIMS + EDUTAIN),

    (1086, "the Inside You narration says fermented foods add live microbes", INSIDEYOU,
     '        "Foods transformed by fermentation \u2014 yoghurt, kefir, kimchi, sauerkraut, miso. Whether live microorganisms survive to be eaten depends on the food and how it is made.",',
     '        "Fermented foods add live microbes that work alongside your own \u2014 a busier, more diverse inner community.",',
     ALCLAIMS + BCLAIMS),

    # RE-ANCHORED within Gate 3.6: the title was restructured after reading it
    # rendered — the phrase as sentence subject gave a lowercase opening, and
    # the sibling detail line gave "fermented foods IS where…".
    (1087, "the week story says a Biotic led the week", WEEKSTORY,
     "    title: `Your week leaned on ${weekBehaviour(strongest)}.`,",
     "    title: `${strongest[0].toUpperCase()}${strongest.slice(1)} led your week.`,",
     ALCLAIMS),

    (1088, "the meal journey claims postbiotics were produced", MEALREVEAL,
     '  "The give-back stage",',
     '  "Postbiotics produced",',
     ALCLAIMS + BCLAIMS),

    (1089, "the menu scan tells the member it chose for their probiotics", MENUSCAN,
     "Chosen for your {behaviourFor(result.weakest)}",
     "Chosen for your {result.weakest}",
     BCLAIMS),

    # ── the guards themselves ───────────────────────────────

    (1090, "the agent loop leaves the claims corpus again", BCLAIMSFILE,
     # Anchor repointed at 0R-1: the dedup block for the Account/Assessment/
     # Report corpora now sits between this line and the closing bracket, so
     # the old "...AGENT_LOOP_SURFACES,\n]" anchor no longer exists. The case is
     # unchanged in what it attacks — the agent-loop corpus leaving the scan.
     "  ...AGENT_LOOP_SURFACES,\n  // 0R-1. Deduplicated:",
     "  // 0R-1. Deduplicated:",
     BCLAIMS),

    (1091, "the possessive rule is dropped from PERSONAL_BIOTIC_STATE", BCLAIMSFILE,
     '  ["a Biotic claimed as a person\'s own",\n   new RegExp(String.raw`\\b(?:[Yy]our|[Mm]y)\\s+${BIOTICS_ANY}\\b`)],',
     "",
     BCLAIMS),

    (1092, "the state-verb rule readmits the copulas, breaking education", BCLAIMSFILE,
     "   new RegExp(String.raw`\\b${BIOTICS}\\s+(?:remains?|appears?|looks?|seems?)\\b`)],",
     "   new RegExp(String.raw`\\b${BIOTICS}\\s+(?:remains?|appears?|looks?|seems?|is|are)\\b`)],",
     BCLAIMS),

    # THE COUNTERFACTUAL FOR THE WHOLE GATE. A source scan of the 22 corpus
    # files catches 1 of the 9 original claims, because the rest interpolate.
    # If the behavioural guard stops CALLING the generators and inspects source
    # text instead, it goes green while every claim is back. This case is the
    # proof that calling them is what closed the defect.
    (1093, "the behavioural guard stops calling the generators", "tests/unit/agent-loop-claims.test.ts",
     "        assertClean(\"analysis.rationale\", [turn.analysis!.rationale])",
     "        assertClean(\"analysis.rationale\", [])",
     ALCLAIMS),
    # ── Gate 3.7 — the pre-flight ───────────────────────────────

    (1094, "the cycle diagram claims organisms join the colony again", BIOTICSPAGE,
     'desc: "Live microorganisms may arrive, depending on the food"',
     'desc: "New living bacteria join the colony"',
     BCLAIMS),

    # The counterfactual for the rule itself: "colony" must stay sayable, and a
    # rule that refused the noun would make the page less accurate, not safer.
    (1095, "the colony rule is widened to refuse the word itself", BCLAIMSFILE,
     '   /\\b(join\\w*|enter\\w*|settl\\w+|establish\\w*|arriv\\w*|add\\w*|introduc\\w*)\\b[^.!?]{0,40}\\bcolon(y|ies)\\b/i],',
     '   /\\bcolon(y|ies)\\b/i],',
     BCLAIMS),

    (1096, "the postbiotics card asserts health outcomes flat again", BIOTICSPAGE,
     'They are associated with lower inflammation, a stronger gut lining, better-regulated immune response, and how you feel day to day.',
     'They reduce inflammation, strengthen the gut lining, regulate immune response, and directly influence how you feel.',
     BCLAIMS),

    (1097, "the menu-scan prompt is told the member's weakest biotic again", MENUSCAN_ROUTE,
     'content: `The food pattern to favour is: ${pattern}.',
     'content: `The member\'s weakest biotic is ${weakest} \u2014 bias the picks toward it.',
     BCLAIMS),

    (1098, "the menu-scan prompt asks the model what a dish feeds", MENUSCAN_ROUTE,
     '- "why" names the FOODS in the dish and why they suit the pattern. Do not describe what happens',
     '- "why" should mention what the dish feeds inside your Prebiotics. Do not describe what happens',
     BCLAIMS),

    (1099, "the sixth prompt module leaves the claims corpus", BCLAIMSFILE,
     '  "app/api/menu-scan/route.ts",\n]',
     ']',
     BCLAIMS),

    (1100, "the permanent product rule is deleted from CLAUDE.md", CLAUDEMD,
     '> **Measure the food system we can observe. Teach the biology accurately. Never\n> present the biology as personally measured when it isn\'t.**',
     '',
     CMDTEST),

    (1101, "the rule stops requiring a new generator to join the behavioural guard", CLAUDEMD,
     '**A new generator of customer-facing prose belongs in\n  that file, not only in a corpus list.**',
     'It is thorough.',
     CMDTEST),
]
