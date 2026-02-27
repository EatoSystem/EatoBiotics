/**
 * Shared MDX component map for all Reedsy export pages.
 * Maps every MDX component name used in chapter .mdx files
 * to its Reedsy-optimised variant (clean, book-safe formatting).
 *
 * To add a future chapter's Reedsy page, import this object
 * and pass it to <MDXRemote components={reedsyComponents} />.
 */

import { ReedsyCallout }       from "./reedsy-callout"
import { ReedsyStat }          from "./reedsy-stat"
import { ReedsyPullQuote }     from "./reedsy-pull-quote"
import { ReedsyKeyTakeaways, ReedsyTakeaway } from "./reedsy-key-takeaways"
import { ReedsyImagePlaceholder } from "./reedsy-image-placeholder"
import { ReedsyFoodCard }      from "./reedsy-food-card"
import {
  ReedsyDimensionScoreTable,
  ReedsyScoreLevel,
  ReedsyFoodScoreCard,
  ReedsyScoreDimension,
  ReedsyFoodRankingTable,
  ReedsyRankedFood,
  ReedsyScoreCheatSheet,
  ReedsyScoreBand,
} from "./reedsy-index-tables"

export const reedsyComponents = {
  // Maps MDX component names → Reedsy variants
  ChapterCallout:      ReedsyCallout,
  ChapterStat:         ReedsyStat,
  ChapterPullQuote:    ReedsyPullQuote,
  ChapterKeyTakeaways: ReedsyKeyTakeaways,
  Takeaway:            ReedsyTakeaway,
  ImagePlaceholder:    ReedsyImagePlaceholder,
  ChapterFoodCard:     ReedsyFoodCard,
  // Chapter 19 — Index scoring tables
  DimensionScoreTable: ReedsyDimensionScoreTable,
  ScoreLevel:          ReedsyScoreLevel,
  FoodScoreCard:       ReedsyFoodScoreCard,
  ScoreDimension:      ReedsyScoreDimension,
  FoodRankingTable:    ReedsyFoodRankingTable,
  RankedFood:          ReedsyRankedFood,
  ScoreCheatSheet:     ReedsyScoreCheatSheet,
  ScoreBand:           ReedsyScoreBand,
} as const
