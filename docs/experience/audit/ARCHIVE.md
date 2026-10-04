# Experience 0 — the artifact close

The audit's visual evidence, accounted for at the freeze.

---

## 1 · What exists

| | |
|---|---|
| manifest rows | **234** |
| surfaces | 4 — `account` 120 · `my-food-system` 78 · `assessment` 24 · `reports` 12 |
| committed citations | **101** (`screenshots/`, in Git) |
| archive-only | **133** (`corpus/`, gitignored) |
| PNG files on disk | **335** — more than 234 because the account surface's 120 rows exist in both `corpus/` and `screenshots/`, per the pre-protocol exception recorded in `audit-capture.spec.ts` |
| `corpus/` | 75 MB, gitignored |
| `screenshots/` | 42 MB, committed |

The identity the protocol exists to guarantee —
**expected captures = actual captures = hashed artifact entries** — is asserted
by `tests/unit/audit-manifest.test.ts`, per surface, and every committed image is
verified to exist on disk with a matching SHA-256.

---

## 2 · The archive

Built at the head it names. The corpus content is fixed from `ce828ca`; the
documents written afterwards are not part of it.

| | |
|---|---|
| filename | `eatobiotics-experience-audit-corpus-e7f9600.tar.gz` |
| built from | `e7f9600` |
| size | **115,812,264 bytes** (110.4 MiB) |
| SHA-256 | `74e7d23fe3009d42ce203eda54d78ac41823a849a1ccbd962b35182662172a88` |
| entries | 349 — 335 PNGs, plus `manifest.json`, `SCREENSHOT_INDEX.md` and directories |
| contents | `corpus/` · `screenshots/` · `manifest.json` · `SCREENSHOT_INDEX.md` |

Rebuild and verify:

```bash
tar -czf eatobiotics-experience-audit-corpus-<head>.tar.gz \
  -C docs/experience/audit corpus screenshots manifest.json SCREENSHOT_INDEX.md
sha256sum eatobiotics-experience-audit-corpus-<head>.tar.gz
```

**The tarball is pushed nowhere.** That was decided at step 4 and has not
changed: record the name, size and checksum in the repository, and invent no
destination.

---

## 3 · Durable remote location: **UNRESOLVED**

Stated plainly rather than dressed up.

The container this audit ran in is **ephemeral**. The tarball described above
exists in a session scratchpad and **does not survive the session**. No durable
remote location has been chosen, and none was invented to make this document look
finished.

### Why that is acceptable rather than a loss

Three things, in order of how much weight they carry:

1. **The 101 committed citations are in Git.** Every finding in the register
   points at an image that is in the repository, at a path, with a SHA-256 in the
   manifest. The evidence a reader needs to check a finding is already durable.
2. **The corpus is regenerable.** `NOTE-CAPTURE-01` measured this rather than
   assuming it: frozen clock, seeded storage, fixed viewports, pinned Chromium.
   Re-running the four capture specs at a known head reproduces it, with the
   residual instability measured and closed — 13 of 105 images differing by a
   34×34 pixel region, 0.038% of bytes, diagnosed as the 390 tab strip's resting
   scroll position and **no difference in visual content**.
3. **The manifest is the evidence, not the images.** Each row carries route,
   state, section, viewport, frozen clock, evidence kind, component, findings,
   console-error count and hash. A row whose image is gone still records what was
   captured and proves what it hashed to.

### What would resolve it

A decision, not a workaround. Any of: a release asset on the repository, an
object-store bucket the organisation already owns, or an orphan branch — the
option considered at step 3 and **superseded at step 4**, because the objects
would still live in the repository's object store and a full clone would grow.

> A fictional completion state would be worse than an honest unresolved one.
> **This line stays until somebody chooses.**

---

## 4 · Reproduction

| surface | spec |
|---|---|
| `account` | `tests/e2e/audit-capture.spec.ts` |
| `my-food-system` | `tests/e2e/audit-capture-fss.spec.ts` |
| `assessment` | `tests/e2e/audit-capture-assessment.spec.ts` |
| `reports` | `tests/e2e/audit-capture-reports.spec.ts` |

On Node 24.21.0, with `PLAYWRIGHT_CHROMIUM_PATH` set and `next build` run first.
The frozen instant is `2026-10-03T09:00:00.000Z` throughout, so captures from
different steps are comparable.

Every write the capture flows would otherwise perform is **aborted at the
browser**, so the harness cannot write anywhere it runs — engineered rather than
observed, for the reason `NOTE-FIXTURE-01` records.
