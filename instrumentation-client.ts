import * as Sentry from "@sentry/nextjs"

/**
 * Browser-runtime Sentry init — Next.js auto-loads this file (no config
 * needed). No-op if NEXT_PUBLIC_SENTRY_DSN is unset, so local dev and CI
 * builds never require a Sentry account.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
