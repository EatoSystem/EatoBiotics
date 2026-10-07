/**
 * Session shape the native client holds. Shape only — never secrets.
 *
 * The app sends `Authorization: Bearer <supabase access token>`.
 * Refresh tokens live in expo-secure-store (P1). Nothing in this package
 * is a key, and EXPO_PUBLIC_* is treated as public.
 */
export const AUTH_HEADER = "Authorization" as const

export type BearerSession = {
  accessToken: string
  userId: string
  email: string | null
}
