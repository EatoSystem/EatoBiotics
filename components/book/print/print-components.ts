/**
 * Shared MDX component map for all Print/PDF export pages.
 * Reuses the SAME rich styled chapter components as the main page.
 * Unlike Reedsy/Substack which use simplified variants, print keeps
 * the full visual design (gradients, coloured borders, icons, emoji).
 *
 * Includes all 15 component mappings (including Ch19 index tables)
 * so every print page can use this single shared import.
 */

import { ChapterCallout }      from "../chapter/chapter-callout"
import { ChapterStat }         from "../chapter/chapter-stat"
import { ChapterPullQuote }    from "../chapter/chapter-pull-quote"
import { ChapterKeyTakeaways, Takeaway } from "../chapter/chapter-key-takeaways"
import { ImagePlaceholder }    from "../chapter/image-placeholder"
import { ChapterFoodCard }     from "../chapter/chapter-food-card"
import { DimensionScoreTable, ScoreLevel } from "../chapter/dimension-score-table"
import { FoodScoreCard, ScoreDimension }   from "../chapter/food-score-card"
import { FoodRankingTable, RankedFood }    from "../chapter/food-ranking-table"
import { ScoreCheatSheet, ScoreBand }      from "../chapter/score-cheat-sheet"

export const printComponents = {
  // Standard chapter components (all chapters)
  ChapterCallout,
  ChapterStat,
  ChapterPullQuote,
  ChapterKeyTakeaways,
  Takeaway,
  ImagePlaceholder,
  ChapterFoodCard,
  // Chapter 19 — Index scoring tables
  DimensionScoreTable,
  ScoreLevel,
  FoodScoreCard,
  ScoreDimension,
  FoodRankingTable,
  RankedFood,
  ScoreCheatSheet,
  ScoreBand,
} as const
