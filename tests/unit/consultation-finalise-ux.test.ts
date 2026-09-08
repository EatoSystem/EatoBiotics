import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  finaliseFrom,
  type NavigationDeps,
} from "@/components/assessment/consultation/consultation-navigation"
import {
  createHttpConsultationPersistence,
  type FinaliseOutcome,
} from "@/components/assessment/consultation/consultation-persistence"
import { hydratePersistedSession } from "@/components/assessment/consultation/persisted-consultation-client"
import { CURRENT_CONSULTATION_BANK } from "@/lib/consultation/bank-registry"
import { FINALISE_CODES } from "@/lib/consultation/finalise-codes"

/**
 * Finishing a Consultation, from the customer's side — Phase 3C-C2B.
 *
 * ══ THE TWO THINGS THAT MUST NEVER HAPPEN ═══════════════════════════════════
 *
 *  1. A seal that freezes a record missing the customer's last answer. The seal
 *     is write-once, so this is unrecoverable, and the evidence would be an
 *     answer still visible on their own screen. Hence: flush, THEN finalise —
 *     and only if the flush is confirmed.
 *  2. A completion screen shown for a finalisation that did not happen. That is
 *     a lie told to someone who has paid €49, and it stops them retrying the one
 *     action that would have worked.
 *
 * Everything below is one of those two properties, or the honesty of what is
 * said while neither has succeeded yet.
 *
 * ══ WHY NO RENDER ══════════════════════════════════════════════════════════
 *
 * This repository's vitest runs in `node` with no jsdom and no React Testing
 * Library. The ordering and the outcome mapping are therefore proven in the
 * pure functions that own them — which is where they belong anyway — and the
 * component's use of them is proven structurally.
 */

/* ── A deps stub that records the ORDER of what it was asked to do ───────── */
function deps(over: Partial<NavigationDeps> & { calls?: string[] } = {}) {
  const calls: string[] = over.calls ?? []
  const base: NavigationDeps = {
    flush: async () => {
      calls.push("flush")
      return true
    },
    finalise: async () => {
      calls.push("finalise")
      return { ok: true, handoffId: "hnd_1", finalisedAt: "2026-09-08T10:00:00.000Z" }
    },
    persistCursor: async () => ({ ok: true }),
    queueSkip: () => {},
    requestReview: async () => ({ ok: true }),
    leaveReview: async () => ({ ok: true }),
    ...(over as Partial<NavigationDeps>),
  }
  return { deps: base, calls }
}

/* ══ Ordering ══════════════════════════════════════════════════════════════ */

describe("the queue is flushed before anything is sealed", () => {
  it("flush runs first, and finalise runs second", async () => {
    const { deps: d, calls } = deps()
    await expect(finaliseFrom(d)).resolves.toEqual({ status: "finalised" })
    expect(calls, "reversing this order seals a record missing an answer").toEqual([
      "flush",
      "finalise",
    ])
  })

  it("a failed flush means finalise is never called at all", async () => {
    // Not "called and ignored" — never sent. A request that reached the server
    // could seal, and then the refusal shown to the customer would be false.
    const calls: string[] = []
    const { deps: d } = deps({
      calls,
      flush: async () => {
        calls.push("flush")
        return false
      },
    })
    await expect(finaliseFrom(d)).resolves.toEqual({ status: "save-failed" })
    expect(calls).toEqual(["flush"])
  })
})

/* ══ Outcomes ══════════════════════════════════════════════════════════════ */

describe("each server outcome maps to a distinct, honest attempt", () => {
  const attemptFor = async (outcome: FinaliseOutcome) => {
    const { deps: d } = deps({ finalise: async () => outcome })
    return finaliseFrom(d)
  }

  it("success is the only result that reports finalised", async () => {
    expect(await attemptFor({ ok: true, handoffId: "h", finalisedAt: "t" })).toEqual({
      status: "finalised",
    })
  })

  it("incomplete is carried through as incomplete", async () => {
    // The server re-derived completeness immediately before the write and says
    // something is outstanding. That is actionable, and distinct from a failure.
    expect(await attemptFor({ ok: false, kind: "incomplete" })).toEqual({
      status: "refused",
      kind: "incomplete",
    })
  })

  it("retryable and refused stay distinguishable", async () => {
    // One means "try again", the other means trying again cannot help. Collapsed
    // into one message, a customer either retries forever or gives up too early.
    expect(await attemptFor({ ok: false, kind: "retryable" })).toEqual({
      status: "refused",
      kind: "retryable",
    })
    expect(await attemptFor({ ok: false, kind: "refused" })).toEqual({
      status: "refused",
      kind: "refused",
    })
  })
})

/* ══ The HTTP adapter ══════════════════════════════════════════════════════ */

describe("the finalise request sends the session id and nothing else", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  const persistence = () => createHttpConsultationPersistence("cs_test_finalise_ux")
  const respond = (status: number, body: unknown = {}) =>
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })

  it("the body carries only sessionId — the client states no verdict", async () => {
    // Completeness, the trusted payload and the handoff identity are all the
    // server's. A body that carried any of them would be a browser asserting
    // what a paid record contains.
    respond(200, { handoffId: "hnd_1", finalisedAt: "2026-09-08T10:00:00.000Z" })
    await persistence().finalise()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/consultation/finalise")
    expect(JSON.parse(init.body as string)).toEqual({ sessionId: "cs_test_finalise_ux" })
  })

  it("only the explicit incomplete code is treated as incomplete", async () => {
    /*
     * The repair round's third fix, as a table.
     *
     * The route answers 409 to ten different situations and exactly ONE means
     * the customer still has something to answer. Classified by status, all ten
     * became "something still needs an answer" — nine customers sent hunting
     * for a question that does not exist, while the actual refusal (a legacy
     * row, a context conflict, an incoherent seal…) went unreported.
     *
     * The rule is an ALLOW-LIST, and the last three rows are why: a bare 409,
     * an unreadable body, and a code this build has never heard of must all
     * land in `refused`. A deny-list would classify a newer server's refusal as
     * an incomplete Consultation.
     */
    const cases: Array<[unknown, "incomplete" | "refused"]> = [
      [{ code: FINALISE_CODES.INCOMPLETE, missingQuestionIds: ["q1"] }, "incomplete"],
      [{ code: FINALISE_CODES.NOT_IN_REVIEW }, "refused"],
      [{ code: FINALISE_CODES.REVIEW_EDIT_ACTIVE }, "refused"],
      [{ code: FINALISE_CODES.SEAL_INCOHERENT }, "refused"],
      [{ code: FINALISE_CODES.SEAL_UNREADABLE }, "refused"],
      [{ code: FINALISE_CODES.MODE_CONFLICT }, "refused"],
      [{ code: FINALISE_CODES.CONTEXT_CONFLICT }, "refused"],
      [{ code: FINALISE_CODES.STATE_UNREADABLE }, "refused"],
      [{ code: FINALISE_CODES.BANK_UNAVAILABLE }, "refused"],
      [{ error: "This Consultation cannot be finished" }, "refused"],
      [{ code: "consultation_something_a_newer_server_added" }, "refused"],
      [null, "refused"],
    ]

    for (const [body, expected] of cases) {
      respond(409, body)
      expect(await persistence().finalise(), JSON.stringify(body)).toEqual({
        ok: false,
        kind: expected,
      })
    }
  })

  it("transient failures never depend on a body at all", async () => {
    // A 5xx or a rate limit says nothing about the Consultation, so there is no
    // code to read and none is required — including when the body is missing or
    // carries the incomplete code by accident.
    for (const status of [500, 502, 503, 429]) {
      respond(status, { code: FINALISE_CODES.INCOMPLETE })
      expect(await persistence().finalise(), `status ${status}`).toEqual({
        ok: false,
        kind: "retryable",
      })
    }
  })

  it("every other 4xx is refused, whatever it carries", async () => {
    for (const status of [400, 401, 402, 403, 404, 422]) {
      respond(status, { code: FINALISE_CODES.INCOMPLETE })
      expect(await persistence().finalise(), `status ${status}`).toEqual({
        ok: false,
        kind: "refused",
      })
    }
  })

  it("a 200 whose body cannot be read is NOT a completion", async () => {
    // Showing completion on an unreadable success is showing it on a guess.
    respond(200, { unexpected: true })
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "retryable" })
  })

  it("a network failure is retryable, never a completion", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "retryable" })
  })
})

/* ══ Structural: completion is only ever rendered on a server success ══════ */

describe("the component cannot show completion without the server", () => {
  const source = readFileSync(
    join(process.cwd(), "components/assessment/consultation/persisted-consultation-client.tsx"),
    "utf8",
  )

  it("setCompleted is called in exactly one place, on the finalised branch", () => {
    // An optimistic setCompleted anywhere else is the lie this whole file is
    // about. One call site keeps that reviewable in a diff.
    const calls = source.match(/setCompleted\(/g) ?? []
    expect(calls).toHaveLength(1)
    expect(source).toMatch(/attempt\.status === "finalised"\)\s*\{\s*setCompleted\(true\)/)
  })

  it("the finish handler goes through finaliseFrom, not straight to persistence", () => {
    // The ordering guarantee lives in `finaliseFrom`. A component that called
    // `finalise()` itself would be a second path with no flush in front of it.
    expect(source).toContain("await finaliseFrom(navigation)")
    expect(source).not.toMatch(/persistence\.finalise\(\)\s*$/m)
  })

  it("the completion early-return sits after every hook", () => {
    // React forbids a conditional hook. An early return above `useMemo` would
    // have changed the hook order the moment a customer finished — i.e. it
    // would have broken only in the success case, in production.
    const session = source.slice(source.indexOf("function PersistedConsultationSession"))
    const guard = session.indexOf("if (completed) return <ConsultationComplete />")
    const lastHook = session.lastIndexOf("useMemo(", guard === -1 ? undefined : session.length)
    expect(guard, "the completion guard must exist").toBeGreaterThan(-1)
    expect(guard, "the guard must come after the last hook").toBeGreaterThan(lastHook)
  })
})

/* ══ A finished Consultation loads as finished ═════════════════════════════ */

describe("a refresh after finishing shows completion, not a restart", () => {
  /**
   * Re-pointed by the C2B repair round.
   *
   * These used to feed `hydratePersistedSession` a SESSION payload whose phase
   * happened to be `ready-for-report`, and assert the client inferred
   * completion from it. That inference is now the server's statement: a sealed
   * Consultation comes back as its own `completed` kind, carrying only what
   * identifies it. The rule under test is unchanged — a finished Consultation
   * shows completion rather than restarting — but the evidence is now the
   * server's, which is where it belongs, and the REAL route is proven in
   * `consultation-persisted-integration.test.ts`.
   */
  const live = (over: Record<string, unknown> = {}) =>
    ({
      kind: "session",
      bankVersion: CURRENT_CONSULTATION_BANK,
      context: { foundation: "you" as const },
      candidateAnswers: {},
      touchedQuestionIds: [],
      skippedOptionalQuestionIds: [],
      currentQuestionId: null,
      phase: "review" as const,
      started: true,
      ...over,
    }) as Parameters<typeof hydratePersistedSession>[0]

  const completed = (bankVersion = CURRENT_CONSULTATION_BANK) =>
    ({
      kind: "completed",
      bankVersion,
      context: { foundation: "you" as const },
    }) as Parameters<typeof hydratePersistedSession>[0]

  it("a completion payload hydrates as completed", () => {
    expect(hydratePersistedSession(completed())).toEqual({ kind: "completed" })
  })

  it("completion carries no session, so nothing sealed can be edited", () => {
    const hydrated = hydratePersistedSession(completed())
    expect(hydrated.kind).toBe("completed")
    expect("session" in hydrated, "a sealed record must not rehydrate into questions").toBe(false)
  })

  it("a sealed Consultation resolves even when this build lost the bank", () => {
    // No bank is resolved on this path at all, which is what lets a historical
    // seal load. Refusing a finished customer over a bank they will never be
    // asked from again would be a regression, not a safety property — and the
    // server applies the same rule, so the two cannot disagree.
    expect(hydratePersistedSession(completed("consultation-v99"))).toEqual({ kind: "completed" })
  })

  it("every live phase still hydrates into a session", () => {
    for (const phase of ["questions", "review"] as const) {
      expect(hydratePersistedSession(live({ phase })).kind, `${phase} must still render`).toBe(
        "session",
      )
    }
  })

  it("an unknown bank on an UNSEALED session still throws", () => {
    // The completion branch is an exception for finished records only. A live
    // session resolved against the wrong bank is the failure the fingerprint
    // exists to prevent.
    expect(() => hydratePersistedSession(live({ bankVersion: "consultation-v99" }))).toThrow(
      "unknown-bank",
    )
  })
})
