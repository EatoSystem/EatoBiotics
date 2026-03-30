import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

type SubScores = {
  diversity: number
  feeding: number
  adding: number
  consistency: number
  feeling: number
}

type RequestBody = {
  tier: "starter" | "full" | "premium"
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
}

function getWeakestAndStrongest(sub: SubScores): {
  weakest: string
  weakestScore: number
  strongest: string
  strongestScore: number
} {
  const entries = Object.entries(sub) as [string, number][]
  entries.sort((a, b) => a[1] - b[1])
  return {
    weakest: entries[0][0],
    weakestScore: entries[0][1],
    strongest: entries[entries.length - 1][0],
    strongestScore: entries[entries.length - 1][1],
  }
}

function buildPrompt(body: RequestBody): string {
  const { tier, overall, subScores, profile } = body
  const { weakest, weakestScore, strongest, strongestScore } =
    getWeakestAndStrongest(subScores)

  const scoreBlock = `
THEIR ASSESSMENT SCORES:
- Overall Food System Score: ${overall}/100
- Profile Type: "${profile.type}"
- Profile Tagline: "${profile.tagline}"
- Diversity Score: ${subScores.diversity}/100
- Feeding Score: ${subScores.feeding}/100
- Adding Score: ${subScores.adding}/100
- Consistency Score: ${subScores.consistency}/100
- Feeling Score: ${subScores.feeling}/100
- Weakest Pillar: ${weakest} (${weakestScore}/100)
- Strongest Pillar: ${strongest} (${strongestScore}/100)`

  const toneBlock = `
TONE AND STYLE:
- Warm, intelligent, non-clinical
- Never use the word "diet" — always say "food system", "eating habits", or "way of eating"
- Use "system" frequently to reinforce that this is about building something
- Write as if this report could ONLY belong to this exact person with these exact scores
- Reference their specific pillar scores and profile type throughout
- Be specific, not generic — every sentence should feel earned by their actual numbers`

  if (tier === "starter") {
    return `You are EatoBiotics — an expert in food system health, food systems, and the microbiome. A user has completed the Food System Inside You Assessment.
${scoreBlock}
${toneBlock}

Write their Essential Starter Report. Respond with ONLY valid JSON (no markdown, no preamble, no explanation):

{
  "opening": "2–3 sentence personalised opening that speaks directly to their overall pattern — referencing their score and profile type specifically",
  "scoreInterpretation": "2–3 sentences explaining what their specific overall score means for their internal food system right now",
  "strengths": ["strength 1 label", "strength 2 label", "strength 3 label"],
  "strengthExplanations": ["why this is a genuine strength for them, referencing their score", "...", "..."],
  "opportunities": ["opportunity 1 label", "opportunity 2 label", "opportunity 3 label"],
  "opportunityExplanations": ["why this matters for them specifically, referencing their score", "...", "..."],
  "sevenDayPlan": [
    {"day": "Monday", "action": "specific, personalised action for their weakest pillar"},
    {"day": "Tuesday", "action": "..."},
    {"day": "Wednesday", "action": "..."},
    {"day": "Thursday", "action": "..."},
    {"day": "Friday", "action": "..."},
    {"day": "Saturday", "action": "..."},
    {"day": "Sunday", "action": "..."}
  ],
  "closing": "A warm closing paragraph that connects their individual food system to the bigger picture of why this matters"
}`
  }

  if (tier === "full") {
    return `You are EatoBiotics — an expert in food system health, food systems, and the microbiome. A user has completed the Food System Inside You Assessment and purchased the Full Report.
${scoreBlock}
${toneBlock}

Write their Full Report. Respond with ONLY valid JSON (no markdown, no preamble):

{
  "opening": "2–3 sentence personalised opening that speaks to their overall pattern",
  "scoreInterpretation": "What their specific score means for their internal food system",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "strengthExplanations": ["why this is a strength for them specifically", "...", "..."],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "opportunityExplanations": ["why this matters for them with their scores", "...", "..."],
  "sevenDayPlan": [
    {"day": "Monday", "action": "specific action"},
    {"day": "Tuesday", "action": "..."},
    {"day": "Wednesday", "action": "..."},
    {"day": "Thursday", "action": "..."},
    {"day": "Friday", "action": "..."},
    {"day": "Saturday", "action": "..."},
    {"day": "Sunday", "action": "..."}
  ],
  "closing": "Warm closing paragraph",
  "habitAnalysis": "2–3 paragraph analysis identifying the connections between their five pillar scores and what those connections reveal about their overall food system pattern",
  "rhythmInsight": "2 paragraphs on what their Consistency score combined with their Feeling score tells them about system stability — specific to their exact numbers",
  "energyBreakdown": "2 paragraphs on how their current food system is affecting their daily energy, focus, and wellbeing — specific to their scores",
  "thirtyDayRoadmap": [
    {"week": 1, "focus": "Week 1 title", "theme": "brief one-line theme", "actions": ["specific action 1", "specific action 2", "specific action 3"]},
    {"week": 2, "focus": "Week 2 title", "theme": "brief theme", "actions": ["action 1", "action 2", "action 3"]},
    {"week": 3, "focus": "Week 3 title", "theme": "brief theme", "actions": ["action 1", "action 2", "action 3"]},
    {"week": 4, "focus": "Week 4 title", "theme": "brief theme", "actions": ["action 1", "action 2", "action 3"]}
  ]
}`
  }

  // premium
  return `You are EatoBiotics — an expert in food system health, food systems, and the microbiome. A user has completed the Food System Inside You Assessment and purchased the Premium Report.
${scoreBlock}
${toneBlock}

Write their Premium Deep Dive Report. Respond with ONLY valid JSON (no markdown, no preamble):

{
  "opening": "2–3 sentence personalised opening",
  "scoreInterpretation": "What their specific score means for their food system",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "strengthExplanations": ["specific to their scores", "...", "..."],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "opportunityExplanations": ["specific to their scores", "...", "..."],
  "sevenDayPlan": [
    {"day": "Monday", "action": "specific action"},
    {"day": "Tuesday", "action": "..."},
    {"day": "Wednesday", "action": "..."},
    {"day": "Thursday", "action": "..."},
    {"day": "Friday", "action": "..."},
    {"day": "Saturday", "action": "..."},
    {"day": "Sunday", "action": "..."}
  ],
  "closing": "Warm closing paragraph",
  "habitAnalysis": "Deep cross-pillar pattern analysis (2–3 paragraphs)",
  "rhythmInsight": "Consistency + Feeling combined insight (2 paragraphs)",
  "energyBreakdown": "Daily experience interpretation (2 paragraphs)",
  "thirtyDayRoadmap": [
    {"week": 1, "focus": "title", "theme": "theme", "actions": ["action 1", "action 2", "action 3"]},
    {"week": 2, "focus": "title", "theme": "theme", "actions": ["action 1", "action 2", "action 3"]},
    {"week": 3, "focus": "title", "theme": "theme", "actions": ["action 1", "action 2", "action 3"]},
    {"week": 4, "focus": "title", "theme": "theme", "actions": ["action 1", "action 2", "action 3"]}
  ],
  "priorityMap": {
    "biggestBlocker": "The name of their single biggest system blocker",
    "blockerExplanation": "Why this is their biggest blocker and exactly what it is costing their system",
    "biggestBuilder": "The name of their single biggest system builder",
    "builderExplanation": "Why this is their biggest builder and what it will unlock for their system"
  },
  "phasedStrategy": [
    {"phase": "Foundation", "duration": "Weeks 1–4", "milestone": "What they will achieve by end of this phase", "actions": ["specific action 1", "specific action 2"]},
    {"phase": "Build", "duration": "Weeks 5–8", "milestone": "What they will achieve", "actions": ["specific action 1", "specific action 2"]},
    {"phase": "Optimise", "duration": "Weeks 9–12", "milestone": "What they will achieve", "actions": ["specific action 1", "specific action 2"]}
  ],
  "systemInterpretation": "3–4 paragraph deep analysis connecting all five pillars, explaining the overall pattern and what it means for their food system health, energy, and daily experience",
  "systemStory": "3–4 sentences titled in spirit 'Your System, Your Story' — warm, personal, motivating — that frames their food system journey in a way that feels meaningful and forward-looking"
}`
}

export async function POST(req: NextRequest) {
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

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const maxTokens = tier === "premium" ? 4096 : tier === "full" ? 3072 : 2048

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: buildPrompt(body) }],
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
