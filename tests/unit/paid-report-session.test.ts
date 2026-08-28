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
  getPaidReportSummaryFromSession,
  STRIPE_METADATA_VALUE_LIMIT,
  type PaidReportSummary,
} from "@/lib/paid-report-session"

const base: PaidReportSummary = {
  tier: "personal",
  overall: 72,
  subScores: { prebiotics: 60, probiotics: 80, postbiotics: 76 },
  profile: { type: "Grower", tagline: "On the up", description: "..." },
  email: "jason@example.com",
}

const sessionWithMetadata = (
  metadata: Record<string, string>,
  client_reference_id: string | null = null
): Parameters<typeof getPaidReportSummaryFromSession>[0] =>
  ({ metadata, client_reference_id }) as Parameters<typeof getPaidReportSummaryFromSession>[0]

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

  it("splits a real checkout summary into Stripe-safe metadata values", () => {
    const summary: PaidReportSummary = {
      tier: "personal",
      overall: 56,
      subScores: {
        prebiotics: 44,
        probiotics: 66,
        postbiotics: 67,
        feed: 44,
        seed: 66,
        heal: 67,
      },
      profile: {
        type: "Emerging Balance",
        tagline: "The pieces show up in your answers; the pattern is not yet steady.",
        description:
          "Your answers suggest the pieces are present but not yet settled into a daily rhythm. This pattern may indicate that repetition, rather than knowledge, is the gap. Small repeatable changes to any of the three pathways are a useful place to begin.",
        color: "var(--icon-lime)",
      },
      email: "buyer@example.com",
      foundationType: "you",
      selectedAddon: "glucose",
    }

    // The writer is gone (#244) — the summary no longer reaches Stripe at all.
    // What still has to work is READING a session created before that change,
    // because those buyers have already paid. So the chunks are built here the
    // way the retired writer built them, and the decoder must still handle them.
    const encoded = encodePaidReportSummary(summary)
    expect(encoded.length).toBeGreaterThan(STRIPE_METADATA_VALUE_LIMIT)

    const chunks = encoded.match(new RegExp(`.{1,${STRIPE_METADATA_VALUE_LIMIT}}`, "g")) ?? []
    expect(chunks.length).toBeGreaterThan(1)
    const metadata: Record<string, string> = { result_summary_parts: String(chunks.length) }
    chunks.forEach((chunk, index) => {
      metadata[`result_summary_${index}`] = chunk
    })

    const decoded = getPaidReportSummaryFromSession(sessionWithMetadata(metadata))
    expect(decoded).toMatchObject({
      tier: "personal",
      overall: 56,
      email: "buyer@example.com",
      foundationType: "you",
      selectedAddon: "glucose",
    })
    expect(decoded?.profile.description).toBe(summary.profile.description)
  })

  it("still reads legacy single-field metadata summaries", () => {
    const encoded = encodePaidReportSummary(base)
    const decoded = getPaidReportSummaryFromSession(sessionWithMetadata({ result_summary: encoded }))
    expect(decoded?.email).toBe("jason@example.com")
  })
})
