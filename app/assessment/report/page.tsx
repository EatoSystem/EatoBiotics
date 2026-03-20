import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Stripe from "stripe"
import { FullReportClient } from "@/components/assessment/full-report-client"

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

    // Extract tier from client_reference_id (base64 encoded JSON)
    let tier: "starter" | "full" | "premium" = "full"
    try {
      if (session.client_reference_id) {
        const decoded = JSON.parse(
          Buffer.from(session.client_reference_id, "base64").toString("utf-8")
        )
        if (decoded.tier === "starter" || decoded.tier === "full" || decoded.tier === "premium") {
          tier = decoded.tier
        }
      }
    } catch {
      // Fallback to full if decode fails
    }

    return <FullReportClient tier={tier} />
  } catch {
    redirect("/assessment")
  }
}
