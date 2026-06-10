"use client"

/**
 * lib/stability/storage.ts — client-side persistence for the Stability module.
 *
 * localStorage is the instant cache so the tool works for everyone (no auth/DB
 * required). When the user is signed in, writes also push to Supabase via
 * /api/stability and `hydrateFromServer()` pulls their data on mount — giving
 * cross-device sync without changing the synchronous read API the components use.
 */

import type { StabilityAssessment, StabilityDailyLog } from "./types"

const K_ASSESSMENT = "eb_stability_assessment_v1"
const K_LOGS = "eb_stability_logs_v1"

/** Set true once a server GET succeeds (200) — gates background pushes so we
 *  don't fire authenticated writes for logged-out users. */
let authed = false

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — ignore */
  }
}

/* ── Assessment ─────────────────────────────────────────────────────────── */

export function saveAssessment(a: StabilityAssessment) {
  write(K_ASSESSMENT, a)
  if (authed) void fetch("/api/stability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessment: a }) }).catch(() => {})
}
export function loadAssessment(): StabilityAssessment | null {
  return read<StabilityAssessment | null>(K_ASSESSMENT, null)
}

/* ── Daily logs (keyed by date) ─────────────────────────────────────────── */

export function loadLogs(): StabilityDailyLog[] {
  return read<StabilityDailyLog[]>(K_LOGS, [])
    .slice()
    .sort((x, y) => (x.date < y.date ? 1 : -1)) // newest first
}

export function loadLog(date: string): StabilityDailyLog | null {
  return loadLogs().find((l) => l.date === date) ?? null
}

export function saveLog(log: StabilityDailyLog) {
  const entry = { ...log, updatedAt: new Date().toISOString() }
  const logs = read<StabilityDailyLog[]>(K_LOGS, [])
  const next = logs.filter((l) => l.date !== log.date)
  next.push(entry)
  write(K_LOGS, next)
  if (authed) void fetch("/api/stability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ log: entry }) }).catch(() => {})
}

export function seedLogs(logs: StabilityDailyLog[]) {
  write(K_LOGS, logs)
}

export function clearLogs() {
  write(K_LOGS, [])
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ── Server sync ────────────────────────────────────────────────────────── */

/**
 * Pull the signed-in user's assessment + logs from Supabase and merge them into
 * the local cache (the later `updatedAt` wins per day). No-op for logged-out
 * users (the API returns 401). Returns true if the user is signed in.
 *
 * Call once on mount of any Stability tool page, then re-read via load*().
 */
export async function hydrateFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const res = await fetch("/api/stability", { method: "GET" })
    if (res.status === 401) { authed = false; return false }
    if (!res.ok) return false
    authed = true
    const { assessment, logs } = (await res.json()) as { assessment: StabilityAssessment | null; logs: StabilityDailyLog[] }

    if (assessment) write(K_ASSESSMENT, assessment)

    if (Array.isArray(logs) && logs.length) {
      const byDate = new Map<string, StabilityDailyLog>()
      for (const l of read<StabilityDailyLog[]>(K_LOGS, [])) byDate.set(l.date, l)
      for (const s of logs) {
        const local = byDate.get(s.date)
        if (!local || (s.updatedAt ?? "") >= (local.updatedAt ?? "")) byDate.set(s.date, s)
      }
      write(K_LOGS, Array.from(byDate.values()))
    }
    return true
  } catch {
    return false
  }
}
