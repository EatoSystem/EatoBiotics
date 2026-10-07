/**
 * Shared PUT/GET contract for /api/twin-state.
 *
 * zod strips unknown keys by default, which is how the original 3-key schema
 * silently dropped `moved`/`slept` after the ritual grew to five checks.
 * Every RitualDay key must be listed here. Tests pin this against
 * lib/account/ritual.ts — do not add a second copy of the keys.
 */
import { z } from "zod"

export const ritualDaySchema = z.object({
  fermented: z.boolean(),
  plants: z.boolean(),
  moved: z.boolean().default(false),
  slept: z.boolean().default(false),
  feeling: z.boolean(),
})

export const twinStatePutSchema = z.object({
  rituals: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ritualDaySchema).default({}),
  milestonesSeen: z.array(z.string().max(60)).max(200).default([]),
})

/** GET /api/twin-state returns the same object PUT accepts. Parse both with this. */
export const twinStateGetSchema = twinStatePutSchema

export type TwinStatePut = z.infer<typeof twinStatePutSchema>
export type TwinStateGet = z.infer<typeof twinStateGetSchema>
export type RitualDayContract = z.infer<typeof ritualDaySchema>

/** Derived from the schema so a second key list cannot drift. */
export const RITUAL_DAY_KEYS = Object.keys(ritualDaySchema.shape) as Array<
  keyof RitualDayContract
>

export const EMPTY_RITUAL: RitualDayContract = ritualDaySchema.parse({
  fermented: false,
  plants: false,
  feeling: false,
})

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

export function localDayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function normaliseRitualDay(raw: unknown): RitualDayContract {
  const parsed = ritualDaySchema.safeParse(raw)
  return parsed.success ? parsed.data : EMPTY_RITUAL
}

export function toggleRitualKey(
  day: RitualDayContract,
  key: keyof RitualDayContract,
): RitualDayContract {
  return ritualDaySchema.parse({ ...day, [key]: !day[key] })
}

/** Incoming day replaces that day whole. Other days survive. Extra keys drop. */
export function incomingDayWins(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, RitualDayContract> {
  const out: Record<string, RitualDayContract> = {}
  for (const [day, ritual] of Object.entries(existing)) {
    if (!DAY_KEY.test(day)) continue
    out[day] = normaliseRitualDay(ritual)
  }
  for (const [day, ritual] of Object.entries(incoming)) {
    if (!DAY_KEY.test(day)) continue
    out[day] = normaliseRitualDay(ritual)
  }
  return out
}

export function pickTodayRitual(args: {
  local: RitualDayContract | null
  localDirty: boolean
  server: RitualDayContract | null
  seed: RitualDayContract | null
}): RitualDayContract {
  if (args.localDirty && args.local) return normaliseRitualDay(args.local)
  if (args.server) return normaliseRitualDay(args.server)
  if (args.seed) return normaliseRitualDay(args.seed)
  if (args.local) return normaliseRitualDay(args.local)
  return EMPTY_RITUAL
}

export function buildTwinStatePut(day: string, ritual: RitualDayContract): TwinStatePut {
  const normalised = ritualDaySchema.parse(ritual)
  return twinStatePutSchema.parse({
    rituals: { [day]: normalised },
    milestonesSeen: [],
  })
}
