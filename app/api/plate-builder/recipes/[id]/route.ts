/**
 * Per-recipe routes for a user's saved cookbook entry.
 *
 *   PATCH  /api/plate-builder/recipes/[id]   — toggle is_favorite
 *   DELETE /api/plate-builder/recipes/[id]   — remove from cookbook
 *
 * Auth required; RLS at the DB enforces the user can only touch their own
 * rows even if a stale id leaks somehow.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export const runtime = "nodejs"

const patchSchema = z.object({
  is_favorite: z.boolean(),
})

async function requireUser() {
  const user = await getUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) }
  return { user }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser()
  if (gate.error) return gate.error
  const { user } = gate
  const { id } = await ctx.params

  let body: z.infer<typeof patchSchema>
  try {
    body = patchSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database unavailable" }, { status: 503 })

  const { error } = await supabase
    .from("user_recipes")
    .update({ is_favorite: body.is_favorite, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[user-recipes] patch error", error.message)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser()
  if (gate.error) return gate.error
  const { user } = gate
  const { id } = await ctx.params

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database unavailable" }, { status: 503 })

  const { error } = await supabase
    .from("user_recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[user-recipes] delete error", error.message)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
