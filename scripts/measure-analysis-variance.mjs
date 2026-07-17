#!/usr/bin/env node
/**
 * Same-meal score-variance measurement for the analyse-meal pipeline
 * (issue #157, consistency). Runs the same meal input N times at two
 * temperatures and reports the per-field spread, so temperature changes
 * (and future prompt/model changes) have before/after numbers.
 *
 * Requires ANTHROPIC_API_KEY. Uses the same system prompt contract as
 * app/api/analyse-meal/route.ts (duplicated here deliberately — this script
 * must be runnable standalone, and importing the route would pull in Next).
 * If the route's ANALYSIS_SYSTEM changes materially, update PROMPT below.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/measure-analysis-variance.mjs [image.jpg]
 *     [image.jpg]  optional meal photo; defaults to a text-only description.
 *   Env: RUNS (default 5), CLAUDE_MODEL (default matches lib/anthropic.ts)
 */

import { readFileSync } from "node:fs"
import Anthropic from "@anthropic-ai/sdk"

const RUNS = Number(process.env.RUNS ?? 5)
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514"
const DESCRIPTION =
  "Grilled salmon fillet with a cup of brown rice, steamed broccoli, and a side of kimchi"

const PROMPT = `You are EatoBiotic, the world's expert on the 3 Biotics Framework for gut health.
Analyse the meal described or shown and return a single valid JSON object — no markdown, no explanation, no extra text.

SCORING RUBRIC:
- prebiotic_score 0–100: plant/fibre diversity. 4+ distinct plant/fibre sources = 80–95, 3 = 65–75, 2 = 45–60, 1 = 25–40, 0 = 5–15
- probiotic_score 0–100: live/fermented foods. 2+ fermented = 75–90, 1 = 45–60, none = 5–15
- postbiotic_score 0–100: postbiotic-supporting foods (EVOO, berries, dark chocolate 70%+, nuts, polyphenol-rich plants, avocado, sourdough). Present and diverse = 50–80, minimal = 20–35, none = 5–15
- biotics_score (overall): weighted — prebiotic 45% + probiotic 30% + postbiotic 25%, then round to nearest integer
- quality_diversity 0–100: breadth of different food types across the whole meal
- quality_anti_inflammatory 0–100: presence of omega-3s, polyphenols, curcumin, allicin, antioxidants; absence of processed food, refined sugar, trans fats

Return ONLY JSON: {"meal_name": "...", "biotics_score": N, "prebiotic_score": N, "probiotic_score": N, "postbiotic_score": N, "quality_diversity": N, "quality_anti_inflammatory": N}`

const FIELDS = [
  "biotics_score",
  "prebiotic_score",
  "probiotic_score",
  "postbiotic_score",
  "quality_diversity",
  "quality_anti_inflammatory",
]

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required.")
  process.exit(1)
}

const client = new Anthropic()

function buildContent() {
  const imagePath = process.argv[2]
  if (!imagePath) return [{ type: "text", text: `Analyse this meal: ${DESCRIPTION}.` }]
  const data = readFileSync(imagePath).toString("base64")
  const ext = imagePath.toLowerCase().split(".").pop()
  const media_type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
  return [
    { type: "image", source: { type: "base64", media_type, data } },
    { type: "text", text: "Analyse the meal shown in this photo." },
  ]
}

async function runOnce(temperature) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    temperature,
    system: PROMPT,
    messages: [{ role: "user", content: buildContent() }],
  })
  const text = res.content[0]?.type === "text" ? res.content[0].text : ""
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON in response")
  return JSON.parse(match[0])
}

function summarise(results) {
  const rows = []
  for (const f of FIELDS) {
    const vals = results.map((r) => r[f]).filter((v) => typeof v === "number")
    if (!vals.length) continue
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length
    rows.push({ field: f, values: vals.join(", "), spread: max - min, mean: mean.toFixed(1) })
  }
  return rows
}

const input = process.argv[2] ? `image: ${process.argv[2]}` : `description: "${DESCRIPTION}"`
console.log(`Model: ${MODEL} · Runs per temperature: ${RUNS} · Input ${input}\n`)

for (const temperature of [1, 0]) {
  console.log(`── temperature: ${temperature} ${temperature === 1 ? "(current default)" : "(pinned)"} ──`)
  const results = []
  for (let i = 0; i < RUNS; i++) results.push(await runOnce(temperature))
  console.table(summarise(results))
}
