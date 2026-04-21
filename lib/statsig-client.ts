/**
 * lib/statsig-client.ts — CLIENT ONLY
 *
 * Imperative helpers for firing Statsig events from non-hook contexts
 * (event handlers, callbacks, etc.).
 *
 * For gate checks inside React components, use `useGate()` from
 * @statsig/react-bindings — it reads from the StatsigProvider context.
 *
 * This module intentionally does NOT import @statsig/js-client directly;
 * instead, the StatsigClientProvider registers a logger function here once
 * the SDK is initialised, so this file is safe to import from any client
 * module without pulling in the full SDK before it is ready.
 */

type LogFn = (
  name: string,
  value?: string | number,
  metadata?: Record<string, string>
) => void

let _log: LogFn | null = null

/** Called once by StatsigClientProvider after the SDK is ready. */
export function _registerStatsigLogger(fn: LogFn): void {
  _log = fn
}

/**
 * Fire a Statsig custom event from any client-side context.
 *
 * Safe to call before the SDK is fully initialised — events are silently
 * dropped rather than throwing. Always call from inside an event handler,
 * never during render.
 *
 * @param name     - Event name, e.g. "free_meal_scan_started"
 * @param value    - Optional numeric or string value
 * @param metadata - Optional flat key→value string pairs
 */
export function logEvent(
  name: string,
  value?: string | number,
  metadata?: Record<string, string>
): void {
  _log?.(name, value, metadata)
}
