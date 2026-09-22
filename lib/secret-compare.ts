import { timingSafeEqual } from "node:crypto"

/**
 * Constant-time string comparison for secrets.
 *
 * The shape is lib/admin-auth.ts's `verifyAdminCookie`: compare lengths first,
 * because `timingSafeEqual` throws on a mismatch rather than returning false.
 *
 * ══ WHY THE LOGIN ROUTES NEEDED THIS ═══════════════════════════════════════
 *
 * `lib/admin-auth.ts` has always compared the admin COOKIE in constant time,
 * while `app/api/admin/login` compared the PASSWORD the cookie stands for with
 * `!==` — and `app/api/enter` did the same with the preview password. The
 * codebase's own standard was applied to the derived token and not to the
 * credential.
 *
 * `admin-auth.ts` is deliberately left as it is rather than refactored onto
 * this helper: it is a working security control, and removing a few lines of
 * duplication is not worth touching one.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  // Length is not a secret worth protecting here, and an unequal-length
  // timingSafeEqual throws.
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}
