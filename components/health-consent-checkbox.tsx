"use client"

import Link from "next/link"
import { HEALTH_CONSENT_STATEMENT } from "@/lib/health-consent"

/**
 * The one consent control, shown wherever health-derived answers are collected.
 *
 * One component rather than five, for the reason #245 learned the hard way: a
 * control copied into some surfaces and not others produces a Privacy Policy
 * that is true of part of the product. The routes enforce the same field, so a
 * surface that forgets to render this cannot silently collect without consent —
 * it fails instead.
 *
 * The statement text lives in `lib/health-consent.ts` and is hashed into the
 * consent record, so what someone agreed to is recoverable later even if this
 * copy changes.
 */
export function HealthConsentCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  error?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3">
      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--icon-green)]"
          aria-describedby="health-consent-detail"
        />
        <span id="health-consent-detail">
          {HEALTH_CONSENT_STATEMENT}{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && (
        <p className="mt-2 pl-7 text-xs" style={{ color: "var(--destructive)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
