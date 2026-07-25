import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

/*
  Member feedback / review loop (Loyalty). Migration 45 (`reviews`).

  POST — an authenticated member submits (or updates) their rating + optional
         quote. One row per member (upsert on user_id); every write resets
         `approved` to false so an edited quote re-enters moderation.
  GET  — public: aggregate rating + count over all reviews, plus a handful of
         APPROVED quotes for social proof. Never exposes unapproved text.

  Fails soft when the table isn't applied yet (GET → empty, POST → 503) so the
  UI degrades gracefully before Migration 45 lands.
*/

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  quote: z.string().trim().max(500).optional(),
  source: z.enum(["account", "meal", "retest", "milestone"]).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  // Cheap abuse guard on top of the one-row-per-user upsert.
  const rl = rateLimit(`reviews:${getClientIp(req)}`, 5, 10 * 60_000)
  if (!rl.allowed) {
    const { body, init } = rateLimitResponse(rl)
    return NextResponse.json(body, init)
  }

  let body: z.infer<typeof postSchema>
  try {
    body = postSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      rating: body.rating,
      quote: body.quote && body.quote.length > 0 ? body.quote : null,
      source: body.source ?? "account",
      approved: false, // re-enters moderation on every edit
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )
  if (error) {
    console.error("[reviews] upsert:", error.message)
    return NextResponse.json({ error: "Could not save your feedback" }, { status: 503 })
  }
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(`reviews-get:${getClientIp(req)}`, 60, 10 * 60_000)
  if (!rl.allowed) {
    const { body, init } = rateLimitResponse(rl)
    return NextResponse.json(body, init)
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ count: 0, average: null, testimonials: [] })

  // Aggregate over all reviews (rating only — no text exposed).
  const { data: all, error } = await supabase.from("reviews").select("rating").limit(10000)
  if (error) {
    // Table not applied yet — present as empty rather than erroring the page.
    return NextResponse.json({ count: 0, average: null, testimonials: [] })
  }
  const ratings = (all ?? []).map((r) => r.rating as number).filter((n) => typeof n === "number")
  const count = ratings.length
  const average = count > 0 ? Math.round((ratings.reduce((s, n) => s + n, 0) / count) * 10) / 10 : null

  // Only APPROVED quotes are ever returned for public display.
  const { data: quotes } = await supabase
    .from("reviews")
    .select("quote, rating")
    .eq("approved", true)
    .not("quote", "is", null)
    .order("created_at", { ascending: false })
    .limit(12)

  const testimonials = (quotes ?? [])
    .map((q) => ({ quote: q.quote as string, rating: q.rating as number }))
    .filter((t) => t.quote && t.quote.trim().length > 0)

  return NextResponse.json(
    { count, average, testimonials },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" } },
  )
}
