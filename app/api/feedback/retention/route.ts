import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"

/* ── Retention sweep (cron) ────────────────────────────────────────────────
   Deletes rows whose server-set `expires_at` has passed, across every table
   in this repository that carries a retention promise.

   ONE table today: `paid_report_intents` (30 days, #244). The path still
   says "feedback" because that is where the job started and renaming it would
   mean a new URL and a vercel.json edit for no behavioural gain.

   ── What the V1 scope freeze found here (step 5) ──────────────────────────

   This list used to read feedback → reviews → paid_report_intents, and the
   loop below returns 500 on the first read error. `feedback` (Migration 46)
   and `reviews` (Migration 45) are DRAFTED AND UNAPPLIED — verified absent
   from production — so every nightly run failed on table one and
   `paid_report_intents` WAS NEVER SWEPT. The 30-day promise on purchase
   intents was a sentence with nothing behind it, which is exactly the failure
   this route was written to end, reproduced by the order of a list.

   Production held zero intents when this was found, which bounds the harm to
   date. It stops bounding anything the moment V1 takes a payment.

   Two changes, because either alone leaves a hole. The list is narrowed to
   what V1 actually has, AND a missing table is now a recorded skip rather
   than a fatal error — so re-adding a table above this one can never again
   starve it. `feedback` and `reviews` come back when their migrations are
   deliberately applied; that is part of reinstating feedback capture, not a
   separate cleanup.

   `paid_report_intents` holds the buyer's score summary between checkout and
   report generation. An intent whose checkout was abandoned is health-derived
   data being kept to serve a purchase that never happened, and Migration 47
   states a 30-day window — which was, until this route learned about the
   table, a sentence with nothing behind it.

   NOT swept: `consents`. It is the record that someone agreed to health-data
   processing, and its whole value is that it outlives the thing it permitted.
   Deleting it would destroy the evidence, not tidy it.

   This is what makes "90-day retention" a fact rather than a sentence in a
   policy document. The window is enforced in two places that have to agree:
   the column DEFAULT sets `expires_at` (no route ever sends it, so a client
   cannot extend its own retention), and this job removes what it marks.

   Why a cron route and not pg_cron: the extension is available on the project
   but NOT installed, and installing it is a production DDL change no agent
   session should make. Vercel Cron + verifyCronRequest is already how all
   eight scheduled jobs in this repo run, so this needs no new infrastructure
   and no dashboard-only step. See vercel.json.

   Not client-invokable: verifyCronRequest fails CLOSED — with no CRON_SECRET
   configured it returns 503 rather than running unauthenticated.

   The delete predicate is deliberately narrow and identical for both tables:
   `expires_at <= now`. It never filters on user, content or status, so it
   cannot be nudged into deleting live feedback.

   ── Why this reads ids and deletes in batches ─────────────────────────────

   The first version was `.delete().lte("expires_at", cutoff).select("id")` and
   counted `data.length`. Two problems, one certain and one unprovable:

   CERTAIN: `.select()` appends `Prefer: return=representation`
   (@supabase/postgrest-js PostgrestTransformBuilder.select), and the
   representation is exactly what PostgREST's `db-max-rows` bounds — its own
   docs call it "a hard limit to the number of rows PostgREST will fetch".
   So `data.length` was counting a value the server is entitled to truncate.
   A retention job that under-reports how much it deleted is a job nobody can
   audit.

   UNPROVABLE HERE: whether `db-max-rows` also caps the rows a DELETE
   AFFECTS. The PostgREST docs describe it in terms of rows "fetched" and say
   nothing about mutations; the docs site and Supabase's are egress-blocked
   from the build container, and the setting is per-project and can be changed
   by a human at any time. So the honest position is that we do not know, and
   a design that only works if the answer is favourable is not good enough for
   deleting customer data on a promise.

   Both are answered by enumerating what to delete: read a bounded page of
   expired IDs, delete exactly those by ID, repeat until a page comes back
   empty. Each DELETE names ≤ RETENTION_BATCH rows, far below any plausible
   cap, and the loop only ends when the table reports nothing expired left —
   so completeness does not depend on what `db-max-rows` does to mutations.

   The count comes from `Prefer: count=exact` via the Content-Range header,
   which the client parses independently of the response body, so it is a real
   affected-row count rather than a body length.

   Only `id` is ever selected. No message, comment, rating or user id is read
   or logged by this route.
──────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

/** One table to sweep, and the column whose values name its rows. */
export interface RetainedTable {
  table: string
  keyColumn: string
}

/**
 * Is this the database saying the table does not exist?
 *
 * PostgREST answers `PGRST205` when a relation is not in its schema cache;
 * Postgres answers `42P01` (undefined_table) when the statement reaches it.
 * Nothing else is treated as absence — a permission error, a timeout, a
 * connection failure and a malformed filter are all REAL failures, and a
 * retention job that quietly reported "skipped" for those would be worse than
 * one that stops, because the operator would read a green log while expired
 * customer data sat in the table.
 */
function isMissingTable(error: { code?: string }): boolean {
  return error.code === "PGRST205" || error.code === "42P01"
}

/**
 * Tables swept here, each with the column its rows are named by.
 *
 * `keyColumn` exists because `paid_report_intents` is keyed on `token`, not
 * `id`. The batch loop deletes by naming primary keys explicitly, so it has to
 * ask for the right one — a hardcoded "id" would silently select nothing for
 * that table and report a completed sweep having deleted nothing, which is the
 * worst available outcome for a retention job.
 *
 * `consents` is deliberately absent — see the header.
 *
 * The loop below calls `.from(table)` with a variable, which the schema-drift
 * guard cannot resolve by reading the source — so it is declared here instead.
 * Keep this list and the marker in step.
 *
 * schema-drift-tables: paid_report_intents
 */
export const RETAINED_TABLES: readonly RetainedTable[] = [
  { table: "paid_report_intents", keyColumn: "token" },
] as const

/**
 * Rows named per DELETE, via `.in("id", ids)`.
 *
 * Bounded well under 200 deliberately: `.in()` serialises every id into the
 * request URL, and PostgREST's own client warns about exactly this shape —
 * `@supabase/postgrest-js`'s `urlLengthLimit` defaults to 8000, and its error
 * hints call out "`.in('id', [200+ IDs])`" by name. Measured against the real
 * client with representative UUIDs and the production REST base URL: 100 ids
 * serialises to ~3,967 characters — half the client's own limit, comfortable
 * under any proxy's header cap too. 500 ids measured at ~19,567 characters,
 * over both. See tests/unit/feedback-retention-url-size.test.ts, which builds
 * the real URL through the real client rather than trusting arithmetic.
 */
export const RETENTION_BATCH = 100

/**
 * Safety bound on passes per table, so a pathological state cannot spin a cron
 * invocation forever. Exhausting it is reported as an INCOMPLETE sweep rather
 * than a success, because expired text still being present is the one thing
 * an operator needs to hear about.
 */
const RETENTION_MAX_PASSES = 40

/**
 * The most rows a single run will ever attempt to remove from one table.
 * Derived, not restated — so changing either constant above can never leave
 * this figure stale. At today's values: 100 × 40 = 4,000 rows/table/run,
 * against a job that runs daily. A table with more than that many rows
 * expired at once returns "Retention sweep incomplete" rather than a false
 * success (see the pass-limit check below), and the next day's run continues
 * from wherever this one stopped.
 */
const RETENTION_MAX_ROWS_PER_TABLE = RETENTION_BATCH * RETENTION_MAX_PASSES

/**
 * Sweep the given tables.
 *
 * Takes the list rather than reading RETAINED_TABLES directly, for one
 * reason: the bug this route shipped was a property of the ORDER of that
 * list, and with a single table configured there is no way to test ordering
 * at all. A test can pass `[absentTable, paid_report_intents]` here and prove
 * the expired intent is still deleted — the exact production failure, pinned.
 *
 * The seam is narrow on purpose. `GET`/`POST` pass RETAINED_TABLES and
 * nothing else, and tests/unit/feedback-retention.test.ts parses this file to
 * prove it — so this cannot become a place where production and the tests
 * quietly sweep different things.
 */
export async function sweepTables(tables: readonly RetainedTable[]): Promise<NextResponse> {
  const supabase = getSupabase()
  if (!supabase) {
    console.error("[feedback/retention] Supabase not configured")
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const cutoff = new Date().toISOString()
  const deleted: Record<string, number> = {}
  /** Tables that do not exist in this database. Reported, never fatal. */
  const skipped: string[] = []

  // Labelled so a missing table can leave the TABLE, not merely the pass
  // loop — an unlabelled break would fall through to the convergence check
  // below and report the skip as an incomplete sweep.
  tableLoop: for (const { table, keyColumn } of tables) {
    let removed = 0
    let complete = false

    for (let pass = 0; pass < RETENTION_MAX_PASSES; pass++) {
      // Keys only — never message, comment, rating, user_id, or the intent
      // summary (which is the health-derived payload this table exists to
      // hold). The sweep never reads what it deletes.
      const { data: expired, error: readError } = await supabase
        .from(table)
        .select(keyColumn)
        .lte("expires_at", cutoff)
        .limit(RETENTION_BATCH)

      if (readError) {
        // A table that is not in this database cannot have expired rows in
        // it, and it must not stop the tables that DO. This is the whole
        // repair: the old code returned here, so an absent table at the front
        // of the list starved every table behind it.
        if (isMissingTable(readError)) {
          console.warn(`[feedback/retention] ${table} is absent from this database — skipped`)
          skipped.push(table)
          continue tableLoop
        }
        console.error(
          `[feedback/retention] ${table} read failed:`,
          readError.message,
          "| completed before failure:",
          JSON.stringify({ ...deleted, [table]: removed }),
        )
        return NextResponse.json(
          { error: "Retention sweep failed", failedTable: table, deleted, skipped },
          { status: 500 },
        )
      }

      // `as unknown as` because `keyColumn` is now a plain string rather than a
      // literal union — the table list is typed for a caller that may pass its
      // own (see sweepTables), so postgrest-js can no longer infer the row shape.
      const ids = (expired ?? []).map((r) => (r as unknown as Record<string, string>)[keyColumn])
      if (ids.length === 0) {
        // Nothing expired remains: this table is genuinely finished.
        complete = true
        break
      }

      const { count, error } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .in(keyColumn, ids)

      if (error) {
      // Report the failure rather than a partial success that reads as a
      // completed sweep — expired customer text still being present is exactly
      // the thing someone needs to know about. Carry the counts for whatever
      // DID get swept: "feedback cleared, reviews did not" is a materially
      // different situation to "nothing ran", and losing that distinction
      // makes the failure harder to act on than it needs to be.
        console.error(
          `[feedback/retention] ${table} delete failed:`,
          error.message,
          "| completed before failure:",
          JSON.stringify({ ...deleted, [table]: removed }),
        )
        return NextResponse.json(
          { error: "Retention sweep failed", failedTable: table, deleted, skipped },
          { status: 500 },
        )
      }

      if (count === null) {
        // The count is read from Content-Range. Its absence means the rows may
        // well be gone but we cannot say how many — and a deletion job that
        // cannot report what it deleted is not auditable. Treat it as a
        // failure rather than reporting a number we did not measure.
        console.error(
          `[feedback/retention] ${table} returned no exact count — cannot verify the sweep`,
        )
        return NextResponse.json(
          { error: "Retention sweep could not be verified", failedTable: table, deleted, skipped },
          { status: 500 },
        )
      }

      removed += count
      // Deliberately no early exit on a short page. The loop ends only when a
      // read reports zero expired rows, so a capped DELETE (or a concurrent
      // writer) is picked up on the next pass instead of being assumed away.
    }

    deleted[table] = removed

    if (!complete) {
      console.error(
        `[feedback/retention] ${table} did not converge within its ` +
          `${RETENTION_MAX_ROWS_PER_TABLE}-row budget (${RETENTION_MAX_PASSES} passes ` +
          `of ${RETENTION_BATCH}) —`,
        `${removed} row(s) removed, expired rows may remain`,
      )
      return NextResponse.json(
        { error: "Retention sweep incomplete", failedTable: table, deleted, skipped },
        { status: 500 },
      )
    }
  }

  // `skipped` is reported alongside `deleted` so "swept nothing because the
  // table is gone" is legible in a log, rather than indistinguishable from
  // "swept nothing because nothing had expired".
  console.log("[feedback/retention] swept:", JSON.stringify({ deleted, skipped }))
  return NextResponse.json({ ok: true, cutoff, deleted, skipped })
}

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised
  return sweepTables(RETAINED_TABLES)
}

export async function POST(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised
  return sweepTables(RETAINED_TABLES)
}
