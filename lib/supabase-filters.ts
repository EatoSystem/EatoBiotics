/**
 * Safe builders for PostgREST filter strings used with supabase-js `.or()`.
 *
 * Interpolating raw values into a `.or("col.eq.VALUE,...")` string is risky: a
 * value containing a PostgREST-reserved character (comma, parentheses, etc.)
 * could inject extra filter conditions. In practice our values are the
 * authenticated user's own id/email, but quoting them removes the foot-gun
 * entirely and keeps the call sites readable.
 *
 * PostgREST treats a double-quoted value as a literal, so reserved characters
 * inside the quotes are not parsed as syntax.
 */

/** Wrap a value in double quotes, escaping embedded backslashes and quotes. */
export function pgQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

/**
 * Builds an owner-scoping `.or()` filter: matches rows by `user_id` and, when
 * provided, also by `email`. Values are safely quoted.
 *
 *   .or(ownerOrFilter(user.id, user.email))
 *   // → user_id.eq."<uuid>",email.eq."<email>"
 */
export function ownerOrFilter(userId: string, email?: string | null): string {
  const conditions = [`user_id.eq.${pgQuote(userId)}`]
  if (email) conditions.push(`email.eq.${pgQuote(email)}`)
  return conditions.join(",")
}
