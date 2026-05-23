/**
 * User cookbook API — save and list a user's saved plate-builder recipes.
 *
 *   POST   /api/plate-builder/recipes        — save one recipe to the cookbook
 *   GET    /api/plate-builder/recipes        — list this user's saved recipes
 *
 * Auth + tier gated to match /api/plate-builder. Reads/writes go through the
 * service-role client so we don't need to thread the SSR client; RLS still
 * enforces own-row at the DB level.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { canAccess, getUserMembershipTier } from "@/lib/membership"

export const runtime = "nodejs"

const saveSchema = z.object({
  slug:        z.string().min(1).max(120),
  plateId:     z.enum(["foundation", "function", "diversity", "restoration"]),
  name:        z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  imageUrl:    z.string().max(2000).optional().nullable(),
  // The full PlateRecipe object — we don't re-validate the schema here because
  // the main /api/plate-builder route already produced it.
  recipe:      z.record(z.string(), z.unknown()),
})

async function gateUser() {
  const user = await getUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) }
  const tier = await getUserMembershipTier(user.id)
  if (!canAccess(tier, "plate_builder")) {
    return { error: NextResponse.json({ error: "A paid EatoBiotics plan is required" }, { status: 403 }) }
  }
  return { user }
}

export async function POST(req: NextRequest) {
  const gate = await gateUser()
  if (gate.error) return gate.error
  const { user } = gate

  let body: z.infer<typeof saveSchema>
  try {
    body = saveSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid recipe payload" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }

  const { data, error } = await supabase
    .from("user_recipes")
    .insert({
      user_id:     user.id,
      slug:        body.slug,
      plate_id:    body.plateId,
      name:        body.name,
      description: body.description ?? null,
      image_url:   body.imageUrl ?? null,
      recipe_json: body.recipe,
    })
    .select("id, created_at")
    .single()

  if (error) {
    console.error("[user-recipes] insert error", error.message)
    return NextResponse.json({ error: "Could not save recipe" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id, created_at: data?.created_at })
}

export async function GET() {
  const gate = await gateUser()
  if (gate.error) return gate.error
  const { user } = gate

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ recipes: [], error: "Database unavailable" }, { status: 503 })
  }

  // Hot-path index `idx_user_recipes_user_id_created_at` makes this O(rows-returned).
  const { data, error } = await supabase
    .from("user_recipes")
    .select("id, slug, plate_id, name, description, image_url, is_favorite, created_at, recipe_json")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[user-recipes] list error", error.message)
    return NextResponse.json({ recipes: [], error: "Could not load recipes" }, { status: 500 })
  }

  return NextResponse.json({ recipes: data ?? [] })
}
