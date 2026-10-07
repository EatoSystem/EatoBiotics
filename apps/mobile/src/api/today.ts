import {
  AUTH_HEADER,
  MOBILE_TODAY_PATH,
  mobileTodayResponseSchema,
  type MobileTodayResponse,
} from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

export type TodayFetch =
  | { ok: true; data: MobileTodayResponse }
  | { ok: false; reason: "unauthorised" | "unavailable" | "invalid" }

export async function fetchToday(accessToken: string): Promise<TodayFetch> {
  let res: Response
  try {
    res = await fetch(`${SITE_URL}${MOBILE_TODAY_PATH}`, {
      headers: { [AUTH_HEADER]: `Bearer ${accessToken}` },
    })
  } catch {
    return { ok: false, reason: "unavailable" }
  }

  if (res.status === 401) return { ok: false, reason: "unauthorised" }
  if (!res.ok) return { ok: false, reason: "unavailable" }

  try {
    const json: unknown = await res.json()
    return { ok: true, data: mobileTodayResponseSchema.parse(json) }
  } catch {
    return { ok: false, reason: "invalid" }
  }
}
