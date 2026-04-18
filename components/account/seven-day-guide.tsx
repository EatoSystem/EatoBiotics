"use client"

import { useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

/* ── Seven-Day Guided Experience ─────────────────────────────────────────
   Shown on the Overview tab for users whose account is ≤ 7 days old.
   Each day has a profile-specific action based on the weakest pillar.
   Dismissable — once dismissed it won't appear again.
────────────────────────────────────────────────────────────────────── */

const PILLAR_PROGRAMS: Record<string, {
  title: string
  days: Array<{ label: string; action: string; why: string }>
}> = {
  adding: {
    title: "Your 7-day Live Foods starter",
    days: [
      { label: "Day 1", action: "Add natural live yogurt to breakfast", why: "Yogurt contains Lactobacillus strains that survive to your colon and begin shifting your microbiome within 24 hours." },
      { label: "Day 2", action: "Try a tablespoon of sauerkraut with lunch", why: "Fermented vegetables carry a different bacterial profile to dairy — broadening your microbiome's input." },
      { label: "Day 3", action: "Swap a regular drink for water kefir or kombucha", why: "Liquid ferments colonise faster than solids — a great mid-day microbiome reset." },
      { label: "Day 4", action: "Add miso to a meal — soup, dressing, or glaze", why: "Miso adds glutamate (umami) AND live bacteria — one of the most concentrated probiotic sources available." },
      { label: "Day 5", action: "Combine a fermented food with a fibre-rich food", why: "Probiotics thrive when prebiotics are present. Yogurt + banana or kimchi + brown rice is a powerful gut pairing." },
      { label: "Day 6", action: "Try a new fermented food you haven't had yet", why: "Variety in probiotic sources = more bacterial diversity. Each ferment carries different species." },
      { label: "Day 7", action: "Reflect: how has your digestion or energy felt this week?", why: "One week of daily fermented foods is enough to notice the first shifts. This is just the beginning." },
    ],
  },
  diversity: {
    title: "Your 7-day Plant Diversity starter",
    days: [
      { label: "Day 1", action: "Count your plants today — aim for 5 different species", why: "Most people eat fewer than 10 plant species per week. Your gut bacteria need at least 20 to maintain resilience." },
      { label: "Day 2", action: "Add a new vegetable you haven't eaten this week", why: "Each new plant species feeds a slightly different microbial family — broadening your gut's defence network." },
      { label: "Day 3", action: "Include a legume in one meal (lentils, chickpeas, or beans)", why: "Legumes are the single most impactful plant group for microbiome diversity — resistant starch plus fibre." },
      { label: "Day 4", action: "Add seeds to one meal — flax, chia, pumpkin, or sunflower", why: "Seeds are tiny diversity powerhouses. One tablespoon adds a new plant species and valuable micronutrients." },
      { label: "Day 5", action: "Use a fresh herb in cooking — parsley, coriander, or basil", why: "Herbs count as plant species. They also carry polyphenols that act as prebiotic compounds." },
      { label: "Day 6", action: "Try a whole grain you don't normally eat (farro, buckwheat, barley)", why: "Different grains carry different fibre types — feeding different microbial populations." },
      { label: "Day 7", action: "Count your weekly plant total — aim for 15+", why: "The threshold for meaningful microbiome diversity benefit is roughly 20 species per week. Track your baseline." },
    ],
  },
  feeding: {
    title: "Your 7-day Feeding starter",
    days: [
      { label: "Day 1", action: "Anchor breakfast with a fibre-rich food — oats, wholegrain toast, or fruit", why: "Breakfast fibre primes your gut bacteria for the day. It sets the metabolic tone for digestion." },
      { label: "Day 2", action: "Add lentils, chickpeas, or beans to your main meal", why: "Legumes contain resistant starch that feeds Bifidobacterium — one of the most beneficial gut bacteria families." },
      { label: "Day 3", action: "Replace a refined carb with a whole-grain alternative", why: "Whole grains retain the bran and germ — the parts that feed your gut bacteria. Refined grains have neither." },
      { label: "Day 4", action: "Include a root vegetable (sweet potato, parsnip, or carrot)", why: "Root vegetables are rich in inulin and pectin — two prebiotic fibres that sustain different gut bacteria." },
      { label: "Day 5", action: "Add garlic or onion to a meal", why: "Garlic and onion are two of the highest-concentration prebiotic foods available — and they're already in most kitchens." },
      { label: "Day 6", action: "Eat a fibre-rich food before your largest meal of the day", why: "Pre-loading fibre slows glucose absorption and gives gut bacteria their food before you eat the rest." },
      { label: "Day 7", action: "Check: did you include a fibre source at every main meal this week?", why: "Consistency of fibre intake matters more than quantity on any single day. Frequency is the key variable." },
    ],
  },
  consistency: {
    title: "Your 7-day Eating Rhythm starter",
    days: [
      { label: "Day 1", action: "Set three fixed meal times today and stick to them", why: "Your gut microbiome has a circadian rhythm. Consistent meal timing tells it when to prepare digestive enzymes." },
      { label: "Day 2", action: "Eat your first meal within 1 hour of waking", why: "Early eating activates your gut's morning microbiome shift — linked to better energy and digestion all day." },
      { label: "Day 3", action: "Avoid eating within 2 hours of sleep tonight", why: "Late eating disrupts gut-brain signalling during sleep — the window when much of microbiome restoration happens." },
      { label: "Day 4", action: "Drink a glass of water before each meal today", why: "Hydration before meals aids gastric acid production and enzyme activity — improving how your gut processes food." },
      { label: "Day 5", action: "Eat slowly — put your fork down between bites at your main meal", why: "Slow eating activates the rest-and-digest nervous system, improving gut motility and nutrient absorption." },
      { label: "Day 6", action: "Plan tomorrow's meals tonight", why: "Planning reduces decision fatigue at mealtimes — which is the #1 driver of inconsistent eating patterns." },
      { label: "Day 7", action: "Reflect: which meal timing felt hardest to protect this week?", why: "Identifying your friction point lets you build a specific solution around it — consistency is about design, not discipline." },
    ],
  },
  feeling: {
    title: "Your 7-day Body Awareness starter",
    days: [
      { label: "Day 1", action: "Write one word describing how you feel 1 hour after breakfast", why: "This is the beginning of pattern recognition. One word is enough to track over time." },
      { label: "Day 2", action: "Note your energy level at 2pm — was it stable or did it dip?", why: "The 2pm energy dip is often driven by gut-generated blood sugar instability, not tiredness." },
      { label: "Day 3", action: "Track your digestion after your largest meal today", why: "Bloating, discomfort, or sluggishness after meals are direct signals from your microbiome." },
      { label: "Day 4", action: "Note your mood in the 30 minutes after lunch", why: "Post-meal mood shifts reflect serotonin and gut-brain communication — often tied to what you just ate." },
      { label: "Day 5", action: "Identify one food that seems to make you feel better or worse", why: "Your gut has preferences. Learning them is the foundation of personalised nutrition." },
      { label: "Day 6", action: "Compare your energy today vs Day 1 — any patterns emerging?", why: "Five days of one-word notes is enough to see your first personal correlation." },
      { label: "Day 7", action: "Write 3 observations about how your body responded to food this week", why: "Self-knowledge is the most powerful nutritional tool. You're building the data set only you can collect." },
    ],
  },
}

const DEFAULT_PROGRAM = PILLAR_PROGRAMS.adding

interface SevenDayGuideProps {
  weakestPillar: string | null
  profileColor: string
  signupDate: string // ISO string
  userId: string
}

export function SevenDayGuide({
  weakestPillar,
  profileColor,
  signupDate,
  userId,
}: SevenDayGuideProps) {
  const storageKey = `eatobiotics_7day_dismissed_${userId}`
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem(storageKey)
  })
  const [expanded, setExpanded] = useState(false)
  const [checkedDays, setCheckedDays] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set()
    const saved = localStorage.getItem(`eatobiotics_7day_checks_${userId}`)
    return saved ? new Set(JSON.parse(saved) as number[]) : new Set()
  })

  const daysSinceSignup = Math.floor((Date.now() - new Date(signupDate).getTime()) / 86_400_000)
  if (daysSinceSignup > 7 || dismissed) return null

  const program = weakestPillar ? (PILLAR_PROGRAMS[weakestPillar] ?? DEFAULT_PROGRAM) : DEFAULT_PROGRAM
  const currentDay = Math.min(daysSinceSignup, 6) // 0-indexed

  function toggleDay(i: number) {
    setCheckedDays((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      localStorage.setItem(`eatobiotics_7day_checks_${userId}`, JSON.stringify([...next]))
      return next
    })
  }

  function dismiss() {
    localStorage.setItem(storageKey, "1")
    setDismissed(true)
  }

  const completedCount = checkedDays.size

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{ background: `color-mix(in srgb, ${profileColor} 8%, transparent)` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-foreground">🗓️ {program.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Day {currentDay + 1} of 7 &nbsp;·&nbsp; {completedCount} action{completedCount !== 1 ? "s" : ""} ticked off
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress dots */}
            <div className="flex gap-1">
              {program.days.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full transition-colors"
                  style={{
                    background: checkedDays.has(i)
                      ? profileColor
                      : i === currentDay
                      ? `color-mix(in srgb, ${profileColor} 40%, transparent)`
                      : "var(--border)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-border/40"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Today's action — always visible */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Today — {program.days[currentDay].label}
        </p>
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleDay(currentDay)}
            className="flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full border-2 transition-all"
            style={{
              borderColor: checkedDays.has(currentDay) ? profileColor : "var(--border)",
              background: checkedDays.has(currentDay) ? profileColor : "transparent",
            }}
          >
            {checkedDays.has(currentDay) && <Check size={10} className="text-white" />}
          </button>
          <div>
            <p className="text-sm font-semibold text-foreground">{program.days[currentDay].action}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{program.days[currentDay].why}</p>
          </div>
        </div>
      </div>

      {/* All days — expanded */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {program.days.map((day, i) => {
            if (i === currentDay) return null // already shown above
            const isPast = i < currentDay
            const isFuture = i > currentDay
            return (
              <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${isFuture ? "opacity-40" : ""}`}>
                <button
                  onClick={() => !isFuture && toggleDay(i)}
                  disabled={isFuture}
                  className="flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full border-2 transition-all"
                  style={{
                    borderColor: checkedDays.has(i) ? profileColor : isPast ? "var(--border)" : "var(--border)",
                    background: checkedDays.has(i) ? profileColor : "transparent",
                    cursor: isFuture ? "default" : "pointer",
                  }}
                >
                  {checkedDays.has(i) && <Check size={10} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{day.label}</p>
                    {isFuture && <span className="text-[10px] text-muted-foreground/50">unlocks tomorrow</span>}
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{day.action}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground/50">
          {7 - daysSinceSignup} day{7 - daysSinceSignup !== 1 ? "s" : ""} left in your starter programme
        </p>
        <button
          onClick={dismiss}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
