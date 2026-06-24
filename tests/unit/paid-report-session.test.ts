/* ── Paid-report checkout payload round-trip ──────────────────────────────
   The €49 report's foundation/add-on architecture and scores travel through
   Stripe session metadata as a base64 JSON blob. These tests lock the
   encode/decode contract, the new foundation/add-on fields, and backward
   compatibility with legacy sessions that predate those fields.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import {
  encodePaidReportSummary,
  decodePaidReportSummary,
  type PaidReportSummary,
} from "@/lib/paid-report-session"

const base: PaidReportSummary = {
  tier: "personal",
  overall: 72,
  subScores: { prebiotics: 60, probiotics: 80, postbiotics: 76 },
  profile: { type: "Grower", tagline: "On the up", description: "..." },
  email: "jason@example.com",
}

describe("paid-report-session encode/decode", () => {
  it("round-trips a full summary including foundation + add-on", () => {
    const summary: PaidReportSummary = { ...base, foundationType: "family", selectedAddon: "glucose" }
    const decoded = decodePaidReportSummary(encodePaidReportSummary(summary))
    expect(decoded).not.toBeNull()
    expect(decoded).toMatchObject({
      tier: "personal",
      overall: 72,
      foundationType: "family",
      selectedAddon: "glucose",
    })
  })

  it("defaults foundation/add-on to null for a legacy payload without them", () => {
    // Simulate a session created before the new fields existed.
    const legacy = Buffer.from(
      JSON.stringify({ tier: "personal", overall: 50, subScores: {}, profile: base.profile, email: null }),
      "utf-8"
    ).toString("base64")
    const decoded = decodePaidReportSummary(legacy)
    expect(decoded).not.toBeNull()
    expect(decoded?.foundationType).toBeNull()
    expect(decoded?.selectedAddon).toBeNull()
  })

  it("rejects an invalid foundation/add-on value (coerces to null)", () => {
    const summary = { ...base, foundationType: "neighbour", selectedAddon: "telepathy" } as unknown as PaidReportSummary
    const decoded = decodePaidReportSummary(encodePaidReportSummary(summary))
    expect(decoded?.foundationType).toBeNull()
    expect(decoded?.selectedAddon).toBeNull()
  })

  it("returns null for malformed input", () => {
    expect(decodePaidReportSummary(null)).toBeNull()
    expect(decodePaidReportSummary("not-base64-json")).toBeNull()
    // valid base64 but missing required fields
    const bad = Buffer.from(JSON.stringify({ tier: "personal" }), "utf-8").toString("base64")
    expect(decodePaidReportSummary(bad)).toBeNull()
  })
})
