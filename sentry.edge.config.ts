import * as Sentry from "@sentry/nextjs"

/**
 * Edge-runtime Sentry init (middleware, edge API routes) — no-op if SENTRY_DSN
 * is unset. Loaded by instrumentation.ts (NEXT_RUNTIME === "edge").
 */
const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
  })
}
