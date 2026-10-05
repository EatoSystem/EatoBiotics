# REVIEW.md — audit log

`CLAUDE.md` refers to this file five times as the place audits and their
follow-ups live. It did not exist — not in the working tree and not anywhere in
git history. This file starts it. Entries are newest first.

---

## 2026-10-05 — Engineering rule adopted: warning counts are not waivers

Adopted at the Experience 0R-4 close, and general beyond it. This sits beside
the process rule recorded in the Gate 6.0 close below — it is a **review
discipline**, not a product-design principle, which is why it is here and not
in `EXPERIENCE_CONSTITUTION.md`.

> **Warning counts are not waivers.** A baseline may be tolerated, but its
> warnings remain evidence.
>
> - **When the count changes, attribute the delta.** Do not report a new number
>   as though it were the same baseline.
> - **When a path you are about to change already carries a warning, read it.**
>   Check whether it describes the defect you are changing.

### What it cost to learn

Every gate of this programme reported *"0 errors, 97 pre-existing warnings"* and
moved on. One of those 97 was:

```
components/account/live-dashboard.tsx
  1694:19  warning  Unexpected constant truthiness on the left-hand side of a
                    `&&` expression          no-constant-binary-expression
```

Line 1694 was:

```tsx
{(todayMeals.length > 0 || true) && (
```

— the tautological gate on "Today's average", which made a fabricated score
from `MOCK_MEALS` render for every member with no meal logged that day. A **live
`P0-TRUST-01` manifestation**, and one the Experience 0 visual audit did not
find. **eslint had been pointing at it the whole time, by name, inside a count
nobody read.**

It surfaced only because a one-warning change in the total (97 → 96) had to be
explained, which forced a diff by file and rule against the earlier head. Had
the count not moved, the warning would still be sitting there.

### Two corollaries worth keeping

- **A tolerated baseline must still be attributable.** "Pre-existing" is a
  statement about *when* a warning appeared, not about whether it matters.
- **Report the right line.** The same close contained a reporting error in the
  other direction: `tail -2` of eslint's output captures *"0 errors and 1
  warning potentially fixable with the `--fix` option"* — the **auto-fixable**
  count — which was quoted as the total and produced a spurious 97 → 1 cliff.
  The canonical summary is the `✖` line.

Evidence: `AUDIT_BASELINE.md` §13; the defect itself is `P0-TRUST-01` in
`docs/experience/EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`.

**No lint cleanup was performed at this close.** 96 warnings remain the reported
baseline; this entry records what one of them was saying.

---

## 2026-10-05 — TypeSafe evaluated and not adopted

A third-party agent skill, `typesafe-ai/skills`, was proposed for installation
and use on this project. **Evaluated and not adopted. Nothing was installed.**

No plugin at user level, no marketplace added, no change to
`.claude/settings.local.json`, no dependency, no tooling commit and no tooling
branch. Verified absent: `~/.claude/plugins`, any mention in
`.claude/settings.local.json` or `package.json`, any installed binary.

### Why — the name does not describe the product

"TypeSafe" reads as a TypeScript static-typing tool. It is not one. Its own
description is *"small units of AI intelligence you can use like programming
primitives"*, built on *"System One models, including Jev,"* which *"turn
natural language and application state into typed judgments and probabilities
that code can combine."* Its three primitives are each a model call:

| | |
|---|---|
| `Choice` | *"Picks one option; its distribution compares competing options"* |
| `Noul` | *"Probability of yes"* |
| `Score` | *"Probability-weighted position on ordered levels"* |

It self-describes as supplying *"programmable common sense where ordinary code
needs semantic understanding"*, producing judgments, classifications and
scores, with application state sent as JSON to a hosted HTTP API under
server-side credentials.

### The collision

Adopting it would put a second decision engine inside the product whose entire
Intelligence boundary exists to prevent exactly that — the permanent rule
recorded in the Gate 6.0 close above and in
`docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` §8:

> **Structured truth is authoritative. AI is a consumer of it.**
>
> **AI may explain and operationalise EatoBiotics decisions. It may not
> silently become a second decision engine.**

A primitive set of *pick an option* · *probability of yes* · *score on ordered
levels* is a second decision engine by construction. `Score` in particular
lands on the most governed concept in the product: a candidate methodology
pending independent scientific review, where `interpretation-v1.0` is
deliberately unregistered and `getScoreBand` throws by design.

Three further collisions, each factual rather than cautionary:

1. **A third AI provider.** `CLAUDE.md` records a deliberate two-provider split
   — Claude for coaching, reports and chat; OpenAI only for plate-builder
   recipes and images. A third provider is an architectural decision.
2. **The AI cost guard would not see it.** `scripts/check-ai-guard.mjs` requires
   every user-triggered inference path to be capped via `guardAiUsage`; a new
   provider's calls are invisible to it.
3. **Member state would leave the product.** The application state here is
   members' food and health self-reports. Sending it to a third party is a
   data-protection decision, not a tooling one, and sits beside the retention,
   RLS and portability commitments already recorded.

### Standing position

Not a permanent prohibition, and not a judgement on the product's quality. If
adoption is ever wanted it needs its own review gate, in the shape Gates 6.0
and 6.1 took — the second-decision-engine question, the provider split, AI cost
capping, the data-protection decision, and where such primitives could live
without touching FSS methodology or the Biotics Score™. It is **not** a
mid-remediation tooling choice.

**Experience 0R continues on the existing toolchain and specification,
unchanged.** No 0R stage, guard, corpus or sabotage suite is affected.

---

## 2026-10-02 — Gate 6.0 close · EatoBiotics Intelligence boundary

Branch `claude/eatobiotics-intelligence`, head **`331fc80`**, tree clean.
`origin/main` untouched at `a2ad034` throughout. No Supabase read, write,
migration drafted or applied, or column named.

Gate 6.0 builds the containment vessel for the first AI consumer of the
deterministic product and **makes no model call at all**. The chain it proves,
and stops at:

```
trusted deterministic system → declared intent → exact minimum context
  → structured claim basis → deterministic binding validation
```

No prompt, no provider SDK, no chat surface, no `/account` mount.

### The five permanent rules

Frozen in `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` §8, with the instrument that
enforces each named beside it — a rule with no named instrument is what this
programme repeatedly finds broken.

> Structured truth is authoritative.
> AI receives only the context required by its declared intent.
> Context is capability.
> Validate claim bindings deterministically; guard language separately.
> AI may explain or operationalise a decision. It may not silently make a new one.

### Commits

| | |
|---|---|
| `1e46947` | 6.0a — `ClaimClass` four → six, moving the four pins that existed to make exactly this change visible |
| `037f01d` | 6.0b — `AiIntent`, the type-only ceiling, `INTENT_FIELDS`, `toAiContext` |
| `0c80704` | 6.0c — `ClaimBasis` and deterministic binding validation |
| `f4285e9` | 6.0d — two missing guards, sabotage 1400–1417 |
| `331fc80` | the harness repair below |

### Evidence

`tsc` clean · `eslint` 0 errors · **6327** unit tests passing across 224 files ·
three guard scripts pass · `next build` succeeds · Playwright **181/181** ·
anchor audit **441 anchors, 0 ambiguous, 0 duplicate numbers, 33 unresolvable**.

Every sabotage suite at full count: base 26/26 · `v1` 10/10 · `s3` 12/12 ·
`s4` 8/8 · `s5` 10/10 · `s6` 14/14 · `s7` 30/30 · `s7b` 171/171 ·
`g4` **44/44** · `g5` 65/65 · `g6` **18/18**.

**`run_s3a` is the one exception and cannot be green.** 2/35 caught, 33 broken,
every one targeting files that live on unmerged PR #274. That is the documented
set, and it is the same 33 the anchor audit reaches independently. Recorded as
an exception rather than folded into "all suites green", because that phrasing
would be false.

### A harness defect the gate itself found

`run_s3a` reported **nothing at all** before this gate. `run.py` called
`read_bytes` before the `ANCHOR MISSING` report, so the first absent target
raised and took the whole suite down with a traceback — hiding the other 25
cases' results. A suite that crashes reports nothing, and nothing reads as
nothing wrong.

That is precisely the failure mode the harness exists to detect, occurring
inside the harness, and it is the same argument `collectable()` already makes in
its own comment about a case that reports caught for every mutation and for no
mutation. Fixed with a pre-check returning `"anchor"`: no mutation happened, so
nothing was proved, and a missing file can never make a case appear caught.

### Two guards added because the sabotage list had nothing aimed at them

Both are permanent.

**Comparative prose blocked at the AI-layer import boundary.** The behavioural
test catches prose that reaches the built context object; this catches it one
step earlier. The route it closes is specific: `COMPARATIVE_COPY_REVIEW.state`
is still `"pending"`, and the `CANDIDATE_ROOTS` fence permits `lib/fss` — where
this layer lives — so pending copy could have become generated customer copy
through a door that fence does not watch.

**Methodology values blocked from the ceiling.** The import guard stops a
scoring or selection *function* arriving. This stops the *numbers* arriving
without it — weights, band thresholds, a ranking rule — which would let a model
recompute a score or a band and reach a figure no deterministic component
produced. Verified to fire on its own reason rather than riding on the
ungranted-field bridge.

### Two Gate 4 anchors repointed, not deleted

**1237** — `FoodSystemAiContext` became the type-level ceiling, so the old
section-comment anchor no longer exists. Same mutation, aimed at the new
declaration, now firing the widened guard.

**1238 is the only case in this programme whose premise was retired on purpose
rather than drifting.** It asserted that `toAiContext` still throws; Gate 6.0
gave it a body, which the module's own Gate 4 header anticipated in writing —
*"Gate 6 is where something uses it."* Deleting the case would have lost a slot
still needed, because the same file has a new thing to protect in the same
spirit: the closed intent union. The plan prohibited an escape hatch by name
and nothing else in the harness tried one, so 1238 now opens it (`"raw"` added
to `AI_INTENTS`).

### Process rule adopted after this gate

> **mutation harness finished → clean tree verified → commit.**

One commit in this gate was made while the sabotage harness was actively
mutating source. A pre-commit check that none of the four staged files was a
mutation target is why that commit's evidence survived — and it is not a
pattern to repeat. A tree mid-mutation is a tree that cannot be described in one
sentence, and being describable in one sentence is the whole value of the
evidence chain.

### Two things reported rather than fixed

**The anchor audit is not in the repository.** It lives in the session
scratchpad and has already been reconstructed once after a session ended. It is
the obvious candidate for the next housekeeping pass.

**`CLAUDE.md` cites sections of this file that do not exist.** It refers to an
"Implementation Status log" and to a "Second Pass → Additions #5" when
explaining the Migration 36 and Migration 41 drift. Neither section is in this
file. That is the same documentation-versus-reality drift `CLAUDE.md` warns
about, in the document doing the warning — which is exactly why it warns. Not
changed here, because this programme has amended `CLAUDE.md` only when asked.

### What Gate 6.0 does not settle

Clearing the Intelligence boundary approves none of the FSS-v1 science. The
five candidate domains, the seven draft questions, the domain weights, the
canonical score bands and the fifteen comparative sentences
(`COMPARATIVE_COPY_REVIEW.state` still `"pending"`, `reviewedBy` still null)
remain open, and the candidate product stays inside its preview fence.

---

## 2026-07-29 — Phase 0 correctness pass (branch `claude/eatobiotics-review-fpqu6q`)

Triggered by an external review of the whole product. Its findings were checked
against the codebase before anything was changed; the corrections to that review
are recorded below, because two of its stated blockers were not real.

### Scope taken

Correctness, accuracy and honesty only. No homepage restructure, because four
PRs were already competing for that surface (#176 rebrand, #177 `/newhome`,
#178 `/newdemo`, #125 concept). PR #176 owns the Feed / Seed / Regenerate
rename and correctly keeps `heal` as the persisted key; this branch stays out
of its way and fixes what it explicitly left out of scope.

### What changed

1. **Postbiotic language.** Postbiotics are outputs of bacterial fermentation,
   not ingredients. `/biotics` and chapter 3 of the book said so; roughly 35
   other surfaces contradicted them, including the public chat agent, which
   told visitors that olive oil, dark chocolate and berries *are* postbiotics.
   All prose corrected. `lib/biotics-prompt.ts` added as the single source for
   the three-biotics text the AI routes paste into prompts — it had been
   hand-written in eight blocks across seven routes, twice in one file, which
   is how it drifted. Data keys (`BioticType`, `postbiotic_score`,
   `postbiotics`/`heal` sub-scores) untouched.

   Three cross-file classification disagreements resolved with `lib/foods.ts`
   as the classifier of record: sourdough and aged cheese are probiotic, olive
   oil is prebiotic. Meals with aged cheese now score through the probiotic
   bucket rather than the postbiotic one.

2. **The score share card, broken three ways.** The share link pointed at
   `/score`, a route that has never existed and has no rewrite, so every score
   anyone shared led to a 404. The card image was requested with one set of
   parameter names and read with another, so every card rendered 0 / 0 / 0.
   And underneath both, the route returned 500 because Satori requires an
   explicit `display` on any div with more than one child — so the image had
   never rendered at all. All three fixed; the route now accepts either
   parameter spelling so cards already shared keep working.

3. **Honest labels.** `/pregnancy` announced "Life System · Live" while
   `lib/systems.ts` had it as `scaffold`, the page was noindexed, and the
   homepage card said "Coming soon". Eyebrows are now derived from the
   catalog via `systemEyebrow()` across all six system pages that hardcoded
   them. Digital Twin removed from customer copy (see below). One €49 product
   had three names across one funnel — "Gut Report" on the homepage, "Personal
   Report" at the CTA, "Food System Report" on the Stripe line item —
   standardised on **Food System Report**.

4. **Accessibility.** Reduced motion honoured by the hero video, which now also
   has a play/pause control; ScrollReveal no longer ships invisible markup, so
   a blocked bundle degrades to unanimated rather than blank across 136 files;
   a skip link added, with `<main id="main">` to target.

5. **Node pinned** via `.nvmrc` and `engines`, matching CI's Node 24.
   Moved from 20 when Vercel discontinued that line; 24 "Krypton" is the
   current LTS. All three pins move together, or CI verifies a runtime
   production does not use.

### Corrections to the external review

- **"Repo says Feed/Seed/Heal, should say Regenerate"** — incomplete. The split
  is three-way, not two: `Produce` is also in use for the third pillar
  (`lib/biotics.ts`, `/biotics`, `/family`, `YouFramework`, i18n), and `Add`
  for the second. "Regenerate" appeared nowhere in the repo. See Open questions.
- **"Pregnancy is a scaffold presented as live"** — the label was wrong, but the
  assessment is fully built and works end to end. A labelling bug, not a
  missing feature. Fixed the label; left the status alone.
- **"Condition pages need noindex/evidence review"** — `/anxiety`, `/adhd`,
  `/depression` and `/bipolar` are indexed *and* sitemapped consistently, and
  each carries a disclaimer component. Not a code defect. Left as-is by
  decision; see Open questions.
- **"No a11y test setup"** — false. Playwright, `@axe-core/playwright` and a
  20-page smoke suite already run in CI. The real gap is that only `critical`
  fails while `serious` is report-only — and neither defect fixed above is
  detectable by axe at all.
- **"Validation/build baseline unavailable"** — that was the reviewer's local
  npm failure. CI runs `npm ci` on Node 24 then lint, vitest, `tsc --noEmit`,
  two guard scripts, `next build` and the axe suite. Only genuine gap was the
  missing Node pin, now added.

### Verified

`tsc --noEmit` clean, 537 unit tests pass, `next build` succeeds, axe suite
20/20. The score card was rendered locally and inspected (200, 1200×630 PNG,
real numbers, identical output from both parameter spellings). The
accessibility behaviours were checked in Chromium against a production build:
reduced motion leaves the video paused and offers Play, which works; default
motion plays and offers Pause; JavaScript disabled still renders page content;
the skip link is the first tab stop.

No database changes. Nothing here touches Supabase.

### Review rounds and merge

Codex reviewed the branch twice before merge.

- **Round one** raised two findings: a deterministic health claim on `/food`
  ("directly repair the gut lining and reduce inflammation"), and the twin
  figure's default `alt` still reading "Your Food System Digital Twin" —
  meaning the rename had been true for sighted users only, since the three
  public `/digital-twin` call sites all omit `alt`. Both fixed in `5988f92`.
- **Verifying those fixes** surfaced a third problem the original pass missed:
  three taglines still asserting a food *is* a postbiotic (`lib/foods.ts:577`,
  `:628`, `plate-creator-client.tsx:348`). Fixed in `d48defc`.
- **Round two** found a fourth: `dashboard-client-data.ts:143` told members
  "Sourdough or aged cheese add more postbiotic compounds" — naming the two
  foods this very branch reclassified as *probiotic*. Fixed in `ec25b5c`.

**Lesson worth keeping.** The sweep after `d48defc` used a noun-phrase pattern
(`is a postbiotic`, `postbiotic-rich`), which cannot match a verb phrase like
"add more postbiotic compounds" — which is exactly how the round-two line
survived it. Any future correctness sweep over this vocabulary needs both
shapes. The re-run used `add|provide|contain|deliver|give|boost|supply|…` near
"postbiotic" and came back clean for app surfaces.

Merged as `86db4c5` (merge commit, per repo convention — the last 30 commits on
`main` are all `Merge pull request …`, none squashed).

### The sweep lesson, three times over

The postbiotic case above was not a one-off. The same failure recurred twice
more after this pass merged, each time because a search pattern assumed a shape
the content did not have:

1. **Noun phrase vs verb phrase** — `is a postbiotic` could not match "add more
   postbiotic compounds".
2. **Predicate vs prose** — the follow-up pattern was built around foods being
   *described as* postbiotics, and missed a dashboard line that simply told
   members to add them.
3. **Contiguous phrase vs element-split** (#176, `8c2cc72`) — the homepage H2
   read "Build your / Digital / Twin." across three coloured `<span>`s, so the
   string `"Digital Twin"` never appeared in the file. No substring grep could
   have found it. Both the original sweep and the merge-time alt-text guard
   searched for exactly that phrase, and the heading shipped in #179 and stayed
   live on `main` until #176.

**The rule.** Sweep for the *rarest single token* — `Twin`, `postbiotic` — and
read every hit, rather than for the phrase you expect to find. The token sweep
is noisier (104 hits for `\bTwin\b`, 91 of them comments) but it is the only
form that survives the content being split, reworded or inflected. Applying it
is what found both the H2 and, immediately after, seven further bare-"Twin"
strings on `/method` and `/digital-twin`.

**Also worth recording honestly:** #179's description claimed Digital Twin had
been removed from customer copy on the homepage, `/method` and `/digital-twin`.
For all three it was partial — alt text, eyebrows, body and CTAs were corrected
while headings, prose and a UI label were not. A claim that a sweep is complete
should name the pattern used, so the next reader can judge what it could not
have matched.

**A fourth shape: comments that quote copy.** Several file-header comments
quote the heading their component renders, in quotation marks. When the copy
moves and the comment does not, the comment becomes false rather than merely
dated — `system-dimensions.tsx` described a "Twin-score pill" it no longer
rendered, and `orbit-hub.tsx` quoted "One Twin. Connected to everything." long
after #179 had changed that heading to "One Food System." Engine-room
*naming* in comments is fine and expected; a comment *quoting customer copy*
is a second copy of that string and has to move with it. Worth including
quoted headings in any copy sweep.

Chasing that turned up a genuine inconsistency in this branch's own work.
`/digital-twin` carries three parallel section headings, and the replacement
for "One Twin. Many lenses." was first written as "One system. Many lenses."
— echoing the section's body line but breaking the pattern its two siblings
already set ("One Food System. A lifetime of learning.", "One Food System.
Connected to everything."). Corrected to **"One Food System. Many lenses."**
Page-local consistency beats a local echo, and reading the neighbours is how
you see it.

### Accepted decisions

Confirmed by the founder on 2026-07-29/30. These replace the corresponding
entries that were previously open questions.

1. **Third-pillar verb → `Regenerate`.** `Regenerate` is the word for public
   brand and action copy; explanatory science copy reads "your system produces
   microbial metabolites and postbiotic outputs" rather than adopting `Produce`
   as the label. **Persisted keys do not move** — `aliasKey: "heal"`,
   `PillarAliasKey`, the `?heal=` OG contract and the `sub_scores` JSON all stay
   exactly as they are. The rule already documented in `lib/pillars.ts`
   ("Rename `aliasLabel`, never this") governs the unification.
2. **Condition pages stay indexed**, pending legal/science review. No code
   change. The asymmetry with `/pregnancy`'s noindex is now recorded as
   deliberate policy rather than inherited by accident.
3. **`/pregnancy` stays "Coming Soon" with the CTA in place.** Noindexed,
   homepage card reads "Coming soon", and the assessment remains usable by
   direct URL. This is the state already shipped — no follow-up work.
4. **Homepage direction: deferred.** Codex has since reported on merge order
   (Phase 0 before #176, which is what happened), so the blocker on this
   decision is cleared and it can be taken whenever the founder is ready.
   #177 / #178 / #125 remain non-blocking preview routes.

### Open questions for a human

1. **`lib/foods.ts` internal inconsistency**, noticed but out of scope: Mixed
   Berries is classified `postbiotic` while Blueberries is `prebiotic`.
2. **`SystemStatus` declares `"planned"`** with zero usages, and `pregnancy` is
   the only `scaffold` system that still carries an `assessmentRoute`.

### Deferred to the evidence-language pass (Workstream E)

Found during the Phase 0 sweeps, deliberately not changed — these are
evidence/legal judgements rather than factual corrections, and the founder
scoped them out of the correctness gate:

1. **`lib/foods.ts:630`** — green tea metabolites described as having
   "anti-inflammatory, **anti-cancer**, and neuroprotective effects". The
   strongest claim remaining in the food catalogue.
2. **`content/book/chapter-11.mdx:377`** — "Fermented foods contain postbiotic
   compounds even before you eat them." Defensible (fermentation does produce
   metabolites in the jar) but close to the line the rest of the product holds.
3. **Medical-metaphor taglines** — "Cooling transforms starch into gut medicine"
   (`lib/foods.ts:551`), "The oldest medicine in your kitchen" (`:51`). Judged
   brand voice rather than health claims. Historical prose such as "eaten for
   centuries as a digestive medicine" describes history and is fine as-is.
4. **Deterministic postbiotic-effect prose**, raised by Codex while reviewing
   #181 and correctly not treated as a blocker — it is pre-existing and #181
   did not introduce it. Three sites assert effects rather than describing what
   the evidence supports, which is the same register `/food` was corrected out
   of in #179 (`5988f92`):
   - `app/biotics/page.tsx:57` — postbiotics "reduce inflammation, strengthen
     the gut lining, regulate immune response, and directly influence how you
     feel."
   - `app/biotics/page.tsx:294` — "Postbiotics strengthen the gut lining."
   - `lib/pillars.ts:94` — `whatItDoes`: "they calm inflammation and strengthen
     the gut lining."

   `lib/pillars.ts` is the canonical vocabulary module, so whatever wording is
   chosen there should lead and the two page strings should follow it rather
   than being reworded independently.
