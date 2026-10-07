/**
 * Server composition for GET /api/mobile/v1/today.
 *
 * One object, already claim-checked. The app does not assemble five routes
 * and therefore cannot hide a selector in that assembly.
 *
 * Does not call `/api/fss/focus-today`. Does not read per-Biotic columns.
 * Entitlement is `getUserMembershipTier()` — resolved on the server.
 */
import {
  mobileTodayResponseSchema,
  ritualDaySchema,
  type MobileTodayResponse,
} from "@eatobiotics/contracts"
import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"
import { computeStreak } from "@/lib/streak"
import { getUserMembershipTier } from "@/lib/membership"
import type { MembershipTier } from "@/lib/membership-tiers"
import { composeNextStep } from "@/lib/mobile/next-step"

export const UTC_DAY = (now: Date = new Date()) => now.toISOString().slice(0, 10)

const RECENT_MEAL_CAP = 8
const ANALYSIS_LOOKBACK_MS = 7 * 86_400_000
const ANALYSIS_ROW_CAP = 120

export type MealRow = {
  created_at: string
  meal_name: string | null
  biotics_score: number | null
}

export type TodayIO = {
  membershipTier: (userId: string) => Promise<MembershipTier>
  latestScore: (userId: string, email: string | null) => Promise<number | null>
  mealRows: (userId: string) => Promise<MealRow[]>
  ritualsByDay: (userId: string) => Promise<Record<string, unknown> | null>
}

export function liveTodayIO(): TodayIO {
  return {
    async membershipTier(userId) {
      return getUserMembershipTier(userId)
    },
    async latestScore(userId, email) {
      const sb = getSupabase()
      if (!sb) return null
      const { data } = await sb
        .from("leads")
        .select("overall_score")
        .or(ownerOrFilter(userId, email))
        .not("overall_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      return clampScore(data?.overall_score)
    },
    async mealRows(userId) {
      const sb = getSupabase()
      if (!sb) return []
      const { data } = await sb
        .from("analyses")
        .select("created_at, meal_name, biotics_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(ANALYSIS_ROW_CAP)
      return (data ?? []) as MealRow[]
    },
    async ritualsByDay(userId) {
      const sb = getSupabase()
      if (!sb) return null
      const { data } = await sb
        .from("twin_state")
        .select("rituals")
        .eq("user_id", userId)
        .maybeSingle()
      const rituals = data?.rituals
      if (!rituals || typeof rituals !== "object" || Array.isArray(rituals)) return null
      return rituals as Record<string, unknown>
    },
  }
}

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const n = Math.round(value)
  if (n < 0 || n > 100) return null
  return n
}

function parseRitualToday(rituals: Record<string, unknown> | null, today: string) {
  if (!rituals) return null
  const raw = rituals[today]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const parsed = ritualDaySchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

function ritualHasTap(day: { fermented: boolean; plants: boolean; moved: boolean; slept: boolean; feeling: boolean }) {
  return day.fermented || day.plants || day.moved || day.slept || day.feeling
}

export function composeMobileTodayFrom(
  input: {
    bioticsScore: number | null
    meals: MealRow[]
    ritualsByDay: Record<string, unknown> | null
    entitlementTier: MembershipTier
    now?: Date
  },
): MobileTodayResponse {
  const now = input.now ?? new Date()
  const today = UTC_DAY(now)
  const streak = computeStreak(input.meals.map((m) => m.created_at), now)
  const ritualToday = parseRitualToday(input.ritualsByDay, today)

  const weekAgo = now.getTime() - ANALYSIS_LOOKBACK_MS
  const recentActivity: MobileTodayResponse["recentActivity"] = input.meals
    .filter((m) => {
      const t = Date.parse(m.created_at)
      return Number.isFinite(t) && t >= weekAgo
    })
    .slice(0, RECENT_MEAL_CAP)
    .map((m) => {
      const name = m.meal_name?.trim()
      const entry: MobileTodayResponse["recentActivity"][number] = {
        kind: "meal",
        at: m.created_at,
        summary: name || "Logged a meal",
      }
      const mealScore = clampScore(m.biotics_score)
      if (mealScore != null) entry.mealBioticsScore = mealScore
      return entry
    })

  if (ritualToday && ritualHasTap(ritualToday)) {
    recentActivity.push({
      kind: "ritual",
      at: `${today}T12:00:00.000Z`,
      summary: "Checked in today",
    })
  }

  recentActivity.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))

  const payload: MobileTodayResponse = {
    bioticsScore: input.bioticsScore,
    streak,
    ritualToday,
    recentActivity,
    nextStep: composeNextStep({
      loggedToday: streak.loggedToday,
      currentStreak: streak.current,
      hasBioticsScore: input.bioticsScore != null,
    }),
    entitlementTier: input.entitlementTier,
  }

  return mobileTodayResponseSchema.parse(payload)
}

export async function composeMobileToday(
  user: { id: string; email: string | null },
  io: TodayIO = liveTodayIO(),
  now: Date = new Date(),
): Promise<MobileTodayResponse> {
  const [entitlementTier, bioticsScore, meals, ritualsByDay] = await Promise.all([
    io.membershipTier(user.id),
    io.latestScore(user.id, user.email),
    io.mealRows(user.id),
    io.ritualsByDay(user.id),
  ])

  return composeMobileTodayFrom({
    bioticsScore,
    meals,
    ritualsByDay,
    entitlementTier,
    now,
  })
}
