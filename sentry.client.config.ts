/**
 * Sentry client-side initialisation — runs in the browser.
 *
 * Behaviour:
 *  - No DSN set → Sentry.init() becomes a no-op. Local dev stays silent.
 *  - Sample rates kept low to control billing on a small-team plan; raise
 *    once you have a baseline of normal traffic and want richer traces.
 */
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  // Performance. 10% is a sensible default — adjust upward once you know
  // typical volume.
  tracesSampleRate: 0.1,

  // Session replays — sample 10% of normal sessions and 100% of error sessions.
  // Disabled entirely if DSN missing.
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,

  // Don't capture noisy errors that aren't actionable.
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications.",
    "Non-Error promise rejection captured",
    // Browser extension noise:
    /chrome-extension/i,
    /moz-extension/i,
  ],

  // Strip query strings from breadcrumb URLs so we don't leak session/token info.
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
      if (typeof breadcrumb.data?.url === "string") {
        try {
          const u = new URL(breadcrumb.data.url, window.location.origin)
          u.search = ""
          breadcrumb.data.url = u.toString()
        } catch { /* ignore */ }
      }
    }
    return breadcrumb
  },
})
