"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ClipboardList,
  FileText,
  CreditCard,
  Leaf,
  Users,
  Download,
  ArrowRight,
  Copy,
  Check,
  MessageCircle,
  Mail,
  ChevronUp,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { ProgressChart } from "./progress-chart"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────────── */

interface Profile {
  id: string
  email: string
  name: string | null
  age_bracket: string | null
  membership: "free" | "early_access" | "member" | "premium"
  referral_code: string
  referred_by: string | null
}

interface AssessmentRow {
  overall_score: number | null
  profile_type: string | null
  sub_scores: Record<string, number> | null
  created_at: string
  email_sent: boolean | null
}

interface PaidReport {
  stripe_session_id: string
  tier: string
  pdf_url: string | null
  created_at: string
  free_scores: { overall: number; profile: { type: string } } | null
}

interface PlateData {
  plate: unknown
  plants: string[] | null
  updated_at: string
}

interface DashboardClientProps {
  profile: Profile
  assessments: AssessmentRow[]
  paidReports: PaidReport[]
  plateData: PlateData | null
}

/* ── Helpers ────────────────────────────────────────────────────────── */

const TABS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "membership", label: "Membership", icon: CreditCard },
  { key: "plate", label: "My Plate", icon: Leaf },
  { key: "refer", label: "Refer Friends", icon: Users },
] as const

type TabKey = (typeof TABS)[number]["key"]

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  full: "Full",
  premium: "Premium",
}

const TIER_COLORS: Record<string, string> = {
  starter: "var(--icon-lime)",
  full: "var(--icon-teal)",
  premium: "var(--icon-orange)",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function relativeTime(iso: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function extractSubScores(sub: Record<string, number> | null) {
  if (!sub) return null
  const has = (k: string) => typeof sub[k] === "number"
  if (
    has("diversity") &&
    has("feeding") &&
    has("adding") &&
    has("consistency") &&
    has("feeling")
  ) {
    return {
      diversity: sub.diversity,
      feeding: sub.feeding,
      adding: sub.adding,
      consistency: sub.consistency,
      feeling: sub.feeling,
      overall: sub.overall ?? 0,
    }
  }
  return null
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function TierBadge({ tier }: { tier: string }) {
  const label = TIER_LABELS[tier.toLowerCase()] ?? tier
  const color = TIER_COLORS[tier.toLowerCase()] ?? "var(--icon-green)"
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  )
}

function MembershipBadge({ membership }: { membership: string }) {
  const labels: Record<string, string> = {
    free: "Free",
    early_access: "Early Access",
    member: "Member",
    premium: "Premium",
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      {labels[membership] ?? membership}
    </span>
  )
}

/* ── Overview Tab ───────────────────────────────────────────────────── */

function OverviewTab({
  profile,
  assessments,
  onSignOut,
}: {
  profile: Profile
  assessments: AssessmentRow[]
  onSignOut: () => void
}) {
  const latest = assessments[0] ?? null
  const previous = assessments[1] ?? null

  const currentScores = latest ? extractSubScores(latest.sub_scores) : null
  const previousScores = previous ? extractSubScores(previous.sub_scores) : null

  const showRetake = latest ? daysAgo(latest.created_at) > 75 : true

  const overallWithFallback = latest?.overall_score
    ? Math.round(latest.overall_score)
    : null

  return (
    <div className="space-y-6">
      {/* Welcome heading */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Welcome back, {profile.name || profile.email}!
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <MembershipBadge membership={profile.membership} />
          <Link
            href="/account/settings"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings size={12} />
            Settings
          </Link>
        </div>
      </div>

      {/* Latest score card */}
      {latest ? (
        <div className="rounded-2xl border bg-card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your Latest Score
          </p>
          <div className="flex items-center gap-6">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold tabular-nums"
              style={{
                background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                color: "var(--icon-green)",
                border: "3px solid var(--icon-green)",
              }}
            >
              {overallWithFallback ?? "—"}
            </div>
            <div>
              {latest.profile_type && (
                <p className="font-serif text-lg font-semibold text-foreground">
                  {latest.profile_type}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Taken {formatDate(latest.created_at)} · {relativeTime(latest.created_at)}
              </p>
              {showRetake && (
                <Link
                  href="/assessment"
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: "color-mix(in srgb, var(--icon-lime) 20%, transparent)",
                    color: "var(--icon-green)",
                  }}
                >
                  Retake assessment <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="mb-3 text-muted-foreground">You haven&apos;t taken the assessment yet.</p>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--icon-green)" }}
          >
            Take the assessment <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Progress chart — only if 2+ assessments with sub_scores */}
      {currentScores && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {previousScores ? "Score Progress" : "Pillar Scores"}
          </h2>
          <ProgressChart current={currentScores} previous={previousScores} />
        </div>
      )}

      {/* Assessment timeline */}
      {assessments.length > 0 && (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Assessment History</h2>
          <div className="space-y-3">
            {assessments.map((a, i) => (
              <div
                key={a.created_at + i}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {a.profile_type ?? "Assessment"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.overall_score != null && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums"
                      style={{
                        background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                        color: "var(--icon-green)",
                      }}
                    >
                      {Math.round(a.overall_score)}
                    </span>
                  )}
                  {i === 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Latest
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retake CTA (if no assessment yet or overdue) */}
      {showRetake && assessments.length > 0 && (
        <div className="rounded-2xl border border-dashed bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            It&apos;s been a while — your food system may have changed.
          </p>
          <Link
            href="/assessment"
            className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--icon-green)" }}
          >
            Retake assessment <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="pt-2">
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}

/* ── Reports Tab ────────────────────────────────────────────────────── */

function ReportsTab({ paidReports }: { paidReports: PaidReport[] }) {
  if (paidReports.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center">
        <FileText size={32} className="mx-auto mb-3 text-muted-foreground/40" />
        <p className="mb-1 font-medium text-foreground">No reports yet</p>
        <p className="mb-4 text-sm text-muted-foreground">
          You haven&apos;t purchased any reports yet. Take the assessment to get your personalised deep report.
        </p>
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--icon-green)" }}
        >
          Take the assessment <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {paidReports.map((r) => (
        <div key={r.stripe_session_id} className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-start justify-between">
            <TierBadge tier={r.tier} />
            <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
          </div>
          {r.free_scores && (
            <div className="mb-3">
              <p className="font-serif text-base font-semibold text-foreground">
                {r.free_scores.profile?.type ?? "Report"}
              </p>
              <p className="text-sm text-muted-foreground">
                Score: {r.free_scores.overall}
              </p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            {r.pdf_url ? (
              <a
                href={r.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)",
                  color: "var(--icon-teal)",
                }}
              >
                <Download size={12} />
                Download PDF
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">PDF processing…</span>
            )}
            <Link
              href="/assessment"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View report <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Membership Tab ─────────────────────────────────────────────────── */

function MembershipTab({
  membership,
  referralCode,
}: {
  membership: Profile["membership"]
  referralCode: string
}) {
  const tiers = [
    {
      key: "free" as const,
      title: "Free",
      perks: [
        "Assessment results saved",
        "Retest tracking",
        "Progress history",
      ],
      cta: membership === "free" ? "Current plan" : null,
      ctaHref: null,
    },
    {
      key: "early_access" as const,
      title: "Early Access",
      perks: [
        "Early product access",
        "Community access",
        "10% report discount",
        "Exclusive updates",
      ],
      cta:
        membership === "early_access"
          ? "Current plan"
          : membership === "free"
          ? `Refer 3 friends →`
          : null,
      ctaHref:
        membership === "free"
          ? `/account?tab=refer`
          : null,
    },
    {
      key: "member" as const,
      title: "Member",
      perks: [
        "All paid reports",
        "Priority support",
        "Subscription benefits",
      ],
      cta: membership === "member" ? "Current plan" : "Coming soon",
      ctaHref: null,
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Your current plan: <strong className="text-foreground">{tiers.find(t => t.key === membership)?.title ?? membership}</strong>
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const isActive = tier.key === membership
          return (
            <div
              key={tier.key}
              className={cn(
                "rounded-2xl border bg-card p-5 transition-all",
                isActive && "border-2"
              )}
              style={
                isActive
                  ? { borderColor: "var(--icon-green)" }
                  : undefined
              }
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold text-foreground">
                  {tier.title}
                </h3>
                {isActive && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      background: "color-mix(in srgb, var(--icon-green) 15%, transparent)",
                      color: "var(--icon-green)",
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              <ul className="mb-4 space-y-1.5">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check size={12} className="mt-0.5 shrink-0 text-foreground/40" />
                    {perk}
                  </li>
                ))}
              </ul>
              {tier.cta && (
                tier.ctaHref ? (
                  <Link
                    href={tier.ctaHref}
                    className="inline-flex w-full items-center justify-center rounded-full py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{
                      background: "color-mix(in srgb, var(--icon-lime) 20%, transparent)",
                      color: "var(--icon-green)",
                    }}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "w-full rounded-full py-2 text-center text-xs font-semibold",
                      isActive
                        ? "bg-muted/60 text-muted-foreground"
                        : "bg-muted text-muted-foreground/60"
                    )}
                  >
                    {tier.cta}
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── My Plate Tab ───────────────────────────────────────────────────── */

function PlateTab({ plateData }: { plateData: PlateData | null }) {
  const plantCount = plateData?.plants?.length ?? 0
  const lastSaved = plateData ? relativeTime(plateData.updated_at) : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Your plate is synced across devices when you&apos;re signed in.
        </p>
        {plateData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold"
                style={{
                  background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
                  color: "var(--icon-green)",
                }}
              >
                {plantCount}
              </div>
              <div>
                <p className="font-medium text-foreground">plants tracked this week</p>
                <p className="text-xs text-muted-foreground">Last saved: {lastSaved}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No plate data yet. Start building your plate and it will sync here automatically.
          </p>
        )}
      </div>
      <Link
        href="/myplate"
        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--icon-green)" }}
      >
        Open My Plate <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/* ── Refer Friends Tab ──────────────────────────────────────────────── */

function ReferTab({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false)
  const referralUrl = `eatobiotics.com/assessment?ref=${referralCode}`
  const fullUrl = `https://eatobiotics.com/assessment?ref=${referralCode}`
  const waText = `Take the EatoBiotics Food System Assessment: ${fullUrl}`
  const emailBody = `Take this free gut health assessment: ${fullUrl}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-1 font-serif text-lg font-semibold text-foreground">
          Share your link
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Refer 3 friends to unlock Early Access.
        </p>

        {/* Referral URL display */}
        <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3">
          <span className="flex-1 truncate font-mono text-sm text-foreground">
            {referralUrl}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted"
            title="Copy link"
          >
            {copied ? (
              <Check size={15} className="text-green-500" />
            ) : (
              <Copy size={15} className="text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              background: "color-mix(in srgb, var(--icon-lime) 20%, transparent)",
              color: "var(--icon-green)",
            }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=Discover%20your%20Food%20System&body=${encodeURIComponent(emailBody)}`}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)",
              color: "var(--icon-teal)",
            }}
          >
            <Mail size={14} />
            Email
          </a>
        </div>
      </div>

      {/* Referral progress */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-foreground">Progress to Early Access</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Refer 3 friends to unlock Early Access membership</p>
          </div>
          <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--icon-green)" }}>
            0/3
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground italic">
          Referral stats coming soon — keep sharing your link!
        </p>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function DashboardClient({
  profile,
  assessments,
  paidReports,
  plateData,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push("/assessment")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      {/* Tab navigation */}
      <div className="mb-8 flex items-center gap-1 overflow-x-auto border-b border-border pb-0 pt-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition-colors",
              activeTab === key
                ? "border-[var(--icon-green)] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          profile={profile}
          assessments={assessments}
          onSignOut={handleSignOut}
        />
      )}
      {activeTab === "reports" && <ReportsTab paidReports={paidReports} />}
      {activeTab === "membership" && (
        <MembershipTab
          membership={profile.membership}
          referralCode={profile.referral_code}
        />
      )}
      {activeTab === "plate" && <PlateTab plateData={plateData} />}
      {activeTab === "refer" && <ReferTab referralCode={profile.referral_code} />}
    </div>
  )
}
