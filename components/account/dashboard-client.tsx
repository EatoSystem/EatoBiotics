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
  Copy,
  Check,
  MessageCircle,
  Mail,
  LogOut,
  Settings,
  Camera,
  TrendingUp,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { ScoreRing } from "@/components/assessment/score-ring"
import { ProgressChart } from "./progress-chart"
import { cn } from "@/lib/utils"
import { loadMealAnalyses, type SavedMealAnalysis } from "@/lib/local-storage"

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
  membership_tier: "free" | "grow" | "restore" | "transform"
  membership_status: "active" | "inactive" | "cancelled" | "past_due"
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  membership_started_at: string | null
  membership_expires_at: string | null
  is_founding_member: boolean
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

/* ── Tabs ───────────────────────────────────────────────────────────── */

const TABS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "membership", label: "Membership", icon: CreditCard },
  { key: "plate", label: "My Plate", icon: Leaf },
  { key: "meals", label: "My Meals", icon: Camera },
  { key: "refer", label: "Refer", icon: Users },
] as const

type TabKey = (typeof TABS)[number]["key"]

/* ── Profile lookup ─────────────────────────────────────────────────── */

const PROFILE_INFO: Record<string, { color: string; tagline: string }> = {
  "Thriving System":     { color: "var(--icon-green)",  tagline: "Your gut health food system is performing at its peak." },
  "Strong Foundation":   { color: "var(--icon-teal)",   tagline: "You've built strong foundations — now it's time to layer in more." },
  "Emerging Balance":    { color: "var(--icon-lime)",   tagline: "Your food system is growing in balance and diversity." },
  "Inconsistent System": { color: "var(--icon-yellow)", tagline: "Consistency is your next big unlock — small habits compound." },
  "Underfed System":     { color: "var(--icon-orange)", tagline: "Your gut is ready for more — more variety, more plants, more life." },
  "Early Builder":       { color: "var(--icon-orange)", tagline: "Every great food system starts somewhere — you're building yours." },
}
const DEFAULT_PROFILE_INFO = { color: "var(--icon-green)", tagline: "The food system inside you." }

function getProfileInfo(profileType: string | null) {
  if (!profileType) return DEFAULT_PROFILE_INFO
  return PROFILE_INFO[profileType] ?? DEFAULT_PROFILE_INFO
}

/* ── Helpers ────────────────────────────────────────────────────────── */

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

const SCORE_COLORS: Record<string, string> = {
  "Exceptional":       "var(--icon-green)",
  "Strong Foundation": "var(--icon-lime)",
  "Good Start":        "var(--icon-yellow)",
  "Getting There":     "var(--icon-orange)",
  "Starting Out":      "#ef4444",
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
}: {
  profile: Profile
  latestAssessment: AssessmentRow | null
  onSignOut: () => void
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

  const membershipLabels: Record<string, string> = {
    free: "Free",
    early_access: "Early Access",
    member: "Member",
    premium: "Premium",
  }
  const memberLabel = membershipLabels[profile.membership] ?? profile.membership

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
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {memberLabel}
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
                Take the free 5-minute assessment to discover your gut health food system.
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

/* ── Biotics Balance Card ────────────────────────────────────────────── */

const BIOTICS_CONFIG = [
  { key: "prebiotic",  label: "Prebiotics",  icon: "🌱", color: "var(--icon-lime)",  desc: "Plant fibre that feeds your gut bacteria" },
  { key: "probiotic",  label: "Probiotics",  icon: "🦠", color: "var(--icon-green)", desc: "Live cultures from fermented foods" },
  { key: "postbiotic", label: "Postbiotics", icon: "✨", color: "var(--icon-teal)",  desc: "Compounds produced by a healthy microbiome" },
]

function BioticsBalanceBar({
  icon,
  label,
  color,
  count,
  max,
  index,
}: {
  icon: string
  label: string
  color: string
  count: number
  max: number
  index: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200 + index * 100)
    return () => clearTimeout(t)
  }, [index])

  const pct = max > 0 ? Math.round((count / max) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-center text-base leading-none">{icon}</span>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: "white" }}>{label}</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.9)" }}>
            {count} food{count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: visible ? `${Math.max(pct, count > 0 ? 5 : 0)}%` : "0%",
              background: "rgba(255,255,255,0.85)",
              transition: `width 700ms cubic-bezier(0.16,1,0.3,1) ${index * 80}ms`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function BioticsBalanceCard({ meals }: { meals: SavedMealAnalysis[] }) {
  const allFoods = meals.flatMap((m) => m.foods)
  const counts = {
    prebiotic:  allFoods.filter((f) => f.biotic === "prebiotic").length,
    probiotic:  allFoods.filter((f) => f.biotic === "probiotic").length,
    postbiotic: allFoods.filter((f) => f.biotic === "postbiotic").length,
  }
  const maxCount = Math.max(...Object.values(counts), 1)
  const hasMeals = meals.length > 0

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
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
              The 3 Biotics
            </p>
            <h3 className="mt-0.5 font-serif text-lg font-semibold" style={{ color: "white" }}>
              {hasMeals ? "Your Biotics Balance" : "The EatoBiotics Framework"}
            </h3>
          </div>
          <Link
            href="/course"
            className="shrink-0 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Learn framework →
          </Link>
        </div>

        {hasMeals ? (
          <>
            <div className="space-y-3">
              {BIOTICS_CONFIG.map((b, i) => (
                <BioticsBalanceBar
                  key={b.key}
                  icon={b.icon}
                  label={b.label}
                  color={b.color}
                  count={counts[b.key as keyof typeof counts]}
                  max={maxCount}
                  index={i}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Based on {allFoods.length} food{allFoods.length !== 1 ? "s" : ""} across your last{" "}
              {meals.length} meal{meals.length !== 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {BIOTICS_CONFIG.map((b) => (
                <div
                  key={b.key}
                  className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                    style={{ background: "rgba(255,255,255,0.22)" }}
                  >
                    {b.icon}
                  </span>
                  <p className="text-xs font-bold" style={{ color: "white" }}>{b.label}</p>
                  <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>{b.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                Analyse meals to track your personal biotics balance
              </p>
              <Link
                href="/analyse"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                Track your meals <ArrowRight size={11} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Overview Tab ───────────────────────────────────────────────────── */

function OverviewTab({ assessments, membershipTier }: { assessments: AssessmentRow[]; membershipTier: Profile["membership_tier"] }) {
  const latest = assessments[0] ?? null
  const previous = assessments[1] ?? null
  const meals = loadMealAnalyses()

  const currentScores = latest ? extractSubScores(latest.sub_scores) : null
  const previousScores = previous ? extractSubScores(previous.sub_scores) : null
  const profileInfo = getProfileInfo(latest?.profile_type ?? null)
  const showRetake = latest ? daysAgo(latest.created_at) > 75 : false

  return (
    <div className="space-y-5">

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
          {/* Top accent strip */}
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
              <p className="mt-2 text-xs text-muted-foreground">
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
            {/* Decorative score watermark */}
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

      {/* Pillar breakdown chart */}
      {currentScores ? (
        membershipTier === "free" ? (
          <FeatureGate
            requiredTier="grow"
            description="Track how each of your 5 pillars changes over time. Upgrade to Grow for your full score history."
          >
            <ProgressChart current={currentScores} previous={previousScores} />
          </FeatureGate>
        ) : (
          <ProgressChart current={currentScores} previous={previousScores} />
        )
      ) : (
        <div className="rounded-3xl border bg-card p-8 text-center">
          <p className="mb-3 text-4xl leading-none">🌿</p>
          <p className="mb-1 font-medium text-foreground">No assessment yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Take the free 5-minute assessment to discover your gut health food system.
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

      {/* Meal Lab */}
      <MealLabCard meals={meals} />

      {/* 3 Biotics Balance */}
      <BioticsBalanceCard meals={meals} />

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
                    <p className="text-xs text-muted-foreground">
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
            Complete the assessment to unlock your personalised gut health report — a full breakdown of your food system with actionable steps.
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
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {paidReports.map((r) => {
        const overallScore = r.free_scores?.overall ?? null
        const band = overallScore != null ? getScoreBand(overallScore) : null
        return (
          <div key={r.stripe_session_id} className="overflow-hidden rounded-3xl border bg-card">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #7bc67e, #56C135)" }} />
            <div className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <TierBadge tier={r.tier} />
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              <div className="flex items-start gap-4">
                {overallScore != null && band && (
                  <MealScoreRing score={Math.round(overallScore)} band={band} />
                )}
                <div>
                  {r.free_scores && (
                    <>
                      <p className="font-serif text-base font-semibold text-foreground">
                        {r.free_scores.profile?.type ?? "Report"}
                      </p>
                      <p className="text-sm text-muted-foreground">Score: {r.free_scores.overall}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4">
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
                    <Download size={12} /> Download PDF
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">PDF processing…</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
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
}: {
  profile: Pick<Profile, "membership" | "membership_tier" | "membership_status" | "membership_expires_at" | "is_founding_member" | "referral_code">
}) {
  const { membership, membership_tier, membership_status, membership_expires_at, is_founding_member } = profile

  const subTiers: Array<{
    key: "free" | "grow" | "restore" | "transform"
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
        "1 meal analysis per day",
        "Biotics Score visible (today only)",
        "Gut Starter Pack food library",
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
        "Unlimited daily meal analyses",
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
        "90-day score history with quarterly trend analysis",
        "Condition-specific calibration (IBS, immunity, energy, mood, weight)",
        "Monthly personalised gut health plan",
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
        "Unlimited AI gut health consultations",
        "Weekly AI check-in",
        "Personalised weekly meal plans",
        "Recipe suggestions calibrated to Biotics Score",
        "Annual Gut Health Profile",
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
                  {expiresLabel && membership_status === "active" && (
                    <span className="text-xs text-muted-foreground">
                      Renews {expiresLabel}
                    </span>
                  )}
                  {expiresLabel && membership_status === "cancelled" && (
                    <span className="text-xs text-muted-foreground">
                      Access until {expiresLabel}
                    </span>
                  )}
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
                <p className="mt-1 text-xs text-muted-foreground/60">Last synced {lastSaved}</p>
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
  const emailBody = `Take this free gut health assessment: ${fullUrl}`

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
            <span className="shrink-0 text-[10px] text-muted-foreground/60">{date}</span>
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

/* ── Main Component ─────────────────────────────────────────────────── */

export function DashboardClient({ profile, assessments, paidReports, plateData }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const router = useRouter()
  const latest = assessments[0] ?? null

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push("/assessment")
  }

  return (
    <div className="pb-20">
      {/* Hero */}
      <DashboardHero profile={profile} latestAssessment={latest} onSignOut={handleSignOut} />

      {/* Sticky pill tab nav */}
      <div className="sticky top-[57px] z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3" style={{ scrollbarWidth: "none" }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
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
        {activeTab === "overview" && <OverviewTab assessments={assessments} membershipTier={profile.membership_tier ?? "free"} />}
        {activeTab === "reports" && <ReportsTab paidReports={paidReports} />}
        {activeTab === "membership" && <MembershipTab profile={profile} />}
        {activeTab === "plate" && <PlateTab plateData={plateData} />}
        {activeTab === "meals" && <MealsTab />}
        {activeTab === "refer" && <ReferTab referralCode={profile.referral_code} />}
      </div>
    </div>
  )
}
