/**
 * What is inside the V1 customer surface — V1 scope freeze.
 *
 * ══ THIS IS A SCOPE DECISION, NOT A FEATURE FLAG ════════════════════════════
 *
 * V1 sells three things: the free Food System Assessment, the €49 Personal
 * Food System Consultation, and EatoBiotics Member. Sixteen pages, four
 * journeys. Everything else the repository can do is real work that is not
 * part of that promise, and shipping it anyway is how a launch acquires
 * failure modes it gets no credit for.
 *
 * ══ WHY A CONSTANT AND NOT AN ENVIRONMENT VARIABLE ══════════════════════════
 *
 * Because reinstatement should be a code change that goes through review, not
 * a value somebody can set on a deployment at 2am. An env-driven switch would
 * make the V1 surface a property of configuration, which is exactly the
 * mistake that lets a half-finished subsystem reach customers — and this
 * codebase has already paid for that once (see below).
 *
 * Flipping one of these to `true` is the whole reinstatement mechanism. The
 * implementation, its tests and its drafted migrations are deliberately left
 * intact so that flip is small.
 */

/**
 * Customer feedback capture — the site-wide widget, the account rating prompt,
 * the two capture endpoints and the admin dashboard.
 *
 * ══ WHY IT IS OUT OF V1 ═════════════════════════════════════════════════════
 *
 * It does not work. `feedback` (Migration 46) and `reviews` (Migration 45) are
 * DRAFTED AND UNAPPLIED — verified absent from production — while the widget is
 * mounted on every page and the account prompt is mounted in the live
 * dashboard. Every submission returns 503, and the capture endpoint spends a
 * Claude call on extraction BEFORE the insert fails, so each failure costs
 * money and returns an apology.
 *
 * The alternative was to apply both migrations and add four journeys to the
 * launch gate — including an anonymous, unauthenticated, AI-calling public
 * endpoint and a 90-day retention sweep — in order to collect feedback about a
 * product nobody has used yet. Feedback is worth having in week two, against
 * real buyers, applied deliberately. It is worth nothing on day one.
 *
 * ══ WHAT THIS CONSTANT DOES AND DOES NOT COVER ══════════════════════════════
 *
 * It closes the CUSTOMER and ADMIN surface: nothing mounts the widget or the
 * prompt, and `/api/feedback`, `/api/reviews` and `/admin/feedback` answer 404.
 *
 * It deliberately does NOT touch the scheduled jobs. `feedback/digest` and
 * `feedback/retention` are handled separately, because `feedback/retention` is
 * misnamed: it also sweeps `paid_report_intents`, which IS a V1 table with a
 * 30-day retention obligation. Deleting it as "a feedback job" would have
 * stopped pruning purchase-intent tokens — a privacy regression on the V1 spine
 * caused by a scope decision about something else entirely.
 *
 * Nothing here applies, drafts or alters a migration. Migrations 45 and 46 stay
 * exactly as they are: written, reviewed, and not applied.
 */
export const FEEDBACK_CAPTURE_ENABLED = false
