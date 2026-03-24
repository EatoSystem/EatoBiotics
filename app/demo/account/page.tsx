import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardClient } from "@/components/account/dashboard-client"

export const metadata: Metadata = {
  title: "Account Preview — EatoBiotics",
  description: "Preview what your EatoBiotics account dashboard looks like after completing the assessment.",
  robots: "noindex",
}

// Mock data matching DashboardClientProps exactly
const MOCK_PROFILE = {
  id: "demo-user",
  email: "sarah@example.com",
  name: "Sarah M.",
  age_bracket: "25–34",
  membership: "early_access" as const,
  referral_code: "SARAHM42",
  referred_by: null,
  // Subscription fields
  membership_tier: "free" as const,
  membership_status: "inactive" as const,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  membership_started_at: null,
  membership_expires_at: null,
  is_founding_member: false,
}

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
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(), // 1 week ago
    email_sent: true,
  },
]

const MOCK_PAID_REPORTS = [
  {
    stripe_session_id: "demo_session_full",
    tier: "full",
    pdf_url: null,
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    free_scores: {
      overall: 62,
      profile: { type: "Emerging Balance" },
    },
  },
]

export default function DemoAccountPage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {/* Demo banner */}
      <div className="border-b border-[var(--icon-yellow)]/20 bg-[var(--icon-yellow)]/8 px-4 py-2.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[var(--icon-yellow)]">
            ⚡ Demo account — showing sample data for Sarah M.
          </p>
          <Link
            href="/assessment"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--icon-green)] hover:underline"
          >
            Get your real account →
          </Link>
        </div>
      </div>

      {/* Real dashboard component with mock data — pt-20 matches real /account page */}
      <div className="pt-10">
      <DashboardClient
        profile={MOCK_PROFILE}
        assessments={MOCK_ASSESSMENTS}
        paidReports={MOCK_PAID_REPORTS}
        plateData={null}
      />
      </div>

      {/* Back to demo hub */}
      <div className="border-t border-border px-6 py-8 text-center">
        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to demo hub
        </Link>
      </div>
    </div>
  )
}
