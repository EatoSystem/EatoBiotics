import Link from "next/link"

/**
 * Shown to a buyer whose checkout Stripe has confirmed as settled, when the
 * database cannot be reached to load their report.
 *
 * This exists because the page used to fall through to `FullReportClient` here
 * — the generic, tier-shaped report built from none of their answers. That
 * looked like fulfilment while quietly substituting someone else's report for
 * theirs, which is worse than showing nothing: the customer has no way to tell
 * they are reading filler.
 *
 * The copy is deliberate on three points:
 *
 *  - It does not say the report failed or is lost. Almost always it exists and
 *    is fine; this is a read outage, and saying otherwise invites a support
 *    ticket and a refund request for a problem that resolves itself.
 *  - It does not send them back to the questionnaire. That implies the purchase
 *    did not register and is the one thing guaranteed to alarm a paying
 *    customer.
 *  - It confirms the payment explicitly, because that is the question someone
 *    actually has at this moment.
 *
 * Kept as a component rather than inline JSX for the reason recorded in
 * delivery-pending-notice.tsx: `app/assessment/report/page.tsx` is an async
 * server component behind Stripe, Supabase and `getUser()`, and markup written
 * there is unreachable by assertion. Written here it is one testable unit.
 */
export function PaidReportUnavailable() {
  return (
    <main className="px-6 py-16">
      <div
        className="mx-auto max-w-xl rounded-2xl px-6 py-8 text-center"
        style={{
          background: "color-mix(in srgb, var(--icon-orange) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)",
          color: "var(--foreground)",
        }}
      >
        <h1 className="text-2xl font-semibold">We can&rsquo;t load your report right now</h1>

        <p className="mt-4 text-sm leading-relaxed">
          Your payment went through and your report is safe — we just can&rsquo;t reach it at
          this moment. This is usually brief. Please refresh in a minute or two.
        </p>

        <p className="mt-3 text-sm leading-relaxed">
          Your report also stays available from your account, and the link in your
          email keeps working.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account"
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Go to your account
          </Link>
          <a
            href="mailto:hello@eatobiotics.com"
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{
              border: "1px solid color-mix(in srgb, var(--foreground) 25%, transparent)",
              color: "var(--foreground)",
            }}
          >
            Contact us
          </a>
        </div>
      </div>
    </main>
  )
}
