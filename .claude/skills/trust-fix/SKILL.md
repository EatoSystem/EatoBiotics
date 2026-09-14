---
name: trust-fix
description: The one-problem-per-PR workflow for customer-trust fixes (silent failures, dead links, fake data, lost access, misleading states). Confirm the bug on current main first, make the smallest safe fix, test with existing stub patterns, verify via verify-eatobiotics, open a scoped PR with explicit non-goals, and stop before merge. Adjacent bugs become follow-ups, never passengers.
---

# trust-fix

## 1. Name

`trust-fix`

## 2. Purpose

Ship customer-trust fixes the way PRs #120–#124 were shipped: one confirmed problem, the
smallest safe change, focused tests, full verification, a PR that states exactly what it
does and does not do, and a hard stop before merge. The guiding principle:

> No paying customer should fail silently, see fake reports, lose access, or be confused
> about what they bought.

## 3. When to invoke

- Fixing one specific customer-facing defect: a silent failure, dead/stale link, fake or
  misleading data, lost access, incorrect delivery state, or misleading copy about what a
  customer bought or will receive.
- Working an item off an audited trust backlog.

## 4. When not to invoke

- Feature work, refactors, redesigns, or performance work.
- A batch of problems — split into one invocation per problem.
- Concept/preview pages — that is `concept-page`.
- Anything requiring intended changes to the protected areas listed in `CLAUDE.md`'s
  "What NOT to Modify" (one-time checkout routes, auth flow routes, existing table
  columns, the referral system) — escalate for explicit approval first.

## 5. Pre-flight

1. `git checkout main && git fetch origin main` — confirm working tree clean and
   `main == origin/main`; record the checkpoint SHA.
2. **Fresh branch, always** (`claude/<problem-slug>`). Never reuse a branch from a
   previous task; never stack on merged history.
3. **Re-confirm the bug exists on current `main`** with concrete evidence (read the code
   path, grep the exact line, reproduce where feasible) *before writing any fix*. Bugs get
   fixed incidentally by other PRs; a fix without a confirmed bug is noise.
4. Check open PRs for file-level overlap with the fix.

## 6. Workflow

1. **Smallest safe fix.** Change the minimum surface that removes the defect. Prefer
   reusing existing helpers over new ones (e.g. `lib/report-error.ts` for owner alerting,
   `ownerOrFilter` in `lib/supabase-filters.ts` for ownership checks — never invent a
   parallel mechanism).
2. **Focused tests, existing patterns.** Reuse the repo's established stubs:
   - Chainable queue-based Supabase stub: `tests/unit/money-paths.test.ts`.
   - Filter-evaluating ownership stub (actually applies `.eq()`/`.or(ownerOrFilter(...))`
     to seeded rows): `tests/unit/account-pdf-url.test.ts`.
   Do **not** stand up new test infrastructure (e.g. React component rendering) for a
   single assertion — if no suitable pattern exists, document manual QA in the PR instead
   (the PR #123 precedent).
3. **Diff review before commit.** `git diff main` must contain only the fix and its tests.
   Anything else — formatting drift, opportunistic cleanups, a second bug — comes out.
4. **Verify** by invoking `verify-eatobiotics` (dynamic baseline; expected test growth =
   the tests this fix added).
5. If the fix changes customer-facing wording (email copy, empty states, status text),
   invoke `claims-lint` on the changed copy.
6. **PR** using the template in §10. Push with `git push -u origin <branch>`.
7. **Stop.** Do not merge. Merge happens only on explicit instruction, after which:
   pull `main`, re-run verification on the merge, and report.

## 7. Scope rules

- **One problem per PR.** Adjacent bugs discovered mid-fix are recorded in the PR body as
  follow-up candidates — never fixed in the same PR (e.g. PR #123 removed `MOCK_REPORTS`
  and deliberately left `MOCK_MEALS`/`MOCK_CONSULTATIONS` as named follow-ups).
- **Explicit non-goals are mandatory** in the PR body: list the nearby systems the PR
  deliberately does not touch.
- Allowed skill relationships: this skill **invokes `verify-eatobiotics`** for
  verification and **may invoke `claims-lint`** for content-heavy fixes. It does not
  duplicate their checks.

## 8. Verification requirements

Delegated to `verify-eatobiotics` (see that skill). Additionally, for the fix itself:
tests must prove the defect is gone (failing scenario now handled) *and* that the
surrounding behaviour is unchanged (e.g. success path emits no alert; customer response
body identical whether alerting runs or not).

## 9. Stop conditions

- The bug cannot be confirmed on current `main` → report that finding; do not "fix".
- The smallest real fix requires touching protected areas beyond approved scope → stop
  and escalate with the reasoning.
- The fix keeps growing (third file that isn't a test, or a schema change appears) →
  stop; the problem was mis-scoped. Re-plan before continuing.
- Any instruction ambiguity about customer-visible behaviour → ask before shipping.

## 10. Output format

PR body sections, in order: **The problem** (with the customer impact), **Files changed**,
**Behaviour before/after**, **Tests added** (or the manual-QA-only rationale),
**Verification results** (from `verify-eatobiotics`), **Manual QA checklist**,
**Explicit non-goals**, **Follow-up candidates** (adjacent findings, deliberately not
fixed).

Final report to the requester: PR number + link, branch, files changed, tests added,
verification results, manual QA notes, recommended next fix — then stop, before merge.

## 11. Common failure modes

- **Bundling** two small fixes "while I'm here" — the second one always costs the first
  one its reviewability.
- **Fixing an unconfirmed bug** — the code moved since the audit and the "fix" breaks the
  new behaviour.
- **Inventing new mocks/helpers** when `money-paths`-style stubs or `report-error`/
  `ownerOrFilter` already exist. Watch for identifier shadowing when importing into large
  route files — `submit-deep-assessment` already had a local `reportError` string, which
  silently shadowed the imported helper until a test caught it (PR #124: alias the import).
- **Silent scope creep** caught only at diff review — or worse, not caught.
- **Merging without explicit approval**, or reusing a stale branch and dragging old
  history into the PR.

## 12. Repository-specific examples

- PR #120 — paid reports invisible to signed-in buyers: ownership fallback via
  `ownerOrFilter(user.id, user.email)`; the pattern every buyer-owned-resource lookup
  reuses since.
- PR #121 — email falsely claiming a PDF attachment: one template file + a 44-line test;
  copy fix, nothing else.
- PR #122 — expired signed PDF URLs: new `GET /api/account/pdf-url` minting fresh
  short-TTL URLs; storage key derived server-side from the verified row, never from
  client input; 7 tests incl. "no write to `deep_assessments`".
- PR #123 — fake report cards: pure removal + honest empty state; no new test
  infrastructure (documented manual QA); adjacent mock data explicitly deferred.
- PR #124 — silent partial deliveries: one `reportError` call at the single final
  decision point, replacing (not duplicating) the `console.warn`; alert carries session id
  and stage statuses, never answers or customer email.
