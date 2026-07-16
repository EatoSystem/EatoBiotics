/**
 * Validation schema for /api/twin-state PUT bodies — extracted from the route
 * so it's unit-testable and stays in lockstep with RitualDay (lib/account/
 * ritual.ts). zod strips unknown keys by default, which is exactly how the
 * original 3-key schema silently dropped `moved`/`slept` after the ritual
 * grew to five checks — every key of RitualDay must be listed here.
 */

import { z } from "zod"

// moved/slept default to false (rather than being required) so a stale client
// still sending the old 3-key shape gets a merge, not a 400.
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
