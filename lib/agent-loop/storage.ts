/**
 * EatoBiotics Agent Loop — persistence.
 *
 * localStorage-first, matching the existing stability/journey convention: a
 * synchronous local store that works for everyone (signed in or not). Server
 * persistence is a deliberate seam (`syncToServer`) — a no-op today so no
 * Supabase migration is required; when a table exists it pushes in the
 * background exactly like `lib/stability/storage.ts` does.
 */

import type { AgentLoopSession } from "./types"

const LS_KEY = "eb_agent_loop_sessions_v1"

type SessionMap = Record<string, AgentLoopSession>

function readAll(): SessionMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as SessionMap) : {}
  } catch {
    return {}
  }
}

function writeAll(map: SessionMap): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function listSessions(): AgentLoopSession[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getSession(id: string): AgentLoopSession | null {
  return readAll()[id] ?? null
}

export function saveSession(session: AgentLoopSession): void {
  const map = readAll()
  map[session.id] = session
  writeAll(map)
  void syncToServer(session)
}

/** Alias matching the loop's public vocabulary. */
export const saveLoopResult = saveSession

export function clearSessions(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

/* ── Server-sync seam (no-op until a table + auth wiring exists) ───────────── */

/**
 * Deferred extension point. When `agent_loop_sessions` exists this will upsert
 * the session for signed-in users (fire-and-forget), mirroring stability sync.
 * Today it intentionally does nothing so the loop has zero backend dependency.
 */
export async function syncToServer(_session: AgentLoopSession): Promise<void> {
  // Intentionally empty — see docs/agent-loop.md "Future integrations".
}
