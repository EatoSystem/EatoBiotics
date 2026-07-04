import { describe, it, expect } from "vitest"
import {
  GLOBAL_DISCLAIMER,
  MIND_DISCLAIMER,
  GLUCOSE_DISCLAIMER,
  STABILITY_DISCLAIMER,
  PERFORMANCE_DISCLAIMER,
  SYSTEM_SUPPORT_DISCLAIMER,
  LIFE_SYSTEM_DISCLAIMER,
  disclaimerFor,
} from "@/lib/assessment-disclaimers"

describe("assessment disclaimers", () => {
  it("exposes the exact required global support-score framing", () => {
    expect(GLOBAL_DISCLAIMER).toBe(
      "This score reflects how strongly your current food and lifestyle patterns support this area. It is not a diagnosis, medical test, or replacement for professional advice.",
    )
  })

  it("exposes the exact required per-assessment safety lines", () => {
    expect(MIND_DISCLAIMER).toBe(
      "This is a food-pattern reflection tool, not a mental-health screening or diagnosis.",
    )
    expect(GLUCOSE_DISCLAIMER).toBe(
      "This is a glucose-supportive behavior score. It does not measure blood glucose.",
    )
    expect(STABILITY_DISCLAIMER).toBe(
      "This is not a diagnosis. If you have red-flag symptoms, sudden changes, bleeding, black stools, unexplained weight loss, fever, night symptoms, or severe pain, seek medical advice.",
    )
    expect(PERFORMANCE_DISCLAIMER).toBe(
      "This score reflects performance-fuelling support patterns. It does not measure athletic ability, recovery status, or injury risk.",
    )
  })

  it("combines the global framing with the assessment-specific line", () => {
    expect(disclaimerFor("mind")).toContain(GLOBAL_DISCLAIMER)
    expect(disclaimerFor("mind")).toContain(MIND_DISCLAIMER)
    expect(disclaimerFor("glucose")).toContain(GLUCOSE_DISCLAIMER)
    expect(disclaimerFor("stability")).toContain(STABILITY_DISCLAIMER)
    expect(disclaimerFor("performance")).toContain(PERFORMANCE_DISCLAIMER)
  })

  it("exposes the exact Systems landing safety copy", () => {
    expect(SYSTEM_SUPPORT_DISCLAIMER).toBe(
      "EatoBiotics systems offer food-first educational support. They are not medical advice, diagnosis, or treatment.",
    )
    expect(LIFE_SYSTEM_DISCLAIMER).toBe(
      "For pregnancy, birth, baby feeding or child health concerns, always speak with a qualified healthcare professional.",
    )
  })

  it("uses only the global framing for the foundations", () => {
    expect(disclaimerFor("you")).toBe(GLOBAL_DISCLAIMER)
    expect(disclaimerFor("family")).toBe(GLOBAL_DISCLAIMER)
  })

  it("never makes a forbidden measurement claim", () => {
    for (const key of ["you", "family", "mind", "glucose", "stability", "performance"] as const) {
      const text = disclaimerFor(key).toLowerCase()
      expect(text).not.toContain("measures your glucose")
      expect(text).not.toContain("measures your mental health")
      expect(text).not.toContain("diagnoses")
    }
  })
})
