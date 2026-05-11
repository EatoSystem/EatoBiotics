"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, ChevronDown, ChevronUp, Loader2, TrendingUp, Plus, X, ArrowRight, RefreshCw } from "lucide-react"

/* ────────────────────────────────────────────────────────────────────────
   Props
   ──────────────────────────────────────────────────────────────────────── */

export interface LiveDashboardProps {
  name: string
  score: number
  previousScore: number
  profileType: string
  biotics: { prebiotic: number; probiotic: number; postbiotic: number }
  nextBillingDate: string | null
  referralCode: string
  monthlyPlan: string
  weeklyCheckin: string | null
  memberStartedAt: string | null
}

/* ────────────────────────────────────────────────────────────────────────
   Static mock content
   ──────────────────────────────────────────────────────────────────────── */

const DAILY_TRIO = {
  day: 7,
  totalDays: 30,
  streak: 7,
  predictedBoost: 3,

  prebiotic: {
    food: "Garlic",
    emoji: "🧅",
    instruction: "Add 1–2 cloves to your dinner tonight",
    anchor: "Crush into pasta, stir-fry, or roasted veg",
    color: "var(--icon-lime)",
    science: "Garlic contains inulin — a prebiotic fibre your Lactobacillus bacteria use as fuel.",
  },
  probiotic: {
    food: "Kimchi",
    emoji: "🫙",
    instruction: "2 tablespoons with your main meal",
    anchor: "Keep it in the fridge door — always visible",
    color: "var(--icon-teal)",
    science: "Kimchi delivers live Lactobacillus cultures that colonise your gut and crowd out harmful bacteria.",
  },
  postbiotic: {
    outcome: "Butyrate Production",
    emoji: "⚡",
    shortDesc: "Gut lining repair + energy lift",
    fullDesc: "Butyrate is a short-chain fatty acid produced when your gut bacteria ferment prebiotic fibre. It strengthens your gut barrier, reduces inflammation, and fuels your colon cells — you feel the difference as clearer thinking and steadier energy.",
    timing: "Effects build over 24–48 hours",
    color: "var(--icon-yellow)",
  },
  connectorStory: "When you Feed your bacteria with garlic, then Seed with kimchi, they produce butyrate — repairing your gut lining and lifting your energy.",
  scienceExpanded: "Your gut is a fermentation system. Prebiotic fibres are the raw ingredient; probiotic bacteria are the workers; postbiotics are the finished product. Each trio you complete runs one full cycle of your microbiome.",
}

const WEEK_DATA = [
  { short: "Mon", label: "Monday",    date: "5 May",  score: 68, meal: "Overnight oats, banana, chia seeds, almond milk" },
  { short: "Tue", label: "Tuesday",   date: "6 May",  score: 72, meal: "Lentil soup with sourdough, side salad, olive oil" },
  { short: "Wed", label: "Wednesday", date: "7 May",  score: 65, meal: "Chicken stir-fry, garlic, broccoli, brown rice" },
  { short: "Thu", label: "Thursday",  date: "8 May",  score: 71, meal: "Greek yoghurt, mixed berries, walnuts" },
  { short: "Fri", label: "Friday",    date: "9 May",  score: 74, meal: "Roasted veg with quinoa, tahini dressing" },
  { short: "Sat", label: "Saturday",  date: "10 May", score: null, meal: null }, // today
  { short: "Sun", label: "Sunday",    date: "11 May", score: null, meal: null }, // future
]
const TODAY_IDX = 5

const ALL_PLANTS = [
  "Oats", "Garlic", "Onion", "Banana", "Berries", "Lentils",
  "Broccoli", "Carrot", "Spinach", "Tomato", "Chickpeas", "Brown rice",
  "Almonds", "Walnuts", "Chia seeds", "Flaxseed", "Quinoa", "Sweet potato",
  "Leek", "Asparagus", "Kale", "Courgette", "Beetroot", "Apple",
  "Pear", "Avocado", "Peppers", "Cucumber", "Celery", "Parsnip",
]
const INITIAL_PLANTS = ALL_PLANTS.slice(0, 18)

const MOCK_ANALYSIS_RESULT = {
  score: 74,
  prebiotic: 36,
  probiotic: 15,
  postbiotic: 7,
  insights: [
    "Strong prebiotic base — oats and banana provide sustained fibre for your gut bacteria.",
    "Adding a fermented food (kefir, yoghurt, kimchi) to this meal would push the score above 80.",
  ],
}

const RECENT_ANALYSES = [
  { meal: "Overnight oats, banana, chia",   score: 68, time: "Yesterday 8am"    },
  { meal: "Lentil soup, sourdough, salad",  score: 72, time: "Thursday 1pm"     },
  { meal: "Chicken stir-fry, brown rice",   score: 65, time: "Wednesday 7pm"    },
]

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────── */

function scoreColor(s: number) {
  if (s >= 70) return "var(--icon-green)"
  if (s >= 55) return "var(--icon-yellow)"
  return "var(--icon-orange)"
}

function pillarPercent(value: number, max: number) {
  return Math.round((value / max) * 100)
}

/* ────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────── */

export function LiveDashboard({
  name,
  score,
  previousScore,
  profileType,
  biotics,
  nextBillingDate,
  referralCode,
  monthlyPlan,
  weeklyCheckin,
  memberStartedAt,
}: LiveDashboardProps) {
  // Interactive state
  const [prebioticDone, setPrebioticDone]   = useState(false)
  const [probioticDone, setProbioticDone]   = useState(false)
  const [showScience, setShowScience]       = useState(false)
  const [healed, setHealed]                 = useState(false)
  const [healCelebrated, setHealCelebrated] = useState(false)
  const [mealInput, setMealInput]           = useState("")
  const [mealStatus, setMealStatus]         = useState<"idle" | "loading" | "result">("idle")
  const [planExpanded, setPlanExpanded]     = useState(false)
  const [checkinExpanded, setCheckinExpanded] = useState(false)
  const [activePlants, setActivePlants]     = useState<string[]>(INITIAL_PLANTS)
  const [selectedDay, setSelectedDay]       = useState<number | null>(null)
  const [ringProgress, setRingProgress]     = useState(0)
  const [barsReady, setBarsReady]           = useState(false)

  // Animate score ring + bars on mount
  useEffect(() => {
    const t1 = setTimeout(() => setRingProgress(score), 200)
    const t2 = setTimeout(() => setBarsReady(true), 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [score])

  // Auto-unlock postbiotic when both Feed + Seed are done
  useEffect(() => {
    if (prebioticDone && probioticDone && !healed) {
      setHealed(true)
      setHealCelebrated(true)
      const t = setTimeout(() => setHealCelebrated(false), 1400)
      return () => clearTimeout(t)
    }
  }, [prebioticDone, probioticDone, healed])

  async function handleAnalyse() {
    if (!mealInput.trim() || mealStatus === "loading") return
    setMealStatus("loading")
    await new Promise(r => setTimeout(r, 1600))
    setMealStatus("result")
  }

  function togglePlant(plant: string) {
    setActivePlants(prev =>
      prev.includes(plant) ? prev.filter(p => p !== plant) : [...prev, plant]
    )
  }

  function resetAnalysis() {
    setMealInput("")
    setMealStatus("idle")
  }

  const firstName   = name.split(" ")[0]
  const scoreDelta  = score - previousScore
  const ringR       = 80
  const circumference = 2 * Math.PI * ringR

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dateStr  = new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })

  const monthName = new Date().toLocaleDateString("en-IE", { month: "long", year: "numeric" }).toUpperCase()
  const planFirstPara = monthlyPlan.split("\n\n")[0]

  const PILLARS = [
    {
      label: "Feed",  sub: "Prebiotics",  value: biotics.prebiotic,  max: 45,
      color: "var(--icon-lime)",
      insight: "Oats & garlic are feeding your gut bacteria well",
      action:  "Add leeks or asparagus to push further",
      delta: 3,
    },
    {
      label: "Seed",  sub: "Probiotics",  value: biotics.probiotic,  max: 25,
      color: "var(--icon-teal)",
      insight: "Low — fermented foods are the fastest lever here",
      action:  "Daily kimchi or kefir will shift this quickly",
      delta: -2,
    },
    {
      label: "Heal",  sub: "Postbiotics", value: biotics.postbiotic, max: 15,
      color: "var(--icon-yellow)",
      insight: "Building steadily — consistency compounds over time",
      action:  "Keep your Feed + Seed streak going to lift this",
      delta: 1,
    },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STICKY DAY BAR                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div
        className="sticky top-[57px] z-30 border-b px-4 py-2"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)", color: "var(--icon-green)" }}
            >
              Day {DAILY_TRIO.day} · 30-Day Plan
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">{dateStr}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm" title={`${healed ? DAILY_TRIO.streak + 1 : DAILY_TRIO.streak}-day streak`}>
              🔥 <span className="text-xs font-bold text-foreground">{healed ? DAILY_TRIO.streak + 1 : DAILY_TRIO.streak}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-foreground">{score}</span>
              {scoreDelta > 0 && (
                <span className="text-xs font-semibold" style={{ color: "var(--icon-green)" }}>↑ +{scoreDelta}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SCORE HERO                                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--foreground)" }}>
        <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto_1fr] md:items-center">

            {/* Left — greeting */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                EatoBiotics · Member
              </p>
              <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
                {greeting},<br />{firstName}.
              </h1>
              <div
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--icon-lime)" }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{profileType}</span>
              </div>
              {scoreDelta !== 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: scoreDelta > 0 ? "var(--icon-lime)" : "var(--icon-orange)" }} />
                  <span className="text-sm" style={{ color: scoreDelta > 0 ? "var(--icon-lime)" : "var(--icon-orange)" }}>
                    {scoreDelta > 0 ? "+" : ""}{scoreDelta} pts since your last assessment
                  </span>
                </div>
              )}
              {memberStartedAt && (
                <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Member since {new Date(memberStartedAt).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>

            {/* Centre — score ring */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
                  <defs>
                    <linearGradient id="heroRingGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%"   stopColor="var(--icon-lime)" />
                      <stop offset="50%"  stopColor="var(--icon-green)" />
                      <stop offset="100%" stopColor="var(--icon-teal)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {/* Track */}
                  <circle cx="100" cy="100" r={ringR} stroke="rgba(255,255,255,0.07)" strokeWidth="11" fill="none" />
                  {/* Progress */}
                  <circle
                    cx="100" cy="100" r={ringR}
                    stroke="url(#heroRingGrad)"
                    strokeWidth="11"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={circumference * (1 - ringProgress / 100)}
                    transform="rotate(-90 100 100)"
                    style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)" }}
                    filter="url(#glow)"
                  />
                  {/* Score */}
                  <text x="100" y="95" textAnchor="middle" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill="white">{score}</text>
                  <text x="100" y="120" textAnchor="middle" fontFamily="system-ui" fontSize="13" fill="rgba(255,255,255,0.35)">/100 Biotics Score</text>
                </svg>
              </div>
            </div>

            {/* Right — pillar bars */}
            <div className="space-y-5">
              {PILLARS.map((p) => {
                const pct = pillarPercent(p.value, p.max)
                return (
                  <div key={p.label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {p.label} · {p.sub}
                      </span>
                      <span className="font-mono text-sm font-bold" style={{ color: p.color }}>
                        {pct}<span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>%</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: barsReady ? `${pct}%` : "0%",
                          background: p.color,
                          transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.insight}</p>
                  </div>
                )
              })}
              <p className="pt-1 text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
                % of each pillar&apos;s daily potential · Your 62/100 score reflects all 5 assessment dimensions
              </p>
            </div>

          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DAILY BIOTICS TRIO                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-10" style={{ background: "color-mix(in srgb, var(--icon-green) 3%, var(--background))" }}>
        <div className="mx-auto max-w-[1000px]">

          {/* Section header + meta row */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Daily Habit</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">Your Daily Biotics Trio</h2>
              <p className="mt-1 text-sm text-muted-foreground">Three micro-actions. One complete gut cycle. Every day.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Streak pill */}
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background: "color-mix(in srgb, var(--icon-orange) 12%, transparent)" }}
              >
                <span className="text-base leading-none">🔥</span>
                <span className="text-sm font-bold" style={{ color: "var(--icon-orange)" }}>
                  {healed ? DAILY_TRIO.streak + 1 : DAILY_TRIO.streak}
                </span>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
              {/* Day pill */}
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)", color: "var(--icon-green)" }}
              >
                Day {DAILY_TRIO.day} of {DAILY_TRIO.totalDays}
              </span>
              {/* Score boost */}
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-500"
                style={healed
                  ? { background: "color-mix(in srgb, var(--icon-green) 15%, transparent)", color: "var(--icon-green)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }
                }
              >
                {healed ? `+${DAILY_TRIO.predictedBoost} pts ✓` : `+${DAILY_TRIO.predictedBoost} pts predicted`}
              </span>
            </div>
          </div>

          {/* Three pillar cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* FEED — Prebiotic */}
            <div
              className="relative overflow-hidden rounded-3xl border bg-card transition-all duration-500"
              style={{
                borderTopWidth: "3px",
                borderTopColor: prebioticDone ? DAILY_TRIO.prebiotic.color : "var(--border)",
                boxShadow: prebioticDone
                  ? `0 0 0 1px color-mix(in srgb, ${DAILY_TRIO.prebiotic.color} 20%, transparent)`
                  : undefined,
              }}
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DAILY_TRIO.prebiotic.color }}>
                    Feed · Prebiotic
                  </p>
                  <button
                    onClick={() => setPrebioticDone(d => !d)}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 active:scale-90"
                    style={prebioticDone
                      ? { background: DAILY_TRIO.prebiotic.color }
                      : { border: "2px solid var(--border)" }
                    }
                  >
                    {prebioticDone && <Check size={13} color="white" strokeWidth={3} />}
                  </button>
                </div>
                <div className="mb-1 text-4xl">{DAILY_TRIO.prebiotic.emoji}</div>
                <h3 className="font-serif text-xl font-semibold text-foreground">{DAILY_TRIO.prebiotic.food}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{DAILY_TRIO.prebiotic.instruction}</p>
                <p className="mt-2 text-xs italic opacity-60 text-muted-foreground">{DAILY_TRIO.prebiotic.anchor}</p>
              </div>
            </div>

            {/* SEED — Probiotic */}
            <div
              className="relative overflow-hidden rounded-3xl border bg-card transition-all duration-500"
              style={{
                borderTopWidth: "3px",
                borderTopColor: probioticDone ? DAILY_TRIO.probiotic.color : "var(--border)",
                boxShadow: probioticDone
                  ? `0 0 0 1px color-mix(in srgb, ${DAILY_TRIO.probiotic.color} 20%, transparent)`
                  : undefined,
              }}
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DAILY_TRIO.probiotic.color }}>
                    Seed · Probiotic
                  </p>
                  <button
                    onClick={() => setProbioticDone(d => !d)}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 active:scale-90"
                    style={probioticDone
                      ? { background: DAILY_TRIO.probiotic.color }
                      : { border: "2px solid var(--border)" }
                    }
                  >
                    {probioticDone && <Check size={13} color="white" strokeWidth={3} />}
                  </button>
                </div>
                <div className="mb-1 text-4xl">{DAILY_TRIO.probiotic.emoji}</div>
                <h3 className="font-serif text-xl font-semibold text-foreground">{DAILY_TRIO.probiotic.food}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{DAILY_TRIO.probiotic.instruction}</p>
                <p className="mt-2 text-xs italic opacity-60 text-muted-foreground">{DAILY_TRIO.probiotic.anchor}</p>
              </div>
            </div>

            {/* HEAL — Postbiotic (locked until both done) */}
            <div
              className="relative overflow-hidden rounded-3xl border bg-card transition-all duration-700"
              style={{
                borderTopWidth: "3px",
                borderTopColor: healed ? DAILY_TRIO.postbiotic.color : "var(--border)",
                opacity: healed ? 1 : 0.5,
                boxShadow: healCelebrated
                  ? `0 0 0 3px color-mix(in srgb, ${DAILY_TRIO.postbiotic.color} 40%, transparent), 0 0 32px color-mix(in srgb, ${DAILY_TRIO.postbiotic.color} 25%, transparent)`
                  : healed
                  ? `0 0 0 1px color-mix(in srgb, ${DAILY_TRIO.postbiotic.color} 20%, transparent)`
                  : undefined,
              }}
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DAILY_TRIO.postbiotic.color }}>
                    Heal · Postbiotic
                  </p>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500"
                    style={healed
                      ? { background: DAILY_TRIO.postbiotic.color }
                      : { border: "2px solid var(--border)", background: "var(--muted)" }
                    }
                  >
                    {healed
                      ? <Check size={13} color="white" strokeWidth={3} />
                      : <span style={{ fontSize: "11px" }}>🔒</span>
                    }
                  </div>
                </div>

                {healed ? (
                  <>
                    <div className="mb-1 text-4xl">{DAILY_TRIO.postbiotic.emoji}</div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{DAILY_TRIO.postbiotic.outcome}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{DAILY_TRIO.postbiotic.shortDesc}</p>
                    <p className="mt-2 text-xs italic opacity-60 text-muted-foreground">{DAILY_TRIO.postbiotic.timing}</p>
                  </>
                ) : (
                  <>
                    <div className="mb-1 text-4xl opacity-25">⚡</div>
                    <h3 className="font-serif text-xl font-semibold text-muted-foreground">Unlock Outcome</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">Complete Feed + Seed to reveal today&apos;s postbiotic outcome.</p>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Connector story + science panel */}
          <div
            className="mt-5 overflow-hidden rounded-2xl border bg-card transition-all duration-500"
            style={healed ? { borderColor: `color-mix(in srgb, ${DAILY_TRIO.postbiotic.color} 30%, var(--border))` } : {}}
          >
            <div className="px-5 py-4">
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{DAILY_TRIO.connectorStory}&rdquo;
              </p>
              <button
                onClick={() => setShowScience(s => !s)}
                className="mt-2 flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: "var(--icon-green)" }}
              >
                {showScience ? <><ChevronUp size={12} /> Hide science</> : <><ChevronDown size={12} /> Why this works</>}
              </button>
              {showScience && (
                <div
                  className="mt-3 rounded-xl px-4 py-3 text-xs leading-relaxed"
                  style={{ background: "color-mix(in srgb, var(--icon-green) 6%, var(--muted))" }}
                >
                  <p className="mb-2 font-semibold text-foreground">The science</p>
                  <p className="mb-2 text-muted-foreground">{DAILY_TRIO.prebiotic.science}</p>
                  <p className="mb-2 text-muted-foreground">{DAILY_TRIO.probiotic.science}</p>
                  <p className="text-muted-foreground">{DAILY_TRIO.postbiotic.fullDesc}</p>
                </div>
              )}
            </div>
          </div>

          {/* Habit anchor cues */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">📍 With dinner tonight</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">⏱ Takes under 30 seconds to add</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">📚 New trio revealed tomorrow</span>
          </div>

          {/* 30-day progress dots — enhanced */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">30-Day Progress</span>
              <span className="text-xs text-muted-foreground">{DAILY_TRIO.day} of {DAILY_TRIO.totalDays} days</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-5">
              {Array.from({ length: DAILY_TRIO.totalDays }).map((_, i) => {
                const isMilestone = (i + 1) % 7 === 0
                const isPast      = i < DAILY_TRIO.day - 1
                const isToday     = i === DAILY_TRIO.day - 1
                return (
                  <div key={i} className="relative flex flex-col items-center">
                    <div
                      className="h-2.5 w-2.5 rounded-full transition-all duration-300"
                      style={{
                        background: isPast
                          ? "var(--icon-green)"
                          : isToday
                          ? healed ? "var(--icon-green)" : "var(--icon-teal)"
                          : "var(--border)",
                        transform: isToday && !healed ? "scale(1.4)" : "scale(1)",
                      }}
                    />
                    {isMilestone && (
                      <span
                        className="absolute top-4 text-[9px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {i + 1 === 30 ? "🏆" : "🏅"}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-1.5 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                🔥 {healed ? DAILY_TRIO.streak + 1 : DAILY_TRIO.streak}-day streak
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {healed
                  ? "Complete trio logged ✓ — great work"
                  : `${DAILY_TRIO.totalDays - DAILY_TRIO.day} days remaining`
                }
              </span>
            </div>
          </div>

        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BIOTICS BREAKDOWN — dark section with animated mini-rings    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--foreground)" }}>
        <div className="mx-auto max-w-[1000px] px-6 py-16">

          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>Your Three Pillars</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-white">Biotics Activity Profile</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              These scores track your daily food choices across all three biotic pillars. Your 62/100 overall score incorporates all five assessment dimensions — diversity, feeding patterns, new additions, consistency and wellbeing.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {PILLARS.map((p, i) => {
              const pct = pillarPercent(p.value, p.max)
              const ringR = 32
              const ringC = 2 * Math.PI * ringR
              return (
                <div
                  key={p.label}
                  className="rounded-3xl p-6"
                  style={{
                    background: `color-mix(in srgb, ${p.color} 5%, rgba(255,255,255,0.03))`,
                    border: `1px solid color-mix(in srgb, ${p.color} 20%, rgba(255,255,255,0.06))`,
                  }}
                >
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-widest" style={{ color: p.color }}>
                    {p.label} · {p.sub}
                  </p>

                  {/* Mini animated ring + score */}
                  <div className="mb-5 flex items-center gap-4">
                    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0 overflow-visible">
                      <defs>
                        <linearGradient id={`miniRingGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={p.color} stopOpacity="0.6" />
                          <stop offset="100%" stopColor={p.color} />
                        </linearGradient>
                        <filter id={`miniGlow${i}`}>
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>
                      {/* Track */}
                      <circle cx="40" cy="40" r={ringR} stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
                      {/* Progress */}
                      <circle
                        cx="40" cy="40" r={ringR}
                        stroke={`url(#miniRingGrad${i})`}
                        strokeWidth="7"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${ringC}`}
                        strokeDashoffset={barsReady ? ringC * (1 - pct / 100) : ringC}
                        transform="rotate(-90 40 40)"
                        style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }}
                        filter={`url(#miniGlow${i})`}
                      />
                      <text x="40" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="white" fontFamily="Georgia,serif">{pct}%</text>
                      <text x="40" y="50" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="system-ui">potential</text>
                    </svg>
                    <div>
                      <p className="font-serif text-3xl font-bold text-white">{p.value}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>of {p.max} pts</p>
                      <span
                        className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: p.delta > 0
                            ? "color-mix(in srgb, var(--icon-green) 15%, transparent)"
                            : "color-mix(in srgb, var(--icon-orange) 15%, transparent)",
                          color: p.delta > 0 ? "var(--icon-green)" : "var(--icon-orange)",
                        }}
                      >
                        {p.delta > 0 ? `+${p.delta}` : p.delta} pts this week
                      </span>
                    </div>
                  </div>

                  <p className="mb-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {p.insight}
                  </p>

                  <div
                    className="rounded-xl px-3 py-2.5 text-xs font-medium leading-relaxed"
                    style={{
                      background: `color-mix(in srgb, ${p.color} 10%, transparent)`,
                      color: p.color,
                    }}
                  >
                    → {p.action}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Activity scores update as you log meals · Biotics profile is separate from your 62/100 assessment score
          </p>
        </div>
        <div className="section-divider" />
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MEAL ANALYSIS                                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-[860px]">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Nutrition Tracking</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">Analyse a Meal</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Describe what you ate — get an instant Biotics Score and pillar breakdown.</p>
          </div>

          <div
            className="overflow-hidden rounded-3xl border bg-card"
            style={{
              borderColor: mealStatus === "idle" ? "var(--border)" : "color-mix(in srgb, var(--icon-green) 30%, var(--border))",
              boxShadow: mealStatus !== "idle" ? "0 0 0 3px color-mix(in srgb, var(--icon-green) 10%, transparent)" : undefined,
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            {mealStatus !== "result" ? (
              <div className="p-6">
                <textarea
                  value={mealInput}
                  onChange={e => setMealInput(e.target.value)}
                  placeholder="e.g. Overnight oats with banana, kefir, mixed berries and a handful of walnuts…"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[var(--icon-green)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--icon-green)_15%,transparent)]"
                  disabled={mealStatus === "loading"}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Be descriptive for a more accurate score.</p>
                  <button
                    onClick={handleAnalyse}
                    disabled={!mealInput.trim() || mealStatus === "loading"}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 brand-gradient"
                  >
                    {mealStatus === "loading" ? (
                      <><Loader2 size={14} className="animate-spin" /> Analysing…</>
                    ) : (
                      <>Analyse <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Result card */
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Analysis Result</p>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{mealInput}</p>
                  </div>
                  <button onClick={resetAnalysis} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Score badge */}
                <div className="my-5 flex items-center gap-5">
                  <div
                    className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 10%, transparent)" }}
                  >
                    <span className="font-serif text-3xl font-bold" style={{ color: "var(--icon-green)" }}>{MOCK_ANALYSIS_RESULT.score}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { label: "Prebiotics", value: MOCK_ANALYSIS_RESULT.prebiotic, max: 45, color: "var(--icon-lime)" },
                      { label: "Probiotics", value: MOCK_ANALYSIS_RESULT.probiotic, max: 25, color: "var(--icon-teal)" },
                      { label: "Postbiotics", value: MOCK_ANALYSIS_RESULT.postbiotic, max: 15, color: "var(--icon-yellow)" },
                    ].map(b => (
                      <div key={b.label} className="flex items-center gap-2">
                        <span className="w-20 text-[11px] text-muted-foreground">{b.label}</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-muted" style={{ height: "6px" }}>
                          <div className="h-full rounded-full" style={{ width: `${(b.value / b.max) * 100}%`, background: b.color }} />
                        </div>
                        <span className="w-8 text-right text-[11px] font-semibold text-foreground">{b.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2">
                  {MOCK_ANALYSIS_RESULT.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5">
                      <span className="mt-0.5 shrink-0 text-xs" style={{ color: "var(--icon-green)" }}>●</span>
                      <p className="text-xs leading-relaxed text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={resetAnalysis}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw size={12} /> Analyse another meal
                </button>
              </div>
            )}
          </div>

          {/* Recent analyses */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Recent</p>
            <div className="space-y-2">
              {RECENT_ANALYSES.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-serif font-bold"
                    style={{
                      background: `color-mix(in srgb, ${scoreColor(a.score)} 12%, transparent)`,
                      color: scoreColor(a.score),
                      fontSize: "13px",
                    }}
                  >
                    {a.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{a.meal}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* THIS WEEK                                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-[860px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Accountability</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">This Week</h2>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "color-mix(in srgb, var(--icon-green) 10%, transparent)", color: "var(--icon-green)" }}
            >
              5 / 7 days logged
            </span>
          </div>

          {/* Day pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {WEEK_DATA.map((d, i) => {
              const isPast   = i < TODAY_IDX
              const isToday  = i === TODAY_IDX
              const isFuture = i > TODAY_IDX
              return (
                <button
                  key={i}
                  onClick={() => isPast ? setSelectedDay(selectedDay === i ? null : i) : undefined}
                  className="flex shrink-0 flex-col items-center gap-2 rounded-2xl px-4 py-3 transition-all"
                  style={{
                    background: isToday
                      ? "color-mix(in srgb, var(--icon-green) 12%, transparent)"
                      : selectedDay === i
                      ? "var(--muted)"
                      : "var(--card)",
                    border: isToday
                      ? "1.5px solid var(--icon-green)"
                      : "1.5px solid var(--border)",
                    cursor: isPast ? "pointer" : "default",
                  }}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">{d.short}</span>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={
                      isToday
                        ? { background: "var(--icon-green)" }
                        : isPast && d.score
                        ? { background: `color-mix(in srgb, ${scoreColor(d.score)} 15%, transparent)` }
                        : { border: "1.5px dashed var(--border)" }
                    }
                  >
                    {isToday ? (
                      <span className="text-[11px] font-bold text-white">●</span>
                    ) : isPast && d.score ? (
                      <span className="font-mono text-[11px] font-bold" style={{ color: scoreColor(d.score) }}>{d.score}</span>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.date.split(" ")[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay !== null && WEEK_DATA[selectedDay].meal && (
            <div className="mt-4 rounded-2xl border bg-card p-4">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{WEEK_DATA[selectedDay].label} · {WEEK_DATA[selectedDay].date}</p>
              <p className="text-sm text-foreground">{WEEK_DATA[selectedDay].meal}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{
                    background: `color-mix(in srgb, ${scoreColor(WEEK_DATA[selectedDay].score!)} 12%, transparent)`,
                    color: scoreColor(WEEK_DATA[selectedDay].score!),
                  }}
                >
                  Score: {WEEK_DATA[selectedDay].score}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MONTHLY PLAN                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-[860px]">
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
              {monthName}
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Your Monthly Focus</h2>

          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
            }}
          >
            {/* Green left accent bar */}
            <div
              className="absolute inset-y-0 left-0 w-1 rounded-l-3xl"
              style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
            />

            <div className="p-8 pl-10">
              {/* Pull quote */}
              <blockquote
                className="mb-6 font-serif text-xl font-semibold leading-snug text-foreground sm:text-2xl"
                style={{ borderLeft: "none" }}
              >
                &ldquo;This month: fix your fermented food gap.&rdquo;
              </blockquote>

              <p className="text-base leading-relaxed text-muted-foreground">
                {planFirstPara}
              </p>

              {planExpanded && (
                <div className="mt-5 space-y-4 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
                  {monthlyPlan.split("\n\n").slice(1).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}

              <button
                onClick={() => setPlanExpanded(e => !e)}
                className="mt-5 flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "var(--icon-green)" }}
              >
                {planExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read your full plan</>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly check-in (if available) */}
      {weeklyCheckin && (
        <section className="px-6 pb-14">
          <div className="mx-auto max-w-[860px]">
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="absolute inset-y-0 left-0 w-1 rounded-l-3xl"
                style={{ background: "linear-gradient(to bottom, var(--icon-teal), var(--icon-green))" }}
              />
              <div className="p-8 pl-10">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
                  This Week · AI Check-in
                </p>
                <p className="mb-4 font-serif text-lg font-semibold text-foreground">What your data said this week</p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {weeklyCheckin.split("\n\n")[0]}
                </p>
                {checkinExpanded && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                    {weeklyCheckin.split("\n\n").slice(1).map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                )}
                <button
                  onClick={() => setCheckinExpanded(e => !e)}
                  className="mt-4 flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: "var(--icon-teal)" }}
                >
                  {checkinExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read your full check-in</>}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SCORE HISTORY                                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        className="px-6 py-14"
        style={{ background: "color-mix(in srgb, var(--icon-teal) 3%, var(--background))" }}
      >
        <div className="mx-auto max-w-[860px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Your Progress</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">Score History</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "color-mix(in srgb, var(--icon-green) 10%, transparent)" }}>
              <TrendingUp size={13} style={{ color: "var(--icon-green)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--icon-green)" }}>+{scoreDelta} pts</span>
              <span className="text-xs text-muted-foreground">in 6 weeks</span>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-3xl border bg-card p-6"
            style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.06)" }}
          >
            <svg viewBox="0 0 440 160" className="w-full" style={{ height: "160px" }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--icon-lime)" />
                  <stop offset="100%" stopColor="var(--icon-green)" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--icon-green)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--icon-green)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Subtle grid */}
              {[25, 50, 75, 100].map(y => (
                <line key={y} x1="50" y1={130 - y * 1.2} x2="420" y2={130 - y * 1.2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}
              {/* Y axis labels */}
              {[25, 50, 75, 100].map(y => (
                <text key={y} x="40" y={134 - y * 1.2} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{y}</text>
              ))}

              {/* Gradient area fill */}
              <path
                d={`M 100 ${130 - previousScore * 1.2} L 360 ${130 - score * 1.2} L 360 130 L 100 130 Z`}
                fill="url(#areaGrad)"
              />

              {/* Line */}
              <line
                x1="100" y1={130 - previousScore * 1.2}
                x2="360" y2={130 - score * 1.2}
                stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round"
              />

              {/* Glow points */}
              <circle cx="100" cy={130 - previousScore * 1.2} r="7" fill="var(--icon-lime)" opacity="0.2" />
              <circle cx="100" cy={130 - previousScore * 1.2} r="4.5" fill="var(--icon-lime)" />
              <circle cx="360" cy={130 - score * 1.2}         r="8" fill="var(--icon-green)" opacity="0.2" />
              <circle cx="360" cy={130 - score * 1.2}         r="5" fill="var(--icon-green)" />

              {/* Score labels */}
              <text x="100" y={130 - previousScore * 1.2 - 13} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--icon-lime)" fontFamily="Georgia,serif">{previousScore}</text>
              <text x="360" y={130 - score * 1.2 - 13}         textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--icon-green)" fontFamily="Georgia,serif">{score}</text>

              {/* Date labels */}
              <text x="100" y="150" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">6 weeks ago</text>
              <text x="360" y="150" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">Today</text>

              {/* Profile type label under today dot */}
              <text x="360" y={130 - score * 1.2 + 20} textAnchor="middle" fontSize="8" fill="var(--icon-green)" opacity="0.6">Emerging Balance</text>
            </svg>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Trending upward — keep the consistency going</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Your next assessment will capture the full picture of your progress.</p>
              </div>
              <Link
                href="/assessment"
                className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Retake assessment →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MY PLATE                                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14" style={{ background: "color-mix(in srgb, var(--icon-lime) 3%, var(--background))" }}>
        <div className="mx-auto max-w-[860px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Weekly Target</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">My Plant Plate</h2>
              <p className="mt-1 text-sm text-muted-foreground">30 diverse plants per week feeds maximum gut diversity.</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-5xl font-bold brand-gradient-text">{activePlants.length}</p>
              <p className="text-xs text-muted-foreground">of 30 this week</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-muted" style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)" }}>
            <div
              className="h-full rounded-full brand-gradient"
              style={{ width: `${(activePlants.length / 30) * 100}%`, transition: "width 0.4s ease" }}
            />
          </div>
          <div className="mb-7 flex items-center justify-between text-xs text-muted-foreground">
            <span>{activePlants.length} plants logged</span>
            <span>{30 - activePlants.length} to go</span>
          </div>

          {/* Plant chips */}
          <div className="flex flex-wrap gap-2">
            {ALL_PLANTS.slice(0, 30).map((plant) => {
              const active = activePlants.includes(plant)
              return (
                <button
                  key={plant}
                  onClick={() => togglePlant(plant)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
                  style={active
                    ? {
                        background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                        borderColor: "var(--icon-green)",
                        color: "var(--icon-green)",
                      }
                    : {
                        background: "var(--card)",
                        borderColor: "var(--border)",
                        color: "var(--muted-foreground)",
                      }
                  }
                >
                  {active ? <Check size={10} /> : <Plus size={10} />}
                  {plant}
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Tap to add or remove. Aim for 30 different plants each week for maximum gut diversity.
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* YOUR PERSONAL REPORT                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14" style={{ background: "color-mix(in srgb, var(--icon-lime) 3%, var(--background))" }}>
        <div className="mx-auto max-w-[860px]">
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Personal Report</p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Your Full Food System Picture</h2>

          {/* Gradient border wrapper */}
          <div
            className="rounded-3xl p-[2px]"
            style={{
              background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green) 40%, var(--icon-teal) 70%, var(--icon-green))",
            }}
          >
            <div
              className="overflow-hidden rounded-[22px]"
              style={{ background: "var(--foreground)" }}
            >
              <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>
                    18-page personal report
                  </p>
                  <h3 className="mt-3 font-serif text-2xl font-bold leading-snug text-white">
                    The full picture of your gut food system
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Your 30-day personalised plan, top 10 priority foods, pillar deep-dive, food pairings, meal timing and your complete score breakdown — all in one place.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href="/report-you"
                      className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 brand-gradient"
                    >
                      View your full report <ArrowRight size={14} />
                    </Link>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
                    >
                      {profileType} · {score}/100
                    </span>
                  </div>
                </div>

                {/* Abstract report visual */}
                <div className="hidden md:block">
                  <svg width="100" height="130" viewBox="0 0 100 130">
                    <rect x="10" y="0"  width="80" height="105" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <rect x="18" y="14" width="50" height="4"   rx="2" fill="rgba(255,255,255,0.15)" />
                    <rect x="18" y="24" width="35" height="3"   rx="1.5" fill="rgba(255,255,255,0.08)" />
                    <rect x="18" y="38" width="64" height="2.5" rx="1.25" fill="rgba(255,255,255,0.06)" />
                    <rect x="18" y="45" width="57" height="2.5" rx="1.25" fill="rgba(255,255,255,0.06)" />
                    <rect x="18" y="52" width="60" height="2.5" rx="1.25" fill="rgba(255,255,255,0.06)" />
                    <rect x="18" y="63" width="20" height="20"  rx="4"   fill="color-mix(in srgb, var(--icon-lime) 20%, transparent)" />
                    <rect x="43" y="63" width="20" height="20"  rx="4"   fill="color-mix(in srgb, var(--icon-teal) 20%, transparent)" />
                    <rect x="18" y="88" width="55" height="2.5" rx="1.25" fill="rgba(255,255,255,0.06)" />
                    <rect x="18" y="95" width="40" height="2.5" rx="1.25" fill="rgba(255,255,255,0.06)" />
                    {/* Score badge */}
                    <circle cx="80" cy="20" r="16" fill="color-mix(in srgb, var(--icon-green) 25%, transparent)" />
                    <text x="80" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="Georgia,serif">{score}</text>
                    <text x="80" y="28" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">/100</text>
                    {/* Page shadow */}
                    <rect x="16" y="108" width="80" height="105" rx="8" fill="rgba(255,255,255,0.02)" transform="rotate(-3 16 108)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MEMBERSHIP FOOTER                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-14" style={{ background: "color-mix(in srgb, var(--foreground) 3%, var(--background))" }}>
        <div className="mx-auto max-w-[860px]">
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Account</p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Membership</h2>

          <div className="grid gap-5 sm:grid-cols-2">

            {/* Membership card */}
            <div
              className="overflow-hidden rounded-3xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="h-1 w-full"
                style={{ background: "linear-gradient(to right, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
              />
              <div className="p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Membership</p>
                    <h3 className="mt-2 font-serif text-xl font-bold text-foreground">EatoBiotics Member</h3>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)", color: "var(--icon-green)" }}
                  >
                    Active
                  </span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-sm text-muted-foreground">€24.99/mo · cancel any time</p>
                  {nextBillingDate && (
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Next billing: {new Date(nextBillingDate).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <Link
                  href="/pricing"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Manage subscription <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Referral card */}
            <div
              className="overflow-hidden rounded-3xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="h-1 w-full"
                style={{ background: "linear-gradient(to right, var(--icon-lime), var(--icon-yellow))" }}
              />
              <div className="p-7">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>Refer a Friend</p>
                <h3 className="mt-2 font-serif text-xl font-bold text-foreground">Share EatoBiotics</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Share your code and help someone discover their gut health score.
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <code
                    className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-center text-sm font-bold tracking-widest text-foreground"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {referralCode}
                  </code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(`https://eatobiotics.com?ref=${referralCode}`)}
                    className="shrink-0 rounded-xl border bg-background px-4 py-2.5 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom padding */}
      <div className="h-16" />

    </div>
  )
}
