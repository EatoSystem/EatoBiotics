import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
      {
        source: "/enter",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
        ],
      },
    ]
  },
}

// Sentry build-time configuration.
//
// `withSentryConfig` is the production-grade wrapper: it uploads source maps,
// hides the SDK source path in stack traces, and tunnels Sentry events through
// our origin to evade ad-blockers.
//
// All options are safe to keep enabled in any environment — if SENTRY_AUTH_TOKEN
// is missing (e.g. local dev or a fork), Sentry skips the upload silently.
export default withSentryConfig(nextConfig, {
  // Org/project pulled from env so they aren't hard-coded into the repo.
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress noisy CLI output unless we're in CI.
  silent: !process.env.CI,

  // Upload a larger set of source maps for better stack traces.
  widenClientFileUpload: true,

  // Tunnel events through /monitoring to bypass ad-blockers.
  tunnelRoute: "/monitoring",

  // Don't disable source map generation — we want them for prod debugging.
  hideSourceMaps: true,
})
