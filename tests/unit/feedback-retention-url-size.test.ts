/**
 * The retention sweep's `.delete().in("id", ids)` request must actually fit
 * on the wire (#237 pre-merge review).
 *
 * The fake in feedback-retention.test.ts models TABLE STATE — which rows
 * exist, which expire, what a delete returns. It cannot see request
 * SERIALIZATION, because it never constructs a URL: `.from(table).delete()`
 * on that fake is a plain object with a `.then()`, not a real PostgREST
 * query. So a batch size that produces an oversized request was invisible to
 * every test in that file, and stayed invisible right up until it was
 * measured against the real client.
 *
 * This file uses the REAL `@supabase/postgrest-js` client — the one actually
 * installed and actually used by `lib/supabase.ts` — with only `fetch`
 * stubbed, so the URL it builds is the URL that would really be sent. No
 * network call happens; the stub resolves before anything leaves the
 * process.
 *
 * `RETENTION_BATCH` is imported from the route, not restated, so this test
 * fails the moment the production constant changes without also being
 * re-measured — which is exactly what happened here: 500 was chosen without
 * this measurement and served a request 245% over the client's own limit.
 */
import { describe, it, expect } from "vitest"
import { PostgrestClient } from "@supabase/postgrest-js"
import { randomUUID } from "node:crypto"
import { RETENTION_BATCH } from "@/app/api/feedback/retention/route"

/** The real production REST base — conservative, not shortened for the test. */
const REST_BASE = "https://ephmojiwlcebenholhpc.supabase.co/rest/v1"

/** `@supabase/postgrest-js`'s own default; its error hints warn about this exact shape. */
const CLIENT_URL_LENGTH_LIMIT = 8000

type Captured = { url: string; headers: Record<string, string> }

/** A client whose `fetch` never leaves the process — it captures the request and resolves. */
function clientCapturingRequest(): { client: PostgrestClient; captured: () => Captured } {
  let captured: Captured | null = null
  const fetchStub: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const headers: Record<string, string> = {}
    new Headers(init?.headers).forEach((v, k) => { headers[k] = v })
    captured = { url, headers }
    return new Response(null, { status: 200, headers: { "content-range": "0-0/0" } })
  }
  const client = new PostgrestClient(REST_BASE, { fetch: fetchStub })
  return {
    client,
    captured: () => {
      if (!captured) throw new Error("no request was captured — the query never ran")
      return captured
    },
  }
}

function fullBatchOfIds(): string[] {
  return Array.from({ length: RETENTION_BATCH }, () => randomUUID())
}

describe("the retention sweep's delete request fits on the wire", () => {
  it(`a full batch of ${RETENTION_BATCH} ids stays under the client's own ${CLIENT_URL_LENGTH_LIMIT}-char limit`, async () => {
    const { client, captured } = clientCapturingRequest()
    const ids = fullBatchOfIds()

    await client.from("feedback").delete({ count: "exact" }).in("id", ids)

    const { url } = captured()
    expect(
      url.length,
      `a full batch (${RETENTION_BATCH} ids) produced a ${url.length}-char URL — ` +
        `at 500 this was 19567 chars, 245% over the client's own limit`,
    ).toBeLessThan(CLIENT_URL_LENGTH_LIMIT)
  })

  it("asks for count=exact and NOT return=representation", async () => {
    // return=representation is what makes db-max-rows bound the RESPONSE —
    // the defect the id-batch design exists to avoid reintroducing.
    const { client, captured } = clientCapturingRequest()
    await client.from("feedback").delete({ count: "exact" }).in("id", fullBatchOfIds())

    const prefer = captured().headers["prefer"] ?? ""
    expect(prefer).toMatch(/count=exact/)
    expect(prefer).not.toMatch(/return=representation/)
  })

  it("the filter contains only the ids given — no content, no other column", async () => {
    const { client, captured } = clientCapturingRequest()
    const ids = fullBatchOfIds()
    await client.from("feedback").delete({ count: "exact" }).in("id", ids)

    const { url } = captured()
    const filter = decodeURIComponent(new URL(url).searchParams.get("id") ?? "")
    expect(filter.startsWith("in.(") && filter.endsWith(")")).toBe(true)

    const listed = filter.slice("in.(".length, -1).split(",")
    expect(listed.sort()).toEqual([...ids].sort())

    // No other query param exists that could carry customer text.
    expect([...new URL(url).searchParams.keys()].sort()).toEqual(["id"])
    for (const forbidden of ["message", "comment", "rating", "select"]) {
      expect(url).not.toContain(forbidden)
    }
  })

  it("sabotage: at the old batch of 500 this same assertion fails", async () => {
    // Proves the test bites, using the exact regression that shipped: nobody
    // measured the real request before choosing 500.
    const { client, captured } = clientCapturingRequest()
    const oversizedBatch = Array.from({ length: 500 }, () => randomUUID())

    await client.from("feedback").delete({ count: "exact" }).in("id", oversizedBatch)

    const { url } = captured()
    // This is the failure this whole file exists to catch — asserted as a
    // FACT here (a batch of 500 exceeds the limit), not hidden by inverting
    // the expectation. The passing tests above are the real regression guard;
    // this one documents why 100 was chosen instead of 500.
    expect(url.length).toBeGreaterThan(CLIENT_URL_LENGTH_LIMIT)
    expect(RETENTION_BATCH, "the shipped batch must not be the oversized one").toBeLessThan(500)
  })
})
