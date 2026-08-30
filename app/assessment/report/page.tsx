import type { Metadata } from "next"
import { redirect, unstable_rethrow } from "next/navigation"
import { stripe } from "@/lib/stripe-server"
import { FullReportClient } from "@/components/assessment/full-report-client"
import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { PaidReportUnavailable } from "@/components/assessment/paid-report-unavailable"
import { DeliveryPendingNotice } from "@/components/assessment/delivery-pending-notice"
import { getSupabase } from "@/lib/supabase"
import { getUser } from "@/lib/supabase-server"
import { getUserMembershipTier } from "@/lib/membership"
import type { DeepReport } from "@/lib/claude-report"
import { reportViewState } from "@/lib/report-status"
import { isUnverifiedPaidFlowAllowed } from "@/lib/paid-flow-policy"
import { freshPdfUrl } from "@/lib/report/pdf-access"
import {
  displayTierForReport,
  resolvePaidReportSummary,
  isCheckoutSessionSettled,
} from "@/lib/paid-report-session"

export const metadata: Metadata = {
  title: "Your EatoBiotics Report",
  description:
    "Your personalised food system report — tailored food recommendations and your action plan.",
}

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function ReportPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  // No session — redirect back to assessment
  if (!session_id) {
    redirect("/assessment")
  }

  // ── Unverified development flow ───────────────────────────────────────
  // Was `if (!process.env.STRIPE_SECRET_KEY)`, which rendered the paid report
  // UI whenever the secret was absent and short-circuited the settled-session
  // check below. Now the shared policy: explicit opt-in AND a provably
  // non-production runtime.
  if (isUnverifiedPaidFlowAllowed()) {
    return <FullReportClient tier="full" />
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (!isCheckoutSessionSettled(session)) {
      redirect("/assessment")
    }

    // Hoisted above the resolve: the summary now lives in paid_report_intents
    // and is addressed by the token in Stripe metadata, so reading it needs the
    // client that used to be created further down for the deep_assessments read.
    const supabase = getSupabase()
    const summary = await resolvePaidReportSummary(session, supabase)
    if (!summary) redirect("/assessment")

    const freeScores = {
      overall: summary.overall,
      subScores: summary.subScores,
      profile: {
        ...summary.profile,
        color: summary.profile.color ?? "var(--icon-green)",
      },
    }

    // Get user membership tier for the CTA
    const user = await getUser().catch(() => null)
    const membershipTier = user ? await getUserMembershipTier(user.id).catch(() => "free") : "free"

    // Check if deep assessment is complete in Supabase
    if (supabase) {
      const { data } = await supabase
        .from("deep_assessments")
        .select("status, report_json, pdf_url, pdf_status")
        .eq("stripe_session_id", session_id)
        .single()

      const displayTier = displayTierForReport(summary.tier)

      // A buyer whose report exists always sees their report — a "partial" row
      // (report saved, PDF or email delivery failed) must never bounce them
      // back into the questionnaire.
      //
      // `reportJson` is hoisted so the truthiness check narrows it for the cast
      // below. `viewState !== "resume_questionnaire"` already implies it exists,
      // so the extra condition is a runtime no-op — but TS cannot see that, and
      // the alternative is a `!` assertion. app/auth/callback/page.tsx carries
      // the note explaining why that shortcut is not worth taking here.
      const reportJson = data?.report_json
      const viewState = reportViewState(data?.status, Boolean(reportJson))

      if (reportJson && viewState !== "resume_questionnaire") {
        // Minted fresh on every authorised view — this branch is only reachable
        // after Stripe confirmed the checkout session is settled, so the signed
        // URL never exists for an unauthorised or mismatched session. The
        // persisted pdf_url is deliberately NOT reused: it is a 7-day signed
        // URL from delivery time and may be long expired; the object path is
        // deterministic, so freshPdfUrl re-signs it instead.
        const pdfUrl = await freshPdfUrl(supabase, session_id, data)

        return (
          <>
            <DeliveryPendingNotice viewState={viewState} />
            <PaidReportClient
              tier={displayTier}
              sessionId={session_id}
              reportJson={reportJson as DeepReport}
              freeScores={freeScores as unknown as Parameters<typeof PaidReportClient>[0]["freeScores"]}
              membershipTier={membershipTier}
              pdfUrl={pdfUrl}
              pdfStatus={data?.pdf_status ?? null}
            />
          </>
        )
      }

      // Deep assessment not done yet — redirect to complete it first
      redirect(`/assessment/deep?session_id=${session_id}`)
    }

    // Supabase unavailable. Reaching here means Stripe already confirmed this
    // checkout is settled — this person paid — so the one thing we must not do
    // is hand them the generic report. `FullReportClient` renders tier-shaped
    // content with none of their answers in it; showing it would look like
    // fulfilment while quietly substituting someone else's report for theirs.
    //
    // Their real report may well exist and be perfectly fine; we simply cannot
    // read it right now. So this says exactly that and invites a retry, rather
    // than redirecting them into the questionnaire (which implies their purchase
    // did not register) or rendering a substitute.
    return <PaidReportUnavailable />
  } catch (error) {
    // redirect() interrupts rendering by throwing a NEXT_REDIRECT-digest Error.
    // A bare `catch {}` swallowed that silently and ran the fallback below
    // instead — so the redirect above (the #129 resume-questionnaire redirect)
    // never actually happened. unstable_rethrow lets Next's own control-flow
    // errors through untouched; only a genuine error reaches the fallback.
    unstable_rethrow(error)
    redirect("/assessment")
  }
}
