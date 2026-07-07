/**
 * POST /api/menu-scan — "Score the menu".
 *
 * Member pastes a restaurant menu (text only — no URL fetching); the Twin picks
 * the top 3 dishes biased toward their weakest biotic. Auth-gated, AI-cost
 * guarded (guardAiUsage "menu_scan"), non-medical framing enforced in the
 * prompt. Returns { weakest, picks: [{name, why, biotic}] }.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { guardAiUsage, AI_LIMITS } from "@/lib/ai-guard"
import { getAccountTwinInput } from "@/lib/account/twin-data"
import { buildAccountTwin } from "@/lib/agent-loop/account-twin"

const bodySchema = z.object({
  menuText: z.string().min(20).max(6000),
})

const SYSTEM = `You are EatoBiotic, an expert on the 3 Biotics Framework for gut health.
The user pastes a restaurant menu. Pick the THREE best dishes for their Food System, biased toward
the biotic they most need (given in the request). Rules:
- Only choose dishes that actually appear on the pasted menu (light modifications like "ask for a
  side of greens" are allowed inside "why").
- Educational, food-first, non-medical language ONLY ("supports", "feeds") — never diagnose,
  treat, or promise health outcomes.
- Return ONLY valid JSON, no markdown: {"picks":[{"name":"<dish>","why":"<1-2 sentences, mention
  what it feeds>","biotic":"prebiotics|probiotics|postbiotics"}]}`

export interface MenuPick {
  name: string
  why: string
  biotic: "prebiotics" | "probiotics" | "postbiotics"
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const blocked = await guardAiUsage(user.id, "menu_scan", AI_LIMITS.menu_scan)
  if (blocked) return blocked

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Paste a menu (20–6000 characters)" }, { status: 400 })
  }

  /* The member's weakest biotic steers the picks. */
  const input = await getAccountTwinInput(user.id, user.email ?? null)
  const { twin } = await buildAccountTwin(input)
  const weakest = twin.biotics.weakest

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `The member's weakest biotic is ${weakest} — bias the picks toward it.\n\nMENU:\n${body.menuText}`,
        },
      ],
    })
    const text = response.content[0]?.type === "text" ? response.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    const parsed = JSON.parse(jsonMatch[0]) as { picks?: MenuPick[] }
    const picks = (parsed.picks ?? []).slice(0, 3).filter((p) => p?.name && p?.why)
    if (picks.length === 0) throw new Error("No picks")
    return NextResponse.json({ weakest, picks })
  } catch (err) {
    console.error("[menu-scan]", err)
    return NextResponse.json({ error: "Couldn't read that menu — try pasting the dishes as plain text" }, { status: 500 })
  }
}
