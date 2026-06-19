import type Stripe from "stripe"
import { getProfile, type SubScores } from "@/lib/assessment-scoring"

export type PaidReportTier = "personal" | "starter" | "full" | "premium"

export type PaidReportSummary = {
  tier: PaidReportTier
  overall: number
  subScores: Record<string, number>
  profile: {
    type: string
    tagline: string
    description: string
    color?: string
  }
  email?: string | null
}

type CompactPaidReportSummary = {
  v: 2
  t: PaidReportTier
  o: number
  s: {
    p?: number // prebiotics
    r?: number // probiotics
    b?: number // postbiotics
    f?: number // feed
    d?: number // seed
    h?: number // heal
  }
  e?: string | null
}

const VALID_TIERS: PaidReportTier[] = ["personal", "starter", "full", "premium"]

function isPaidReportTier(value: unknown): value is PaidReportTier {
  return typeof value === "string" && VALID_TIERS.includes(value as PaidReportTier)
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function compactSubScores(subScores: Record<string, number>): CompactPaidReportSummary["s"] {
  return {
    p: finiteNumber(subScores.prebiotics) ? subScores.prebiotics : undefined,
    r: finiteNumber(subScores.probiotics) ? subScores.probiotics : undefined,
    b: finiteNumber(subScores.postbiotics) ? subScores.postbiotics : undefined,
    f: finiteNumber(subScores.feed) ? subScores.feed : undefined,
    d: finiteNumber(subScores.seed) ? subScores.seed : undefined,
    h: finiteNumber(subScores.heal) ? subScores.heal : undefined,
  }
}

function expandSubScores(compact: CompactPaidReportSummary["s"]): SubScores {
  const prebiotics = finiteNumber(compact.p) ? compact.p : finiteNumber(compact.f) ? compact.f : 0
  const probiotics = finiteNumber(compact.r) ? compact.r : finiteNumber(compact.d) ? compact.d : 0
  const postbiotics = finiteNumber(compact.b) ? compact.b : finiteNumber(compact.h) ? compact.h : 0

  return {
    prebiotics,
    probiotics,
    postbiotics,
    feed: finiteNumber(compact.f) ? compact.f : prebiotics,
    seed: finiteNumber(compact.d) ? compact.d : probiotics,
    heal: finiteNumber(compact.h) ? compact.h : postbiotics,
  }
}

function decodeCompactSummary(parsed: Record<string, unknown>): PaidReportSummary | null {
  if (parsed.v !== 2) return null
  if (!isPaidReportTier(parsed.t)) return null
  if (!finiteNumber(parsed.o)) return null
  if (!parsed.s || typeof parsed.s !== "object") return null

  const subScores = expandSubScores(parsed.s as CompactPaidReportSummary["s"])
  const profile = getProfile(parsed.o, subScores)

  return {
    tier: parsed.t,
    overall: parsed.o,
    subScores: subScores as unknown as Record<string, number>,
    profile,
    email: typeof parsed.e === "string" ? parsed.e : null,
  }
}

function decodeLegacySummary(parsed: Partial<PaidReportSummary>): PaidReportSummary | null {
  if (!isPaidReportTier(parsed.tier)) return null
  if (!finiteNumber(parsed.overall)) return null
  if (!parsed.subScores || typeof parsed.subScores !== "object") return null
  if (!parsed.profile || typeof parsed.profile !== "object") return null
  if (typeof parsed.profile.type !== "string") return null
  if (typeof parsed.profile.tagline !== "string") return null
  if (typeof parsed.profile.description !== "string") return null

  return {
    tier: parsed.tier,
    overall: parsed.overall,
    subScores: parsed.subScores as Record<string, number>,
    profile: {
      type: parsed.profile.type,
      tagline: parsed.profile.tagline,
      description: parsed.profile.description,
      color: typeof parsed.profile.color === "string" ? parsed.profile.color : undefined,
    },
    email: typeof parsed.email === "string" ? parsed.email : null,
  }
}

export function encodePaidReportSummary(summary: PaidReportSummary): string {
  // Stripe metadata values are limited, so store the smallest canonical payload.
  // The profile copy is deterministic and can be rebuilt from overall + subScores.
  const compact: CompactPaidReportSummary = {
    v: 2,
    t: summary.tier,
    o: summary.overall,
    s: compactSubScores(summary.subScores),
    e: summary.email ?? null,
  }

  return Buffer.from(JSON.stringify(compact), "utf-8").toString("base64")
}

export function decodePaidReportSummary(encoded: string | null | undefined): PaidReportSummary | null {
  if (!encoded) return null

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8")) as Record<string, unknown>

    if (parsed.v === 2) {
      return decodeCompactSummary(parsed)
    }

    return decodeLegacySummary(parsed as Partial<PaidReportSummary>)
  } catch {
    return null
  }
}

export function getPaidReportSummaryFromSession(session: Stripe.Checkout.Session): PaidReportSummary | null {
  // New MVP flow stores the payload in metadata because Stripe limits client_reference_id to 200 chars.
  // The encoded metadata is compact so it stays below Stripe's metadata value limit.
  // The legacy client_reference_id fallback keeps older checkout sessions readable.
  return decodePaidReportSummary(session.metadata?.result_summary ?? session.client_reference_id)
}

export function isCheckoutSessionSettled(session: Stripe.Checkout.Session): boolean {
  // Stripe may mark 100% promo-code checkouts as "no_payment_required".
  // Treat that as settled so free-code demos unlock the paid report flow.
  return session.payment_status === "paid" || session.payment_status === "no_payment_required"
}

export function displayTierForReport(tier: PaidReportTier): "starter" | "full" | "premium" {
  if (tier === "starter") return "starter"
  if (tier === "premium") return "premium"
  return "full"
}
