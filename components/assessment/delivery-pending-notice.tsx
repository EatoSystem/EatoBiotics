import type { ReportViewState } from "@/lib/report-status"

/**
 * The notice shown above a paid report whose row is "partial" — the report
 * itself generated and saved, but the PDF upload or the report email failed.
 *
 * The state check lives *inside* the component rather than in the page that
 * mounts it, and that is the point: `app/assessment/report/page.tsx` is an
 * async server component behind Stripe, Supabase and `getUser()`, and no test
 * in this repo renders an `app/` page. A conditional written there is
 * unreachable by any assertion. Written here, the whole state -> visibility
 * rule is one testable unit, and the page becomes an unconditional mount.
 *
 * The raw `--icon-orange` hue is used for the tint and the border only. Copy is
 * `--foreground`: app/globals.css:28-36 records that the raw brand hues run
 * 1.55:1-2.96:1 on white and fail AA as text.
 */
export function DeliveryPendingNotice({ viewState }: { viewState: ReportViewState }) {
  if (viewState !== "view_delivery_pending") return null

  return (
    <div className="px-6 pt-6">
      <div
        className="mx-auto max-w-3xl rounded-2xl px-5 py-4 text-sm leading-relaxed"
        style={{
          background: "color-mix(in srgb, var(--icon-orange) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)",
          color: "var(--foreground)",
        }}
      >
        <span className="font-semibold">Your report is ready below.</span>{" "}
        Your PDF download or email copy may still be on its way — everything is
        also available any time from your account.
      </div>
    </div>
  )
}
