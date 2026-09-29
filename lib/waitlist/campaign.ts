/**
 * Who the 60-second experience is being run for.
 *
 * The consumer product asks a person about their own food system. The same
 * experience is intended to run later for an organisation — "EatoBiotics @
 * <company>", "The Food System Inside <company>" — where an employee takes the
 * identical personal assessment under a different banner.
 *
 * That programme is NOT built here. What is built is the seam: the two strings
 * the experience would otherwise hardcode are values with a default, so adding
 * a campaign later is passing a different object rather than finding every
 * place "Inside You" was typed. Nothing reads a campaign from a URL, a cookie
 * or a database, and no second campaign exists.
 *
 * Pure and client-safe: no imports, no environment, no side effects.
 */

export interface CampaignContext {
  /** Stable id, safe as an analytics property. */
  id: string
  /** The product name in the eyebrow. */
  brand: string
  /**
   * Whose food system this is, as it appears after "The Food System Inside".
   * Kept as the bare subject so the headline can break it onto its own line.
   */
  subject: string
  /** The possessive used in "Understand <yours> in 60 seconds." */
  possessive: string
}

export const CONSUMER_CAMPAIGN: CampaignContext = {
  id: "consumer",
  brand: "EatoBiotics",
  subject: "You",
  possessive: "yours",
}
