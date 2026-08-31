"use client"

import Link from "next/link"

/**
 * The buyer's request to start now — not a waiver.
 *
 * What this replaces asked them to "agree to us starting straight away" and to
 * acknowledge that doing so ENDED their 14-day right to cancel. Two things were
 * wrong with that. The report is not supplied at checkout: it is created after
 * the Consultation, which section 4 of the Terms has always said in the same
 * breath. And EatoBiotics no longer relies on the digital-content exception at
 * all — a full €49 refund is available for 14 days from purchase whether or not
 * the Consultation is finished — so there is nothing here for anyone to give
 * up. A checkbox that says otherwise misdescribes both the product and the
 * policy.
 *
 * What remains is a real question with a real answer: may we start now, or
 * would you rather wait? Unticked, because a pre-ticked box is not a request.
 *
 * The health-data consent that used to be bundled into this same sentence has
 * moved to `components/health-consent-checkbox.tsx`, the control the four other
 * collection points already use. Checkout was the one flow recording a consent
 * to HEALTH_CONSENT_STATEMENT while showing the buyer different words — and
 * that statement is hashed into the record precisely so it says what was
 * agreed.
 *
 * The wire field is `requestedImmediateStart`, checked server-side in
 * `app/api/checkout/route.ts`. A checkbox is not an enforcement point; the
 * caller list is kept honest by `tests/unit/checkout-acknowledgement.test.ts`,
 * which enumerates the callers from the tree rather than trusting this comment.
 */
export const IMMEDIATE_START_FIELD = "requestedImmediateStart" as const

export const IMMEDIATE_START_REQUIRED_MESSAGE =
  "Please confirm you'd like to start now before continuing to payment."

export function ImmediateStartRequest({
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
          aria-describedby="immediate-start-detail"
        />
        <span id="immediate-start-detail">
          <strong className="font-semibold text-foreground">
            Start my Personal Food System Consultation now
          </strong>
          <br />
          I request that EatoBiotics begin providing my Personal Food System Consultation
          immediately rather than waiting until the end of the 14-day cancellation period. I
          understand that EatoBiotics currently offers a full refund if I cancel within 14 days of
          purchase. I agree to the{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>
          . My answers, scores and profile stay with EatoBiotics — the payment page receives
          only a reference to them, what I bought, and the time I asked you to start.
        </span>
      </label>
    </div>
  )
}
