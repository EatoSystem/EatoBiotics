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

The CMS becomes a **read-only mirror plus an editorial workspace**. It never feeds the public book. Any future flow that lets the CMS influence publication is a later, explicit phase (§7), gated on a separate decision.

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
| `cms_books.subtitle` | (optional, from a chosen source or left null) |

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

A dedicated table keeps `cms_chapters` clean and holds everything the mirror needs. **Not applied by this spec.**

```sql
-- Migration 41 (PROPOSED — do not apply until import is approved)
CREATE TABLE IF NOT EXISTS cms_chapter_mirror (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id        uuid NOT NULL UNIQUE REFERENCES cms_chapters(id) ON DELETE CASCADE,
  book_id           uuid NOT NULL REFERENCES cms_books(id) ON DELETE CASCADE,
  source_kind       text NOT NULL DEFAULT 'mdx',          -- future-proof for other sources
  source_path       text NOT NULL,                        -- 'content/book/chapter-1.mdx' (canonical pointer)
  source_slug       text NOT NULL,                        -- 'chapter-1'
  source_sha256     text NOT NULL,                        -- hash of MDX bytes at import
  body_sha256       text NOT NULL,                        -- hash of the snapshot written to cms_content.body
  meta_sha256       text NOT NULL,                        -- hash of the mapped lib/chapters.ts fields
  source_published  boolean NOT NULL DEFAULT false,       -- carries chapter.status === 'published'
  import_batch_id   uuid NOT NULL,                        -- scopes dry-run vs. real, and rollback
  imported_at       timestamptz NOT NULL DEFAULT now(),
  last_checked_at   timestamptz,
  divergence_state  text NOT NULL DEFAULT 'in_sync'
    CHECK (divergence_state IN ('in_sync','source_changed','cms_changed','both_changed','missing_source')),
  UNIQUE (book_id, source_path)                            -- one mirror row per canonical file per book
);
ALTER TABLE cms_chapter_mirror ENABLE ROW LEVEL SECURITY;  -- zero policies (service-role only, like all cms_*)
```

Rationale for a table over columns on `cms_chapters`: the mirror is a *relationship to an external artifact* with its own lifecycle (hashes, batches, divergence), and a `chapter_id UNIQUE` FK keeps it one-to-one without widening the core row.

---

## 4. Import operation contract

The import is an **admin-gated, service-role operation** (a script or a `requireCmsAdmin` route — implementation detail), obeying:

- **Read-only on the filesystem.** It reads MDX + `lib/chapters.ts`; it never writes them.
- **No public-route awareness.** It touches only `cms_*` tables.
- **Dry-run first, always.** `mode='dry_run'` computes and returns the full plan and writes **nothing** (except, optionally, an audit "dry_run_previewed" line). `mode='apply'` performs the plan inside a single transaction.
- **Idempotent.** Re-running `apply` after a successful import produces `SKIP` (no-op) for unchanged chapters, never duplicates.
- **Batch-scoped.** Every apply run gets an `import_batch_id`, stamped on every created row's mirror record and audit entry, so a run can be identified and rolled back as a unit.
- **Fail-closed & atomic.** Any per-chapter validation failure aborts the whole `apply` transaction (all-or-nothing); partial imports are never committed.

### 4.1 Per-chapter action resolution

For each of the 25 chapters, resolve exactly one action:

| Action | Condition |
|---|---|
| `CREATE` | No `cms_chapter_mirror` row for `(book, source_path)` **and** no active `cms_chapters` row already holding `chapter_number` in this book. |
| `SKIP` | Mirror row exists and `source_sha256` + `meta_sha256` match current file/metadata (nothing changed). |
| `UPDATE_AVAILABLE` | Mirror row exists but source hashes differ → **reported only**; `apply` does **not** auto-overwrite a CMS body (see §6). Requires explicit `--refresh-source` intent. |
| `CONFLICT` | `chapter_number` is already taken by an active, **non-mirror** chapter (someone hand-created it), or a slug collision on `mdx-chapter-N` maps to a different content id. **Aborts apply**; listed in dry-run. |

---

## 5. Dry-run output (required shape)

`mode='dry_run'` returns a deterministic plan. Example (abridged):

```
IMPORT PLAN — book "EatoBiotics" (slug: eatobiotics-book)  [batch 7f3a…, DRY RUN]
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

On a clean second run after a successful import:

```
Summary:  CREATE 0   SKIP 25   UPDATE_AVAILABLE 0   CONFLICT 0
Result:   ✅ Nothing to do — CMS mirror is in sync with MDX.
```

Requirements: totals per action; per-chapter reason; explicit "no rows written" for dry-run; a single machine-checkable overall verdict (`READY` / `BLOCKED` / `NOOP`).

---

## 6. Divergence detection (never silently overwrite)

Divergence is computed by comparing stored hashes against freshly recomputed ones. A separate, read-only **`check`** operation (no writes except `last_checked_at` / `divergence_state`) classifies each mirrored chapter:

| `divergence_state` | Meaning | Action taken |
|---|---|---|
| `in_sync` | `source_sha256` and `body_sha256` both match | none |
| `source_changed` | MDX file edited since import (source hash differs); CMS body untouched | **report**; offer explicit "refresh snapshot from MDX" (operator-initiated) |
| `cms_changed` | CMS body edited since import (body hash differs); MDX untouched | **report**; this is expected editorial work — never overwritten by import |
| `both_changed` | both sides edited | **report loudly**; requires human reconciliation, no automated merge |
| `missing_source` | MDX file no longer exists at `source_path` | **report**; mirror retained, flagged |

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

- **Scoped rollback:** given a `batch_id`, archive (soft, default) or delete (hard, for a failed/test batch) every `cms_content`/`cms_chapters`/`cms_chapter_mirror` row created by that batch. `ON DELETE CASCADE` from `cms_content` removes the dependent `cms_chapters` + mirror rows automatically; soft rollback sets chapter `status='archived'` and can null the mirror or mark `divergence_state='missing_source'`.
- **Book record:** the find-or-create book is removed only if the rollback batch created it and it has no remaining chapters.
- **Reversibility guarantee:** since MDX/routes are never touched, a full rollback returns the system to its exact pre-import state. The public book is unaffected at every step.
- Every rollback writes its own audit entry (§9).

---

## 9. Audit records

Uses the existing append-only `cms_audit_log` (Migration 37) + a new action value.

- Add `CmsAuditAction`: `chapter_imported` (and reuse `content_created`, `content_archived`).
- Per created chapter: `chapter_imported`, entity `cms_content`, metadata `{ batch_id, source_path, source_sha256, chapter_number }`.
- Per batch: one summary line — `{ batch_id, mode, created, skipped, conflicts, book_id }`.
- Dry-run: optional single `{ batch_id, mode:'dry_run', verdict }` line (no per-chapter spam).
- Rollback: `content_archived` per row + a batch summary `{ batch_id, action:'rollback' }`.

---

## 10. Acceptance criteria

The import is accepted when **all** hold:

1. **Dry-run parity.** `dry_run` on a clean DB reports `CREATE 25, CONFLICT 0`, writes zero rows; verdict `READY`.
2. **Apply correctness.** `apply` creates exactly 1 book + 25 `cms_content` + 25 `cms_chapters` + 25 `cms_chapter_mirror` rows, with the §3 mapping, all chapters `status='draft'`, `chapter_number` 1–25 unique.
3. **Idempotency.** A second `apply` reports `SKIP 25`, writes zero rows, creates no duplicates.
4. **No source mutation.** `git status` shows no change to `content/book/**`, `lib/chapters*.ts`, `app/book*`, `components/book/**` after apply. (CI/test asserts these paths are untouched.)
5. **Public book unaffected.** All 25 `app/book-chapter-N` routes render identically before/after (build + spot render).
6. **Labeling.** Every imported chapter surfaces the "Live publication source: MDX" notice in `/cms`; none is or can become `published` via import.
7. **Divergence works.** Editing one MDX file → `check` reports `source_changed` for exactly that chapter; editing one CMS body → `cms_changed`; no auto-overwrite in either case.
8. **Rollback works.** Rolling back the batch returns row counts to pre-import and leaves MDX/routes untouched; audit reflects it.
9. **Security.** Import/check/rollback are `requireCmsAdmin`/service-role only; fail-closed (no admin → 404), matching every other `cms_*` route.
10. **Gates green.** `npm run lint` (0 errors), `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass; new unit tests cover mapping, action resolution, hash/divergence logic, and idempotency.

---

## 11. Open questions for Jason (resolve before build)

1. **Book subtitle** for the CMS book record — provide one, or leave null?
2. **`coming-soon`/`draft` MDX chapters** — all 25 are currently `published`; confirm the import should treat any future non-published chapter identically (mirror as `draft`, `source_published=false`).
3. **Snapshot granularity** — store the raw MDX verbatim (recommended, exact) vs. a stripped/plain-text projection for search. Recommendation: store raw verbatim in `body`; derive search text later if needed.
4. **Media** — confirm v1 leaves image references in-body and does **not** populate `cms_media` (recommended).
5. **Migration 41** — approve the `cms_chapter_mirror` table shape (§3.5) before any implementation.

---

*This document is a specification only. No migration was applied, no chapter data was created, and no repository content was modified in producing it.*
