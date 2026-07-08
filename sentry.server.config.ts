import * as Sentry from "@sentry/nextjs"

/**
 * Server-runtime Sentry init — no-op if SENTRY_DSN is unset, so `next build`,
 * `next dev`, and CI never require a Sentry account to run. Loaded by
 * instrumentation.ts (NEXT_RUNTIME === "nodejs").
 */
const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Deliberately quiet: only the SDK's own connection errors, not app logs.
    debug: false,
  })
}
