/**
 * Stripe (server-side only) — lazily constructed.
 * Never import this in client components or pages with "use client".
 *
 * The client is built on first use, NOT at import time, so `next build` and
 * unrelated routes don't fail when STRIPE_SECRET_KEY is absent. `getStripe()`
 * throws if the key is missing (callers already wrap Stripe calls in try/catch
 * or guard on the env). The `stripe` export is a back-compat proxy: existing
 * `stripe.x.y()` call sites work unchanged, but construction still defers to
 * first property access (request time).
 */
import Stripe from "stripe"

let _client: Stripe | null = null

export function getStripe(): Stripe {
  if (!_client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    // No explicit apiVersion: use the version pinned by the installed SDK so we
    // never send an API version the SDK/account doesn't recognise (which makes
    // every request — e.g. checkout.sessions.create — throw).
    _client = new Stripe(key)
  }
  return _client
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === "function" ? value.bind(client) : value
  },
})
