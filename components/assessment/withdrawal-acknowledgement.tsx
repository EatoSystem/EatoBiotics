"use client"

import Link from "next/link"

/**
 * Express consent to immediate supply of digital content, and acknowledgement
 * that it ends the 14-day right to cancel (Consumer Rights Directive; Irish
 * Consumer Rights Act 2022, and see Terms sections 4 and 5).
 *
 * This lives in one component because two live callers POST to `/api/checkout`
 * — `assessment-results.tsx` and `personal-report-cta.tsx` — and the first
 * version of this change gated neither. It gated `payment-cta.tsx`, which was
 * the one caller that was *not* live: it hung off `premium-teaser.tsx`, which
 * nothing rendered. Both files have since been deleted. So the checkbox went
 * into dead code while the Terms had already begun asserting that every buyer
 * is asked, which is worse than the gap it closed.
 *
 * The wire field is `acknowledgedImmediateSupply`, checked server-side in
 * `app/api/checkout/route.ts`. A checkbox is not an enforcement point; the
 * caller list above is kept honest by `tests/unit/checkout-acknowledgement.test.ts`,
 * which enumerates the callers from the tree rather than trusting this comment.
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
          report. I understand that the checkout session sent to Stripe currently also carries my
          overall score, my sub-scores, my profile type and its description, the assessment I came
          from, any deeper-support area I chose, my email address, and the time I gave this
          confirmation.
        </span>
      </label>
    </div>
  )
}
