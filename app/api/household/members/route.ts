import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const MAX_MEMBERS = 12
const AGE_BANDS = ["child", "teen", "adult"]
const RELATIONSHIPS = ["self", "child", "partner", "parent", "sibling", "other"]

function sanitizeName(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t.length >= 1 && t.length <= 60 ? t : null
}

/** Validates an optional enum field: returns the value, null, or `undefined` (invalid). */
function optionalEnum(v: unknown, allowed: string[]): string | null | undefined {
  if (v === undefined || v === null || v === "") return null
  return typeof v === "string" && allowed.includes(v) ? v : undefined
}

function clampScore(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v !== "number" || !Number.isFinite(v)) return null
  return Math.max(0, Math.min(100, Math.round(v)))
}

const SELECT = "id, name, age_band, relationship, latest_score, created_at, updated_at"

/* ── List the current account holder's household members ── */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ members: [] })

  const { data, error } = await supabase
    .from("household_members")
    .select(SELECT)
    .eq("owner_id", user.id) // service-role client bypasses RLS — scope explicitly
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[household] list error:", error.message)
    return NextResponse.json({ error: "Could not load household" }, { status: 500 })
  }
  return NextResponse.json({ members: data ?? [] })
}

/* ── Add a member ── */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const name = sanitizeName(body.name)
  if (!name) return NextResponse.json({ error: "A member name is required" }, { status: 400 })

  const ageBand = optionalEnum(body.ageBand, AGE_BANDS)
  if (ageBand === undefined) return NextResponse.json({ error: "Invalid age band" }, { status: 400 })
  const relationship = optionalEnum(body.relationship, RELATIONSHIPS)
  if (relationship === undefined) return NextResponse.json({ error: "Invalid relationship" }, { status: 400 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  // Enforce a sane household size cap.
  const { count } = await supabase
    .from("household_members")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
  if ((count ?? 0) >= MAX_MEMBERS) {
    return NextResponse.json({ error: `A household can have at most ${MAX_MEMBERS} members` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("household_members")
    .insert({
      owner_id: user.id,
      name,
      age_band: ageBand,
      relationship,
      latest_score: clampScore(body.latestScore),
    })
    .select(SELECT)
    .single()

  if (error) {
    console.error("[household] insert error:", error.message)
    return NextResponse.json({ error: "Could not add member" }, { status: 500 })
  }
  return NextResponse.json({ member: data }, { status: 201 })
}

/* ── Update a member (ownership-scoped) ── */
export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = typeof body.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "Missing member id" }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ("name" in body) {
    const name = sanitizeName(body.name)
    if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    updates.name = name
  }
  if ("ageBand" in body) {
    const ageBand = optionalEnum(body.ageBand, AGE_BANDS)
    if (ageBand === undefined) return NextResponse.json({ error: "Invalid age band" }, { status: 400 })
    updates.age_band = ageBand
  }
  if ("relationship" in body) {
    const relationship = optionalEnum(body.relationship, RELATIONSHIPS)
    if (relationship === undefined) return NextResponse.json({ error: "Invalid relationship" }, { status: 400 })
    updates.relationship = relationship
  }
  if ("latestScore" in body) {
    updates.latest_score = clampScore(body.latestScore)
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data, error } = await supabase
    .from("household_members")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id) // ownership check — only the owner can update their member
    .select(SELECT)
    .maybeSingle()

  if (error) {
    console.error("[household] update error:", error.message)
    return NextResponse.json({ error: "Could not update member" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  return NextResponse.json({ member: data })
}

/* ── Remove a member (ownership-scoped) ── */
export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const id = typeof body.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "Missing member id" }, { status: 400 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id) // ownership check

  if (error) {
    console.error("[household] delete error:", error.message)
    return NextResponse.json({ error: "Could not remove member" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
