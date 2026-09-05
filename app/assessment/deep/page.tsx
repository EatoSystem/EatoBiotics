import type { Metadata } from "next"
import { redirect, unstable_rethrow } from "next/navigation"
import { stripe } from "@/lib/stripe-server"
import { getSupabase } from "@/lib/supabase"
import { DeepAssessmentClient } from "@/components/assessment/deep/deep-assessment-client"
import type { DeepQuestion, DeepAnswers } from "@/lib/deep-assessment"
import { resolvePaidReportSummary, isCheckoutSessionSettled } from "@/lib/paid-report-session"
import { reportViewState } from "@/lib/report-status"
import { TrackConversion } from "@/components/analytics/track-conversion"
import { isUnverifiedPaidFlowAllowed } from "@/lib/paid-flow-policy"
import { DeterministicConsultationClient } from "@/components/assessment/consultation/deterministic-consultation-client"
import { asAddonType } from "@/lib/addon-types"

export const metadata: Metadata = {
  title: "Your Food System Consultation — EatoBiotics",
  description:
    "A guided digital process that produces your Personal Food System Report. Educational and non-diagnostic.",
}

interface Props {
  searchParams: Promise<{
    session_id?: string
    demo?: string
    tier?: string
    /** Phase 3B preview. Only honoured together with `demo=true` — see below. */
    deterministic?: string
    foundation?: string
    lens?: string
  }>
}

// Mock scores used for demo mode — matches DEMO_RESULT in demo-client.tsx
const DEMO_FREE_SCORES = {
  overall: 58,
  subScores: { prebiotics: 62, probiotics: 38, postbiotics: 67, feed: 62, seed: 38, heal: 67 },
  profile: {
    type: "Emerging Balance",
    tagline: "The building blocks are there. Consistency is the next step.",
    description:
      "You have awareness and some strong habits, but they haven't fully integrated into a reliable daily pattern yet.",
    color: "var(--icon-lime)",
  },
}

export default async function DeepAssessmentPage({ searchParams }: Props) {
  const params = await searchParams
  const { session_id, demo, tier: tierParam, deterministic, foundation, lens } = params

  // ── Demo mode bypass (no Stripe required) ─────────────────────────────
  if (demo === "true") {
    /* ── Phase 3B deterministic Consultation preview ─────────────────────
     *
     * Nested INSIDE the existing `demo === "true"` branch on purpose, rather
     * than being its own top-level check. That single fact is what makes the
     * preview unreachable from checkout: `?deterministic=true` alone does
     * nothing, and no paid path — Stripe success URL, resume link, email —
     * ever carries `demo=true`. Widening this to a top-level check would turn
     * a preview into a production backdoor.
     *
     * It renders no Stripe data, needs no database row, generates no Report
     * and saves nothing. The real paid flow below is untouched. */
    if (deterministic === "true") {
      return (
        <DeterministicConsultationClient
          context={{
            foundation: foundation === "family" ? "family" : "you",
            // Entitlement stays with the canonical add-on narrowing: an
            // unrecognised value becomes null rather than a string nothing
            // downstream can render.
            lens: asAddonType(lens),
          }}
        />
      )
    }

    const demoTier =
      tierParam === "starter" || tierParam === "full" || tierParam === "premium"
        ? tierParam
        : "full"
    return (
      <DeepAssessmentClient
        sessionId={`demo-${demoTier}`}
        tier={demoTier}
        freeScores={DEMO_FREE_SCORES}
        savedQuestions={null}
        savedAnswers={null}
      />
    )
  }

  // ── Real flow ──────────────────────────────────────────────────────────
  if (!session_id) {
    redirect("/assessment")
  }

  // ── Unverified development flow ───────────────────────────────────────
  // Was `if (!process.env.STRIPE_SECRET_KEY)`, which sat BEFORE the
  // isCheckoutSessionSettled check below — so a missing secret rendered the
  // paid Consultation UI and the settled check never ran. Same shared policy as
  // the API routes: explicit opt-in AND a provably non-production runtime, with
  // Vercel production and unknown runtimes denied. The `?demo=true` path above
  // is unaffected and stays explicit.
  if (isUnverifiedPaidFlowAllowed()) {
    return (
      <DeepAssessmentClient
        sessionId={session_id}
        tier="full"
        freeScores={{
          overall: 58,
          subScores: { prebiotics: 58, probiotics: 45, postbiotics: 65, feed: 58, seed: 45, heal: 65 },
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
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (!isCheckoutSessionSettled(session)) {
      redirect("/assessment")
    }

    const supabase = getSupabase()
    const summary = await resolvePaidReportSummary(session, supabase)
    if (!summary) redirect("/assessment")

    const { tier, overall, subScores } = summary
    const profile = {
      ...summary.profile,
      color: summary.profile.color ?? "var(--icon-green)",
    }

    // Check Supabase for existing deep assessment progress
    let savedQuestions: DeepQuestion[] | null = null
    let savedAnswers: DeepAnswers | null = null

    if (supabase) {
      const { data } = await supabase
        .from("deep_assessments")
        .select("status, questions, answers, report_json")
        .eq("stripe_session_id", session_id)
        .single()

      if (data) {
        // A buyer whose report already exists (complete OR partial-delivery)
        // goes to their report — never back into the questionnaire.
        if (reportViewState(data.status, Boolean(data.report_json)) !== "resume_questionnaire") {
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
      <>
        <TrackConversion
          event="report_purchased"
          dedupeKey={`report_purchased:${session_id}`}
          properties={{ tier, session_id, overall_score: overall }}
        />
        <DeepAssessmentClient
          sessionId={session_id}
          tier={tier}
          freeScores={{ overall, subScores, profile }}
          savedQuestions={savedQuestions}
          savedAnswers={savedAnswers}
        />
      </>
    )
  } catch (error) {
    // redirect() interrupts rendering by throwing a NEXT_REDIRECT-digest Error.
    // A bare `catch {}` swallowed that silently and ran the fallback below
    // instead — so the redirect above (the #129 send-to-existing-report
    // redirect) never actually happened. unstable_rethrow lets Next's own
    // control-flow errors through untouched; only a genuine error reaches the
    // fallback.
    unstable_rethrow(error)
    redirect("/assessment")
  }
}
