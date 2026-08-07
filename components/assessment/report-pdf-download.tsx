import { FileDown, Clock3 } from "lucide-react"

/* ── The PDF download action on the paid web report ────────────────────────
 * The state check lives inside the component, same reasoning as
 * DeliveryPendingNotice: the report page is an async server component behind
 * Stripe and Supabase that no test can render, so a conditional written there
 * is unreachable by any assertion. Here, the whole state -> UI rule is one
 * testable unit and the page mounts it unconditionally.
 *
 * Three states, no dead links:
 *  - ready:   a fresh short-lived signed URL was minted server-side this view
 *  - pending: the row says the PDF is not uploaded yet (generation/upload
 *             failed or still in flight) — honest status copy, no link
 *  - absent:  legacy rows with no PDF at all, or dev without storage — nothing
 */
export function ReportPdfDownload({
  pdfUrl,
  pdfStatus,
}: {
  pdfUrl: string | null
  pdfStatus: string | null
}) {
  if (pdfUrl) {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl border border-[var(--icon-green)]/25 p-4"
        style={{ background: "color-mix(in srgb, var(--icon-green) 6%, transparent)" }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        >
          <FileDown size={18} aria-hidden strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Your report as a PDF</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            This link is freshly generated and short-lived — this page always has a new one.
          </p>
        </div>
        <a
          href={pdfUrl}
          download
          className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        >
          Download PDF
        </a>
      </div>
    )
  }

  // A row that has PDF delivery state but not a successful upload: the report
  // is complete on this page; say plainly that the PDF is not ready rather
  // than offering a link that goes nowhere.
  if (pdfStatus && pdfStatus !== "uploaded") {
    return (
      <div
        className="flex items-start gap-4 rounded-2xl border border-border p-4"
        style={{ background: "color-mix(in srgb, var(--icon-yellow) 7%, transparent)" }}
      >
        <Clock3
          size={18}
          aria-hidden
          strokeWidth={2}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--icon-orange-text, #8C6C1B)" }}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Your PDF is still being prepared.</span>{" "}
          Everything in your report is available on this page now — the download will appear
          here as soon as the PDF is ready.
        </p>
      </div>
    )
  }

  return null
}
