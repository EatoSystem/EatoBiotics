import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { DashboardClient } from "@/components/account/dashboard-client"
import { TIER_META } from "@/lib/membership"
import { buildAccountTwin } from "@/lib/agent-loop/account-twin"
import { twinVisualState } from "@/lib/account/twin-visual"
import { TwinHero } from "@/components/account/twin/twin-hero"

export const metadata: Metadata = {
  title: "Account Preview — EatoBiotics",
  robots: "noindex",
}

/* ── Mock content ─────────────────────────────────────────────────── */

const MOCK_PLAN_CONTENT = `Your food system this month is showing real momentum. Your plant diversity has been one of your stronger pillars, but your Live Foods score is pulling down your overall Biotics number — this month, that's your primary focus.

Fermented foods are the fastest lever you have. Adding kefir to your morning routine, swapping one meal to include kimchi or sauerkraut, or making a simple overnight yoghurt with live cultures will meaningfully shift your probiotic score within two to three weeks. Aim for at least one fermented food every day this month.

On the prebiotic side, you're doing well with oats and garlic, but your week-to-week consistency dips on weekends. A simple hack: prep a batch of overnight oats on Friday evening so Saturday morning stays on track. Your diversity score benefits most from variety, so try adding one new plant each week — leeks, asparagus, and Jerusalem artichoke are three high-impact choices.

This month's priority: one fermented food daily and one new plant each week. Track it in your Plate builder and you'll see the numbers move. You're closer to your 70-point target than it might feel right now.`

const MOCK_CHECKIN_CONTENT = `This week your food system data showed a solid upward trend — your average meal score came in at 71, up from 64 the week before. You logged 5 analyses, which is exactly the consistency that drives meaningful change in your microbiome over time. The improvement was driven mainly by better prebiotic variety across your weekday meals.

What improved most was your plant diversity — you hit 9 different plants across the week, which is your best showing in a month. What still needs attention is your fermented food frequency: only 2 out of 7 days included a live food source. That probiotic gap is the single biggest thing holding your overall score below 70.

Your focus for next week: make fermented foods non-negotiable. Pick one — kefir in the morning, yoghurt as a snack, or kimchi with dinner — and lock it into your daily routine before adding anything else. One consistent habit beats five occasional ones every time.`

/* ── Mock biotics profile (same for all tiers — shows live score rings) */

const MOCK_BIOTICS_PROFILE = {
  prebiotic:     32,   // out of 45 → normalises to ~71%
  probiotic:     13,   // out of 25 → normalises to ~52%
  postbiotic:     6,   // out of 15 → normalises to ~40%
  analysisCount:  5,
}

/* ── Shared mock assessments (same for all tiers) ─────────────────── */

const MOCK_ASSESSMENTS = [
  {
    overall_score: 62,
    profile_type: "Emerging Balance",
    sub_scores: {
      diversity: 55,
      feeding: 68,
      adding: 38,
      consistency: 72,
      feeling: 58,
      overall: 62,
    },
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    email_sent: true,
  },
]

const MOCK_PAID_REPORTS = [
  {
    stripe_session_id: "demo_session_full",
    tier: "full",
    pdf_url: null,
    report_json: null,
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    free_scores: { overall: 62, profile: { type: "Emerging Balance" } },
  },
]

/* ── Date helpers ─────────────────────────────────────────────────── */

function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

function monthsFromNow(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d.toISOString()
}

function firstOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function lastMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/* ── Tier metadata ────────────────────────────────────────────────── */

type DemoTier = "free" | "grow" | "restore" | "transform"

// Presentation-only accent colours for the demo. Tier label/price come from the
// canonical TIER_META in lib/membership (single source of truth).
const TIER_COLORS: Record<DemoTier, string> = {
  free:      "var(--icon-lime)",
  grow:      "var(--icon-green)",
  restore:   "var(--icon-teal)",
  transform: "var(--icon-orange)",
}

/* ── Mock profiles per tier ───────────────────────────────────────── */

function getMockData(tier: DemoTier) {
  const base = {
    id: "demo-user",
    email: "sarah@example.com",
    name: "Sarah M.",
    age_bracket: "25–34",
    membership: "early_access" as const,
    referral_code: "SARAHM42",
    referred_by: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    membership_expires_at: null,
    trial_expires_at: null,
  }

  if (tier === "free") {
    return {
      profile: {
        ...base,
        membership_tier: "free" as const,
        membership_status: "inactive" as const,
        membership_started_at: null,
        is_founding_member: false,
        health_goals: [] as string[],
      },
      nextBillingDate: null,
      weeklyCheckin: null,
      monthlyGutPlan: null,
      dailyConsultCount: 0,
      monthlyConsultCount: 0,
      streak: 0,
    }
  }

  if (tier === "grow") {
    return {
      profile: {
        ...base,
        membership_tier: "grow" as const,
        membership_status: "active" as const,
        membership_started_at: monthsAgo(2),
        is_founding_member: false,
        health_goals: [] as string[],
      },
      nextBillingDate: monthsFromNow(1),
      weeklyCheckin: null,
      monthlyGutPlan: null,
      dailyConsultCount: 0,
      monthlyConsultCount: 0,
      streak: 5,
    }
  }

  if (tier === "restore") {
    return {
      profile: {
        ...base,
        membership_tier: "restore" as const,
        membership_status: "active" as const,
        membership_started_at: monthsAgo(1),
        is_founding_member: false,
        health_goals: ["Digestive health and IBS management", "Energy and fatigue reduction"],
      },
      nextBillingDate: monthsFromNow(1),
      weeklyCheckin: null,
      monthlyGutPlan: { content: MOCK_PLAN_CONTENT, month: firstOfMonth() },
      dailyConsultCount: 0,
      monthlyConsultCount: 0,
      streak: 5,
    }
  }

  // transform
  return {
    profile: {
      ...base,
      membership_tier: "transform" as const,
      membership_status: "active" as const,
      membership_started_at: monthsAgo(2),
      is_founding_member: true,
      health_goals: ["Digestive health and IBS management", "Mood and mental clarity"],
    },
    nextBillingDate: monthsFromNow(1),
    weeklyCheckin: { content: MOCK_CHECKIN_CONTENT, week_starting: lastMonday() },
    monthlyGutPlan: { content: MOCK_PLAN_CONTENT, month: firstOfMonth() },
    dailyConsultCount: 1,
    monthlyConsultCount: 8,
    streak: 5,
  }
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function DemoAccountTierPage({
  params,
}: {
  params: Promise<{ tier: string }>
}) {
  const { tier: tierParam } = await params
  const validTiers: DemoTier[] = ["free", "grow", "restore", "transform"]
  if (!validTiers.includes(tierParam as DemoTier)) {
    redirect("/demo/account")
  }

  const tier = tierParam as DemoTier
  const meta = TIER_META[tier]
  const { profile, nextBillingDate, weeklyCheckin, monthlyGutPlan, dailyConsultCount, monthlyConsultCount, streak } =
    getMockData(tier)
  const dailyPromptIndex = new Date().getDay()

  /* ── Living Twin (demo) — assembled from Sarah M.'s sample data so the account
       Twin can be previewed + tested on every tier. ── */
  const { twin: demoTwin, feed: demoFeed } = await buildAccountTwin({
    score: 62,
    previousScore: 54,
    profileType: "Emerging Balance",
    biotics: { prebiotic: 71, probiotic: 52, postbiotic: 40 },
    streak,
    meals: [
      { name: "Chicken, roasted veg & kefir", score: 81, prebiotic: 75, probiotic: 65, postbiotic: 58, createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString() },
      { name: "Lentil wrap with mixed greens", score: 74, prebiotic: 72, probiotic: 8, postbiotic: 42, createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString() },
      { name: "Greek yoghurt, berries & oats", score: 69, prebiotic: 55, probiotic: 58, postbiotic: 44, createdAt: new Date(Date.now() - 30 * 3_600_000).toISOString() },
      { name: "Mackerel, kimchi & asparagus", score: 71, prebiotic: 72, probiotic: 18, postbiotic: 41, createdAt: new Date(Date.now() - 50 * 3_600_000).toISOString() },
    ],
  })
  const demoTwinVisual = twinVisualState(demoTwin)

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {/* Demo banner */}
      <div className="border-b px-4 py-2.5" style={{ background: `color-mix(in srgb, ${TIER_COLORS[tier]} 10%, var(--background))`, borderColor: `color-mix(in srgb, ${TIER_COLORS[tier]} 25%, transparent)` }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/demo/account" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={12} /> All tiers
            </Link>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <p className="text-xs font-semibold" style={{ color: TIER_COLORS[tier] }}>
              Previewing <strong>{meta.label}</strong> ({meta.price}) — sample data for Sarah M.
            </p>
          </div>
          <Link
            href="/assessment"
            className="shrink-0 text-xs font-semibold hover:underline"
            style={{ color: TIER_COLORS[tier] }}
          >
            Get your real account →
          </Link>
        </div>
      </div>

      <div className="pt-10">
        <div className="pb-2">
          <TwinHero twin={demoTwin} visual={demoTwinVisual} feed={demoFeed} detailHref="/demo/account/twin" />
        </div>
        <DashboardClient
          profile={profile}
          assessments={MOCK_ASSESSMENTS}
          paidReports={MOCK_PAID_REPORTS}
          plateData={null}
          nextBillingDate={nextBillingDate}
          weeklyCheckin={weeklyCheckin}
          monthlyGutPlan={monthlyGutPlan}
          dailyConsultCount={dailyConsultCount}
          monthlyConsultCount={monthlyConsultCount}
          bioticsProfile={tier === "free" ? null : MOCK_BIOTICS_PROFILE}
          streak={streak}
          dailyPromptIndex={dailyPromptIndex}
          consultHref={tier === "transform" ? "/demo/account/consult" : undefined}
        />
      </div>
    </div>
  )
}
