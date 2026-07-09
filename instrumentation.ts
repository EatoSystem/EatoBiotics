import type { Instrumentation } from "next"

/**
 * Next.js instrumentation hook — dispatches to the right Sentry config per
 * runtime. Both configs are themselves gated on SENTRY_DSN, so this whole
 * file is a no-op in any environment where Sentry isn't configured.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return
  const Sentry = await import("@sentry/nextjs")
  Sentry.captureRequestError(...args)
}
