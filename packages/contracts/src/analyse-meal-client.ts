/**
 * POST /api/analyse-meal from the companion. Reuses the Phase C JSON contract.
 * Errors are returned and logged — including the server's cap / rate-limit
 * wording, verbatim. Do not invent unlimited Member analyses. Do not freeze
 * the legacy grow/restore/transform cap table into this client.
 */
import { AUTH_HEADER } from "./auth"
import {
  analyseMealRequestSchema,
  analyseMealResponseSchema,
  type AnalyseMealRequest,
  type AnalyseMealResponse,
} from "./analyse-meal"
import type { FetchFn, KvStore, LogError } from "./twin-state-client"

export type AnalyseMealFailureReason =
  | "unauthorised"
  | "unavailable"
  | "invalid"
  | "limited"
  | "unreadable"
  | "bad_request"

export type AnalyseMealResult =
  | { ok: true; data: AnalyseMealResponse }
  | { ok: false; reason: AnalyseMealFailureReason; message: string }

/** Meal facts the companion may render. The three plate scores stay off-screen. */
export type MealScanView = {
  mealName: string
  mealType: string
  mealBioticsScore: number
  insight: string
  tags: string[]
  calories: number
  protein: number
  fibre: number
}

export type MealScanStatus = "idle" | "queued" | "sent" | "failed"

export type MealScanSnapshot = {
  status: MealScanStatus
  description: string
  hasImage: boolean
  mealType: AnalyseMealRequest["meal_type"]
  view: MealScanView | null
  error: string | null
  reason: AnalyseMealFailureReason | null
}

export const MEAL_SCAN_PERSIST_KEY = "eb_mobile_meal_scan_v1"

const FALLBACK_UNAVAILABLE = "Could not reach the server. Try again."
const FALLBACK_LIMITED = "This meal could not be analysed right now."
const FALLBACK_INVALID = "The meal result could not be read. Try again."
const FALLBACK_UNREADABLE = "Could not identify foods in this meal. Try a clearer photo or a short description."
const FALLBACK_BAD_REQUEST = "Describe the meal or take a photo."

function defaultLog(message: string, cause?: unknown): void {
  console.error(message, cause)
}

function readErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const value = (body as { error: unknown }).error
    if (typeof value === "string" && value.trim().length > 0) return value
  }
  return fallback
}

async function readBody(
  res: Response,
  logError: LogError,
): Promise<unknown> {
  try {
    return await res.json()
  } catch (error) {
    logError("[mobile-analyse-meal] JSON parse failed", error)
    return null
  }
}

/**
 * Strip the plate to what the companion may show: one Meal Biotics Score,
 * the insight, nutrition counts, and additive tags (including Prebiotics /
 * Probiotics / Postbiotics as meal facts). The per-Biotic plate numbers stay
 * in the Phase C payload and are not part of this view.
 */
export function presentMealScanResult(result: AnalyseMealResponse): MealScanView {
  return {
    mealName: result.meal_name,
    mealType: result.meal_type,
    mealBioticsScore: result.biotics_score,
    insight: result.insight,
    tags: [...result.tags],
    calories: result.nutrition.calories,
    protein: result.nutrition.protein,
    fibre: result.nutrition.fibre,
  }
}

export async function postAnalyseMeal(
  url: string,
  accessToken: string,
  body: AnalyseMealRequest,
  opts: { fetchImpl?: FetchFn; logError?: LogError } = {},
): Promise<AnalyseMealResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const logError = opts.logError ?? defaultLog
  const payload = analyseMealRequestSchema.parse(body)
  if (!payload.description && !payload.image) {
    return { ok: false, reason: "bad_request", message: FALLBACK_BAD_REQUEST }
  }

  let res: Response
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: {
        [AUTH_HEADER]: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    logError("[mobile-analyse-meal] POST failed", error)
    return { ok: false, reason: "unavailable", message: FALLBACK_UNAVAILABLE }
  }

  const json = await readBody(res, logError)

  if (res.status === 401) {
    return { ok: false, reason: "unauthorised", message: readErrorMessage(json, "Unauthorised") }
  }
  if (res.status === 400) {
    return { ok: false, reason: "bad_request", message: readErrorMessage(json, FALLBACK_BAD_REQUEST) }
  }
  if (res.status === 422) {
    return { ok: false, reason: "unreadable", message: readErrorMessage(json, FALLBACK_UNREADABLE) }
  }
  if (res.status === 429) {
    logError("[mobile-analyse-meal] POST limited", res.status)
    return { ok: false, reason: "limited", message: readErrorMessage(json, FALLBACK_LIMITED) }
  }
  if (!res.ok) {
    logError("[mobile-analyse-meal] POST status", res.status)
    return { ok: false, reason: "unavailable", message: readErrorMessage(json, FALLBACK_UNAVAILABLE) }
  }

  try {
    return { ok: true, data: analyseMealResponseSchema.parse(json) }
  } catch (error) {
    logError("[mobile-analyse-meal] POST invalid", error)
    return { ok: false, reason: "invalid", message: FALLBACK_INVALID }
  }
}

type PersistedMeal = {
  status: MealScanStatus
  description: string
  image?: string
  mealType?: AnalyseMealRequest["meal_type"]
  result?: AnalyseMealResponse
  error?: string | null
  reason?: AnalyseMealFailureReason | null
}

function asMealType(value: unknown): AnalyseMealRequest["meal_type"] {
  if (value === "Breakfast" || value === "Lunch" || value === "Dinner" || value === "Snack") {
    return value
  }
  return undefined
}

function asFailureReason(value: unknown): AnalyseMealFailureReason | null {
  if (
    value === "unauthorised" ||
    value === "unavailable" ||
    value === "invalid" ||
    value === "limited" ||
    value === "unreadable" ||
    value === "bad_request"
  ) {
    return value
  }
  return null
}

function parsePersisted(raw: string | null): PersistedMeal | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedMeal>
    const status =
      parsed.status === "queued" || parsed.status === "sent" || parsed.status === "failed"
        ? parsed.status
        : parsed.status === "idle"
          ? "idle"
          : null
    if (!status) return null
    const resultParse = parsed.result ? analyseMealResponseSchema.safeParse(parsed.result) : null
    return {
      status,
      description: typeof parsed.description === "string" ? parsed.description : "",
      image: typeof parsed.image === "string" ? parsed.image : undefined,
      mealType: asMealType(parsed.mealType),
      result: resultParse?.success ? resultParse.data : undefined,
      error: typeof parsed.error === "string" ? parsed.error : null,
      reason: asFailureReason(parsed.reason),
    }
  } catch (error) {
    console.error("[mobile-analyse-meal] persist parse failed", error)
    return null
  }
}

export function createMealScanController(deps: {
  accessToken: string
  analyseMealUrl: string
  kv: KvStore
  fetchImpl?: FetchFn
  logError?: LogError
}) {
  let status: MealScanStatus = "idle"
  let description = ""
  let image: string | undefined
  let mealType: AnalyseMealRequest["meal_type"]
  let result: AnalyseMealResponse | null = null
  let error: string | null = null
  let reason: AnalyseMealFailureReason | null = null
  let generation = 0
  const listeners = new Set<(snap: MealScanSnapshot) => void>()

  function snapshot(): MealScanSnapshot {
    return {
      status,
      description,
      hasImage: Boolean(image),
      mealType,
      view: result ? presentMealScanResult(result) : null,
      error,
      reason,
    }
  }

  function emit(): void {
    const snap = snapshot()
    for (const listener of Array.from(listeners)) listener(snap)
  }

  async function persist(): Promise<void> {
    const body: PersistedMeal = {
      status,
      description,
      image,
      mealType,
      result: result ?? undefined,
      error,
      reason,
    }
    await deps.kv.setItem(MEAL_SCAN_PERSIST_KEY, JSON.stringify(body))
  }

  async function flush(): Promise<void> {
    const g = ++generation
    const payload: AnalyseMealRequest = {
      description: description || undefined,
      image,
      meal_type: mealType,
    }
    const posted = await postAnalyseMeal(deps.analyseMealUrl, deps.accessToken, payload, {
      fetchImpl: deps.fetchImpl,
      logError: deps.logError,
    })
    if (g !== generation) return
    if (posted.ok) {
      status = "sent"
      result = posted.data
      error = null
      reason = null
      image = undefined
    } else {
      status = "failed"
      error = posted.message
      reason = posted.reason
    }
    emit()
    await persist()
  }

  async function hydrate(): Promise<{ unauthorised: boolean }> {
    const stored = parsePersisted(await deps.kv.getItem(MEAL_SCAN_PERSIST_KEY))
    if (stored) {
      description = stored.description
      image = stored.image
      mealType = stored.mealType
      result = stored.result ?? null
      error = stored.error ?? null
      reason = stored.reason ?? null
      status = stored.status
    }
    emit()
    if (status === "queued") await flush()
    return { unauthorised: reason === "unauthorised" }
  }

  async function submit(input: {
    description: string
    image?: string
    mealType?: AnalyseMealRequest["meal_type"]
  }): Promise<void> {
    description = input.description.trim()
    image = input.image
    mealType = input.mealType
    result = null
    error = null
    reason = null
    if (!description && !image) {
      status = "failed"
      reason = "bad_request"
      error = FALLBACK_BAD_REQUEST
      emit()
      await persist()
      return
    }
    status = "queued"
    emit()
    await persist()
    await flush()
  }

  async function retry(): Promise<void> {
    if (!description && !image) return
    status = "queued"
    error = null
    reason = null
    emit()
    await persist()
    await flush()
  }

  function subscribe(listener: (snap: MealScanSnapshot) => void): () => void {
    listeners.add(listener)
    listener(snapshot())
    return () => {
      listeners.delete(listener)
    }
  }

  return { hydrate, submit, retry, subscribe, snapshot, flush }
}
