import { candidateSecretsFor, isHandoffId, secretMatchesHash } from "./capability"
import { sameEmailIdentity } from "./email-identity"
import type {
  AuthorisedReportAccess,
  OperationalSeverity,
  ReportAccessProof,
} from "./types"

/**
 * The authorisation boundary — Phase 4B-S1.
 *
 * ══ THE ONE QUESTION THIS ANSWERS ═══════════════════════════════════════════
 *
 * "May you see it." Phase 4A-S4 answers "what is the canonical Report for this
 * sealed Consultation" and says in its own contract that it is NOT the customer
 * authentication boundary. This is that boundary, and it is nothing else: it
 * does not compose, read, persist or render a Report, and it never calls
 * `ensurePersistedConsultationReport`. It hands back a locator that a delivery
 * service may then use.
 *
 * ══ A LOCATOR AND A PROOF, AND NOTHING ELSE ═════════════════════════════════
 *
 * No Report content, no finalisation, no foundation, no lens, no digest, no
 * handoff claim beyond the locator, no database client. A caller cannot assert
 * authority here because there is no parameter through which an assertion could
 * travel — the same discipline S4 applies to its own entry point, and for the
 * same reason.
 *
 * ══ WHY THE HANDOFF ID IS THE PUBLIC LOCATOR ════════════════════════════════
 *
 * It is opaque, stable and immutable, and possession of it grants NOTHING. The
 * alternative was `stripe_session_id`, which is a payment identity that also
 * unlocks the live consultation routes — and a Report URL is exactly the kind
 * of thing that gets bookmarked, shared and logged.
 *
 * ══ WHY NOT `ownerOrFilter` ═════════════════════════════════════════════════
 *
 * `lib/supabase-filters.ts` offers `user_id = … OR email = …`, and
 * `app/api/account/pdf-url/route.ts` uses it for the legacy PDF. It is rejected
 * here. An email is a claim about a person; `user_id` is a binding. Once an
 * account owns a row, an address must not be able to reach it — otherwise
 * anyone who can receive mail at the original purchase address outranks the
 * account that was deliberately linked to it.
 */

/** Exactly the columns authorisation needs. Deliberately not `select("*")`. */
export interface AssessmentAccessRow {
  readonly id: string
  /** S4's internal locator. Returned to the caller, never to a browser. */
  readonly stripe_session_id: string
  readonly user_id: string | null
  readonly email: string | null
  readonly consultation_handoff_id: string | null
}

export interface CapabilityRow {
  readonly assessment_id: string
  readonly consultation_handoff_id: string
  readonly token_hash: string
  readonly revoked_at: string | null
}

/**
 * Reads, injected.
 *
 * The same shape as S4's `ensure-core`: this module imports no Supabase, so the
 * authority logic can be exercised exhaustively without a database and cannot
 * acquire a client by accident.
 *
 * Both reads distinguish "could not read" from "read, and there was nothing".
 * Collapsing them into `data ?? null` is the §15 failure S4 was built around —
 * here it would turn a database blip into "you are not authorised", which is
 * both wrong and unfixable by the customer.
 */
export interface ReportAccessClient {
  readAssessmentByHandoff(
    handoffId: string,
  ): Promise<{ ok: true; row: AssessmentAccessRow | null } | { ok: false; detail: string }>
  readCapability(
    assessmentId: string,
  ): Promise<{ ok: true; row: CapabilityRow | null } | { ok: false; detail: string }>
}

export type ReportAccessResult =
  | { readonly ok: true; readonly access: AuthorisedReportAccess }
  | {
      readonly ok: false
      /** The ONLY field a response may be derived from. */
      readonly external: "report_not_found" | "report_temporarily_unavailable"
      /**
       * SERVER-ONLY, both of these. Never serialised, never logged into a
       * response body, never given to a browser. They exist so operators are
       * not handed a black box — the external contract deliberately says
       * nothing, and something has to.
       */
      readonly serverNote: string
      readonly severity: OperationalSeverity
    }

/**
 * Every authorisation failure produces THIS, byte for byte.
 *
 * Unauthorised and nonexistent must be indistinguishable. If they were not, the
 * pair of responses would be an oracle: present a handoff id and learn from the
 * status whether that Report exists. Same discipline as the legacy PDF route's
 * uniform 404 (`app/api/account/pdf-url/route.ts:35-37`).
 *
 * Honest limit: this equalises CONTENT and STATUS, not timing. Timing is not
 * equalised and this file does not claim it is — the enumeration risk is bounded
 * instead by the locator being a 122-bit random uuid, which is not walkable
 * whatever the response takes.
 */
function denied(serverNote: string, severity: OperationalSeverity = "expected"): ReportAccessResult {
  return { ok: false, external: "report_not_found", serverNote, severity }
}

function unavailable(serverNote: string): ReportAccessResult {
  return {
    ok: false,
    external: "report_temporarily_unavailable",
    serverNote,
    severity: "infrastructure",
  }
}

export async function resolveReportAccess(input: {
  handoffId: string
  proof: ReportAccessProof
  client: ReportAccessClient
}): Promise<ReportAccessResult> {
  // Shape-check before touching the database. A locator that cannot be one we
  // issued gets the same answer as one that simply is not there, and costs no
  // read — so a scanner cannot use this endpoint to generate database load.
  if (!isHandoffId(input.handoffId)) return denied("locator is not a handoff id")

  const assessment = await input.client.readAssessmentByHandoff(input.handoffId)
  if (!assessment.ok) return unavailable(`assessment read failed: ${assessment.detail}`)
  if (assessment.row === null) return denied("no assessment for this handoff")

  const row = assessment.row

  // Defence in depth. The query filtered on this column, so a disagreement means
  // the client handed back a row it was not asked for — integrity, not a missing
  // Report, and the customer is still told nothing.
  if (row.consultation_handoff_id !== input.handoffId) {
    return denied("row handoff disagrees with the requested locator", "integrity")
  }

  // `stripe_session_id` is the primary key of `deep_assessments`, so an empty
  // one is impossible rather than unusual. Refuse rather than hand a blank
  // locator onwards, and classify it as what it is.
  if (typeof row.stripe_session_id !== "string" || row.stripe_session_id.length === 0) {
    return denied("row carries no session locator", "integrity")
  }

  const authorised: AuthorisedReportAccess = {
    assessmentId: row.id,
    handoffId: input.handoffId,
    sessionId: row.stripe_session_id,
  }

  if (input.proof.kind === "account") {
    /* ── Account ownership ──────────────────────────────────────────────────
     *
     * The asymmetry is the whole point. With an owner present, only that owner
     * matches. With no owner, a verified address may establish PROVISIONAL
     * ownership — which is what makes guest purchase recoverable — and the
     * moment linking sets `user_id`, this branch stops consulting email at all,
     * including for the same person.
     */
    if (row.user_id !== null) {
      return row.user_id === input.proof.userId
        ? { ok: true, access: authorised }
        : denied("account proof does not match the row owner")
    }

    return sameEmailIdentity(row.email, input.proof.verifiedEmail)
      ? { ok: true, access: authorised }
      : denied("no owner, and the verified email is not the recovery identity")
  }

  /* ── Capability ───────────────────────────────────────────────────────────
   *
   * Every same-name cookie is considered, because cookies are path-scoped per
   * Report and the `Cookie` header carries no path. Each candidate must already
   * name THIS handoff inside its value, so a cookie for another Report is gone
   * before any hashing happens.
   */
  const candidates = candidateSecretsFor(input.proof.presented, input.handoffId)
  if (candidates.length === 0) return denied("no capability cookie for this handoff")

  const capability = await input.client.readCapability(row.id)
  if (!capability.ok) return unavailable(`capability read failed: ${capability.detail}`)
  if (capability.row === null) return denied("no capability issued for this assessment")

  const credential = capability.row

  // A capability bound to a different handoff than its own assessment's seal is
  // a state the composite foreign key makes unstorable. Seeing it means the
  // constraint is missing.
  if (credential.consultation_handoff_id !== input.handoffId) {
    return denied("capability is bound to a different handoff", "integrity")
  }

  if (credential.revoked_at !== null) return denied("capability is revoked")

  const matches = candidates.filter((secret) =>
    secretMatchesHash(secret, credential.token_hash),
  ).length

  // Exactly one. Zero is the ordinary wrong-or-rotated-secret case; more than
  // one cannot happen with distinct cookies and a single committed hash, so it
  // means the presented list contained duplicates — which is the shape a
  // parent-path cookie shadowing a scoped one would take, and worth refusing
  // rather than accepting on the strength of a coin flip.
  return matches === 1
    ? { ok: true, access: authorised }
    : denied(`capability secrets matching the committed hash: ${matches}`)
}
