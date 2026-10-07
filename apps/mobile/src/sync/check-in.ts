/**
 * Today's ritual check-in, bound to this app's /api/twin-state origin.
 * Incoming day wins whole. Extra keys are stripped, never invented.
 * Queued / sent / failed are visible on the Today screen.
 */
import {
  MOBILE_BEARER_ROUTES,
  createCheckInController as create,
  type KvStore,
  type FetchFn,
  type LogError,
  type RitualDayContract,
} from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

export {
  EMPTY_RITUAL,
  localDayKey,
  normaliseRitualDay,
  toggleRitualKey,
  incomingDayWins,
  pickTodayRitual,
  memoryKv,
  type SyncStatus,
  type CheckInSnapshot,
  type KvStore,
} from "@eatobiotics/contracts"

export function createCheckInController(deps: {
  accessToken: string
  kv: KvStore
  fetchImpl?: FetchFn
  logError?: LogError
  now?: () => Date
  seedRitual?: RitualDayContract | null
}) {
  return create({
    ...deps,
    twinStateUrl: `${SITE_URL}${MOBILE_BEARER_ROUTES.twinState}`,
  })
}
