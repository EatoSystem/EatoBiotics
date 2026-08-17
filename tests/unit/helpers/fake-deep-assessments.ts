import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"

/**
 * A fake `deep_assessments` that enforces the constraints the route now
 * depends on, rather than replaying canned replies.
 *
 * The compare-and-set install is only correct because of two database
 * behaviours, both verified read-only against production
 * (`ephmojiwlcebenholhpc`):
 *
 *   - `stripe_session_id` is NOT NULL + UNIQUE — the table's primary key is
 *     `id`, but that column carries its own unique constraint — so a duplicate
 *     insert raises **23505**;
 *   - an UPDATE filtered on `questions IS NULL` touches zero rows once a
 *     snapshot has landed, and `.select()` reports how many rows it matched.
 *
 * A queue-of-replies stub cannot express either, so it would happily "pass"
 * against a route with the race still in it. Modelling the constraints means
 * two requests can share one table and "exactly one valid snapshot remains"
 * becomes something the test observes instead of infers.
 */

export type Row = Record<string, unknown>

export type FakeHooks = {
  beforeSelect?: (ctx: { seq: number }) => void | Promise<void>
  beforeInsert?: (ctx: { seq: number }) => void | Promise<void>
  beforeUpdate?: (ctx: { seq: number }) => void | Promise<void>
  /** Runs once the insert's outcome is known — lets a test release a loser at
   *  the exact moment the winner's install lands. */
  afterInsert?: (ctx: { seq: number; outcome: InsertOutcome }) => void | Promise<void>
}

export type InsertOutcome = "installed" | "conflict" | "error"

/**
 * One database operation and how it actually turned out, in order.
 *
 * Op names alone cannot distinguish "the loser re-read after losing" from "the
 * loser returned its own local object", because both leave the same counts.
 * Recording the OUTCOME, and preserving order, is what lets a test assert that
 * a read happened *after* a conflict — the step the CAS depends on.
 *
 * `select` outcomes separate "found a row with no snapshot" from "found the
 * winner's snapshot", so a post-conflict re-read can be shown to have actually
 * picked the winner's set up.
 */
export type FakeEvent =
  | { op: "select"; seq: number; outcome: "empty" | "row-without-snapshot" | "snapshot" }
  | { op: "insert"; seq: number; outcome: InsertOutcome }
  | { op: "update"; seq: number; outcome: "installed" | "guard-missed" | "error" }
  | { op: "upsert"; seq: number; outcome: "installed" }

export type FakeFaults = {
  /** Every select rejects. */
  selectError?: boolean
  /** Only the Nth select (1-based) rejects — models a transient blip. */
  selectErrorOnSeq?: number
  /** Writes return a transport-level error. */
  writeError?: boolean
  /** Writes throw rather than returning an error. */
  writeThrows?: boolean
}

export function deferred<T = void>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Resolves once `n` participants have arrived. */
export function barrier(n: number) {
  const gate = deferred()
  let count = 0
  return {
    reached: gate.promise,
    arrive() {
      if (++count >= n) gate.resolve()
    },
  }
}

export function makeFakeDb(seed: Row | null = null, hooks: FakeHooks = {}, faults: FakeFaults = {}) {
  /** Keyed by stripe_session_id — the UNIQUE constraint, modelled. */
  const rows = new Map<string, Row>()
  if (seed) rows.set(String(seed.stripe_session_id), { ...seed })

  const log: string[] = []
  const events: FakeEvent[] = []
  const seqs: Record<string, number> = { select: 0, insert: 0, update: 0, upsert: 0 }

  function from(_table: string) {
    let action: "select" | "insert" | "update" | "upsert" | null = null
    let payload: Row = {}
    let key: string | null = null
    const predicates: Array<(r: Row) => boolean> = []

    const chain: Record<string, unknown> = {
      select(_cols?: string) {
        if (!action) action = "select"
        return chain
      },
      insert(p: Row) {
        action = "insert"
        payload = p
        return chain
      },
      update(p: Row) {
        action = "update"
        payload = p
        return chain
      },
      upsert(p: Row) {
        action = "upsert"
        payload = p
        return chain
      },
      eq(col: string, val: unknown) {
        if (col === "stripe_session_id") key = String(val)
        predicates.push((r) => r[col] === val)
        return chain
      },
      is(col: string, val: unknown) {
        predicates.push((r) => (r[col] ?? null) === val)
        return chain
      },
      maybeSingle: () => run(),
      single: () => run(),
      then: (res: (v: unknown) => void, rej?: (e: unknown) => void) => run().then(res, rej),
    }

    async function run(): Promise<{ data: unknown; error: unknown }> {
      const op = action ?? "select"
      const seq = ++seqs[op]
      log.push(op)

      if (op === "select") {
        await hooks.beforeSelect?.({ seq })
        if (faults.selectError || faults.selectErrorOnSeq === seq) throw new Error("select failed")
        const row = key !== null ? rows.get(key) : undefined
        events.push({
          op: "select",
          seq,
          outcome: !row ? "empty" : readQuestionSnapshot(row.questions) ? "snapshot" : "row-without-snapshot",
        })
        return { data: row ?? null, error: null }
      }

      if (op === "insert") {
        await hooks.beforeInsert?.({ seq })
        if (faults.writeThrows) throw new Error("connection reset")
        if (faults.writeError) {
          events.push({ op: "insert", seq, outcome: "error" })
          await hooks.afterInsert?.({ seq, outcome: "error" })
          return { data: null, error: { code: "08006", message: "connection failure" } }
        }
        const k = String(payload.stripe_session_id)
        if (rows.has(k)) {
          // The UNIQUE constraint doing its job.
          events.push({ op: "insert", seq, outcome: "conflict" })
          await hooks.afterInsert?.({ seq, outcome: "conflict" })
          return {
            data: null,
            error: {
              code: "23505",
              message:
                'duplicate key value violates unique constraint "deep_assessments_stripe_session_id_key"',
            },
          }
        }
        // `status` carries a NOT NULL default of 'pending' in production.
        rows.set(k, { status: "pending", ...payload })
        events.push({ op: "insert", seq, outcome: "installed" })
        await hooks.afterInsert?.({ seq, outcome: "installed" })
        return { data: [rows.get(k)], error: null }
      }

      if (op === "update") {
        await hooks.beforeUpdate?.({ seq })
        if (faults.writeThrows) throw new Error("connection reset")
        if (faults.writeError) {
          events.push({ op: "update", seq, outcome: "error" })
          return { data: null, error: { code: "08006", message: "connection failure" } }
        }
        const row = key !== null ? rows.get(key) : undefined
        // Zero rows matched — no such row, or the guard no longer holds.
        if (!row || !predicates.every((p) => p(row))) {
          events.push({ op: "update", seq, outcome: "guard-missed" })
          return { data: [], error: null }
        }
        Object.assign(row, payload)
        events.push({ op: "update", seq, outcome: "installed" })
        return { data: [row], error: null }
      }

      // upsert — last-write-wins, which is exactly what the CAS install removes.
      const k = String(payload.stripe_session_id)
      rows.set(k, { ...(rows.get(k) ?? {}), ...payload })
      events.push({ op: "upsert", seq, outcome: "installed" })
      return { data: null, error: null }
    }

    return chain
  }

  return {
    client: { from } as unknown,
    rows,
    log,
    /** Ordered operations with their outcomes — see FakeEvent. */
    events,
    counts: () => ({ ...seqs }),
    /** The single row, when there is one. */
    only: () => [...rows.values()][0] ?? null,
    /** Every stored row holding a snapshot the questionnaire could render. */
    validSnapshots: () =>
      [...rows.values()].map((r) => readQuestionSnapshot(r.questions)).filter(Boolean),
  }
}
