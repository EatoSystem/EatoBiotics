"use client"

import { useState, useEffect } from "react"
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
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  LogOut,
  Settings,
  Camera,
  TrendingUp,
  Lock,
  Zap,
  Star,
  Sparkles,
  MessageSquare,
  ChevronDown,
  Calendar,
  BookOpen,
  Search,
  CalendarCheck,
  Brain,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import posthog from "posthog-js"
import { OnboardingModal } from "./onboarding-modal"
import { WelcomeScreen, useFirstVisit } from "./welcome-screen"
import { SevenDayGuide } from "./seven-day-guide"
import { UpgradeGate } from "./upgrade-gate"
import { IntelligenceClient } from "@/app/account/intelligence/intelligence-client"
import { StoryClient, type GutHealthStory } from "@/app/account/story/story-client"
import { ScoreProgressCard } from "./score-progress-card"
import { ReportBridgeCard } from "./report-bridge-card"
import { Day8ChallengeCard } from "./day8-challenge-card"
import { PractitionerReportCard } from "./practitioner-report-card"
import { MonthlyProgressCard } from "./monthly-progress-card"
import { CommunityPulseCard } from "./community-pulse-card"
import { GoalProgressCard } from "./goal-progress-card"
import { ScoreRing } from "@/components/assessment/score-ring"
import { ProgressChart } from "./progress-chart"
import { cn } from "@/lib/utils"
import { loadMealAnalyses, type SavedMealAnalysis } from "@/lib/local-storage"
import { getPercentile } from "@/lib/percentile"
import { getIdentityLabel } from "@/lib/identity-labels"

/* ── Types ──────────────────────────────────────────────────────────── */

interface Profile {
  id: string
  email: string
  name: string | null
  age_bracket: string | null
  membership: "free" | "early_access" | "member" | "premium"
  referral_code: string
  referred_by: string | null
  // Subscription fields (added in membership build)
  membership_tier: "free" | "trial" | "member" | "grow" | "restore" | "transform"
  membership_status: "active" | "inactive" | "cancelled" | "past_due"
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  membership_started_at: string | null
  membership_expires_at: string | null
  trial_expires_at: string | null
  is_founding_member: boolean
  health_goals?: string[] | null
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
  report_json: Record<string, unknown> | null
}

interface PlateData {
  plate: unknown
  plants: string[] | null
  updated_at: string
}

interface BioticsProfile {
  prebiotic: number   // raw score out of 45
  probiotic: number   // raw score out of 25
  postbiotic: number  // raw score out of 15
  analysisCount: number
}

interface AnalysisPatterns {
  bestDay: string
  trendDirection: "up" | "stable" | "down"
  bestStreak: number
  analysisCount: number
}

interface DashboardClientProps {
  profile: Profile
  assessments: AssessmentRow[]
  mindAssessments?: AssessmentRow[]
  paidReports: PaidReport[]
  plateData: PlateData | null
  nextBillingDate?: string | null
  dailyConsultCount?: number
  monthlyConsultCount?: number
  weeklyCheckin?: { content: string; week_starting: string } | null
  monthlyGutPlan?: { content: string; month: string } | null
  bioticsProfile?: BioticsProfile | null
  streak?: number
  dailyPromptIndex?: number
  consultHref?: string
  pastConsultations?: Array<{
    id: string
    turn_count: number
    created_at: string
    summary: string | null
    messages: Array<{role: string; content: string; turn: number}> | null
  }>
  patterns?: AnalysisPatterns | null
  hasMealPlan?: boolean
  latestMonthlyReview?: { month: string } | null
  storyLastUpdated?: string | null
  existingStory?: GutHealthStory | null
}

/* ── Tabs ───────────────────────────────────────────────────────────── */

const TABS = [
  { key: "today",    label: "Today",    icon: Calendar },
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "membership", label: "Membership", icon: CreditCard },
  { key: "plate", label: "My Plate", icon: Leaf },
  { key: "meals", label: "My Meals", icon: Camera },
  { key: "refer", label: "Refer", icon: Users },
  { key: "consult", label: "EatoBiotic", icon: MessageSquare },
  { key: "intelligence", label: "Intelligence", icon: Brain },
  { key: "story",        label: "Story",        icon: BookOpen },
] as const

type TabKey = (typeof TABS)[number]["key"]

/* ── Profile lookup ─────────────────────────────────────────────────── */

const PROFILE_INFO: Record<string, { color: string; tagline: string }> = {
  // New Feed/Seed/Heal profiles
  "Thriving Food System": { color: "var(--icon-green)",  tagline: "Your inner food system is working hard in your favour." },
  "Strong Foundation":    { color: "var(--icon-teal)",   tagline: "You've built something real — now it's time to sharpen it." },
  "Emerging Balance":     { color: "var(--icon-lime)",   tagline: "The building blocks are there. Consistency is the next step." },
  "Developing System":    { color: "var(--icon-yellow)", tagline: "Progress is underway — targeted effort will accelerate it." },
  "Early Builder":        { color: "var(--icon-orange)", tagline: "You're at the beginning of something important." },
  // Legacy profiles
  "Thriving System":     { color: "var(--icon-green)",  tagline: "Your food system health is performing at its peak." },
  "Inconsistent System": { color: "var(--icon-yellow)", tagline: "Consistency is your next big unlock — small habits compound." },
  "Underfed System":     { color: "var(--icon-orange)", tagline: "Your gut is ready for more — more variety, more plants, more life." },
}
const DEFAULT_PROFILE_INFO = { color: "var(--icon-green)", tagline: "The food system inside you." }

function getProfileInfo(profileType: string | null) {
  if (!profileType) return DEFAULT_PROFILE_INFO
  return PROFILE_INFO[profileType] ?? DEFAULT_PROFILE_INFO
}

/* ── Helpers ────────────────────────────────────────────────────────── */

const TIER_LABELS: Record<string, string> = {
  personal: "Personal",
  starter: "Starter",
  full: "Full",
  premium: "Premium",
}

const TIER_COLORS: Record<string, string> = {
  personal: "var(--icon-green)",
  starter: "var(--icon-lime)",
  full: "var(--icon-teal)",
  premium: "var(--icon-orange)",
}

const SCORE_COLORS: Record<string, string> = {
  "Exceptional":       "var(--icon-green)",
  "Strong Foundation": "var(--icon-lime)",
  "Good Start":        "var(--icon-yellow)",
  "Getting There":     "var(--icon-orange)",
  "Starting Out":      "#ef4444",
}

const DAILY_LIMITS: Record<string, number> = { grow: 2, restore: 5, transform: 10 }

/* ── Daily Habit Prompts (5 pillars × 7 days) ───────────────────────── */

const DAILY_PROMPTS: Record<string, string[]> = {
  diversity: [
    "Add one plant you didn't eat yesterday to today's meals",
    "Try a new grain today — farro, buckwheat, or barley",
    "Swap your usual lunch vegetable for something different",
    "Add a handful of seeds to a meal — pumpkin, sunflower, or flax",
    "Include a colourful vegetable you haven't had this week",
    "Aim for 5 different plants across today's meals",
    "Add a fresh herb to one meal — they count as a plant",
  ],
  feeding: [
    "Start your day with a fibre-rich breakfast — oats, fruit, or whole grain toast",
    "Add a handful of legumes to any meal today",
    "Choose whole grain over refined for one meal today",
    "Include a root vegetable in your lunch or dinner",
    "Add at least 2 different vegetables to your main meal",
    "Swap white rice or pasta for a fibre-richer alternative",
    "Make sure your dinner includes at least one dark leafy green",
  ],
  adding: [
    "Add a tablespoon of sauerkraut or kimchi to today's meal",
    "Try miso soup as your starter or a snack today",
    "Swap regular yoghurt for a live culture kefir",
    "Add a slice of sourdough bread with one of your meals",
    "Include a small serving of natural live yoghurt today",
    "Try kombucha instead of your usual drink at lunch",
    "Add a teaspoon of apple cider vinegar to a salad dressing",
  ],
  consistency: [
    "Eat your first meal within 1 hour of waking today",
    "Set a consistent dinner time and stick to it today",
    "Aim for 3 meals at regular intervals — no skipping",
    "Try not to eat within 3 hours of going to sleep tonight",
    "Eat slowly today — put your fork down between bites",
    "Drink a glass of water before each meal today",
    "Plan tomorrow's meals tonight so you stay on track",
  ],
  feeling: [
    "Notice how your energy feels 2 hours after breakfast — write it down",
    "Check in with your digestion after lunch today",
    "Rate your bloating on a scale of 1–5 before and after dinner",
    "Track whether you feel better or worse after eating gluten today",
    "Pay attention to your mood in the afternoon — note any patterns",
    "Log your sleep quality last night alongside what you ate yesterday",
    "Note any foods that seem to trigger discomfort today",
  ],
}

function getDailyPrompt(subScores: Record<string, number> | null | undefined, dayIndex: number): string {
  if (!subScores) return "Analyse a meal today to start tracking your food system health"
  const pillars = ["diversity", "feeding", "adding", "consistency", "feeling"]
  let weakest = "adding"
  let lowestScore = Infinity
  for (const p of pillars) {
    const val = subScores[p] ?? 100
    if (val < lowestScore) { lowestScore = val; weakest = p }
  }
  return DAILY_PROMPTS[weakest]?.[dayIndex] ?? "Analyse a meal today to track your food system health"
}

const TIER_ACCENT: Record<string, { bg: string; text: string; label: string }> = {
  free:      { bg: "rgba(255,255,255,0.1)",  text: "rgba(255,255,255,0.6)",  label: "Free" },
  trial:     { bg: "rgba(132,204,22,0.22)",  text: "#bef264",                label: "30-Day Trial" },
  member:    { bg: "rgba(20,184,166,0.22)",  text: "#5eead4",                label: "Member" },
  grow:      { bg: "rgba(132,204,22,0.22)",  text: "#bef264",                label: "Grow Member" },
  restore:   { bg: "rgba(20,184,166,0.22)",  text: "#5eead4",                label: "Restore Member" },
  transform: { bg: "rgba(249,115,22,0.22)",  text: "#fdba74",                label: "Transform Member" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function relativeTime(iso: string) {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
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
  if (has("diversity") && has("feeding") && has("adding") && has("consistency") && has("feeling")) {
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

function getScoreBand(score: number): string {
  if (score >= 80) return "Exceptional"
  if (score >= 65) return "Strong Foundation"
  if (score >= 50) return "Good Start"
  if (score >= 35) return "Getting There"
  return "Starting Out"
}

function TierBadge({ tier }: { tier: string }) {
  const label = TIER_LABELS[tier.toLowerCase()] ?? tier
  const color = TIER_COLORS[tier.toLowerCase()] ?? "var(--icon-green)"
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      {label}
    </span>
  )
}

/* ── Today Tab ──────────────────────────────────────────────────────── */

function TodayTab({
  profile,
  paidReports,
  latestAssessment,
}: {
  profile: Profile
  paidReports: PaidReport[]
  latestAssessment: AssessmentRow | null
}) {
  const firstName = profile.name?.split(" ")[0] || "there"
  const latestReport = paidReports[0] ?? null
  const reportJson = latestReport?.report_json as Record<string, unknown> | null
  const thirtyDayPlan = reportJson?.thirtyDayPlan as Record<string, { focus: string; goal: string; actions: string[] }> | null

  // Calculate day in plan based on trial_expires_at (trial started 30 days before expiry)
  const trialExpires = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null
  const trialStart = trialExpires ? new Date(trialExpires.getTime() - 30 * 86400000) : null
  const dayInPlan = trialStart
    ? Math.max(1, Math.min(30, Math.floor((Date.now() - trialStart.getTime()) / 86400000) + 1))
    : 1
  const weekInPlan = Math.min(4, Math.ceil(dayInPlan / 7)) as 1 | 2 | 3 | 4
  const daysRemaining = trialExpires
    ? Math.max(0, Math.ceil((trialExpires.getTime() - Date.now()) / 86400000))
    : 30

  const weekKey = `week${weekInPlan}` as "week1" | "week2" | "week3" | "week4"
  const currentWeek = thirtyDayPlan?.[weekKey]

  // Determine focus pillar from sub_scores
  const sub = latestAssessment?.sub_scores ?? {}
  const feedSeekHeal = ["feed", "seed", "heal"]
  const pillarEntries = Object.entries(sub).filter(([k]) => feedSeekHeal.includes(k))
  const weakestPillar = pillarEntries.length
    ? pillarEntries.sort(([, a], [, b]) => (a as number) - (b as number))[0][0]
    : "seed"

  const PILLAR_META: Record<string, { label: string; color: string; foods: string[]; icon: string }> = {
    feed: { label: "Feed — Prebiotic & Fibre", color: "var(--icon-lime)", icon: "🌿", foods: ["Oats", "Lentils", "Garlic", "Asparagus", "Leeks"] },
    seed: { label: "Seed — Fermented & Live", color: "var(--icon-teal)", icon: "🧬", foods: ["Kefir", "Kimchi", "Miso", "Sauerkraut", "Kombucha"] },
    heal: { label: "Heal — Recovery & Rhythm", color: "var(--icon-yellow)", icon: "⚡", foods: ["Blueberries", "Dark Chocolate", "Turmeric", "Walnuts", "Olive Oil"] },
  }
  const focus = PILLAR_META[weakestPillar] ?? PILLAR_META.seed

  const overall = latestAssessment?.overall_score ?? null
  const feedScore = (sub.feed as number) ?? null
  const seedScore = (sub.seed as number) ?? null
  const healScore = (sub.heal as number) ?? null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  if (!latestReport) {
    return (
      <div className="py-12 text-center">
        <p className="mb-2 text-2xl">📋</p>
        <p className="font-semibold text-foreground">No report yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personalised 30-day plan will appear here once your report is ready.
        </p>
        <Link
          href="/assessment"
          className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
        >
          Get My Report <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{greeting}, <span className="font-semibold text-foreground">{firstName}</span>.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {overall !== null && (
            <span className="rounded-full border px-3 py-1 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
              Score: {overall}
            </span>
          )}
          {feedScore !== null && <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">Feed: {feedScore}</span>}
          {seedScore !== null && <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">Seed: {seedScore}</span>}
          {healScore !== null && <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">Heal: {healScore}</span>}
          <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Day {dayInPlan} of 30</span>
        </div>
      </div>

      {/* This week's focus */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: `color-mix(in srgb, ${focus.color} 40%, transparent)`, background: `color-mix(in srgb, ${focus.color} 6%, var(--card))` }}
      >
        <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: focus.color }}>
          {focus.icon} Week {weekInPlan} Focus
        </p>
        <p className="font-serif text-lg font-bold text-foreground">{focus.label}</p>
        {currentWeek && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">{currentWeek.goal}</p>
            {currentWeek.focus && (
              <p className="mt-2 text-sm font-medium text-foreground">{currentWeek.focus}</p>
            )}
          </>
        )}
      </div>

      {/* Today's action */}
      {currentWeek?.actions?.length ? (
        <div className="rounded-2xl border bg-card p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Today&apos;s Action</p>
          <p className="font-semibold text-foreground">{currentWeek.actions[(dayInPlan - 1) % Math.max(1, currentWeek.actions.length)]}</p>
        </div>
      ) : null}

      {/* Foods to try this week */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">This week&apos;s foods to try</p>
        <div className="flex flex-wrap gap-2">
          {focus.foods.map((food) => (
            <span
              key={food}
              className="rounded-full px-3 py-1.5 text-sm font-medium"
              style={{ background: `color-mix(in srgb, ${focus.color} 12%, transparent)`, color: focus.color }}
            >
              {food}
            </span>
          ))}
        </div>
      </div>

      {/* 30-day progress */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Your 30-day plan progress</p>
        <div className="flex gap-2">
          {([1, 2, 3, 4] as const).map((w) => (
            <div
              key={w}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-sm"
              style={
                w < weekInPlan
                  ? { background: "color-mix(in srgb, var(--icon-green) 12%, transparent)", borderColor: "color-mix(in srgb, var(--icon-green) 40%, transparent)" }
                  : w === weekInPlan
                  ? { background: `color-mix(in srgb, ${focus.color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${focus.color} 40%, transparent)` }
                  : {}
              }
            >
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Wk {w}</span>
              {w < weekInPlan && <Check size={12} style={{ color: "var(--icon-green)" }} />}
              {w === weekInPlan && <span className="text-[10px] font-semibold" style={{ color: focus.color }}>Now</span>}
              {w > weekInPlan && <span className="text-[10px] text-muted-foreground">Ahead</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Trial expiry / continuation CTA */}
      {profile.membership_tier === "trial" && daysRemaining <= 30 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: daysRemaining <= 5
              ? "color-mix(in srgb, var(--icon-orange) 8%, var(--card))"
              : "color-mix(in srgb, var(--icon-lime) 6%, var(--card))",
            border: `1px solid ${daysRemaining <= 5 ? "color-mix(in srgb, var(--icon-orange) 30%, transparent)" : "color-mix(in srgb, var(--icon-lime) 30%, transparent)"}`,
          }}
        >
          <p className="text-sm font-semibold text-foreground">
            {daysRemaining === 0
              ? "Your free account has ended."
              : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining in your free account.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Continue your journey with an EatoBiotics Member plan — €24.99/month.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
          >
            Continue my journey <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Link to full report */}
      {latestReport && (
        <Link
          href={`/assessment/report?session_id=${latestReport.stripe_session_id}`}
          className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4 text-sm transition-colors hover:bg-muted"
        >
          <span className="font-medium text-foreground">View your full Personal Report</span>
          <ArrowRight size={14} className="text-muted-foreground" />
        </Link>
      )}
    </div>
  )
}

/* ── Pillar config ───────────────────────────────────────────────────── */

const HERO_PILLARS = [
  { key: "diversity" as const,    label: "Plant Diversity", emoji: "🌿", color: "var(--icon-lime)" },
  { key: "feeding" as const,      label: "Feeding",         emoji: "🍽️",  color: "var(--icon-green)" },
  { key: "adding" as const,       label: "Live Foods",      emoji: "➕",  color: "var(--icon-teal)" },
  { key: "consistency" as const,  label: "Consistency",     emoji: "📅", color: "var(--icon-yellow)" },
  { key: "feeling" as const,      label: "Feeling",         emoji: "💚", color: "var(--icon-orange)" },
]

/* ── Hero Pillar Bar (dark bg version) ──────────────────────────────── */

function HeroPillarBar({
  emoji,
  label,
  score,
  color,
  index,
}: {
  emoji: string
  label: string
  score: number
  color: string
  index: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500 + index * 90)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div className="flex items-center gap-3">
      <span className="text-base leading-none">{emoji}</span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</span>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: visible ? `${score}%` : "0%",
              background: color,
              transition: `width 800ms cubic-bezier(0.16,1,0.3,1) ${index * 80}ms`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard Hero ─────────────────────────────────────────────────── */

function DashboardHero({
  profile,
  latestAssessment,
  onSignOut,
  streak = 0,
  patterns,
}: {
  profile: Profile
  latestAssessment: AssessmentRow | null
  onSignOut: () => void
  streak?: number
  patterns?: AnalysisPatterns | null
}) {
  const firstName = profile.name?.split(" ")[0] || profile.email.split("@")[0]
  const initials = (profile.name ?? profile.email)
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("")

  const score = latestAssessment?.overall_score ?? null
  const profileType = latestAssessment?.profile_type ?? null
  const subScores = latestAssessment ? extractSubScores(latestAssessment.sub_scores) : null
  const profileInfo = getProfileInfo(profileType)

  const tierAccent = TIER_ACCENT[profile.membership_tier] ?? TIER_ACCENT.free
  const isFoundingTransform = profile.membership_tier === "transform" && profile.is_founding_member
  const heroBadgeLabel = isFoundingTransform ? "Founding Member" : tierAccent.label

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--icon-lime) 0%, var(--icon-green) 28%, var(--icon-teal) 55%, var(--icon-yellow) 78%, var(--icon-orange) 100%)",
      }}
    >
      {/* Dark scrim for text legibility over bright gradient */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.32)" }} />
      {/* Profile-color radial bloom behind ring */}
      {score != null && (
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
          style={{
            background: `radial-gradient(ellipse 320px 320px at 70% 50%, color-mix(in srgb, ${profileInfo.color} 18%, transparent), transparent 70%)`,
          }}
        />
      )}

      {/* Header bar */}
      <div className="relative mx-auto max-w-3xl px-4 pb-0 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🌿</span>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
              My Account
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                background: tierAccent.bg,
                color: tierAccent.text,
                border: `1px solid ${tierAccent.bg}`,
              }}
            >
              {isFoundingTransform && <Star size={9} fill="currentColor" />}
              {heroBadgeLabel}
            </span>
            <Link
              href="/account/settings"
              style={{ color: "rgba(255,255,255,0.4)" }}
              className="transition-colors hover:opacity-80"
              aria-label="Settings"
            >
              <Settings size={15} />
            </Link>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero body */}
      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {score != null ? (
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">

            {/* Left: greeting + pillar bars */}
            <div className="flex-1 min-w-0">
              {/* Avatar + greeting */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: `color-mix(in srgb, ${profileInfo.color} 30%, rgba(255,255,255,0.1))`,
                    color: profileInfo.color,
                    border: `1.5px solid color-mix(in srgb, ${profileInfo.color} 50%, transparent)`,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl" style={{ color: "white" }}>
                    Hi, {firstName}
                  </h1>
                  <p className="text-xs font-medium italic" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {profileInfo.tagline}
                  </p>
                </div>
              </div>

              {/* Pillar bars */}
              {subScores && (
                <div className="space-y-3">
                  {HERO_PILLARS.map((p, i) => (
                    <HeroPillarBar
                      key={p.key}
                      emoji={p.emoji}
                      label={p.label}
                      score={Math.round(subScores[p.key])}
                      color={p.color}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: score ring + badge */}
            <div className="flex shrink-0 flex-col items-center sm:items-center">
              <ScoreRing
                score={Math.round(score)}
                color={profileInfo.color}
                gradientId="dashboard-hero-ring"
                className="relative h-48 w-48 sm:h-52 sm:w-52"
                textColor="white"
                percentile={getPercentile(Math.round(score))}
              />
              {/* Profile type badge */}
              {profileType && (
                <div
                  className="mt-3 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide"
                  style={{
                    background: `color-mix(in srgb, ${profileInfo.color} 20%, rgba(255,255,255,0.06))`,
                    color: profileInfo.color,
                    border: `1px solid color-mix(in srgb, ${profileInfo.color} 35%, transparent)`,
                  }}
                >
                  ● {profileType}
                </div>
              )}
              <p
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Overall Score
              </p>
              <p
                className="mt-0.5 text-[10px] text-center"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {getIdentityLabel(Math.round(score)).word} · Top {100 - getPercentile(Math.round(score))}%
              </p>
              {/* Share progress — only when meal history exists */}
              {patterns && (
                <button
                  onClick={() => {
                    const lbl = getIdentityLabel(Math.round(score))
                    const p   = getPercentile(Math.round(score))
                    const url =
                      `/api/og/progress?score=${Math.round(score)}&percentile=${p}` +
                      `&label=${encodeURIComponent(lbl.word)}&emoji=${encodeURIComponent(lbl.emoji)}` +
                      `&streak=${streak}&trend=${patterns.trendDirection}&count=${patterns.analysisCount}`
                    window.open(url, "_blank", "noopener")
                    posthog.capture("progress_shared", {
                      score:          Math.round(score),
                      streak,
                      trend:          patterns.trendDirection,
                      identity_label: lbl.word,
                    })
                  }}
                  className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  <Share2 size={10} /> Share progress
                </button>
              )}
            </div>
          </div>
        ) : (
          /* No assessment yet */
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex-1">
              <h1 className="font-serif text-3xl font-semibold" style={{ color: "white" }}>
                Hi, {firstName} 👋
              </h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                Take the free 5-minute assessment to discover your food system health.
              </p>
              <Link
                href="/assessment"
                className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--icon-green)" }}
              >
                Take the assessment <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex shrink-0 flex-col items-center">
              <div
                className="flex h-48 w-48 items-center justify-center rounded-full"
                style={{
                  border: "11px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="font-serif text-5xl font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                Overall Score
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom fade to page bg */}
      <div
        className="pointer-events-none h-8"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
    </div>
  )
}

/* ── Pillar Score Mini Cards (Overview Tab) ─────────────────────────── */

function PillarMiniRing({ score, color }: { score: number; color: string }) {
  const r = 24
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: 60, height: 60 }}>
      <svg width="60" height="60" className="-rotate-90" style={{ position: "absolute", inset: 0 }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ stroke: color }} />
      </svg>
      <span
        className="relative font-serif text-base font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

function PillarScoreCards({ subScores }: { subScores: NonNullable<ReturnType<typeof extractSubScores>> }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {HERO_PILLARS.map((p) => (
        <div
          key={p.key}
          className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border bg-card p-3"
          style={{ minWidth: 88 }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
            style={{ background: `color-mix(in srgb, ${p.color} 18%, transparent)` }}
          >
            {p.emoji}
          </div>
          <PillarMiniRing score={Math.round(subScores[p.key])} color={p.color} />
          <span className="text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Meal Lab Card ──────────────────────────────────────────────────── */

function MealLabCard({ meals }: { meals: SavedMealAnalysis[] }) {
  const lastMeal = meals[0] ?? null
  const lastColor = lastMeal ? (SCORE_COLORS[lastMeal.scoreBand] ?? "var(--icon-green)") : "var(--icon-green)"
  const foodEmojis = lastMeal?.foods.slice(0, 6).map((f) => f.emoji).join("") ?? ""

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{ background: "linear-gradient(135deg, var(--icon-lime) 0%, var(--icon-green) 28%, var(--icon-teal) 55%, var(--icon-yellow) 78%, var(--icon-orange) 100%)" }}
    >
      {/* Dark scrim for text legibility */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "rgba(0,0,0,0.22)" }}
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <Camera size={15} style={{ color: "white" }} />
              </div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                Meal Lab
              </span>
            </div>

            {lastMeal ? (
              <>
                <p className="font-serif text-xl font-semibold sm:text-2xl" style={{ color: "white" }}>
                  Beat your score
                </p>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Last meal scored{" "}
                  <span className="font-bold tabular-nums" style={{ color: "white" }}>
                    {lastMeal.score}
                  </span>
                  /100 — can you do better?
                </p>
                {foodEmojis && (
                  <p className="mt-2 text-lg leading-none tracking-wide">
                    {foodEmojis}
                  </p>
                )}
                <p className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {meals.length} meal{meals.length !== 1 ? "s" : ""} analysed
                </p>
              </>
            ) : (
              <>
                <p className="font-serif text-xl font-semibold sm:text-2xl" style={{ color: "white" }}>
                  Analyse your meal
                </p>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Upload a photo — see exactly which prebiotics, probiotics and postbiotics are on your plate.
                </p>
              </>
            )}

            <Link
              href="/analyse"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              Analyse a Meal <ArrowRight size={13} />
            </Link>
          </div>

          {/* Right: score ring or camera placeholder */}
          {lastMeal ? (
            <div className="flex shrink-0 flex-col items-center">
              <MealScoreRing score={lastMeal.score} band={lastMeal.scoreBand} />
              <p
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Last meal
              </p>
            </div>
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Camera size={24} style={{ color: "rgba(255,255,255,0.6)" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Biotics Balance Card (live scores + improvement tips) ──────────── */

function bioticsLabel(pct: number): "Strong" | "Good" | "Building" | "Low" {
  if (pct >= 80) return "Strong"
  if (pct >= 60) return "Good"
  if (pct >= 40) return "Building"
  return "Low"
}

const BIOTICS_TIPS: Record<string, Record<string, string>> = {
  prebiotic: {
    Strong:   "Great plant diversity — keep rotating species daily",
    Good:     "Try adding leeks, asparagus or oats to widen variety",
    Building: "Add garlic, onion, or banana to each meal",
    Low:      "Start with one fibre-rich food per meal: oats, garlic, or banana",
  },
  probiotic: {
    Strong:   "Strong live cultures — vary your fermented sources",
    Good:     "Add a second fermented food alongside your regular one",
    Building: "Add a daily tablespoon of sauerkraut or kefir",
    Low:      "Start with natural yogurt or miso once daily",
  },
  postbiotic: {
    Strong:   "Your gut bacteria are producing healthy compounds",
    Good:     "Sourdough or aged cheese add more postbiotic compounds",
    Building: "Focus on prebiotics — postbiotics follow from fibre",
    Low:      "Postbiotics come from fermentation — prioritise prebiotics first",
  },
}

const BIOTICS_MEASURED: Record<string, string> = {
  prebiotic:  "Fibre-rich plant foods across your meals",
  probiotic:  "Live fermented foods (kefir, yogurt, kimchi)",
  postbiotic: "Compounds your gut produces when fermenting fibre",
}

function BioticsRing({ score, color }: { score: number; color: string }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" className="-rotate-90" style={{ position: "absolute", inset: 0 }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <p className="absolute text-sm font-bold tabular-nums" style={{ color }}>{score}</p>
    </div>
  )
}

function BioticsBalanceCard({ meals, bioticsProfile }: { meals: SavedMealAnalysis[]; bioticsProfile?: BioticsProfile | null }) {
  const BIOTICS_CONFIG = [
    { key: "prebiotic",  icon: "🌱", label: "Prebiotics",  color: "var(--icon-lime)" },
    { key: "probiotic",  icon: "🦠", label: "Probiotics",  color: "var(--icon-green)" },
    { key: "postbiotic", icon: "✨", label: "Postbiotics", color: "var(--icon-teal)" },
  ]

  let prebioticPct = 0, probioticPct = 0, postbioticPct = 0
  let hasData = false

  if (bioticsProfile) {
    prebioticPct  = Math.min(100, Math.round((bioticsProfile.prebiotic  / 45) * 100))
    probioticPct  = Math.min(100, Math.round((bioticsProfile.probiotic  / 25) * 100))
    postbioticPct = Math.min(100, Math.round((bioticsProfile.postbiotic / 15) * 100))
    hasData = true
  } else if (meals.length > 0) {
    // Fallback: derive from meal foods using the scoring rubric
    const allFoods = meals.flatMap((m) => m.foods)
    const preCt  = allFoods.filter((f) => f.biotic === "prebiotic").length
    const proCt  = allFoods.filter((f) => f.biotic === "probiotic").length
    const postCt = allFoods.filter((f) => f.biotic === "postbiotic").length
    const rawPre  = preCt >= 4 ? 45 : preCt === 3 ? 40 : preCt === 2 ? 32 : preCt === 1 ? 20 : 0
    const rawPro  = proCt >= 2 ? 25 : proCt === 1 ? 20 : 10
    const rawPost = postCt >= 1 ? 15 : 5
    prebioticPct  = Math.round((rawPre  / 45) * 100)
    probioticPct  = Math.round((rawPro  / 25) * 100)
    postbioticPct = Math.round((rawPost / 15) * 100)
    hasData = true
  }

  const biotics = [
    { ...BIOTICS_CONFIG[0], pct: prebioticPct },
    { ...BIOTICS_CONFIG[1], pct: probioticPct },
    { ...BIOTICS_CONFIG[2], pct: postbioticPct },
  ]

  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">The 3 Biotics</p>
            <h3 className="mt-0.5 font-serif text-lg font-semibold text-foreground">Your Biotics Profile</h3>
          </div>
          <Link href="/course" className="shrink-0 text-xs font-semibold text-muted-foreground transition-opacity hover:opacity-70">
            Learn framework →
          </Link>
        </div>

        {hasData ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {biotics.map((b) => {
                const label = bioticsLabel(b.pct)
                const tip   = BIOTICS_TIPS[b.key]?.[label] ?? ""
                const desc  = BIOTICS_MEASURED[b.key] ?? ""
                return (
                  <div key={b.key} className="flex flex-col items-center gap-2 rounded-2xl border bg-muted/20 p-3 text-center">
                    <span className="text-xl leading-none">{b.icon}</span>
                    <BioticsRing score={b.pct} color={b.color} />
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        background: `color-mix(in srgb, ${b.color} 15%, transparent)`,
                        color: b.color,
                      }}
                    >
                      {label}
                    </span>
                    <div className="w-full space-y-2 text-left">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">How measured</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{desc}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">To improve</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-foreground">{tip}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {bioticsProfile && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                Based on {bioticsProfile.analysisCount} recent {bioticsProfile.analysisCount === 1 ? "analysis" : "analyses"}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {BIOTICS_CONFIG.map((b) => (
                <div key={b.key} className="flex flex-col items-center gap-2 rounded-2xl border bg-muted/20 p-3 text-center">
                  <span className="text-xl leading-none">{b.icon}</span>
                  <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
                    <svg width="64" height="64" className="-rotate-90" style={{ position: "absolute", inset: 0 }}>
                      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
                    </svg>
                    <p className="absolute text-xs text-muted-foreground">—</p>
                  </div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{b.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">Analyse meals to build your Biotics profile</p>
              <Link
                href="/analyse"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                <Camera size={12} /> Analyse a Meal
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Analyse Meal Card (primary daily action for paid tiers) ────────── */

function AnalyseMealCard({
  tier,
  dailyAnalysesUsed,
}: {
  tier: "grow" | "restore" | "transform"
  dailyAnalysesUsed: number
}) {
  const limit = DAILY_LIMITS[tier]
  const remaining = Math.max(0, limit - dailyAnalysesUsed)
  const atLimit = remaining === 0
  const oneLeft = remaining === 1

  const gradients: Record<string, string> = {
    grow:      "linear-gradient(135deg, #bef264 0%, var(--icon-lime) 40%, var(--icon-green) 100%)",
    restore:   "linear-gradient(135deg, var(--icon-green) 0%, var(--icon-teal) 60%, #0ea5e9 100%)",
    transform: "linear-gradient(135deg, var(--icon-teal) 0%, var(--icon-yellow) 50%, var(--icon-orange) 100%)",
  }
  const gradient = gradients[tier]

  if (atLimit) {
    return (
      <div className="overflow-hidden rounded-3xl border" style={{ background: "var(--muted)" }}>
        <div className="h-1.5 w-full" style={{ background: gradient, opacity: 0.35 }} />
        <div className="flex flex-col gap-4 px-6 py-7 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card">
            <Camera size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-serif text-2xl font-bold text-muted-foreground">Daily limit reached</p>
            <p className="mt-1 text-sm text-muted-foreground">Come back tomorrow to analyse your next meal</p>
          </div>
          <div className="shrink-0 rounded-full bg-card px-6 py-3 text-sm font-semibold text-muted-foreground">
            Analyse a Meal
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-3xl" style={{ background: gradient }}>
      {/* Dark scrim for text legibility */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        {/* Left */}
        <div className="flex-1">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <Camera size={22} style={{ color: "white" }} />
          </div>
          <p className="font-serif text-3xl font-bold" style={{ color: "white" }}>
            Analyse a Meal
          </p>
          <p className="mt-1.5 text-base" style={{ color: "rgba(255,255,255,0.78)" }}>
            Log what you ate and see how it scores across your 5 pillars
          </p>
          {oneLeft && (
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "rgba(251,191,36,0.28)", color: "white" }}
            >
              ⚠ Last analysis for today
            </span>
          )}
        </div>
        {/* CTA */}
        <Link
          href="/analyse"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] sm:self-center"
          style={{ background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.38)" }}
        >
          <Camera size={15} /> Analyse a Meal
        </Link>
      </div>
    </div>
  )
}

/* ── Today Card (tier-specific daily action hub) ────────────────────── */

function TodayCard({
  membershipTier,
  latestScore,
  dailyAnalysesUsed,
  weeklyCheckin,
  monthlyGutPlan,
  streak = 0,
  latestSubScores,
  dailyPromptIndex = 0,
  consultHref,
}: {
  membershipTier: Profile["membership_tier"]
  latestScore: number | null
  dailyAnalysesUsed: number
  weeklyCheckin?: { content: string; week_starting: string } | null
  monthlyGutPlan?: { content: string; month: string } | null
  streak?: number
  latestSubScores?: Record<string, number> | null
  dailyPromptIndex?: number
  consultHref?: string
}) {
  const limit = DAILY_LIMITS[membershipTier] ?? 0
  const remaining = Math.max(0, limit - dailyAnalysesUsed)

  /* Free — start journey, no checklist, no "Unlock with X" */
  if (membershipTier === "free") {
    if (latestScore == null) {
      return (
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
          <div className="p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Start your journey</p>
            <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">Discover your food system score</h3>
            <p className="mb-4 text-sm text-muted-foreground">A free 5-minute assessment reveals your Biotics Score and identifies exactly where your food system needs attention.</p>
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            >
              Take your free assessment <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
        <div className="p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Start your journey</p>
          <div className="mb-4 flex items-center gap-4">
            <div>
              <p className="font-serif text-4xl font-bold tabular-nums leading-none" style={{ color: "var(--icon-green)" }}>{Math.round(latestScore)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Your Biotics Score</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Your foundation is set.</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Now see exactly how your meals are moving it.</p>
            </div>
          </div>
          <Link
            href="/analyse"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            Analyse your first meal <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  /* Grow — habit tracker with streak + daily nudge */
  if (membershipTier === "grow") {
    const dailyPrompt = getDailyPrompt(latestSubScores, dailyPromptIndex)
    return (
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #bef264, var(--icon-lime))" }} />
        <div className="p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>Today&apos;s habit</p>
          {/* Streak */}
          <div className="mb-3 flex items-center gap-2">
            {streak > 0 ? (
              <>
                <span className="text-lg leading-none">🔥</span>
                <span className="font-serif text-xl font-bold tabular-nums text-foreground">{streak} day streak</span>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Start your streak today</p>
            )}
          </div>
          {/* Daily nudge */}
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Today&apos;s nudge</p>
            <p className="text-sm text-foreground">{dailyPrompt}</p>
          </div>
        </div>
      </div>
    )
  }

  /* Restore — this month's focus + weakest pillar + daily nudge */
  if (membershipTier === "restore") {
    const dailyPrompt = getDailyPrompt(latestSubScores, dailyPromptIndex)
    const pillarLabels: Record<string, string> = {
      diversity: "Plant Diversity", feeding: "Feeding", adding: "Live Foods",
      consistency: "Consistency", feeling: "Feeling",
    }
    let weakestPillarLabel = "Live Foods"
    if (latestSubScores) {
      let lowestVal = Infinity
      for (const [k, v] of Object.entries(latestSubScores)) {
        if (v < lowestVal && pillarLabels[k]) { lowestVal = v; weakestPillarLabel = pillarLabels[k] }
      }
    }
    return (
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }} />
        <div className="p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>This month&apos;s focus</p>
          <h3 className="mb-1 font-serif text-base font-semibold text-foreground">Your {weakestPillarLabel} score needs attention</h3>
          {monthlyGutPlan && (
            <p className="mb-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {monthlyGutPlan.content.slice(0, 120)}{monthlyGutPlan.content.length > 120 ? "…" : ""}
            </p>
          )}
          {/* Daily nudge */}
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Today&apos;s nudge</p>
            <p className="text-sm text-foreground">{dailyPrompt}</p>
          </div>
        </div>
      </div>
    )
  }

  /* Transform — EatoBiotic insight as primary, Analyse as secondary */
  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-orange), var(--icon-teal))" }} />
      <div className="p-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>EatoBiotic&apos;s latest insight</p>
        {weeklyCheckin ? (
          <div className="mb-4 rounded-2xl border bg-muted/30 p-3.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">This week</p>
            <p className="text-sm text-foreground leading-relaxed line-clamp-2">{weeklyCheckin.content.slice(0, 150)}…</p>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border bg-muted/30 p-3.5">
            <p className="text-sm text-muted-foreground">Your weekly insight arrives Monday — generated from your meal analyses.</p>
          </div>
        )}
        {/* Primary CTA: Ask EatoBiotic */}
        <Link
          href={consultHref ?? "/account/consult"}
          className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))" }}
        >
          <MessageSquare size={14} /> Ask EatoBiotic
        </Link>
      </div>
    </div>
  )
}

/* ── Feature Preview Card (replaces blur FeatureGate) ───────────────── */

function ScoreHistoryPreview({ score }: { score: number | null }) {
  /* A simple static SVG spark-line showing an upward trend */
  const pts = [22, 35, 30, 48, 55, 50, 68]
  const w = 220, h = 60, pad = 8
  const minY = Math.min(...pts), maxY = Math.max(...pts)
  const range = maxY - minY || 1
  const toX = (i: number) => pad + (i / (pts.length - 1)) * (w - pad * 2)
  const toY = (v: number) => h - pad - ((v - minY) / range) * (h - pad * 2)
  const polyline = pts.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")
  const labels = ["Jan 1", "Jan 8", "Jan 15", "Jan 22", "Jan 29", "Feb 5", "Feb 12"]

  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-lime) 18%, transparent)" }}>
            <Zap size={15} style={{ color: "var(--icon-lime)" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Score History</p>
            <p className="text-sm font-semibold text-foreground">Your 30-Day Score Trend</p>
          </div>
        </div>

        {/* Sample sparkline */}
        <div className="relative mb-3 overflow-hidden rounded-2xl border bg-muted/30 p-3">
          <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--icon-lime)" />
                <stop offset="100%" stopColor="var(--icon-green)" />
              </linearGradient>
            </defs>
            <polyline fill="none" stroke="url(#sparkGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
            {pts.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="var(--icon-green)" />
            ))}
          </svg>
          <div className="mt-1 flex justify-between">
            {[labels[0], labels[3], labels[6]].map((l) => (
              <span key={l} className="text-[9px] text-muted-foreground/60">{l}</span>
            ))}
          </div>
          {/* Blur overlay on sample data */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(to top, var(--card) 0%, transparent 60%)" }} />
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
            <span className="rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm">Sample data</span>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
          {score != null
            ? `Your score is ${Math.round(score)}. With Grow, you'll see exactly which meals are moving it — daily.`
            : "Track how each of your 5 pillars changes week to week. Most members improve 8–15 points in their first month of daily tracking."}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          Build the habit <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function MonthlyPlanPreview({ addingScore }: { addingScore: number | null }) {
  const sampleText = "Your food system this month is showing real momentum. Your plant diversity has been one of your stronger pillars, but your Live Foods score is pulling down your overall Biotics number — this month, that's your primary focus. Fermented foods are the fastest lever you have..."

  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }} />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-teal) 18%, transparent)" }}>
            <Sparkles size={15} style={{ color: "var(--icon-teal)" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Monthly Plan</p>
            <p className="text-sm font-semibold text-foreground">Your Monthly Gut Plan</p>
          </div>
        </div>

        {/* Faded sample text */}
        <div className="relative mb-3 overflow-hidden rounded-2xl border bg-muted/20 px-4 py-3" style={{ maxHeight: 80 }}>
          <p className="text-sm text-foreground leading-relaxed">{sampleText}</p>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-2xl"
            style={{ background: "linear-gradient(to top, var(--card), transparent)" }} />
        </div>

        <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
          {addingScore != null
            ? `EatoBiotic can build your Live Foods recovery plan — month by month, targeting your biggest opportunity.`
            : "EatoBiotic can build your personalised gut recovery plan — month by month, targeting your weakest pillar."}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        >
          See your plan <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function TransformPreview() {
  const starterQuestions = [
    "Why is my score dropping?",
    "What should I eat this week?",
    "I have IBS — help me adapt",
  ]
  const sampleCheckin = "This week your food system data showed a solid upward trend — your average meal score came in at 71, up from 64 the week before. You logged 5 analyses, which is exactly the consistency that drives meaningful change."

  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-orange), var(--icon-teal))" }} />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-orange) 18%, transparent)" }}>
            <MessageSquare size={15} style={{ color: "var(--icon-orange)" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">EatoBiotic</p>
            <p className="text-sm font-semibold text-foreground">Your Food System Consultant</p>
          </div>
        </div>

        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          {/* Weekly check-in preview */}
          <div className="rounded-2xl border bg-muted/20 p-3.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Weekly Check-in</p>
            <p className="text-xs text-foreground leading-relaxed italic line-clamp-3">"{sampleCheckin}"</p>
          </div>
          {/* AI advisor preview */}
          <div className="rounded-2xl border bg-muted/20 p-3.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ask EatoBiotic</p>
            <div className="space-y-1.5">
              {starterQuestions.map((q) => (
                <div key={q} className="rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground" style={{ background: "color-mix(in srgb, var(--icon-orange) 10%, transparent)" }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
          Ask EatoBiotic to analyse your patterns and tell you exactly what to change — always on and personalised to your scores.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))" }}
        >
          Talk to EatoBiotic <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/* ── Advisor Section (Transform only — live Claude-powered section) ─── */

function AdvisorSection({
  weeklyCheckin,
  dailyConsultCount,
  monthlyConsultCount,
  consultHref = "/account/consult",
}: {
  weeklyCheckin?: { content: string; week_starting: string } | null
  dailyConsultCount: number
  monthlyConsultCount: number
  consultHref?: string
}) {
  const starterQuestions = [
    "Why is my score dropping?",
    "What should I eat this week?",
    "I have IBS — help me adapt",
    "Build me a high-score meal",
  ]

  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-orange), var(--icon-teal))" }} />
      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-orange) 18%, transparent)" }}>
            <MessageSquare size={15} style={{ color: "var(--icon-orange)" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">EatoBiotic</p>
            <p className="text-sm font-semibold text-foreground">Your Food System Consultant</p>
          </div>
        </div>

        {/* Weekly check-in excerpt */}
        {weeklyCheckin ? (
          <div className="mb-3 rounded-2xl border bg-muted/20 p-3.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">This week</p>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">{weeklyCheckin.content.slice(0, 200)}</p>
          </div>
        ) : (
          <div className="mb-3 rounded-2xl border bg-muted/20 p-3.5">
            <p className="text-sm text-muted-foreground">Your first weekly check-in arrives Monday — generated from your meal analyses and scores.</p>
          </div>
        )}

        {/* Starter question pills */}
        <div className="mb-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ask about the Food System Inside You</p>
          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((q) => (
              <Link
                key={q}
                href={`${consultHref}?q=${encodeURIComponent(q)}`}
                className="rounded-full border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 30%, var(--border))" }}
              >
                {q}
              </Link>
            ))}
          </div>
        </div>

        {/* Usage stats */}
        <div className="mb-4 flex items-center gap-4">
          <p className="text-xs text-muted-foreground">
            Today: <span className={cn("font-semibold", dailyConsultCount >= 2 ? "text-amber-500" : "text-foreground")}>{dailyConsultCount}/2</span>
          </p>
          <p className="text-xs text-muted-foreground">
            This month: <span className={cn("font-semibold", monthlyConsultCount >= 60 ? "text-amber-500" : "text-foreground")}>{monthlyConsultCount}/60</span>
          </p>
        </div>

        {/* CTA */}
        <Link
          href={consultHref}
          className="flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))" }}
        >
          <MessageSquare size={14} /> Ask EatoBiotic
        </Link>
      </div>
    </div>
  )
}

/* ── Primary Feature Cards ──────────────────────────────────────────── */

function PrimaryFeatureCards({
  membershipTier,
  patterns,
  hasMealPlan,
  latestMonthlyReview,
  storyLastUpdated,
  setActiveTab,
}: {
  membershipTier: string
  patterns?: AnalysisPatterns | null
  hasMealPlan?: boolean
  latestMonthlyReview?: { month: string } | null
  storyLastUpdated?: string | null
  setActiveTab: (tab: TabKey) => void
}) {
  const tier = TIER_ORDER[membershipTier] ?? 0

  const trendIcon = patterns
    ? { up: "↑", stable: "→", down: "↓" }[patterns.trendDirection]
    : null
  const trendColor = patterns
    ? { up: "var(--icon-green)", stable: "var(--icon-yellow)", down: "#ef4444" }[patterns.trendDirection]
    : "var(--icon-green)"

  const monthName = latestMonthlyReview
    ? new Date(latestMonthlyReview.month + "-02").toLocaleDateString("en-IE", { month: "long", year: "numeric" })
    : null

  const storyUpdated = storyLastUpdated
    ? new Date(storyLastUpdated).toLocaleDateString("en-IE", { month: "short", year: "numeric" })
    : null

  type Card = {
    key: string
    title: string
    subtitle: string
    dataLine: string | null
    color: string
    icon: React.ReactNode
    href: string
    cta: string
    minTier: number
    requiredLabel: string
  }

  const cards: Card[] = [
    {
      key: "patterns",
      title: "Pattern Insights",
      subtitle: patterns ? `Best day: ${patterns.bestDay}` : "Log 3+ meals to unlock",
      dataLine: patterns
        ? `${trendIcon} ${patterns.trendDirection === "up" ? "Trending up" : patterns.trendDirection === "down" ? "Dipping" : "Holding steady"} · ${patterns.bestStreak}d streak`
        : null,
      color: "var(--icon-lime)",
      icon: <TrendingUp size={16} style={{ color: "var(--icon-lime)" }} />,
      href: "/analyse",
      cta: patterns ? "View Patterns" : "Log a Meal",
      minTier: 0,
      requiredLabel: "",
    },
    {
      key: "meal-plan",
      title: "Your Meal Plan",
      subtitle: "A simple plan to help structure your week",
      dataLine: hasMealPlan ? "This week's plan is ready" : "No plan yet — generate one",
      color: "var(--icon-teal)",
      icon: <Calendar size={16} style={{ color: "var(--icon-teal)" }} />,
      href: "/account/meal-plan",
      cta: "View Your Meal Plan",
      minTier: 2,
      requiredLabel: "Restore+",
    },
    {
      key: "food-system",
      title: "Your Food System",
      subtitle: "Your progress, patterns, and improvements",
      dataLine: storyUpdated ? `Last updated ${storyUpdated}` : "Generate your food system story",
      color: "var(--icon-orange)",
      icon: <BookOpen size={16} style={{ color: "var(--icon-orange)" }} />,
      href: "/account/story",
      cta: "View Your Food System",
      minTier: 3,
      requiredLabel: "Transform",
    },
    {
      key: "monthly-review",
      title: "Monthly Review",
      subtitle: "Your latest monthly reflection and progress summary",
      dataLine: monthName ? `Latest: ${monthName}` : "Generated on the 1st each month",
      color: "var(--icon-green)",
      icon: <CalendarCheck size={16} style={{ color: "var(--icon-green)" }} />,
      href: "/account/monthly-review",
      cta: "View Monthly Review",
      minTier: 3,
      requiredLabel: "Transform",
    },
  ]

  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Your Food System
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const unlocked = tier >= card.minTier
          if (unlocked) {
            return (
              <Link
                key={card.key}
                href={card.href}
                className="group flex flex-col rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="h-[3px] w-full" style={{ background: card.color }} />
                <div className="flex flex-col flex-1 p-4">
                  <span
                    className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${card.color} 15%, transparent)` }}
                  >
                    {card.icon}
                  </span>
                  <p className="text-sm font-semibold leading-tight text-foreground">{card.title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{card.subtitle}</p>
                  {card.dataLine && (
                    <p
                      className="mt-1.5 text-[11px] font-semibold"
                      style={{ color: card.key === "patterns" ? trendColor : card.color }}
                    >
                      {card.dataLine}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold" style={{ color: card.color }}>
                      {card.cta}
                    </span>
                    <ArrowRight size={11} style={{ color: card.color }} />
                  </div>
                </div>
              </Link>
            )
          }
          return (
            <button
              key={card.key}
              onClick={() => setActiveTab("membership")}
              className="relative flex flex-col rounded-2xl border bg-card shadow-sm text-left opacity-55 transition-opacity hover:opacity-75 overflow-hidden"
            >
              <div className="h-[3px] w-full bg-muted" />
              <div className="flex flex-col flex-1 p-4">
                <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
                  {card.icon}
                </span>
                <Lock size={10} className="absolute right-3 top-4 text-muted-foreground" />
                <p className="text-sm font-semibold leading-tight text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground/60">{card.subtitle}</p>
                <div className="mt-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      background: `color-mix(in srgb, ${card.color} 12%, transparent)`,
                      color: card.color,
                    }}
                  >
                    {card.requiredLabel}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Food System Tools Grid ─────────────────────────────────────────── */

const TIER_ORDER: Record<string, number> = { free: 0, grow: 1, restore: 2, transform: 3 }

const FOOD_SYSTEM_TOOLS = [
  {
    key: "deep-dive",
    title: "Condition Deep Dive",
    description: "9 condition profiles built from your data",
    href: "/account/consult/deep-dive",
    icon: Search,
    requiredTier: "transform",
    color: "var(--icon-orange)",
  },
  {
    key: "doctor-report",
    title: "Doctor Report",
    description: "Share your food system data with a clinician",
    href: "/account/doctor-report",
    icon: ClipboardList,
    requiredTier: "transform",
    color: "var(--icon-lime)",
  },
] as const

function FoodSystemToolsGrid({
  membershipTier,
  setActiveTab,
}: {
  membershipTier: string
  setActiveTab: (tab: TabKey) => void
}) {
  const TIER_LABEL: Record<string, string> = { restore: "Restore", transform: "Transform" }
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        More Tools
      </p>
      <div className="grid grid-cols-2 gap-3">
        {FOOD_SYSTEM_TOOLS.map((tool) => {
          const unlocked = TIER_ORDER[membershipTier] >= TIER_ORDER[tool.requiredTier]
          const Icon = tool.icon
          if (unlocked) {
            return (
              <Link
                key={tool.key}
                href={tool.href}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${tool.color} 15%, transparent)` }}
                >
                  <Icon size={16} style={{ color: tool.color }} />
                </span>
                <p className="mt-2.5 text-sm font-semibold leading-tight text-foreground">{tool.title}</p>
                <p className="mt-1 flex-1 text-xs leading-snug text-muted-foreground">{tool.description}</p>
                <div className="mt-3 flex justify-end">
                  <ArrowRight size={12} style={{ color: tool.color }} />
                </div>
              </Link>
            )
          }
          return (
            <button
              key={tool.key}
              onClick={() => setActiveTab("membership")}
              className="relative flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-left opacity-60 transition-opacity hover:opacity-80"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Icon size={16} className="text-muted-foreground" />
              </span>
              <Lock size={10} className="absolute right-3 top-3 text-muted-foreground" />
              <p className="mt-2.5 text-sm font-semibold leading-tight text-muted-foreground">{tool.title}</p>
              <p className="mt-1 flex-1 text-xs leading-snug text-muted-foreground/60">{tool.description}</p>
              <div className="mt-3">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    background: `color-mix(in srgb, ${tool.color} 12%, transparent)`,
                    color: tool.color,
                  }}
                >
                  {TIER_LABEL[tool.requiredTier]}+
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Pattern Insights Strip ─────────────────────────────────────────── */

function PatternInsightsStrip({ patterns }: { patterns: AnalysisPatterns | null }) {
  if (!patterns) return null
  const trendConfig = {
    up:     { icon: <TrendingUp size={12} style={{ color: "var(--icon-green)" }} />,  label: "↑ Trending up" },
    stable: { icon: <ArrowRight size={12} style={{ color: "var(--icon-yellow)" }} />, label: "→ Holding steady" },
    down:   { icon: <TrendingUp size={12} className="rotate-180" style={{ color: "#ef4444" }} />, label: "↓ Dipping" },
  }[patterns.trendDirection]
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Your Meal Patterns
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
          <TrendingUp size={12} style={{ color: "var(--icon-lime)" }} />
          Best day: {patterns.bestDay}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
          {trendConfig.icon}
          {trendConfig.label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
          <Zap size={12} style={{ color: "var(--icon-orange)" }} />
          Best streak: {patterns.bestStreak} day{patterns.bestStreak !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}

/* ── Overview Tab ───────────────────────────────────────────────────── */

function OverviewTab({
  assessments,
  mindAssessments = [],
  membershipTier,
  weeklyCheckin,
  monthlyGutPlan,
  dailyConsultCount = 0,
  monthlyConsultCount = 0,
  bioticsProfile,
  streak = 0,
  dailyPromptIndex = 0,
  consultHref,
  patterns,
  setActiveTab,
  hasMealPlan,
  latestMonthlyReview,
  storyLastUpdated,
  userId,
  signupDate,
  latestPaidReport,
  healthGoals,
}: {
  assessments: AssessmentRow[]
  mindAssessments?: AssessmentRow[]
  membershipTier: Profile["membership_tier"]
  weeklyCheckin?: { content: string; week_starting: string } | null
  monthlyGutPlan?: { content: string; month: string } | null
  dailyConsultCount?: number
  monthlyConsultCount?: number
  bioticsProfile?: BioticsProfile | null
  streak?: number
  dailyPromptIndex?: number
  consultHref?: string
  patterns?: AnalysisPatterns | null
  setActiveTab: (tab: TabKey) => void
  hasMealPlan?: boolean
  latestMonthlyReview?: { month: string } | null
  storyLastUpdated?: string | null
  userId?: string
  signupDate?: string | null
  latestPaidReport?: { tier: string; created_at: string } | null
  healthGoals?: string[] | null
}) {
  const latest = assessments[0] ?? null
  const previous = assessments[1] ?? null
  const mindLatest = mindAssessments[0] ?? null
  const mindSubScores = mindLatest ? extractSubScores(mindLatest.sub_scores) : null
  const meals = loadMealAnalyses()
  const [dailyAnalysesUsed, setDailyAnalysesUsed] = useState(0)

  const currentScores = latest ? extractSubScores(latest.sub_scores) : null
  const previousScores = previous ? extractSubScores(previous.sub_scores) : null
  const profileInfo = getProfileInfo(latest?.profile_type ?? null)
  const showRetake = latest ? daysAgo(latest.created_at) > 75 : false

  useEffect(() => {
    if (membershipTier === "free") return
    fetch("/api/analyses/daily-count")
      .then((r) => r.json())
      .then((d: { count?: number }) => { if (typeof d.count === "number") setDailyAnalysesUsed(d.count) })
      .catch(() => {})
  }, [membershipTier])

  return (
    <div className="space-y-5">

      {/* ── Analyse Meal Card (primary daily action — always first) ── */}
      {(membershipTier === "grow" || membershipTier === "restore" || membershipTier === "transform") && (
        <AnalyseMealCard
          tier={membershipTier}
          dailyAnalysesUsed={dailyAnalysesUsed}
        />
      )}

      {/* ── Seven-Day Guide (shown for new users ≤ 7 days old) ── */}
      {userId && signupDate && (
        <SevenDayGuide
          weakestPillar={currentScores ? Object.entries(currentScores).filter(([k]) => k !== "overall").sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] ?? null : null}
          profileColor={profileInfo.color}
          signupDate={signupDate}
          userId={userId}
        />
      )}

      {/* ── Day 8 Challenge (after 7-day guide ends) ─────────────── */}
      {userId && signupDate && Math.floor((Date.now() - new Date(signupDate).getTime()) / 86_400_000) > 7 && (
        <Day8ChallengeCard
          weakestPillar={currentScores ? Object.entries(currentScores).filter(([k]) => k !== "overall").sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] ?? null : null}
          profileColor={profileInfo.color}
          membershipTier={membershipTier}
          userId={userId}
        />
      )}

      {/* ── Score Progress (shown when 2+ assessments exist) ─────── */}
      {previous && previousScores && currentScores && (
        <ScoreProgressCard
          previousScore={previous.overall_score ?? 0}
          currentScore={latest?.overall_score ?? 0}
          previousSubScores={previousScores}
          currentSubScores={currentScores}
          previousDate={previous.created_at}
          currentDate={latest?.created_at ?? ""}
        />
      )}

      {/* ── Goal Progress ─────────────────────────────────── */}
      <GoalProgressCard
        healthGoals={healthGoals ?? null}
        subScores={currentScores}
        profileColor={profileInfo.color}
        membershipTier={membershipTier}
      />

      {/* ── Report Bridge (paid report → subscription prompt) ────── */}
      {latestPaidReport && membershipTier === "free" && (
        <ReportBridgeCard
          reportTier={latestPaidReport.tier}
          reportDate={latestPaidReport.created_at}
          profileType={latest?.profile_type ?? null}
        />
      )}

      {/* ── Monthly Progress (paid tiers) ──────────────────── */}
      {(membershipTier === "grow" || membershipTier === "restore" || membershipTier === "transform") && (
        <MonthlyProgressCard
          membershipTier={membershipTier}
          analysisCount={patterns?.analysisCount ?? 0}
          trendDirection={patterns?.trendDirection ?? "stable"}
          bestStreak={patterns?.bestStreak ?? 0}
          currentScore={latest?.overall_score ?? null}
          previousScore={previous?.overall_score ?? null}
          weakestPillar={currentScores ? Object.entries(currentScores).filter(([k]) => k !== "overall").sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] ?? null : null}
          monthlyReviewContent={null}
        />
      )}

      {/* ── Today Card (daily habit hub) ────────────────────────── */}
      <TodayCard
        membershipTier={membershipTier}
        latestScore={latest?.overall_score ?? null}
        dailyAnalysesUsed={dailyAnalysesUsed}
        weeklyCheckin={weeklyCheckin}
        monthlyGutPlan={monthlyGutPlan}
        streak={streak}
        latestSubScores={currentScores ?? null}
        dailyPromptIndex={dailyPromptIndex}
        consultHref={consultHref}
      />

      {/* ── Primary Feature Cards ────────────────────────────────── */}
      <PrimaryFeatureCards
        membershipTier={membershipTier}
        patterns={patterns}
        hasMealPlan={hasMealPlan}
        latestMonthlyReview={latestMonthlyReview}
        storyLastUpdated={storyLastUpdated}
        setActiveTab={setActiveTab}
      />

      {/* Pillar score mini cards */}
      {currentScores && (
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pillar Scores
          </p>
          <PillarScoreCards subScores={currentScores} />
        </div>
      )}

      {/* Profile identity card */}
      {latest && (
        <div
          className="relative overflow-hidden rounded-3xl border"
          style={{
            background: `color-mix(in srgb, ${profileInfo.color} 5%, var(--card))`,
            borderColor: `color-mix(in srgb, ${profileInfo.color} 20%, var(--border))`,
          }}
        >
          <div
            className="h-[3px] w-full"
            style={{ background: `linear-gradient(90deg, ${profileInfo.color}, color-mix(in srgb, ${profileInfo.color} 30%, transparent))` }}
          />
          <div className="flex items-start justify-between gap-4 p-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: profileInfo.color }}>
                Your Gut Personality
              </p>
              <h2
                className="mt-1 font-serif text-2xl font-bold leading-tight sm:text-3xl"
                style={{ color: profileInfo.color }}
              >
                {latest.profile_type ?? "Your Profile"}
              </h2>
              <p className="mt-2 font-serif text-sm font-medium leading-relaxed text-foreground sm:text-base">
                {profileInfo.tagline}
              </p>
              <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
                Assessed {formatDate(latest.created_at)} · {relativeTime(latest.created_at)}
              </p>
              <Link
                href="/assessment"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: profileInfo.color }}
              >
                View full assessment <ArrowRight size={11} />
              </Link>
            </div>
            {latest.overall_score != null && (
              <div
                className="shrink-0 select-none font-serif text-7xl font-black leading-none tabular-nums"
                style={{ color: profileInfo.color, opacity: 0.08 }}
              >
                {Math.round(latest.overall_score)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Community Pulse ──────────────────────────────────────── */}
      <CommunityPulseCard />

      {/* ── Mind Score card ──────────────────────────────────────── */}
      {mindLatest && (
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }} />
          <div className="flex items-start justify-between p-5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
                Mind Assessment
              </p>
              <h2
                className="mt-1 font-serif text-2xl font-bold leading-tight sm:text-3xl"
                style={{ color: "var(--icon-teal)" }}
              >
                {mindLatest.profile_type ?? "Your Mind Profile"}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
                Assessed {formatDate(mindLatest.created_at)} · {relativeTime(mindLatest.created_at)}
              </p>
              <Link
                href="/assessment-mind"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--icon-teal)" }}
              >
                Retake mind assessment <ArrowRight size={11} />
              </Link>
            </div>
            {mindLatest.overall_score != null && (
              <div
                className="shrink-0 select-none font-serif text-7xl font-black leading-none tabular-nums"
                style={{ color: "var(--icon-teal)", opacity: 0.08 }}
              >
                {Math.round(mindLatest.overall_score)}
              </div>
            )}
          </div>
          {mindSubScores && (
            <div className="px-5 pb-5">
              <PillarScoreCards subScores={mindSubScores} />
            </div>
          )}
        </div>
      )}

      {/* ── Score history / Feature preview ─────────────────────── */}
      {currentScores ? (
        membershipTier === "free" ? (
          <ScoreHistoryPreview score={latest?.overall_score ?? null} />
        ) : (
          <ProgressChart current={currentScores} previous={previousScores} />
        )
      ) : (
        <div className="rounded-3xl border bg-card p-8 text-center">
          <p className="mb-3 text-4xl leading-none">🌿</p>
          <p className="mb-1 font-medium text-foreground">No assessment yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Take the free 5-minute assessment to discover your food system health.
          </p>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--icon-green)" }}
          >
            Take the assessment <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── 3 Biotics Balance ────────────────────────────────────── */}
      <BioticsBalanceCard meals={meals} bioticsProfile={bioticsProfile} />

      {/* ── Monthly Gut Plan (Restore+) or preview ──────────────── */}
      {membershipTier === "restore" || membershipTier === "transform" ? (
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }} />
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
                Monthly Gut Plan
              </p>
              {monthlyGutPlan && (
                <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                  {new Date(monthlyGutPlan.month).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
                </span>
              )}
            </div>
            {monthlyGutPlan ? (
              <>
                <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                  {monthlyGutPlan.content}
                </p>
                <Link
                  href="/api/monthly-plan/generate"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "var(--icon-teal)" }}
                >
                  Regenerate plan <ArrowRight size={11} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Your AI-generated monthly food system plan will appear here.
                </p>
                <GenerateMonthlyPlanButton />
              </>
            )}
          </div>
        </div>
      ) : (
        <MonthlyPlanPreview addingScore={currentScores?.adding ?? null} />
      )}

      {/* ── AI Advisor (Transform) or combined preview ───────────── */}
      {membershipTier === "transform" ? (
        <AdvisorSection
          weeklyCheckin={weeklyCheckin}
          dailyConsultCount={dailyConsultCount}
          monthlyConsultCount={monthlyConsultCount}
          consultHref={consultHref}
        />
      ) : (
        <TransformPreview />
      )}

      {/* ── More Tools (Deep Dive + Doctor Report) ───────────────── */}
      <FoodSystemToolsGrid membershipTier={membershipTier} setActiveTab={setActiveTab} />

      {/* Meal Lab */}
      <MealLabCard meals={meals} />

      {/* Quick Actions */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              emoji: "📋",
              label: latest ? "Retake\nAssessment" : "Take\nAssessment",
              href: "/assessment",
              color: "var(--icon-lime)",
            },
            { emoji: "🥗", label: "Build\nMy Plate", href: "/myplate", color: "var(--icon-green)" },
            { emoji: "📸", label: "Analyse\na Meal", href: "/analyse", color: "var(--icon-teal)" },
          ].map(({ emoji, label, href, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center gap-2.5 rounded-3xl p-4 text-center transition-all hover:scale-[1.02] hover:shadow-md"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${color} 12%, white) 0%, white 100%)`,
                border: `1px solid color-mix(in srgb, ${color} 25%, var(--border))`,
              }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110"
                style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}
              >
                {emoji}
              </span>
              <span className="whitespace-pre-line text-xs font-semibold leading-tight text-foreground">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Assessment History */}
      {assessments.length > 0 && (
        <div className="rounded-3xl border bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assessment History</p>
          <div className="space-y-2.5">
            {assessments.map((a, i) => {
              const info = getProfileInfo(a.profile_type)
              return (
                <div
                  key={a.created_at + i}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3",
                    i === 0 ? "border-l-[5px]" : "border border-border"
                  )}
                  style={
                    i === 0
                      ? {
                          borderLeftColor: info.color,
                          background: `color-mix(in srgb, ${info.color} 6%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.profile_type ?? "Assessment"}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {formatDate(a.created_at)} · {relativeTime(a.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.overall_score != null && (
                      <span
                        className="rounded-full px-3 py-1 text-sm font-bold tabular-nums"
                        style={{
                          background: `color-mix(in srgb, ${info.color} 14%, transparent)`,
                          color: info.color,
                        }}
                      >
                        {Math.round(a.overall_score)}
                      </span>
                    )}
                    {i === 0 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          background: `color-mix(in srgb, ${info.color} 14%, transparent)`,
                          color: info.color,
                        }}
                      >
                        Latest
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Retake nudge */}
      {showRetake && (
        <div className="rounded-3xl border border-dashed bg-card p-5 text-center">
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

      {/* ── Single upgrade prompt (FREE only, benefit-led) ──────── */}
      {membershipTier === "free" && latest?.overall_score != null && (
        <div
          className="overflow-hidden rounded-3xl border p-5 text-center"
          style={{
            background: "color-mix(in srgb, var(--icon-lime) 5%, var(--card))",
            borderColor: "color-mix(in srgb, var(--icon-lime) 20%, var(--border))",
          }}
        >
          <p className="mb-1 font-serif text-base font-semibold text-foreground">
            Your score is {Math.round(latest.overall_score)}. With Grow, you&apos;ll see exactly which meals are moving it — daily.
          </p>
          <p className="mb-3 text-xs text-muted-foreground">Build a streak. Track your habit. See the numbers move.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            Build the habit <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}

/* ── Generate Monthly Plan Button ───────────────────────────────────── */

function GenerateMonthlyPlanButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/monthly-plan/generate", { method: "POST" })
      const data = await res.json() as { content?: string; error?: string }
      if (data.error) throw new Error(data.error)
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan")
    } finally {
      setLoading(false)
    }
  }

  if (done) return <p className="mt-2 text-xs" style={{ color: "var(--icon-teal)" }}>Plan generated — refreshing…</p>

  return (
    <div className="mt-3">
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
      >
        {loading ? "Generating…" : "Generate this month's plan"}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

/* ── Score Ring (Meals + Reports) ───────────────────────────────────── */

function MealScoreRing({ score, band }: { score: number; band: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = SCORE_COLORS[band] ?? "var(--icon-green)"
  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width="52" height="52" className="-rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <p className="absolute text-xs font-bold tabular-nums" style={{ color }}>{score}</p>
    </div>
  )
}

/* ── Reports Tab ────────────────────────────────────────────────────── */

function ReportsTab({ paidReports }: { paidReports: PaidReport[] }) {
  if (paidReports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-lime))" }} />
          <div className="px-6 py-12 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))" }}
            >
              <FileText size={28} className="text-white" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
              Your deep dive awaits
            </h3>
            <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
              Complete the assessment to unlock your personalised food system assessment report — a full breakdown of your food system with actionable steps.
            </p>
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--icon-green)" }}
            >
              Take the assessment <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <PractitionerReportCard />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {paidReports.map((r) => {
        const overallScore = r.free_scores?.overall ?? null
        const band = overallScore != null ? getScoreBand(overallScore) : null
        const topTrigger = typeof r.report_json?.topTrigger === "string" ? r.report_json.topTrigger : null
        const projection = r.report_json?.scoreProjection as { low: number; high: number; timeline: string } | undefined
        const membershipBridge = typeof r.report_json?.membershipBridge === "string" ? r.report_json.membershipBridge : null

        return (
          <div key={r.stripe_session_id} className="overflow-hidden rounded-3xl border bg-card">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
            <div className="p-5">
              {/* Header row */}
              <div className="mb-4 flex items-start justify-between">
                <TierBadge tier={r.tier} />
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>{formatDate(r.created_at)}</span>
              </div>

              {/* Score + profile */}
              <div className="flex items-start gap-4 mb-4">
                {overallScore != null && band && (
                  <MealScoreRing score={Math.round(overallScore)} band={band} />
                )}
                <div className="flex-1">
                  {r.free_scores && (
                    <>
                      <p className="font-serif text-base font-semibold text-foreground">
                        {r.free_scores.profile?.type ?? "Report"}
                      </p>
                      <p className="text-sm text-muted-foreground">Score: {r.free_scores.overall}/100</p>
                    </>
                  )}
                  {/* Score projection */}
                  {projection && (
                    <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--icon-green)" }}>
                      Could reach {projection.low}–{projection.high} in {projection.timeline}
                    </p>
                  )}
                </div>
              </div>

              {/* Top trigger insight */}
              {topTrigger && (
                <div
                  className="mb-3 rounded-xl border-l-2 py-2 px-3 text-xs leading-relaxed text-foreground/80"
                  style={{
                    borderColor: "var(--icon-green)",
                    background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
                  }}
                >
                  <span className="font-semibold" style={{ color: "var(--icon-green)" }}>Key insight: </span>
                  {topTrigger}
                </div>
              )}

              {/* Membership bridge */}
              {membershipBridge && (
                <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground italic">
                  {membershipBridge}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/assessment/report?session_id=${r.stripe_session_id}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                    color: "var(--icon-green)",
                  }}
                >
                  <FileText size={11} /> View report
                </Link>
                {r.pdf_url ? (
                  <a
                    href={r.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{
                      background: "color-mix(in srgb, var(--icon-teal) 12%, transparent)",
                      color: "var(--icon-teal)",
                    }}
                  >
                    <Download size={11} /> Download PDF
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">PDF generating…</span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Practitioner Report */}
      <PractitionerReportCard />
    </div>
  )
}

/* ── Feature Gate Overlay ───────────────────────────────────────────── */

function FeatureGate({
  requiredTier,
  description,
  children,
}: {
  requiredTier: "grow" | "restore" | "transform"
  description: string
  children: React.ReactNode
}) {
  const tierLabel = { grow: "Grow", restore: "Restore", transform: "Transform" }[requiredTier]
  const tierColor = { grow: "var(--icon-lime)", restore: "var(--icon-teal)", transform: "var(--icon-orange)" }[requiredTier]

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Locked content — rendered behind the overlay */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(3px)", opacity: 0.4 }}>
        {children}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
      >
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: `color-mix(in srgb, ${tierColor} 15%, transparent)`, color: tierColor }}
        >
          {tierLabel} feature
        </span>
        <p className="text-sm font-medium text-foreground">{description}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, var(--icon-lime), var(--icon-green))` }}
        >
          Unlock with {tierLabel} <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

/* ── Upgrade Prompt (Membership tab "next level" section) ───────────── */

function UpgradePrompt({
  currentTier,
  latestAssessment,
}: {
  currentTier: Profile["membership_tier"]
  latestAssessment: AssessmentRow | null
}) {
  const addingScore = latestAssessment ? extractSubScores(latestAssessment.sub_scores)?.adding : null

  if (currentTier === "transform") return null

  const config = {
    free: {
      nextTier: "Grow",
      price: "€9.99/mo",
      priceId: process.env.NEXT_PUBLIC_STRIPE_GROW_PRICE_ID ?? "",
      accentColor: "var(--icon-lime)",
      headline: "Add daily meal tracking to your routine",
      body: "2 meal analyses per day, a 30-day score trend, and access to the Plate Builder — everything you need to start building daily food system habits.",
    },
    grow: {
      nextTier: "Restore",
      price: "€49/mo",
      priceId: process.env.NEXT_PUBLIC_STRIPE_RESTORE_PRICE_ID ?? "",
      accentColor: "var(--icon-teal)",
      headline: "Get a personalised monthly plan for your scores",
      body: addingScore != null
        ? `Your Live Foods score is ${Math.round(addingScore)} — the area holding your Biotics number back most. Restore gives you a personalised monthly gut plan, 5 daily analyses with AI context, and condition-specific calibration.`
        : "Restore adds a personalised monthly food system plan, 5 daily analyses with AI context, 90-day score history, and condition-specific calibration.",
    },
    restore: {
      nextTier: "Transform",
      price: "€99/mo",
      priceId: process.env.NEXT_PUBLIC_STRIPE_TRANSFORM_PRICE_ID ?? "",
      accentColor: "var(--icon-orange)",
      headline: "You have the data — now get the conversation",
      body: "Transform adds unlimited AI food system consultations, weekly check-ins, a 10/day analysis quota, and personalised weekly meal plans. Always on, powered by Claude.",
    },
  } as const

  const c = config[currentTier as keyof typeof config]
  if (!c) return null

  return (
    <div
      className="overflow-hidden rounded-3xl border"
      style={{
        background: `color-mix(in srgb, ${c.accentColor} 5%, var(--card))`,
        borderColor: `color-mix(in srgb, ${c.accentColor} 20%, var(--border))`,
      }}
    >
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${c.accentColor}, color-mix(in srgb, ${c.accentColor} 40%, transparent))` }}
      />
      <div className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Zap size={13} style={{ color: c.accentColor }} />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.accentColor }}>
            Add this to your daily routine
          </p>
        </div>
        <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">{c.headline}</h3>
        <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
        <div className="flex items-center gap-3">
          <SubscribeButton priceId={c.priceId} label={`Upgrade to ${c.nextTier}`} />
          <span className="text-xs text-muted-foreground">{c.price} · cancel any time</span>
        </div>
      </div>
    </div>
  )
}

/* ── Manage Subscription Button ─────────────────────────────────────── */

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else console.error("[portal]", data.error)
    } catch (err) {
      console.error("[portal]", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ background: "var(--muted)", color: "var(--foreground)" }}
    >
      {loading ? "Loading…" : "Manage Subscription"}
    </button>
  )
}

/* ── Membership Tab ─────────────────────────────────────────────────── */

function MembershipTab({
  profile,
  nextBillingDate,
  dailyConsultCount = 0,
  monthlyConsultCount = 0,
  latestAssessment,
}: {
  profile: Pick<Profile, "membership" | "membership_tier" | "membership_status" | "membership_expires_at" | "is_founding_member" | "referral_code">
  nextBillingDate?: string | null
  dailyConsultCount?: number
  monthlyConsultCount?: number
  latestAssessment?: AssessmentRow | null
}) {
  const { membership, membership_tier, membership_status, membership_expires_at, is_founding_member } = profile

  const subTiers: Array<{
    key: "free" | "trial" | "member" | "grow" | "restore" | "transform"
    title: string
    price: string
    perks: string[]
  }> = [
    {
      key: "free",
      title: "Free",
      price: "Free",
      perks: [
        "Access to purchased report permanently",
        "Biotics Score visible (today only, no history)",
        "Gut Starter Pack food library access",
        "Weekly Substack delivered to inbox",
        "30-day reassessment reminder",
      ],
    },
    {
      key: "grow",
      title: "Grow",
      price: "€9.99/mo",
      perks: [
        "Everything in Free",
        "2 meal analyses per day",
        "Full three-biotic breakdown per analysis",
        "30-day Biotics Score history and trend line",
        "Monthly reassessment with score delta",
        "EatoBiotics Plate builder",
        "Full food profile library (50+ foods)",
        "Early access to book chapters",
        "Email support",
      ],
    },
    {
      key: "restore",
      title: "Restore",
      price: "€49/mo",
      perks: [
        "Everything in Grow",
        "5 meal analyses per day with AI context",
        "90-day score history with quarterly trend analysis",
        "Condition-specific calibration (IBS, immunity, energy, mood, weight)",
        "Monthly personalised food system plan",
        "Downloadable PDF reports",
        "5-pillar deep dive every month",
        "Priority analysis — faster, more detailed output",
        "Full pre-launch book access",
      ],
    },
    {
      key: "transform",
      title: "Transform",
      price: "€99/mo",
      perks: [
        "Everything in Restore",
        "10 meal analyses per day with full AI context",
        "Unlimited AI food system consultations",
        "Weekly AI check-in",
        "Personalised weekly meal plans",
        "Recipe suggestions calibrated to Biotics Score",
        "Annual Food System Profile",
        is_founding_member ? "✦ Founding Member — permanent recognition" : "Founding member status (if eligible)",
        "Direct input into EatoBiotics product roadmap",
      ],
    },
  ]

  const tierOrder: Record<string, number> = { free: 0, grow: 1, restore: 2, transform: 3 }
  const currentOrder = tierOrder[membership_tier] ?? 0

  const statusLabel: Record<string, string> = {
    active:    "Active",
    inactive:  "Inactive",
    cancelled: "Cancelled",
    past_due:  "Payment due",
  }

  const expiresLabel = membership_expires_at
    ? new Date(membership_expires_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
    : null

  return (
    <div className="space-y-5">
      {/* Current plan summary */}
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current Plan</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground capitalize">
                {membership_tier === "free" ? "Free" : `EatoBiotics ${membership_tier.charAt(0).toUpperCase() + membership_tier.slice(1)}`}
              </h2>
              {membership_status !== "inactive" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      background: membership_status === "active"
                        ? "color-mix(in srgb, var(--icon-green) 15%, transparent)"
                        : "color-mix(in srgb, var(--icon-orange) 15%, transparent)",
                      color: membership_status === "active" ? "var(--icon-green)" : "var(--icon-orange)",
                    }}
                  >
                    {statusLabel[membership_status] ?? membership_status}
                  </span>
                  {nextBillingDate && membership_status === "active" && (
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Next billing: {new Date(nextBillingDate).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {!nextBillingDate && expiresLabel && membership_status === "active" && (
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Renews {expiresLabel}
                    </span>
                  )}
                  {expiresLabel && membership_status === "cancelled" && (
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Access until {expiresLabel}
                    </span>
                  )}
                </div>
              )}
              {/* Transform consultation usage */}
              {membership_tier === "transform" && membership_status === "active" && (
                <div className="mt-3 flex gap-4">
                  <p className="text-xs text-muted-foreground">
                    Consultations today:{" "}
                    <span className="font-semibold text-foreground">{dailyConsultCount}/2</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This month:{" "}
                    <span className="font-semibold text-foreground">{monthlyConsultCount}/60</span>
                  </p>
                </div>
              )}
            </div>
            {membership_tier !== "free" && <ManageSubscriptionButton />}
          </div>

          {/* Free tier: referral progress */}
          {membership === "free" && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress to Early Access</span>
                <span className="font-semibold" style={{ color: "var(--icon-green)" }}>0 / 3 referrals</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }}>
                <div className="h-full rounded-full" style={{ width: "0%", background: "linear-gradient(90deg, #7bc67e, #56C135)" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade prompt — personalised next-tier pitch */}
      <UpgradePrompt currentTier={membership_tier} latestAssessment={latestAssessment ?? null} />

      {/* Tier comparison cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subTiers.map((tier) => {
          const isActive = tier.key === membership_tier && membership_status === "active"
          const tierNum = tierOrder[tier.key] ?? 0
          const isUpgrade = tierNum > currentOrder
          const isDowngrade = tierNum < currentOrder && membership_status === "active"

          return (
            <div
              key={tier.key}
              className="overflow-hidden rounded-3xl border bg-card"
              style={isActive ? { borderColor: "var(--icon-green)", borderWidth: 2 } : undefined}
            >
              <div
                className="px-4 py-3"
                style={isActive
                  ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }
                  : { background: "var(--muted)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className={cn("font-serif text-sm font-semibold", isActive ? "text-white" : "text-foreground")}>
                      {tier.title}
                    </h3>
                    <p className={cn("text-xs", isActive ? "text-white/70" : "text-muted-foreground")}>
                      {tier.price}
                    </p>
                  </div>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Active
                    </span>
                  )}
                  {tier.key === "transform" && is_founding_member && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ background: "var(--icon-orange)" }}>
                      Founding
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4 py-3">
                <ul className="mb-4 space-y-1.5">
                  {tier.perks.slice(0, 5).map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check size={11} className="mt-0.5 shrink-0 text-muted-foreground/50" />
                      {perk}
                    </li>
                  ))}
                  {tier.perks.length > 5 && (
                    <li className="text-xs text-muted-foreground/60">+{tier.perks.length - 5} more</li>
                  )}
                </ul>

                {isActive ? (
                  <div className="w-full rounded-full bg-muted py-1.5 text-center text-xs font-semibold text-muted-foreground">
                    Current plan
                  </div>
                ) : tier.key === "free" ? (
                  <div className="w-full rounded-full bg-muted py-1.5 text-center text-xs text-muted-foreground/60">
                    —
                  </div>
                ) : isUpgrade ? (
                  <SubscribeButton priceId={process.env[`NEXT_PUBLIC_STRIPE_${tier.key.toUpperCase()}_PRICE_ID`] ?? ""} label="Upgrade" />
                ) : isDowngrade ? (
                  <ManageSubscriptionButton />
                ) : (
                  <SubscribeButton priceId={process.env[`NEXT_PUBLIC_STRIPE_${tier.key.toUpperCase()}_PRICE_ID`] ?? ""} label="Get started" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Link to full pricing page */}
      <div className="text-center">
        <Link href="/pricing" className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline">
          View full feature comparison →
        </Link>
      </div>
    </div>
  )
}

/* ── Subscribe Button (uses NEXT_PUBLIC price IDs) ──────────────────── */

function SubscribeButton({ priceId, label }: { priceId: string; label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!priceId) {
      window.location.href = "/pricing"
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error("[subscribe]", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
    >
      {loading ? "Loading…" : label}
    </button>
  )
}

/* ── Plant Ring ─────────────────────────────────────────────────────── */

function PlantRing({ count, target = 30 }: { count: number; target?: number }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(count / target, 1))
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      <svg width="80" height="80" className="-rotate-90" style={{ position: "absolute", inset: 0 }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ stroke: "var(--icon-green)" }} />
      </svg>
      <div className="text-center">
        <p className="text-xl font-bold tabular-nums leading-none" style={{ color: "var(--icon-green)" }}>{count}</p>
        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">/{target}</p>
      </div>
    </div>
  )
}

/* ── My Plate Tab ───────────────────────────────────────────────────── */

function PlateTab({ plateData }: { plateData: PlateData | null }) {
  const plantCount = plateData?.plants?.length ?? 0
  const lastSaved = plateData ? relativeTime(plateData.updated_at) : null
  const pct = Math.round((plantCount / 30) * 100)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
        <div className="p-6">
          <div className="flex items-center gap-5">
            <PlantRing count={plantCount} />
            <div className="flex-1">
              <p className="font-serif text-xl font-semibold text-foreground">
                {plantCount} plant{plantCount !== 1 ? "s" : ""} this week
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {plantCount === 0
                  ? "Target: 30 plants per week — every plant counts"
                  : pct >= 100
                  ? "You've hit your weekly plant target! 🎉"
                  : `${30 - plantCount} more to reach your 30-plant target`}
              </p>
              {lastSaved && (
                <p className="mt-1 text-xs text-muted-foreground/60" suppressHydrationWarning>Last synced {lastSaved}</p>
              )}
            </div>
          </div>

          {plateData?.plants && plateData.plants.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">This week&apos;s plants</p>
              <div className="flex flex-wrap gap-1.5">
                {plateData.plants.map((plant, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
                      color: "var(--icon-green)",
                    }}
                  >
                    {plant}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
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
  const emailBody = `Take this free food system assessment: ${fullUrl}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
        <div className="p-6">
          <h2 className="mb-1 font-serif text-xl font-semibold text-foreground">Share your link</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Refer 3 friends to unlock Early Access membership — free.
          </p>
          <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-4 py-3">
            <span className="flex-1 truncate font-mono text-sm text-foreground">{referralUrl}</span>
            <button onClick={handleCopy} className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted" title="Copy link">
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} className="text-muted-foreground" />}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "color-mix(in srgb, var(--icon-lime) 20%, transparent)", color: "var(--icon-green)" }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <a
              href={`mailto:?subject=Discover%20your%20Food%20System&body=${encodeURIComponent(emailBody)}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)", color: "var(--icon-teal)" }}
            >
              <Mail size={14} /> Email
            </a>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-medium text-foreground">Progress to Early Access</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Refer 3 friends to unlock for free</p>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--icon-green)" }}>0/3</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }}>
            <div className="h-full rounded-full" style={{ width: "0%", background: "linear-gradient(90deg, #7bc67e, #56C135)" }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>0 referred</span>
            <span>3 needed for Early Access</span>
          </div>
          <p className="mt-3 text-xs italic text-muted-foreground">
            Referral stats coming soon — keep sharing your link!
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── My Meals Tab ───────────────────────────────────────────────────── */

function MealCard({ meal }: { meal: SavedMealAnalysis }) {
  const date = new Date(meal.date).toLocaleDateString("en-IE", { day: "numeric", month: "short" })
  const color = SCORE_COLORS[meal.scoreBand] ?? "var(--icon-green)"
  const topFoods = meal.foods.slice(0, 5)

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="h-1 w-full" style={{ background: color, opacity: 0.4 }} />
      <div className="flex items-start gap-4 p-4">
        <MealScoreRing score={meal.score} band={meal.scoreBand} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-bold" style={{ color }}>{meal.scoreBand}</span>
            {meal.boostedScore && meal.boostedScore > meal.score + 2 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <TrendingUp size={10} style={{ color: "var(--icon-green)" }} />
                up to {meal.boostedScore} with boosts
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {meal.whatThisMealDoes}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {topFoods.map((f, i) => (
                <span key={i} className="text-sm leading-none" title={f.name}>{f.emoji}</span>
              ))}
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground/60" suppressHydrationWarning>{date}</span>
          </div>
          {meal.nutrition && (
            <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground/70">
              <span>{meal.nutrition.calories} kcal</span>
              <span>{meal.nutrition.protein_g}g protein</span>
              <span>{meal.nutrition.fibre_g}g fibre</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MealsTab() {
  const [meals, setMeals] = useState<SavedMealAnalysis[] | null>(null)
  useEffect(() => { setMeals(loadMealAnalyses()) }, [])
  if (meals === null) return null

  if (meals.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
        <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
            <Camera size={24} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No meals saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Analyse a meal and tap &ldquo;Save to My Meals&rdquo; to track your progress here.
            </p>
          </div>
          <a href="/analyse" className="mt-1 inline-flex items-center gap-2 rounded-full brand-gradient px-6 py-2.5 text-sm font-semibold text-white">
            Analyse a meal
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">{meals.length} meal{meals.length !== 1 ? "s" : ""} saved</p>
          <p className="text-xs text-muted-foreground">Most recent first · last 20 saved</p>
        </div>
        <a href="/analyse" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60">
          <Camera size={12} /> Analyse meal
        </a>
      </div>
      <div className="space-y-3">
        {meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
      </div>
    </div>
  )
}

/* ── Consult History Tab ─────────────────────────────────────────────── */

function ConsultHistoryTab({
  pastConsultations,
}: {
  pastConsultations: Array<{id: string; turn_count: number; created_at: string; summary: string | null; messages: Array<{role: string; content: string; turn: number}> | null}>
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const totalTurns = pastConsultations.reduce((s, c) => s + (c.turn_count ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex gap-6">
        <div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--icon-orange)" }}>{pastConsultations.length}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--icon-teal)" }}>{totalTurns}</p>
          <p className="text-xs text-muted-foreground">Total turns</p>
        </div>
      </div>

      {/* New consultation CTA */}
      <Link
        href="/account/consult"
        className="flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))" }}
      >
        <MessageSquare size={14} /> Start new consultation
      </Link>

      {/* Session list */}
      {pastConsultations.length === 0 ? (
        <div className="rounded-2xl border bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">No consultations yet. Start your first conversation with EatoBiotic.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversation history</p>
          {pastConsultations.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border bg-card">
              <button
                className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/20"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {new Date(c.created_at).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    <span className="ml-2 font-normal text-muted-foreground">{c.turn_count ?? 0} turns</span>
                  </p>
                  {c.summary && (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">{c.summary}</p>
                  )}
                </div>
                <ChevronDown size={14} className={cn("mt-0.5 shrink-0 text-muted-foreground transition-transform", expandedId === c.id && "rotate-180")} />
              </button>
              {expandedId === c.id && (
                <div className="border-t">
                  {c.messages && c.messages.length > 0 ? (
                    <div className="max-h-96 space-y-2 overflow-y-auto p-4">
                      {c.messages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div
                            className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                              msg.role === "user" ? "text-white" : "bg-muted/40 border text-foreground"
                            )}
                            style={msg.role === "user" ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : undefined}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground">No message history saved for this session.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function DashboardClient({ profile, assessments, mindAssessments = [], paidReports, plateData, nextBillingDate, dailyConsultCount = 0, monthlyConsultCount = 0, weeklyCheckin, monthlyGutPlan, bioticsProfile, streak = 0, dailyPromptIndex = 0, consultHref, pastConsultations = [], patterns, hasMealPlan, latestMonthlyReview, storyLastUpdated, existingStory = null }: DashboardClientProps) {
  const isTrial  = profile.membership_tier === "trial"
  const isMember = profile.membership_tier === "member"
  const defaultTab: TabKey = (isTrial || isMember) ? "today" : "overview"
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)
  const router = useRouter()
  const latest = assessments[0] ?? null
  const { show: showWelcome, dismiss: dismissWelcome } = useFirstVisit(profile.id)

  // Derive weakest pillar from latest assessment sub-scores
  const latestSubScores = latest ? extractSubScores(latest.sub_scores) : null
  const weakestPillar = latestSubScores
    ? Object.entries(latestSubScores)
        .filter(([k]) => k !== "overall")
        .sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] ?? null
    : null
  const profileInfo = getProfileInfo(latest?.profile_type ?? null)

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push("/assessment")
  }

  function handleTabClick(key: TabKey) {
    setActiveTab(key)
    posthog.capture("account_tab_viewed", {
      tab: key,
      membership_tier: profile.membership_tier ?? "free",
    })
  }

  function handleWelcomeDismiss() {
    posthog.capture("welcome_screen_dismissed", {
      score: latest?.overall_score ?? null,
      profile_type: latest?.profile_type ?? null,
    })
    dismissWelcome()
  }

  return (
    <div className="pb-20">
      {/* Onboarding modal — suppressed when WelcomeScreen is handling first-visit */}
      <OnboardingModal memberName={profile.name ?? null} consultHref={consultHref} skip={showWelcome} />

      {/* Welcome screen — personalised first-visit modal */}
      {showWelcome && (
        <WelcomeScreen
          firstName={profile.name?.split(" ")[0] ?? "there"}
          score={latest?.overall_score ?? null}
          profileType={latest?.profile_type ?? null}
          profileColor={profileInfo.color}
          profileTagline={profileInfo.tagline}
          weakestPillar={weakestPillar}
          healthGoals={profile.health_goals ?? null}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {/* Hero */}
      <DashboardHero profile={profile} latestAssessment={latest} onSignOut={handleSignOut} streak={streak} patterns={patterns} />

      {/* Sticky pill tab nav */}
      <div className="sticky top-[57px] z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3" style={{ scrollbarWidth: "none" }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                  activeTab === key
                    ? "text-white shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                style={
                  activeTab === key
                    ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }
                    : undefined
                }
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {activeTab === "today" && <TodayTab profile={profile} paidReports={paidReports} latestAssessment={latest} />}
        {activeTab === "overview" && <OverviewTab assessments={assessments} mindAssessments={mindAssessments} membershipTier={profile.membership_tier ?? "free"} weeklyCheckin={weeklyCheckin} monthlyGutPlan={monthlyGutPlan} dailyConsultCount={dailyConsultCount} monthlyConsultCount={monthlyConsultCount} bioticsProfile={bioticsProfile} streak={streak} dailyPromptIndex={dailyPromptIndex} consultHref={consultHref} patterns={patterns} setActiveTab={setActiveTab} hasMealPlan={hasMealPlan} latestMonthlyReview={latestMonthlyReview} storyLastUpdated={storyLastUpdated} userId={profile.id} signupDate={latest?.created_at ?? null} latestPaidReport={paidReports[0] ? { tier: paidReports[0].tier, created_at: paidReports[0].created_at } : null} healthGoals={profile.health_goals ?? null} />}
        {activeTab === "reports" && <ReportsTab paidReports={paidReports} />}
        {activeTab === "membership" && <MembershipTab profile={profile} nextBillingDate={nextBillingDate} dailyConsultCount={dailyConsultCount} monthlyConsultCount={monthlyConsultCount} latestAssessment={latest} />}
        {activeTab === "plate" && (
          profile.membership_tier === "free"
            ? <UpgradeGate feature="plate" currentTier={profile.membership_tier} />
            : <PlateTab plateData={plateData} />
        )}
        {activeTab === "meals" && (
          profile.membership_tier === "free"
            ? <UpgradeGate feature="meals" currentTier={profile.membership_tier} />
            : <MealsTab />
        )}
        {activeTab === "refer" && <ReferTab referralCode={profile.referral_code} />}
        {activeTab === "consult" && (
          profile.membership_tier === "transform"
            ? <ConsultHistoryTab pastConsultations={pastConsultations} />
            : <UpgradeGate feature="consult" currentTier={profile.membership_tier} />
        )}
        {activeTab === "intelligence" && (
          (profile.membership_tier === "restore" || profile.membership_tier === "transform")
            ? <IntelligenceClient tier={profile.membership_tier} />
            : <UpgradeGate feature="intelligence" currentTier={profile.membership_tier} />
        )}
        {activeTab === "story" && (
          (profile.membership_tier === "restore" || profile.membership_tier === "transform")
            ? <StoryClient tier={profile.membership_tier} existingStory={existingStory} />
            : <UpgradeGate feature="story" currentTier={profile.membership_tier} />
        )}
      </div>
    </div>
  )
}
