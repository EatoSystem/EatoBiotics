/**
 * Validation schema for /api/twin-state PUT bodies.
 *
 * The schema lives in @eatobiotics/contracts so the React Native client
 * parses the same boundary the server does. This file re-exports so the
 * existing route and tests keep their import path.
 *
 * zod strips unknown keys by default — every RitualDay key must stay listed
 * in the package (see packages/contracts/src/twin-state.ts).
 */

export {
  ritualDaySchema,
  twinStatePutSchema,
  type TwinStatePut,
} from "@eatobiotics/contracts"
