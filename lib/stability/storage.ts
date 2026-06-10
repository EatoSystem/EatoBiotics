"use client"

/**
 * lib/stability/storage.ts — client-side persistence for the Stability MVP.
 *
 * Stored in localStorage so the module works with no backend or auth. When a
 * Supabase layer is added (see the migration stub in supabase/migrations.sql
 * follow-up), swap these functions for API calls — the call sites only depend
 * on this interface.
 */

import type { StabilityAssessment, StabilityDailyLog } from "./types"

const K_ASSESSMENT = "eb_stability_assessment_v1"
const K_LOGS = "eb_stability_logs_v1"

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
  const logs = read<StabilityDailyLog[]>(K_LOGS, [])
  const next = logs.filter((l) => l.date !== log.date)
  next.push({ ...log, updatedAt: new Date().toISOString() })
  write(K_LOGS, next)
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
