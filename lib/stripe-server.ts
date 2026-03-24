/**
 * Stripe singleton — server-side only.
 * Never import this in client components or pages with "use client".
 */
import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  // Warn at startup rather than silently using an empty string
  console.warn("[stripe-server] STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
})
