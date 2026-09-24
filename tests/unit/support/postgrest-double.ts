/**
 * A PostgREST-shaped in-memory database double — Step 7.
 *
 * ══ WHAT THIS IS, AND WHAT IT IS NOT ════════════════════════════════════════
 *
 * This container has no Supabase credentials and no egress, so the €49
 * journey's database boundary cannot be exercised against a real database
 * here. This double stands in for that boundary so the REAL route handlers can
 * run and their writes can be observed.
 *
 * **A result obtained through this double is never evidence that Supabase
 * behaves this way.** It is evidence about the handler. Step 7's report files
 * every such result under PROVEN IN CI (DOUBLE), and the external runbook
 * covers what only a real database and a real Stripe account can settle.
 *
 * ══ WHAT IT MODELS ══════════════════════════════════════════════════════════
 *
 *   • `from(table)` → a chainable builder, awaited directly or terminated with
 *     `maybeSingle()` / `single()`.
 *   • `select(cols, { count, head })`, `eq`, `is`, `order`, `limit`.
 *   • `insert(row)` with a real PRIMARY KEY collision → PostgREST error code
 *     `23505`. This is the only reason the double exists rather than a stub:
 *     the idempotency repair turns on that exact code.
 *   • `upsert(row, { onConflict })` — merge on the conflict column.
 *   • `update(patch).eq(...)`, `delete().eq(...)`.
 *   • Injectable per-table, per-operation failures, so a read error can be
 *     distinguished from an empty read.
 *
 * ══ WHAT IT DELIBERATELY DOES NOT MODEL ═════════════════════════════════════
 *
 *   • Row-level security. Every caller here is the service-role client.
 *   • Transactions or isolation levels.
 *   • Real concurrency. `runConcurrently` below interleaves two handler
 *     invocations deterministically at a named await point; that proves a
 *     handler's check-then-act window exists, not that Postgres would schedule
 *     it that way.
 *   • Constraint checks other than the primary key, defaults, or triggers.
 *
 * Anything resting on those belongs in the human runbook, not here.
 */

export type Row = Record<string, unknown>

export interface PostgrestError {
  code: string
  message: string
  details?: string | null
  hint?: string | null
}

/** Which operation on which table should fail, and with what. */
export interface FailureInjection {
  table: string
  op: "select" | "insert" | "upsert" | "update" | "delete"
  error: PostgrestError
  /** Fail only this many times, then heal. Omit to fail forever. */
  times?: number
  /**
   * THROW instead of returning `{ error }`.
   *
   * These are different failures and callers treat them differently: a
   * returned error is only seen by a caller that inspects it, while an
   * exception unwinds to the nearest try/catch. A test that injects the first
   * while meaning the second proves nothing about the catch block — which is
   * exactly how the claim-release case slipped when it was first written.
   */
  throws?: boolean
}

export interface TableSpec {
  /** Column that behaves as the PRIMARY KEY. Collisions raise 23505. */
  primaryKey?: string
  rows?: Row[]
  /**
   * Column DEFAULTs, applied on INSERT when the writer omits the column.
   *
   * Only modelled where a real default is load-bearing for the behaviour under
   * test and has been verified against production. `deep_assessments.created_at`
   * is the case that forced this: it is `timestamptz DEFAULT now()`, neither
   * writer sets it explicitly, and the entitlement window is derived from it.
   * A double that silently left it null would have proved the repair works
   * while hiding that it depends on a default nobody had checked.
   */
  defaults?: Record<string, () => unknown>
}

/** Called before an operation settles — the seam concurrency tests use. */
export type BeforeSettle = (table: string, op: string) => void | Promise<void>

export interface WriteRecord {
  table: string
  op: "insert" | "upsert" | "update" | "delete"
  payload: unknown
}

const UNIQUE_VIOLATION = "23505"

export class PostgrestDouble {
  readonly tables = new Map<
    string,
    { primaryKey?: string; rows: Row[]; defaults?: Record<string, () => unknown> }
  >()
  readonly writes: WriteRecord[] = []
  private failures: FailureInjection[] = []
  /** Awaited before every operation settles. Default: no-op. */
  beforeSettle: BeforeSettle = () => {}

  constructor(spec: Record<string, TableSpec> = {}) {
    for (const [name, t] of Object.entries(spec)) {
      this.tables.set(name, {
        primaryKey: t.primaryKey,
        rows: [...(t.rows ?? [])],
        defaults: t.defaults,
      })
    }
  }

  rowsOf(table: string): Row[] {
    return this.tables.get(table)?.rows ?? []
  }

  /** Writes recorded for one table, in order. */
  writesTo(table: string, op?: WriteRecord["op"]): WriteRecord[] {
    return this.writes.filter((w) => w.table === table && (!op || w.op === op))
  }

  fail(injection: FailureInjection): void {
    this.failures.push({ ...injection })
  }

  clearFailures(): void {
    this.failures = []
  }

  private takeFailure(table: string, op: FailureInjection["op"]): PostgrestError | null {
    const hit = this.failures.find((f) => f.table === table && f.op === op && f.times !== 0)
    if (!hit) return null
    if (typeof hit.times === "number") hit.times -= 1
    if (hit.throws) {
      const err = new Error(hit.error.message) as Error & { code?: string }
      err.code = hit.error.code
      throw err
    }
    return hit.error
  }

  private ensure(table: string) {
    let t = this.tables.get(table)
    if (!t) {
      t = { rows: [] }
      this.tables.set(table, t)
    }
    return t
  }

  /** The object a route receives from `getSupabase()`. */
  client(): { from(table: string): unknown } {
    return { from: (table: string) => this.builder(table) }
  }

  private builder(table: string) {
    const filters: { column: string; value: unknown; kind: "eq" | "is" }[] = []
    let pending:
      | { op: "insert" | "upsert"; payload: Row | Row[]; onConflict?: string }
      | { op: "update"; payload: Row }
      | { op: "delete" }
      | null = null
    let countMode: "exact" | null = null
    let headOnly = false

    const matches = (row: Row) =>
      filters.every((f) =>
        f.kind === "is" ? (row[f.column] ?? null) === f.value : row[f.column] === f.value,
      )

    const settle = (): { data: unknown; error: PostgrestError | null; count?: number | null } => {
      const t = this.ensure(table)

      if (pending?.op === "insert" || pending?.op === "upsert") {
        const injected = this.takeFailure(table, pending.op)
        this.writes.push({ table, op: pending.op, payload: pending.payload })
        if (injected) return { data: null, error: injected }

        const incoming = Array.isArray(pending.payload) ? pending.payload : [pending.payload]
        const key = pending.op === "upsert" ? (pending.onConflict ?? t.primaryKey) : t.primaryKey

        for (const row of incoming) {
          if (key && row[key] !== undefined) {
            const existing = t.rows.find((r) => r[key] === row[key])
            if (existing) {
              if (pending.op === "insert") {
                return {
                  data: null,
                  error: {
                    code: UNIQUE_VIOLATION,
                    message: `duplicate key value violates unique constraint "${table}_pkey"`,
                  },
                }
              }
              Object.assign(existing, row)
              continue
            }
          }
          const withDefaults: Row = { ...row }
          for (const [col, make] of Object.entries(t.defaults ?? {})) {
            if (withDefaults[col] === undefined) withDefaults[col] = make()
          }
          t.rows.push(withDefaults)
        }
        return { data: null, error: null }
      }

      if (pending?.op === "update") {
        const injected = this.takeFailure(table, "update")
        this.writes.push({ table, op: "update", payload: pending.payload })
        if (injected) return { data: null, error: injected }
        for (const row of t.rows) if (matches(row)) Object.assign(row, pending.payload)
        return { data: null, error: null }
      }

      if (pending?.op === "delete") {
        const injected = this.takeFailure(table, "delete")
        this.writes.push({ table, op: "delete", payload: filters.map((f) => [f.column, f.value]) })
        if (injected) return { data: null, error: injected }
        t.rows = t.rows.filter((row) => !matches(row))
        this.tables.set(table, t)
        return { data: null, error: null }
      }

      const injected = this.takeFailure(table, "select")
      if (injected) return { data: null, error: injected, count: null }

      const found = t.rows.filter(matches)
      if (countMode === "exact") {
        return { data: headOnly ? null : found.map((r) => ({ ...r })), error: null, count: found.length }
      }
      return { data: found.map((r) => ({ ...r })), error: null }
    }

    const chain: Record<string, unknown> = {}
    Object.assign(chain, {
      select: (_cols?: string, opts?: { count?: "exact"; head?: boolean }) => {
        if (opts?.count === "exact") countMode = "exact"
        if (opts?.head) headOnly = true
        return chain
      },
      eq: (column: string, value: unknown) => {
        filters.push({ column, value, kind: "eq" })
        return chain
      },
      is: (column: string, value: unknown) => {
        filters.push({ column, value, kind: "is" })
        return chain
      },
      order: () => chain,
      limit: () => chain,
      insert: (payload: Row | Row[]) => {
        pending = { op: "insert", payload }
        return chain
      },
      upsert: (payload: Row | Row[], opts?: { onConflict?: string }) => {
        pending = { op: "upsert", payload, onConflict: opts?.onConflict }
        return chain
      },
      update: (payload: Row) => {
        pending = { op: "update", payload }
        return chain
      },
      delete: () => {
        pending = { op: "delete" }
        return chain
      },
      maybeSingle: async () => {
        await this.beforeSettle(table, pending?.op ?? "select")
        const r = settle()
        const rows = (r.data as Row[] | null) ?? []
        return { data: r.error ? null : (rows[0] ?? null), error: r.error }
      },
      single: async () => {
        await this.beforeSettle(table, pending?.op ?? "select")
        const r = settle()
        const rows = (r.data as Row[] | null) ?? []
        if (!r.error && rows.length === 0) {
          return { data: null, error: { code: "PGRST116", message: "no rows returned" } }
        }
        return { data: r.error ? null : rows[0], error: r.error }
      },
      // Awaiting the builder itself is how the routes terminate writes and
      // counted reads.
      then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
        Promise.resolve(this.beforeSettle(table, pending?.op ?? "select"))
          .then(() => resolve(settle()))
          .catch((err) => reject?.(err))
      },
    })
    return chain
  }
}

/**
 * A counted barrier: every participant blocks in `arrive()` until `count` of
 * them have arrived, then all proceed together.
 *
 * This is how the check-then-act window is made deterministic. Wire it into
 * the double as a `beforeSettle` hook on the idempotency read, and two handler
 * invocations are guaranteed to BOTH complete that read before EITHER writes.
 *
 * It does not claim Postgres would schedule them this way. It claims the
 * handler has a window in which it can be interleaved at all — which is
 * exactly the thing a claim-based repair has to close, and exactly the thing
 * a read-then-insert idempotency check leaves open.
 */
export class Barrier {
  private waiting: (() => void)[] = []
  constructor(private readonly count: number) {}

  async arrive(): Promise<void> {
    if (this.waiting.length + 1 >= this.count) {
      for (const release of this.waiting.splice(0)) release()
      return
    }
    await new Promise<void>((resolve) => this.waiting.push(resolve))
  }

  /** Release anyone still waiting — for a test that ends early. */
  abort(): void {
    for (const release of this.waiting.splice(0)) release()
  }
}
