import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"

import { createAnswerAutosave, type SendResult, type AutosaveStatus } from "@/lib/assessment/answer-autosave"

/**
 * Autosave sequencing (#227).
 *
 * The server merges one answer per request, so two saves for DIFFERENT
 * questions are safe in any order. Two saves for the SAME question are not:
 * one value has to win, and the server can only pick whichever arrived last.
 *
 * The questionnaire generates same-question saves on every keystroke, every
 * slider step and every multi-select toggle. So "last to arrive" being decided
 * by the network is not a theoretical concern — it is the normal case, and it
 * means a customer's finished sentence can be overwritten by an earlier draft
 * of itself.
 *
 * These tests are written against a transport that is FREE to reorder, and
 * assert the customer-visible outcome: what is stored at the end is the last
 * thing the customer did.
 */

/* ── A transport whose completion order is not the issue order ──────────── */

type Sent = { id: string; value: unknown; settle: (r: SendResult) => void }

function transport(defaultResult: SendResult = { ok: true }) {
  const issued: Sent[] = []
  const outstanding: Sent[] = []
  /** What the server would hold, applied in COMPLETION order. */
  const store: Record<string, unknown> = {}

  const send = (id: string, value: unknown): Promise<SendResult> =>
    new Promise<SendResult>((resolve) => {
      const entry: Sent = {
        id,
        value,
        settle: (r) => {
          if (r.ok) store[id] = value
          const i = outstanding.indexOf(entry)
          if (i >= 0) outstanding.splice(i, 1)
          resolve(r)
        },
      }
      issued.push(entry)
      outstanding.push(entry)
    })

  /**
   * Settle everything outstanding in REVERSE order of issue, repeatedly, until
   * nothing new appears. Reverse is the adversarial choice: it is the ordering
   * under which an unsequenced client stores its OLDEST value.
   */
  async function settleReverseOrder(result: SendResult = defaultResult) {
    for (let pass = 0; pass < 50 && outstanding.length > 0; pass++) {
      const batch = [...outstanding].reverse()
      for (const s of batch) s.settle(result)
      await vi.advanceTimersByTimeAsync(2000)
    }
  }

  return { issued, outstanding, store, send, settleReverseOrder }
}

const values = (t: ReturnType<typeof transport>) => t.issued.map((s) => s.value)

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/* ══ Ordering ═══════════════════════════════════════════════════════════ */

describe("the value the customer last chose is the value that ends up stored", () => {
  it("A then B lands as B, even when the network completes B first and A last", async () => {
    // The scenario the old client could not survive: the earlier request is
    // the one that finishes last. With one request in flight per question
    // there is nothing for the network to reorder — A is fully settled before
    // B is issued — so B is the last write regardless of transport behaviour.
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100 })

    save.queue("dq1", "A")
    await vi.advanceTimersByTimeAsync(100)
    expect(t.outstanding.length, "A must be on the wire").toBe(1)

    save.queue("dq1", "B")
    await vi.advanceTimersByTimeAsync(100)
    expect(
      t.issued.length,
      "B must NOT be issued while A is in flight — that is the reordering window",
    ).toBe(1)

    await t.settleReverseOrder()

    expect(values(t)).toEqual(["A", "B"])
    expect(t.store.dq1, "the stored answer must be the customer's latest, not the earlier one").toBe("B")
  })

  it("a burst of keystrokes stores the finished sentence, not a prefix of it", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100 })

    // Typing. Under the old client this was one unsequenced request each.
    for (const text of ["I", "I t", "I ta", "I take", "I take a probiotic"]) {
      save.queue("dq_text", text)
      await vi.advanceTimersByTimeAsync(20)
    }
    expect(t.issued.length, "nothing goes out mid-burst").toBe(0)

    await vi.advanceTimersByTimeAsync(100)
    await t.settleReverseOrder()

    expect(t.issued.length, "keystrokes must coalesce, not become five requests").toBe(1)
    expect(t.store.dq_text).toBe("I take a probiotic")
  })

  it("an intermediate value superseded while a request is in flight is never sent", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100 })

    save.queue("dq1", "first")
    await vi.advanceTimersByTimeAsync(100)

    save.queue("dq1", "second")
    await vi.advanceTimersByTimeAsync(100)
    save.queue("dq1", "third")
    await vi.advanceTimersByTimeAsync(100)

    await t.settleReverseOrder()

    // "second" was overtaken before it ever reached the wire. Sending it would
    // put a stale value in the race for no reason.
    expect(values(t)).toEqual(["first", "third"])
    expect(t.store.dq1).toBe("third")
  })

  it("different questions may overlap — the server merges those", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100 })

    save.queue("dq1", "A")
    save.queue("dq2", "B")
    await vi.advanceTimersByTimeAsync(100)

    expect(t.outstanding.length, "cross-question saves must not be serialised").toBe(2)

    await t.settleReverseOrder()
    expect(t.store).toEqual({ dq1: "A", dq2: "B" })
  })
})

/* ══ Failure handling ═══════════════════════════════════════════════════ */

describe("a save that fails is retried, and a save that cannot succeed is admitted", () => {
  it("retries a transient failure and reports saved once it lands", async () => {
    const t = transport()
    const seen: AutosaveStatus[] = []
    const save = createAnswerAutosave({
      send: t.send,
      debounceMs: 100,
      retryDelayMs: 200,
      onStatus: (s) => seen.push(s),
    })

    save.queue("dq1", "yes")
    await vi.advanceTimersByTimeAsync(100)
    t.outstanding[0].settle({ ok: false, retryable: true })
    await vi.advanceTimersByTimeAsync(200)

    expect(t.issued.length, "a retryable failure must be retried").toBe(2)
    expect(t.issued[1].value, "the retry must carry the same value").toBe("yes")

    await t.settleReverseOrder()

    expect(save.status()).toBe("saved")
    expect(seen).not.toContain("unsaved")
  })

  it("does not retry a rejection the server will simply repeat", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100, retryDelayMs: 200 })

    save.queue("dq1", "yes")
    await vi.advanceTimersByTimeAsync(100)
    // e.g. 422 unknown question — identical every time.
    t.outstanding[0].settle({ ok: false, retryable: false })
    await vi.advanceTimersByTimeAsync(5000)

    expect(t.issued.length, "a permanent rejection must not be hammered").toBe(1)
    expect(save.status()).toBe("unsaved")
  })

  it("stops at the attempt budget and says so rather than retrying forever", async () => {
    const t = transport({ ok: false, retryable: true })
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100, retryDelayMs: 200, attempts: 3 })

    save.queue("dq1", "yes")
    await vi.advanceTimersByTimeAsync(100)
    await t.settleReverseOrder({ ok: false, retryable: true })
    await vi.advanceTimersByTimeAsync(5000)

    expect(t.issued.length, "attempts must be bounded").toBe(3)
    expect(save.status()).toBe("unsaved")
  })

  it("a thrown transport error is a retryable failure, not an unhandled rejection", async () => {
    const calls: string[] = []
    const save = createAnswerAutosave({
      send: async (id) => {
        calls.push(id)
        throw new Error("network down")
      },
      debounceMs: 100,
      retryDelayMs: 200,
      attempts: 2,
    })

    save.queue("dq1", "yes")
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(5000)

    expect(calls.length).toBe(2)
    expect(save.status()).toBe("unsaved")
  })

  it("a retry must not resurrect a value the customer has already replaced", async () => {
    // The newer value is queued while the failing request is STILL on the wire,
    // so the retry path has to choose between the value it was carrying and the
    // one now waiting. Restoring its own value here would both resend a stale
    // answer and discard the newer one outright.
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100, retryDelayMs: 500 })

    save.queue("dq1", "old")
    await vi.advanceTimersByTimeAsync(100)
    expect(t.outstanding.length, "\"old\" must be in flight").toBe(1)

    save.queue("dq1", "new")
    t.outstanding[0].settle({ ok: false, retryable: true })

    await vi.advanceTimersByTimeAsync(600)
    await t.settleReverseOrder()

    expect(values(t), "the superseded value must not be resent").toEqual(["old", "new"])
    expect(t.store.dq1, "the customer's latest value must not be discarded by a retry").toBe("new")
  })

  it("unsaved outranks saving, so a retry cycle never hides an unstored answer", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100, retryDelayMs: 200, attempts: 1 })

    save.queue("dq1", "a")
    await vi.advanceTimersByTimeAsync(100)
    t.outstanding[0].settle({ ok: false, retryable: true })
    await vi.advanceTimersByTimeAsync(10)
    expect(save.status()).toBe("unsaved")

    // A second question starts saving while dq1 is still unstored.
    save.queue("dq2", "b")
    await vi.advanceTimersByTimeAsync(100)
    expect(save.status(), "a save in progress must not mask a failed one").toBe("unsaved")
  })
})

/* ══ Flush ══════════════════════════════════════════════════════════════ */

describe("flush leaves nothing sitting in the debounce window", () => {
  it("sends a value still inside the debounce window and waits for it", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 5000 })

    save.queue("dq1", "typed but not yet sent")
    expect(t.issued.length, "still debouncing").toBe(0)

    const done = save.flush()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.issued.length, "flush must not wait out the debounce").toBe(1)

    await t.settleReverseOrder()
    expect(await done, "flush resolves true when everything landed").toBe(true)
    expect(t.store.dq1).toBe("typed but not yet sent")
  })

  it("resolves false when something could not be saved", async () => {
    const t = transport({ ok: false, retryable: false })
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100, attempts: 1 })

    save.queue("dq1", "yes")
    const done = save.flush()
    await t.settleReverseOrder({ ok: false, retryable: false })

    expect(await done).toBe(false)
    expect(save.status()).toBe("unsaved")
  })

  it("flushes every question, not just the most recent one", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 5000 })

    save.queue("dq1", "a")
    save.queue("dq2", "b")
    save.queue("dq3", "c")

    const done = save.flush()
    await vi.advanceTimersByTimeAsync(0)
    await t.settleReverseOrder()

    expect(await done).toBe(true)
    expect(t.store).toEqual({ dq1: "a", dq2: "b", dq3: "c" })
  })

  it("retries inside flush instead of returning before the retry timer", async () => {
    let attempt = 0
    const save = createAnswerAutosave({
      send: async (): Promise<SendResult> => (++attempt === 1 ? { ok: false, retryable: true } : { ok: true }),
      debounceMs: 100,
      retryDelayMs: 10_000,
      attempts: 3,
    })

    save.queue("dq1", "yes")
    const done = save.flush()
    await vi.advanceTimersByTimeAsync(0)

    expect(await done, "flush must not give up on a value it can still retry").toBe(true)
    expect(attempt).toBe(2)
  })
})

/* ══ Lifecycle ══════════════════════════════════════════════════════════ */

/* ══ The questionnaire is actually wired to it ══════════════════════════ */

describe("the questionnaire routes every save through the queue", () => {
  /**
   * The queue above is only worth anything if the component uses it, and there
   * is no React test harness in this repo to prove that by rendering. These
   * read the source instead — deliberately narrow assertions on the four
   * behaviours that, if quietly dropped, put the answer-loss bug straight back:
   * saves go through the queue, the queue is flushed before leaving the page,
   * a failure is visible, and nothing bypasses the queue with its own fetch.
   */
  const FILE = "components/assessment/deep/deep-assessment-client.tsx"
  const src = readFileSync(FILE, "utf8")

  function body(fnSignature: string): string {
    const start = src.indexOf(fnSignature)
    expect(start, `${fnSignature} must exist in ${FILE}`).toBeGreaterThan(-1)
    const open = src.indexOf("{", start)
    let depth = 0
    for (let i = open; i < src.length; i++) {
      if (src[i] === "{") depth++
      else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1)
    }
    throw new Error(`unbalanced braces after ${fnSignature}`)
  }

  it("an answer change is queued, never fetched directly", () => {
    const handleAnswer = body("function handleAnswer(")
    expect(handleAnswer, "answer changes must go through the queue").toMatch(/autosave\?\.queue\(/)
    expect(
      handleAnswer,
      "a direct fetch here is the unsequenced save this whole change exists to remove",
    ).not.toMatch(/fetch\(/)
  })

  it("only the queue's own sender talks to the autosave endpoint", () => {
    const calls = [...src.matchAll(/fetch\(\s*"\/api\/save-deep-progress"/g)]
    expect(calls.length, "exactly one call site: the queue's `send`").toBe(1)
    // …and it must sit inside createAnswerAutosave's options, not loose in the
    // component.
    const queueBlock = src.slice(src.indexOf("createAnswerAutosave("))
    expect(queueBlock.slice(0, calls[0].index! - src.indexOf("createAnswerAutosave(") + 200)).toContain(
      "/api/save-deep-progress",
    )
  })

  it("pending saves are flushed before the questionnaire is submitted", () => {
    const submit = body("async function handleSubmit(")
    expect(submit, "leaving the page must not strand a value in the debounce window").toMatch(
      /await autosave\?\.flush\(\)/,
    )
    // …and before the submit request, not after it.
    expect(submit.indexOf("autosave?.flush()")).toBeLessThan(submit.indexOf("/api/submit-deep-assessment"))
  })

  it("a failed save is shown to the customer, without the server's words", () => {
    expect(src, "an unsaved answer must be visible, not silent").toMatch(/saveStatus === "unsaved"/)
    expect(src).toMatch(/role="status"/)
    // The response body is never read, so no server error text can reach the UI.
    expect(src).not.toMatch(/save-deep-progress[\s\S]{0,400}res\.json\(\)/)
  })

  it("a non-2xx response is a failure, not a swallowed promise", () => {
    expect(src, "the old `.catch(() => {})` swallowed every failure").not.toMatch(
      /save-deep-progress[\s\S]{0,400}\.catch\(\(\) =>/,
    )
    expect(src).toMatch(/if \(res\.ok\) return \{ ok: true \}/)
    expect(src, "transient failures retry; refusals do not").toMatch(/res\.status >= 500/)
  })
})

describe("lifecycle", () => {
  it("cancel drops pending work without sending it", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 1000 })

    save.queue("dq1", "a")
    save.cancel()
    await vi.advanceTimersByTimeAsync(5000)

    expect(t.issued.length).toBe(0)
  })

  it("starts idle and only reports saved once something actually saved", async () => {
    const t = transport()
    const save = createAnswerAutosave({ send: t.send, debounceMs: 100 })

    expect(save.status()).toBe("idle")
    save.queue("dq1", "a")
    expect(save.status()).toBe("saving")

    await vi.advanceTimersByTimeAsync(100)
    await t.settleReverseOrder()
    expect(save.status()).toBe("saved")
  })
})
