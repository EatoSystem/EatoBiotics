/**
 * lib/statsig-server.ts — SERVER ONLY
 *
 * Thin wrapper around statsig-node that:
 *   - Guards the secret key so it is never exposed to the browser
 *   - Initialises the SDK lazily (once per serverless instance)
 *   - Exposes logServerEvent() for use in API routes / webhooks
 *
 * Do NOT import this file from any client component or lib/statsig-client.ts.
 */
import "server-only"
import Statsig from "statsig-node"

let initialised = false

async function init(): Promise<typeof Statsig | null> {
  // STATSIG_SERVER_KEY must never be NEXT_PUBLIC_ — it stays server-side only
  const key = process.env.STATSIG_SERVER_KEY
  if (!key) {
    // Key not configured — SDK disabled (events are silently dropped)
    return null
  }
  if (!initialised) {
    await Statsig.initialize(key, {
      environment: {
        tier: process.env.NODE_ENV === "production" ? "production" : "staging",
      },
      // Disable local evaluation for a lightweight server integration;
      // gate checks should be done on the client SDK in the browser.
      localMode: false,
    })
    initialised = true
  }
  return Statsig
}

/**
 * Fire a custom event from a server API route or webhook handler.
 *
 * @param eventName - e.g. "subscription_started"
 * @param userId    - Supabase user ID (or "anonymous" when unknown)
 * @param metadata  - Optional flat key→value pairs (all values must be strings)
 */
export async function logServerEvent(
  eventName: string,
  userId: string,
  metadata?: Record<string, string>
): Promise<void> {
  try {
    const statsig = await init()
    if (!statsig) return
    statsig.logEvent(
      { userID: userId },
      eventName,
      /* value */ undefined,
      metadata
    )
    // statsig-node batches events and flushes on a timer; explicitly flush in
    // serverless contexts so events are not lost when the process idles.
    await statsig.flush()
  } catch (err) {
    // Non-fatal — never let analytics errors surface to users
    console.warn("[statsig-server] logEvent failed:", err)
  }
}
