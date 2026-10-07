# Differential sabotage

**A guard that passes proves nothing on its own.** It may be asserting
something trivially true, matching its own explanatory comment, scanning an
empty file list, or naming test files the runner cannot collect. Every one of
those has happened in this repository, and none of them turned CI red.

This harness answers the only question that matters about a guard: *if the
property it claims to protect were broken, would it fail?*

Each case breaks exactly one property in the source, asserts the mutation
**landed** (by sha256, not by hope), runs the named tests, and requires them to
**fail**. Then it restores the file and verifies the restore is byte-identical.

## The standing rule

> When a case slips, the **TEST** gets stronger — never the case.

The only exception is a case that was aimed at the wrong thing or whose anchor
was legitimately invalidated by a change, and that exception is **said out
loud** in the commit that makes it. A case quietly retargeted to something
easier is worse than no case.

## Running it

```
export PATH=/path/to/node24/bin:$PATH   # the repo pins Node 24 — see .nvmrc
python3 tools/sabotage/run_s7b.py      # one suite
python3 tools/sabotage/run.py 930 995  # a numbered range from cases.py
```

Paths resolve from this directory, so any checkout works.

| Runner | Cases | Subject |
|---|---|---|
| `run_v1.py` | 400–409 | V1 scope step 2 — feedback capture out of the surface |
| `run_s3.py` | 500–511 | Step 3 — the launch surface classifier |
| `run_s4.py` | 600–607 | Step 4 — publishing exports as an admin surface |
| `run_s5.py` | 700–709 | Step 5 — scheduled automation and the retention sweep |
| `run_s6.py` | 800–813 | Step 6 — abuse protection on five endpoints |
| `run_s7.py` | 900–929 | Step 7 — the €49 commercial journey |
| `run_s7b.py` | 930–997 | Step 7B — holding page, claims remediation, AI prompts |
| `run_s3a.py` | — | Phase 4B-S3A. **Inapplicable on this branch** — its targets live on the unmerged PR #274 |
| `run_mobile.py` | 1600–1605 | P0 mobile companion — RN per-Biotic bar must fail |

## Two limits, stated rather than discovered

**1. Rendered geometry cannot be covered here.** The harness mutates
working-tree source; a Playwright run serves a prebuilt `.next` that the
mutation never reaches, so a rendered property reports SLIPPED whatever it
does. Those properties belong in the Playwright suite and in direct viewport
measurement. `collectable()` in `run.py` refuses such a case loudly rather than
letting it look covered.

**2. A non-collectable test file reads as "caught".** `vitest.config.ts`
includes only `tests/**/*.test.ts`. Pointed at a Playwright `.spec.ts`, a
renamed file or a typo, vitest reports "no test files found" and exits
non-zero — which this harness reads as caught. **Case 945 did exactly this for
its entire life**, reporting caught for every mutation and for no mutation:
the precise failure the harness exists to detect, occurring inside the harness
itself. `collectable()` now refuses it.

## Why this is in the repository

It was not. It lived in a session scratchpad for the whole of the V1 programme
— 18 files and every case behind the "sabotage N/N caught" line in a long
series of commit messages — and a container restart would have taken all of it
with no trace but those claims. Rescued here unchanged apart from two hardcoded
container paths, so what is committed is what was actually run.
