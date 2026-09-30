#!/usr/bin/env node
/**
 * Renders the resolved questions-v1.0 as one reviewable document.
 *
 * The point of this file is that a scientific reviewer can answer "exactly
 * what does Assessment v1.0 ask?" from a single artefact, while the repository
 * keeps ONE copy of each question's text. Generated, never hand-edited — and a
 * test regenerates it and fails if the committed copy has drifted, so the
 * artefact cannot quietly describe an instrument that no longer exists.
 *
 *   npx tsx scripts/generate-assessment-v1-artefact.ts          # write
 *   npx tsx scripts/generate-assessment-v1-artefact.ts --check  # verify only
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import type { ResolvedQuestion } from "@/lib/fss/questions/types"

const OUT = "docs/fss/generated/ASSESSMENT_V1_RESOLVED.md"

const PART_TITLES: Record<string, string> = {
  "what-you-eat": "Part 1 — What You Eat",
  "how-you-eat": "Part 2 — How You Eat",
  "what-you-notice": "Part 3 — What You Notice",
  "your-food-context": "Part 4 — Your Food Context",
}

const CONTRIBUTION: Record<string, string> = {
  fss: "**Scored** — contributes to the Food System Score",
  "what-you-notice": "**Unscored** — reported back, reaches the Score by no path",
  "food-context": "**Unscored** — shapes the Plan, never the Score",
}

const DOMAIN_LABEL: Record<string, string> = {
  diversity: "Diversity",
  plantsAndFibre: "Plants & Fibre",
  fermentedFoods: "Fermented Foods",
  foodQuality: "Food Quality",
  mealRhythm: "Meal Rhythm",
}

function render(): string {
  const set = resolveQuestionSetV1()

  const lines: string[] = []
  lines.push("# Assessment v1.0 — the resolved instrument")
  lines.push("")
  lines.push("> **GENERATED FILE — do not edit.**")
  lines.push("> `npx tsx scripts/generate-assessment-v1-artefact.ts`")
  lines.push("")
  lines.push("> ### FSS-v1 Candidate — Frozen for Scientific Review, Not Yet Scientifically Approved")
  lines.push("")
  lines.push(
    "This is what `questions-v1.0` resolves to, in the order a person meets it. " +
      "It exists so that one artefact answers *\"exactly what does Assessment v1.0 ask?\"* " +
      "while the repository keeps a single copy of each question's text.",
  )
  lines.push("")
  lines.push(
    "Items marked **legacy-frozen** are referenced from `lib/assessment-data.ts` and pinned " +
      "to a content hash; their wording is not this version's to change. Items marked " +
      "**candidate-v1** are owned by this version and are drafts pending sign-off.",
  )
  lines.push("")

  const scored = set.questions.filter((q) => q.contributes === "fss")
  const byDomain: Record<string, number> = {}
  for (const q of scored) byDomain[q.domain!] = (byDomain[q.domain!] ?? 0) + 1

  lines.push("## At a glance")
  lines.push("")
  lines.push(`| | |`)
  lines.push(`|---|---|`)
  lines.push(`| Assessment version | \`${set.assessmentVersion}\` |`)
  lines.push(`| Question set version | \`${set.questionSetVersion}\` |`)
  lines.push(`| Items in total | ${set.questions.length} |`)
  lines.push(`| Scored | ${scored.length} |`)
  lines.push(`| What You Notice | ${set.questions.filter((q) => q.contributes === "what-you-notice").length} |`)
  lines.push(`| Your Food Context | ${set.questions.filter((q) => q.contributes === "food-context").length} |`)
  lines.push(`| Referenced from the frozen instrument | ${set.questions.filter((q) => q.origin === "legacy-frozen").length} |`)
  lines.push(`| Owned by this version (drafts) | ${set.questions.filter((q) => q.origin === "candidate-v1").length} |`)
  lines.push("")
  lines.push("**Scored items per domain** — a domain resting on one item is fragile, which is why Food Quality gained two.")
  lines.push("")
  lines.push("| Domain | Items |")
  lines.push("|---|---|")
  for (const [d, n] of Object.entries(byDomain)) lines.push(`| ${DOMAIN_LABEL[d] ?? d} | ${n} |`)
  lines.push("")

  let currentPart: string | null = null
  let currentSection: string | null = null
  for (const q of set.questions as ResolvedQuestion[]) {
    if (q.part !== currentPart) {
      currentPart = q.part
      currentSection = null
      lines.push(`## ${PART_TITLES[q.part]}`)
      lines.push("")
    }
    if (q.sectionTitle !== currentSection) {
      currentSection = q.sectionTitle
      lines.push(`### ${q.sectionTitle}`)
      lines.push("")
    }
    const tags = [
      `\`${q.id}\``,
      q.origin === "legacy-frozen" ? "legacy-frozen" : "candidate-v1",
      q.domain ? DOMAIN_LABEL[q.domain] : null,
      q.status === "draft-pending-review" ? "**draft — pending sign-off**" : null,
    ].filter(Boolean)
    lines.push(`**${q.order}. ${q.text}**`)
    lines.push("")
    lines.push(tags.join(" · "))
    lines.push("")
    lines.push(CONTRIBUTION[q.contributes])
    lines.push("")
    for (const o of q.options) {
      lines.push(`- \`${o.value}\` **${o.label}**${o.description ? ` — ${o.description}` : ""}`)
    }
    lines.push("")
  }

  lines.push("---")
  lines.push("")
  lines.push("## What this document does not establish")
  lines.push("")
  lines.push(
    "That any of it is approved. No domain has a named reviewer, the weights are not chosen, " +
      "and the items marked draft have not been through sign-off. See " +
      "`docs/fss/FSS_V1_SPEC.md` for the fourteen fields each domain still needs, and " +
      "`docs/fss/FSS_V1_EVIDENCE_MATRIX.md` for what each observation does and does not support.",
  )
  lines.push("")
  return lines.join("\n")
}

const content = render()
if (process.argv.includes("--check")) {
  const existing = existsSync(OUT) ? readFileSync(OUT, "utf-8") : ""
  if (existing !== content) {
    console.error(`${OUT} is out of date. Run: npx tsx scripts/generate-assessment-v1-artefact.ts`)
    process.exit(1)
  }
  console.log(`${OUT} is up to date.`)
} else {
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, content, "utf-8")
  console.log(`Wrote ${OUT}`)
}
