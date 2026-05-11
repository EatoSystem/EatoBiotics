import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { DashboardClient } from "@/components/account/dashboard-client"
import type { GutHealthStory } from "@/app/account/story/story-client"

export const metadata: Metadata = {
  title: "Account Preview — EatoBiotics",
  description: "Explore the EatoBiotics membership dashboard with sample data.",
}

/* ────────────────────────────────────────────────────────────────────────
   Mock content
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_PLAN_CONTENT = `Your food system this month is showing real momentum. Your plant diversity has been one of your stronger pillars, but your Live Foods score is pulling down your overall Biotics number — this month, that's your primary focus.

Fermented foods are the fastest lever you have. Adding kefir to your morning routine, swapping one meal to include kimchi or sauerkraut, or making a simple overnight yoghurt with live cultures will meaningfully shift your probiotic score within two to three weeks. Aim for at least one fermented food every day this month.

On the prebiotic side, you're doing well with oats and garlic, but your week-to-week consistency dips on weekends. A simple hack: prep a batch of overnight oats on Friday evening so Saturday morning stays on track. Your diversity score benefits most from variety, so try adding one new plant each week — leeks, asparagus, and Jerusalem artichoke are three high-impact choices.

This month's priority: one fermented food daily and one new plant each week. Track it in your Plate builder and you'll see the numbers move. You're closer to your 70-point target than it might feel right now.`

const MOCK_CHECKIN_CONTENT = `This week your food system data showed a solid upward trend — your average meal score came in at 71, up from 64 the week before. You logged 5 analyses, which is exactly the consistency that drives meaningful change in your microbiome over time. The improvement was driven mainly by better prebiotic variety across your weekday meals.

What improved most was your plant diversity — you hit 9 different plants across the week, which is your best showing in a month. What still needs attention is your fermented food frequency: only 2 out of 7 days included a live food source. That probiotic gap is the single biggest thing holding your overall score below 70.

Your focus for next week: make fermented foods non-negotiable. Pick one — kefir in the morning, yoghurt as a snack, or kimchi with dinner — and lock it into your daily routine before adding anything else. One consistent habit beats five occasional ones every time.`

const MOCK_STORY: GutHealthStory = {
  title: "Sarah's Gut Health Story",
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
  closingThought: "Your gut health is a system, not a destination. Every consistent choice you make today is compounding quietly in your favour.",
  generatedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  mealCount: 23,
}

/* ────────────────────────────────────────────────────────────────────────
   Mock biotics profile
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_BIOTICS_PROFILE = {
  prebiotic: 32,      // out of 45
  probiotic: 13,      // out of 25
  postbiotic: 6,      // out of 15
  analysisCount: 5,
}

/* ────────────────────────────────────────────────────────────────────────
   Mock assessments — multiple entries to show history / progress
   ──────────────────────────────────────────────────────────────────────── */

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

const MOCK_MIND_ASSESSMENTS = [
  {
    overall_score: 58,
    profile_type: "Emerging Balance",
    sub_scores: { diversity: 52, feeding: 61, adding: 40, consistency: 68, feeling: 55, overall: 58 },
    created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    email_sent: false,
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

/* ────────────────────────────────────────────────────────────────────────
   Mock past consultations (Transform tier)
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_CONSULTATIONS = [
  {
    id: "demo-consult-1",
    turn_count: 6,
    created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    summary: "Discussed strategies for increasing fermented food intake and managing energy dips after lunch.",
    messages: [
      { role: "user",      content: "I keep forgetting to eat fermented foods — any easy ways to build the habit?",                                         turn: 1 },
      { role: "assistant", content: "The easiest anchor is to attach it to something you already do consistently. If you have breakfast every morning, add a small kefir or yoghurt alongside it — it takes 10 seconds and requires zero decision-making. The habit attaches itself to your existing routine.",  turn: 1 },
      { role: "user",      content: "That makes sense. I also get a big energy dip around 2pm — could that be gut related?",                               turn: 2 },
      { role: "assistant", content: "Absolutely. Post-lunch energy dips are often driven by blood sugar fluctuations, which your gut microbiome has a significant role in regulating. Meals high in refined carbs spike glucose and trigger a crash. Adding more fibre and fermented foods to lunch — think a salad with kimchi or a legume base — slows glucose absorption and smooths the curve.", turn: 2 },
    ],
  },
  {
    id: "demo-consult-2",
    turn_count: 4,
    created_at: new Date(Date.now() - 9 * 86_400_000).toISOString(),
    summary: "Reviewed weekly check-in results and discussed how to improve plant diversity on weekends.",
    messages: [
      { role: "user",      content: "My weekend scores always drop. I eat out more on weekends — how do I keep my score up?",                             turn: 1 },
      { role: "assistant", content: "Eating out is actually a great opportunity for diversity if you know what to look for. Most restaurants have options you can nudge toward gut health: swap fries for a side salad, pick dishes with pulses or roasted vegetables, and ask for sourdough instead of white bread. You don't have to eat perfectly — you just have to eat better than you would have otherwise.", turn: 1 },
    ],
  },
]

/* ────────────────────────────────────────────────────────────────────────
   Mock patterns (Restore+ tiers)
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_PATTERNS = {
  bestDay: "Wednesday",
  trendDirection: "up" as const,
  bestStreak: 7,
  analysisCount: 23,
}

/* ────────────────────────────────────────────────────────────────────────
   Date helpers
   ──────────────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────────────────
   Tier metadata
   ──────────────────────────────────────────────────────────────────────── */

const TIER_META = {
  free:      { label: "Free",      price: "Free",     color: "var(--icon-lime)",   gradient: "linear-gradient(90deg, var(--icon-lime), #56C135)" },
  grow:      { label: "Grow",      price: "€9.99/mo", color: "var(--icon-green)",  gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  restore:   { label: "Restore",   price: "€49/mo",   color: "var(--icon-teal)",   gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  transform: { label: "Transform", price: "€99/mo",   color: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow), var(--icon-orange))" },
}

type DemoTier = keyof typeof TIER_META

/* ────────────────────────────────────────────────────────────────────────
   Per-tier mock data
   ──────────────────────────────────────────────────────────────────────── */

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
      profile: { ...base, membership_tier: "free" as const, membership_status: "inactive" as const, membership_started_at: null, is_founding_member: false, health_goals: [] as string[] },
      nextBillingDate:      null,
      weeklyCheckin:        null,
      monthlyGutPlan:       null,
      dailyConsultCount:    0,
      monthlyConsultCount:  0,
      streak:               0,
      patterns:             null,
      pastConsultations:    [],
      hasMealPlan:          false,
      latestMonthlyReview:  null,
      storyLastUpdated:     null,
      existingStory:        null,
    }
  }

  if (tier === "grow") {
    return {
      profile: { ...base, membership_tier: "grow" as const, membership_status: "active" as const, membership_started_at: monthsAgo(2), is_founding_member: false, health_goals: [] as string[] },
      nextBillingDate:      monthsFromNow(1),
      weeklyCheckin:        null,
      monthlyGutPlan:       null,
      dailyConsultCount:    0,
      monthlyConsultCount:  0,
      streak:               5,
      patterns:             null,
      pastConsultations:    [],
      hasMealPlan:          false,
      latestMonthlyReview:  null,
      storyLastUpdated:     null,
      existingStory:        null,
    }
  }

  if (tier === "restore") {
    return {
      profile: { ...base, membership_tier: "restore" as const, membership_status: "active" as const, membership_started_at: monthsAgo(1), is_founding_member: false, health_goals: ["Digestive health and IBS management", "Energy and fatigue reduction"] },
      nextBillingDate:      monthsFromNow(1),
      weeklyCheckin:        null,
      monthlyGutPlan:       { content: MOCK_PLAN_CONTENT, month: firstOfMonth() },
      dailyConsultCount:    0,
      monthlyConsultCount:  0,
      streak:               5,
      patterns:             MOCK_PATTERNS,
      pastConsultations:    [],
      hasMealPlan:          false,
      latestMonthlyReview:  null,
      storyLastUpdated:     new Date(Date.now() - 3 * 86_400_000).toISOString(),
      existingStory:        MOCK_STORY,
    }
  }

  // transform — the full experience
  return {
    profile: { ...base, membership_tier: "transform" as const, membership_status: "active" as const, membership_started_at: monthsAgo(2), is_founding_member: true, health_goals: ["Digestive health and IBS management", "Mood and mental clarity"] },
    nextBillingDate:      monthsFromNow(1),
    weeklyCheckin:        { content: MOCK_CHECKIN_CONTENT, week_starting: lastMonday() },
    monthlyGutPlan:       { content: MOCK_PLAN_CONTENT, month: firstOfMonth() },
    dailyConsultCount:    1,
    monthlyConsultCount:  8,
    streak:               5,
    patterns:             MOCK_PATTERNS,
    pastConsultations:    MOCK_CONSULTATIONS,
    hasMealPlan:          false,
    latestMonthlyReview:  { month: firstOfMonth().slice(0, 7) },
    storyLastUpdated:     new Date(Date.now() - 3 * 86_400_000).toISOString(),
    existingStory:        MOCK_STORY,
  }
}

/* ────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────── */

export default async function AccountYouTierPage({
  params,
}: {
  params: Promise<{ tier: string }>
}) {
  const { tier: tierParam } = await params
  const validTiers: DemoTier[] = ["free", "grow", "restore", "transform"]
  if (!validTiers.includes(tierParam as DemoTier)) {
    redirect("/account-you")
  }

  const tier = tierParam as DemoTier
  const meta = TIER_META[tier]

  const {
    profile,
    nextBillingDate,
    weeklyCheckin,
    monthlyGutPlan,
    dailyConsultCount,
    monthlyConsultCount,
    streak,
    patterns,
    pastConsultations,
    hasMealPlan,
    latestMonthlyReview,
    storyLastUpdated,
    existingStory,
  } = getMockData(tier)

  const dailyPromptIndex = new Date().getDay()

  return (
    <div className="min-h-screen bg-background pt-[57px]">

      {/* ── Demo banner ── */}
      <div
        className="border-b px-4 py-2.5"
        style={{
          background: `color-mix(in srgb, ${meta.color} 10%, var(--background))`,
          borderColor: `color-mix(in srgb, ${meta.color} 25%, transparent)`,
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/account-you"
              className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} /> All tiers
            </Link>
            <span className="text-muted-foreground/40 text-xs hidden sm:block">·</span>
            <p className="hidden sm:block text-xs font-semibold truncate" style={{ color: meta.color }}>
              Previewing <strong>{meta.label}</strong> ({meta.price}) — sample data for Sarah M.
            </p>
          </div>

          {/* Tier switcher pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(["free", "grow", "restore", "transform"] as DemoTier[]).map((t) => (
              <Link
                key={t}
                href={`/account-you/${t}`}
                className="hidden sm:block rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
                style={
                  t === tier
                    ? { background: meta.color, color: "#fff" }
                    : { background: `color-mix(in srgb, ${TIER_META[t].color} 12%, transparent)`, color: TIER_META[t].color }
                }
              >
                {TIER_META[t].label}
              </Link>
            ))}
            <Link
              href="/assessment"
              className="ml-1 rounded-full px-3 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: meta.color }}
            >
              Get yours →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Dashboard ── */}
      <div className="pt-10">
        <DashboardClient
          profile={profile}
          assessments={MOCK_ASSESSMENTS}
          mindAssessments={tier === "restore" || tier === "transform" ? MOCK_MIND_ASSESSMENTS : []}
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
          pastConsultations={pastConsultations}
          patterns={patterns}
          hasMealPlan={hasMealPlan}
          latestMonthlyReview={latestMonthlyReview}
          storyLastUpdated={storyLastUpdated}
          existingStory={existingStory}
          consultHref={tier === "transform" ? "/account/consult" : undefined}
        />
      </div>

    </div>
  )
}
