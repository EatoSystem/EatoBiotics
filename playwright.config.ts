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
  testDir: "tests/a11y",
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
    },
  },
})
