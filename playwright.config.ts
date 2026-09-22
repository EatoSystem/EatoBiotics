import { defineConfig } from "@playwright/test"

/**
 * Playwright config for the accessibility smoke suite (tests/a11y/).
 * Runs against a production build: `npm run build && npx playwright test`.
 * The webServer starts `next start` with the preview password gate disabled
 * so pages render their real content instead of redirecting to /enter.
 *
 * Unit tests stay in Vitest (tests/**\/*.test.ts) — the two runners don't
 * overlap: Playwright only matches *.spec.ts under tests/a11y.
 */
export default defineConfig({
  // Widened from "tests/a11y" so the Phase 3B deterministic-Consultation
  // preview flow (tests/e2e/) runs in the same command. Vitest matches
  // tests/**/*.test.ts, so the two runners still do not overlap.
  testDir: "tests",
  testMatch: "**/*.spec.ts",
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    // NOT set: reducedMotion: "reduce" — deliberately, and it is the single
    // biggest limitation of this suite. See the coverage note in
    // tests/a11y/smoke.spec.ts before changing it.
    // In environments with a preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH),
    // point at it directly instead of downloading a version-pinned build.
    // CI installs its own via `npx playwright install chromium`, where this
    // env var is unset and launchOptions stays empty.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Render real pages, not the /enter waitlist gate.
      EATOBIOTICS_PASSWORD_GATE_DISABLED: "true",
      // `next start` sets NODE_ENV=production, and fail-closed policies read
      // that as "the real deployment" and deny — correctly, since they cannot
      // otherwise tell a local test server from production. Declaring what this
      // runtime actually is lets the preview-only canonical Report page render
      // so it can be scanned, without loosening the policy for anyone else.
      // It does NOT enable new deterministic claims: those still require
      // EATOBIOTICS_ENABLE_PERSISTED_CONSULTATION_PREVIEW, which is unset here.
      VERCEL_ENV: "preview",
      // A test-only admin secret so tests/e2e/publishing-exports.spec.ts can
      // prove BOTH sides of the publishing-export gate: refused without a
      // valid admin cookie, served with one. Without a secret configured,
      // verifyAdminCookieEdge fails closed and only the refusal is testable,
      // which would leave "an author can still do their job" unproven.
      //
      // It changes nothing for the other suites: an unauthenticated request
      // is still refused, so the /cms default-deny assertions stand.
      ADMIN_PASSWORD: "playwright-admin-secret",
    },
  },
})
