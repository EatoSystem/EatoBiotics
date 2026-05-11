import type { Metadata } from "next"
import Link from "next/link"
import { DashboardClient } from "@/components/account/dashboard-client"
import type { GutHealthStory } from "@/app/account/story/story-client"

export const metadata: Metadata = {
  title: "Account Dev Sandbox — EatoBiotics",
  description: "Live development and testing environment for the EatoBiotics account dashboard.",
  robots: "noindex",
}

/* ────────────────────────────────────────────────────────────────────────
   Mock content — richer than the public demo, for testing all UI states
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_PLAN_CONTENT = `Your food system this month is showing real momentum. Your plant diversity has been one of your stronger pillars, but your Live Foods score is pulling down your overall Biotics number — this month, that's your primary focus.

Fermented foods are the fastest lever you have. Adding kefir to your morning routine, swapping one meal to include kimchi or sauerkraut, or making a simple overnight yoghurt with live cultures will meaningfully shift your probiotic score within two to three weeks. Aim for at least one fermented food every day this month.

On the prebiotic side, you're doing well with oats and garlic, but your week-to-week consistency dips on weekends. A simple hack: prep a batch of overnight oats on Friday evening so Saturday morning stays on track. Your diversity score benefits most from variety, so try adding one new plant each week — leeks, asparagus, and Jerusalem artichoke are three high-impact choices.

This month's priority: one fermented food daily and one new plant each week. Track it in your Plate builder and you'll see the numbers move. You're closer to your 70-point target than it might feel right now.`

const MOCK_STORY: GutHealthStory = {
  title: "Your Food System Story",
  subtitle: "From inconsistent habits to a thriving food system — here's what your data reveals",
  sections: [
    {
      heading: "Where You Started",
      content:
        "Six weeks ago your food system had real gaps. Plant diversity was limited to a handful of staples, fermented foods barely featured, and meal timing was irregular. Your Emerging Balance score of 62 reflected a gut that had potential — but needed direction.",
    },
    {
      heading: "What Changed",
      content:
        "The turning point was consistency. You added overnight oats as a daily anchor — that alone lifted your prebiotic score by 8 points over three weeks. Kimchi at dinner twice a week started moving the probiotic needle. Small, repeatable actions compounded into measurable progress.",
    },
    {
      heading: "Your Strongest Pillar",
      content:
        "Prebiotics are your foundation. Oats, garlic, bananas, and onions feature regularly across your meals — this steady stream of fibre is feeding your beneficial bacteria and showing up in your consistency scores. It's a genuine strength to build on.",
    },
    {
      heading: "The Gap to Close",
      content:
        "Probiotics remain your biggest opportunity. Your live food intake is still irregular — averaging only 2 days per week. Getting that to 5 or 6 days is the single change most likely to push your overall score past 70. Kefir, yoghurt, or sauerkraut daily would do it.",
    },
    {
      heading: "What's Next",
      content:
        "At your current trajectory — adding one new plant food per week and increasing fermented food frequency — you're on track to reach a Strong Foundation score within 8 weeks. Your gut system is responding. Keep the consistency, and the numbers will follow.",
    },
  ],
  closingThought:
    "Your gut health is a system, not a destination. Every consistent choice you make today is compounding quietly in your favour.",
  generatedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  mealCount: 23,
}

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────── */

function monthsAgo(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString()
}
function monthsFromNow(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString()
}
function firstOfMonth() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString()
}
function lastMonday() {
  const d = new Date()
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - diff); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/* ────────────────────────────────────────────────────────────────────────
   Mock data — uses "member" tier (the live production tier)
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_PROFILE = {
  id: "demo-live-user",
  email: "dev@eatobiotics.com",
  name: "Dev Account",
  age_bracket: "25–34",
  membership: "early_access" as const,
  referral_code: "DEVTEST1",
  referred_by: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  membership_expires_at: null,
  trial_expires_at: null,
  membership_tier: "member" as const,
  membership_status: "active" as const,
  membership_started_at: monthsAgo(1),
  is_founding_member: false,
  health_goals: ["Digestive health and IBS management", "Energy and fatigue reduction"],
}

const MOCK_ASSESSMENTS = [
  {
    overall_score: 62,
    profile_type: "Emerging Balance",
    sub_scores: { diversity: 55, feeding: 68, adding: 38, consistency: 72, feeling: 58, overall: 62 },
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    email_sent: true,
  },
  {
    overall_score: 54,
    profile_type: "Developing System",
    sub_scores: { diversity: 48, feeding: 60, adding: 32, consistency: 65, feeling: 52, overall: 54 },
    created_at: new Date(Date.now() - 42 * 86_400_000).toISOString(),
    email_sent: true,
  },
]

const MOCK_PAID_REPORTS = [
  {
    stripe_session_id: "demo_session_personal",
    tier: "full",
    pdf_url: null,
    report_json: null,
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    free_scores: { overall: 62, profile: { type: "Emerging Balance" } },
  },
]

const MOCK_BIOTICS_PROFILE = {
  prebiotic: 32,
  probiotic: 13,
  postbiotic: 6,
  analysisCount: 5,
}

const MOCK_PATTERNS = {
  bestDay: "Wednesday",
  trendDirection: "up" as const,
  bestStreak: 7,
  analysisCount: 23,
}

/* ────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────── */

export default function AccountYouLivePage() {
  const dailyPromptIndex = new Date().getDay()

  return (
    <div className="min-h-screen bg-background pt-[57px]">

      {/* ── Dev banner ── */}
      <div
        className="border-b px-4 py-2.5"
        style={{
          background: "color-mix(in srgb, var(--icon-orange) 8%, var(--background))",
          borderColor: "color-mix(in srgb, var(--icon-orange) 25%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: "var(--icon-orange)" }}
            >
              Dev
            </span>
            <p className="text-xs text-muted-foreground">
              Live development sandbox — testing with <strong>Member</strong> tier (€24.99/mo) and sample data.
            </p>
          </div>
          <Link
            href="/account-you"
            className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Public demo
          </Link>
        </div>
      </div>

      {/* ── Dashboard ── */}
      <div className="pt-10">
        <DashboardClient
          profile={MOCK_PROFILE}
          assessments={MOCK_ASSESSMENTS}
          paidReports={MOCK_PAID_REPORTS}
          plateData={null}
          nextBillingDate={monthsFromNow(1)}
          weeklyCheckin={{ content: `This week your food system data showed a solid upward trend — your average meal score came in at 71, up from 64 the week before. You logged 5 analyses, which is exactly the consistency that drives meaningful change in your microbiome over time.\n\nWhat improved most was your plant diversity — you hit 9 different plants across the week, your best showing in a month. What still needs attention is your fermented food frequency: only 2 out of 7 days included a live food source.\n\nYour focus for next week: make fermented foods non-negotiable. Pick one — kefir in the morning, yoghurt as a snack, or kimchi with dinner — and lock it in before adding anything else.`, week_starting: lastMonday() }}
          monthlyGutPlan={{ content: MOCK_PLAN_CONTENT, month: firstOfMonth() }}
          dailyConsultCount={0}
          monthlyConsultCount={0}
          bioticsProfile={MOCK_BIOTICS_PROFILE}
          streak={5}
          dailyPromptIndex={dailyPromptIndex}
          pastConsultations={[]}
          patterns={MOCK_PATTERNS}
          hasMealPlan={false}
          latestMonthlyReview={null}
          storyLastUpdated={new Date(Date.now() - 3 * 86_400_000).toISOString()}
          existingStory={MOCK_STORY}
        />
      </div>

    </div>
  )
}
