import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { ReactElement } from "react"

import { createDeterministicConsultationSnapshot } from "@/lib/consultation/session-envelope"
import { NEW_DETERMINISTIC_CLAIM_FLAG } from "@/lib/consultation/persisted-activation-policy"

/**
 * Which flow a paid customer actually reaches — Phase 3C-C2B repair round.
 *
 * ══ WHY THIS IS BEHAVIOURAL AND NOT A SOURCE-TEXT GUARD ═════════════════════
 *
 * The structural guards elsewhere prove the page NAMES the right gate in the
 * right place. They cannot prove what a request ends up rendering, and the
 * defect this round fixes was exactly a question of outcome: with the rollout
 * flag switched off, a customer who had already been claimed into a
 * deterministic Consultation was redirected away from the only flow that could
 * read their answers. Every source guard passed while that was true.
 *
 * So this calls the real page with real `searchParams`, against a fake row, and
 * asks what came back. The harness is the one established in
 * `paid-page-fail-closed.test.ts`, including its two load-bearing rules:
 *
 *   1. NODE_ENV is never stubbed to "production" — it breaks vitest's JSX
 *      runtime, and a page that throws for that reason looks exactly like a
 *      page that refused. Production is simulated with VERCEL_ENV, which is
 *      what both policies consult first anyway.
 *   2. A refusal must be a NEXT_REDIRECT. "It threw" is not evidence of a gate.
 */

/* ── Marker components, so the rendered element identifies the flow ──────── */
const LegacyMarker = () => null
const PersistedMarker = () => null

vi.mock("@/components/assessment/deep/deep-assessment-client", () => ({
  DeepAssessmentClient: LegacyMarker,
}))
vi.mock("@/components/assessment/consultation/persisted-consultation-client", () => ({
  PersistedConsultationClient: PersistedMarker,
}))
vi.mock("@/components/analytics/track-conversion", () => ({ TrackConversion: () => null }))

const mockGetSupabase = vi.fn()
const mockRetrieveSession = vi.fn()
const mockResolveSummary = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => mockRetrieveSession(...a) } } },
}))
vi.mock("@/lib/paid-report-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paid-report-session")>()
  return { ...actual, resolvePaidReportSummary: (...a: unknown[]) => mockResolveSummary(...a) }
})

/* ── A fake row store that also records writes ───────────────────────────── */
type Row = Record<string, unknown>

function makeDb(seed: Row | null) {
  const rows = new Map<string, Row>()
  if (seed) rows.set(String(seed.stripe_session_id), { ...seed })
  const writes: Row[] = []

  const from = () => {
    let action: "select" | "update" | "insert" = "select"
    let payload: Row = {}
    let key: string | null = null
    const preds: Array<(r: Row) => boolean> = []

    const chain: Record<string, unknown> = {
      select: () => chain,
      update(p: Row) {
        action = "update"
        payload = p
        writes.push(p)
        return chain
      },
      insert(p: Row) {
        action = "insert"
        payload = p
        writes.push(p)
        return chain
      },
      eq(col: string, val: unknown) {
        if (col === "stripe_session_id") key = String(val)
        else preds.push((r) => r[col] === val)
        return chain
      },
      is(col: string, val: unknown) {
        preds.push((r) => (r[col] ?? null) === val)
        return chain
      },
      maybeSingle: () => run(),
      single: () => run(),
      then: (res: (v: unknown) => void, rej?: (e: unknown) => void) => run().then(res, rej),
    }

    async function run(): Promise<{ data: unknown; error: unknown }> {
      if (action === "select") {
        return { data: (key !== null ? rows.get(key) : undefined) ?? null, error: null }
      }
      if (action === "insert") {
        const k = String(payload.stripe_session_id)
        // `stripe_session_id` is UNIQUE in production.
        if (rows.has(k)) return { data: null, error: { code: "23505", message: "duplicate key" } }
        rows.set(k, { ...payload })
        return { data: [rows.get(k)], error: null }
      }
      const row = key !== null ? rows.get(key) : undefined
      if (!row || !preds.every((p) => p(row))) return { data: [], error: null }
      Object.assign(row, payload)
      return { data: [{ stripe_session_id: key }], error: null }
    }
    return chain
  }

  return { client: { from }, rows, writes, row: () => [...rows.values()][0] ?? null }
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */
const SESSION = "cs_test_page_dispatch"

const snapshot = () =>
  createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null })

const LEGACY_QUESTIONS = [{ id: "dq1", text: "How is your digestion?", type: "scale" }]

const baseRow = (over: Row = {}): Row => ({
  stripe_session_id: SESSION,
  tier: "personal",
  status: "in_progress",
  questions: null,
  answers: null,
  report_json: null,
  updated_at: null,
  ...over,
})

type PageModule = { default: (props: never) => Promise<ReactElement> }
type Outcome =
  | { flow: "legacy" | "persisted" }
  | { flow: "redirected" }
  | { flow: "other"; detail: string }

/** Call the real page and say which flow it produced. */
async function visit(params: Record<string, string> = { session_id: SESSION }): Promise<Outcome> {
  const mod = (await import("@/app/assessment/deep/page")) as unknown as PageModule
  try {
    const element = await mod.default({ searchParams: Promise.resolve(params) } as never)
    const found = new Set<unknown>()
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return void node.forEach(walk)
      if (!node || typeof node !== "object") return
      const el = node as { type?: unknown; props?: { children?: unknown } }
      if (el.type) found.add(el.type)
      if (el.props?.children) walk(el.props.children)
    }
    walk(element)
    if (found.has(PersistedMarker)) return { flow: "persisted" }
    if (found.has(LegacyMarker)) return { flow: "legacy" }
    return { flow: "other", detail: [...found].map((t) => String((t as { name?: string })?.name)).join(",") }
  } catch (err) {
    const message = (err as Error)?.message ?? String(err)
    // A refusal must be a redirect. A crash is not a gate.
    if (message.includes("NEXT_REDIRECT")) return { flow: "redirected" }
    return { flow: "other", detail: message }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.unstubAllEnvs()
  // The unverified-paid-flow bypass has its own policy and its own tests; it
  // must be off here or it short-circuits the dispatcher under test.
  vi.stubEnv("EATOBIOTICS_ALLOW_UNVERIFIED_PAID_FLOW", "")
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123")
  vi.spyOn(console, "error").mockImplementation(() => {})
  mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "paid", metadata: {} })
  mockResolveSummary.mockResolvedValue({
    tier: "personal",
    overall: 58,
    subScores: { prebiotics: 58 },
    profile: { type: "t", tagline: "t", description: "d" },
    foundationType: "you",
    selectedAddon: null,
  })
})
afterEach(() => vi.unstubAllEnvs())

/** A preview deployment: the runtime may serve the persisted stack. */
const preview = (flag: "on" | "off") => {
  vi.stubEnv("VERCEL_ENV", "preview")
  vi.stubEnv(NEW_DETERMINISTIC_CLAIM_FLAG, flag === "on" ? "true" : "")
}
/** The real deployment. */
const production = (flag: "on" | "off" = "on") => {
  vi.stubEnv("VERCEL_ENV", "production")
  vi.stubEnv(NEW_DETERMINISTIC_CLAIM_FLAG, flag === "on" ? "true" : "")
}

/* ══ Production is the firewall ════════════════════════════════════════════ */

describe("production cannot execute the deterministic paid flow", () => {
  it("1 — an unclaimed session is NOT claimed, even with the flag on", async () => {
    const db = makeDb(baseRow())
    mockGetSupabase.mockReturnValue(db.client)
    production("on")

    expect(await visit()).toEqual({ flow: "legacy" })
    expect(db.writes, "nothing may be claimed in production").toEqual([])
    expect(db.row()?.questions, "the row is untouched").toBeNull()
  })

  it("7 — a stored deterministic session fails closed rather than rendering", async () => {
    // It cannot be rendered (Migration 48 is unapplied, Phase 4A does not
    // exist) and it must not be cast into the legacy client either — a snapshot
    // object is not a question array, and pretending otherwise destroys the
    // Consultation. So: redirect.
    const db = makeDb(baseRow({ questions: snapshot() }))
    mockGetSupabase.mockReturnValue(db.client)
    production("on")

    expect(await visit()).toEqual({ flow: "redirected" })
    expect(db.writes).toEqual([])
  })
})

/* ══ The rollout decides who STARTS ════════════════════════════════════════ */

describe("in an eligible preview, the rollout gates new claims only", () => {
  it("2 — rollout off: an unclaimed session stays on the legacy path", async () => {
    const db = makeDb(baseRow())
    mockGetSupabase.mockReturnValue(db.client)
    preview("off")

    expect(await visit()).toEqual({ flow: "legacy" })
    expect(db.writes, "no claim without the opt-in").toEqual([])
  })

  it("3 — rollout on: an unclaimed session is claimed and renders persisted", async () => {
    const db = makeDb(baseRow())
    mockGetSupabase.mockReturnValue(db.client)
    preview("on")

    expect(await visit()).toEqual({ flow: "persisted" })
    expect(db.row()?.questions, "a snapshot was installed").toMatchObject({
      foundation: "you",
      entitledLens: null,
    })
  })
})

/* ══ …and never who CONTINUES ══════════════════════════════════════════════ */

describe("an existing deterministic session is never re-decided by the rollout", () => {
  it("4 — rollout on: a stored deterministic session resumes", async () => {
    const db = makeDb(baseRow({ questions: snapshot() }))
    mockGetSupabase.mockReturnValue(db.client)
    preview("on")

    expect(await visit()).toEqual({ flow: "persisted" })
  })

  it("5 — rollout OFF: the SAME session still resumes", async () => {
    /*
     * The defect this repair round exists to fix.
     *
     * The customer is mid-Consultation. Their answers are in the row. Switching
     * the rollout off is a decision about who STARTS one — turning it into a
     * decision about them would redirect them away from the only flow that can
     * read their work, on a config change they did nothing to cause.
     */
    const db = makeDb(baseRow({ questions: snapshot() }))
    mockGetSupabase.mockReturnValue(db.client)
    preview("off")

    expect(await visit()).toEqual({ flow: "persisted" })
    expect(db.writes, "and resuming writes nothing").toEqual([])
  })

  it("6 — a stored LEGACY session stays legacy whichever way the flag is set", async () => {
    // The mirror image, and equally destructive if it drifted: casting a
    // generated question array into a frozen snapshot loses the questions the
    // customer was actually asked.
    for (const flag of ["on", "off"] as const) {
      vi.resetModules()
      const db = makeDb(baseRow({ questions: LEGACY_QUESTIONS }))
      mockGetSupabase.mockReturnValue(db.client)
      preview(flag)

      expect(await visit(), `flag ${flag}`).toEqual({ flow: "legacy" })
      expect(db.row()?.questions, "the stored questions are untouched").toEqual(LEGACY_QUESTIONS)
    }
  })
})

/* ══ Nothing in the URL can move either gate ═══════════════════════════════ */

describe("query parameters enable neither eligibility nor claiming", () => {
  it("8a — ?deterministic=true does not activate the paid flow in production", async () => {
    // The preview parameter is nested inside the `demo=true` gate and reads no
    // database at all. Alone, on a paid session, it must change nothing.
    const db = makeDb(baseRow())
    mockGetSupabase.mockReturnValue(db.client)
    production("off")

    expect(await visit({ session_id: SESSION, deterministic: "true" })).toEqual({ flow: "legacy" })
    expect(db.writes).toEqual([])
  })

  it("8b — ?deterministic=true does not claim a session while the rollout is off", async () => {
    const db = makeDb(baseRow())
    mockGetSupabase.mockReturnValue(db.client)
    preview("off")

    expect(await visit({ session_id: SESSION, deterministic: "true" })).toEqual({ flow: "legacy" })
    expect(db.writes, "a query parameter is not an opt-in").toEqual([])
  })

  it("8c — ?foundation=family cannot change what a claimed Consultation asks", async () => {
    // The snapshot is FROZEN at claim time, so a URL-chosen foundation would
    // not be a bad answer for one request — it would be a bad Consultation.
    const db = makeDb(baseRow())
    mockGetSupabase.mockReturnValue(db.client)
    preview("on")

    expect(await visit({ session_id: SESSION, foundation: "family" })).toEqual({ flow: "persisted" })
    expect(db.row()?.questions).toMatchObject({ foundation: "you" })
  })
})

/* ══ Unreadable stays unreadable ═══════════════════════════════════════════ */

describe("a stored value neither parser recognises fails closed", () => {
  it("is redirected rather than guessed at, in an otherwise eligible runtime", async () => {
    const db = makeDb(baseRow({ questions: { some: "shape nothing writes" } }))
    mockGetSupabase.mockReturnValue(db.client)
    preview("on")

    expect(await visit()).toEqual({ flow: "redirected" })
    expect(db.writes).toEqual([])
  })
})
