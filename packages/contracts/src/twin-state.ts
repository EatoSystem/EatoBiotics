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

export type TwinStatePut = z.infer<typeof twinStatePutSchema>
export type RitualDayContract = z.infer<typeof ritualDaySchema>
