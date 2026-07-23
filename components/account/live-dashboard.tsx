"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { DailyLoopCard, type DailyLoopData } from "@/components/account/daily-loop-card"
import {
  Camera, ArrowRight, Check, ChevronRight, TrendingUp,
  FileText, UtensilsCrossed, MessageSquare, Download, ExternalLink, Flame,
  Calendar, Target, Activity, User, Trash2, AlertTriangle, Plus,
} from "lucide-react"
import {
  Glp1CompanionCard, StabilityCard, AssessmentJourneyCard, VoiceConsultCard, ReferralCard, ScoreRing, MiniRing, ScoreBar,
  Tag, SectionLabel, GradientButton, ringColors,
} from "@/components/account/dashboard-parts"
import { TwinStage } from "@/components/account/twin/twin-stage"
import { GutTrend } from "@/components/account/gut-trend"
import { mealMemory } from "@/lib/account/meal-memory"
import { ExperienceNav } from "@/components/account/experience-nav"
import { RetestCard } from "@/components/account/retest-card"
import type { RetestState } from "@/lib/account/retest"
import { TodayStrip } from "@/components/account/twin/today-strip"
import { TwinLearnedToday, TwinNextAction } from "@/components/account/twin/twin-sections"
import { QuickLog, type QuickLogResult } from "@/components/account/twin/quick-log"
import { InsideYouTeaser } from "@/components/account/twin/inside-you"
import { DailyRitual } from "@/components/account/twin/daily-ritual"
import { AskTwin } from "@/components/account/twin/ask-twin"
import { SystemsExplorer } from "@/components/account/systems-explorer"
import { MeetTwinChecklist } from "@/components/account/twin/meet-checklist"
import { MeetBodyHero } from "@/components/account/twin/meet-body-hero"
import { detectMilestones, unseenMilestones, loadSeen, saveSeen, type Milestone } from "@/lib/account/milestones"
import { browserStore, dayKey as ritualDayKey, loadRitual, ritualSignals, type RitualDay } from "@/lib/account/ritual"
import { pushTwinState } from "@/lib/account/twin-state-sync"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { TwinFeedEntry } from "@/lib/agent-loop/account-twin"
import type { TwinVideo } from "@/lib/account/twin-figure"


function MealCard({ meal }: { meal: { image: string; name: string; time: string; type: string; score: number; insight: string; biotics: { prebiotic: number; probiotic: number; postbiotic: number }; quality: { diversity: number; antiInflammatory: number }; nutrition: { calories: number; protein: number; carbs: number; fat: number; fibre: number }; tags: string[] } }) {
  const circ = 2 * Math.PI * 36
  const [rc0, rc1, rc2] = ringColors(meal.score)
  const ringId = `mc-ring-${meal.name.replace(/\s+/g, "").slice(0, 8)}`
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.07)" }}>
      {/* Gradient top accent */}
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />

      {/* Identity row */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="font-semibold text-sm leading-snug" style={{ color: "var(--foreground)" }}>{meal.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{meal.time} · {meal.type}</p>
        </div>
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }}>
          {meal.type}
        </span>
      </div>

      {/* Photo + score ring */}
      <div className="relative flex items-center justify-center" style={{ background: "white", minHeight: 180 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meal.image} alt={meal.name} style={{ width: "100%", maxHeight: 200, objectFit: "contain", objectPosition: "center", display: "block" }} />
        <div className="absolute top-3 right-3 flex flex-col items-center"
          style={{ background: "white", borderRadius: "50%", padding: 2, boxShadow: `0 2px 10px ${rc0}44` }}>
          <svg width="76" height="76" viewBox="0 0 88 88">
            <defs>
              <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={rc0} />
                <stop offset="50%"  stopColor={rc1} />
                <stop offset="100%" stopColor={rc2} />
              </linearGradient>
            </defs>
            <circle cx="44" cy="44" r="36" fill="none" stroke="#e8e8e8" strokeWidth="7" />
            <circle cx="44" cy="44" r="36" fill="none"
              stroke={`url(#${ringId})`} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${circ * meal.score / 100} ${circ}`} transform="rotate(-90 44 44)" />
            <text x="44" y="40" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 20, fontWeight: 700, fill: "var(--foreground)" }}>
              {meal.score}
            </text>
            <text x="44" y="56" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, fill: "var(--muted-foreground)" }}>
              /100
            </text>
          </svg>
        </div>
      </div>

      {/* Biotics */}
      <div className="px-4 pb-3 pt-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Biotics</p>
        <div className="space-y-2">
          <ScoreBar label="Prebiotic"  score={meal.biotics.prebiotic} />
          <ScoreBar label="Probiotic"  score={meal.biotics.probiotic} />
          <ScoreBar label="Postbiotic" score={meal.biotics.postbiotic} />
        </div>
      </div>

      <div className="mx-4 h-px" style={{ background: "var(--border)" }} />

      {/* Meal Quality */}
      <div className="px-4 pb-3 pt-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>Meal Quality</p>
        <div className="space-y-2">
          <ScoreBar label="Diversity"          score={meal.quality.diversity} />
          <ScoreBar label="Anti-inflammatory"  score={meal.quality.antiInflammatory} />
        </div>
      </div>

      <div className="mx-4 h-px" style={{ background: "var(--border)" }} />

      {/* Nutrition Context */}
      <div className="pt-3 pb-1">
        <p className="mb-1 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Nutrition Context</p>
        <div className="grid grid-cols-5">
          {([
            { label: "Calories", value: String(meal.nutrition.calories), unit: "kcal", color: "var(--icon-orange)" },
            { label: "Protein",  value: String(meal.nutrition.protein),  unit: "g",    color: "var(--icon-teal)" },
            { label: "Carbs",    value: String(meal.nutrition.carbs),    unit: "g",    color: "var(--icon-yellow)" },
            { label: "Fat",      value: String(meal.nutrition.fat),      unit: "g",    color: "var(--icon-green)" },
            { label: "Fibre",    value: String(meal.nutrition.fibre),    unit: "g",    color: "var(--icon-lime)" },
          ] as { label: string; value: string; unit: string; color: string }[]).map(({ label, value, unit, color }, i) => (
            <div key={label} className="flex flex-col items-center py-2.5"
              style={{ borderRight: i < 4 ? "1px solid var(--border)" : undefined }}>
              <span className="font-mono text-sm font-semibold leading-none" style={{ color }}>{value}</span>
              <span className="mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>{unit}</span>
              <span className="mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px" style={{ background: "var(--border)" }} />

      {/* Insight */}
      <div className="mx-4 my-3 flex overflow-hidden rounded-xl" style={{ border: "1px solid #e8e8e8" }}>
        <div className="w-[3px] shrink-0"
          style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
        <div className="px-3 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            What EatoBiotics noticed
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{meal.insight}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {meal.tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Mock data
   ───────────────────────────────────────────────────────────────────────── */
type MealEntry = {
  image: string; name: string; time: string; type: string; score: number; insight: string
  biotics:   { prebiotic: number; probiotic: number; postbiotic: number }
  quality:   { diversity: number; antiInflammatory: number }
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fibre: number }
  tags: string[]
}

const MOCK_MEALS: { date: string; meals: MealEntry[] }[] = [
  {
    date: "Today — Tue 13 May",
    meals: [
      {
        image: "/food-1.webp", name: "Mackerel, kimchi & asparagus", time: "19:25", type: "Dinner", score: 71,
        insight: "Your mackerel is delivering omega-3s that reduce gut inflammation, while the kimchi seeds live Lactobacillus cultures. The asparagus adds inulin — a prebiotic fibre that feeds those bacteria directly. Adding a handful of walnuts would push your diversity score from 55 to ~72.",
        biotics:   { prebiotic: 72, probiotic: 18, postbiotic: 41 },
        quality:   { diversity: 55, antiInflammatory: 80 },
        nutrition: { calories: 385, protein: 38, carbs: 12, fat: 18, fibre: 7 },
        tags: ["Omega-3s", "Probiotics", "Prebiotics", "Anti-inflammatory"],
      },
    ],
  },
  {
    date: "Yesterday — Mon 12 May",
    meals: [
      {
        image: "/food-2.webp", name: "Eggs, sourdough & avocado", time: "8:20am", type: "Breakfast", score: 65,
        insight: "Good healthy fats from the avocado and protein from the eggs. Sourdough's fermentation gives a mild probiotic lift. Swap white sourdough for wholegrain rye to double the prebiotic fibre content.",
        biotics:   { prebiotic: 45, probiotic: 22, postbiotic: 31 },
        quality:   { diversity: 40, antiInflammatory: 65 },
        nutrition: { calories: 420, protein: 18, carbs: 32, fat: 22, fibre: 4 },
        tags: ["Healthy fats", "Protein", "Fermented bread"],
      },
      {
        image: "/food-3.webp", name: "Salmon salad with kimchi", time: "1:15pm", type: "Lunch", score: 78,
        insight: "Excellent combination. The kimchi lifts your probiotic score significantly. Salmon's omega-3s are anti-inflammatory and the mixed leaves add polyphenol diversity. This is the pattern to repeat.",
        biotics:   { prebiotic: 61, probiotic: 48, postbiotic: 52 },
        quality:   { diversity: 72, antiInflammatory: 85 },
        nutrition: { calories: 340, protein: 32, carbs: 12, fat: 16, fibre: 5 },
        tags: ["Omega-3s", "Probiotics", "Diversity"],
      },
      {
        image: "/food-4.webp", name: "Pasta, garlic & roasted veg", time: "7:30pm", type: "Dinner", score: 72,
        insight: "Garlic's inulin is feeding your Lactobacillus bacteria directly. The roasted veg variety is building your diversity score. Consider adding a spoonful of olive tapenade — the polyphenols would push anti-inflammatory from 58 to ~70.",
        biotics:   { prebiotic: 68, probiotic: 12, postbiotic: 38 },
        quality:   { diversity: 62, antiInflammatory: 58 },
        nutrition: { calories: 510, protein: 14, carbs: 82, fat: 9, fibre: 8 },
        tags: ["Prebiotics", "Plant diversity", "Garlic"],
      },
    ],
  },
  {
    date: "Sun 11 May",
    meals: [
      {
        image: "/food-5.webp", name: "Greek yoghurt, berries & oats", time: "9:00am", type: "Breakfast", score: 69,
        insight: "Yoghurt delivers live cultures and the berries add polyphenol diversity that feeds beneficial bacteria. Oats are a strong prebiotic source. Your best breakfast pattern — the berry variety is key.",
        biotics:   { prebiotic: 55, probiotic: 58, postbiotic: 44 },
        quality:   { diversity: 60, antiInflammatory: 70 },
        nutrition: { calories: 295, protein: 14, carbs: 44, fat: 8, fibre: 6 },
        tags: ["Probiotics", "Polyphenols", "Prebiotics"],
      },
      {
        image: "/food-6.webp", name: "Lentil wrap with mixed greens", time: "1:00pm", type: "Lunch", score: 74,
        insight: "High-fibre and plant-diverse. Lentils are one of the best prebiotic foods — resistant starch that survives digestion and feeds Bifidobacterium directly. The mixed greens add polyphenol variety.",
        biotics:   { prebiotic: 72, probiotic: 8,  postbiotic: 42 },
        quality:   { diversity: 65, antiInflammatory: 62 },
        nutrition: { calories: 380, protein: 18, carbs: 58, fat: 7, fibre: 12 },
        tags: ["High fibre", "Prebiotics", "Plant protein"],
      },
      {
        image: "/food-7.webp", name: "Chicken, roasted veg & kefir", time: "7:45pm", type: "Dinner", score: 81,
        insight: "Best meal this week. Kefir delivers live cultures across multiple strains, the diverse roasted veg builds your prebiotic base, and the chicken provides the protein your gut lining needs for repair. This is the gold standard pattern.",
        biotics:   { prebiotic: 75, probiotic: 65, postbiotic: 58 },
        quality:   { diversity: 78, antiInflammatory: 72 },
        nutrition: { calories: 445, protein: 38, carbs: 28, fat: 14, fibre: 7 },
        tags: ["Probiotics", "Diversity", "High protein"],
      },
    ],
  },
]

const MOCK_CONSULTATIONS = [
  {
    id: 1, date: "Sunday, 11 May 2025", week: "Week 8 of 30", avgScore: 73, delta: 5,
    weekSummaryTitle: "Your Best Week for Plant Diversity",
    pillars: { prebiotic: 71, probiotic: 23, postbiotic: 48 },
    pullQuote: "Your food system showed real momentum this week. Plant diversity was your strongest area — 9 different plants, your best showing in a month.",
    focusAction: "Add a fermented food to 4 out of 7 dinners this week — kefir, kimchi, or live yoghurt all count.",
    mealCount: 9,
  },
  {
    id: 2, date: "Sunday, 4 May 2025", week: "Week 7 of 30", avgScore: 68, delta: 4,
    weekSummaryTitle: "Consistency Building — Momentum Is Growing",
    pillars: { prebiotic: 65, probiotic: 28, postbiotic: 42 },
    pullQuote: "Your prebiotic score held steady and your fermented food frequency improved to 4 out of 7 days. The habit is forming — keep the weekend routine tighter.",
    focusAction: "Tighten your weekend routine — aim for the same meal quality Saturday and Sunday as you do during the week.",
    mealCount: 11,
  },
  {
    id: 3, date: "Sunday, 27 Apr 2025", week: "Week 6 of 30", avgScore: 64, delta: 2,
    weekSummaryTitle: "Mid-Week Strong — Weekends Need Attention",
    pillars: { prebiotic: 60, probiotic: 19, postbiotic: 38 },
    pullQuote: "Monday–Friday averaged 71 but Saturday dropped to 48. You have the pattern — now extend it to the full week.",
    focusAction: "Plan two gut-friendly meals for the weekend before Saturday arrives — preparation is the key lever here.",
    mealCount: 8,
  },
]

/* ─────────────────────────────────────────────────────────────────────────
   Real-data types
   ───────────────────────────────────────────────────────────────────────── */
export interface RealAnalysis {
  id: string
  meal_name:    string | null
  meal_type:    string | null
  image_url:    string | null
  biotics_score:             number | null
  prebiotic_score:           number | null
  probiotic_score:           number | null
  postbiotic_score:          number | null
  quality_diversity:         number | null
  quality_anti_inflammatory: number | null
  nutrition_json: { calories: number; protein: number; carbs: number; fat: number; fibre: number } | null
  insight: string | null
  tags:    string[] | null
  created_at: string
}

export interface RealWeeklyReport {
  id: string
  week_starting: string
  content: string
  report_json: {
    weekStarting: string; weekNumber: number; mealCount: number
    averageScore: number; previousWeekAverage: number | null
    pillars: { prebiotic: number; probiotic: number; postbiotic: number }
    pullQuote: string; narrative: string; focusAction: string
    weekSummaryTitle: string
    mealsThisWeek: Array<{ id: string; name: string; type: string; score: number; date: string }>
  } | null
}

/* ─────────────────────────────────────────────────────────────────────────
   Component props — all optional, mock data used as fallback
   ───────────────────────────────────────────────────────────────────────── */
/** A purchased one-time Food System Report (from `deep_assessments`). */
export interface LivePaidReport {
  sessionId:    string
  tier:         string
  createdAt:    string
  profileType:  string | null
  overall:      number | null
  pdfUrl:       string | null
  status:       string | null   // overall pipeline status
  emailStatus:  string | null   // 'sent' | 'failed' | 'pending' | null
}

export interface LiveDashboardProps {
  name?:             string | null
  email?:            string | null
  ageBracket?:       string | null
  membershipTier?:   string | null
  membershipStatus?: string | null
  streak?:           number
  score?:            number | null
  previousScore?:    number | null
  profileType?:      string | null
  biotics?:          { prebiotic: number; probiotic: number; postbiotic: number }
  recentAnalyses?:   RealAnalysis[]
  scoreHistory?:     { score: number; date: string }[]  // 90-day biotics history → Gut Trend
  paidReports?:      LivePaidReport[]            // purchased one-time reports
  weeklyReport?:     RealWeeklyReport | null
  weeklyReports?:    RealWeeklyReport[]          // for Consultations tab
  monthlyPlan?:      string | null
  weeklyCheckin?:    string | null
  memberStartedAt?:  string | null
  nextBillingDate?:  string | null
  referralCode?:     string | null
  dailyLoop?:        DailyLoopData | null
  twin?:             FoodSystemDigitalTwin | null
  twinVisual?:       TwinVisualState | null
  twinFeed?:         TwinFeedEntry[] | null
  twinFigureSrc?:    string
  twinVideo?:        TwinVideo | null
  sex?:              string | null
  retest?:           RetestState | null          // Day-75 retest ritual state
  // Sandbox pass-through
  [key: string]: unknown
}

/* ─────────────────────────────────────────────────────────────────────────
   Live analysis result type (returned from /api/analyse-meal)
   ───────────────────────────────────────────────────────────────────────── */
interface LiveResult {
  id:           string | null
  meal_name:    string
  meal_type:    string
  biotics_score:             number
  prebiotic_score:           number
  probiotic_score:           number
  postbiotic_score:          number
  quality_diversity:         number
  quality_anti_inflammatory: number
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fibre: number }
  insight: string
  tags:    string[]
  created_at?: string
}


/* ─────────────────────────────────────────────────────────────────────────
   First-meal celebration — the activation moment. Shown in the first-visit
   branch when the member's very first analysis completes (previously the
   result was never rendered there at all).
   ───────────────────────────────────────────────────────────────────────── */
function FirstMealCelebration({ result, firstName, onLogAnother }: {
  result: LiveResult
  firstName: string | null
  onLogAnother: () => void
}) {
  const circ = 2 * Math.PI * 44
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(26,46,18,0.12)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <div className="px-6 py-8 text-center md:px-10">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          First meal analysed 🎉
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {firstName ? `That's day one done, ${firstName}.` : "That's day one done."}
        </h2>

        {/* Score ring */}
        <div className="mx-auto mt-6 flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="first-meal-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="var(--icon-lime)" />
                <stop offset="50%"  stopColor="var(--icon-green)" />
                <stop offset="100%" stopColor="var(--icon-teal)" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="44" fill="none" stroke="#ededed" strokeWidth="9" />
            <circle cx="60" cy="60" r="44" fill="none" stroke="url(#first-meal-ring)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${(circ * result.biotics_score) / 100} ${circ}`} transform="rotate(-90 60 60)" />
            <text x="60" y="56" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 28, fontWeight: 800, fill: "var(--foreground)" }}>{result.biotics_score}</text>
            <text x="60" y="76" textAnchor="middle" style={{ fontSize: 11, fill: "var(--muted-foreground)" }}>/100</text>
          </svg>
        </div>
        <p className="mt-1 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{result.meal_name}</p>

        {/* Biotic bars */}
        <div className="mx-auto mt-6 max-w-sm space-y-2.5 text-left">
          <ScoreBar label="Prebiotic"  score={result.prebiotic_score} />
          <ScoreBar label="Probiotic"  score={result.probiotic_score} />
          <ScoreBar label="Postbiotic" score={result.postbiotic_score} />
        </div>

        {result.insight && (
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {result.insight}
          </p>
        )}

        <div className="mx-auto mt-5 max-w-md rounded-xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, var(--icon-green) 8%, white)", color: "var(--foreground)" }}>
          <Flame size={14} className="mr-1.5 inline-block" style={{ color: "var(--icon-orange)" }} />
          Your streak starts now — log one meal tomorrow to keep it alive.
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <GradientButton onClick={() => window.location.reload()}>See my dashboard</GradientButton>
          <button onClick={onLogAnother} className="text-sm font-semibold underline underline-offset-4" style={{ color: "var(--muted-foreground)" }}>
            Log another meal
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Convert RealAnalysis → MealEntry shape used by MealCard
   ───────────────────────────────────────────────────────────────────────── */
function realToMealEntry(a: RealAnalysis): Parameters<typeof MealCard>[0]["meal"] {
  const d = new Date(a.created_at)
  return {
    image:   a.image_url ?? "/food-1.webp",
    name:    a.meal_name ?? "Analysed meal",
    time:    d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }),
    type:    a.meal_type ?? "Meal",
    score:   a.biotics_score ?? 0,
    insight: a.insight ?? "No insight available.",
    biotics: {
      prebiotic:  a.prebiotic_score  ?? 0,
      probiotic:  a.probiotic_score  ?? 0,
      postbiotic: a.postbiotic_score ?? 0,
    },
    quality: {
      diversity:        a.quality_diversity         ?? 0,
      antiInflammatory: a.quality_anti_inflammatory ?? 0,
    },
    nutrition: a.nutrition_json ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
    tags: a.tags ?? [],
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   ReportCard — unified rich card for real + mock weekly reports
   ───────────────────────────────────────────────────────────────────────── */
interface ReportCardData {
  id: string | number
  dateStr: string
  weekLabel: string
  avgScore: number | null
  delta: number | null
  weekSummaryTitle: string | null
  pillars: { prebiotic: number; probiotic: number; postbiotic: number } | null
  pullQuote: string | null
  focusAction: string | null
  mealCount: number | null
  reportHref: string | null
  chatHref: string | null
}

function ReportCard({ card }: { card: ReportCardData }) {
  const pos = card.delta !== null && card.delta > 0
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.07)" }}>
      {/* Gradient top bar */}
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />

      {/* Header */}
      <div className="border-b px-5 pt-4 pb-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              {card.weekLabel}
            </p>
            <p className="mt-0.5 font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
              {card.dateStr}
            </p>
            {card.weekSummaryTitle && (
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--icon-green)" }}>
                {card.weekSummaryTitle}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {card.avgScore != null && (
              <span className="rounded-full px-3 py-1 text-sm font-bold tabular-nums text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 2px 8px rgba(45,170,110,0.25)" }}>
                {card.avgScore}
              </span>
            )}
            {card.delta != null && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
                style={pos
                  ? { background: "rgba(168,224,99,0.18)", color: "#2d7a24", border: "1px solid rgba(76,182,72,0.25)" }
                  : { background: "rgba(245,166,35,0.12)", color: "#a05a0a", border: "1px solid rgba(245,166,35,0.30)" }
                }>
                {pos ? `+${card.delta}` : card.delta} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Biotics pillars */}
      {card.pillars && (
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Biotics this week
          </p>
          <div className="space-y-2">
            <ScoreBar label="Prebiotic"  score={card.pillars.prebiotic} />
            <ScoreBar label="Probiotic"  score={card.pillars.probiotic} />
            <ScoreBar label="Postbiotic" score={card.pillars.postbiotic} />
          </div>
        </div>
      )}

      {/* Pull quote */}
      {card.pullQuote && (
        <div className="mx-5 mt-4 flex overflow-hidden rounded-xl" style={{ border: "1px solid #e8e8e8" }}>
          <div className="w-[3px] shrink-0" style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
          <div className="px-4 py-3">
            <p className="text-sm italic leading-relaxed" style={{ color: "var(--foreground)" }}>
              &ldquo;{card.pullQuote}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Focus action */}
      {card.focusAction && (
        <div className="mx-5 mt-3 flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: "linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,166,35,0.08))", border: "1px solid rgba(245,166,35,0.25)" }}>
          <Target size={14} style={{ color: "var(--icon-orange)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
              This week&apos;s focus
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{card.focusAction}</p>
          </div>
        </div>
      )}

      {/* Meal count + CTAs */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        {card.mealCount != null && (
          <div className="flex items-center gap-1.5">
            <UtensilsCrossed size={12} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {card.mealCount} meals tracked
            </span>
          </div>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {card.reportHref ? (
            <>
              <Link href={card.reportHref}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 2px 8px rgba(45,170,110,0.25)" }}>
                View full report <ExternalLink size={11} />
              </Link>
              {card.chatHref && (
                <Link href={card.chatHref}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
                  <MessageSquare size={11} /> Chat with EatoBiotics
                </Link>
              )}
            </>
          ) : (
            <span className="inline-flex cursor-default items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white opacity-40"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
              View full report <ExternalLink size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Tab config
   ───────────────────────────────────────────────────────────────────────── */
type Tab = "overview" | "meals" | "reports" | "consultations" | "account"
type LoggerState = "empty" | "analysing" | "result"
type DeleteStage = "closed" | "warning" | "confirm" | "deleting" | "done"

const AGE_BRACKETS = ["Under 20", "20–29", "30–39", "40–49", "50–59", "60+"]

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "Overview",      icon: <TrendingUp size={14} /> },
  { id: "meals",         label: "My Meals",       icon: <UtensilsCrossed size={14} /> },
  { id: "reports",       label: "My Reports",     icon: <FileText size={14} /> },
  { id: "consultations", label: "Consultations",  icon: <MessageSquare size={14} /> },
  { id: "account",       label: "My Account",     icon: <User size={14} /> },
]

/* ─────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────── */
/** Chapter heading — serif title + hairline; one consistent pt-12 rhythm so the
    Overview reads as chapters of one page, not stacked fragments. */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 md:px-8">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{children}</h2>
        <span className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>
    </div>
  )
}

/** What changed today — the twin's live trends as sentence chips (↑ growth in
    green, ↓ dips in amber; changes, not levels — the daily return loop). */
function WhatChangedToday({ twin }: { twin: FoodSystemDigitalTwin }) {
  if (!twin.trends.length) return null
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>What changed</span>
        {twin.trends.slice(0, 4).map((t) => (
          <span
            key={t.label}
            title={t.detail}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={
              t.direction === "up"
                ? { background: "rgba(168,224,99,0.16)", border: "1px solid rgba(76,182,72,0.3)", color: "#2d7a24" }
                : t.direction === "down"
                  ? { background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", color: "#a05a0a" }
                  : { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {t.direction === "up" ? "↑" : t.direction === "down" ? "↓" : "→"} {t.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function LiveDashboard(props: LiveDashboardProps = {}) {
  const {
    name               = null,
    email:             propEmail         = null,
    ageBracket:        propAgeBracket    = null,
    membershipTier:    propMemberTier    = null,
    membershipStatus:  propMemberStatus  = null,
    streak:            propStreak = 0,
    score:             propScore  = null,
    previousScore:     propPrev   = null,
    profileType        = null,
    biotics:           propBiotics = null,
    recentAnalyses     = [],
    scoreHistory       = [],
    paidReports        = [],
    weeklyReport       = null,
    weeklyReports      = [],
    monthlyPlan        = null,
    memberStartedAt    = null,
    nextBillingDate    = null,
    dailyLoop          = null,
    referralCode       = null,
    twin               = null,
    twinVisual         = null,
    twinFeed           = null,
    twinFigureSrc      = undefined,
    twinVideo          = null,
    sex                = null,
    retest             = null,
  } = props

  const [tab, setTab] = useState<Tab>("overview")
  const [loggerState, setLoggerState] = useState<LoggerState>("empty")
  const [liveResult, setLiveResult]   = useState<LiveResult | null>(null)
  const [mealInput, setMealInput]     = useState("")
  const [analyseError, setAnalyseError] = useState<string | null>(null)

  /* My Account tab state */
  const [acctName,       setAcctName]       = useState(name ?? "")
  const [acctAgeBracket, setAcctAgeBracket] = useState(propAgeBracket ?? "")
  const [acctSex,        setAcctSex]        = useState(sex ?? "")
  const [acctSaving,     setAcctSaving]     = useState(false)
  const [acctSaved,      setAcctSaved]      = useState(false)
  const [acctError,      setAcctError]      = useState<string | null>(null)
  const [exportState,    setExportState]    = useState<"idle" | "downloading" | "done">("idle")
  const [pdfLinkState,   setPdfLinkState]   = useState<Record<string, "loading" | "error">>({})
  const [deleteStage,    setDeleteStage]    = useState<DeleteStage>("closed")
  const [deleteInput,    setDeleteInput]    = useState("")
  const [deleteError,    setDeleteError]    = useState<string | null>(null)

  type CancelStage = "idle" | "confirm" | "cancelling" | "done"
  const [cancelStage,    setCancelStage]    = useState<CancelStage>("idle")
  const [cancelUntil,    setCancelUntil]    = useState<string | null>(null)
  const [cancelError,    setCancelError]    = useState<string | null>(null)

  const router = useRouter()

  async function handleSaveProfile() {
    setAcctSaving(true); setAcctError(null); setAcctSaved(false)
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: acctName || null, age_bracket: acctAgeBracket || null, sex: acctSex || null }),
      })
      if (!res.ok) throw new Error("Save failed")
      setAcctSaved(true)
      setTimeout(() => setAcctSaved(false), 3000)
      // Re-derive server data so the living Food System figure reflects the new sex.
      router.refresh()
    } catch {
      setAcctError("Save failed — please try again")
    } finally {
      setAcctSaving(false)
    }
  }

  async function handleExport() {
    setExportState("downloading")
    try {
      const res = await fetch("/api/account/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const today = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `eatobiotics-data-${today}.json`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
      setExportState("done")
      setTimeout(() => setExportState("idle"), 4000)
    } catch {
      setExportState("idle")
    }
  }

  async function handleDownloadPdf(sessionId: string) {
    setPdfLinkState((s) => ({ ...s, [sessionId]: "loading" }))
    try {
      const res = await fetch(`/api/account/pdf-url?session=${encodeURIComponent(sessionId)}`)
      if (!res.ok) throw new Error("PDF link refresh failed")
      const { pdfUrl } = (await res.json()) as { pdfUrl: string }
      window.open(pdfUrl, "_blank", "noopener")
      setPdfLinkState((s) => {
        const next = { ...s }
        delete next[sessionId]
        return next
      })
    } catch {
      setPdfLinkState((s) => ({ ...s, [sessionId]: "error" }))
    }
  }

  async function handleCancelSubscription() {
    setCancelStage("cancelling"); setCancelError(null)
    try {
      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" })
      const data = await res.json() as { ok?: boolean; accessUntil?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? "Cancellation failed")
      setCancelUntil(data.accessUntil ?? null)
      setCancelStage("done")
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Cancellation failed — please try again.")
      setCancelStage("confirm")
    }
  }

  async function handleDeleteAccount() {
    setDeleteStage("deleting"); setDeleteError(null)
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      const supabase = getSupabaseBrowser()
      if (supabase) await supabase.auth.signOut()
      router.push("/")
    } catch {
      setDeleteError("Deletion failed — please try again or contact support.")
      setDeleteStage("confirm")
    }
  }

  /* Compute real values with mock fallbacks */
  const displayName    = name ?? "Jason"
  const displayScore   = propScore   ?? 62
  const displayPrev    = propPrev    ?? 54
  const displayStreak  = propStreak  || 0
  const displayProfile = profileType ?? "Emerging Balance"

  const displayBiotics = propBiotics ?? { prebiotic: 71, probiotic: 23, postbiotic: 48 }

  /* Milestone celebrations — fire once per milestone (localStorage seen-set):
     burst over the stage orb + a celebration card at the top of the feed. */
  const [celebration, setCelebration] = useState<Milestone | null>(null)
  const [celebrationKey, setCelebrationKey] = useState(0)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  /* The Meal Reveal — a logged meal plays out on the stage. */
  const [reveal, setReveal] = useState<QuickLogResult | null>(null)

  // The Twin remembers: one-line longitudinal callback for the just-revealed
  // meal, derived from server-fetched history (which never includes the meal
  // being revealed — it was logged after this page rendered).
  const revealMemory = useMemo(() => {
    if (!reveal) return null
    return mealMemory(
      { name: reveal.meal_name ?? null, score: reveal.biotics_score ?? null },
      recentAnalyses.map((a) => ({ name: a.meal_name, score: a.biotics_score, createdAt: a.created_at })),
    )
  }, [reveal, recentAnalyses])
  /* Today's ritual signals — light the stage figure with the day's habits. */
  const [todaySignals, setTodaySignals] = useState<RitualDay | null>(null)
  useEffect(() => {
    setTodaySignals(loadRitual(browserStore(), ritualDayKey()))
  }, [])
  useEffect(() => {
    if (!twin) return
    const store = browserStore()
    const seen = loadSeen(store)
    const fresh = unseenMilestones(detectMilestones(twin, propStreak || 0), seen)
    if (fresh.length === 0) return
    const m = fresh[0]
    // Celebrate after the arrival choreography settles.
    const t = setTimeout(() => {
      setCelebration(m)
      setCelebrationKey((k) => k + 1)
    }, 1600)
    saveSeen(store, [...seen, m.id])
    // Sync the seen-set so milestones fire once across devices (real members
    // always have an email prop; the static preview has none → no-op).
    if (propEmail) pushTwinState(store)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twin])

  /* Today's real meals */
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayMeals = recentAnalyses.filter((a) => a.created_at.startsWith(todayStr))
  const todayAvg   = todayMeals.length
    ? Math.round(todayMeals.reduce((s, m) => s + (m.biotics_score ?? 0), 0) / todayMeals.length)
    : null

  /* Latest analysis for "Your Last Analysis" */
  const latestAnalysis = recentAnalyses[0] ?? null

  /* Group analyses by date for My Meals tab */
  const analysesByDate = recentAnalyses.reduce<{ date: string; meals: RealAnalysis[] }[]>((acc, a) => {
    const d = new Date(a.created_at)
    const label = (() => {
      const diff = Math.round((Date.now() - d.getTime()) / 86_400_000)
      if (diff === 0) return `Today — ${d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}`
      if (diff === 1) return `Yesterday — ${d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}`
      return d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })
    })()
    const existing = acc.find((g) => g.date === label)
    if (existing) { existing.meals.push(a) } else { acc.push({ date: label, meals: [a] }) }
    return acc
  }, [])

  /* Membership week number */
  const weekNumber = memberStartedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(memberStartedAt).getTime()) / (7 * 86_400_000)))
    : 8

  /* Submit meal for analysis */
  async function handleAnalyse() {
    if (!mealInput.trim()) return
    setLoggerState("analysing")
    setAnalyseError(null)
    try {
      const res = await fetch("/api/analyse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: mealInput.trim() }),
      })
      if (res.status === 422) {
        // Honest refusal — the input couldn't be read as food. Show the
        // server's message (retake/rewrite guidance) instead of a generic error.
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        setAnalyseError(err?.error ?? "Couldn't identify foods — try a clearer description")
        setLoggerState("empty")
        return
      }
      if (res.status === 429) {
        // Daily cap reached — surface the real limit message (which names the
        // plan's allowance) rather than a generic error that invites a retry
        // that can't succeed.
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        setAnalyseError(err?.error ?? "You've reached today's meal-analysis limit.")
        setLoggerState("empty")
        return
      }
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json() as LiveResult
      setLiveResult(data)
      setLoggerState("result")
      setMealInput("")
      // Re-derive the living Food System server-side so it visibly updates with the new
      // meal (score/biotics/feed). Client result state is preserved across refresh.
      router.refresh()
    } catch (err) {
      console.error("[analyse-meal]", err)
      setAnalyseError("Analysis failed — please try again")
      setLoggerState("empty")
    }
  }

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

  /* A brand-new member (no Twin, no meals) meets the living body first — so the
     legacy greeting/score band is suppressed in favour of the MeetBodyHero. */
  const newMemberFirstVisit = !twin && recentAnalyses.length === 0 && loggerState !== "result"

  return (
    // one continuous warm canvas — cards float on the wash, no flat-white seams
    <div className="min-h-screen" style={{ background: "#FDFBF7" }}>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — gradient band (legacy greeting; the Twin's TodayStrip + stage
          replace it, so it only renders for members without a Twin yet)
      ══════════════════════════════════════════════════════════════════ */}
      {!twin && !newMemberFirstVisit && (<>
      <div style={{ background: "white" }}>
        <div className="mx-auto max-w-5xl px-5 pb-7 pt-6 md:px-8 md:pb-9 md:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-serif text-2xl font-bold leading-tight md:text-4xl" style={{
                background: "linear-gradient(to right, #4CB648 0%, #2DAA6E 30%, #F5C518 65%, #F5A623 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
              }}>
                Good {timeOfDay},<br />{displayName}.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Link href="/account/today" className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
                  <Calendar size={13} /> Today
                </Link>
                {twin && (
                  <Link href="/account/twin" className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--icon-teal)", color: "var(--icon-teal)" }}>
                    <Activity size={13} /> My Food System
                  </Link>
                )}
                {displayStreak > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #F5C518, #F5A623)", boxShadow: "0 2px 10px rgba(245,166,35,0.35)" }}>
                    <Flame size={13} /> {displayStreak}-day streak
                  </span>
                )}
                {displayPrev != null && displayScore != null && (
                  <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 2px 10px rgba(76,182,72,0.35)" }}>
                    <TrendingUp size={13} /> {displayScore - displayPrev > 0 ? "+" : ""}{displayScore - displayPrev} pts
                  </span>
                )}
                <span className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {displayProfile}
                </span>
              </div>
            </div>
            {/* Score ring */}
            <div className="relative shrink-0 flex items-center justify-center" style={{ width: 88, height: 88 }}>
              <ScoreRing score={displayScore ?? 62} size={88} strokeWidth={7} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold leading-none" style={{ fontSize: 24, color: "var(--foreground)" }}>{displayScore ?? "—"}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand gradient divider */}
      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════════
          WEEK STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-5xl px-5 py-4 md:px-8">
          <div className="flex w-full max-w-sm items-start justify-between">
            {([
              { label: "Mon", status: "done"  as const },
              { label: "Tue", status: "today" as const },
              { label: "Wed", status: "empty" as const },
              { label: "Thu", status: "empty" as const },
              { label: "Fri", status: "empty" as const },
              { label: "Sat", status: "empty" as const },
              { label: "Sun", status: "empty" as const },
            ] as { label: string; status: "done" | "today" | "empty" }[]).map(({ label, status }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                  style={
                    status === "done"
                      ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", boxShadow: "0 2px 8px rgba(76,182,72,0.35)" }
                      : status === "today"
                      ? { border: "2.5px solid var(--icon-green)", background: "white",
                          animation: "pulse-ring 2s ease-in-out infinite",
                          boxShadow: "0 0 0 3px rgba(76,182,72,0.15)" }
                      : { border: "1.5px solid var(--border)", background: "white" }
                  }
                >
                  {status === "done" && <Check size={13} strokeWidth={2.5} color="white" />}
                  {status === "today" && (
                    <div className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }} />
                  )}
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: status === "today" ? "var(--icon-green)" : "var(--muted-foreground)" }}>
                  {status === "today" ? "Now" : label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>)}

      {/* Quick-log — portalled modal; the analysed meal reveals on the stage. */}
      {twin && (
        <QuickLog
          open={quickLogOpen}
          onClose={() => setQuickLogOpen(false)}
          onReveal={(r) => {
            setCelebration(null)
            setReveal(r)
            document.getElementById("fs-stage")?.scrollIntoView({ behavior: "smooth" })
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB NAVIGATION — sticky dark glass bar (bridges the dark stage and
          the light content so the account reads as one product)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-[57px] z-30 border-b" style={{ background: "rgba(11,22,7,0.92)", backdropFilter: "blur(10px)", borderColor: "rgba(253,251,247,0.1)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 md:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id as Tab)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all md:px-4 md:py-2.5 md:text-sm"
                style={tab === id
                  ? { background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", color: "white", boxShadow: "0 3px 10px rgba(45,170,110,0.35)" }
                  : { background: "rgba(253,251,247,0.06)", color: "rgba(253,251,247,0.7)", border: "1px solid rgba(253,251,247,0.12)" }
                }>
                {icon}{label}
              </button>
            ))}
            {twin && (
              <button
                type="button"
                onClick={() => setQuickLogOpen(true)}
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-transform hover:-translate-y-0.5 md:px-4 md:py-2.5 md:text-sm"
                style={{ background: "linear-gradient(135deg, #F5C518, #F5A623)", color: "#3a2c05", boxShadow: "0 3px 12px rgba(245,166,35,0.4)" }}
              >
                <Plus size={14} strokeWidth={3} /> Log
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════ */}
      {/* ── The Digital Twin experience (shown whenever a Twin exists) ── */}
      {tab === "overview" && twin && twinVisual && (
        <>
          <TodayStrip
            twin={twin}
            firstName={name?.split(" ")[0] ?? null}
            streak={displayStreak}
            onAddMeal={() => setQuickLogOpen(true)}
            todayHref="/account/today"
          />
          <div style={{ background: "#0B1607" }}>
            <div className="mx-auto max-w-6xl px-4 pb-3 md:px-8">
              <ExperienceNav variant="dark" />
            </div>
          </div>
          <TwinStage
            twin={twin}
            visual={twinVisual}
            figureSrc={twinFigureSrc ?? "/images/couple-hero.png"}
            video={twinVideo}
            learning={loggerState === "analysing"}
            onAddMeal={() => setQuickLogOpen(true)}
            burstKey={celebrationKey}
            burstMessage={celebration?.title}
            reveal={reveal}
            revealMemory={revealMemory}
            onRevealDone={() => setReveal(null)}
            onLogAnother={() => {
              setReveal(null)
              setQuickLogOpen(true)
            }}
            signals={todaySignals ? ritualSignals(todaySignals) : []}
            checklist={
              twin.observations.length < 3 ? (
                <MeetTwinChecklist twin={twin} addMealHref={recentAnalyses.length > 0 ? "#log-meal" : "#first-meal-logger"} />
              ) : undefined
            }
          />
          {/* dark→light bridge — the stage hands over to the cream canvas */}
          <div aria-hidden style={{ height: 64, background: "linear-gradient(180deg, #16290F 0%, #E9F1DC 55%, #FDFBF7 100%)" }} />

          {/* what changed today — the daily return loop, sentences not levels */}
          <WhatChangedToday twin={twin} />

          {/* [TODAY] — the daily ritual heartbeat + one clear priority */}
          <GroupLabel>Today</GroupLabel>
          <div className="mx-auto mt-4 grid max-w-5xl items-start gap-5 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <DailyRitual twin={twin} streak={displayStreak} authed={!!propEmail} bare figureSrc={twinFigureSrc ?? "/images/couple-hero.png"} onSignalsChange={setTodaySignals} />
            <TwinNextAction twin={twin} bare />
          </div>

          {/* [THIS WEEK] — what the Twin has learned */}
          <GroupLabel>This week</GroupLabel>
          <TwinLearnedToday
            feed={
              celebration
                ? [{ id: `milestone-${celebration.id}`, icon: "momentum" as const, title: celebration.title, detail: celebration.detail, at: null }, ...(twinFeed ?? [])]
                : (twinFeed ?? [])
            }
          />

          {/* [LEARN & ASK] — education + the AI bridge. Score/next-action live
              on the stage and /account/twin — no duplicates here. */}
          <GroupLabel>Learn &amp; ask</GroupLabel>
          <div className="mx-auto mt-4 grid max-w-5xl items-start gap-5 px-4 md:px-8 lg:grid-cols-2">
            <InsideYouTeaser twin={twin} bare />
            <AskTwin twin={twin} consultHref="/account/consult" bare />
          </div>

          {/* [PROGRESS] — the Day-75 retest ritual: countdown, retake, before/after */}
          {retest && (
            <div className="mt-8">
              <GroupLabel>Your progress</GroupLabel>
              <div className="mt-4">
                <RetestCard state={retest} />
              </div>
            </div>
          )}

          {/* [EXPLORE] — lenses into the same Food System (Foundation / Health / Life) */}
          <GroupLabel>Explore your Food System</GroupLabel>
          <SystemsExplorer />
        </>
      )}

      {/* Daily loop nudge — only when there's no Twin yet (early users). */}
      {tab === "overview" && !twin && dailyLoop && (
        <div className="pt-5">
          <DailyLoopCard data={dailyLoop} firstName={name?.split(" ")[0] ?? null} />
        </div>
      )}

      {/* First 60 seconds — a brand-new member meets the living body before any
          numbers, then the first meal wakes it up. */}
      {tab === "overview" && recentAnalyses.length === 0 && loggerState !== "result" && (
        <MeetBodyHero firstName={name?.split(" ")[0] ?? null} figureSrc={twinFigureSrc ?? "/images/couple-hero.png"} />
      )}

      {tab === "overview" && recentAnalyses.length === 0 && (
        <div className="mx-auto max-w-2xl px-4 pt-8 pb-20 md:px-8">

          {loggerState === "result" && liveResult ? (
            <FirstMealCelebration
              result={liveResult}
              firstName={name?.split(" ")[0] ?? null}
              onLogAnother={() => { setLoggerState("empty"); setMealInput("") }}
            />
          ) : (<>

          {/* ── Onboarding: first-time member ── */}
          <div className="overflow-hidden rounded-2xl" style={{
            background: "linear-gradient(135deg, var(--icon-green) 0%, var(--icon-teal) 45%, var(--icon-yellow) 80%, var(--icon-orange) 100%)",
            boxShadow: "0 8px 32px rgba(26,46,18,0.22)",
          }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
            <div className="px-6 py-8 md:px-10 md:py-10">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                Welcome to EatoBiotics
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white md:text-3xl">
                {name ? `Let's build your food system, ${name.split(" ")[0]}.` : "Let's build your food system."}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                Your Biotics score is built one meal at a time. Log your first meal and we&apos;ll give you an instant breakdown of its Prebiotic, Probiotic, and Postbiotic value.
              </p>

              {/* Steps */}
              <div className="mt-6 space-y-3">
                {[
                  { n: "1", text: "Log your next meal using the box below" },
                  { n: "2", text: "Get your instant Biotics score breakdown" },
                  { n: "3", text: "Track patterns over time and watch your score grow" },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: "rgba(255,255,255,0.20)", color: "white" }}>{n}</span>
                    <span className="text-sm text-white">{text}</span>
                  </div>
                ))}
              </div>

              {/* Arrow pointing down */}
              <div className="mt-6 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                <Camera size={14} />
                <span className="text-xs font-semibold">Describe your meal in the box below to start</span>
              </div>
            </div>
          </div>

          {/* Log first meal — directly under the card that points to it */}
          <div id="first-meal-logger" className="mt-5">
            <div className="overflow-hidden rounded-2xl" style={{
              background: "linear-gradient(135deg, var(--icon-green) 0%, var(--icon-teal) 45%, var(--icon-yellow) 80%, var(--icon-orange) 100%)",
              boxShadow: "0 4px 20px rgba(26,46,18,0.18)",
            }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
              <div className="p-5">
                <p className="mb-3 text-xs font-bold text-white opacity-80 uppercase tracking-widest">Log your first meal</p>
                <textarea
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  placeholder="e.g. Porridge with blueberries, walnuts and a spoonful of ground flaxseed…"
                  rows={3}
                  className="w-full resize-none rounded-xl border-0 p-3 text-sm outline-none focus:ring-2"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "var(--foreground)",
                    boxShadow: "inset 0 1px 4px rgba(0,0,0,0.08)",
                  }}
                />
                <button
                  disabled={!mealInput.trim() || loggerState === "analysing"}
                  onClick={async () => {
                    // The first-meal activation path — use the same working
                    // /api/analyse-meal handler as every other logger (this
                    // previously POSTed text to /api/analyse, which only accepts
                    // an image body, so it failed 100% of the time for new members).
                    await handleAnalyse()
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.30)" }}
                >
                  {loggerState === "analysing" ? (
                    <><span className="animate-pulse">Analysing…</span></>
                  ) : (
                    <><Camera size={15} /> Analyse this meal</>
                  )}
                </button>
                {analyseError && <p className="mt-2 text-center text-xs text-red-200">{analyseError}</p>}
              </div>
            </div>
          </div>

          {/* Quick-start suggestions */}
          <div className="mt-5 overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
            <div className="p-5">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                Try one of these to get started
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Porridge with berries and walnuts",
                  "Greek yoghurt with honey",
                  "Lentil soup with sourdough",
                  "Salmon with asparagus",
                  "Overnight oats with chia seeds",
                ].map((meal) => (
                  <button key={meal}
                    onClick={() => {
                      // Pre-fill the logger and bring it into view
                      setMealInput(meal)
                      document.getElementById("first-meal-logger")?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:border-[var(--icon-green)] hover:text-[var(--icon-green)]"
                    style={{ borderColor: "#e0e0e0", color: "var(--muted-foreground)" }}>
                    {meal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          </>)}

          {/* GLP-1 Companion — compact, self-selecting entry point */}
          <div className="mt-5">
            <Glp1CompanionCard />
          </div>

          {/* EatoBiotics Stability */}
          <div className="mt-5">
            <StabilityCard />
          </div>

          {/* Assessment journey + combined report (renders only when a foundation exists) */}
          <div className="mt-5">
            <AssessmentJourneyCard />
          </div>

          {/* Talk to EatoBiotic — voice consultation */}
          <div className="mt-5">
            <VoiceConsultCard />
          </div>

          {/* Refer a friend */}
          <div className="mt-5">
            <ReferralCard code={referralCode} />
          </div>

        </div>
      )}

      {tab === "overview" && recentAnalyses.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:grid md:grid-cols-[1fr_380px] md:gap-7 md:px-8 md:pt-8">

          {/* ── LEFT: Logger + Today's Meals ── */}
          <div className="space-y-5">

            {/* Gut trend — progress over time (renders once ≥3 days logged) */}
            <GutTrend history={scoreHistory} />

            {/* Logger */}
            <div id="log-meal" className="scroll-mt-24">

              {/* Empty state — standard white card language, same behaviour */}
              {loggerState === "empty" && (
                <div className="overflow-hidden rounded-2xl" style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 20px rgba(26,46,18,0.07)",
                }}>
                  {/* Top brand gradient strip */}
                  <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

                  {/* Decorative food image strip — context row, subordinate */}
                  <div className="flex items-center px-5 pt-5 pb-3">
                    {["/food-3.webp", "/food-5.webp", "/food-7.webp", "/food-2.webp"].map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt=""
                        className="rounded-full object-cover"
                        style={{
                          width: 32, height: 32, flexShrink: 0,
                          border: "2px solid white",
                          marginLeft: i > 0 ? -8 : 0,
                          boxShadow: "0 2px 6px rgba(26,46,18,0.18)",
                        }} />
                    ))}
                    <span className="ml-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                      7 meals analysed this week
                    </span>
                  </div>

                  {/* Main content */}
                  <div className="flex flex-col items-center px-6 pb-6 text-center">
                    {/* Camera icon — orange ring */}
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{
                        background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
                        boxShadow: "0 4px 20px rgba(245,166,35,0.35)",
                      }}>
                      <Camera size={26} color="white" />
                    </div>

                    <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      Analyse your Meal
                    </h2>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Take or upload a photo of your meal. EatoBiotics will analyse its biotics profile and teach you what&apos;s happening inside.
                    </p>

                    {/* Primary CTA — Take photo → opens the QuickLog, which
                        captures the plate and plays the meal out on the stage.
                        Falls back to focusing the describe box when no Twin. */}
                    <button
                      onClick={() => (twin ? setQuickLogOpen(true) : document.getElementById("inline-describe-meal")?.focus())}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 4px 16px rgba(45,170,110,0.3)" }}>
                      <Camera size={16} /> Take photo
                    </button>

                    {/* Secondary — Upload, equal sibling to Take photo */}
                    <button
                      onClick={() => (twin ? setQuickLogOpen(true) : document.getElementById("inline-describe-meal")?.focus())}
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.03]"
                      style={{ background: "white", border: "1px solid var(--icon-green)", color: "var(--icon-green)" }}>
                      ↑ Upload image
                    </button>

                    {/* Tertiary — describe, real API */}
                    <div className="mt-2.5 flex w-full items-center gap-2">
                      <input
                        id="inline-describe-meal"
                        type="text"
                        placeholder="Or describe your meal…"
                        value={mealInput}
                        onChange={(e) => setMealInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleAnalyse() }}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--icon-green)]"
                        style={{
                          background: "var(--muted)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }} />
                      <button
                        onClick={() => void handleAnalyse()}
                        disabled={!mealInput.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                        <ArrowRight size={16} color="white" />
                      </button>
                    </div>
                    {analyseError && (
                      <p className="mt-2 text-center text-xs" style={{ color: "#a05a0a" }}>{analyseError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Analysing state */}
              {loggerState === "analysing" && (
                <div className="rounded-2xl p-5" style={{
                  background: "white", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(26,46,18,0.06)",
                }}>
                  <div className="mb-5 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/food-1.webp" alt="Meal" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>Mackerel, kimchi & asparagus</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>19:25 · Dinner</p>
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    {[
                      { text: "Identifying ingredients...", opacity: 1 },
                      { text: "Mapping your biotics...", opacity: 0.5 },
                      { text: "Finding what's interesting...", opacity: 0.2 },
                    ].map(({ text, opacity }) => (
                      <div key={text} className="flex items-center gap-2.5" style={{ opacity }}>
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }} />
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 overflow-hidden rounded-full" style={{ height: "4px", background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: "62%", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                  </div>
                </div>
              )}

              {/* Result state — use liveResult if available, else mock */}
              {loggerState === "result" && (() => {
                const r = liveResult ?? {
                  id: null, meal_name: "Mackerel, kimchi & asparagus", meal_type: "Dinner",
                  biotics_score: 71, prebiotic_score: 72, probiotic_score: 18, postbiotic_score: 41,
                  quality_diversity: 55, quality_anti_inflammatory: 80,
                  nutrition: { calories: 385, protein: 38, carbs: 12, fat: 18, fibre: 7 },
                  insight: "Your mackerel is delivering omega-3s that reduce gut inflammation, while the kimchi seeds live Lactobacillus cultures. The asparagus adds inulin — a prebiotic fibre that feeds those bacteria directly. Adding a handful of walnuts would push your diversity score from 55 to ~72.",
                  tags: ["Omega-3s", "Probiotics", "Prebiotics", "Anti-inflammatory"],
                }
                const logTime = r.created_at ? new Date(r.created_at).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) : "just now"
                return (
                <div className="overflow-hidden rounded-2xl" style={{
                  background: "white", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(26,46,18,0.07)",
                }}>
                  {/* Gradient top accent */}
                  <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />

                  {/* Meal identity row */}
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <p className="font-semibold text-sm leading-snug" style={{ color: "var(--foreground)" }}>{r.meal_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{logTime} · {r.meal_type}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }}>
                      {r.meal_type}
                    </span>
                  </div>

                  {/* Meal photo + score ring */}
                  <div className="relative flex items-center justify-center" style={{ background: "white", minHeight: 220 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/food-1.webp"
                      alt="Mackerel, kimchi &amp; asparagus"
                      style={{ width: "100%", maxHeight: 240, objectFit: "contain", objectPosition: "center", display: "block" }}
                    />
                    {/* Gradient score ring — top-right, white bg blends into image */}
                    <div className="absolute top-3 right-3 flex flex-col items-center"
                      style={{ background: "white", borderRadius: "50%", padding: 3, boxShadow: "0 2px 12px rgba(76,182,72,0.22)" }}>
                      <svg width="88" height="88" viewBox="0 0 88 88">
                        <defs>
                          <linearGradient id="result-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%"   stopColor="var(--icon-lime)" />
                            <stop offset="50%"  stopColor="var(--icon-green)" />
                            <stop offset="100%" stopColor="var(--icon-teal)" />
                          </linearGradient>
                        </defs>
                        {/* Track */}
                        <circle cx="44" cy="44" r="36" fill="none" stroke="#e8e8e8" strokeWidth="7" />
                        {/* Arc */}
                        <circle
                          cx="44" cy="44" r="36" fill="none"
                          stroke="url(#result-ring-grad)" strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 36 * (r.biotics_score ?? 0) / 100} ${2 * Math.PI * 36}`}
                          transform="rotate(-90 44 44)"
                        />
                        {/* Score label */}
                        <text x="44" y="40" textAnchor="middle" dominantBaseline="middle"
                          style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 22, fontWeight: 700, fill: "var(--foreground)" }}>
                          {r.biotics_score ?? 0}
                        </text>
                        <text x="44" y="57" textAnchor="middle" dominantBaseline="middle"
                          style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, fill: "var(--muted-foreground)" }}>
                          /100
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* ── BIOTICS ── */}
                  <div className="px-5 pb-3 pt-4">
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                      Biotics
                    </p>
                    <div className="space-y-2.5">
                      <ScoreBar label="Prebiotic"  score={r.prebiotic_score  ?? 0} />
                      <ScoreBar label="Probiotic"  score={r.probiotic_score  ?? 0} />
                      <ScoreBar label="Postbiotic" score={r.postbiotic_score ?? 0} />
                    </div>
                  </div>

                  <div className="mx-5 h-px" style={{ background: "var(--border)" }} />

                  {/* ── MEAL QUALITY ── */}
                  <div className="px-5 pb-3 pt-3">
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
                      Meal Quality
                    </p>
                    <div className="space-y-2.5">
                      <ScoreBar label="Diversity"         score={r.quality_diversity         ?? 0} />
                      <ScoreBar label="Anti-inflammatory" score={r.quality_anti_inflammatory ?? 0} />
                    </div>
                  </div>

                  <div className="mx-5 h-px" style={{ background: "var(--border)" }} />

                  {/* ── NUTRITION CONTEXT ── */}
                  <div className="pb-1 pt-3">
                    <p className="mb-1 px-5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                      Nutrition Context
                    </p>
                    <div className="grid grid-cols-5">
                      {([
                        { label: "Calories", value: String(r.nutrition.calories), unit: "kcal", color: "var(--icon-orange)" },
                        { label: "Protein",  value: String(r.nutrition.protein),  unit: "g",    color: "var(--icon-teal)" },
                        { label: "Carbs",    value: String(r.nutrition.carbs),    unit: "g",    color: "var(--icon-yellow)" },
                        { label: "Fat",      value: String(r.nutrition.fat),      unit: "g",    color: "var(--icon-green)" },
                        { label: "Fibre",    value: String(r.nutrition.fibre),    unit: "g",    color: "var(--icon-lime)" },
                      ] as { label: string; value: string; unit: string; color: string }[]).map(({ label, value, unit, color }, i) => (
                        <div key={label} className="flex flex-col items-center py-2.5"
                          style={{ borderRight: i < 4 ? "1px solid var(--border)" : undefined }}>
                          <span className="font-mono text-sm font-semibold leading-none" style={{ color }}>{value}</span>
                          <span className="mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>{unit}</span>
                          <span className="mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mx-5 h-px" style={{ background: "var(--border)" }} />

                  {/* Insight panel — white with gradient left border */}
                  <div className="mx-5 mb-3 flex overflow-hidden rounded-xl" style={{ border: "1px solid #e8e8e8" }}>
                    <div className="w-[3px] shrink-0"
                      style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                    <div className="px-4 py-4">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                        What EatoBiotics noticed
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                        {r.insight}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                    {(r.tags ?? []).map(t => <Tag key={t}>{t}</Tag>)}
                  </div>

                  <div className="px-5 pb-5 pt-2">
                    <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--icon-lime) 12%, white), color-mix(in srgb, var(--icon-green) 10%, white))", border: "1px solid color-mix(in srgb, var(--icon-green) 20%, transparent)" }}>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: "var(--icon-green)" }}>Saved to My Meals</p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Added to {new Date().toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}</p>
                      </div>
                      <button
                        className="text-xs font-semibold underline underline-offset-2"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={() => setTab("meals")}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )
              })()}
            </div>

            {/* Last analysis — flows from logger above */}
            <div style={{ marginTop: 12 }}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                Your Last Analysis
              </p>
              {latestAnalysis
                ? <MealCard meal={realToMealEntry(latestAnalysis)} />
                : <MealCard meal={MOCK_MEALS[0].meals[0]} />
              }
            </div>

            {/* Today's Meals */}
            <div>
              <SectionLabel>Today&apos;s Meals</SectionLabel>
              <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
                <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />

                {/* Real today's meals — or mock fallback */}
                {(todayMeals.length > 0 ? todayMeals : MOCK_MEALS[0].meals).map((meal, i) => {
                  const isMock = todayMeals.length === 0
                  const name   = isMock ? (meal as typeof MOCK_MEALS[0]["meals"][0]).name : ((meal as RealAnalysis).meal_name ?? "Meal")
                  const time   = isMock
                    ? (meal as typeof MOCK_MEALS[0]["meals"][0]).time
                    : new Date((meal as RealAnalysis).created_at).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })
                  const type   = isMock ? (meal as typeof MOCK_MEALS[0]["meals"][0]).type : ((meal as RealAnalysis).meal_type ?? "Meal")
                  const score  = isMock ? (meal as typeof MOCK_MEALS[0]["meals"][0]).score : ((meal as RealAnalysis).biotics_score ?? 0)
                  const img    = isMock ? (meal as typeof MOCK_MEALS[0]["meals"][0]).image : ((meal as RealAnalysis).image_url ?? "/food-1.webp")
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug" style={{ color: "var(--foreground)" }}>{name}</p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{time} · {type}</p>
                      </div>
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--icon-green)" }}>{score}</span>
                    </div>
                  )
                })}

                {/* + Log prompt when fewer than 3 meals logged today */}
                {todayMeals.length < 3 && (
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--border)", opacity: 0.55 }}>
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ border: "1.5px solid #c8c8c8" }} />
                    <p className="flex-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {todayMeals.length === 0 ? "No meals logged today" : "Log another meal"}
                    </p>
                    <button
                      className="text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{ color: "var(--icon-green)", opacity: 1 }}
                      onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setLoggerState("empty") }}
                    >
                      + Log
                    </button>
                  </div>
                )}

                {/* Daily average */}
                {(todayMeals.length > 0 || true) && (
                  <div className="border-t px-4 py-2.5" style={{ borderColor: "var(--border)" }}>
                    <p className="text-right text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      Today&apos;s average:{" "}
                      <strong style={{ color: "var(--icon-green)" }}>
                        {todayAvg ?? MOCK_MEALS[0].meals[0].score}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>{/* end left */}

          {/* ── RIGHT: Biotics + Consultation + Monthly Focus ── */}
          <div className="mt-5 space-y-4 md:mt-0">

            {/* Biotics Profile */}
            <div>
              <SectionLabel>Your Biotics Profile</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { label: "Prebiotic",  score: displayBiotics.prebiotic,  delta: displayBiotics.prebiotic  >= 60 ? "On track"    : displayBiotics.prebiotic  >= 30 ? "Building"    : "Needs work", c0: "#A8E063", c1: "#4CB648", textColor: "#2d7a24", borderColor: "var(--icon-lime)" },
                  { label: "Probiotic",  score: displayBiotics.probiotic,  delta: displayBiotics.probiotic  >= 60 ? "On track"    : displayBiotics.probiotic  >= 30 ? "Building"    : "Needs work", c0: "#F5C518", c1: "#F5A623", textColor: "#a05a0a", borderColor: "var(--icon-orange)" },
                  { label: "Postbiotic", score: displayBiotics.postbiotic, delta: displayBiotics.postbiotic >= 60 ? "Strong"      : displayBiotics.postbiotic >= 30 ? "Stable"      : "Needs work", c0: "#4CB648", c1: "#2DAA6E", textColor: "#0a6644", borderColor: "var(--icon-teal)" },
                ] as { label: string; score: number; delta: string; c0: string; c1: string; textColor: string; borderColor: string }[]).map(({ label, score, delta, c0, c1, textColor, borderColor }) => (
                  <div key={label} className="flex flex-col items-center overflow-hidden rounded-2xl"
                    style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(26,46,18,0.05)" }}>
                    {/* Coloured top border */}
                    <div className="h-[3.5px] w-full" style={{ background: `linear-gradient(90deg, ${c0}, ${c1})` }} />
                    <div className="flex flex-col items-center p-3.5">
                      <p className="mb-2 text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                      <MiniRing score={score} gradId={`ring-${label}`} c0={c0} c1={c1} textColor={textColor} />
                      <p className="mt-2 text-center text-[10px] font-semibold leading-tight" style={{ color: borderColor }}>{delta}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Subtle membership progress line */}
              <p className="mt-2.5 text-center text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                Week {weekNumber} of 30 · Building your food system
              </p>
            </div>

            {/* Your Focus Today — lowest pillar driven */}
            <div className="overflow-hidden rounded-2xl" style={{
              background: "white",
              border: "1px solid var(--border)",
              borderLeft: "4px solid var(--icon-orange)",
              boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
            }}>
              <div className="p-4">
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
                  Your Focus Today
                </p>
                <h3 className="font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                  Add one fermented food today
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  Your probiotic score is your lowest pillar. One serving of kimchi, kefir, yoghurt,
                  or kombucha today would make a measurable difference.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Probiotics", "Quick win"].map(t => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
            </div>

            {/* Consultation — premium editorial card */}
            <div>
              <SectionLabel>Weekly Consultation</SectionLabel>
              <div className="overflow-hidden rounded-2xl" style={{
                background: "linear-gradient(135deg, var(--icon-green) 0%, var(--icon-teal) 45%, var(--icon-yellow) 80%, var(--icon-orange) 100%)",
                boxShadow: "0 6px 28px rgba(26,46,18,0.22)",
              }}>
                <div className="p-5">

                  {/* Eyebrow */}
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Weekly · EatoBiotic Consultation
                  </p>

                  {/* Headline + decorative microbiome graphic */}
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl font-bold leading-snug text-white">
                      The Food System<br />Inside You
                      <span className="mt-1 block text-sm font-normal" style={{ color: "rgba(255,255,255,0.70)" }}>Weekly Report</span>
                    </h3>
                    {/* Abstract microbiome / gut flora graphic */}
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="shrink-0 opacity-80" aria-hidden="true">
                      {/* Outer orbit ring */}
                      <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" strokeDasharray="4 3" />
                      {/* Inner orbit ring */}
                      <circle cx="32" cy="32" r="18" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                      {/* Core cell */}
                      <circle cx="32" cy="32" r="9" fill="rgba(255,255,255,0.20)" />
                      <circle cx="32" cy="32" r="5" fill="rgba(255,255,255,0.35)" />
                      {/* Orbiting bacteria dots — outer ring */}
                      <circle cx="32"  cy="4"  r="3.2" fill="rgba(255,255,255,0.60)" />
                      <circle cx="57"  cy="20" r="2.4" fill="rgba(255,255,255,0.45)" />
                      <circle cx="57"  cy="44" r="3"   fill="rgba(255,255,255,0.55)" />
                      <circle cx="32"  cy="60" r="2"   fill="rgba(255,255,255,0.35)" />
                      <circle cx="7"   cy="44" r="2.8" fill="rgba(255,255,255,0.50)" />
                      <circle cx="7"   cy="20" r="2"   fill="rgba(255,255,255,0.40)" />
                      {/* Orbiting bacteria dots — inner ring */}
                      <circle cx="32"  cy="14" r="2"   fill="rgba(255,255,255,0.50)" />
                      <circle cx="48"  cy="32" r="2.2" fill="rgba(255,255,255,0.45)" />
                      <circle cx="16"  cy="32" r="1.8" fill="rgba(255,255,255,0.45)" />
                      <circle cx="32"  cy="50" r="1.6" fill="rgba(255,255,255,0.40)" />
                      {/* Connecting filament lines — prebiotic fibres */}
                      <line x1="32" y1="23" x2="32" y2="14" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                      <line x1="41" y1="32" x2="48" y2="32" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                      <line x1="32" y1="41" x2="32" y2="50" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                      <line x1="23" y1="32" x2="16" y2="32" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                    </svg>
                  </div>

                  {/* Three feature pills */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { icon: <TrendingUp size={11} />, label: "Score review" },
                      { icon: <Activity   size={11} />, label: "Biotics analysis" },
                      { icon: <Target     size={11} />, label: "Your focus action" },
                    ].map(({ icon, label }) => (
                      <span key={label} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
                        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)" }}>
                        {icon}{label}
                      </span>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-4 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />

                  {/* Pull quote — real or fallback */}
                  <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare size={11} color="rgba(255,255,255,0.50)" />
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.50)" }}>
                        {weeklyReport?.report_json?.weekNumber
                          ? `From your Week ${weeklyReport.report_json.weekNumber} report`
                          : "From your latest report"}
                      </p>
                    </div>
                    <p className="text-sm italic leading-relaxed text-white">
                      &ldquo;{weeklyReport?.report_json?.pullQuote ?? "Your probiotic score is your biggest lever right now. One daily fermented food would shift your overall Biotics number by 8–12 points within three weeks."}&rdquo;
                    </p>
                  </div>

                  {/* Next session box — white card */}
                  <div className="mt-4 overflow-hidden rounded-xl" style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                        <Calendar size={16} color="white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Sunday 17 May</p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          Week {weekNumber} of 30
                        </p>
                      </div>
                      <div className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                        Upcoming
                      </div>
                    </div>
                  </div>

                  {/* CTA — link to latest report if available, else tab switch */}
                  {weeklyReport ? (
                    <Link href={`/account/report/${weeklyReport.id}`}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "white", color: "var(--icon-green)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                      View your latest report <ChevronRight size={13} />
                    </Link>
                  ) : (
                  <button onClick={() => setTab("consultations")}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "white", color: "var(--icon-green)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                    View past consultations <ChevronRight size={13} />
                  </button>
                  )}

                </div>
              </div>
            </div>

            {/* Monthly Focus */}
            <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
              <div className="flex overflow-hidden">
                <div className="w-[3px] shrink-0"
                  style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                <div className="p-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                    This month&apos;s focus
                  </p>
                  <h3 className="font-serif text-lg font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                    Fix your fermented food gap.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Your plant diversity has been strong but your Live Foods score is pulling down your overall Biotics number.
                    One fermented food daily for 30 days changes this.
                  </p>
                  <Link href="#" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-75"
                    style={{ color: "var(--icon-green)" }}>
                    Read your full plan <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* GLP-1 Companion — compact, self-selecting entry point */}
            <Glp1CompanionCard />

            {/* EatoBiotics Stability */}
            <StabilityCard />

            {/* Assessment journey + combined report (renders only when a foundation exists) */}
            <AssessmentJourneyCard />

            {/* Talk to EatoBiotic — voice consultation */}
            <VoiceConsultCard />

            {/* Refer a friend */}
            <ReferralCard code={referralCode} />

          </div>{/* end right */}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MEALS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "meals" && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8 md:pt-8">
          {(() => {
            /* Use real data if available, else fall back to mock */
            const groups = analysesByDate.length > 0
              ? analysesByDate.map(({ date, meals }) => ({
                  date,
                  cards: meals.map(a => realToMealEntry(a)),
                }))
              : MOCK_MEALS.map(({ date, meals }) => ({ date, cards: meals }))

            const totalMeals = analysesByDate.length > 0 ? recentAnalyses.length : 7
            const avgScore   = analysesByDate.length > 0 && recentAnalyses.length > 0
              ? Math.round(recentAnalyses.reduce((s, a) => s + (a.biotics_score ?? 0), 0) / recentAnalyses.length)
              : 73

            return (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>My Meals</h2>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {totalMeals} meal{totalMeals !== 1 ? "s" : ""} logged this week · Average score:{" "}
                      <strong style={{ color: "var(--icon-green)" }}>{avgScore}</strong>
                    </p>
                  </div>
                  <GradientButton small onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setTab("overview"); setLoggerState("empty") }}>
                    <Camera size={13} /> Log meal
                  </GradientButton>
                </div>

                <div className="space-y-8">
                  {groups.map(({ date, cards }) => (
                    <div key={date}>
                      {/* Date separator */}
                      <div className="mb-4 flex items-center gap-3">
                        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), transparent)" }} />
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{date}</p>
                        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, var(--icon-teal))" }} />
                      </div>
                      {/* 2-col grid on desktop, single col on mobile */}
                      <div className="grid gap-5 md:grid-cols-2">
                        {cards.map(meal => <MealCard key={meal.name + meal.time} meal={meal} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          REPORTS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "reports" && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8 md:pt-8">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Snapshots</p>
            <h2 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Moments your Food System remembers</h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
              {paidReports.length > 0
                ? `${paidReports.length} Food System snapshot${paidReports.length === 1 ? "" : "s"} — each one a moment your Food System can look back on`
                : "Your purchased Food System Reports will appear here."}
            </p>
          </div>

          {/* Purchased Food System Reports — real data from deep_assessments */}
          {paidReports.length > 0 && (
            <div className="mb-6 space-y-4">
              {paidReports.map((r) => {
                const delivered = r.status === "complete"
                const emailFailed = r.emailStatus === "failed"
                return (
                  <div key={r.sessionId} className="overflow-hidden rounded-2xl"
                    style={{ border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(26,46,18,0.06)" }}>
                    <div className="px-5 py-5" style={{ background: "linear-gradient(135deg, #1a4a14 0%, #0a5c44 100%)" }}>
                      <div className="h-[2px] mb-4 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-orange))" }} />
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
                        Snapshot · Food System Report · {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </p>
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <div>
                          <p className="font-serif text-lg font-bold text-white">Your Food System Report</p>
                          {r.profileType && <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{r.profileType}</p>}
                        </div>
                        {typeof r.overall === "number" && (
                          <div className="text-right">
                            <p className="font-mono text-3xl font-bold leading-none" style={{ color: "var(--icon-lime)" }}>{r.overall}</p>
                            <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>/100</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5"
                      style={{ borderColor: "var(--border)", background: "white" }}>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {delivered
                          ? (emailFailed ? "Ready to view here (email delivery retried)" : "Delivered to your inbox")
                          : "Being prepared — we'll email it shortly"}
                      </span>
                      <div className="flex gap-2">
                        {r.pdfUrl && (
                          <button type="button" onClick={() => handleDownloadPdf(r.sessionId)}
                            disabled={pdfLinkState[r.sessionId] === "loading"}
                            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                            style={{ borderColor: "#d0d0d0", color: "var(--muted-foreground)" }}>
                            <Download size={11} /> {pdfLinkState[r.sessionId] === "loading" ? "Preparing…" : "PDF"}
                          </button>
                        )}
                        <Link href={`/assessment/report?session_id=${encodeURIComponent(r.sessionId)}`}
                          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 2px 8px rgba(45,170,110,0.25)" }}>
                          View report <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                    {pdfLinkState[r.sessionId] === "error" && (
                      <div className="border-t px-5 py-2.5" style={{ borderColor: "var(--border)", background: "white" }}>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          We couldn&apos;t refresh your PDF link. Please use View report or try again.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Honest empty state — the real dashboard renders only real report data */}
          {paidReports.length === 0 && (
            <div className="rounded-2xl px-6 py-10 text-center"
              style={{ border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(26,46,18,0.06)", background: "white" }}>
              <p className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>No reports yet</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm" style={{ color: "var(--muted-foreground)" }}>
                Your Food System Report will appear here after you complete your assessment and purchase your personalised report.
              </p>
              <Link href="/assessment"
                className="mt-5 inline-flex items-center gap-1 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 2px 8px rgba(45,170,110,0.25)" }}>
                Get My Food System Score <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONSULTATIONS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "consultations" && (() => {
        const reports   = weeklyReports.length > 0 ? weeklyReports : null
        const count     = reports?.length ?? MOCK_CONSULTATIONS.length

        /* Normalise real reports → ReportCardData */
        const realCards: ReportCardData[] = (reports ?? []).map((r) => {
          const rj = r.report_json
          return {
            id:               r.id,
            dateStr:          new Date(r.week_starting).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            weekLabel:        rj?.weekNumber ? `Week ${rj.weekNumber} of 30` : `w/c ${r.week_starting}`,
            avgScore:         rj?.averageScore ?? null,
            delta:            rj?.previousWeekAverage != null && rj?.averageScore != null
                                ? Math.round(rj.averageScore - rj.previousWeekAverage)
                                : null,
            weekSummaryTitle: rj?.weekSummaryTitle ?? null,
            pillars:          rj?.pillars ?? null,
            pullQuote:        rj?.pullQuote ?? null,
            focusAction:      rj?.focusAction ?? null,
            mealCount:        rj?.mealCount ?? null,
            reportHref:       `/account/report/${r.id}`,
            chatHref:         `/account/report/${r.id}#chat`,
          }
        })

        /* Normalise mock → ReportCardData */
        const mockCards: ReportCardData[] = MOCK_CONSULTATIONS.map((c) => ({
          id:               c.id,
          dateStr:          c.date,
          weekLabel:        c.week,
          avgScore:         c.avgScore,
          delta:            c.delta,
          weekSummaryTitle: c.weekSummaryTitle,
          pillars:          c.pillars,
          pullQuote:        c.pullQuote,
          focusAction:      c.focusAction,
          mealCount:        c.mealCount,
          reportHref:       null,
          chatHref:         null,
        }))

        const cards = reports ? realCards : mockCards

        /* Score progression strip — scores oldest→newest */
        const scoreSequence = cards.map(c => c.avgScore).filter((s): s is number => s != null).reverse()

        /* Week progress dots — which days of this week have analyses */
        const weekDots = (() => {
          const now = new Date()
          const dow = now.getDay()
          const mondayOffset = dow === 0 ? -6 : 1 - dow
          const monday = new Date(now)
          monday.setDate(now.getDate() + mondayOffset)
          monday.setHours(0, 0, 0, 0)
          const todayStr = now.toISOString().slice(0, 10)
          return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label, i) => {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            const dayStr = d.toISOString().slice(0, 10)
            const hasLog = recentAnalyses.some(a => a.created_at.startsWith(dayStr))
            const isToday = dayStr === todayStr
            const isFuture = d > now
            return { label, hasLog, isToday, isFuture }
          })
        })()

        const daysLogged = weekDots.filter(d => d.hasLog).length

        return (
          <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8 md:pt-8">

            {/* ── Header: title + score progression ── */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>My Weekly Reports</h2>
                <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {count > 0
                    ? `${count} report${count !== 1 ? "s" : ""} generated · new report every Sunday`
                    : "Your first report will appear after your first week of logging meals"}
                </p>
              </div>
              {/* Score progression strip */}
              {scoreSequence.length > 1 && (
                <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                  {scoreSequence.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums text-white"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 1px 6px rgba(45,170,110,0.25)" }}>
                        {s}
                      </span>
                      {i < scoreSequence.length - 1 && (
                        <ChevronRight size={11} style={{ color: "var(--muted-foreground)" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Next report banner with week progress dots ── */}
            <div className="mb-5 overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(26,46,18,0.07)" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                  <Calendar size={16} color="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Next report · Sunday
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {daysLogged > 0
                      ? `${daysLogged} of 7 days logged this week — keep going`
                      : "Log your first meal this week to start your report"}
                  </p>
                </div>
                {/* 7-dot progress */}
                <div className="flex shrink-0 items-center gap-1">
                  {weekDots.map(({ label, hasLog, isToday, isFuture }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className="h-3 w-3 rounded-full transition-all"
                        style={hasLog
                          ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", boxShadow: "0 1px 4px rgba(76,182,72,0.40)" }
                          : isToday
                          ? { border: "2px solid var(--icon-green)", background: "white" }
                          : isFuture
                          ? { background: "var(--border)" }
                          : { background: "#d1d5db" }
                        }
                      />
                      <span className="text-[8px] font-semibold"
                        style={{ color: isToday ? "var(--icon-green)" : "var(--muted-foreground)" }}>
                        {label[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Report cards ── */}
            <div className="space-y-5">
              {cards.map(card => <ReportCard key={card.id} card={card} />)}
            </div>

          </div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════════════════
          MY ACCOUNT TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "account" && (
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-8 md:pt-8 space-y-6">

          {/* ── Section 1: Personal Details ── */}
          <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                  <User size={14} color="white" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Personal Details</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Your account information</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5 space-y-4">
              {/* Email — read only */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Email</label>
                <div className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {(propEmail as string | null) ?? "—"}
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Email cannot be changed</p>
              </div>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Name</label>
                <input
                  type="text"
                  value={acctName}
                  onChange={(e) => setAcctName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                  style={{ borderColor: "var(--border)", background: "white", color: "var(--foreground)" }}
                />
              </div>
              {/* Age bracket */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Age Range</label>
                <select
                  value={acctAgeBracket}
                  onChange={(e) => setAcctAgeBracket(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                  style={{ borderColor: "var(--border)", background: "white", color: "var(--foreground)" }}
                >
                  <option value="">Select your age range</option>
                  {AGE_BRACKETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              {/* Sex — personalises your living Food System figure */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Sex</label>
                <select
                  value={acctSex}
                  onChange={(e) => setAcctSex(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                  style={{ borderColor: "var(--border)", background: "white", color: "var(--foreground)" }}
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
                <p className="mt-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>Personalises your Food System figure.</p>
              </div>
              {/* Member since */}
              {memberStartedAt && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <Calendar size={13} style={{ color: "var(--icon-green)", flexShrink: 0 }} />
                  <p className="text-xs font-medium" style={{ color: "#15803d" }}>
                    Member since {new Date(memberStartedAt).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              {/* Save button */}
              {acctError && <p className="text-xs text-red-500">{acctError}</p>}
              <button
                onClick={handleSaveProfile}
                disabled={acctSaving}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 3px 10px rgba(45,170,110,0.25)" }}
              >
                {acctSaving ? "Saving…" : acctSaved ? "✓ Saved" : "Save changes"}
              </button>
            </div>
          </div>

          {/* ── Section 1b: Subscription ── always visible ── */}
          <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: cancelStage === "confirm" ? "1.5px solid #fed7aa" : "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />

            {/* ── Active paid plan: cancel flow ── */}
            {propMemberTier && propMemberTier !== "free" && propMemberStatus !== "cancelled" ? (
              <>
                {/* Idle */}
                {cancelStage === "idle" && (
                  <div className="flex items-center justify-between gap-4 px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#fff7ed" }}>
                        <span style={{ fontSize: 16 }}>📋</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm capitalize" style={{ color: "var(--foreground)" }}>
                          {propMemberTier} Subscription
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {nextBillingDate
                            ? `Next billing ${new Date(nextBillingDate as string).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}`
                            : "Active subscription"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCancelStage("confirm")}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
                    >
                      Cancel plan
                    </button>
                  </div>
                )}

                {/* Confirm */}
                {cancelStage === "confirm" && (
                  <div className="px-5 py-5 space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2" style={{ color: "var(--foreground)" }}>
                        Cancel your <span className="capitalize">{propMemberTier}</span> plan?
                      </p>
                      <ul className="space-y-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        <li>• Your meal analysis and biotics scoring will stop</li>
                        <li>• Weekly reports will no longer be generated</li>
                        {propMemberTier !== "grow" && (
                          <li>• Your personalised monthly gut plan will end</li>
                        )}
                        {propMemberTier !== "grow" && (
                          <li>• AI consultation access will be removed</li>
                        )}
                      </ul>
                      {nextBillingDate && (
                        <p className="mt-3 text-sm font-medium rounded-lg px-3 py-2 inline-block" style={{ background: "#fff7ed", color: "#c2410c" }}>
                          You keep full access until {new Date(nextBillingDate as string).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    {cancelError && <p className="text-xs text-red-500">{cancelError}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setCancelStage("idle"); setCancelError(null) }}
                        className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-gray-50"
                        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                      >
                        Keep my plan
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))", boxShadow: "0 2px 8px rgba(245,166,35,0.30)" }}
                      >
                        Yes, cancel plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancelling */}
                {cancelStage === "cancelling" && (
                  <div className="flex items-center justify-center gap-3 px-5 py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
                    <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>Cancelling subscription…</p>
                  </div>
                )}

                {/* Done */}
                {cancelStage === "done" && (
                  <div className="px-5 py-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#f0fdf4" }}>
                        <Check size={13} style={{ color: "var(--icon-green)" }} />
                      </div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Subscription cancelled</p>
                    </div>
                    {cancelUntil ? (
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Your access continues until <strong>{new Date(cancelUntil).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}</strong>. No further charges will be made.
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No further charges will be made.</p>
                    )}
                  </div>
                )}
              </>
            ) : propMemberStatus === "cancelled" || cancelStage === "done" ? (
              /* ── Already cancelled ── */
              <div className="px-5 py-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#f0fdf4" }}>
                    <Check size={13} style={{ color: "var(--icon-green)" }} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Subscription cancelled</p>
                </div>
                {(cancelUntil ?? nextBillingDate) ? (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Your access continues until <strong>{new Date((cancelUntil ?? nextBillingDate) as string).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}</strong>. No further charges will be made.
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No further charges will be made.</p>
                )}
              </div>
            ) : (
              /* ── Free / no subscription ── */
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#f3f4f6" }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>No active subscription</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Upgrade to unlock meal analysis and weekly reports</p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 2px 8px rgba(45,170,110,0.25)" }}
                >
                  View plans →
                </Link>
              </div>
            )}
          </div>

          {/* ── Section 2: Export My Data ── */}
          <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-lime))" }} />
            <div className="px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))" }}>
                      <Download size={14} color="white" />
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Export My Data</p>
                  </div>
                  <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--muted-foreground)" }}>
                    Download everything EatoBiotics holds about you — assessments, meals, and weekly reports — as a single JSON file.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={exportState === "downloading"}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))", boxShadow: "0 3px 10px rgba(45,170,110,0.20)" }}
              >
                <Download size={14} />
                {exportState === "downloading" ? "Preparing download…" : exportState === "done" ? "✓ Downloaded" : "Download my data"}
              </button>
            </div>
          </div>

          {/* ── Section 3: Delete My Account ── */}
          <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: deleteStage !== "closed" ? "1.5px solid #fca5a5" : "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #f87171, #ef4444)" }} />

            {/* Stage 0 — closed trigger */}
            {deleteStage === "closed" && (
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#fee2e2" }}>
                    <Trash2 size={14} style={{ color: "#ef4444" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Delete My Account</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Permanently remove all your data</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteStage("warning")}
                  className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5" }}
                >
                  Delete account
                </button>
              </div>
            )}

            {/* Stage 1 — warning */}
            {deleteStage === "warning" && (
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="font-semibold text-sm mb-2" style={{ color: "#dc2626" }}>This will permanently delete:</p>
                    <ul className="space-y-1 text-sm" style={{ color: "var(--foreground)" }}>
                      <li>• Your profile and all personal data</li>
                      <li>• All meal analyses ({recentAnalyses.length > 0 ? `${recentAnalyses.length}+ meals` : "all meals"})</li>
                      <li>• All weekly reports</li>
                      <li>• Your assessment history</li>
                    </ul>
                    <p className="mt-3 text-sm font-semibold" style={{ color: "#dc2626" }}>This cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteStage("closed")}
                    className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-gray-50"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStage("confirm")}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #f87171, #ef4444)", boxShadow: "0 2px 8px rgba(239,68,68,0.30)" }}
                  >
                    I understand, continue →
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2 — confirm input */}
            {deleteStage === "confirm" && (
              <div className="px-5 py-5 space-y-4">
                <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Type DELETE to confirm:</p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-xl border px-4 py-2.5 text-sm font-mono outline-none"
                  style={{ borderColor: "#fca5a5", background: "#fff5f5", color: "var(--foreground)" }}
                />
                {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setDeleteStage("closed"); setDeleteInput(""); setDeleteError(null) }}
                    className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-gray-50"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE"}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #f87171, #ef4444)", boxShadow: deleteInput === "DELETE" ? "0 2px 8px rgba(239,68,68,0.30)" : "none" }}
                  >
                    Permanently delete my account
                  </button>
                </div>
              </div>
            )}

            {/* Stage 3 — deleting */}
            {deleteStage === "deleting" && (
              <div className="flex items-center justify-center gap-3 px-5 py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                <p className="text-sm font-medium" style={{ color: "#dc2626" }}>Deleting your account…</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Pulse animation for "Now" dot */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 3px rgba(76,182,72,0.15); }
          50%        { box-shadow: 0 0 0 6px rgba(76,182,72,0.08); }
        }
      `}</style>
    </div>
  )
}
