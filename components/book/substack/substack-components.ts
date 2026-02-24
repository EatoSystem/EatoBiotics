/**
 * Shared MDX component map for all Substack export pages.
 * Maps every MDX component name used in chapter .mdx files
 * to its Substack-optimised variant.
 *
 * To add a future chapter's substack page, import this object
 * and pass it to <MDXRemote components={substackComponents} />.
 */

import { SubstackCallout }       from "./substack-callout"
import { SubstackStat }          from "./substack-stat"
import { SubstackPullQuote }     from "./substack-pull-quote"
import { SubstackKeyTakeaways, SubstackTakeaway } from "./substack-key-takeaways"
import { SubstackImagePlaceholder } from "./substack-image-placeholder"
import { SubstackFoodCard }      from "./substack-food-card"

export const substackComponents = {
  // Maps MDX component names → Substack variants
  ChapterCallout:      SubstackCallout,
  ChapterStat:         SubstackStat,
  ChapterPullQuote:    SubstackPullQuote,
  ChapterKeyTakeaways: SubstackKeyTakeaways,
  Takeaway:            SubstackTakeaway,
  ImagePlaceholder:    SubstackImagePlaceholder,
  ChapterFoodCard:     SubstackFoodCard,
} as const
