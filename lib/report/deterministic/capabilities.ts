import { SPECIALIST_GATES, type SpecialistGate } from "@/lib/consultation/science-contract"

/**
 * What the deterministic Report is permitted to SAY — Phase 4A-S2.
 *
 * ══ WHY THESE ARE NOT FEATURE FLAGS ═════════════════════════════════════════
 *
 * Each capability below stands for a professional review that has not happened.
 * `specificFoods` waits on a dietitian and an EU allergen taxonomy;
 * `bioticsLanguage` waits on Irish/EU health-claims law; `safetyNetting` waits
 * on GP/dietetic sign-off of one customer-facing sentence.
 *
 * A rollout switch and a specialist's approval are different kinds of thing,
 * and the whole value of this module is that the second cannot be simulated by
 * the first. So this is deliberately UNLIKE `lib/consultation/persisted-activation-policy.ts`,
 * which is a rollout gate and correctly reads the environment. Here:
 *
 *   · no environment variable
 *   · no query parameter
 *   · no runtime flag
 *   · no caller override — the functions take NO PARAMETERS AT ALL, which is
 *     what makes "a caller cannot override this" structural rather than a rule
 *   · no test-only override — tests observe the real records, and the sabotage
 *     suite proves the wiring is live by editing the adjudicated source
 *
 * The single input is `SPECIALIST_GATES` in the frozen Science Contract.
 * Closing a gate means editing that adjudicated record, accompanied by the
 * review it names. Nothing else can do it.
 *
 * ══ ALL THREE ARE OPEN ══════════════════════════════════════════════════════
 *
 * Therefore all three capabilities are false, and the Report renders no named
 * food, no customer-facing Prebiotics/Probiotics/Postbiotics health-claim
 * language, and no safety-netting sentence.
 *
 * ── The safety-netting paradox, stated so nobody "fixes" it ────────────────
 *
 * `safetyNetting` being false does NOT mean a safety feature is switched off.
 * It means an UNAPPROVED SENTENCE is withheld. The Report is not less safe for
 * lacking it: with `specificFoods` false it names no food, and with
 * `bioticsLanguage` false it makes no health claim. Writing a replacement
 * sentence here would be the exact thing the gate exists to prevent.
 */

export type ReportCapability = "specificFoods" | "bioticsLanguage" | "safetyNetting"

export const REPORT_CAPABILITIES: readonly ReportCapability[] = [
  "specificFoods",
  "bioticsLanguage",
  "safetyNetting",
]

/**
 * Which adjudicated gate governs which capability.
 *
 * Exhaustive by type: a new capability without a gate is a compile error, which
 * is the point — a capability that answers to nothing would default to whatever
 * its author assumed.
 */
export const GATE_FOR_CAPABILITY: Readonly<Record<ReportCapability, SpecialistGate>> = {
  specificFoods: "food-allergy-dietetic-eu-taxonomy",
  bioticsLanguage: "eu-legal-health-claims",
  safetyNetting: "safety-netting-wording",
}

/** What each capability unlocks, recorded so a reader need not infer it. */
export const CAPABILITY_SCOPE: Readonly<Record<ReportCapability, string>> = {
  specificFoods:
    "Naming a specific food, swap, ingredient or meal in customer-facing content.",
  bioticsLanguage:
    "Customer-facing Prebiotics / Probiotics / Postbiotics language, and any health-claim-shaped sentence.",
  safetyNetting:
    "The one proportionate safety-netting sentence in the Signals section.",
}

/**
 * Is this capability enabled?
 *
 * No parameters, by construction. An `env` or `overrides` argument would be an
 * injection point, and an injection point on a professional sign-off is a way
 * to ship without one.
 */
export function reportCapabilityEnabled(capability: ReportCapability): boolean {
  const gate = SPECIALIST_GATES.find((g) => g.gate === GATE_FOR_CAPABILITY[capability])
  // An absent record is not permission. If the gate this capability answers to
  // has been removed from the contract, the capability is off.
  if (!gate) return false
  return gate.status === "CLOSED"
}

/** The full capability state, for the Report's provenance block. */
export function reportCapabilities(): Readonly<Record<ReportCapability, boolean>> {
  return {
    specificFoods: reportCapabilityEnabled("specificFoods"),
    bioticsLanguage: reportCapabilityEnabled("bioticsLanguage"),
    safetyNetting: reportCapabilityEnabled("safetyNetting"),
  }
}
