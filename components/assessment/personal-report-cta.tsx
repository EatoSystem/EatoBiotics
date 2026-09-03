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
import posthog from "posthog-js"
import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import { resolvedFoundation, getJourney } from "@/lib/assessment/journey"
import { REPORT_OFFER_FEATURES, REPORT_PRICE_EUR } from "@/lib/report/offer"

/**
 * The one place EatoBiotics offers the €49 Personal Food System Consultation.
 *
 * ── Why this is shared (Phase 2F) ────────────────────────────────────────────
 *
 * The same purchase decision was implemented twice. Mind and Family rendered
 * this component; the You result carried its own inline copy of it — its own
 * handlePurchase, its own narrative, its own analytics call. They had drifted
 * in four ways that mattered, none of them decided by anyone:
 *
 *  - Mind and Family never fired `report_purchase_clicked` at all (this file
 *    had no posthog import), so two thirds of buyers were invisible in the
 *    purchase funnel.
 *  - You's request omitted `foundationType` and `selectedAddon`, so the report
 *    lost the product architecture the other two sent.
 *  - The Member continuation showed on Mind and Family and not on You, by
 *    accident of which implementation each used rather than by choice.
 *  - The refund and trust lines said different things on different surfaces.
 *
 * One implementation, one truth, and the two things that genuinely differ by
 * context are now explicit props rather than duplicated files.
 *
 * ── What this component may and may not say ─────────────────────────────────
 *
 * The Consultation is the product; the Personal Food System Report is what it
 * produces. Payment buys entry to a guided set of questions — not a document
 * that appears at checkout — so the copy walks the buyer through
 * payment → questions → Report, in that order.
 *
 * Deliberately absent, each for a reason that has already caught someone out:
 *
 *  - A question count. The free Assessment is fifteen; the paid path generates
 *    a core set plus follow-ups plus any Lens questions, so no single number is
 *    true across contexts. The conceptual distinction carries the value.
 *  - A duration. Because the count is variable there is no measured timing, and
 *    an invented "about 15 minutes" is a promise the product cannot keep.
 *  - Trial vocabulary for the 30 days. They are INCLUDED in a paid purchase,
 *    and membership does not begin on its own afterwards.
 */

/** Which result the buyer is looking at when the offer is made. */
export type ConsultationSource = "you_result" | "mind" | "family"

/**
 * The bridge from the result someone just read to the Consultation.
 *
 * Contextual on purpose. Only the You journey has just completed the Food
 * System Assessment, so only You may say so — telling a Mind or Family customer
 * that "your Food System Assessment answered where you are" would describe an
 * assessment they did not take. The commercial offer below is identical in all
 * three; this is the only part that varies, and it varies because the truth
 * does.
 */
const BRIDGE: Record<ConsultationSource, { eyebrow: string; body: string }> = {
  you_result: {
    eyebrow: "You now know where you are",
    body:
      "Your Food System Assessment answered where you are. The Consultation goes deeper — into your food, rhythm, history and daily life — and turns those answers into your Personal Food System Report.",
  },
  mind: {
    eyebrow: "The next step",
    body:
      "Your assessment has given you a focused starting point. The Consultation goes deeper — into your food, rhythm, history and daily life — and turns those answers into your Personal Food System Report.",
  },
  family: {
    eyebrow: "The next step",
    body:
      "Your assessment has given you a focused starting point. The Consultation goes deeper — into your food, rhythm, history and daily life — and turns those answers into your Personal Food System Report.",
  },
}

interface PersonalReportCtaProps {
  result: AssessmentResult
  /**
   * The buyer's email, when the flow rendering this already has one.
   *
   * All three callers do. It reaches `/api/checkout`, which is what lets
   * recordHealthConsent write a record for the consent the buyer just gave —
   * without it the box was ticked and nothing was stored.
   *
   * Optional, not required: a future caller may legitimately have none, and a
   * required prop would push it to invent one.
   *
   * Not normalised here. app/api/checkout/route.ts lowercases and trims before
   * recording, and recordHealthConsent lowercases again; a third pass on the
   * client would be a second place to keep in step for no gain.
   */
  email?: string
  /** Which result this is being offered from. Selects the bridge, and is sent with the analytics event. */
  source: ConsultationSource
  /**
   * Whether to show the EatoBiotics Member continuation under the offer.
   *
   * Required rather than defaulted, and stated at every caller. It used to be
   * decided by which of two implementations a surface happened to render,
   * which is how You ended up without it and Mind and Family with it, with
   * nobody having chosen either. A default would put that back: the caller
   * would inherit a decision instead of making one.
   *
   * You is `false` — Phase 2D established that the €49 Consultation is the one
   * commercial action on that page. Mind and Family are `true`, preserving
   * exactly what they render today.
   */
  showMembership: boolean
}

export function PersonalReportCta({
  result,
  email,
  source,
  showMembership,
}: PersonalReportCtaProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Two separate questions, both unticked by default — a pre-ticked box is
  // neither a request nor consent. They were one sentence until this change;
  // bundling a processing consent into a commercial request is what made the
  // consent record quote a statement the buyer had never been shown.
  const [startNow, setStartNow] = useState(false)
  const [healthConsent, setHealthConsent] = useState(false)

  const bridge = BRIDGE[source]

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

    // Fired here, once, for all three contexts. The You result used to own its
    // own capture and Mind and Family had none; `source` is what makes the
    // three distinguishable now that one call serves them all.
    posthog.capture("report_purchase_clicked", {
      tier: "personal",
      source,
      score: result.overall,
      profile_type: result.profile.type,
    })

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
          // any selected add-on (null for the legacy standalone flow). The You
          // result did not send these before this consolidation.
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
      {/* The bridge from the result just read to the decision now being made. */}
      <div className="text-center">
        <p
          className="mb-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--icon-green)" }}
        >
          {bridge.eyebrow}
        </p>
        {/* The product is the Consultation. The question is how it is
          * understood, so it reads as a subhead rather than as the name — a
          * heading here would make "How does your Food System work?" the thing
          * being sold. */}
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Personal Food System Consultation
        </h2>
        <p className="mt-1.5 font-serif text-lg text-muted-foreground">
          How does your Food System work?
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {bridge.body}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border-2 border-[var(--icon-green)]/30 bg-card">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
          }}
        />
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">
                Personal Food System Consultation
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A guided digital process. Educational and non-diagnostic; not a medical
                consultation or diagnosis.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-serif text-4xl font-bold"
                style={{ color: "var(--icon-green)" }}
              >
                €{REPORT_PRICE_EUR}
              </p>
              <p className="text-xs text-muted-foreground">one-time</p>
            </div>
          </div>

          {/* What the Consultation asks about — the shape of it, never the
            * questions themselves and never how many there are. */}
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            We&apos;ll ask about your food, daily rhythm, history, lifestyle and goals.
          </p>

          {/* The Report is the OUTPUT of the Consultation, so the list of what
            * it contains is labelled as what comes after — not as what payment
            * hands over. REPORT_OFFER_FEATURES stays the single source of
            * truth; nothing here is hand-written beside it. */}
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What you receive after the Consultation
          </p>
          <ul className="mb-4 space-y-2.5">
            {REPORT_OFFER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <Check size={14} className="shrink-0" style={{ color: "var(--icon-green)" }} />
                {f}
              </li>
            ))}
          </ul>

          {/* The 30 days are included in a paid purchase, and nothing starts on
            * its own when they end. Said plainly here because "included" on its
            * own has been read as a trial before. */}
          <p className="mb-6 text-xs leading-relaxed text-muted-foreground">
            Includes 30 days of EatoBiotics access. Membership does not start
            automatically.
          </p>

          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Before payment
          </p>
          <div className="space-y-3">
            <HealthConsentCheckbox checked={healthConsent} onChange={setHealthConsent} />
            <ImmediateStartRequest checked={startNow} onChange={setStartNow} />
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading || !healthConsent || !startNow}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Redirecting…
              </>
            ) : (
              <>
                Begin My Food System Consultation — €{REPORT_PRICE_EUR}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

          {/* What actually happens next. Checkout is a one-time Stripe payment
            * whose success returns to the guided questions, and those answers
            * autosave — so this is the sequence, not a promise of a document. */}
          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            After payment you&apos;ll continue into the guided Consultation questions.
            Your answers are saved as you go.
          </p>
        </div>
      </div>

      {showMembership && (
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: "color-mix(in srgb, var(--icon-teal) 6%, transparent)" }}
        >
          <p className="mb-1 text-xs font-semibold text-foreground">
            After your 30 days — continue with EatoBiotics Member
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
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
      )}

      <p className="text-center text-xs text-muted-foreground/60">
        One-time payment · Full refund within 14 days of purchase · Secure checkout via
        Stripe
      </p>
    </div>
  )
}
