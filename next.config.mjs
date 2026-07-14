import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    // Supabase Storage serves generated recipe/media images (plate-builder
    // outputs, CMS media library) from a *.supabase.co subdomain that
    // varies per project/environment — next/image refuses to optimize any
    // remote host that isn't explicitly allowlisted here. Added ahead of
    // flipping `unoptimized` off (see the follow-up commit) so the two
    // changes can be bisected independently on the Vercel preview.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  // Keep serverless functions lean: never bundle media/binary dirs into functions
  // (they're served from the CDN). Fixes the api/plate-builder 250MB limit — the
  // route reads style refs via a dynamic path, so the tracer conservatively pulls
  // in whole media dirs unless we exclude them here.
  outputFileTracingExcludes: {
    "*": [
      "public/videos/**",
      "public/images/**",
      "public/book/**",
      "Food Images/**",
      "remotion/**",
    ],
  },
  // …but plate-builder DOES read these 5 small style refs at runtime, so force them
  // back into that one function.
  outputFileTracingIncludes: {
    "/api/plate-builder": [
      "public/plate-builder/food-1.webp",
      "public/plate-builder/food-2.webp",
      "public/plate-builder/food-3.webp",
      "Food Images/Food 8.0.png",
      "Food Images/Food 9.0.png",
    ],
  },
  async redirects() {
    return [
      { source: "/eatobetics", destination: "/glucose", permanent: true },
      { source: "/eatobetics/:path*", destination: "/glucose/:path*", permanent: true },
      { source: "/eatosports", destination: "/performance", permanent: true },
      { source: "/eatosports-assessment", destination: "/performance-assessment", permanent: true },
      { source: "/eatosports-assessment/:path*", destination: "/performance-assessment/:path*", permanent: true },
      // Legacy unguarded duplicate of the Mind assessment — send it through the
      // real foundation-first gate instead of the raw scoring page.
      { source: "/mind-assessment", destination: "/assessment/add/mind", permanent: true },
    ]
  },
  async headers() {
    // Baseline security headers applied to every response.
    // Content-Security-Policy. 'unsafe-inline'/'unsafe-eval' are required by
    // Next.js's inline runtime + the third-party SDKs below; the value still
    // restricts script/connect/frame origins, blocks plugins (object-src), and
    // locks base-uri/form-action/frame-ancestors. Tighten later with nonces.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://*.statsig.com https://js.stripe.com https://*.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      // data:/blob: media is needed by @remotion/player's silent-audio autoplay shim.
      "media-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.statsig.com https://api.stripe.com https://*.anthropic.com https://*.elevenlabs.io wss://*.elevenlabs.io https://*.openai.com https://*.vercel-insights.com https://*.sentry.io",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; ")

    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ]
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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

// Sentry: source-map upload only runs when SENTRY_AUTH_TOKEN is set (Vercel/CI
// build env), so `next build` never requires it locally. org/project fall back
// to the SENTRY_ORG/SENTRY_PROJECT env vars the SDK reads itself.
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
