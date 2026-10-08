/**
 * The founding-access deadline, when one is configured.
 *
 * ── It says nothing when it knows nothing ───────────────────────────────────
 *
 * With no cutoff configured this returns null and the caller renders nothing,
 * rather than naming a deadline nobody set. A deadline already in the past is
 * not scarcity either — it is a stale promise — so that returns null too.
 *
 * ── Where it is used today: nowhere ─────────────────────────────────────────
 *
 * It lived in app/enter/waitlist-hero.tsx and added "Founding access closes
 * <date>" beneath the hero. The holding page now runs a COUNTED cohort (the
 * First 100, then the First Course), and a date-framed deadline beside a
 * counted one means two scarcity stories competing, so neither is the reason
 * to act. The counted one wins because it is the one the product can prove.
 *
 * It is kept — extracted rather than deleted — because the behaviour is
 * correct, tested and cheap, and `FOUNDING_MEMBER_CUTOFF_DATE` still decides
 * founding status in the Stripe webhook and on the pricing page. Nothing
 * renders this function at the moment, and that is stated here rather than
 * implied by an unused export nobody can explain later.
 */
export function foundingAccessDeadline(
  value: string | undefined = process.env.NEXT_PUBLIC_FOUNDING_MEMBER_CUTOFF_DATE,
  now: number = Date.now(),
): string | null {
  if (!value) return null
  const closes = new Date(value)
  if (Number.isNaN(closes.getTime())) return null
  // A deadline that has already passed is not scarcity, it is a stale promise.
  if (closes.getTime() <= now) return null
  return closes.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}
