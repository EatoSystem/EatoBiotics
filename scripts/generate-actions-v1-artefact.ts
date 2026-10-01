#!/usr/bin/env node
/**
 * Renders actions-v1.0 as one reviewable document.
 *
 * The point of this file is that a scientific reviewer can answer "exactly what
 * does EatoBiotics recommend, to whom, why, and on what evidence?" from a
 * single artefact, while the repository keeps ONE copy of each sentence.
 * Generated, never hand-edited — and a test regenerates it and fails if the
 * committed copy has drifted, so the artefact cannot quietly describe a
 * catalogue that no longer exists.
 *
 * Generated rather than a fifth `docs/fss/FSS_V1_*.md`, deliberately:
 * `product-constitution.test.ts` pins `FSS_DOCS` to four documents and runs the
 * candidate-label, non-stub and Scale-ladder checks over them. A fifth would
 * sit outside that list and inherit none of them — a document that looks
 * governed and is not.
 *
 *   npx tsx scripts/generate-actions-v1-artefact.ts          # write
 *   npx tsx scripts/generate-actions-v1-artefact.ts --check  # verify only
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { ACTION_CATALOGUE, REASSESSMENT, THIRTY_DAY_FOCUS } from "@/lib/fss/action/catalogue"
import { ACTION_CATEGORIES, ACTION_CATEGORY_ORDER } from "@/lib/fss/action/categories"
import { TIME_HORIZONS, TIME_HORIZON_ORDER } from "@/lib/fss/action/horizons"
import { ACTION_SET_VERSION, type ActionCategory, type ContextConstraint } from "@/lib/fss/action/types"
import { CONSTRAINT_LABELS } from "@/lib/fss/presentation/plan"
import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { FSS_V1_PROVENANCE } from "@/lib/fss/engine/provenance"
import type { FssDomain } from "@/lib/fss/questions/types"

const OUT = "docs/fss/generated/ACTIONS_V1_RESOLVED.md"

const DOMAINS: FssDomain[] = [
  "diversity",
  "plantsAndFibre",
  "fermentedFoods",
  "foodQuality",
  "mealRhythm",
]

const CLAIM_CLASS_NOTE: Record<string, string> = {
  "observed-behaviour": "**Observed behaviour** — describes what the answers said",
  "self-reported": "**Self-reported** — describes what the person reported noticing",
  "general-education": "**General education** — about food, impersonal, not about the person",
  "personalised-recommendation": "**Personalised recommendation** — an action, never its result",
}

function requiresNote(requires: readonly ContextConstraint[]): string {
  if (requires.length === 0) {
    return "Asks nothing of the person's time, money, access or kitchen — always offerable."
  }
  return `Needs: ${requires.map((r) => CONSTRAINT_LABELS[r]).join(", ")}. Not offered to anyone who described one of those as being in the way.`
}

function render(): string {
  const lines: string[] = []

  lines.push("# Actions v1.0 — the resolved recommendation set")
  lines.push("")
  lines.push("> **GENERATED FILE — do not edit.**")
  lines.push("> `npx tsx scripts/generate-actions-v1-artefact.ts`")
  lines.push("")
  lines.push(
    "> ### FSS-v1 Candidate — Frozen for Scientific Review, Not Yet Scientifically Approved",
  )
  lines.push("")
  lines.push(
    "Everything EatoBiotics would recommend under `actions-v1.0`, with the reason it " +
      "would give, the class of claim that reason makes, and the circumstances it needs. " +
      "It exists so that one artefact answers *\"exactly what does the product recommend, " +
      "to whom, why, and on what evidence?\"* while the repository keeps a single copy of " +
      "each sentence.",
  )
  lines.push("")
  lines.push(
    "**A recommendation is never just generated text.** Every entry below is selected " +
      "deterministically from a priority, which is itself derived from named answers to " +
      "named questions. No model writes any of it.",
  )
  lines.push("")

  /* ── At a glance ───────────────────────────────────────────────────────── */
  lines.push("## At a glance")
  lines.push("")
  lines.push("| | |")
  lines.push("|---|---|")
  lines.push(`| Action set version | \`${ACTION_SET_VERSION}\` |`)
  lines.push(`| Scoring method it accompanies | \`${FSS_V1_PROVENANCE.fssMethodVersion}\` |`)
  lines.push(`| Recommendations in total | ${ACTION_CATALOGUE.length} |`)
  for (const h of TIME_HORIZON_ORDER) {
    const n = ACTION_CATALOGUE.filter((e) => e.timeHorizon === h).length
    const note = h === "thirty-days" ? " — a month is one behaviour to hold, not a list" : ""
    lines.push(`| ${TIME_HORIZONS[h].label} | ${n}${note} |`)
  }
  lines.push(
    `| Always offerable (ask nothing of the person) | ${ACTION_CATALOGUE.filter((e) => e.requires.length === 0).length} |`,
  )
  lines.push("")

  /* ── The categories ───────────────────────────────────────────────────── */
  lines.push("## Feed · Seed · Rejuvenate")
  lines.push("")
  lines.push(
    "Action categories, not score categories. **No number is attached to any of them**, " +
      "and none of them maps to a Biotic — an action is Feed because of what it is, not " +
      "because of which domain surfaced it.",
  )
  lines.push("")
  for (const c of ACTION_CATEGORY_ORDER) {
    lines.push(`- **${ACTION_CATEGORIES[c].label}** — ${ACTION_CATEGORIES[c].meaning}`)
  }
  lines.push("")

  /* ── The horizons ─────────────────────────────────────────────────────── */
  lines.push("## The three horizons")
  lines.push("")
  lines.push(
    "**A horizon says when you do it, never when it works.** No entry below carries a " +
      "predicted outcome, and no frequency is a duration until an effect.",
  )
  lines.push("")
  lines.push("| Horizon | Answers | Cadence |")
  lines.push("|---|---|---|")
  for (const h of TIME_HORIZON_ORDER) {
    const m = TIME_HORIZONS[h]
    lines.push(`| **${m.label}** | ${m.question} | ${m.cadence} |`)
  }
  lines.push("")

  /* ── Category coverage ────────────────────────────────────────────────── */
  lines.push("## What each domain offers, and what it does not")
  lines.push("")
  lines.push(
    "**No priority is padded to fill a category.** Forcing three per domain would mean " +
      "inventing an action, and an invented action is what a structured recommendation " +
      "exists to make impossible.",
  )
  lines.push("")
  lines.push("| Domain | Categories offered |")
  lines.push("|---|---|")
  for (const d of DOMAINS) {
    const cats = ACTION_CATEGORY_ORDER.filter((c) =>
      ACTION_CATALOGUE.some((e) => e.domain === d && e.category === c),
    ) as ActionCategory[]
    lines.push(
      `| ${DOMAIN_PRESENTATION[d].label} | ${cats.map((c) => ACTION_CATEGORIES[c].label).join(" · ")} |`,
    )
  }
  lines.push("")

  /* ── The entries, by domain ───────────────────────────────────────────── */
  for (const d of DOMAINS) {
    lines.push(`## ${DOMAIN_PRESENTATION[d].label}`)
    lines.push("")
    lines.push(`*Priority headline:* ${DOMAIN_PRESENTATION[d].priorityHeadline}`)
    lines.push("")

    for (const h of ["today", "this-week"] as const) {
      const mine = ACTION_CATALOGUE.filter((e) => e.domain === d && e.timeHorizon === h)
      if (mine.length === 0) continue
      lines.push(`### ${TIME_HORIZONS[h].label}`)
      lines.push("")
      for (const e of mine) {
        lines.push(`**${e.title}**`)
        lines.push("")
        lines.push(
          `\`${e.id}\` · ${ACTION_CATEGORIES[e.category].label} · pending sign-off`,
        )
        lines.push("")
        lines.push(`- **Do:** ${e.practicalAction}`)
        lines.push(`- **Why:** ${e.rationale}`)
        lines.push(`- **How often:** ${e.suggestedFrequency}`)
        lines.push(`- **Claim class:** ${CLAIM_CLASS_NOTE[e.claimClass]}`)
        lines.push(`- **Circumstances:** ${requiresNote(e.requires)}`)
        lines.push("")
      }
    }

    lines.push(`### ${TIME_HORIZONS["thirty-days"].label}`)
    lines.push("")
    lines.push(`- **Hold:** ${THIRTY_DAY_FOCUS[d].behaviour}`)
    lines.push(`- **Why this one:** ${THIRTY_DAY_FOCUS[d].whyThisOne}`)
    lines.push("")
  }

  /* ── Reassessment ─────────────────────────────────────────────────────── */
  lines.push("## Reassessment")
  lines.push("")
  lines.push(`- **After:** ${REASSESSMENT.afterDays} days`)
  lines.push(`- **Compares:** ${REASSESSMENT.whatItCompares}`)
  lines.push(`- **Comparability rule:** ${REASSESSMENT.comparabilityRule}`)
  lines.push("")
  lines.push(
    "Nothing in this version computes a comparison. The rule is taken from " +
      "`lib/fss/engine/compare.ts`, which refuses cross-version comparison by default, so " +
      "there is one place that decides what two results may be said about each other.",
  )
  lines.push("")

  /* ── The closing refusal ──────────────────────────────────────────────── */
  lines.push("---")
  lines.push("")
  lines.push("## What this document does not establish")
  lines.push("")
  lines.push(
    "That any of it is approved. The five domains have no named scientific reviewer, the " +
      "weights are a non-production fixture, seven of the twenty-two assessment items are " +
      "drafts, and this recommendation set is reviewed copy rather than reviewed science. " +
      "Every entry carries `status: \"candidate-pending-review\"` when it reaches a person, " +
      "and no surface may present it as settled.",
  )
  lines.push("")
  lines.push(
    "Nor is any of it medical advice. See `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` for the " +
      "sentence-level rules every line above obeys, and " +
      "`docs/fss/FSS_V1_EVIDENCE_MATRIX.md` for what each observation does and does not " +
      "support.",
  )
  lines.push("")
  return lines.join("\n")
}

const content = render()
if (process.argv.includes("--check")) {
  const existing = existsSync(OUT) ? readFileSync(OUT, "utf-8") : ""
  if (existing !== content) {
    console.error(`${OUT} is out of date. Run: npx tsx scripts/generate-actions-v1-artefact.ts`)
    process.exit(1)
  }
  console.log(`${OUT} is up to date.`)
} else {
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, content, "utf-8")
  console.log(`Wrote ${OUT} (${ACTION_CATALOGUE.length} recommendations).`)
}
