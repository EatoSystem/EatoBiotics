# Redesign Biotics Score Scoring System

## Context

The current scoring algorithm gives only **19/100** for Blueberries + Banana + Yogurt — three healthy, gut-friendly foods covering 2 biotic types. This feels punishing and discouraging. The root cause: per-food point values are tiny (5-6 pts) because the system was designed for 15-20+ food entries across an entire day. The fix: restructure scoring so that **biotic balance is the primary driver**, individual foods are worth more, and small well-chosen selections feel rewarding.

Also fixes a bug: the suggestion engine incorrectly recommends EVOO as a postbiotic food when it's actually classified as prebiotic in the database.

---

## New Scoring Model

### Per-food base points (diminishing within each biotic type)

| Position | Points |
|----------|--------|
| 1st food of type | **8** |
| 2nd | **6** |
| 3rd | **4** |
| 4th | **3** |
| 5th+ | **2** |

### Balance bonus — the BIG driver (covering biotic types)

| Types covered | Cumulative bonus |
|---------------|-----------------|
| 1 type | +0 |
| 2 types | +10 |
| 3 types | +20 |
| 4 types | +30 |

### Category diversity: +2 per unique food category (max +12, capped at 6)

### Plant diversity: +2 per unique plant food (max +8, capped at 4 plants)

### Score cap: 100

---

## Expected Results

| Selection | Old Score | New Score | Band |
|-----------|-----------|-----------|------|
| 🫐 Blueberries + 🍌 Banana + 🍦 Yogurt | **19** | **40** | Good ✅ |
| 🧄 Garlic + 🍦 Yogurt + 🫚 Turmeric + 🐟 Salmon + 🥣 Oats | — | **84** | Exceptional ✅ |
| 🫐 Blueberries (single food) | — | **12** | Getting Started ✅ |
| 🧄 Garlic + 🧅 Onions + 🥣 Oats (all prebiotic) | — | **28** | Fair ✅ |
| 8 diverse foods covering all 4 types | — | **100** | Exceptional ✅ |

---

## Files to Modify

### 1. `lib/scoring.ts` — Complete rewrite of scoring logic

- Replace old diminishing-return tables (separate per biotic type) with unified `[8, 6, 4, 3, 2]`
- Remove old `PLANT_THRESHOLDS` (25/20/15/10/5 plants — weekly model)
- Add **balance bonus** system: count distinct biotic types covered → `[0, 0, 10, 20, 30]`
- Category diversity: `min(categories × 2, 12)`
- Plant diversity: `min(plantCount × 2, 8)`
- Add `balanceBonus: number` to `ScoreResult` interface
- **Fix bug**: Suggestion for missing postbiotic currently says "extra virgin olive oil" — EVOO is prebiotic in the database. Change to "turmeric, dark chocolate, or green tea"
- Remove 30-plant weekly messaging from suggestions (no longer relevant to this model)
- Add balance-education suggestions: "Adding a {type} food would unlock +N balance bonus points"

### 2. `components/app/biotics-score-calculator.tsx` — Add Balance bonus badge

- Add `Scale` (or similar) icon import from lucide-react
- Add a third bonus badge for "Balance" alongside existing "Diversity" and "Plants" badges
- Style with `icon-lime` colour to differentiate from Diversity (green) and Plants (teal)
- Reference `result.balanceBonus` from the updated `ScoreResult`
- No changes needed to breakdown bars (the `/20` scaling still works well)

---

## Verification

1. `npm run build` — compiles without errors
2. Open `/app` page → Score Calculator section
3. Add Blueberries + Banana + Yogurt → score should show **~40** ("Good")
4. Add only 1 food → score should show **~12** ("Getting Started")
5. Add 5 diverse foods covering 4 types → score should show **80+** ("Exceptional")
6. Verify 3 bonus badges display: Balance, Diversity, Plants
7. Verify suggestions reference correct postbiotic foods (turmeric, dark chocolate, green tea — NOT olive oil)
