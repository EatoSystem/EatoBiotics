/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    // Baseline security headers applied to every response. (A full
    // Content-Security-Policy is intentionally omitted here because the app
    // loads several third-party scripts — PostHog, Statsig, Stripe, Vercel —
    // and a misconfigured CSP would silently break them; add one deliberately
    // with those origins allowlisted if/when needed.)
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
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.statsig.com https://api.stripe.com https://*.anthropic.com https://*.elevenlabs.io wss://*.elevenlabs.io https://*.openai.com https://*.vercel-insights.com",
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

export default nextConfig
