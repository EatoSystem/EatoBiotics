import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

/* ── Unique code generator ────────────────────────────────────────────────
   Produces codes like EB-HELP-A3KZY8WQ — no confusable characters (0/O, 1/I/L)
   ─────────────────────────────────────────────────────────────────────── */
function generateUniqueCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  let suffix = ""
  for (const byte of arr) suffix += chars[byte % chars.length]
  return `${prefix}-${suffix}`
}

/* ── Rate limit: max 3 promo codes per email per day ─────────────────────
   Checked via Stripe metadata — no extra DB table needed.
   ─────────────────────────────────────────────────────────────────────── */
async function countTodayCodes(email: string, type: string): Promise<number> {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  const since = Math.floor(midnight.getTime() / 1000)

  const list = await stripe.promotionCodes.list({
    limit: 10,
    created: { gte: since },
  })

  return list.data.filter(
    (pc) => pc.metadata?.email === email && pc.metadata?.type === type
  ).length
}

export async function POST(req: NextRequest) {
  let body: { type?: string; email?: string; score?: number }
  try {
    body = await req.json() as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { type, email, score } = body

  if (type !== "low_score" && type !== "share") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  // Always-on IP cap. The per-email Stripe cap below is skipped when no email is
  // supplied, so without this an attacker could mint unlimited single-use
  // discount codes. (5 codes / hour per source, regardless of email.)
  const ipLimit = rateLimit(`promo-generate:${getClientIp(req)}`, 5, 60 * 60_000)
  if (!ipLimit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(ipLimit)
    return NextResponse.json(rlBody, init)
  }

  // Validate low_score requests server-side
  if (type === "low_score" && typeof score === "number" && score >= 40) {
    return NextResponse.json({ error: "Score does not qualify" }, { status: 403 })
  }

  // Get the parent Stripe coupon ID for this type
  const couponId = type === "low_score"
    ? process.env.STRIPE_LOW_SCORE_COUPON_ID
    : process.env.STRIPE_SHARE_COUPON_ID

  if (!couponId) {
    return NextResponse.json({ error: "Promo not configured" }, { status: 503 })
  }

  // Rate limit — max 3 per email per day (prevents hammering)
  if (email) {
    try {
      const count = await countTodayCodes(email, type)
      if (count >= 3) {
        return NextResponse.json({ error: "Limit reached" }, { status: 429 })
      }
    } catch {
      // Non-fatal — continue if rate limit check fails
    }
  }

  // Generate a unique code
  const prefix = type === "low_score" ? "EB-HELP" : "EB-SHARE"
  const code   = generateUniqueCode(prefix)

  try {
    const promoCode = await stripe.promotionCodes.create({
      promotion:       { type: "coupon", coupon: couponId },
      code:            code,
      max_redemptions: 1,           // single-use — cannot be shared
      metadata: {
        type,
        ...(email ? { email } : {}),
        ...(score != null ? { score: String(score) } : {}),
        generated_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({ code: promoCode.code })
  } catch (err) {
    console.error("[promo/generate] Stripe error:", err)
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 })
  }
}
