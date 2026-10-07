/**
 * Session shape the native client holds. Shape only — never secrets.
 *
 * The app sends `Authorization: Bearer <supabase access token>`.
 * Refresh tokens live in expo-secure-store. Nothing in this package
 * is a key, and EXPO_PUBLIC_* is treated as public.
 *
 * Cookie-only web routes (account delete/export) are not represented here
 * and must not be added: the native client cannot hold the web session cookie,
 * and those routes stay on `getUser()`.
 */
export const AUTH_HEADER = "Authorization" as const

/** Expo scheme in apps/mobile/app.json. Magic-link completion lands here. */
export const MOBILE_AUTH_SCHEME = "eatobiotics" as const

export const MOBILE_AUTH_CALLBACK_PATH = "auth/callback" as const

/**
 * Query flag on the web `/auth/callback` hop. send-magic-link sets this when
 * the companion asked; the web page bounces to the app scheme. Not an open
 * redirect — the destination is this constant, never a caller-supplied URL.
 */
export const MOBILE_MAGIC_LINK_CLIENT = "mobile" as const

export type BearerSession = {
  accessToken: string
  userId: string
  email: string | null
}
