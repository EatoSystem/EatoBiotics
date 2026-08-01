/**
 * Prompt construction for the free/paid report endpoint.
 *
 * Lives outside the route so it can be unit-tested: Next.js App Router route
 * files may only export HTTP handlers, and the `undefined/100` regression this
 * fixes is exactly the kind of bug a test on the built prompt would have caught.
 */
import {
  normalizeToBiotics,
  orderedByNeed,
  PATHWAY_LABEL,
  type BioticScores,
  type IncomingSubScores,
} from "./subscores"

export { normalizeToBiotics }
export type { BioticScores, IncomingSubScores }

export type RequestBody = {
  tier: "starter" | "full" | "premium"
  overall: number
  subScores: IncomingSubScores
  profile: { type: string; tagline: string; description: string }
}

export function buildPrompt(body: RequestBody, biotics: BioticScores): string {
  const { tier, overall, profile } = body
  const ranked = orderedByNeed(biotics)
  const [weakestKey, weakestScore] = ranked[0]
  const [strongestKey, strongestScore] = ranked[ranked.length - 1]

  const scoreBlock = `
THEIR ASSESSMENT SCORES:
- Overall Food System Score: ${overall}/100
- Profile Type: "${profile.type}"
- Profile Tagline: "${profile.tagline}"

Pillar scores (3 Biotics):
- Prebiotics (what feeds their microbes): ${biotics.prebiotics}/100
- Probiotics (live-culture exposure): ${biotics.probiotics}/100
- Postbiotics (recovery, rhythm, resilience): ${biotics.postbiotics}/100
- Weakest pathway: ${PATHWAY_LABEL[weakestKey]} (${weakestScore}/100)
- Strongest pathway: ${PATHWAY_LABEL[strongestKey]} (${strongestScore}/100)`

  const toneBlock = `
TONE AND STYLE:
- Warm, intelligent, non-clinical
- Never use the word "diet" — always say "food system", "eating habits", or "way of eating"
- Use "system" frequently to reinforce that this is about building something
- Write as if this report could ONLY belong to this exact person with these exact scores
- Reference their specific pathway scores and profile type throughout
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
    {"day": "Monday", "action": "specific, personalised action for their weakest pathway"},
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
  "habitAnalysis": "2–3 paragraph analysis identifying the connections between their three pathway scores and what those connections reveal about their overall food system pattern",
  "rhythmInsight": "2 paragraphs on what their Postbiotics score — recovery, rhythm and resilience — tells them about system stability, specific to their exact numbers",
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
  "habitAnalysis": "Deep cross-pathway pattern analysis (2–3 paragraphs)",
  "rhythmInsight": "Postbiotics (recovery, rhythm, resilience) insight (2 paragraphs)",
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
  "systemInterpretation": "3–4 paragraph deep analysis connecting all three pathways, explaining the overall pattern and what it means for their food system health, energy, and daily experience",
  "systemStory": "3–4 sentences titled in spirit 'Your System, Your Story' — warm, personal, motivating — that frames their food system journey in a way that feels meaningful and forward-looking"
}`
}
