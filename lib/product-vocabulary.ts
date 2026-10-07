/* ════════════════════════════════════════════════════════════════════════
   PRODUCT VOCABULARY — re-export of the shared leaf.

   The names live in packages/vocabulary (zero imports). This file is the
   web import path so existing callers do not move. Do not add logic here.
   Do not import server modules. Do not rewrite live 0R surfaces to reach
   the package directly in this PR.

       packages/vocabulary/src/index.ts   ← the leaf
             ↑
       lib/product-vocabulary.ts          ← here (re-export)
             ↑              ↑
       lib/report/offer.ts  lib/membership-tiers.ts
   ════════════════════════════════════════════════════════════════════════ */

export {
  FOOD_SYSTEM_ASSESSMENT,
  PERSONAL_CONSULTATION,
  PERSONAL_REPORT,
  THIRTY_DAYS,
  MEMBER,
  BIOTICS_SCORE,
  BIOTICS_SCORE_PLAIN,
  MEAL_BIOTICS_SCORE,
  BIOTICS,
  BIOTICS_LINE,
  ACTIONS,
  ACTIONS_LINE,
} from "@eatobiotics/vocabulary"
