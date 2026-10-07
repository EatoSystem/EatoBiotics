/**
 * Visible twin-state client for the companion. Errors are returned and logged.
 * Do not copy lib/account/twin-state-sync.ts — that client swallows
 * offline/unauthed in an empty catch.
 */
import { AUTH_HEADER } from "./auth"
import {
  EMPTY_RITUAL,
  buildTwinStatePut,
  localDayKey,
  normaliseRitualDay,
  pickTodayRitual,
  toggleRitualKey,
  twinStateGetSchema,
  twinStatePutSchema,
  type RitualDayContract,
  type TwinStateGet,
  type TwinStatePut,
} from "./twin-state"

export type TwinStateResult =
  | { ok: true; data: TwinStateGet }
  | { ok: false; reason: "unauthorised" | "unavailable" | "invalid" }

export type LogError = (message: string, cause?: unknown) => void
export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

export type SyncStatus = "queued" | "sent" | "failed"

export type CheckInSnapshot = {
  ritual: RitualDayContract
  status: SyncStatus
  error: string | null
}

export type KvStore = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}

export const CHECK_IN_PERSIST_KEY = "eb_mobile_checkin_v1"

function defaultLog(message: string, cause?: unknown): void {
  console.error(message, cause)
}

export async function getTwinState(
  url: string,
  accessToken: string,
  opts: { fetchImpl?: FetchFn; logError?: LogError } = {},
): Promise<TwinStateResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const logError = opts.logError ?? defaultLog
  let res: Response
  try {
    res = await fetchImpl(url, {
      method: "GET",
      headers: { [AUTH_HEADER]: `Bearer ${accessToken}` },
    })
  } catch (error) {
    logError("[mobile-twin-state] GET failed", error)
    return { ok: false, reason: "unavailable" }
  }

  if (res.status === 401) return { ok: false, reason: "unauthorised" }
  if (!res.ok) {
    logError("[mobile-twin-state] GET status", res.status)
    return { ok: false, reason: "unavailable" }
  }

  try {
    const json: unknown = await res.json()
    return { ok: true, data: twinStateGetSchema.parse(json) }
  } catch (error) {
    logError("[mobile-twin-state] GET invalid", error)
    return { ok: false, reason: "invalid" }
  }
}

export async function putTwinState(
  url: string,
  accessToken: string,
  body: TwinStatePut,
  opts: { fetchImpl?: FetchFn; logError?: LogError } = {},
): Promise<TwinStateResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const logError = opts.logError ?? defaultLog
  const payload = twinStatePutSchema.parse(body)
  let res: Response
  try {
    res = await fetchImpl(url, {
      method: "PUT",
      headers: {
        [AUTH_HEADER]: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    logError("[mobile-twin-state] PUT failed", error)
    return { ok: false, reason: "unavailable" }
  }

  if (res.status === 401) return { ok: false, reason: "unauthorised" }
  if (!res.ok) {
    logError("[mobile-twin-state] PUT status", res.status)
    return { ok: false, reason: "unavailable" }
  }

  try {
    const json: unknown = await res.json()
    return { ok: true, data: twinStateGetSchema.parse(json) }
  } catch (error) {
    logError("[mobile-twin-state] PUT invalid", error)
    return { ok: false, reason: "invalid" }
  }
}

export function memoryKv(initial: Record<string, string> = {}): KvStore {
  const m = new Map(Object.entries(initial))
  return {
    getItem: async (key) => m.get(key) ?? null,
    setItem: async (key, value) => {
      m.set(key, value)
    },
  }
}

type Persisted = {
  day: string
  ritual: RitualDayContract
  dirty: boolean
  status: SyncStatus
}

function parsePersisted(raw: string | null, today: string): Persisted | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Persisted>
    if (parsed.day !== today) return null
    const status =
      parsed.status === "queued" || parsed.status === "sent" || parsed.status === "failed"
        ? parsed.status
        : "queued"
    return {
      day: today,
      ritual: normaliseRitualDay(parsed.ritual),
      dirty: parsed.dirty === true,
      status,
    }
  } catch (error) {
    console.error("[mobile-twin-state] persist parse failed", error)
    return null
  }
}

export function createCheckInController(deps: {
  accessToken: string
  twinStateUrl: string
  kv: KvStore
  fetchImpl?: FetchFn
  logError?: LogError
  now?: () => Date
  seedRitual?: RitualDayContract | null
}) {
  let ritual: RitualDayContract = deps.seedRitual
    ? normaliseRitualDay(deps.seedRitual)
    : EMPTY_RITUAL
  let status: SyncStatus = "sent"
  let error: string | null = null
  let dirty = false
  let generation = 0
  const listeners = new Set<(snap: CheckInSnapshot) => void>()

  function snapshot(): CheckInSnapshot {
    return { ritual, status, error }
  }

  function emit(): void {
    const snap = snapshot()
    for (const listener of Array.from(listeners)) listener(snap)
  }

  async function persist(): Promise<void> {
    const today = localDayKey(deps.now?.() ?? new Date())
    const body: Persisted = { day: today, ritual, dirty, status }
    await deps.kv.setItem(CHECK_IN_PERSIST_KEY, JSON.stringify(body))
  }

  async function hydrate(): Promise<{ unauthorised: boolean }> {
    const today = localDayKey(deps.now?.() ?? new Date())
    const stored = parsePersisted(await deps.kv.getItem(CHECK_IN_PERSIST_KEY), today)
    const remote = await getTwinState(deps.twinStateUrl, deps.accessToken, {
      fetchImpl: deps.fetchImpl,
      logError: deps.logError,
    })

    const serverDay =
      remote.ok && remote.data.rituals[today]
        ? normaliseRitualDay(remote.data.rituals[today])
        : null
    const seed = deps.seedRitual ? normaliseRitualDay(deps.seedRitual) : null
    const localDirty = stored?.dirty === true
    ritual = pickTodayRitual({
      local: stored?.ritual ?? null,
      localDirty,
      server: serverDay,
      seed,
    })
    dirty = localDirty
    if (localDirty) {
      status = stored?.status === "failed" ? "failed" : "queued"
      error = stored?.status === "failed" ? "unavailable" : null
    } else {
      status = "sent"
      error = null
    }
    emit()
    await persist()
    if (dirty) await flush()
    return { unauthorised: !remote.ok && remote.reason === "unauthorised" }
  }

  async function flush(): Promise<void> {
    const g = ++generation
    const today = localDayKey(deps.now?.() ?? new Date())
    const body = buildTwinStatePut(today, ritual)
    const result = await putTwinState(deps.twinStateUrl, deps.accessToken, body, {
      fetchImpl: deps.fetchImpl,
      logError: deps.logError,
    })
    if (g !== generation) return
    if (result.ok) {
      dirty = false
      status = "sent"
      error = null
    } else {
      status = "failed"
      error = result.reason
    }
    emit()
    await persist()
  }

  async function toggle(key: keyof RitualDayContract): Promise<void> {
    ritual = toggleRitualKey(ritual, key)
    dirty = true
    status = "queued"
    error = null
    emit()
    await persist()
    await flush()
  }

  async function retry(): Promise<void> {
    status = "queued"
    error = null
    dirty = true
    emit()
    await persist()
    await flush()
  }

  function subscribe(listener: (snap: CheckInSnapshot) => void): () => void {
    listeners.add(listener)
    listener(snapshot())
    return () => {
      listeners.delete(listener)
    }
  }

  return { hydrate, toggle, retry, subscribe, snapshot, flush }
}
