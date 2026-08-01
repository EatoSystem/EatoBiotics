import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import {
  buildPrompt,
  normalizeToBiotics,
  type RequestBody,
} from "@/lib/report/generate-report-prompt"

export async function POST(req: NextRequest) {
  // Unauthenticated, Claude-backed endpoint — cap per IP so it can't be looped
  // to burn Anthropic credits. (8 reports / 10 min from a single source.)
  const limit = rateLimit(`generate-report:${getClientIp(req)}`, 8, 10 * 60_000)
  if (!limit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(limit)
    return NextResponse.json(rlBody, init)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Claude not configured — add ANTHROPIC_API_KEY to .env.local" },
      { status: 503 }
    )
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { tier } = body
  if (!["starter", "full", "premium"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  // Fail closed rather than sending Claude "undefined/100" — a personalised
  // report built on missing scores is worse than no report.
  const biotics = normalizeToBiotics(body.subScores ?? {})
  if (!biotics) {
    return NextResponse.json(
      { error: "Missing or invalid sub-scores" },
      { status: 400 },
    )
  }

  try {
    const maxTokens = tier === "premium" ? 4096 : tier === "full" ? 3072 : 2048

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: buildPrompt(body, biotics) }],
    })

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : ""

    // Strip any accidental markdown code fences
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim()

    const report = JSON.parse(cleaned)
    return NextResponse.json({ report })
  } catch (err) {
    console.error("[generate-report] Claude error:", err)
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 }
    )
  }
}
