# Narrative Acceptance review evidence — Phase 4A-S3

**There is no evidence here yet, and that is correct.**

The Narrative Acceptance Gate is `OPEN`, the production Reviewed Narrative
Variant Pack is empty, and `validateNarrativeVariantPack` refuses a production
pack that holds anything while the gate is open. No wording has been approved,
so there is nothing to record.

This directory freezes **where** the evidence will live and **what shape** it
takes, so that the later pack-population change cannot invent either under
deadline.

---

## The file

```
docs/reviews/phase-4a-s3/narrative-variant-pack-v1.review.json
```

Named in code exactly once, as `NARRATIVE_ACCEPTANCE_GATE.reviewRecordLocation`
in `lib/report/narrative/contract.ts`.

**The runtime never reads it.** A guard in `tests/unit/narrative-privacy.test.ts`
asserts that no narrative module — runtime or authoring — opens a file at all.
This record is for people and for audit; the pack is what the code consults.

---

## The shape

One entry per approved variant. The `variantId`, `templateId`,
`propositionKind` and `canonicalTextDigest` must match the pack entry exactly,
so a reviewer's decision can be traced to the string it authorised and to the
sentence it was authorised against.

```jsonc
{
  "kind": "narrative-variant-pack-review-v1",
  "packVersion": "…",                 // the exact pack these decisions produced
  "narrativeContractVersion": "…",
  "entries": [
    {
      "variantId": "…",
      "templateId": "…",
      "propositionKind": "recap | lever | constraint",
      "canonicalText": "…",           // what the reviewer compared against
      "canonicalTextDigest": "…",
      "candidateText": "…",           // what they were shown
      "decision": "approved | rejected",
      "reviewer": "…",
      "reviewedAt": "YYYY-MM-DD",
      "batch": "…",
      "authoring": {
        "promptVersion": "…",
        "validatorVersion": "…",
        "provenance": "…"             // model, provider and settings, if AI-generated
      }
    }
  ]
}
```

Rejected candidates are recorded too. A review record that only lists approvals
cannot show what a reviewer turned down, and "the screen passed it and a person
still said no" is the most useful line in it.

---

## What the reviewer is actually deciding

The deterministic screen in `lib/report/narrative/authoring/validate.ts` removes
candidates that change a number, a quantity, a time, a negation, the certainty,
the attribution or the framing. It cannot remove a candidate that simply means
something else:

| Canonical | Candidate | Screen |
|---|---|---|
| `…mornings are the hardest part of the day…` | `…the easiest part…` | **passes** |
| `…mealtimes are generally relaxed.` | `…are usually rushed.` | **passes** |
| `…weekends are looser than weekdays.` | `…tighter than weekdays.` | **passes** |

Those three are asserted as passing in `tests/unit/narrative-validate.test.ts`,
on purpose, so the limit stays visible. **Catching them is the reviewer's job,
and nothing else in the system is trying to do it.**

---

## What the pack-population change must contain

Together, in one change, or none of it:

1. the approved variants in `lib/report/narrative/variant-pack.ts`;
2. this review record, filled in;
3. the Narrative Acceptance Gate evaluation evidence its `corpus` field lists;
4. the gate's `status` moved off `OPEN` — without which the production pack is
   mechanically invalid and every position renders canonical anyway.
