/**
 * GET/PUT /api/twin-state from the companion, bound to this app's origin.
 *
 * Errors are returned and logged. Do not copy lib/account/twin-state-sync.ts
 * — that client swallows offline/unauthed in an empty catch.
 */
import {
  MOBILE_BEARER_ROUTES,
  getTwinState as getTwinStateAt,
  putTwinState as putTwinStateAt,
  type FetchFn,
  type LogError,
  type TwinStatePut,
} from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

export {
  buildTwinStatePut,
  type TwinStateResult,
  type LogError,
  type FetchFn,
} from "@eatobiotics/contracts"

const TWIN_STATE_URL = `${SITE_URL}${MOBILE_BEARER_ROUTES.twinState}`

export function twinStateUrl(): string {
  return TWIN_STATE_URL
}

export function getTwinState(
  accessToken: string,
  opts: { fetchImpl?: FetchFn; logError?: LogError } = {},
) {
  return getTwinStateAt(TWIN_STATE_URL, accessToken, opts)
}

export function putTwinState(
  accessToken: string,
  body: TwinStatePut,
  opts: { fetchImpl?: FetchFn; logError?: LogError } = {},
) {
  return putTwinStateAt(TWIN_STATE_URL, accessToken, body, opts)
}
