import type { Metadata } from "next"
import { redirect, unstable_rethrow } from "next/navigation"
import { stripe } from "@/lib/stripe-server"
import { FullReportClient } from "@/components/assessment/full-report-client"
import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { DeliveryPendingNotice } from "@/components/assessment/delivery-pending-notice"
import { getSupabase } from "@/lib/supabase"
import { getUser } from "@/lib/supabase-server"
import { getUserMembershipTier } from "@/lib/membership"
import type { DeepReport } from "@/lib/claude-report"
import { reportViewState } from "@/lib/report-status"
import {
  displayTierForReport,
  getPaidReportSummaryFromSession,
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

  // Dev mode: if Stripe isn't configured, allow direct access for UI testing (defaults to "full")
  if (!process.env.STRIPE_SECRET_KEY) {
    return <FullReportClient tier="full" />
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (!isCheckoutSessionSettled(session)) {
      redirect("/assessment")
    }

    const summary = getPaidReportSummaryFromSession(session)
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
    const supabase = getSupabase()
    if (supabase) {
      const { data } = await supabase
        .from("deep_assessments")
        .select("status, report_json, pdf_url")
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
        return (
          <>
            <DeliveryPendingNotice viewState={viewState} />
            <PaidReportClient
              tier={displayTier}
              sessionId={session_id}
              reportJson={reportJson as DeepReport}
              freeScores={freeScores as unknown as Parameters<typeof PaidReportClient>[0]["freeScores"]}
              membershipTier={membershipTier}
            />
          </>
        )
      }

      // Deep assessment not done yet — redirect to complete it first
      redirect(`/assessment/deep?session_id=${session_id}`)
    }

    // Supabase not configured (dev mode without DB) — fall through to existing client
    const displayTier2 = displayTierForReport(summary.tier)
    return <FullReportClient tier={displayTier2} />
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
