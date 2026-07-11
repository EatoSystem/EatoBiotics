/**
 * Maps the auth callback's `?error=` codes (see app/auth/callback/page.tsx)
 * to user-facing sign-in page copy. Any unrecognised non-null code gets the
 * generic message — the raw parameter value is never echoed back to the page.
 */
export function linkErrorMessage(code: string | null): string | null {
  if (!code) return null
  if (code === "link_expired") {
    return "That sign-in link has expired or was already used. Enter your email and we'll send you a fresh one."
  }
  return "That sign-in link didn't work. Enter your email and we'll send you a new one."
}
