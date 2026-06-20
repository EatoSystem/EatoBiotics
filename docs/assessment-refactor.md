# EatoBiotics Assessment Architecture Refactor — Implementation Note

Goal: make the assessment suite coherent. Two mandatory foundations (You, Family); four
add-ons (Mind, Glucose, Stability, Performance) that build on a foundation and merge into a
combined report. All scores are **behaviour-based educational support scores**, never medical
measurements.

## Problems being fixed
1. **Family & Mind** present 5 pillars but reuse the You 3-Biotics scoring engine → incoherent.
2. **Glucose** weighting doesn't match spec (rhythm 15% / recovery 30%).
3. **Stability** scores mid-range `DEFAULT_ANSWERS` before the user answers → misleading score.
4. **Performance** questions + scoring live inline in the client component (no lib/tests).
5. No typed combined-result layer; disclaimers inconsistent/missing.

## Build
- `lib/assessment-types.ts` — `FoundationResult`, `AddonResult`, `CombinedResult`, summary inputs.
- `lib/assessment-disclaimers.ts` — exact per-assessment safety copy + `disclaimerFor()`.
- `lib/combined-assessment-result.ts` — pure `buildCombinedResult(foundation, addon)`.
- **Family**: native 5-subscore engine (Exposure, Foundation, Live Foods, Rhythm, Food Culture)
  + secondary 3-Biotics (Exposure+Foundation→Pre, Live Foods→Pro, Rhythm+Food Culture→Post)
  + non-penalising context questions. Stores canonical 3-Biotics in `subScores`.
- **Mind**: native 5-subscore engine (Brain Fuel, Plant & Polyphenol Diversity, Live Foods,
  Rhythm, Mind Response) + safer non-diagnostic language. Stores canonical 3-Biotics.
- **Glucose**: weights Plate 30 / Rhythm 20 / Strength 25 / Recovery 25 + disclaimer + CGM note.
- **Stability**: unanswered-until-confirmed scoring (no misleading default) + louder red flags.
- **Performance**: extract to `lib/performance-assessment-{data,scoring}.ts` + sport context + disclaimer.
- **You**: improved pillar copy + result sections + Snapshot/Pattern/Tracked confidence label.
- Wire `lib/assessment/registry.ts` adapters to the rescored Family/Mind/Performance models.

## Non-negotiables
- Keep You + Family; add-ons cannot be standalone final reports (FoundationGuard enforces).
- No medical/diagnostic/mental-health/glucose-control/performance claims.
- Don't touch pricing/membership/branding/homepage. Don't reintroduce EatoBetics/EatoSports naming.
- Preserve Stability red-flag detection and make it more visible.

## Tests (vitest, `tests/unit/*`)
You scoring · Family 5-subscore + secondary biotics · Mind 5-subscore + disclaimer copy ·
Glucose weighting · Stability red-flag + no-default-score · Performance extracted scoring ·
Combined You+addon · Combined Family+addon · add-ons need a foundation to form a final report.
