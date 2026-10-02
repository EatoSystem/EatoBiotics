import { NextResponse, type NextRequest } from "next/server"

import { CLAUDE_MODEL, getAnthropic } from "@/lib/anthropic"
import { AI_LIMITS, guardAiUsage } from "@/lib/ai-guard"
import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { FSS_DOMAINS } from "@/lib/fss/questions/domain-schema"
import type { FssDomain } from "@/lib/fss/questions/types"
import { toAiContext } from "@/lib/fss/system/ai-context"
import { validateFocusToday, focusGrounding } from "@/lib/fss/system/focus-today"
import type { MyFoodSystem } from "@/lib/fss/system/types"
import { getUser } from "@/lib/supabase-server"

/* ════════════════════════════════════════════════════════════════════════
   FOCUS TODAY — the first live model call under the Intelligence Boundary.

   "What should I focus on today, and why?"

   ══ WHY THIS ROUTE CARRIES ITS OWN COPY OF THE PREVIEW PREDICATE ════════════

   `lib/fss/preview/preview-policy.ts` already implements this logic, and
   `lib/report/presentation/preview-policy.ts` implements it a second time, and
   both files say in so many words why they are not one function:

     these are INDEPENDENT gates on independent unfinished features, and a
     shared helper is a shared switch. One edit to make one preview reachable
     would silently make the others reachable too.

   This is the third such gate, on the third such feature, and the reasoning
   has not changed. Six duplicated lines are cheaper than that coupling, and
   the duplication is only defensible if it stays faithful — so a test pins all
   three behaviours against each other across every environment any of them
   will ever see.

   ══ WHAT IT REFUSES, AND WHY THE LIST IS LONGER THAN THE PREVIEW PAGE'S ═════

   Everything the candidate preview refuses, plus the model. The five domains
   are candidates with no named reviewer, the weights are a DEV_ONLY fixture,
   seven questions are drafts — and now a model would be speaking about all of
   it. `resolveWeights` would refuse the fixture weights outside a
   non-production context anyway, so production could not compute a score to
   discuss even if this gate were removed; that is the braces to this belt.

   ══ WHAT THE MODEL IS PERMITTED TO DECIDE ═══════════════════════════════════

   One string. See `lib/fss/system/focus-today.ts` for the whole argument.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Deny by default. Every input this cannot prove is non-production returns
 * `false`, including an absent `VERCEL_ENV`: absence is not evidence of safety.
 *
 * A DELIBERATE COPY of `isFoodSystemV1PreviewEligible`. See the header.
 */
export function isFocusTodayEligible(env: NodeJS.ProcessEnv = process.env): boolean {
  const vercelEnv = env.VERCEL_ENV

  // 1. The real deployment. Nothing overrides this.
  if (vercelEnv === "production") return false

  // 2. Vercel's non-production deployments.
  if (vercelEnv === "preview" || vercelEnv === "development") return true

  // 3. No Vercel at all: a local dev server or a test runner, and only when the
  //    Node runtime says so positively.
  if (!vercelEnv && (env.NODE_ENV === "development" || env.NODE_ENV === "test")) return true

  // 4. An unknown VERCEL_ENV, or no VERCEL_ENV with NODE_ENV=production, is a
  //    runtime we cannot prove is safe. Deny.
  return false
}

/*
 * Node runtime, per request. The edge compiles `process.env` at build time, so
 * an edge check would report whatever was true when `next build` ran — the
 * finding recorded in full in `lib/v1-surface.ts` and repeated on the preview
 * page. The decision must happen per request.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** The reviewed domain labels, so the framing guard can spot a foreign one. */
const DOMAIN_LABELS = Object.fromEntries(
  FSS_DOMAINS.map((d) => [d, DOMAIN_PRESENTATION[d].label]),
) as Record<FssDomain, string>

/**
 * The instruction. Deliberately short, and it names no food, no domain and no
 * science.
 *
 * It does not restate the claims boundary in prose: the boundary travels as
 * DATA in the context package (`claimBoundary`), and a paraphrase here would be
 * a second, unreviewed copy of it — exactly the "prompt field becomes a second
 * source for methodology" argument that keeps `systemPrompt` off the ceiling.
 *
 * What it does say is what the one authored field is for, and what the response
 * shape must be. Every other constraint is enforced after the fact by
 * `validateFocusToday`, because an instruction is a request and a validator is
 * a rule.
 */
const INSTRUCTION = `You are helping someone act on a food-system plan that has already been decided.

The decision is not yours. The priority was selected by EatoBiotics and persisted; so was today's action. You are not choosing either, ranking them, or judging whether a different one would be better.

Return JSON with exactly these four fields and no others:

  priorityIdEcho    the priorityId from the context, copied exactly
  focusDomainEcho   the priority's domain from the context, copied exactly
  actionIdEcho      the todayAction's actionId from the context, copied exactly
  practicalFraming  ONE sentence, at most 400 characters

practicalFraming is the only thing you write. It should make today's action easier to approach, given the limiting constraints already listed in the context.

Frame the action. Do not describe the person. "A simple way to approach this is to add it to a meal you were already making" is right; "because you're too busy to cook" is not — that asserts something about them that nobody established.

Do not name any domain other than the one in the context. Do not suggest a different priority or a different action. Do not promise an outcome, a timeframe or a benefit. Do not mention prebiotics, probiotics or postbiotics.

Return only the JSON object.`

export async function POST(request: NextRequest) {
  /* 1 · THE GATE, before anything else is consulted. */
  if (!isFocusTodayEligible()) {
    // 404 rather than 403: an ineligible runtime should not confirm the route exists.
    return new NextResponse(null, { status: 404 })
  }

  /* 2 · AUTH, then the cost cap. Every user-triggered Claude endpoint is capped. */
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const blocked = await guardAiUsage(user.id, "focus_today", AI_LIMITS.focus_today)
  if (blocked) return blocked

  /* 3 · GROUNDING, before spending a provider call. */
  let system: MyFoodSystem
  try {
    system = (await request.json()).system as MyFoodSystem
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 })
  }
  if (!system || typeof system !== "object") {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 })
  }

  const grounding = focusGrounding(system)
  if (!grounding.ok) {
    /*
     * 200 with a refusal, not an error status. "Nothing is planned for today"
     * and "this decision cannot be read back" are real product states that a
     * surface should render honestly, not failures to retry.
     */
    return NextResponse.json({ state: "refused", because: grounding.because, explain: grounding.explain })
  }

  /* 4 · THE CONTEXT, projected by intent. The only caller of `toAiContext`. */
  const context = toAiContext("help-today-action", { system })

  /* 5 · THE MODEL CALL — the only one in this gate. */
  let raw: unknown
  try {
    const message = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: INSTRUCTION,
      messages: [{ role: "user", content: JSON.stringify(context) }],
    })
    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
    raw = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""))
  } catch {
    /*
     * A provider failure, a missing key, or unparseable output. All the same
     * answer: refuse. There is NO retry with a corrective nudge — a model
     * coached until it passes is a validator negotiating with its subject.
     */
    return NextResponse.json({
      state: "refused",
      because: "response-malformed",
      explain: "The assistant did not return a usable response. Nothing is shown rather than a guess.",
    })
  }

  /* 6 · VALIDATION. The response has no authority until this passes. */
  const result = validateFocusToday({ system, raw, domainLabels: DOMAIN_LABELS })

  return NextResponse.json(result)
}
