import type { MetadataRoute } from "next"

const SITE_URL = "https://eatobiotics.com"

/**
 * Robots directives. Allows crawling of public marketing/content pages while
 * disallowing API routes, authenticated areas, demos, and the dev preview gate.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/account-you",
        "/account-you-live",
        "/admin",
        "/auth/",
        "/enter",
        "/demo",
        "/analyse-demo",
        "/login",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
