/* ── Founding 100 helpers ─────────────────────────────────────────────────
   Server-safe constants and utilities shared across routes and pages.
   Keep this file importable from both Server Components and Route Handlers. */

export const FOUNDERS_CAP = 100

export type FoundingStatus = "submitted" | "admitted" | "rejected" | "waitlist"

export function hasFoundersCapReached(admittedCount: number | null | undefined): boolean {
  if (typeof admittedCount !== "number" || admittedCount < 0) return false
  return admittedCount >= FOUNDERS_CAP
}

