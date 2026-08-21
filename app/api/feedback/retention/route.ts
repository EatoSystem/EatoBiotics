import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"

/* ── Private-feedback retention sweep (cron) ───────────────────────────────
   Deletes feedback and review rows whose server-set `expires_at` has passed.

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

/** Tables swept here. Both hold raw customer text under the same 90-day rule. */
const RETAINED_TABLES = ["feedback", "reviews"] as const

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

async function sweep(): Promise<NextResponse> {
  const supabase = getSupabase()
  if (!supabase) {
    console.error("[feedback/retention] Supabase not configured")
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const cutoff = new Date().toISOString()
  const deleted: Record<string, number> = {}

  for (const table of RETAINED_TABLES) {
    let removed = 0
    let complete = false

    for (let pass = 0; pass < RETENTION_MAX_PASSES; pass++) {
      // IDs only — never message, comment, rating or user_id.
      const { data: expired, error: readError } = await supabase
        .from(table)
        .select("id")
        .lte("expires_at", cutoff)
        .limit(RETENTION_BATCH)

      if (readError) {
        console.error(
          `[feedback/retention] ${table} read failed:`,
          readError.message,
          "| completed before failure:",
          JSON.stringify({ ...deleted, [table]: removed }),
        )
        return NextResponse.json(
          { error: "Retention sweep failed", failedTable: table, deleted },
          { status: 500 },
        )
      }

      const ids = (expired ?? []).map((r) => (r as { id: string }).id)
      if (ids.length === 0) {
        // Nothing expired remains: this table is genuinely finished.
        complete = true
        break
      }

      const { count, error } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .in("id", ids)

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
          { error: "Retention sweep failed", failedTable: table, deleted },
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
          { error: "Retention sweep could not be verified", failedTable: table, deleted },
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
        { error: "Retention sweep incomplete", failedTable: table, deleted },
        { status: 500 },
      )
    }
  }

  console.log("[feedback/retention] swept:", JSON.stringify(deleted))
  return NextResponse.json({ ok: true, cutoff, deleted })
}

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised
  return sweep()
}

export async function POST(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised
  return sweep()
}
