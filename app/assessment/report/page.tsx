import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { stripe } from "@/lib/stripe-server"
import { FullReportClient } from "@/components/assessment/full-report-client"
import { PaidReportClient } from "@/components/assessment/paid-report-client"
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
      const viewState = reportViewState(data?.status, Boolean(data?.report_json))

      if (viewState !== "resume_questionnaire") {
        return (
          <>
            {viewState === "view_delivery_pending" && (
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
            )}
            <PaidReportClient
              tier={displayTier}
              sessionId={session_id}
              reportJson={data!.report_json as DeepReport}
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
  } catch {
    redirect("/assessment")
  }
}
