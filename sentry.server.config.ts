/**
 * Sentry server-side initialisation — runs in Node.js (Fluid Compute).
 *
 * This is where webhook errors, Claude timeouts, Supabase failures, and
 * Resend rejections land. Most actionable signal for production debugging.
 */
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  tracesSampleRate: 0.1,

  // Don't waste quota on benign Stripe webhook signature failures from
  // probes/scanners — those are 400s, not real errors.
  ignoreErrors: [
    "Stripe signature verification failed",
    "Invalid stripe-signature header",
  ],
})
