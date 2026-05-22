/**
 * Sentry edge-runtime initialisation — runs in middleware and any
 * route segments configured with `runtime: "edge"`.
 *
 * EatoBiotics currently uses Node.js (Fluid Compute) for all routes, so this
 * file is essentially future-proofing — keeps Sentry working if a route
 * is ever moved to the edge runtime.
 */
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  tracesSampleRate: 0.1,
})
