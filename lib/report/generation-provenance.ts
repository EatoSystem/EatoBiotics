import { createHash } from "node:crypto"

/**
 * What actually produced the prose in a paid report.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * `report_error` records *why* a fallback was used, and it is written in exactly
 * one place and read nowhere — a diagnostic string, not a contract. It also has
 * a hole: when Claude responds but the merged `foodSystem` fails validation, the
 * route ships the derived base and leaves `report_error` null, so the row looks
 * identical to a fully successful generation. Anyone auditing "did the model
 * actually write this?" got the wrong answer.
 *
 * ── Why three values and not one ─────────────────────────────────────────────
 *
 * Accepting a model response is NOT the same as shipping model prose. Both
 * overlays — `mergeGeneratedNarrative` for the Food System block and
 * `mergeGeneratedLens` for the purchased add-on lens — fall back field by field
 * and, if the model omits the key entirely, return the deterministic base
 * verbatim. The derived base always validates, so a response carrying no
 * `foodSystem` at all still produces an accepted, valid report in which every
 * customer-visible narrative string was written by this codebase.
 *
 * A single marker therefore cannot answer the question. `generationSource`
 * records what happened to the REQUEST; the two narrative values record what
 * happened to the CONTENT, one per independently-merged layer.
 *
 * ── Deliberately inert ───────────────────────────────────────────────────────
 *
 * A deterministic fallback is still a successfully delivered report. None of
 * these values may influence `overall_status`, the partial-delivery owner alert,
 * customer access, PDF/email delivery or retry behaviour — all of which key off
 * `pdf_status`/`email_status`/`report_json`, never this. Tests assert that.
 */
export type GenerationSource =
  /** A model response arrived, parsed, and the assembled block validated. Says
   *  nothing on its own about whether any model prose survived the merge. */
  | "claude_response_accepted"
  | "deterministic_no_api_key"
  | "deterministic_claude_error"
  /** A model response arrived but the merged block failed validation and was
   *  discarded; the derived base shipped instead. */
  | "deterministic_validation_failure"
  | "legacy_unknown"

/**
 * Whether the Food System narrative a customer reads contains model prose.
 *
 * `claude_contributed` is deliberately weaker than "Claude wrote this": the
 * overlay is per-field, so it means *at least one* permitted narrative field
 * took a model value that differs from the deterministic one. A mixed report is
 * the normal case and must not be described as fully generated.
 */
export type FoodSystemNarrativeSource = "claude_contributed" | "deterministic" | "legacy_unknown"

/**
 * The same, for the purchased add-on lens.
 *
 * `not_applicable` means no entitled add-on — the shipped report has no lens at
 * all. It never means "a lens exists and we could not tell": that is
 * `legacy_unknown`.
 */
export type AddonLensNarrativeSource =
  | "claude_contributed"
  | "deterministic"
  | "not_applicable"
  | "legacy_unknown"

export type ReportProvenance = {
  generationSource: GenerationSource
  foodSystemNarrativeSource: FoodSystemNarrativeSource
  addonLensNarrativeSource: AddonLensNarrativeSource
}

export const GENERATION_SOURCES: readonly GenerationSource[] = [
  "claude_response_accepted",
  "deterministic_no_api_key",
  "deterministic_claude_error",
  "deterministic_validation_failure",
  "legacy_unknown",
]

export const FOOD_SYSTEM_NARRATIVE_SOURCES: readonly FoodSystemNarrativeSource[] = [
  "claude_contributed",
  "deterministic",
  "legacy_unknown",
]

export const ADDON_LENS_NARRATIVE_SOURCES: readonly AddonLensNarrativeSource[] = [
  "claude_contributed",
  "deterministic",
  "not_applicable",
  "legacy_unknown",
]

const oneOf =
  <T extends string>(allowed: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (allowed as readonly string[]).includes(value)

export const isGenerationSource = oneOf(GENERATION_SOURCES)
export const isFoodSystemNarrativeSource = oneOf(FOOD_SYSTEM_NARRATIVE_SOURCES)
export const isAddonLensNarrativeSource = oneOf(ADDON_LENS_NARRATIVE_SOURCES)

/** What every field reads as when a stored report predates this, or is malformed. */
export const LEGACY_PROVENANCE: ReportProvenance = {
  generationSource: "legacy_unknown",
  foodSystemNarrativeSource: "legacy_unknown",
  addonLensNarrativeSource: "legacy_unknown",
}

/**
 * Read the provenance off a stored report.
 *
 * Validated per field, so a row half-written by some future shape still yields
 * honest answers for the fields it does carry. Anything absent, malformed, or
 * carrying a value this build does not recognise reads as `legacy_unknown` —
 * the honest answer for a row written before this shipped. Deliberately NOT an
 * error: those reports are valid and must stay viewable.
 *
 * Forward-compatibility note, stated because it is a real one-way door: an
 * OLDER build reading a value a NEWER build introduced sees `legacy_unknown`,
 * and because the route re-stamps on reuse it will persist that downgrade. Add
 * new values to `GENERATION_SOURCES` and deploy before writing them.
 */
export function readProvenance(reportJson: unknown): ReportProvenance {
  if (!reportJson || typeof reportJson !== "object") return LEGACY_PROVENANCE
  const meta = (reportJson as { _meta?: unknown })._meta
  if (!meta || typeof meta !== "object") return LEGACY_PROVENANCE

  const m = meta as Record<string, unknown>
  return {
    generationSource: isGenerationSource(m.generationSource) ? m.generationSource : "legacy_unknown",
    foodSystemNarrativeSource: isFoodSystemNarrativeSource(m.foodSystemNarrativeSource)
      ? m.foodSystemNarrativeSource
      : "legacy_unknown",
    addonLensNarrativeSource: isAddonLensNarrativeSource(m.addonLensNarrativeSource)
      ? m.addonLensNarrativeSource
      : "legacy_unknown",
  }
}

/**
 * The lens attribution to keep when a stored report is re-served.
 *
 * Re-serving is not generation, so the stored values are preserved — but the
 * stored LENS value only describes the lens that was stored. `reconcileAddonLens`
 * runs on every reuse and will derive a lens the row never had, or swap it for
 * a different add-on; in both cases the lens the customer now reads was written
 * by this codebase, whatever the row said about the old one.
 *
 * Extracted from the route so the rule can be tested against
 * `reconcileAddonLens`'s real outcomes instead of being restated in a test.
 *
 * @param storedLensKey Lens key on the stored report, or null.
 * @param finalLensKey  Lens key after reconciliation, or null.
 */
export function reusedAddonLensSource(
  stored: ReportProvenance,
  storedLensKey: string | null,
  finalLensKey: string | null,
): AddonLensNarrativeSource {
  if (finalLensKey === null) return "not_applicable"
  if (finalLensKey !== storedLensKey) return "deterministic"
  // A stored `not_applicable` alongside a surviving lens is a row contradicting
  // itself; `legacy_unknown` is the honest read, not a guess in either direction.
  if (stored.addonLensNarrativeSource === "not_applicable") return "legacy_unknown"
  return stored.addonLensNarrativeSource
}

/**
 * Stamp the provenance onto a report.
 *
 * MUST be applied last on the generation path. The success branch builds its
 * result by spreading Claude's own parsed response, so a model that returned a
 * `_meta` of its own would otherwise decide its own provenance.
 *
 * `_meta` is written FRESH, field by field — never spread from what is already
 * there. Nothing else in the codebase writes `_meta`, so merging would buy
 * nothing and would let a model persist arbitrary sibling keys into a namespace
 * named for server metadata, and from there into the page payload. A test
 * drives a hostile `_meta` through to prove both halves of that.
 */
export function withProvenance<T extends object>(report: T, provenance: ReportProvenance): T {
  return {
    ...report,
    _meta: {
      generationSource: provenance.generationSource,
      foodSystemNarrativeSource: provenance.foodSystemNarrativeSource,
      addonLensNarrativeSource: provenance.addonLensNarrativeSource,
    },
  }
}

/**
 * A short, one-way tag for correlating log lines to a row.
 *
 * Never the raw Stripe session id: that is a checkout identifier and does not
 * belong in application logs. Twelve hex characters is ample to line a log entry
 * up against a `deep_assessments` row during an investigation, and cannot be
 * reversed into the session.
 */
export function sessionTag(sessionId: string): string {
  return createHash("sha256").update(sessionId, "utf8").digest("hex").slice(0, 12)
}

export type GenerationLogFields = ReportProvenance & {
  tier: string
  /** Report mode — "you" | "family" | "combined". */
  mode: string
  /** Purchased add-on key, or null. Never free text. */
  addon: string | null
  /** True when the report was re-served rather than generated in this request. */
  reuse: boolean
  sessionTag: string
}

/**
 * One structured line at the moment the content source is decided.
 *
 * Operational fields only. Deliberately absent: answers, question text, customer
 * name or email, any report prose, Stripe secrets, signed URLs, service
 * credentials, and the raw session id. Everything here is either a validated
 * enum, a boolean, or a one-way hash.
 */
export function logGenerationSource(fields: GenerationLogFields): void {
  console.info(
    `[submit-deep-assessment] report_source ${JSON.stringify({
      event: "report_generation_source",
      ...fields,
    })}`,
  )
}
