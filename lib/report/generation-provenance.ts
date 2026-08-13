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
 * This value answers that question directly, and it describes the CONTENT of the
 * report rather than the request that happened to touch it. That distinction is
 * what makes reuse correct: re-serving a stored report, or attaching a derived
 * add-on lens to it, does not change who wrote the prose, so the original source
 * is preserved rather than overwritten with something like "reused".
 *
 * ── Deliberately inert ───────────────────────────────────────────────────────
 *
 * A deterministic fallback is still a successfully delivered report. This marker
 * must never influence `overall_status`, the partial-delivery owner alert,
 * customer access, PDF/email delivery or retry behaviour — all of which key off
 * `pdf_status`/`email_status`/`report_json`, never this. Tests assert that.
 */
export type GenerationSource =
  | "claude_generated"
  | "deterministic_no_api_key"
  | "deterministic_claude_error"
  | "deterministic_validation_failure"
  | "legacy_unknown"

export const GENERATION_SOURCES: readonly GenerationSource[] = [
  "claude_generated",
  "deterministic_no_api_key",
  "deterministic_claude_error",
  "deterministic_validation_failure",
  "legacy_unknown",
]

export function isGenerationSource(value: unknown): value is GenerationSource {
  return typeof value === "string" && (GENERATION_SOURCES as readonly string[]).includes(value)
}

/** Where the marker lives inside `report_json`. */
export type ReportMeta = { generationSource?: string }

/**
 * Read the provenance off a stored report.
 *
 * Anything absent, malformed, or carrying a value this build does not recognise
 * reads as `legacy_unknown` — the honest answer for a row written before this
 * shipped. It is deliberately NOT an error: those reports are valid and must
 * stay viewable.
 */
export function readGenerationSource(reportJson: unknown): GenerationSource {
  if (!reportJson || typeof reportJson !== "object") return "legacy_unknown"
  const meta = (reportJson as { _meta?: unknown })._meta
  if (!meta || typeof meta !== "object") return "legacy_unknown"
  const raw = (meta as ReportMeta).generationSource
  return isGenerationSource(raw) ? raw : "legacy_unknown"
}

/**
 * Stamp the provenance onto a report.
 *
 * MUST be applied last on the generation path. The success branch builds its
 * result by spreading Claude's own parsed response, so a model that returned a
 * `_meta` of its own would otherwise decide its own provenance. Stamping after
 * the spread makes the server's value authoritative; a test drives a hostile
 * `_meta` through to prove it.
 */
export function withGenerationSource<T extends object>(report: T, source: GenerationSource): T {
  const existingMeta =
    (report as { _meta?: unknown })._meta && typeof (report as { _meta?: unknown })._meta === "object"
      ? ((report as { _meta: Record<string, unknown> })._meta as Record<string, unknown>)
      : {}

  return { ...report, _meta: { ...existingMeta, generationSource: source } }
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

export type GenerationLogFields = {
  source: GenerationSource
  tier: string
  /** Report mode — "you" | "family" | "combined" etc. */
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
 * credentials, and the raw session id. Everything here is either an enum, a
 * boolean, or a one-way hash.
 */
export function logGenerationSource(fields: GenerationLogFields): void {
  console.info(
    `[submit-deep-assessment] report_source ${JSON.stringify({
      event: "report_generation_source",
      ...fields,
    })}`,
  )
}
