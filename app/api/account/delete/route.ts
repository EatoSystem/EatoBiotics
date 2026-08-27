import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"
import { PDF_BUCKET, pdfObjectPath } from "@/lib/report/pdf-access"

/**
 * Erasure (GDPR Art. 17). `app/privacy/page.tsx` §7 tells people they can do
 * this themselves from the account, so what this route actually removes is a
 * promise the Privacy Policy makes on its behalf.
 *
 * Two things were wrong with the previous version.
 *
 * 1. Every `.delete()` discarded its `{ error }`. An awaited PostgREST call
 *    RESOLVES with `{ error }` rather than throwing (the same defect #242 fixed
 *    in the paid-report route), so a failed delete was indistinguishable from a
 *    successful one — and `auth.admin.deleteUser` then ran regardless. That is
 *    the unrecoverable ordering: the account is gone, so nobody can retry, and
 *    the rows it referenced are orphaned with no owner left to ask.
 *
 * 2. It deleted five tables. Most user tables are
 *    `REFERENCES auth.users(id) ON DELETE CASCADE`, so those five were largely
 *    redundant — the cascade already had them. What no cascade reaches is the
 *    part that actually matters:
 *
 *      - `deep_assessments` — the paid deep answers and the full report JSON.
 *        It has no foreign key to auth.users at all, and its rows can be keyed
 *        by email alone (a guest checkout that never created an account).
 *      - `leads` — previously *soft*-deleted by nulling `user_id`, which left
 *        the email and the assessment scores behind. An erasure request is not
 *        satisfied by unlinking.
 *      - `email_sends` — `ON DELETE SET NULL`, so it retains the email address.
 *      - the report PDFs in Supabase Storage, which no database cascade sees.
 *
 * The explicit deletes for cascade-covered tables are kept: they are cheap, and
 * they mean an erasure does not silently depend on a foreign key defined
 * elsewhere still being correct.
 *
 * Deliberately NOT deleted: Stripe payment records. `app/privacy/page.tsx` §6
 * commits to retaining those for 7 years for tax and financial compliance, and
 * that retention is lawful independent of consent.
 *
 * The table lists below are looped over, so `.from(table)` is not a literal the
 * schema-drift scanner can read. Declared here for it:
 *
 * schema-drift-tables: weekly_checkins, analyses, consultations, journal_entries, plate_data, deep_assessments, leads, email_sends, profiles
 */
export async function DELETE() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminSupabase = getSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const userId = user.id
    const email = user.email ?? ""
    const ownedBy = ownerOrFilter(userId, email)

    // Anything that failed. A non-empty list stops the auth-user delete below.
    const failures: string[] = []
    const record = (stage: string, error: { message?: string } | null | unknown) => {
      if (!error) return
      const message = (error as { message?: string })?.message ?? String(error)
      console.error(`[account/delete] ${stage} failed:`, message)
      // Database error text stays in the server log; the response says only that
      // the deletion did not complete.
      failures.push(stage)
    }

    // ── Storage first ────────────────────────────────────────────────────
    // The object paths are derived from deep_assessments rows, so the PDFs have
    // to be removed while those rows still exist. Getting this order wrong
    // orphans the files permanently: the bucket has no other index of them.
    const { data: paidRows, error: paidReadError } = await adminSupabase
      .from("deep_assessments")
      .select("stripe_session_id")
      .or(ownedBy)
    if (paidReadError) {
      // Abort before deleting anything. If we cannot read the session ids we
      // cannot derive the PDF object paths — and deleting the rows anyway would
      // destroy the only index of those files, leaving the customer's paid
      // reports in the bucket permanently, unreachable and undeletable. Nothing
      // has been removed at this point, so a retry is clean.
      console.error("[account/delete] deep_assessments read failed:", paidReadError.message)
      return NextResponse.json(
        {
          error:
            "We couldn't finish deleting your data, so we haven't closed your account. Please try again — if it keeps failing, email us and we'll do it manually.",
          code: "deletion_incomplete",
          stages: ["deep_assessments:read"],
        },
        { status: 503 },
      )
    }

    const pdfPaths = (paidRows ?? [])
      .map((row: { stripe_session_id?: string | null }) => row.stripe_session_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .map(pdfObjectPath)

    if (pdfPaths.length > 0) {
      const { error: storageError } = await adminSupabase.storage.from(PDF_BUCKET).remove(pdfPaths)
      record("storage:pdf-reports", storageError)
    }

    // ── Rows ─────────────────────────────────────────────────────────────
    const byUser = [
      "weekly_checkins",
      "analyses",
      "consultations",
      "journal_entries",
      "plate_data",
    ] as const

    for (const table of byUser) {
      const { error } = await adminSupabase.from(table).delete().eq("user_id", userId)
      record(table, error)
    }

    // These two are keyed by user_id OR email — a paid report and an assessment
    // lead can both exist for someone who never linked an account.
    for (const table of ["deep_assessments", "leads"] as const) {
      const { error } = await adminSupabase.from(table).delete().or(ownedBy)
      record(table, error)
    }

    // The lifecycle-email ledger holds the address itself, so it is deleted by
    // email rather than by the user_id it sets to null.
    if (email) {
      const { error } = await adminSupabase.from("email_sends").delete().eq("email", email)
      record("email_sends", error)
    }

    const { error: profileError } = await adminSupabase.from("profiles").delete().eq("id", userId)
    record("profiles", profileError)

    // ── The irreversible step, last and only if everything else worked ───
    if (failures.length > 0) {
      // Retryable on purpose. The account still exists, so the person can try
      // again or contact us — which is exactly what they could not do when a
      // failed delete was followed by an unconditional auth-user deletion.
      return NextResponse.json(
        {
          error:
            "We couldn't finish deleting your data, so we haven't closed your account. Please try again — if it keeps failing, email us and we'll do it manually.",
          code: "deletion_incomplete",
          stages: failures,
        },
        { status: 503 },
      )
    }

    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.error("[account/delete] Auth delete failed:", authError.message)
      return NextResponse.json({ error: "Account deletion failed" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[account/delete]", err)
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 })
  }
}
