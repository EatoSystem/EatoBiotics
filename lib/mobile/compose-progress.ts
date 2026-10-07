/**
 * Server composition for GET /api/mobile/v1/progress.
 *
 * A second composed read, still on the mobile capability graph. The app
 * renders the week; it does not average meals, rank days, or call
 * `buildAccountTwin`. Does not call `/api/fss/focus-today`. Does not read
 * per-Biotic columns.
 */
import {
  mobileProgressResponseSchema,
  ritualDaySchema,
  type MobileProgressResponse,
  type RitualDayContract,
} from "@eatobiotics/contracts"
import type { MembershipTier } from "@/lib/membership-tiers"
import { liveTodayIO, UTC_DAY, type MealRow, type TodayIO } from "@/lib/mobile/compose-today"
import { composeWeekSummary } from "@/lib/mobile/week-copy"

const DAY_MS = 86_400_000
const WEEK_DAYS = 7
const WEEK_MEAL_CAP = 40

const RITUAL_LABELS: { key: keyof RitualDayContract; label: string }[] = [
  { key: "fermented", label: "Fermented food" },
  { key: "plants", label: "5+ plants" },
  { key: "moved", label: "Moved today" },
  { key: "slept", label: "Slept well" },
  { key: "feeling", label: "Feeling good" },
]

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const n = Math.round(value)
  if (n < 0 || n > 100) return null
  return n
}

function parseRitualDay(rituals: Record<string, unknown> | null, day: string): RitualDayContract | null {
  if (!rituals) return null
  const raw = rituals[day]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const parsed = ritualDaySchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

function ritualHasTap(day: RitualDayContract): boolean {
  return day.fermented || day.plants || day.moved || day.slept || day.feeling
}

function ritualLine(day: RitualDayContract): string {
  return RITUAL_LABELS.filter((row) => day[row.key])
    .map((row) => row.label)
    .join(" · ")
}

function utcDayList(end: Date, count: number): string[] {
  const days: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    days.push(UTC_DAY(new Date(end.getTime() - i * DAY_MS)))
  }
  return days
}

function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`)
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d)
}

export function composeMobileProgressFrom(input: {
  bioticsScore: number | null
  meals: MealRow[]
  ritualsByDay: Record<string, unknown> | null
  entitlementTier: MembershipTier
  now?: Date
}): MobileProgressResponse {
  const now = input.now ?? new Date()
  const dates = utcDayList(now, WEEK_DAYS)
  const inWeek = new Set(dates)
  const weekMeals = input.meals
    .filter((m) => {
      const t = Date.parse(m.created_at)
      if (!Number.isFinite(t)) return false
      return inWeek.has(UTC_DAY(new Date(t)))
    })
    .slice(0, WEEK_MEAL_CAP)

  const mealsByDay = new Map<string, MobileProgressResponse["days"][number]["meals"]>()
  for (const date of dates) mealsByDay.set(date, [])
  for (const m of weekMeals) {
    const date = UTC_DAY(new Date(m.created_at))
    const bucket = mealsByDay.get(date)
    if (!bucket) continue
    const name = m.meal_name?.trim()
    const entry: MobileProgressResponse["days"][number]["meals"][number] = {
      at: m.created_at,
      summary: name || "Logged a meal",
    }
    const mealScore = clampScore(m.biotics_score)
    if (mealScore != null) entry.mealBioticsScore = mealScore
    bucket.push(entry)
  }

  const days = dates.map((date) => {
    const ritual = parseRitualDay(input.ritualsByDay, date)
    const tapped = ritual && ritualHasTap(ritual)
    return {
      date,
      label: dayLabel(date),
      meals: mealsByDay.get(date) ?? [],
      ritual: tapped ? ritual : null,
      ritualLine: tapped ? ritualLine(ritual) : null,
    }
  })

  const mealCount = days.reduce((n, d) => n + d.meals.length, 0)
  const checkInDays = days.filter((d) => d.ritualLine != null).length

  const payload: MobileProgressResponse = {
    bioticsScore: input.bioticsScore,
    weekStart: dates[0],
    weekEnd: dates[dates.length - 1],
    days,
    mealCount,
    checkInDays,
    summary: composeWeekSummary({ mealCount, checkInDays }),
    entitlementTier: input.entitlementTier,
  }

  return mobileProgressResponseSchema.parse(payload)
}

export async function composeMobileProgress(
  user: { id: string; email: string | null },
  io: TodayIO = liveTodayIO(),
  now: Date = new Date(),
): Promise<MobileProgressResponse> {
  const [entitlementTier, bioticsScore, meals, ritualsByDay] = await Promise.all([
    io.membershipTier(user.id),
    io.latestScore(user.id, user.email),
    io.mealRows(user.id),
    io.ritualsByDay(user.id),
  ])

  return composeMobileProgressFrom({
    bioticsScore,
    meals,
    ritualsByDay,
    entitlementTier,
    now,
  })
}
