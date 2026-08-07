/* ── Durable access to the paid-report PDF ────────────────────────────────
 * The submit route uploads every paid PDF to one deterministic place:
 * bucket `pdf-reports`, object `${sessionId}.pdf`, upsert on retry. What it
 * PERSISTS, though, is a 7-day signed URL — and for a long time that emailed
 * URL was the customer's only route to their PDF. After a week their €49
 * download was simply gone.
 *
 * The object path being deterministic is what makes this fixable without a
 * migration: any authorised view of the report can mint a fresh short-lived
 * URL from the session id alone. The stale persisted URL is never reused —
 * it is treated as evidence (see pdfIsAvailable), not as an address.
 *
 * These constants are imported by the submit route's upload path too, so the
 * place PDFs are written and the place fresh URLs are minted from cannot
 * drift apart.
 */

export const PDF_BUCKET = "pdf-reports"

/** One hour. Long enough to click, short enough that a leaked link goes cold. */
export const PDF_URL_TTL_SECONDS = 60 * 60

export function pdfObjectPath(sessionId: string): string {
  return `${sessionId}.pdf`
}

export interface PdfRow {
  pdf_status?: string | null
  pdf_url?: string | null
}

/**
 * Whether the storage object for this row's session can be assumed to exist.
 *
 * `pdf_status === "uploaded"` is the authoritative signal (Migration 33).
 * Legacy rows predate that column — for those, a persisted `pdf_url` is
 * accepted as proof instead, because the route only ever minted a URL *after*
 * a successful upload. The URL's own expiry is irrelevant here: it proves the
 * object was written, and the fresh URL is minted from the object path.
 */
export function pdfIsAvailable(row: PdfRow): boolean {
  if (row.pdf_status === "uploaded") return true
  if (!row.pdf_status && typeof row.pdf_url === "string" && row.pdf_url.length > 0) return true
  return false
}

/** The narrow slice of a Supabase client this module needs — keeps the helper
 *  unit-testable with a stub, and keeps the full service-role client out of
 *  reach of anything downstream of it. */
export interface PdfStorageClient {
  storage: {
    from(bucket: string): {
      createSignedUrl(
        path: string,
        expiresIn: number,
      ): Promise<{ data: { signedUrl: string } | null; error: unknown }>
    }
  }
}

/**
 * Mints a fresh short-lived signed URL for a session's PDF, or null.
 *
 * Callers are responsible for authorisation BEFORE calling this — the report
 * page only reaches it after Stripe confirms the checkout session is settled.
 * The guarantee this function adds is narrower: it never touches storage at
 * all unless the row says the object exists, and it never returns the
 * persisted (possibly expired) URL.
 */
export async function freshPdfUrl(
  supabase: PdfStorageClient,
  sessionId: string,
  row: PdfRow,
): Promise<string | null> {
  if (!pdfIsAvailable(row)) return null
  try {
    const { data } = await supabase.storage
      .from(PDF_BUCKET)
      .createSignedUrl(pdfObjectPath(sessionId), PDF_URL_TTL_SECONDS)
    return data?.signedUrl ?? null
  } catch {
    // A storage hiccup must never take down the report view — the page
    // degrades to the pending state rather than erroring.
    return null
  }
}
