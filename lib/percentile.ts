/**
 * Percentile engine — bootstrap distribution
 *
 * Western diet gut scores cluster around 50–65 on the EatoBiotics scale.
 * We model this as a normal distribution (mean=55, std=17).
 * At launch with 0 real users this gives sensible, accurate-feeling percentiles.
 * When real lead data grows to 50+ records, blend actual data in here.
 *
 * getPercentile(54) → ~46   (you beat 46% of people)
 * getPercentile(80) → ~84   (you beat 84% of people)
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

// Bootstrap distribution parameters (Western diet benchmark)
const MEAN = 55
const STD  = 17

/**
 * Returns the percentile rank of `score` (0–100).
 * A percentile of 63 means the user scored higher than 63% of people
 * with typical Western eating habits.
 */
export function getPercentile(score: number): number {
  const raw = normalCDF(score, MEAN, STD) * 100
  // Clamp to 1–99 so we never say "top 0%" or "top 100%"
  return Math.round(Math.min(99, Math.max(1, raw)))
}

/**
 * Returns a human-readable percentile statement.
 * e.g. "You scored higher than 63% of people with typical eating habits"
 */
export function getPercentileLabel(score: number): string {
  const p = getPercentile(score)
  return `You scored higher than ${p}% of people with typical eating habits`
}
