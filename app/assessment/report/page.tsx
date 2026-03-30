import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Stripe from "stripe"
import { FullReportClient } from "@/components/assessment/full-report-client"
import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { getSupabase } from "@/lib/supabase"
import { getUser } from "@/lib/supabase-server"
import { getUserMembershipTier } from "@/lib/membership"
import type { DeepReport } from "@/lib/claude-report"

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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status !== "paid") {
      redirect("/assessment")
    }

    // Extract tier + free scores from client_reference_id (base64 encoded JSON)
    let tier: "starter" | "full" | "premium" = "full"
    let freeScores: {
      overall: number
      subScores: { diversity: number; feeding: number; adding: number; consistency: number; feeling: number }
      profile: { type: string; tagline: string; description: string; color: string }
    } | undefined

    try {
      if (session.client_reference_id) {
        const decoded = JSON.parse(
          Buffer.from(session.client_reference_id, "base64").toString("utf-8")
        )
        if (decoded.tier === "starter" || decoded.tier === "full" || decoded.tier === "premium") {
          tier = decoded.tier
        }
        if (decoded.overall && decoded.subScores && decoded.profile) {
          freeScores = {
            overall: decoded.overall,
            subScores: decoded.subScores,
            profile: decoded.profile,
          }
        }
      }
    } catch {
      // Fallback to full if decode fails
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

      if (data?.status === "complete" && data.report_json) {
        // Deep assessment done — render paid report from saved data (no new Claude call)
        return (
          <PaidReportClient
            tier={tier}
            sessionId={session_id}
            reportJson={data.report_json as DeepReport}
            pdfUrl={data.pdf_url ?? null}
            freeScores={freeScores}
            membershipTier={membershipTier}
          />
        )
      }

      // Deep assessment not done yet — redirect to complete it first
      redirect(`/assessment/deep?session_id=${session_id}`)
    }

    // Supabase not configured (dev mode without DB) — fall through to existing client
    return <FullReportClient tier={tier} />
  } catch {
    redirect("/assessment")
  }
}
