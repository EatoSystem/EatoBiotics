# EatoBiotics — review brief and ongoing workflows for Cursor

Read [`00_PROJECT_BRIEF.md`](./00_PROJECT_BRIEF.md) first. This document assumes
it.

Two halves:

- **Part A — the review.** What to look at, in what order, what "good" looks
  like, and the anti-goals.
- **Part B — nine repeatable workflows**, each marked as safe for Cursor to own
  or reserved for the programme loop.

---

# Part A · The review

## A0 · The posture that makes this review useful

A conventional code review here will produce a long list of true-but-useless
observations: a 2,609-line component, 2,472 inline styles, four UI generations.
All known, all measured, all already in `docs/experience/AUDIT_BASELINE.md`.

What is **not** known, and what this review should produce:

1. **Where the enforcement has gaps** — a reachable, claim-bearing surface that
   is in no corpus. This is the highest-value finding available, because it is
   exactly how every previous defect survived.
2. **Where the code is honestly just bad** — in the areas the integrity
   programme has not touched and will not touch: performance, accessibility,
   error handling, dead code, dependency surface, security posture.
3. **Where a stated invariant is not actually enforced** — a docblock claiming a
   property no test holds.

> **Source inspection establishes possibility. Rendered evidence establishes
> reachability.** A claim about what a surface *does* is not settled by reading
> the component. It is settled by rendering it and looking.

And the corollary that costs the most when ignored:

> **A guard that only ever passes is indistinguishable from a guard that reads
> nothing.** If you assert a new invariant, prove it fails against the shape it
> is meant to refuse.

## A1 · Review areas, in priority order

### 1. Claims-enforcement coverage — highest value

**Entry:** `tests/unit/customer-surfaces.ts` groups vs `lib/v1-surface.ts` tiers.

Derive the set of reachable, customer-visible, claim-bearing files and diff it
against the named corpus. Every gap is a finding.

**Good output:** a table of `file → reachability tier → does it carry a personal
claim → which corpus group it belongs in`.

**Do not** widen a rule to cover a gap, and **do not** add files to the corpus
in the same change as reporting them — a corpus widening turns guards red and
that red list is a deliberate artefact the programme consumes in sequence.
Report; let the programme absorb.

Known-and-accepted exclusions, so you do not re-report them: Family, Mind, the
book chapters, historical demos, and retired report renderers are outside the
"You" journey by decision, not by oversight.

### 2. Stated invariants that nothing enforces

**Entry:** grep for docblocks that assert a property — "always", "never",
"cannot", "must", "fails closed", "single source of truth" — and check whether
a test holds it.

This is the inverse of area 1 and it is genuinely productive here, because the
codebase comments heavily and some of those comments outlived their test. Two
real precedents: a repair held only by the TypeScript type while the sabotage
driver runs vitest, and an inventory entry that could not detect its own repair.

**Good output:** `claim → file:line → enforcing test, or "none found"`.

### 3. API route hygiene — 106 routes

**Entry:** `app/api/**/route.ts`.

Per route, record: auth posture (`getUser` / `getUserFromRequest` /
`verifyCronRequest` / service-role / none), zod validation at the boundary,
`guardAiUsage` presence if it calls a model, rate limiting, error shape, and
whether it fails open or closed.

**Known findings to confirm rather than rediscover:**
- cron routes fail closed (no `CRON_SECRET` → 503) — verify none regressed;
- `/api/feedback` accepts an `Authorization: Bearer` token via
  `getUserFromRequest` but is **not** in `proxy.ts`'s password-gate allowlist,
  while `/api/twin-state` and `/api/analyse-meal` are. A native client would be
  redirected. Genuine inconsistency, low severity, worth fixing.
- there is **no CORS configuration anywhere**. Correct for a native client
  (CORS is a browser concern) but it would break any browser-origin client,
  including an Expo-web build.

**Good output:** a matrix, plus a ranked list of routes whose posture is
unclear from the code.

### 4. Performance and Core Web Vitals

**Entry:** `npx next build` output.

240 pages, Remotion in the dependency tree, a 2,609-line client component, 2,472
inline styles. Measure before theorising: per-route first-load JS, the heaviest
client components, which routes pull Remotion, whether `live-dashboard.tsx` is
on a critical path.

**Good output:** per-route first-load JS table, the ten worst offenders with the
specific import responsible, and a proposed budget file.

### 5. Accessibility

**Entry:** the 12 Playwright specs in `tests/e2e/`.

Coverage is uneven by design — the specs were built for the audit and for
launch-surface crawling, not for a11y sweep. Find the live surfaces with no a11y
assertions.

**Good output:** a coverage gap list, then the specs to close it, at
**390 / 834 / 1280** — the three widths this project measures at.

### 6. Dead code and dependency surface

**Entry:** 33 runtime + 18 dev dependencies; 315 `lib` modules; 358 components.

Specific things to check:
- `@11labs/react` **and** `@elevenlabs/client` are both present — is that
  deliberate (SDK migration) or residue?
- `remotion` + `@remotion/player` — `DOCUMENTATION_MAP.md` records that
  `MOTION_SYSTEM.md`'s Remotion catalogue "describes components with **no live
  importer**". Confirm and quantify.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is documented as currently unreferenced.
- unreferenced exports across `lib/` — but see the warning below.

**Critical caveat:** several modules are **deliberately uncalled**. A function
with no importer may be a repair (the capability removed on purpose), a
versioned content pack, or a generated artefact. Before proposing a deletion,
check `git log -S` for the symbol and read the surrounding comment. Propose
deletions as a reviewable list; never auto-apply.

### 7. Security posture

**Entry:** `proxy.ts`, `lib/admin-auth.ts`, `lib/supabase.ts` usage sites.

- Service-role client usage: every call site should be server-only and scoped.
  `scripts/check-supabase-scoping.mjs` covers the `getUser()`+`getSupabase()`
  pattern; look for what it does not cover.
- RLS vs route-level gating: the CMS tables and `feedback` are **service-role
  only, RLS on with zero policies**, gated entirely at the route/layout level.
  That is a documented decision — verify the gate is actually airtight, since
  there is no row-level backstop.
- Admin session signing (`ADMIN_SESSION_SECRET`, falling back to
  `ADMIN_PASSWORD`) — confirm it fails closed.
- The password gate: with neither `DEV_PASSWORD` nor
  `EATOBIOTICS_PASSWORD_GATE` set, **the site is public**. Confirm the
  deploy-time expectation is documented where an operator will see it.

### 8. The design-token question

**Entry:** `app/globals.css` (66 custom properties, 733 lines) vs 616 hardcoded
hex values and 2,472 inline styles in components.

This is Experience 5 work and **must not be executed now**. What *is* useful now
is the diagnosis the roadmap explicitly asks for, and which nobody has done:

> Is the token system **insufficient** (missing tokens people needed),
> **inconsistently applied** (tokens exist and were ignored), or **bypassed**
> (the architecture forces inline styles)?

**Good output:** a sampled classification of the 616 hexes and the 2,472 inline
styles into those three buckets with counts, naming the specific missing tokens
if bucket one is large. That turns a measurement into a plan.

## A2 · Anti-goals

A reviewer's instincts run the wrong way in this repository. These are not
suggestions.

| do not | because |
|---|---|
| weaken a failing guard to make a suite pass | that is how a guard becomes decoration; the project has a written rule about it |
| delete long explanatory comments as noise | several encode *why* a repair has its shape; the programme has been bitten by losing that context |
| DRY the three duplicated preview predicates | "a shared helper is a shared switch" — one edit would make three unfinished features reachable |
| re-export `orderedByNeed` or any argmin over per-Biotic scores | its deletion is what makes "construction cannot recreate the ranking" structural rather than asserted |
| "fix" `getProfile` in `lib/assessment-scoring.ts` | known finding, deliberately not repaired: it feeds the free results page, the lifecycle emails and the share card. A refusal boundary keeps its two bad shapes off the paid Report |
| touch the two protected prompt routes | `submit-deep-assessment` and `generate-deep-questions` are in `CLAUDE.md`'s do-not-modify list; their per-Biotic prompt interpolation is a recorded finding for a later tranche |
| build out a `POST_V1_ROUTES` 404 | they are refused on purpose; `0R-8`'s fix is to stop advertising them |
| apply a migration | read-only against production, every time, with no inherited authorisation |
| run Playwright and `git add -A` | you will overwrite Experience 0's frozen before-evidence |
| add a personal per-Biotic value anywhere | you have found the permanent product rule, not an oversight |
| re-prioritise the Experience sequence | the ordering is derived from dependencies and documented; 0R is "the dependency" |
| open a PR | only when explicitly asked |

## A3 · How to report

The project's own convention, which makes findings actionable:

- **One finding, one ID, one file:line.** State reachability explicitly —
  *live* / *latent* / *refused* — because it changes severity entirely.
- **Separate "possible" from "reachable".** Source inspection gives the first;
  a render or a live HTTP check gives the second.
- **Say what you measured and with what command.** A number without a command
  is an opinion.
- **Record corrections rather than editing history.** If a finding turns out to
  be wrong, the correction goes beside it — the register's own practice, and the
  reason the programme can audit itself.

---

# Part B · Nine recommended workflows

Marked **[Cursor]** where Cursor can own the loop outright, and
**[Programme]** where the work must go through the sequenced gate because it
moves a claims rule, a content-pack version, a migration, or an Experience
boundary.

### 1 · Guard-gap sweep · **[Cursor]**

**Trigger:** weekly, and on every PR that adds a file under `app/` or
`components/`.

Derive reachable customer surfaces from `lib/v1-surface.ts`, diff against
`tests/unit/customer-surfaces.ts`'s groups, output the gap list. Fail the check
on a *new* unlisted claim-bearing surface; report existing gaps without failing.

**Why it suits Cursor:** mechanical, high value, zero claims risk, and it
directly attacks the failure mode that produced most of the register.

### 2 · Per-route performance budget · **[Cursor]**

**Trigger:** every PR.

Parse `next build` output into a budget file this workflow creates — suggested
`docs/performance/route-budget.json`, which does not exist yet — and fail when
a route's first-load JS grows beyond a tolerance. Seed the budget from the current
measurement rather than from an aspiration.

**Why:** 240 routes and a heavy dependency tree mean regressions are invisible
without this, and it needs no product judgement.

### 3 · Accessibility expansion · **[Cursor]**

**Trigger:** once to close the gap, then per PR touching a covered surface.

Extend the Playwright suite to the live surfaces with no a11y assertions, at
390 / 834 / 1280. Keep new specs in their own files — do not edit the four
`audit-capture*.spec.ts` files, which maintain the frozen corpus.

**Why:** real user value, no claims surface, and the harness already exists.

### 4 · Dependency and dead-code hygiene · **[Cursor]**, with review

**Trigger:** monthly.

`knip` or `ts-prune`-style census of unreferenced exports, unused dependencies,
and files with no importer. **Output is a proposal, never an auto-fix** — see the
caveat in A1.6 about deliberately uncalled modules.

### 5 · API contract hardening · **[Cursor]**

**Trigger:** one PR per route group, sequenced.

Per route: zod at the boundary, an explicit auth-posture comment, a cap if it
calls a model, a consistent error shape. Add the route's posture to a generated
matrix so drift is visible.

**Why:** 106 routes with heterogeneous posture is the kind of surface that
rewards systematic passes, and none of it touches claims.

### 6 · Visual-regression harness for the redesign gates · **[Cursor]** to build, **[Programme]** to use

**Trigger:** before Experience 5 begins.

Experience 5 will move design tokens across 240 pages. A screenshot baseline is
the prerequisite — and it must be **a new corpus, outside
`docs/experience/audit/`**, because that tree is Experience 0's frozen
before-evidence and is gated against exactly this kind of write. Put it under a
gitignored path with its own manifest, and reuse the shard-and-merge pattern in
`tests/e2e/audit-manifest.ts` rather than inventing a second protocol.

### 7 · Guard scripts as pre-commit hooks · **[Cursor]**

**Trigger:** once.

The three `scripts/check-*.mjs` guards are fast and already authoritative.
Running them in a pre-commit hook shortens the loop from "CI tells you in ten
minutes" to "your editor tells you now". Add `tsc --noEmit` if the machine can
take it.

### 8 · 0R-8 preparation — the 404 inventory · **[Cursor]** to prepare, **[Programme]** to fix

**Trigger:** once, now.

`P1-FUNNEL-01/02` need a complete inventory of refused destinations presented as
available actions. Crawl every in-site link on every crawled surface —
critically including `/assessment/results` and `/account` **in a Twin-present
state**, since covering the route alone misses all five Twin findings — and
output `surface → link text → href → HTTP status`.

**Why this one is safe:** it produces evidence, not repairs, and it touches no
claim. The product fix (stop advertising them, matching the existing
"Coming soon" treatment) is 0R-8's, in sequence.

### 9 · Copy and vocabulary lint · **[Cursor]**

**Trigger:** every PR, as a fast pre-check.

A sub-second lint for the cheap, high-frequency mistakes the full vitest run
catches slowly: retired vocabulary ("Heal" as a tag, capital-R "Regenerate",
Grow/Restore/Transform presented as purchasable), price literals (`49`, `24.99`
outside their two modules), and product-name drift ("Snapshot", "Food System
Score").

**Why:** it front-loads the failures most likely to be introduced by someone
without the vocabulary memorised — which includes every new contributor and
every agent.

---

## B1 · What stays with the programme loop

Not because Cursor cannot do it, but because the sequencing *is* the method:

- anything that moves a rule in `biotic-claims.test.ts`,
  `biotic-visual-encoding.test.ts` or `agent-loop-claims.test.ts`;
- anything that widens `customer-surfaces.ts` (a widening produces a deliberate
  red list, consumed in order);
- `CONTENT_PACK_VERSION` and anything travelling in Report provenance;
- every migration;
- `0R-7`, `0R-8`'s product fix, `0R-9`, and all of Experiences 1–5;
- the four review-blocked content gates (`specificFoods`, `bioticsLanguage`,
  `safetyNetting`, `constraints-known`).

## B2 · The two rules worth adopting wholesale

If Cursor adopts nothing else from this project's practice, adopt these:

> **Measure the red state before claiming it.** Write the assertion, watch it
> fail against the real defect, *then* repair. A test written after the fix
> proves the fix exists; a test watched failing first proves the test works.

> **When a mutation of your code does not break your test, the test is the
> problem.** That is the entire premise of the sabotage harness, and it has
> found more weak tests than weak code.
