import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Stripe from "stripe"
import { getSupabase } from "@/lib/supabase"
import { DeepAssessmentClient } from "@/components/assessment/deep/deep-assessment-client"
import type { DeepQuestion, DeepAnswers } from "@/lib/deep-assessment"

export const metadata: Metadata = {
  title: "Your Deep Assessment — EatoBiotics",
  description: "Complete your personalised deep assessment to unlock your full report.",
}

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function DeepAssessmentPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect("/assessment")
  }

  // Dev mode: no Stripe configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return (
      <DeepAssessmentClient
        sessionId={session_id}
        tier="full"
        freeScores={{
          overall: 58,
          subScores: {
            diversity: 55,
            feeding: 60,
            adding: 45,
            consistency: 65,
            feeling: 65,
          },
          profile: {
            type: "The Aware Optimiser",
            tagline: "You understand the basics but haven't yet built the habits to match.",
            description: "You're aware of what good eating looks like, but consistency is the gap.",
            color: "var(--icon-yellow)",
          },
        }}
        savedQuestions={null}
        savedAnswers={null}
      />
    )
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status !== "paid") {
      redirect("/assessment")
    }

    // Decode client_reference_id — base64 JSON with { overall, subScores, profile, tier }
    let tier: "starter" | "full" | "premium" = "full"
    let overall = 58
    let subScores = {
      diversity: 55,
      feeding: 60,
      adding: 45,
      consistency: 65,
      feeling: 65,
    }
    let profile = {
      type: "The Aware Optimiser",
      tagline: "You understand the basics but haven't yet built the habits to match.",
      description: "You're aware of what good eating looks like, but consistency is the gap.",
      color: "var(--icon-yellow)",
    }

    try {
      if (session.client_reference_id) {
        const decoded = JSON.parse(
          Buffer.from(session.client_reference_id, "base64").toString("utf-8")
        )
        if (decoded.tier === "starter" || decoded.tier === "full" || decoded.tier === "premium") {
          tier = decoded.tier
        }
        if (typeof decoded.overall === "number") overall = decoded.overall
        if (decoded.subScores) subScores = decoded.subScores
        if (decoded.profile) profile = decoded.profile
      }
    } catch {
      // Fallback to defaults if decode fails
    }

    // Check Supabase for existing deep assessment progress
    let savedQuestions: DeepQuestion[] | null = null
    let savedAnswers: DeepAnswers | null = null

    const supabase = getSupabase()
    if (supabase) {
      const { data } = await supabase
        .from("deep_assessments")
        .select("status, questions, answers")
        .eq("session_id", session_id)
        .single()

      if (data) {
        if (data.status === "complete") {
          redirect(`/assessment/report?session_id=${session_id}`)
        }
        if (data.questions) {
          savedQuestions = data.questions as DeepQuestion[]
        }
        if (data.answers) {
          savedAnswers = data.answers as DeepAnswers
        }
      }
    }

    return (
      <DeepAssessmentClient
        sessionId={session_id}
        tier={tier}
        freeScores={{ overall, subScores, profile }}
        savedQuestions={savedQuestions}
        savedAnswers={savedAnswers}
      />
    )
  } catch {
    redirect("/assessment")
  }
}
