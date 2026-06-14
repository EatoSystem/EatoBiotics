/* ── Dashboard data layer ─────────────────────────────────────────────────
   Pure types, constant tables, and stateless helpers extracted from
   components/account/dashboard-client.tsx (which was a 3,600-line
   god-component). No React, no JSX, no side effects — just the shared data
   contract the dashboard's components consume. Keeping it here makes the
   constants easy to find and the main file's diffs smaller.
──────────────────────────────────────────────────────────────────────── */

/* ── Types ──────────────────────────────────────────────────────────── */

export interface Profile {
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

export interface AssessmentRow {
  overall_score: number | null
  profile_type: string | null
  sub_scores: Record<string, number> | null
  created_at: string
  email_sent: boolean | null
}

export interface PaidReport {
  stripe_session_id: string
  tier: string
  pdf_url: string | null
  created_at: string
  free_scores: { overall: number; profile: { type: string } } | null
  report_json: Record<string, unknown> | null
}

export interface PlateData {
  plate: unknown
  plants: string[] | null
  updated_at: string
}

export interface BioticsProfile {
  prebiotic: number   // raw score out of 45
  probiotic: number   // raw score out of 25
  postbiotic: number  // raw score out of 15
  analysisCount: number
}

export interface AnalysisPatterns {
  bestDay: string
  trendDirection: "up" | "stable" | "down"
  bestStreak: number
  analysisCount: number
}

/* ── Profile lookup ─────────────────────────────────────────────────── */

export const PROFILE_INFO: Record<string, { color: string; tagline: string }> = {
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
export const DEFAULT_PROFILE_INFO = { color: "var(--icon-green)", tagline: "The food system inside you." }

export function getProfileInfo(profileType: string | null) {
  if (!profileType) return DEFAULT_PROFILE_INFO
  return PROFILE_INFO[profileType] ?? DEFAULT_PROFILE_INFO
}

/* ── Tier / score tables ────────────────────────────────────────────── */

export const TIER_LABELS: Record<string, string> = {
  personal: "Personal",
  starter: "Starter",
  full: "Full",
  premium: "Premium",
}

export const TIER_COLORS: Record<string, string> = {
  personal: "var(--icon-green)",
  starter: "var(--icon-lime)",
  full: "var(--icon-teal)",
  premium: "var(--icon-orange)",
}

export const SCORE_COLORS: Record<string, string> = {
  "Exceptional":       "var(--icon-green)",
  "Strong Foundation": "var(--icon-lime)",
  "Good Start":        "var(--icon-yellow)",
  "Getting There":     "var(--icon-orange)",
  "Starting Out":      "#ef4444",
}

export const DAILY_LIMITS: Record<string, number> = { grow: 2, restore: 5, transform: 10 }

export const TIER_ACCENT: Record<string, { bg: string; text: string; label: string }> = {
  free:      { bg: "rgba(255,255,255,0.1)",  text: "rgba(255,255,255,0.6)",  label: "Free" },
  trial:     { bg: "rgba(132,204,22,0.22)",  text: "#bef264",                label: "30-Day Trial" },
  member:    { bg: "rgba(20,184,166,0.22)",  text: "#5eead4",                label: "Member" },
  grow:      { bg: "rgba(132,204,22,0.22)",  text: "#bef264",                label: "Grow Member" },
  restore:   { bg: "rgba(20,184,166,0.22)",  text: "#5eead4",                label: "Restore Member" },
  transform: { bg: "rgba(249,115,22,0.22)",  text: "#fdba74",                label: "Transform Member" },
}

export const TIER_ORDER: Record<string, number> = { free: 0, grow: 1, restore: 2, transform: 3 }

/* ── Biotics copy ───────────────────────────────────────────────────── */

export const BIOTICS_TIPS: Record<string, Record<string, string>> = {
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

export const BIOTICS_MEASURED: Record<string, string> = {
  prebiotic:  "Fibre-rich plant foods across your meals",
  probiotic:  "Live fermented foods (kefir, yogurt, kimchi)",
  postbiotic: "Compounds your gut produces when fermenting fibre",
}

/* ── Daily Habit Prompts (5 pillars × 7 days) ───────────────────────── */

export const DAILY_PROMPTS: Record<string, string[]> = {
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

export function getDailyPrompt(subScores: Record<string, number> | null | undefined, dayIndex: number): string {
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

/* ── Date + score helpers ───────────────────────────────────────────── */

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
}

export function relativeTime(iso: string) {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function extractSubScores(sub: Record<string, number> | null) {
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

export function getScoreBand(score: number): string {
  if (score >= 80) return "Exceptional"
  if (score >= 65) return "Strong Foundation"
  if (score >= 50) return "Good Start"
  if (score >= 35) return "Getting There"
  return "Starting Out"
}

export function deriveReportPillars(sub: Record<string, number> | null) {
  if (!sub) return null
  const has = (k: string) => typeof sub[k] === "number"
  if (!has("diversity") || !has("feeding") || !has("adding") || !has("consistency") || !has("feeling")) return null
  return [
    { name: "Prebiotics", score: Math.round((sub.diversity + sub.feeding) / 2), color: "var(--icon-green)" },
    { name: "Probiotics", score: Math.round(sub.adding), color: "var(--icon-orange)" },
    { name: "Postbiotics", score: Math.round((sub.consistency + sub.feeling) / 2), color: "var(--icon-teal)" },
  ]
}
