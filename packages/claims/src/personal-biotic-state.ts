/**
 * The nine PERSONAL_BIOTIC_STATE rules. One invariant, every client.
 *
 * Web tests and the React Native corpus import this list. A per-Biotic
 * score, bar, band word, possessive or superlative in Next.js, RN or PDF
 * must fail the same governing rule.
 *
 * Education ("Prebiotics are the fibres…") is deliberately not caught.
 * "Your Biotics Score™ is 74/100" is the product score and is untouched.
 */

const BIOTICS = "(?:Prebiotics|Probiotics|Postbiotics)"
const BIOTICS_ANY = "(?:Prebiotics|Probiotics|Postbiotics|prebiotics?|probiotics?|postbiotics?)"

export const PERSONAL_BIOTIC_STATE: [string, RegExp][] = [
  ["a personal score attributed to a Biotic",
   new RegExp(String.raw`\b(?:Your|My|your|my)\s+${BIOTICS}\s+score\b`)],
  ["a Biotic given a numeric value", new RegExp(String.raw`\b${BIOTICS}\b[^.!?\n]{0,30}\b\d{1,3}\s*(?:\/\s*100|out of 100)\b`)],
  ["a Biotic described as high or low for a person",
   new RegExp(String.raw`\b(?:low|high|weak|strong)\s+${BIOTICS}\b`)],

  // Gate 3.6. Each one is proven against a real shipped sentence below.
  ["a Biotic claimed as a person's own",
   new RegExp(String.raw`\b(?:[Yy]our|[Mm]y)\s+${BIOTICS_ANY}\b`)],
  ["a Biotic given a comparative or directional verdict",
   new RegExp(String.raw`\b${BIOTICS}\b[^.!?\n]{0,40}\b(?:strongest|weakest|most room to grow|climbed|slipped|trending|settled|appears? lower|appears? higher)\b`)],
  ["a comparative verdict placed before a Biotic",
   new RegExp(String.raw`\b(?:strongest|weakest)\s+${BIOTICS}\b`)],
  ["a Biotic as the subject of a personal state verb",
   new RegExp(String.raw`\b${BIOTICS}\s+(?:remains?|appears?|looks?|seems?)\b`)],
  ["a Biotic fed, boosted or improved for a person",
   new RegExp(String.raw`\b(?:fed|feeds|feeding|boost\w*|improv\w*|replenish\w*|rais\w*)\b[^.!?\n]{0,25}\b(?:your|my)\s+${BIOTICS_ANY}\b`)],
  ["a person's own meals characterised as a Biotic",
   new RegExp(String.raw`\b(?:[Yy]our|[Mm]y)\s+(?:\w+\s+){0,2}(?:meals?|plate|diet|food)\b[^.!?\n]{0,30}\b${BIOTICS}\b`)],
]
