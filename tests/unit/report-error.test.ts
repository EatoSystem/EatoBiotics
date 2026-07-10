import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Proves lib/report-error's "never throws" guarantee, which call sites
 * (the Stripe webhook, submit-deep-assessment's partial-delivery alert)
 * rely on by awaiting it without a try/catch: even when the alert email
 * itself rejects, reportError must resolve.
 */

const mockSendEmail = vi.fn()
vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe("reportError", () => {
  it("resolves even when the alert email rejects", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("RESEND_API_KEY", "re_test_key")
    vi.stubEnv("OWNER_EMAIL", "owner@example.com")
    vi.stubEnv("EMAIL_FROM", "monitoring@eatobiotics.com")
    mockSendEmail.mockRejectedValue(new Error("Resend is down"))

    const { reportError } = await import("@/lib/report-error")

    await expect(reportError("test-context", new Error("boom"))).resolves.toBeUndefined()
    expect(mockSendEmail).toHaveBeenCalled()
  })

  it("resolves without emailing outside production", async () => {
    vi.stubEnv("NODE_ENV", "test")

    const { reportError } = await import("@/lib/report-error")

    await expect(reportError("test-context", "plain string detail")).resolves.toBeUndefined()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
