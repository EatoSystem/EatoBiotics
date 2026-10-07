import {
  AUTH_HEADER,
  MOBILE_PROGRESS_PATH,
  mobileProgressResponseSchema,
  type MobileProgressResponse,
} from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

export type ProgressFetch =
  | { ok: true; data: MobileProgressResponse }
  | { ok: false; reason: "unauthorised" | "unavailable" | "invalid" }

export async function fetchProgress(accessToken: string): Promise<ProgressFetch> {
  let res: Response
  try {
    res = await fetch(`${SITE_URL}${MOBILE_PROGRESS_PATH}`, {
      headers: { [AUTH_HEADER]: `Bearer ${accessToken}` },
    })
  } catch (error) {
    console.error("[mobile-progress] GET failed", error)
    return { ok: false, reason: "unavailable" }
  }

  if (res.status === 401) return { ok: false, reason: "unauthorised" }
  if (!res.ok) {
    console.error("[mobile-progress] GET failed", res.status)
    return { ok: false, reason: "unavailable" }
  }

  try {
    const json: unknown = await res.json()
    return { ok: true, data: mobileProgressResponseSchema.parse(json) }
  } catch (error) {
    console.error("[mobile-progress] GET invalid", error)
    return { ok: false, reason: "invalid" }
  }
}
