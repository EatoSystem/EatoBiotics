# FSS-v1 — Provenance, Versioning and Persistence

**Status: CANDIDATE specification. Nothing here is implemented; no migration is
applied; no production write occurs.**

---

## 1. Why this comes before the model moves

**Score provenance is already broken in production, today, independently of
FSS-v1.** Two different instruments write the same two columns:

| | Items | Formula | Writes |
|---|---|---|---|
| Waitlist flow (`lib/quick-assessment.ts:204`) | 5 | `round(mean(values) / 3 × 100)` | `leads.overall_score`, `leads.sub_scores` |
| Food System Assessment (`lib/assessment-scoring.ts:60`) | 15 | `round(sum / max × 100)` | the same two columns |

Nothing records which produced a given row. `AssessmentResult` has **no version
field at all** — only `completedAt`. And `leads.sub_scores` already holds two
different *shapes*, the 3-biotic and a legacy 5-pillar one.

So longitudinal comparison is not safe now, and would become less safe the
moment a third model exists. **Provenance is built before the model moves, not
after** — otherwise the first comparison silently spans two instruments.

---

## 2. The provenance record

```ts
interface ScoreProvenance {
  fssMethodVersion: string        // "fss-v1.0"          — the whole bundle
  assessmentVersion: string       // "assessment-v1.0"   — which instrument
  questionSetVersion: string      // "questions-v1.0"    — which items were asked
  calculationVersion: string      // "calc-v1.0"         — weights, scaling, floor policy
  interpretationVersion: string   // "interpretation-v1.0" — bands and copy
}
```

**Today's live model is stamped `fss-v0`** rather than left unlabelled. An
unlabelled score is indistinguishable from an unversioned one, and "no version"
is exactly the state that makes a wrong comparison invisible.

### The comparability rule

Two scores are directly comparable **only** when `fssMethodVersion` matches.
Across versions the product shows both, labelled, and says the method changed —
it does not draw a trend line through a discontinuity.

A `COMPARABLE_METHODS` allowlist may permit specific pairs where a change was
provably non-substantive (a copy-only `interpretationVersion` bump). It is an
allowlist, never a default.

**Comparison refuses by default.** Given two scores whose versions differ and
no explicit rule, the correct output is "the method changed", not a number.

This generalises a precedent already in the codebase: `CONTENT_PACK_VERSION`
travels in Report provenance for exactly this reason.

---

## 3. Persistence — the ratified architecture

All new programme features are built against a **repository interface**, never
directly against `localStorage` or Supabase.

```
        domain models  (scores + provenance, plans, actions,
                        reassessments, progress, learning events)
                │
        FoodSystemRepository        ← the only thing UI code knows
           ╱          ╲
LocalStorageRepository  SupabaseRepository
  (active default)       (disabled for production writes)
```

**Rules, in force from the first line of WP-C:**

- **Local persistence is the default runtime** for everything new. The repo
  already does this twice — `lib/stability/storage.ts` and `twin_state` — so it
  is a proven pattern here, not a novelty.
- **No UI component knows which backend is active.** If one does, the
  substitution has already failed.
- **Supabase adapter exists to prove the interface, and is disabled for
  production writes**, with tests asserting that a production configuration
  stays read-only.
- **Draft migrations are committed and reviewable, and applied nowhere.**
  Tested against an ephemeral local Postgres where possible rather than
  syntax-checked.
- The eventual move `LocalStorageRepository → SupabaseRepository` must be a
  **persistence substitution, not a product rewrite**.
- **No production migration or production data write without a separate,
  explicit founder approval gate.**

### What every record must carry

| Record | Must carry |
|---|---|
| **Score** | full `ScoreProvenance`, completeness, per-domain values including `insufficient` |
| **Reassessment** | a reference to the assessment and score it derives from |
| **Plan / action** | its source priority and domain, **and the methodology version in force when it was recommended** |
| **Learning event** | what was shown, what was chosen, when |

The plan/action requirement is the one most easily dropped and most expensive
to lose: without it, nobody can reconstruct **why EatoBiotics recommended
something** once the model has moved on. A recommendation whose reasoning
cannot be reconstructed is not auditable, and this product's entire claim to
care about its claims rests on being auditable.

---

## 4. A gate that does not exist yet

Feature-gating for the candidate engine must **not** use Statsig. Verified:
`lib/statsig-server.ts:29` disables local evaluation by design, so there is no
server-side `checkGate`; the only two real gates in the repository sit on
routes V1 refuses; and the client provider returns `false` for every gate when
analytics consent is absent.

The established patterns here are the compile-time constant
(`FEEDBACK_CAPTURE_ENABLED` in `lib/v1-scope.ts`, AST-guarded as the first
statement of each handler) and the fail-closed server-only predicates in
`lib/report/presentation/preview-policy.ts` and
`lib/consultation/persisted-activation-policy.ts`. WP-C follows those.

One rule carried from `persisted-activation-policy.ts`, because it is exactly
right and easy to get wrong: **a rollout toggle decides who STARTS something.
It must never decide whether work a customer has already begun may continue.**

---

## 5. Migration ordering

No FSS migration is drafted until the domain set has scientific sign-off.
Writing the columns first creates pressure to keep them, and a column name is a
methodology decision wearing a schema costume.
