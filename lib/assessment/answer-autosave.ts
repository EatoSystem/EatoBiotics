/**
 * Autosave sequencing for the paid deep assessment (#227).
 *
 * ── The problem this exists to solve ────────────────────────────────────────
 *
 * `/api/save-deep-progress` merges one answer per request, which makes two
 * saves for DIFFERENT questions safe in any order. It cannot make two saves
 * for the SAME question safe, because there is nothing to merge: one of the
 * two values has to win, and the server can only pick the one that arrives
 * second.
 *
 * The questionnaire produces same-question saves constantly, not rarely. A
 * textarea calls back on every keystroke, a slider on every drag step and a
 * multi-select on every toggle (components/assessment/deep/deep-question.tsx).
 * Firing an unsequenced request per event means "second to arrive" is decided
 * by the network, so the stored answer can end up being a prefix of what the
 * customer typed — their finished sentence overwritten by an earlier draft of
 * it. No attacker, no unusual conditions, just two requests in flight.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 *
 * **At most one request in flight per question, and the newest value is always
 * the one sent next.** Newer input replaces any value still waiting rather
 * than queueing behind it, so the last request issued for a question always
 * carries the latest thing the customer did. Last-to-arrive and latest-intent
 * become the same request, and the ordering question stops existing.
 *
 * Cross-question ordering is deliberately left alone: those requests may
 * overlap freely, because the server merges them.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 *
 * This is a save queue, not a state layer. It holds no answers for rendering,
 * has no React dependency and no store — `answers` remains ordinary component
 * state. Two tabs editing one assessment is still last-commit-wins; that is a
 * documented limit, not something this file tries to solve.
 */

export type AutosaveStatus = "idle" | "saving" | "saved" | "unsaved"

/**
 * `retryable` separates "try again" from "this will never work". A 503 is
 * worth another attempt; a 422 for a question id that is not in the snapshot
 * will fail identically forever, and retrying it only delays telling the
 * customer.
 */
export type SendResult = { ok: true } | { ok: false; retryable: boolean }

export type AutosaveOptions = {
  send: (questionId: string, value: unknown) => Promise<SendResult>
  onStatus?: (status: AutosaveStatus) => void
  /** Coalesces keystrokes and slider steps into one request. */
  debounceMs?: number
  /** Total send attempts per value, including the first. */
  attempts?: number
  retryDelayMs?: number
}

export type AnswerAutosave = {
  /** Record the latest value for a question. Replaces any pending value. */
  queue: (questionId: string, value: unknown) => void
  /** Send everything outstanding now and wait. Resolves true if all saved. */
  flush: () => Promise<boolean>
  status: () => AutosaveStatus
  /** Drop timers without sending. For unmount. */
  cancel: () => void
}

type Slot = {
  /** Newest value not yet handed to `send`. */
  pending?: { value: unknown }
  timer?: ReturnType<typeof setTimeout>
  /** Resolves when the in-flight send settles; undefined when idle. */
  settle?: Promise<void>
  attempt: number
  failed: boolean
}

const DEFAULTS = { debounceMs: 400, attempts: 3, retryDelayMs: 800 }

export function createAnswerAutosave(options: AutosaveOptions): AnswerAutosave {
  const { send, onStatus } = options
  const debounceMs = options.debounceMs ?? DEFAULTS.debounceMs
  const maxAttempts = Math.max(1, options.attempts ?? DEFAULTS.attempts)
  const retryDelayMs = options.retryDelayMs ?? DEFAULTS.retryDelayMs

  const slots = new Map<string, Slot>()
  let sawSuccess = false
  let lastStatus: AutosaveStatus = "idle"

  function slotFor(id: string): Slot {
    let s = slots.get(id)
    if (!s) {
      s = { attempt: 0, failed: false }
      slots.set(id, s)
    }
    return s
  }

  function status(): AutosaveStatus {
    const all = [...slots.values()]
    // "unsaved" outranks "saving": a retry in progress does not undo the fact
    // that something is currently not stored, and hiding that while retries
    // continue is how a customer ends up trusting a save that never happened.
    if (all.some((s) => s.failed)) return "unsaved"
    if (all.some((s) => s.pending || s.settle)) return "saving"
    return sawSuccess ? "saved" : "idle"
  }

  function emit() {
    const next = status()
    if (next === lastStatus) return
    lastStatus = next
    onStatus?.(next)
  }

  function schedule(id: string, delay: number) {
    const slot = slotFor(id)
    if (slot.timer) clearTimeout(slot.timer)
    slot.timer = setTimeout(() => {
      slot.timer = undefined
      void pump(id)
    }, delay)
  }

  function pump(id: string): void {
    const slot = slotFor(id)
    // One in flight per question. Whatever is pending goes out when this one
    // settles — and by then `pending` holds the newest value, not this one.
    if (slot.settle || !slot.pending) return

    const { value } = slot.pending
    slot.pending = undefined
    emit()

    slot.settle = send(id, value)
      .catch((): SendResult => ({ ok: false, retryable: true }))
      .then((result) => {
        slot.settle = undefined

        if (result.ok) {
          sawSuccess = true
          slot.attempt = 0
          slot.failed = false
          emit()
          // A newer value may have arrived while this was on the wire.
          if (slot.pending) pump(id)
          return
        }

        slot.attempt += 1
        const canRetry = result.retryable && slot.attempt < maxAttempts
        if (canRetry && !slot.pending) {
          // Put the value back only if nothing newer superseded it; a newer
          // value makes this one irrelevant, and resending it would be the
          // stale-write bug in a different costume.
          slot.pending = { value }
        }
        if (canRetry) {
          schedule(id, retryDelayMs)
          emit()
          return
        }
        slot.failed = true
        slot.attempt = 0
        emit()
      })

    emit()
  }

  return {
    queue(questionId, value) {
      const slot = slotFor(questionId)
      slot.pending = { value }
      slot.attempt = 0
      // A fresh edit clears the previous failure: the value that failed is no
      // longer the value we are trying to store.
      slot.failed = false
      schedule(questionId, debounceMs)
      emit()
    },

    async flush() {
      // Bounded: each pass either sends something or waits on something, and
      // per-slot attempts are capped, so this cannot spin.
      for (let pass = 0; pass < 2 + slots.size * (maxAttempts + 1); pass++) {
        let acted = false
        for (const [id, slot] of slots) {
          if (slot.timer) {
            clearTimeout(slot.timer)
            slot.timer = undefined
          }
          if (!slot.settle && slot.pending) {
            pump(id)
            acted = true
          }
        }
        const running = [...slots.values()].map((s) => s.settle).filter(Boolean) as Promise<void>[]
        if (running.length > 0) {
          await Promise.all(running)
          acted = true
        }
        if (!acted) break
      }
      return ![...slots.values()].some((s) => s.failed || s.pending || s.settle)
    },

    status,

    cancel() {
      for (const slot of slots.values()) {
        if (slot.timer) clearTimeout(slot.timer)
        slot.timer = undefined
        slot.pending = undefined
      }
      emit()
    },
  }
}
