#!/usr/bin/env node
/**
 * CI guardrail: every app/api route that calls Claude must carry a cost cap.
 *
 * CLAUDE.md's rule ("new AI routes must call guardAiUsage or implement an
 * equivalent cap") was prose-only — a July 2026 audit found 22 AI routes of
 * which several authed ones had tier gates but no cap at all, and one public
 * demo route had nothing whatsoever. This check turns the rule into a build
 * failure, the same way check-supabase-scoping.mjs did for RLS-less scoping.
 *
 * A route passes if it contains `guardAiUsage(` or `verifyCronRequest`
 * (cron routes are invoked by our own scheduler, not users), or if it is
 * explicitly allowlisted below with the reason its own cap is equivalent.
 * Allowlist entries for files that no longer call Claude are flagged too,
 * so the list can't rot.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

/** Manual recursive walk — avoids fs.globSync, which needs Node 22+ (CI runs Node 20). */
function findRouteFilesUnder(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...findRouteFilesUnder(full))
    else if (entry === "route.ts") out.push(full)
  }
  return out
}

// A route "calls Claude" if it uses the SDK directly, OR delegates to the
// shared analysis core (lib/analysis/analyse.ts's runAnalysis) — otherwise the
// consolidation would hide capped routes from this check.
const AI_CALL_MARKERS = ["anthropic.messages", "messages.create(", "messages.stream(", "runAnalysis("]
const PASS_MARKERS = ["guardAiUsage(", "verifyCronRequest"]

/**
 * Routes whose cap predates guardAiUsage and is implemented another way.
 * Every entry needs a reason. New AI routes should use guardAiUsage instead
 * of growing this list.
 */
const EQUIVALENT_CAP_ALLOWLIST = {
  "app/api/analyse/route.ts":              "per-tier daily cap counted from the analyses table",
  "app/api/analyse/stream/route.ts":       "per-tier daily cap counted from the analyses table (shared with /api/analyse)",
  "app/api/analyse-meal/route.ts":         "per-IP burst limit + per-tier daily cap counted from the analyses table (scores via lib/analysis core)",
  "app/api/analyse-plate/route.ts":        "public scan route — per-IP rateLimit burst cap",
  "app/api/consult/route.ts":              "own table-count cap (consultations table)",
  "app/api/food-intelligence/route.ts":    "own table-count cap (food_intelligence_reports table)",
  "app/api/gut-health-story/route.ts":     "own per-tier daily counter persisted in profiles.food_system_story",
  "app/api/demo/consult/route.ts":         "public demo — per-IP rateLimit burst cap (no user identity available)",
  "app/api/generate-report/route.ts":      "per-IP rateLimit burst cap on the free-report flow",
  "app/api/generate-deep-questions/route.ts": "post-payment flow keyed to a paid Stripe session (do-not-modify route)",
  "app/api/submit-deep-assessment/route.ts":  "post-payment flow keyed to a paid Stripe session (do-not-modify route)",
}

const flagged = []
const staleAllowlist = []
const seen = new Set()

for (const file of findRouteFilesUnder(path.join(repoRoot, "app/api"))) {
  const src = readFileSync(file, "utf8")
  const rel = path.relative(repoRoot, file)
  const callsAi = AI_CALL_MARKERS.some((m) => src.includes(m))
  if (!callsAi) continue
  seen.add(rel)

  if (PASS_MARKERS.some((m) => src.includes(m))) continue
  if (rel in EQUIVALENT_CAP_ALLOWLIST) continue
  flagged.push(rel)
}

for (const rel of Object.keys(EQUIVALENT_CAP_ALLOWLIST)) {
  if (!seen.has(rel)) staleAllowlist.push(rel)
}

if (flagged.length > 0 || staleAllowlist.length > 0) {
  if (flagged.length > 0) {
    console.error("AI cost-guard check failed.")
    console.error("These routes call Claude but have no guardAiUsage(), no cron auth,")
    console.error("and no allowlisted equivalent cap:\n")
    for (const f of flagged) console.error(`  - ${f}`)
    console.error("\nWire guardAiUsage (lib/ai-guard.ts — add an AI_LIMITS entry) right after")
    console.error("auth + tier checks. Only add to EQUIVALENT_CAP_ALLOWLIST in")
    console.error("scripts/check-ai-guard.mjs if the route genuinely has its own cap, and")
    console.error("say what it is.")
  }
  if (staleAllowlist.length > 0) {
    console.error("\nStale allowlist entries (file missing or no longer calls Claude) —")
    console.error("remove them from EQUIVALENT_CAP_ALLOWLIST:\n")
    for (const f of staleAllowlist) console.error(`  - ${f}`)
  }
  process.exit(1)
}

console.log(`AI cost-guard check passed — ${seen.size} Claude-calling routes, all capped.`)
