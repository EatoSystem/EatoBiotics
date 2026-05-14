import type { Metadata } from "next"
import Link from "next/link"
import { LiveDashboard } from "@/components/account/live-dashboard"
import type { RealWeeklyReport } from "@/components/account/live-dashboard"

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

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────── */

function monthsAgo(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString()
}
function monthsFromNow(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString()
}

/* ────────────────────────────────────────────────────────────────────────
   Mock data — uses "member" tier (the live production tier)
   ──────────────────────────────────────────────────────────────────────── */

const MOCK_PROFILE = {
  name: "Dev Account",
  referral_code: "DEVTEST1",
  membership_started_at: monthsAgo(1),
}

const MOCK_ASSESSMENTS = [
  {
    overall_score: 62,
    profile_type: "Emerging Balance",
  },
  {
    overall_score: 54,
    profile_type: "Developing System",
  },
]

const MOCK_BIOTICS_PROFILE = {
  prebiotic: 32,
  probiotic: 13,
  postbiotic: 6,
}

/* ────────────────────────────────────────────────────────────────────────
   Mock weekly reports — links to the /account/report/demo static page
   ──────────────────────────────────────────────────────────────────────── */
const MOCK_WEEKLY_REPORTS: RealWeeklyReport[] = [
  {
    id: "demo",
    week_starting: "2025-05-05",
    content: "",
    report_json: {
      weekStarting: "2025-05-05",
      weekNumber: 8,
      mealCount: 9,
      averageScore: 73,
      previousWeekAverage: 68,
      pillars: { prebiotic: 71, probiotic: 23, postbiotic: 48 },
      pullQuote: "Your food system showed real momentum this week. Plant diversity was your strongest area — 9 different plants, your best showing in a month.",
      narrative: "Week 8 was your strongest week for plant variety since you started. Your prebiotic score of 71 reflects that directly. Your probiotic score of 23 is still the area with the most room to grow — you included a live fermented food on only 2 of 7 days.",
      focusAction: "Add a fermented food to 4 out of 7 dinners this week — kefir, kimchi, live yoghurt, or sauerkraut all count.",
      weekSummaryTitle: "Your Best Week for Plant Diversity",
      mealsThisWeek: [
        { id: "d1", name: "Porridge with berries & walnuts",    type: "Breakfast", score: 74, date: "2025-05-05" },
        { id: "d7", name: "Mackerel on rye with mixed leaves",  type: "Lunch",     score: 76, date: "2025-05-10" },
        { id: "d9", name: "Chicken, roasted veg & kefir",       type: "Dinner",    score: 81, date: "2025-05-11" },
      ],
    },
  },
  {
    id: "demo-2",
    week_starting: "2025-04-28",
    content: "",
    report_json: {
      weekStarting: "2025-04-28",
      weekNumber: 7,
      mealCount: 11,
      averageScore: 68,
      previousWeekAverage: 64,
      pillars: { prebiotic: 65, probiotic: 28, postbiotic: 42 },
      pullQuote: "Your prebiotic score held steady and your fermented food frequency improved to 4 out of 7 days. The habit is forming.",
      narrative: "A consistent week with clear patterns emerging. Your prebiotic score held steady and your fermented food frequency improved to 4 out of 7 days. The habit is forming — keep the weekend routine tighter.",
      focusAction: "Tighten your weekend routine — aim for the same meal quality Saturday and Sunday as you do during the week.",
      weekSummaryTitle: "Consistency Building — Momentum Is Growing",
      mealsThisWeek: [
        { id: "w2d1", name: "Overnight oats with chia & berries", type: "Breakfast", score: 72, date: "2025-04-28" },
        { id: "w2d2", name: "Salmon salad with kimchi",            type: "Lunch",     score: 78, date: "2025-04-30" },
        { id: "w2d3", name: "Lentil dahl with brown rice",         type: "Dinner",    score: 71, date: "2025-05-01" },
      ],
    },
  },
  {
    id: "demo-3",
    week_starting: "2025-04-21",
    content: "",
    report_json: {
      weekStarting: "2025-04-21",
      weekNumber: 6,
      mealCount: 8,
      averageScore: 64,
      previousWeekAverage: 62,
      pillars: { prebiotic: 60, probiotic: 19, postbiotic: 38 },
      pullQuote: "Monday–Friday averaged 71 but Saturday dropped to 48. You have the pattern — now extend it to the full week.",
      narrative: "Mixed week with a clear gap at the weekend. Monday–Friday averaged 71 but Saturday dropped to 48. Weekend meal planning is the lever to pull this month.",
      focusAction: "Plan two gut-friendly meals for the weekend before Saturday arrives — preparation is the key lever here.",
      weekSummaryTitle: "Mid-Week Strong — Weekends Need Attention",
      mealsThisWeek: [
        { id: "w3d1", name: "Eggs, sourdough & avocado",       type: "Breakfast", score: 65, date: "2025-04-21" },
        { id: "w3d2", name: "Greek yoghurt with granola",       type: "Breakfast", score: 62, date: "2025-04-23" },
        { id: "w3d3", name: "Pasta, garlic & roasted veg",      type: "Dinner",    score: 70, date: "2025-04-24" },
      ],
    },
  },
]

/* ────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────── */

export default function AccountYouLivePage() {
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
      <LiveDashboard
        name={MOCK_PROFILE.name}
        score={MOCK_ASSESSMENTS[0].overall_score}
        previousScore={MOCK_ASSESSMENTS[1].overall_score}
        profileType={MOCK_ASSESSMENTS[0].profile_type}
        biotics={MOCK_BIOTICS_PROFILE}
        nextBillingDate={monthsFromNow(1)}
        referralCode={MOCK_PROFILE.referral_code}
        monthlyPlan={MOCK_PLAN_CONTENT}
        weeklyCheckin={`This week your food system data showed a solid upward trend — your average meal score came in at 71, up from 64 the week before. You logged 5 analyses, which is exactly the consistency that drives meaningful change in your microbiome over time.\n\nWhat improved most was your plant diversity — you hit 9 different plants across the week, your best showing in a month. What still needs attention is your fermented food frequency: only 2 out of 7 days included a live food source.\n\nYour focus for next week: make fermented foods non-negotiable. Pick one — kefir in the morning, yoghurt as a snack, or kimchi with dinner — and lock it in before adding anything else.`}
        memberStartedAt={MOCK_PROFILE.membership_started_at}
        weeklyReports={MOCK_WEEKLY_REPORTS}
      />

    </div>
  )
}
