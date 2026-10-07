/**
 * Parse a magic-link callback URL into a Supabase session.
 *
 * Handles the same three shapes the web `/auth/callback` page handles:
 * implicit tokens in the hash, PKCE `code`, email OTP `token_hash`.
 * Destination is always this app — never a caller-supplied redirect.
 */
import { getMobileSupabase } from "./session"

export function isAuthCallbackUrl(url: string): boolean {
  return url.includes("auth/callback")
}

export async function completeMagicLink(url: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getMobileSupabase()
  if (!supabase) return { ok: false, reason: "not_configured" }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, reason: "bad_url" }
  }

  const hash = new URLSearchParams(parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash)
  const accessToken = hash.get("access_token")
  const refreshToken = hash.get("refresh_token")
  const code = parsed.searchParams.get("code")
  const tokenHash = parsed.searchParams.get("token_hash")
  const otpType = parsed.searchParams.get("type")
  const errorDescription =
    parsed.searchParams.get("error_description") ?? hash.get("error_description")

  if (errorDescription) return { ok: false, reason: "provider_error" }

  try {
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) return { ok: false, reason: "session" }
      return { ok: true }
    }
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) return { ok: false, reason: "code" }
      return { ok: true }
    }
    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: (otpType as "magiclink" | "email") ?? "magiclink",
      })
      if (error) return { ok: false, reason: "otp" }
      return { ok: true }
    }
    return { ok: false, reason: "empty" }
  } catch {
    return { ok: false, reason: "session" }
  }
}
