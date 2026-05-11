import type { Metadata } from "next"
import Link from "next/link"
import { LiveDashboard } from "@/components/account/live-dashboard"

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
      />

    </div>
  )
}
