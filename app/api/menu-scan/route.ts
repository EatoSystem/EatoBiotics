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
import { behaviourFor } from "@/lib/agent-loop/behaviour"

const bodySchema = z.object({
  menuText: z.string().min(20).max(6000),
})

/* ════════════════════════════════════════════════════════════════════════════
   GATE 3.7 — the prompt no longer describes a personal Biotic state.

   This route is behind `/account/twin`, which V1 refuses, so none of what
   follows ever reached a customer. It is corrected anyway, because it encoded
   the exact model Gate 3.6 removed from fifteen surfaces, and leaving it would
   leave a reactivation path that rebuilds the defect the moment the route is
   turned on. A prompt is the worst place for that to wait: one sentence here
   regenerates into many customer-facing forms, addressed to one person at a
   time, in wording nobody reviews.

   Four things changed, and the first is the one that matters:

   1. THE MODEL IS NO LONGER TOLD A BIOTIC. The user message used to say "The
      member's weakest biotic is ${weakest}". It now sends the FOOD-PATTERN
      phrase — "fermented foods" — via `mealBehaviour`. A model that was never
      given a personal Biotic framing cannot echo one back, which is a stronger
      guarantee than any instruction telling it not to.
   2. "feeds" left the allowed-verb list. It was sitting in a list headed
      "non-medical language ONLY", which is how a mechanism claim gets
      permission.
   3. `why` asks for the FOODS IN THE DISH rather than "what it feeds".
   4. `biotic` is labelled as what it is: a display category for grouping, never
      a statement about the member.

   THE RESPONSE CONTRACT IS UNCHANGED — still `{ weakest, picks: [{ name, why,
   biotic }] }`. `biotic` drives the dish pill's colour and `weakest` is mapped
   through `mealBehaviour` by the component before anything renders, so both are
   data keys no renderer prints. Changing the shape would be a larger edit than
   the problem.

   PRESERVED DELIBERATELY: the menu-fidelity rule, and "never diagnose, treat,
   or promise health outcomes". Type D — improve, never demote.
   ════════════════════════════════════════════════════════════════════════════ */
const SYSTEM = `You are EatoBiotic, an expert on food patterns for gut health.
The user pastes a restaurant menu. Pick the THREE best dishes for their Food System, favouring the
food pattern named in the request. Rules:
- Only choose dishes that actually appear on the pasted menu (light modifications like "ask for a
  side of greens" are allowed inside "why").
- Educational, food-first, non-medical language ONLY ("supports", "brings", "adds") — never
  diagnose, treat, or promise health outcomes.
- "why" names the FOODS in the dish and why they suit the pattern. Do not describe what happens
  inside the body, and never say a dish feeds, boosts or raises any part of the person.
- "biotic" is a display CATEGORY used to colour the dish in the UI. It is not a statement about
  the member, and nothing in "why" may present it as their own.
- Return ONLY valid JSON, no markdown: {"picks":[{"name":"<dish>","why":"<1-2 sentences naming the
  foods>","biotic":"prebiotics|probiotics|postbiotics"}]}`

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

  /*
   * The food pattern their recent meals showed least of steers the picks.
   *
   * `weakest` stays as the RESPONSE key — the component maps it through
   * `mealBehaviour` before rendering — but what the model is handed is the
   * pattern phrase, never the key. See the block above the prompt.
   */
  const input = await getAccountTwinInput(user.id, user.email ?? null)
  const { twin } = await buildAccountTwin(input)
  const weakest = twin.biotics.weakest
  const pattern = behaviourFor(weakest, twin.baseline.bioticsSource)

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `The food pattern to favour is: ${pattern}.\n\nMENU:\n${body.menuText}`,
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
