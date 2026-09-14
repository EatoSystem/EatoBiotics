---
name: verify-eatobiotics
description: Verify an EatoBiotics change end-to-end — lint, typecheck, tests, and build compared against a dynamically established baseline from unchanged main, plus route-presence and local visual QA for UI changes. Never hardcodes historical warning/test counts as requirements. Reports pre-existing failures instead of repairing them.
---

# verify-eatobiotics

## 1. Name

`verify-eatobiotics`

## 2. Purpose

One consistent, evidence-based quality bar for every change: prove the branch is at least
as healthy as `main` was, that the intended routes exist in the build, and — for anything
with a visual surface — that it actually renders correctly at desktop, tablet, and mobile
widths. Encodes the local-QA environment recipe that is otherwise re-derived from scratch
each session.

## 3. When to invoke

- Before committing any non-trivial change.
- Invoked by `trust-fix` (step: verification) and `concept-page` (step: verification +
  visual QA).
- After merging, on `main`, as post-merge verification.

## 4. When not to invoke

- Docs-only or skill-file-only changes: run the light form (lint + `tsc --noEmit` +
  `git diff --check`) — a full build/test/QA cycle adds nothing.
- To diagnose a *deployment platform* failure — first check whether CI passed on the same
  SHA and whether a clean local build passes; if both are green, the problem is
  platform-side, not something more verification here will reveal (see §11).

## 5. Pre-flight

1. Confirm which files changed (`git status`, `git diff --stat main`).
2. **Establish the current baseline from unchanged, verified `main`** — never from memory:
   ```bash
   git stash --include-untracked   # or use a clean worktree, if changes exist
   npm run lint 2>&1 | grep "problems"   # record: N errors, M warnings
   npx tsc --noEmit                       # record: clean / failing
   npx vitest run 2>&1 | grep -E "Test Files|Tests "   # record test count
   git stash pop
   ```
   If the branch was cut from the `main` you just verified and `main` hasn't moved, a
   recorded baseline from that verification is acceptable — but it must come from a run,
   not from a remembered number.
3. If switching branches since the last build, clear stale build artifacts first:
   `rm -rf .next` (stale `.next/types` from another branch's routes causes phantom
   `tsc` errors — e.g. a leftover validator referencing a route this branch doesn't have).

## 6. Workflow

1. **Lint:** `npm run lint`. Requirement: **zero new errors** and **no unexplained warning
   growth** versus the baseline. A warning added by the change must be fixed or explicitly
   justified; pre-existing warnings are not this change's job.
2. **Typecheck:** `npx tsc --noEmit`. Requirement: clean.
3. **Tests:** `npx vitest run`. Requirement: **all tests pass**, and the count grew by
   exactly the tests the change added (expected growth), or stayed equal for changes
   without new tests. An unexplained *drop* in test count is a failure.
4. **Build:** run the production build. If the environment lacks public env vars, build
   with placeholders so the build is representative:
   ```bash
   env -u SENTRY_DSN -u NEXT_PUBLIC_SENTRY_DSN -u SENTRY_AUTH_TOKEN -u SENTRY_ORG -u SENTRY_PROJECT \
     NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key \
     npm run build
   ```
   Requirement: success, and **every route the change adds/renames present in the build
   output** (grep the route table).
5. **Visual QA — required whenever the change has a rendered surface:**
   ```bash
   EATOBIOTICS_PASSWORD_GATE_DISABLED=true \
   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key \
   PORT=3111 npm run start &
   ```
   Then with Playwright (chromium at `/opt/pw-browsers/chromium` in remote sessions):
   - Viewports 1440×900, 768×1024, 375×812; assert
     `document.documentElement.scrollWidth - clientWidth === 0` (no horizontal overflow).
   - Full-page screenshots need a **progressive scroll first** (step ~450px with short
     waits) — `ScrollReveal` keeps below-fold content at opacity 0 for naive captures.
   - Check: single `h1`, coherent heading order, CTA `href`s, robots meta where relevant.
   - **Actually look at the screenshots.** Overflow numbers don't catch a broken layout.
6. **Report** using §10. Fix only failures the change caused; report everything else.

## 7. Scope rules

- **Single responsibility:** verification only. No claims/safety review (`claims-lint`),
  no workflow policy (`trust-fix`), no concept governance (`concept-page`).
- Never repair pre-existing failures found on `main` inside the calling task — report
  them as their own finding.
- Never "fix" a baseline mismatch by adjusting expectations to whatever the branch
  produces; investigate the delta.

## 8. Verification requirements (the bar)

- Zero new lint errors; no unexplained warning growth.
- `tsc --noEmit` clean.
- All tests passing, with expected growth where tests were added.
- Successful production build.
- Relevant route(s) present in build output where applicable.
- Visual QA at the three widths for rendered surfaces, screenshots reviewed.

Historical counts are **examples only, never requirements** — e.g. in July 2026 the
baseline happened to be 105 warnings / 334 tests. Do not compare against these numbers;
compare against the baseline you just measured.

## 9. Stop conditions

- The baseline itself is red on unchanged `main` → stop, report the pre-existing failure,
  and do not create/continue the feature branch until the caller decides.
- A failure implicates protected areas (Stripe, auth, scoring, migrations — see
  `CLAUDE.md`) that the change was not meant to touch → stop and surface it.

## 10. Output format

```
## Verification — <branch> vs main baseline

| Check | Baseline (main) | Branch | Verdict |
|---|---|---|---|
| lint | E errors / W warnings | E' / W' | pass/fail + delta explanation |
| tsc  | clean | ... | |
| vitest | N tests | N' tests | expected growth: +k |
| build | success | success, routes: [...] | |

Visual QA: <widths, overflow, screenshot findings>  (or: not applicable — no rendered surface)
Pre-existing issues found (not fixed): <list or none>
```

## 11. Common failure modes

- **Hardcoding historical counts** as requirements — the whole reason baselines are
  dynamic.
- **Skipping visual QA for a "small" UI change** — one-line class changes have broken
  mobile layouts.
- **Forgetting the dummy public env vars** — without `NEXT_PUBLIC_SUPABASE_*` at build
  time, a global error boundary replaces *every* page after hydration locally, which then
  gets misdiagnosed as the change's bug. Confirm against `/` before blaming the branch.
- **Stale `.next` after branch switches** → phantom `tsc` errors about routes from another
  branch. `rm -rf .next` first.
- **Misreading platform failures as code failures:** a Vercel deploy that dies in seconds
  with "an unexpected error occurred" while CI `verify` is green on the same SHA and a
  clean local build passes is platform/project-side — retrigger or escalate to the
  dashboard; don't hunt the diff.
- **Naive full-page screenshots** — blank sections that are just un-triggered
  `ScrollReveal`, mistaken for missing content.

## 12. Repository-specific examples

- PR #125 (`/newhome`): the reference visual-QA run — three-width overflow checks,
  progressive-scroll captures, robots-meta assertion, CTA href checks, plus the discovery
  that the local "Something went wrong" hydration failure affected `/` identically (env,
  not code).
- The stale-`.next` case: after building the `/newhome` branch and switching away,
  `tsc` failed with `Cannot find module '../../app/newhome/page.js'` from
  `.next/types/validator.ts` — cleared by `rm -rf .next`, not a code fix.
- PR #126: two Vercel "unexpected error" failures in seconds while CI `verify` passed on
  the same commits and clean local builds succeeded — the platform-vs-code diagnosis in
  §11 in action.
- Route-presence checks: `grep` the build output for `/newhome` (PR #125) and
  `/api/account/pdf-url` (PR #122) confirmed the new surfaces actually shipped in the
  bundle.
