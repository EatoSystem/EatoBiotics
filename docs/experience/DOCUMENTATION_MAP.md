# Documentation map

`topic → canonical document → supporting audit evidence → superseded, if any`

Produced at the Experience 0 freeze, over the 29-document corpus. **Nothing is
deleted.** A superseded document is a record of what was believed at the time,
and the programme has twice found that record useful.

**Classification means:**

| | |
|---|---|
| **canonical** | build from it |
| **partially superseded** | accurate in part; the superseded part is named |
| **superseded** | do not build from it; keep as history |
| **historical** | a point-in-time artefact, self-labelled or dated |
| **generated** | produced by code; regenerate, never hand-edit |

---

## 1 · Product and claims

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| What EatoBiotics sells, and the names of things | `CLAUDE.md` · `docs/masterplan/PRODUCT_CONSTITUTION.md` | — | — |
| The permanent product rule (measure / teach / never present as measured) | `CLAUDE.md` | every per-surface audit | — |
| What may and may not be said about FSS-v1 | `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` | `EATOBIOTICS_SCIENTIFIC_UI_DEBT.md` | — |
| The AI / Intelligence boundary | `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` §8 · `docs/masterplan/AI_CONSTITUTION.md` | `P0-TRUST-05` | — |
| Scientific contract and evidence | `docs/phase-3a-science-contract-v1.md` · `docs/phase-3a-multi-model-science-evidence-pack.md` · `docs/fss/FSS_V1_EVIDENCE_MATRIX.md` | `P0-SCIENCE-08` | — |
| Consultation question bank | `docs/phase-3a-consultation-question-bank-review.md` | — | — |

## 2 · Product experience

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| **How the product behaves toward the person** | **`EXPERIENCE_CONSTITUTION.md`** | the five per-surface audits | — |
| The future product architecture | `EATOBIOTICS_EXPERIENCE_AUDIT_v1.md` | all seven steps | `docs/food-system-experience/PRODUCT_EXPERIENCE.md` |
| The Account / product split | `EATOBIOTICS_EXPERIENCE_AUDIT_v1.md` §2 | `P0-ARCH-01` | `docs/food-system-experience/ACCOUNT_REDESIGN.md` |
| Remediation before redesign | `EXPERIENCE_0R_REMEDIATION_SPEC.md` | the register | — |
| The Experience 1–5 roadmap | `AUDIT_BASELINE.md` | `EATOBIOTICS_EXPERIENCE_AUDIT_v1.md` §7 | — |

## 3 · Visual and motion design

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| **Typography, colour, space, surfaces, illustration** | **`docs/masterplan/DESIGN_CONSTITUTION.md`** | `EATOBIOTICS_MY_FOOD_SYSTEM_AUDIT.md` | — |
| **Motion principles** | **`docs/masterplan/MOTION_CONSTITUTION.md`** | `EATOBIOTICS_DIGITAL_TWIN_AUDIT.md` §3 | — |
| Motion catalogue and technology split | — | `EATOBIOTICS_DIGITAL_TWIN_AUDIT.md` §5 | `docs/food-system-experience/MOTION_SYSTEM.md` — **partially superseded** |
| FSS-v1 surfaces and vocabulary | `docs/fss/FSS_V1_DESIGN_SPEC.md` | `EATOBIOTICS_MY_FOOD_SYSTEM_AUDIT.md` | — |
| Design review history | — | — | `docs/food-system-experience/DESIGN_REVIEW.md` — **historical** |

### The two motion documents

`docs/masterplan/MOTION_CONSTITUTION.md` (76 lines) and
`docs/food-system-experience/MOTION_SYSTEM.md` (92) cover substantially the same
ground, including the Remotion split. **Genuine duplication**, recorded rather
than resolved — resolving it is an Experience 5 task.

`MOTION_SYSTEM.md` is **partially superseded** for a specific reason, not a vague
one. Rules 1 and 3–6 are canonical motion engineering. **Rule 2** — *"Every
animation encodes a fact: a ping = a pathway fed"* — is a claims defect expressed
as a motion rule, and it is the document-level origin of `P0-SCIENCE-04` and
`P0-SCIENCE-05`. Its Remotion catalogue describes components with **no live
importer**.

## 4 · Generation 3 — the Digital Twin

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| What the Twin is and does | — | **`EATOBIOTICS_DIGITAL_TWIN_AUDIT.md`** | `docs/food-system-experience/YOUR_FOOD_SYSTEM.md` — **partially superseded** |

`YOUR_FOOD_SYSTEM.md` is **accurate as an implementation record** and is the
document that *specifies* the prohibited mappings — *"the aura re-tints toward
the strongest"*, and a six-row impact→body-region table. Keep as history; do not
build from it.

## 5 · FSS-v1 — the instrument

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| What the instrument is | `docs/fss/FSS_V1_SPEC.md` | — | — |
| Versioning and what moving each anchor costs | `docs/fss/FSS_V1_VERSIONING.md` | — | — |
| How it is enforced in code | `docs/fss/FSS_ARCHITECTURE_REVIEW.md` | — | — |
| Index | `docs/fss/README.md` | — | — |
| Resolved actions / assessment | **generated** — `docs/fss/generated/*` | — | regenerate, never hand-edit |

## 6 · Reports

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| What a Report should be | `EATOBIOTICS_EXPERIENCE_AUDIT_v1.md` §4 | **`EATOBIOTICS_REPORTS_AUDIT.md`** | — |
| The canonical Report's capability gates | `lib/report/deterministic/capabilities.ts` + `docs/phase-3a-science-contract-v1.md` | `P2-REPORT-01` | — |
| Legacy report improvement | — | `EATOBIOTICS_REPORTS_AUDIT.md` §9 | `docs/assessment-report-improvement-brief-for-claude.md` — **historical, self-labelled**; `docs/claude-code-assessment-report-upgrade-prompt.md` — **superseded** |

`assessment-report-improvement-brief-for-claude.md` carries its own editor's note
recording three findings that did not hold. That is why it is *historical* rather
than *superseded*: it is a deliberate record, and it says so.

## 7 · Programme and operations

| topic | canonical | audit evidence | superseded |
|---|---|---|---|
| The programme arc | `docs/masterplan/MASTERPLAN.md` · `REVIEW.md` | — | — |
| Baselines | `docs/programme/BASELINE.md` · `AUDIT_BASELINE.md` | — | — |
| Go-live and commercial runbook | `docs/v1-step7-commercial-runbook.md` | — | — |
| Route/surface inventory | `lib/v1-surface.ts` — **the code is canonical** | `EATOBIOTICS_REPORTS_AUDIT.md` §0 | `docs/v1-step3-inventory.md` — **historical** |
| GLP-1 launch | `docs/glp1-launch-checklist.md` | — | — |
| Phase 4A-S3 review | `docs/reviews/phase-4a-s3/README.md` | — | — |
| **Onboarding a second agent (Cursor) to this codebase** | `docs/cursor/00_PROJECT_BRIEF.md` | the five per-surface audits, summarised | — |
| **What to review, and which workflows are safe to delegate** | `docs/cursor/01_REVIEW_AND_WORKFLOWS.md` | `AUDIT_BASELINE.md` §§2–3 | — |
| **The iOS / Android daily companion** | `docs/cursor/02_MOBILE_APP_BRIEF.md` | — | — |

### The `docs/cursor/` pack

Three documents, written 2026-10-07 at the 0R-6R close, classified **canonical**.
They exist because the enforcement this programme depends on is *path-scoped
source scanning inside one repository* — so a second agent and a second client
are the two ways every repaired claim could silently return.

`00_PROJECT_BRIEF.md` is the read-this-first context: what EatoBiotics sells, the
permanent product rule and how it has been broken, the stack and the measured
scale, the programme state, the hard constraints, and which documents on this map
are traps.

`01_REVIEW_AND_WORKFLOWS.md` scopes a review to what is *not* already measured
here, states the anti-goals as firmly as the goals, and classifies nine ongoing
workflows as safe for Cursor to own or reserved for the programme loop.

`02_MOBILE_APP_BRIEF.md` is the Expo + React Native daily-companion brief. Its
governing principle is **share contracts and truth definitions; centralise
authority**, and its §5 — extending the claims guards to React Native from the
first meaningful feature — is the section the rest of it depends on.

---

## 8 · Two documents that were named and not produced

Recorded here so they do not look forgotten.

**`EATOBIOTICS_UI_PATTERN_INVENTORY.md`** and
**`EATOBIOTICS_VISUAL_TOKENS_AUDIT.md`** were named at Experience 0 kickoff and
are deliberately not built. The audit found the decisive problems to be claims
and product architecture; a pattern-variant census would have looked thorough and
changed nothing, and a token audit is redesign input that 0R precedes.

**The measurement they would have diagnosed is carried forward intact:**
**66 CSS custom properties · 616 hardcoded hex values · 2,472 inline styles**,
with its four-way question — intentional one-off visual work · a duplicated
design decision · legacy styling · genuine token-system failure. Three different
diagnoses, three different remedies, and **assigned to Experience 5**.

---

## 9 · The one-source rule

A permanent principle the audit establishes **extends** a canonical document and
is cross-referenced; it is never restated in two places.

In practice:

- `EXPERIENCE_CONSTITUTION.md` holds principles and **no evidence**;
- `EATOBIOTICS_SCIENTIFIC_UI_DEBT.md` holds evidence and **no principles**, apart
  from the canonical decisions D1–D7, which are rulings rather than principles;
- the five per-surface audits hold the reasoning that produced both, and are
  cross-referenced rather than summarised;
- `DESIGN_CONSTITUTION.md`, `MOTION_CONSTITUTION.md` and
  `EXPERIENCE_CONSTITUTION.md` carry reciprocal one-line cross-references and
  restate nothing.
