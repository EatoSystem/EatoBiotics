# Programme baseline — `claude/v1-integrated-base`

```
fadb9cb815c527a18f0ca8003ca8413712daa9f9
```

Recorded 2026-09-30. **Immutable.** The 9+/10 build programme is developed on
branches cut from this commit, and programme pull requests target
`claude/v1-integrated-base` so their diffs contain only programme work rather
than the inherited V1 stack.

## What it contains

Every commit of the V1 programme, steps 2 through 7B, plus all of Phase 1
claims remediation through Tranche 2B and the holding-page work — 27 commits
ahead of `origin/main` (`a2ad0342`).

**No merge was performed, and none was needed.** The `#275 → #281` stack is
linear: each step branch's head is an ancestor of the next. Verified at
creation — every one of the seven step branches is contained in this commit.

| PR | Branch | Contained |
|---|---|---|
| #275 | `claude/v1-step2-feedback-out-of-scope` | yes |
| #276 | `claude/v1-step3-launch-surface` | yes |
| #277 | `claude/v1-step4-publishing-exports` | yes |
| #278 | `claude/v1-step5-scheduled-automation` | yes |
| #279 | `claude/v1-step6-endpoint-hardening` | yes |
| #280 | `claude/v1-step7-commercial-journey` | yes |
| #281 | `claude/v1-step7b-holding-page` | yes |

**Excluded by scope:** PR #274 (`claude/phase-4b-s3a-canonical-report-pdf`) is
not in this line of history. Its sabotage suite `run_s3a.py` therefore cannot
run here and exits on a missing file — expected, and recorded in
`tools/sabotage/README.md` rather than papered over.

## The gate run on it

| Gate | Result |
|---|---|
| `tsc --noEmit` | clean |
| ESLint | 0 errors (96 warnings, all pre-existing) |
| Unit suite | **5387 passed / 2 skipped**, 210 files |
| `check-supabase-scoping` · `check-ai-guard` · `check-schema-drift` | pass |
| Production build | green |
| Playwright | **158 passed** |
| Sabotage — seven applicable suites | **151/151 caught** |

Sabotage by suite: `v1` 10/10 · `s3` 12/12 · `s4` 8/8 · `s5` 10/10 ·
`s6` 14/14 · `s7` 30/30 · `s7b` 67/67. Working tree byte-identical afterwards.

## What this baseline is not

It is **not** merged to `main`, **not** deployed, and carries **no** production
Supabase write and **no** applied migration. `origin/main` remains `a2ad0342`.
When the V1 stack is deliberately approved and merged, programme branches
rebase onto the resulting `main` head and this record is superseded rather than
edited.
