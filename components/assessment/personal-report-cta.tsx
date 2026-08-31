"use client"

import {
  IMMEDIATE_START_FIELD,
  IMMEDIATE_START_REQUIRED_MESSAGE,
  ImmediateStartRequest,
} from "@/components/assessment/immediate-start-request"
import { HealthConsentCheckbox } from "@/components/health-consent-checkbox"
import {
  HEALTH_CONSENT_FIELD,
  HEALTH_CONSENT_REQUIRED_MESSAGE,
} from "@/lib/health-consent"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import { resolvedFoundation, getJourney } from "@/lib/assessment/journey"
import { REPORT_OFFER_FEATURES } from "@/lib/report/offer"

interface PersonalReportCtaProps {
  result: AssessmentResult
  /**
   * The buyer's email, when the flow rendering this already has one.
   *
   * Both current callers do: Mind and Family results already receive it as
   * `leadEmail` and already use it for SaveResultsCard. It was simply never
   * passed here, so `/api/checkout` received no email — and recordHealthConsent
   * no-ops without one. The buyer ticked the health-consent box and no
   * deep_assessment row was written for it.
   *
   * Optional, not required: a future caller may legitimately have no email,
   * and a required prop would push it to invent one. Absent, the request body
   * is exactly what it was before this prop existed.
   *
   * Not normalised here. app/api/checkout/route.ts lowercases and trims before
   * recording, and recordHealthConsent lowercases again; a third pass on the
   * client would be a second place to keep in step for no gain.
   */
  email?: string
}


export function PersonalReportCta({ result, email }: PersonalReportCtaProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Two separate questions, both unticked by default — a pre-ticked box is
  // neither a request nor consent. They were one sentence until this change;
  // bundling a processing consent into a commercial request is what made the
  // consent record quote a statement the buyer had never been shown.
  const [startNow, setStartNow] = useState(false)
  const [healthConsent, setHealthConsent] = useState(false)

  async function handlePurchase() {
    if (!healthConsent) {
      setError(HEALTH_CONSENT_REQUIRED_MESSAGE)
      return
    }
    if (!startNow) {
      setError(IMMEDIATE_START_REQUIRED_MESSAGE)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "personal",
          overall: result.overall,
          // /api/checkout expects the full profile object, not just the type
          // string — sending the string fails validation and 500s.
          profile: result.profile,
          subScores: result.subScores,
          // Carry the product architecture so the report knows its foundation +
          // any selected add-on (null for the legacy standalone flow).
          foundationType: resolvedFoundation(),
          selectedAddon: getJourney().selectedAddon,
          // Sent when the caller has it, so the consent the buyer just gave
          // gets a record. Omitted rather than sent as null when it does not:
          // the route reads `email?.toLowerCase()`, so either shape works, but
          // an absent key keeps the no-email body byte-identical to before.
          ...(email ? { email } : {}),
          [HEALTH_CONSENT_FIELD]: true,
          [IMMEDIATE_START_FIELD]: true,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.")
        return
      }

      window.location.href = data.url
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--icon-green)" }}
        >
          Next Step
        </p>
        <h3 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          How does your Food System work?
        </h3>
        {/* Free vs paid, stated as the two different questions they answer. The
          * heading here used to promise the 30-day plan ("Unlock your full
          * 30-day plan") before a single Consultation question had been asked —
          * selling the last step of the paid journey as though it were the
          * first. */}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
          Your free Food System Assessment answered <em>where am I</em>. The Personal Food System
          Consultation answers how your Food System works, what that means for you, and what to
          do next.
        </p>
      </div>

      {/* Report card */}
      <div className="rounded-3xl border-2 border-[var(--icon-green)]/30 bg-card overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
          }}
        />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-bold text-foreground">Personal Food System Consultation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A guided digital process. Educational and non-diagnostic; not a
                medical consultation or diagnosis.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-serif text-4xl font-bold"
                style={{ color: "var(--icon-green)" }}
              >
                €49
              </p>
              <p className="text-xs text-muted-foreground">one time</p>
            </div>
          </div>

          <ul className="mb-6 space-y-2.5">
            {REPORT_OFFER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <Check size={14} className="shrink-0" style={{ color: "var(--icon-green)" }} />
                {f}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <HealthConsentCheckbox checked={healthConsent} onChange={setHealthConsent} />
            <ImmediateStartRequest checked={startNow} onChange={setStartNow} />
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading || !healthConsent || !startNow}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Redirecting…
              </>
            ) : (
              <>
                Pay €49 &amp; Begin My Consultation <ArrowRight size={16} />
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Membership continuation */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: "color-mix(in srgb, var(--icon-teal) 6%, transparent)" }}
      >
        <p className="text-xs font-semibold text-foreground mb-1">
          After your 30 days — continue with EatoBiotics Member
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Monthly Biotics Score™ updates, new monthly focus, and ongoing food guidance —
          €{MEMBER_PRICE_EUR}/month, cancel any time.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--icon-teal)" }}
        >
          See what&apos;s included <ArrowRight size={11} />
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        Secure payment via Stripe · Full refund within 14 days · No subscription required
      </p>
    </div>
  )
}
