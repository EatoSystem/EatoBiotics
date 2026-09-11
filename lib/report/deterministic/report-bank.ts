import { CONSULTATION_BANK_V1 } from "@/lib/consultation/bank-registry"

/**
 * Which bank identity Report v1 claims to understand — Phase 4A-S2 review fix.
 *
 * ══ THE DEFECT THIS CLOSES ══════════════════════════════════════════════════
 *
 * A finalisation is immutable and carries the `bankVersion` and
 * `bankFingerprint` it was sealed against. Those fields exist precisely
 * because a historical seal stays valid while today's bank moves on — that is
 * the C2B contract and it is correct.
 *
 * The composer, though, interpreted every finalisation against TODAY'S
 * registered bank without ever asking whether Report v1 understands the bank
 * the seal names. The permission registry, the content pack and the priority
 * list were all authored and exhaustively tested against one specific bank;
 * run against a different one they do not fail, they just quietly mean
 * something slightly different.
 *
 * ══ INTERPRETATION, NOT VALIDITY ════════════════════════════════════════════
 *
 * This boundary says "Report v1 cannot render this", never "this seal is
 * invalid". The stored finalisation is not modified, not rebuilt and not
 * rejected; `readConsultationSeal` and `readConsultationFinalisation` are
 * untouched and a historical seal still reads. A later Report version may
 * deliberately support several historical identities — that is why this is a
 * list rather than a pair of constants — but supporting one is what has been
 * reviewed, so supporting one is what is built.
 *
 * ══ WHY THE FINGERPRINT IS A LITERAL ════════════════════════════════════════
 *
 * Asking the registry to compute today's digest here would be the same bug in
 * a different costume: the supported value would track the bank instead of
 * pinning it, so the check would pass against any bank and prove nothing. The
 * digest below is therefore typed out by hand, and `report-bank.test.ts`
 * computes the live one independently and asserts they still match.
 *
 * (The guard for that asserts this module never calls into the registry's
 * digest functions, so the paragraph above deliberately describes them rather
 * than naming them — a guard that matched its own rationale would be
 * decoration.)
 *
 * When that test fails, the bank has moved and the failure is the point. The
 * options are to revert the bank, to version the bank/Report contract, or to
 * add historical support in a reviewed change — never to paste in the new
 * digest and move on, because the permission and content coverage were proven
 * against the old one.
 */

export interface SupportedBank {
  readonly version: string
  readonly fingerprint: string
}

/**
 * The exact identities Report v1 renders.
 *
 * One entry. The bank the S2 permission registry, content pack and priority
 * precedence were built and exhaustively tested against.
 */
export const REPORT_V1_SUPPORTED_BANKS: readonly SupportedBank[] = [
  { version: CONSULTATION_BANK_V1, fingerprint: "591ceb245296dab2d70dfb0420e0163a" },
]

export type ReportBankRefusal = "bank-unsupported" | "bank-fingerprint-unsupported"

export type ReportBankSupport =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: ReportBankRefusal; readonly detail: string }

/**
 * Does Report v1 understand this seal's bank?
 *
 * Two distinct refusals, because they mean different things to whoever reads
 * the log. An unknown VERSION is a seal from a bank generation this Report was
 * never written for. A known version with an unrecognised FINGERPRINT is
 * drift: the wording or the options moved under a seal that still names v1,
 * which is the failure the fingerprint was introduced to catch.
 */
export function reportBankSupport(version: string, fingerprint: string): ReportBankSupport {
  const known = REPORT_V1_SUPPORTED_BANKS.filter((b) => b.version === version)
  if (known.length === 0) {
    return {
      ok: false,
      reason: "bank-unsupported",
      detail: `Report v1 does not support bank version "${version}"`,
    }
  }
  if (!known.some((b) => b.fingerprint === fingerprint)) {
    return {
      ok: false,
      reason: "bank-fingerprint-unsupported",
      detail: `bank "${version}" fingerprint "${fingerprint}" is not one Report v1 was built against`,
    }
  }
  return { ok: true }
}
