import { describe, it, expect } from "vitest"

import {
  canonicalPurchaseEmail,
  normaliseEmail,
  sameEmailIdentity,
} from "@/lib/report/access/email-identity"
import { decideRecoveryIdentity } from "@/lib/report/access/recovery-identity"

/**
 * Email as an ownership proof, and the recovery matrix — Phase 4B-S1.
 *
 * The matrix exists because of one failure case: purchase, seal, customer
 * leaves, bootstrap never called, window expires — no capability, no email, no
 * account, and somebody permanently locked out of an artifact they paid for.
 * These tests are the four branches that make that state unreachable.
 */

describe("normaliseEmail", () => {
  it("trims, NFKC-normalises and lowercases", () => {
    expect(normaliseEmail("  Jason@EatoSystem.com \n")).toBe("jason@eatosystem.com")
  })

  it("folds compatibility-equivalent codepoints to the same identity", () => {
    // Fullwidth characters render as a different string and mean the same
    // address. Without NFKC an equality check becomes a check on which encoding
    // somebody happened to type.
    const fullwidth = "ａ＠b.com" // ａ＠b.com
    expect(normaliseEmail(fullwidth)).toBe("a@b.com")
  })

  it("folds AFTER normalising, and the order is observable", () => {
    // 657 codepoints give a different answer depending on the order, so this is
    // not a stylistic preference. U+1D2C MODIFIER LETTER CAPITAL A is one:
    //
    //   NFKC then lowercase  ->  "a"     (what this function does)
    //   lowercase then NFKC  ->  "A"
    //
    // Get it backwards and two spellings of the same address stop comparing
    // equal, which in this module means a customer stops being able to reach
    // their own Report.
    const modifierCapitalA = "\u1D2C"
    expect(modifierCapitalA.normalize("NFKC").toLowerCase()).toBe("a")
    expect(modifierCapitalA.toLowerCase().normalize("NFKC")).toBe("A")
    expect(normaliseEmail(`${modifierCapitalA}@x.com`)).toBe("a@x.com")
    expect(sameEmailIdentity(`${modifierCapitalA}@x.com`, "a@x.com")).toBe(true)
  })

  it("returns null for absent, blank and whitespace-bearing input", () => {
    expect(normaliseEmail(null)).toBeNull()
    expect(normaliseEmail(undefined)).toBeNull()
    expect(normaliseEmail("")).toBeNull()
    expect(normaliseEmail("   ")).toBeNull()
    expect(normaliseEmail("a b@c.com")).toBeNull()
  })

  it("rejects what cannot be an address, rather than adopting it as an identity", () => {
    for (const bad of ["nope", "@nope.com", "nope@", "a@b@c", "a".repeat(400) + "@b.com"]) {
      expect(normaliseEmail(bad), bad).toBeNull()
    }
  })

  it("does not try to be an email validator", () => {
    // Elaborate regexes reject valid addresses. The bar is "could be an email",
    // not "is deliverable".
    expect(normaliseEmail("a+tag@sub.domain.co.uk")).toBe("a+tag@sub.domain.co.uk")
    expect(normaliseEmail("x@localhost")).toBe("x@localhost")
  })
})

describe("sameEmailIdentity", () => {
  it("compares normalised forms, never raw bytes", () => {
    expect(sameEmailIdentity(" JASON@x.com ", "jason@x.com")).toBe(true)
  })

  it("null never matches anything, including null", () => {
    expect(sameEmailIdentity(null, null)).toBe(false)
    expect(sameEmailIdentity(null, "a@b.com")).toBe(false)
    expect(sameEmailIdentity("a@b.com", "")).toBe(false)
  })

  it("distinguishes different addresses", () => {
    expect(sameEmailIdentity("a@b.com", "a@c.com")).toBe(false)
  })
})

describe("canonicalPurchaseEmail follows the webhook's precedence", () => {
  it("prefers the summary email", () => {
    expect(
      canonicalPurchaseEmail({
        summaryEmail: "Summary@x.com",
        customerDetailsEmail: "details@x.com",
        customerEmail: "session@x.com",
      }),
    ).toBe("summary@x.com")
  })

  it("falls back to customer_details, then customer_email", () => {
    expect(
      canonicalPurchaseEmail({ customerDetailsEmail: "Details@x.com", customerEmail: "s@x.com" }),
    ).toBe("details@x.com")
    expect(canonicalPurchaseEmail({ customerEmail: "S@x.com" })).toBe("s@x.com")
  })

  it("falls THROUGH an unusable source rather than stopping at it", () => {
    // One source failing is not a decision to have no identity; the next source
    // is still there.
    expect(
      canonicalPurchaseEmail({ summaryEmail: "garbage", customerDetailsEmail: "real@x.com" }),
    ).toBe("real@x.com")
  })

  it("is null when nothing usable is present", () => {
    expect(canonicalPurchaseEmail({})).toBeNull()
    expect(
      canonicalPurchaseEmail({ summaryEmail: null, customerDetailsEmail: "", customerEmail: "x" }),
    ).toBeNull()
  })
})

describe("the recovery-identity matrix", () => {
  it("A — an account owner needs no email at all", () => {
    expect(
      decideRecoveryIdentity({
        userId: "user-1",
        assessmentEmail: null,
        canonicalPurchaseEmail: null,
      }),
    ).toEqual({ case: "account-owner", seal: "proceed", write: null, alarm: null })
  })

  it("A — an account owner is not disturbed by a differing purchase email", () => {
    const decision = decideRecoveryIdentity({
      userId: "user-1",
      assessmentEmail: "a@x.com",
      canonicalPurchaseEmail: "b@x.com",
    })
    expect(decision.case).toBe("account-owner")
    expect(decision.alarm).toBeNull()
    expect(decision.write).toBeNull()
  })

  it("B — an existing assessment email stays canonical and is never rewritten", () => {
    for (const purchase of [null, "a@x.com"]) {
      const decision = decideRecoveryIdentity({
        userId: null,
        assessmentEmail: "A@x.com",
        canonicalPurchaseEmail: purchase,
      })
      expect(decision.case).toBe("assessment-email-canonical")
      expect(decision.seal).toBe("proceed")
      expect(decision.write).toBeNull()
      expect(decision.alarm).toBeNull()
    }
  })

  it("B — a differing purchase email alarms, writes nothing, and still seals", () => {
    // Paying with a work card, a partner's card or a PayPal address is
    // ordinary, not adversarial. Refusing to seal here would turn a benign
    // mismatch into a guaranteed failure for somebody who has already paid.
    const decision = decideRecoveryIdentity({
      userId: null,
      assessmentEmail: "funnel@x.com",
      canonicalPurchaseEmail: "payer@y.com",
    })
    expect(decision).toEqual({
      case: "assessment-email-canonical",
      seal: "proceed",
      write: null,
      alarm: "identity-conflict",
    })
  })

  it("C — a guest with no email adopts the purchase email, for the seal CAS to write", () => {
    expect(
      decideRecoveryIdentity({
        userId: null,
        assessmentEmail: null,
        canonicalPurchaseEmail: "payer@y.com",
      }),
    ).toEqual({
      case: "adopt-purchase-email",
      seal: "proceed",
      write: "payer@y.com",
      alarm: null,
    })
  })

  it("D — with no identity of any kind, the seal is refused", () => {
    // Sealing would produce an immutable artifact with no way back to its
    // owner, and the seal is write-once, so it could not be repaired.
    expect(
      decideRecoveryIdentity({
        userId: null,
        assessmentEmail: null,
        canonicalPurchaseEmail: null,
      }),
    ).toEqual({ case: "no-recovery-identity", seal: "refuse", write: null, alarm: null })
  })

  it("refusing to seal is the ONLY refusal the matrix produces", () => {
    const refusals = [
      decideRecoveryIdentity({ userId: "u", assessmentEmail: null, canonicalPurchaseEmail: null }),
      decideRecoveryIdentity({ userId: null, assessmentEmail: "a@x.com", canonicalPurchaseEmail: "b@y.com" }),
      decideRecoveryIdentity({ userId: null, assessmentEmail: null, canonicalPurchaseEmail: "b@y.com" }),
    ]
    expect(refusals.every((d) => d.seal === "proceed")).toBe(true)
  })

  it("C — an UNUSABLE stored address is not an identity; the purchase email replaces it", () => {
    // The repair. A column holding something that cannot be an address leaves
    // the guest with nothing to prove control of, so it must not be treated as
    // a recovery identity merely because it is non-null. Overwriting it takes
    // nothing from anyone: nobody can prove control of an unparseable string.
    const decision = decideRecoveryIdentity({
      userId: null,
      assessmentEmail: "not-an-email",
      canonicalPurchaseEmail: "real@x.com",
    })
    expect(decision).toEqual({
      case: "adopt-purchase-email",
      seal: "proceed",
      write: "real@x.com",
      alarm: "unusable-recovery-email",
    })
  })

  it("D — an UNUSABLE stored address with nothing to adopt REFUSES the seal", () => {
    // The lockout this whole matrix exists to prevent, previously reachable by
    // storing junk in the column: an email column, and no way back to the owner.
    const decision = decideRecoveryIdentity({
      userId: null,
      assessmentEmail: "   ",
      canonicalPurchaseEmail: null,
    })
    expect(decision.seal).toBe("refuse")
    expect(decision.case).toBe("no-recovery-identity")
    expect(decision.write).toBeNull()
  })

  it.each(["not-an-email", "@nope.com", "nope@", "a@b@c", "   ", "has space@x.com"])(
    "refuses to seal on stored junk %j when there is nothing to adopt",
    (junk) => {
      expect(
        decideRecoveryIdentity({
          userId: null,
          assessmentEmail: junk,
          canonicalPurchaseEmail: null,
        }).seal,
      ).toBe("refuse")
    },
  )

  it("an unusable stored address never alarms as an identity conflict", () => {
    // Distinct signals. `identity-conflict` means two usable addresses disagree
    // and we kept the customer's; `unusable-recovery-email` means we discarded
    // something that was never an address. Collapsing them would hide the fact
    // that data upstream is writing garbage.
    const junk = decideRecoveryIdentity({
      userId: null,
      assessmentEmail: "not-an-email",
      canonicalPurchaseEmail: "real@x.com",
    })
    const conflict = decideRecoveryIdentity({
      userId: null,
      assessmentEmail: "funnel@x.com",
      canonicalPurchaseEmail: "payer@y.com",
    })
    expect(junk.alarm).toBe("unusable-recovery-email")
    expect(conflict.alarm).toBe("identity-conflict")
  })

  it("adopting from a NULL column does not alarm", () => {
    // Nothing was discarded, so there is nothing to tell anyone about. Only a
    // non-null value that turned out to be unusable is worth surfacing.
    expect(
      decideRecoveryIdentity({
        userId: null,
        assessmentEmail: null,
        canonicalPurchaseEmail: "real@x.com",
      }).alarm,
    ).toBeNull()
  })

  it("an account owner is untouched by a junk email column", () => {
    // Account identity is durable and stronger than any address, so case A is
    // reached before the column is even looked at.
    expect(
      decideRecoveryIdentity({
        userId: "user-1",
        assessmentEmail: "not-an-email",
        canonicalPurchaseEmail: null,
      }),
    ).toEqual({ case: "account-owner", seal: "proceed", write: null, alarm: null })
  })

  it("never writes an address that is not already normalised", () => {
    const decision = decideRecoveryIdentity({
      userId: null,
      assessmentEmail: null,
      canonicalPurchaseEmail: canonicalPurchaseEmail({ summaryEmail: "  MiXeD@X.CoM " }),
    })
    expect(decision.write).toBe("mixed@x.com")
  })
})
