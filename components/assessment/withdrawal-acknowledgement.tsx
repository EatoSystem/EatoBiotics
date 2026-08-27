"use client"

import Link from "next/link"

/**
 * Express consent to immediate supply of digital content, and acknowledgement
 * that it ends the 14-day right to cancel (Consumer Rights Directive; Irish
 * Consumer Rights Act 2022, and see Terms sections 4 and 5).
 *
 * This lives in one component because there are **three** live callers of
 * `/api/checkout` — `payment-cta.tsx`, `personal-report-cta.tsx` and
 * `assessment-results.tsx` — and the first version of this change gated only
 * one of them. That was worse than the gap it closed: the Terms had started
 * asserting the acknowledgement was asked at checkout, so on two of the three
 * paths the Terms were simply untrue.
 *
 * The wire field is `acknowledgedImmediateSupply`, checked server-side in
 * `app/api/checkout/route.ts`. A checkbox is not an enforcement point.
 */
export const ACKNOWLEDGEMENT_FIELD = "acknowledgedImmediateSupply" as const

export const ACKNOWLEDGEMENT_REQUIRED_MESSAGE =
  "Please confirm the statement above before continuing to payment."

export function WithdrawalAcknowledgement({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-secondary/20 px-5 py-4">
      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--icon-green)]"
        />
        <span>
          I ask EatoBiotics to prepare my report straight away, and I understand that once it has
          been generated I lose the 14-day right to cancel. I agree to the{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          , including that my assessment answers are health-related data used to produce the
          report, and that my scores and profile type are sent to Stripe as part of the checkout
          session.
        </span>
      </label>
    </div>
  )
}
