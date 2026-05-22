/**
 * Next.js instrumentation entry point.
 *
 * `register()` is invoked once per server runtime startup; we route to the
 * Sentry config matching the runtime so the right SDK initialises.
 *
 * `onRequestError` lets Next.js's React Server Component error handling
 * forward server-rendering failures to Sentry without us wrapping every
 * page individually.
 */
import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

export const onRequestError = Sentry.captureRequestError
