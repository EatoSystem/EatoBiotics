import { AUTH_HEADER, MOBILE_BEARER_ROUTES } from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

const DELETE_URL = `${SITE_URL}${MOBILE_BEARER_ROUTES.accountDelete}`

export type AccountDeleteResult =
  | { ok: true }
  | { ok: false; reason: "unauthorised" | "unavailable"; message: string }

/**
 * Store-required in-app deletion. Bearer only — the companion never holds
 * a web session cookie. Export stays on the website.
 */
export async function deleteAccount(accessToken: string): Promise<AccountDeleteResult> {
  let res: Response
  try {
    res = await fetch(DELETE_URL, {
      method: "DELETE",
      headers: { [AUTH_HEADER]: `Bearer ${accessToken}` },
    })
  } catch (error) {
    console.error("[mobile-account-delete] DELETE failed", error)
    return {
      ok: false,
      reason: "unavailable",
      message: "We couldn't finish deleting your account. Please try again.",
    }
  }

  if (res.status === 401) {
    return { ok: false, reason: "unauthorised", message: "Please sign in again." }
  }

  if (res.ok) return { ok: true }

  let message = "We couldn't finish deleting your account. Please try again."
  try {
    const body = (await res.json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error.length > 0) message = body.error
  } catch (error) {
    console.error("[mobile-account-delete] DELETE body unreadable", error)
  }
  console.error("[mobile-account-delete] DELETE failed", res.status)
  return { ok: false, reason: "unavailable", message }
}
