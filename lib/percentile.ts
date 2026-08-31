/**
 * INTERNAL ONLY — an assumed distribution, not observed data.
 *
 * This is a normal CDF against a mean and standard deviation someone chose.
 * No user data enters it at any score. There is no comparison population.
 *
 * **It must never be shown to a customer as a rank against other people.**
 *
 * It shipped that way — "You scored higher than 63% of people with typical
 * eating habits" on the assessment results, the share card, both OG cards,
 * /discover, the waitlist reveal in five languages and the waitlist email —
 * and every one of those has been removed. A Biotics Score™ is the person's
 * own number; it does not need a population ranking to mean something, and
 * this was never one.
 *
 * The header this replaces called the output "sensible, accurate-feeling
 * percentiles" and documented it with "you beat 46% of people". That wording
 * is the whole failure in miniature: it reads as a measurement, and it is a
 * guess. `getPercentileLabel()` — which emitted that sentence ready-made — is
 * deleted, because a customer claim sitting in a shared helper is how it comes
 * back.
 *
 * ── What it is still for ────────────────────────────────────────────────────
 *
 * A stable derived value in analytics events (posthog `score_shared`,
 * `meal_shared`) and in `?percentile=` share-URL parameters, which the OG
 * routes still ACCEPT so links shared before the removal keep rendering — they
 * just never print it. Those series predate this change and dropping them would
 * lose history for no gain.
 *
 * If a real comparison population is ever collected, that is a new function
 * with its own evidence, not a quiet edit to MEAN and STD below.
 *
 * tests/unit/retired-vocabulary.test.ts fails the build if a customer surface
 * reintroduces the claim, and asserts this file carries no customer-style
 * example.
 */

// ── Normal CDF (no external deps) ─────────────────────────────────────────────
// Approximation using the Abramowitz & Stegun error function (max error < 1.5e-7)
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const poly =
    t * (0.254829592 +
    t * (-0.284496736 +
    t * (1.421413741 +
    t * (-1.453152027 +
    t * 1.061405429))))
  const result = 1 - poly * Math.exp(-x * x)
  return x >= 0 ? result : -result
}

function normalCDF(x: number, mean: number, std: number): number {
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)))
}

// ASSUMED distribution parameters. Not derived from any observed population.
const MEAN = 55
const STD  = 17

/**
 * Rank of `score` within the SYNTHETIC distribution above (1–99).
 *
 * Not a measurement of anyone. Internal use only — see the module header.
 */
export function getPercentile(score: number): number {
  const raw = normalCDF(score, MEAN, STD) * 100
  // Clamp to 1–99 so we never say "top 0%" or "top 100%"
  return Math.round(Math.min(99, Math.max(1, raw)))
}
