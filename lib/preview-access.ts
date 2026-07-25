import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  DEV_COOKIE,
  devPasswordToken,
  getDevPassword,
  isPasswordGateEnabled,
} from "@/lib/dev-password-gate"

/**
 * Page-level belt-and-braces for the private-beta password gate.
 *
 * `proxy.ts` already gates every non-allowlisted path; this is the second check
 * for pages that must never render without preview access.
 *
 * Deliberately kept out of `lib/dev-password-gate.ts`: that module is imported by
 * `proxy.ts` (middleware), where `next/headers` and `next/navigation` are not
 * available. Keeping the server-component-only helper here leaves the primitives
 * edge-safe.
 *
 * @param from Path to return to after a successful unlock, e.g. "/" or "/newhome".
 */
export async function requirePreviewAccess(from: string): Promise<void> {
  if (!isPasswordGateEnabled()) return

  const password = getDevPassword()
  if (!password) redirect(`/enter?from=${encodeURIComponent(from)}`)

  const cookieStore = await cookies()
  const expectedToken = await devPasswordToken(password)
  const hasAccess = cookieStore.get(DEV_COOKIE)?.value === expectedToken

  if (!hasAccess) redirect(`/enter?from=${encodeURIComponent(from)}`)
}
