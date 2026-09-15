/**
 * The test seam — Phase 4A-S4.
 *
 * `ensureReportWithDependencies` takes its database through an interface so the
 * suite can drive every branch — a read error, a confirmed absence, a race lost
 * to another writer — without a database. That seam is genuinely useful and
 * genuinely dangerous: a production caller reaching it could hand in a client
 * that answers anything at all.
 *
 * So it is re-exported HERE, in a module only files under `tests/` may import,
 * proved by a repository-wide walk. Isolation is structural, not conditional:
 * `ensurePersistedConsultationReport` has no client parameter for a fake to
 * travel through, and `internal/` is importable only from the entry point, its
 * siblings and tests. Deliberately NOT a `NODE_ENV` check — a runtime condition
 * is one misconfiguration away from being true in production.
 */

export { ensureReportWithDependencies } from "../internal/ensure-core"
export type {
  EnsureCoreInput,
  ReportPersistenceClient,
} from "../internal/ensure-core"
export type {
  AssessmentRowForHistory,
  PersistedReportRow,
} from "../internal/historical-read"
