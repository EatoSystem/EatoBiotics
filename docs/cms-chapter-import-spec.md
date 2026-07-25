# CMS 25-Chapter Import — Decision Brief & Specification

**Status:** SPECIFICATION ONLY — no implementation, no chapter data touched.
**Author context:** follow-up to PR #133 (CMS Phase 2B Books & Chapters). Main at `cb9acce`.
**Decision owner:** Jason.

---

## 1. Decision brief

### 1.1 The chosen model: MDX stays canonical

| Layer | Source of truth | Never changed by import |
|---|---|---|
| **Publication** (what the public book renders) | Repository MDX — `content/book/chapter-N.mdx` + metadata in `lib/chapters.ts` | ✅ |
| **Public routes** | `app/book-chapter-N/`, `app/book/`, `app/{reedsy,substack,print}/*`, `components/book/**` | ✅ |
| **Editorial planning / metadata / derivatives / media / status / workflow** | CMS (`cms_content` + `cms_chapters`) | — imported, editable as a *plan*, not published |

The CMS becomes a **publication-read-only mirror and editable editorial workspace** — "read-only" describes its relationship to the live MDX publication (it can never publish or alter the public book), not the CMS manuscript field, which remains fully editable as a draft. It never feeds the public book. Any future flow that lets the CMS influence publication is a later, explicit phase (§7), gated on a separate decision.

### 1.2 Why this is the safe near-term step

- The public book is already live and stable; moving canonical ownership into the CMS would turn the import into a **rendering-pipeline migration**, not a content backfill.
- A one-way mirror has a trivial rollback (archive/delete imported rows) and cannot affect a single public URL.
- It delivers immediate CMS value — search, planning, extracts, media association, editorial status — with zero publication risk.

### 1.3 The one rule that prevents the classic failure mode

> **Two permanently editable copies with unclear ownership is the anti-goal.**

Mitigation, baked into the spec:
1. MDX is declared canonical in data (a `divergence_state` the CMS reads), not just in a README.
2. Every imported chapter carries a durable pointer to its canonical MDX file + a content hash.
3. The CMS shows a persistent, non-dismissable notice on every mirrored chapter:
   > **Live publication source: MDX.** This CMS manuscript is an imported editorial snapshot and does **not** update the public chapter automatically.
4. The system **detects divergence** (either side changed since import) and **surfaces it** — it never silently overwrites either side.

---

## 2. Scope

**In scope (v1):** the 25 live EatoBiotics chapters (`content/book/chapter-1.mdx` … `chapter-25.mdx`) and their metadata in `lib/chapters.ts`, imported under **one** CMS book record.

**Explicitly out of scope (v1):**
- The `chapters-family.ts` / `chapters-mind.ts` variant books (future, same mechanism, separate book records).
- Any change to MDX files, `lib/chapters*.ts`, public routes, or `components/book/**`.
- Publishing, export, AI generation, calendar, campaigns, analytics.
- Media *binary* import (images under `/public/images/book/**` are referenced by MDX, not moved into `cms_media` in v1 — see §3.4).

---

## 3. Mapping specification

### 3.1 Source fields (per chapter)

From **`lib/chapters.ts`** (`Chapter` interface): `number`, `slug` (e.g. `"chapter-1"`), `part` (`"I"`…`"VI"`), `partTitle`, `title`, `description`, `status` (`"published" | "coming-soon" | "draft"`), `publishedAt?`, `readingTime?`, `substackUrl?`.
From **`content/book/chapter-N.mdx`**: the raw MDX manuscript body (custom components such as `<ImagePlaceholder>` are preserved verbatim as text — **not** compiled, **not** rewritten).

### 3.2 The parent book record (find-or-create, idempotent)

One `cms_content` (`content_type='book'`) + `cms_books` row represents the EatoBiotics book.

| Target | Value |
|---|---|
| `cms_content.slug` | `eatobiotics-book` (stable idempotency key — find-or-create) |
| `cms_content.title` | `EatoBiotics` |
| `cms_content.content_type` | `book` |
| `cms_content.status` | `draft` (never `published` — the CMS book is a workspace) |
| `cms_books.subtitle` | `The Food System Inside You` — the official approved subtitle (§11.1); mirrors existing canonical publishing metadata, not new copy |

If a book with slug `eatobiotics-book` already exists, reuse it; do not create a second.

### 3.3 Per-chapter mapping (`book_chapter`)

Each chapter → one `cms_content` (`content_type='book_chapter'`) + one `cms_chapters` row.

| Target column | Source | Notes |
|---|---|---|
| `cms_content.title` | `chapter.title` | |
| `cms_content.slug` | `mdx-<chapter.slug>` → `mdx-chapter-1` | Prefixed to avoid ANY collision with existing/library slugs; deterministic (no random suffix) so re-runs are idempotent. |
| `cms_content.content_type` | `'book_chapter'` | |
| `cms_content.summary` | `chapter.description` | |
| `cms_content.body` | MDX file contents | **Imported snapshot**, verbatim. |
| `cms_content.status` | `'draft'` | **Always draft.** The public `status:"published"` is a *publication* fact about MDX, deliberately NOT carried into the CMS editorial status (would falsely imply the CMS row is published). Publication state is recorded in the mirror table instead (§3.5). |
| `cms_content.book_id` | parent `cms_books.id` | denormalized, matches Migration 39 pattern |
| `cms_chapters.book_id` | parent `cms_books.id` | |
| `cms_chapters.content_id` | the chapter's `cms_content.id` | |
| `cms_chapters.chapter_number` | `chapter.number` | 1–25, unique per book (enforced by PR #133 active-uniqueness) |
| `cms_chapters.part` | `chapter.part` | |
| `cms_chapters.part_title` | `chapter.partTitle` | |
| `cms_chapters.publication_target` | `['website']` (+ `'substack'` iff `substackUrl` present) | Metadata only. |

### 3.4 Media (v1: reference, not move)

MDX bodies reference images by path (`/images/book/chN/hero.svg`). v1 preserves those references inside the snapshot body **unchanged**. It does **not** create `cms_media` rows or move binaries. Associating chapter media in `cms_content_media` is a later enhancement once someone decides which assets should live in the CMS library.

### 3.5 New tracking table (proposed Migration 41 — applied only when import is greenlit)

A dedicated table keeps `cms_chapters` clean and holds everything the mirror needs. **Not applied by this spec.** Approved in principle (§11.5) with the refinements folded into the shape below.

```sql
-- Migration 41 (PROPOSED — do not apply until import is approved)
CREATE TABLE IF NOT EXISTS cms_chapter_mirror (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id        uuid NOT NULL UNIQUE REFERENCES cms_chapters(id) ON DELETE CASCADE,  -- one-to-one with the chapter
  book_id           uuid NOT NULL REFERENCES cms_books(id) ON DELETE CASCADE,
  source_kind       text NOT NULL DEFAULT 'mdx' CHECK (source_kind = 'mdx'),  -- v1: MDX only (widen in a later migration when another source lands)
  source_path       text NOT NULL,                        -- 'content/book/chapter-1.mdx' (canonical pointer)
  source_slug       text NOT NULL,                        -- 'chapter-1'
  source_sha256     text NOT NULL,                        -- hash of MDX bytes at import
  body_sha256       text NOT NULL,                        -- hash of the snapshot written to cms_content.body
  meta_sha256       text NOT NULL,                        -- hash of the mapped lib/chapters.ts fields
  source_published  boolean NOT NULL DEFAULT false,       -- canonical MDX publication state (chapter.status === 'published'); the CMS row stays 'draft'
  import_batch_id   uuid NOT NULL,                        -- identifies the actual APPLY batch that created this row (never a dry run); scopes rollback
  imported_at       timestamptz NOT NULL DEFAULT now(),
  last_checked_at   timestamptz,
  divergence_state  text NOT NULL DEFAULT 'in_sync'        -- stays TRUTHFUL about MDX↔CMS; never overloaded for rollback
    CHECK (divergence_state IN ('in_sync','source_changed','cms_changed','both_changed','missing_source')),
  rolled_back_at    timestamptz,                          -- set by a SOFT rollback (content archived, mirror retained)
  rollback_batch_id uuid,                                 -- the rollback that soft-retired this mirror
  UNIQUE (source_kind, source_path)                        -- one mirror row per canonical source file
);
ALTER TABLE cms_chapter_mirror ENABLE ROW LEVEL SECURITY;  -- zero policies (service-role only, like all cms_*)

-- Import-batch provenance so rollback can safely decide the book's fate. Kept
-- as a PERMANENT audit record independent of the book's own lifecycle:
-- book_id / book_content_id are nullable with ON DELETE SET NULL (not
-- CASCADE), so a hard rollback that deletes a batch-created book clears the
-- reference but never removes this row — preserving both the batch's
-- auditability and its batch_id's permanent reservation against reuse.
CREATE TABLE IF NOT EXISTS cms_import_batch (
  batch_id        uuid PRIMARY KEY,
  book_id         uuid REFERENCES cms_books(id) ON DELETE SET NULL,
  book_content_id uuid REFERENCES cms_content(id) ON DELETE SET NULL,
  book_created    boolean NOT NULL,                       -- true iff THIS batch created the book
  created_count   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  rolled_back_at  timestamptz,
  rollback_hard   boolean
);
ALTER TABLE cms_import_batch ENABLE ROW LEVEL SECURITY;  -- zero policies (service-role only)
```

Refinements applied (§11.5):
- **`source_kind` constrained to `'mdx'`** for v1 via a `CHECK` (not just a default), so no non-MDX rows can be written before that path is designed.
- **Uniqueness is `UNIQUE(source_kind, source_path)`** — a canonical source file maps to exactly one mirror row regardless of book, which is stronger than the earlier per-book key and prevents the same MDX file being mirrored twice.
- **`import_batch_id` is only ever a real APPLY batch id.** Dry runs do **not** allocate or persist a batch id and write no mirror rows (see §4/§5); the column therefore always points at an actual import.
- **Soft-rollback state is separate from divergence.** `rolled_back_at` / `rollback_batch_id` carry rollback provenance; `divergence_state` is never repurposed as `missing_source` to mean "rolled back".
- **Book-rollback safety needs provenance.** `cms_import_batch.book_created` records whether an apply created vs. reused the book, so `cms_rollback_import_batch()` can only ever affect a book this batch created (§8).
- **Retained unchanged:** the one-to-one `chapter_id UNIQUE` FK, the three hashes, the five divergence states, `imported_at`/`last_checked_at` timestamps, `ON DELETE CASCADE` from both parents, and zero-policy RLS matching every other `cms_*` table.

Rationale for a table over columns on `cms_chapters`: the mirror is a *relationship to an external artifact* with its own lifecycle (hashes, batches, divergence), and a `chapter_id UNIQUE` FK keeps it one-to-one without widening the core row.

### 3.6 `cms_import_chapters` is the final integrity boundary, not the route (review round 4)

The route's dry-run plan (§4.1) is read-only and produces the human-readable approval artefact — it is **never trusted** as the final integrity check. There is a real time-of-check/time-of-use gap between that read and the `apply` call (another admin action, a manual chapter create, a second `apply`) during which the state the plan was computed from can go stale — e.g. a manual chapter could claim an incoming chapter number between the dry run and the apply, since active chapter-number uniqueness is deliberately application-level (§3.5), not a DB constraint.

`cms_import_chapters(payload)` therefore **re-validates every invariant itself**, under row locks, inside its own single transaction, immediately before any insert:

- the reused book still exists, is still `content_type='book'`, is not archived, and its slug still matches the expected canonical book slug (locked `FOR UPDATE`);
- for a newly-created book, its slug is still free;
- every incoming `mdx-chapter-N` slug is still free;
- every incoming `source_path` has no existing mirror row of **any** kind — active, retained, or soft-rolled-back all occupy the same `UNIQUE(source_kind, source_path)` slot and block equally;
- every incoming `chapter_number` is still free among **active** (non-archived) chapters of the target book (locked `FOR UPDATE`) — this is the specific race described above;
- the payload's chapter numbers, slugs, source paths, and source slugs are each internally unique;
- every payload chapter's `chapter_number`/`source_slug`/`slug`/`source_path` relate to each other exactly as the canonical naming convention requires (`chapter-N` / `mdx-chapter-N` / `content/book/chapter-N.mdx`) — a malformed or tampered payload is rejected;
- the `batch_id` has not already been used (locked `FOR UPDATE` against `cms_import_batch`).

All validation runs in a full pass **before** any insert, and any `RAISE EXCEPTION` — with no exception handler in the function — aborts the **entire transaction**: Postgres guarantees zero partial `cms_content` / `cms_chapters` / `cms_chapter_mirror` / `cms_books` / `cms_import_batch` rows on any failure. Locks acquired on the book/chapter/content/mirror/batch rows are held until the transaction ends, so the target book cannot change out from under the call once validation begins. A genuinely simultaneous "create the same book twice" race that has nothing to lock beforehand is still caught atomically by `cms_content.slug`'s `UNIQUE` constraint, which raises its own exception and rolls back the loser's entire call the same way.

**Filesystem boundary:** the RPC has no access to MDX files or `lib/chapters.ts` — it can only re-verify *database* state. Confirming the canonical source *set itself* is complete (no missing/unreadable files, no duplicate/missing numbers) remains the route's job via `validateCanonicalSources`, run immediately before every `apply` call (§4).

The route surfaces an RPC rejection as `409 { race_detected: true }` (distinct from the `503` used for genuine database-unavailable/migration-required failures) — the caller should re-run `dry_run` and retry, since state has changed.

---

## 4. Import operation contract

The import is an **admin-gated, service-role operation** (a script or a `requireCmsAdmin` route — implementation detail), obeying:

- **Read-only on the filesystem.** It reads MDX + `lib/chapters.ts`; it never writes them.
- **No public-route awareness.** It touches only `cms_*` tables.
- **Dry-run first, always.** `mode='dry_run'` computes and returns the full plan, writes **no rows**, and **allocates no `import_batch_id`** (a batch id identifies an actual import only). At most it may emit a single optional audit "dry_run_previewed" line.
- **Idempotent.** Re-running `apply` after a successful import produces `SKIP` (no-op) for unchanged chapters, never duplicates.
- **Batch-scoped.** Every *apply* run mints one `import_batch_id`, stamped on every created row's mirror record and audit entry, so a real import can be identified and rolled back as a unit. Dry runs never mint one (§3.5).
- **Fail-closed on every DB read.** Every book / chapter / mirror / slug-owner / divergence read and update inspects its error. A failed state query is **never** interpreted as an empty result — it aborts the request with a `503`. If the Migration 41 schema is absent (`undefined_table` / `42P01`), every mode returns a clear **migration-required** `503` instead of a misleading plan.
- **Complete-source gate.** Before any plan is trusted, the canonical source set is validated: no MDX file may be missing/unreadable, the metadata count must be exactly 25, chapter numbers and slugs must be unique, and the full `1–25` set must be present. Any failure makes `dry_run` report `BLOCKED` and makes `apply` **refuse before allocating a batch id or calling the RPC** — a missing file can never silently shrink the plan.
- **Atomic apply.** The approved CREATE set is written in ONE transaction (`cms_import_chapters`), so a partial import can never commit.

### 4.1 Per-chapter action resolution

For each of the 25 chapters, resolve exactly one action:

| Action | Condition |
|---|---|
| `CREATE` | No `cms_chapter_mirror` row for `(source_kind='mdx', source_path)` **and** no active `cms_chapters` row already holding `chapter_number` in this book. |
| `SKIP` | Mirror row exists, is not soft-rolled-back, and `source_sha256` + `meta_sha256` match current file/metadata (nothing changed). |
| `UPDATE_AVAILABLE` | Mirror row exists but source hashes differ → **reported only**; `apply` does **not** auto-overwrite a CMS body (see §6). Requires explicit human review/reconciliation — **blocks ordinary apply** (see the verdict rule below; this is a review-round-3 correction from the original "report-only" wording, which under-specified how the overall verdict treats it). |
| `CONFLICT` | `chapter_number` is already taken by an active, **non-mirror** chapter (someone hand-created it); a slug collision on `mdx-chapter-N` maps to a different content id; or the mirror row was **soft-rolled-back** (its retained provenance blocks a silent re-create — hard-roll-back first). **Aborts apply**; listed in dry-run. |

### 4.2 The verdict rule — one authoritative verdict (review round 3)

The overall verdict is **not** simply "any CREATE = READY." It is computed once, from the action counts, and that **same** verdict is used everywhere (the JSON response, the rendered plan text, and the apply gate) — the JSON and the human-readable dry-run text can never disagree, because both derive from one function:

- **`BLOCKED`** — any `CONFLICT`, **or** any `UPDATE_AVAILABLE`, **or** the canonical source set itself failed validation (§4, complete-source gate). An `UPDATE_AVAILABLE` item means MDX or metadata changed since import and needs a human decision — reporting "ready" or silently importing only the `CREATE` subset while masking a pending update would be misleading and is explicitly disallowed.
- **`READY`** — one or more `CREATE`, with **zero** `CONFLICT` and **zero** `UPDATE_AVAILABLE`.
- **`NOOP`** — every chapter is `SKIP` (mirror genuinely, fully in sync) — this is the *only* condition for `NOOP`.

A source-validation failure (a missing/unreadable MDX file, wrong metadata count, duplicate numbers/slugs, or an incomplete `1–25` set) always overrides the plan's own verdict to `BLOCKED`, regardless of what the per-chapter actions would otherwise say — the rendered dry-run plan text lists the specific source problems under a `Source validation:` heading so the blocking reason is visible in the same artefact a human approves.

---

## 5. Dry-run output (required shape)

`mode='dry_run'` returns a deterministic plan. Example (abridged):

```
IMPORT PLAN — book "EatoBiotics" (slug: eatobiotics-book)  [DRY RUN]
Book record:            FIND-OR-CREATE  (found: no → will CREATE)
Source files scanned:   25 / 25 present   (missing: none)
lib/chapters.ts entries: 25

 #   slug         action    reason
 1   chapter-1    CREATE    new mirror; number 1 free
 2   chapter-2    CREATE    new mirror; number 2 free
 …
 17  chapter-17   CONFLICT  number 17 held by active non-mirror chapter <uuid>  ⛔ blocks apply
 …
 25  chapter-25   CREATE    new mirror; number 25 free

Summary:  CREATE 24   SKIP 0   UPDATE_AVAILABLE 0   CONFLICT 1
Result:   ⛔ APPLY BLOCKED — resolve 1 conflict first.  No rows written.
```

A source-validation failure renders with the same BLOCKED verdict, plus the specific problems:

```
IMPORT PLAN — book "EatoBiotics" (slug: eatobiotics-book)  [DRY RUN]
Source files scanned:   24 / 25 present

Source validation:
- canonical source unreadable: content/book/chapter-7.mdx (file not found)
- missing expected chapter numbers: 7

Summary:  CREATE 24   SKIP 0   UPDATE_AVAILABLE 0   CONFLICT 0
Result:   BLOCKED — canonical source set is incomplete.  No rows written.
```

On a clean second run after a successful import (true NOOP — every chapter SKIP):

```
Summary:  CREATE 0   SKIP 25   UPDATE_AVAILABLE 0   CONFLICT 0
Result:   ✅ Nothing to do — CMS mirror is in sync with MDX.
```

A plan with pending updates and no creates is **not** a NOOP — it renders BLOCKED:

```
Summary:  CREATE 0   SKIP 0   UPDATE_AVAILABLE 25   CONFLICT 0
Result:   BLOCKED — 25 chapter(s) require explicit review (UPDATE_AVAILABLE — MDX or
          metadata changed since import) before apply.  No rows written.
```

Requirements: totals per action; per-chapter reason; explicit "no rows written" for dry-run; a single machine-checkable overall verdict (`READY` / `BLOCKED` / `NOOP`) that the JSON response and the rendered text always agree on (§4.2).

---

## 6. Divergence detection (never silently overwrite)

Divergence is computed by comparing stored hashes against freshly recomputed ones. A separate, read-only **`check`** operation (no writes except `last_checked_at` / `divergence_state`) classifies each mirrored chapter. **The canonical source side of the comparison is `source_sha256` OR `meta_sha256`** — a metadata-only change (title, description, part, part_title, `source_published`, `publication_target` in `lib/chapters.ts`) is just as much "the source changed" as an MDX body edit, and must never be silently reported `in_sync`:

```
sourceChanged = currentSourceSha !== storedSourceSha || currentMetaSha !== storedMetaSha
cmsChanged    = currentBodySha   !== storedBodySha
```

| `divergence_state` | Meaning | Action taken |
|---|---|---|
| `in_sync` | MDX body **and** metadata unchanged, CMS body unchanged | none |
| `source_changed` | MDX body **or** metadata changed since import; CMS body untouched | **report**; offer explicit "refresh snapshot from MDX" (operator-initiated) |
| `cms_changed` | CMS body edited since import; MDX body and metadata both untouched | **report**; this is expected editorial work — never overwritten by import |
| `both_changed` | MDX body or metadata changed, **and** the CMS body also changed | **report loudly**; requires human reconciliation, no automated merge |
| `missing_source` | MDX file (or its `lib/chapters.ts` entry) no longer exists at `source_path` | **report**; mirror retained, flagged |

Rules:
- The import's `apply` mode **only creates**. It will not mutate an existing `cms_content.body`. Refreshing a snapshot from a changed MDX source is a **separate, explicit, operator-confirmed** action, logged distinctly.
- CMS-side edits are first-class (that's the workspace value) and are **never** clobbered by a re-import.
- The public book is never read for divergence *as a target* — MDX is the only publication source; divergence is purely informational for editors.

---

## 7. Phased evolution (context — not part of v1 build)

1. **Mirror phase (this spec).** MDX canonical, CMS imported read-only, divergence surfaced.
2. **Editorial phase.** Edits prepared in CMS; require explicit export/review to matter. No automatic path to MDX.
3. **Controlled publishing phase.** CMS can *propose* an MDX change / open a PR — human-reviewed, never direct-to-live.
4. **Canonical migration decision.** Only after the CMS has proven reliable in real use; separate brief.

Each transition is its own decision with its own spec. v1 must not pre-build for later phases in ways that create the "two canonical copies" hazard.

---

## 8. Rollback

Because `apply` only **adds** rows and stamps them with `import_batch_id`:

Batch provenance is recorded at apply time in **`cms_import_batch`** (`batch_id`, `book_id`, `book_content_id`, `book_created`, `created_count`), so rollback can act safely without guessing.

- **Scoped rollback:** given an `import_batch_id`, roll back every row created by that batch in one of two explicit modes:
  - **Soft rollback (default):** archives the imported `cms_content` records (sets chapter `status='archived'`) and **retains their `cms_chapter_mirror` rows** for audit and provenance, marked with dedicated columns **`rolled_back_at` + `rollback_batch_id`**. It **does not** touch `divergence_state` — that stays truthful about the MDX↔CMS relationship (a soft rollback is *not* a missing source, so `missing_source` is never overloaded for this). The one-to-one `chapter_id` FK is never nulled — the mirror is kept intact, not detached.
  - **Hard rollback (for a failed/test batch):** deletes the imported `cms_content` rows; `ON DELETE CASCADE` then removes the dependent `cms_chapters` and `cms_chapter_mirror` rows automatically.
- **Book record (safe):** the book is archived (soft) / deleted (hard) **only when `cms_import_batch.book_created` is true for this batch** and no qualifying chapters remain (soft: no non-archived chapters; hard: no chapters at all). A **reused manual book is never modified** by rollback. This decision is the pure `resolveRollbackBookAction()` helper, mirrored exactly by `cms_rollback_import_batch()`.
- **Re-import after a soft rollback:** a soft-rolled-back mirror row is retained (provenance) but is **excluded from ordinary active matching** — the resolver classifies its source as `CONFLICT` (never a silent `SKIP` or silent re-create over the occupied `UNIQUE(source_kind, source_path)` slot). A deliberate re-import must first **hard-roll-back** to clear the retained mirror.
- **Reversibility guarantee:** since MDX/routes are never touched, a full rollback returns the system to its exact pre-import state. The public book is unaffected at every step.
- Every rollback writes its own audit entry (§9).

---

## 9. Audit records

Uses the existing append-only `cms_audit_log` (Migration 37) + a new action value.

- Add `CmsAuditAction`: `chapter_imported` (and reuse `content_created`, `content_archived`).
- Per created chapter: `chapter_imported`, entity `cms_content`, metadata `{ batch_id, source_path, source_sha256, chapter_number }`.
- Per batch: one summary line — `{ batch_id, mode, created, skipped, conflicts, book_id }`.
- Dry-run: optional single `{ mode:'dry_run', verdict, preview_id? }` line (no per-chapter spam). A dry run allocates **no** `import_batch_id` — `preview_id` is a non-persisted, in-memory identifier only, never implying a real import batch exists.
- Rollback: `content_archived` per row + a batch summary `{ batch_id, action:'rollback' }`.

---

## 10. Acceptance criteria

The import is accepted when **all** hold:

1. **Dry-run parity.** `dry_run` on a clean DB reports `CREATE 25, CONFLICT 0`, writes zero rows; verdict `READY`.
2. **Apply correctness.** `apply` **creates or reuses exactly one** EatoBiotics book record (find-or-create on slug `eatobiotics-book`) and creates exactly 25 `cms_content` + 25 `cms_chapters` + 25 `cms_chapter_mirror` rows, with the §3 mapping, all chapters `status='draft'`, `chapter_number` 1–25 unique.
3. **Idempotency.** A second `apply` reports `SKIP 25`, writes zero rows, creates no duplicates.
4. **No source mutation.** `git status` shows no change to `content/book/**`, `lib/chapters*.ts`, `app/book*`, `components/book/**` after apply. (CI/test asserts these paths are untouched.)
5. **Public book unaffected.** All 25 `app/book-chapter-N` routes render identically before/after (build + spot render).
6. **Labeling.** Every imported chapter surfaces the "Live publication source: MDX" notice in `/cms`; none is or can become `published` via import.
7. **Divergence works.** Editing one MDX file → `check` reports `source_changed` for exactly that chapter; editing one CMS body → `cms_changed`; no auto-overwrite in either case.
8. **Rollback works.** Rolling back the batch returns row counts to pre-import and leaves MDX/routes untouched; audit reflects it.
9. **Security.** Import/check/rollback are `requireCmsAdmin`/service-role only; fail-closed (no admin → 404), matching every other `cms_*` route.
10. **Gates green.** `npm run lint` (0 errors), `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass; new unit tests cover mapping, action resolution, hash/divergence logic, and idempotency.
11. **Non-empty production safety.** The dry run actively inspects existing CMS books, chapters, and slugs — it **never assumes the CMS database is empty** — and writes no rows. Specifically it:
    - reuses the existing book **only** when `cms_content.slug = 'eatobiotics-book'`;
    - treats differently-slugged manual books as separate records, not implicit matches;
    - evaluates chapter-number conflicts **within the target book only**;
    - detects `mdx-chapter-N` slug collisions **globally** and classifies mismatched ownership as `CONFLICT`;
    - reports all reuse, non-conflicting existing records, and blocking conflicts explicitly.

    Test fixtures assert at least: (1) existing target book, no chapters → reuse book, `CREATE 25`; (2) unrelated manual book with chapters 1–3 → no target-book conflict; (3) existing target book with active manual chapters 1–3 → `CONFLICT 3`, apply blocked; (4) archived manual chapters 1–3 in the target book → numbers free, no active conflict; (5) global `mdx-chapter-1` owned by unrelated content → conflict; (6) existing valid mirror rows → correct `SKIP` / `UPDATE_AVAILABLE`; (7) mixed production state → deterministic full plan, no partial assumptions.
12. **Fail-closed reads.** Every book/chapter/mirror/slug-owner/divergence read and update inspects its error; a failed query aborts with `503` and is never treated as an empty result. If Migration 41's schema is absent (`42P01`), every mode returns an explicit `migration_required: true` `503` instead of proceeding on a false "empty database" plan.
13. **One authoritative verdict (§4.2).** The JSON `verdict`, the rendered `planText`, and the `apply` gate always agree, because all three derive from the same `resolveFinalVerdict(plan, sourceProblems)` computation. Specifically: (a) a missing/unreadable MDX file, or any other source-validation failure, makes **both** the JSON verdict and the plan text say `BLOCKED`, with the specific problems listed under `Source validation:` in the text; (b) a plan containing any `UPDATE_AVAILABLE` is `BLOCKED` (never `READY` or `NOOP`) and `apply` refuses it, even when `CREATE` items are also present — no partial import proceeds while updates are pending; (c) `NOOP` is reported **only** when every chapter is `SKIP`.
14. **The RPC — not the route — is the final integrity boundary (§3.6).** `cms_import_chapters` re-validates, under locks inside its own transaction, that: the reused book still exists/is a book/is not archived/has the expected slug; a newly-created book's slug is still free; every incoming `mdx-chapter-N` slug is still free; every incoming `source_path` has no mirror row of any kind (active, retained, or soft-rolled-back); every incoming `chapter_number` is still free among active target-book chapters; the payload's numbers/slugs/paths/source-slugs are each internally unique and mutually consistent (`chapter-N`/`mdx-chapter-N`/`content/book/chapter-N.mdx`); and the `batch_id` has not already been used. Any failure raises an exception with **zero partial rows** committed (no exception handler; the whole transaction rolls back). A state change that occurred *after* the dry run but *before* apply (e.g. a manual chapter claiming a number) is caught and rejected — the route surfaces this as `409 { race_detected: true }`, distinct from a `503` infrastructure failure.
15. **Metadata is part of divergence (§6).** `check` compares `meta_sha256` in addition to `source_sha256` and `body_sha256`. A metadata-only canonical change (title, description, part, part_title, `source_published`, `publication_target`) classifies as `source_changed`; combined with a CMS body edit, `both_changed`. It is never silently reported `in_sync`.
16. **Batch provenance survives hard rollback (§3.5).** `cms_import_batch.book_id`/`book_content_id` use `ON DELETE SET NULL`, not `CASCADE`. A hard rollback that deletes a batch-created book (found via a local PostgreSQL verification exercise — see the corrective PR) clears those two columns to `NULL` but never deletes the `cms_import_batch` row itself: `batch_id`, `book_created`, `created_count`, `created_at`, `rolled_back_at`, and `rollback_hard` all survive permanently, so (a) the batch stays auditable and (b) its `batch_id` remains permanently reserved against reuse. A reused (not batch-created) book's references are never touched by any rollback, soft or hard.

---

## 11. Decisions (resolved) — ready for implementation review

All prior open questions are resolved as follows. These decisions are now the binding contract for the v1 build; they are reflected in §3–§10 above.

1. **Book subtitle — RESOLVED.** Set `cms_books.subtitle = "The Food System Inside You"` in v1. This is the official approved subtitle, so the import mirrors existing canonical publishing metadata rather than inventing copy. (See §3.2.)
2. **Future non-published MDX chapters — RESOLVED.** Include them in the mirror import. Always create the CMS record as `status='draft'`; record the canonical MDX publication state separately via `source_published` (`false` for non-published). The CMS editorial status never asserts publication. (See §3.3, §3.5.)
3. **Snapshot granularity — RESOLVED.** Store the **raw MDX file verbatim** in `cms_content.body`. A plain/search-text projection may be derived later but must **not** replace the exact canonical snapshot. (See §3.3.)
4. **Media — RESOLVED.** v1 preserves image/media references inside the MDX body and does **not** create `cms_media` or `cms_content_media` rows. (See §3.4.)
5. **Migration 41 — APPROVED IN PRINCIPLE** with these refinements, now folded into §3.5:
   - `source_kind` **constrained** to `'mdx'` for v1 (a `CHECK`, not just a default).
   - Uniqueness is **`UNIQUE(source_kind, source_path)`**.
   - `import_batch_id` applies **only to actual import batches, never dry runs**.
   - Retain the one-to-one `chapter_id` FK, the hashes, the divergence states, the timestamps, the cascade behaviour, and zero-policy RLS.

**Remaining gate before implementation:** review and approval of this specification as a whole (this PR). No import code is written and Migration 41 is not applied until that approval lands.

---

*This document is a specification only. No migration was applied, no chapter data was created, and no repository content was modified in producing it.*
