/**
 * Identity labels — shareable gut health identities
 *
 * Profile types (Strong Foundation, Emerging Balance) are clinical/diagnostic.
 * Identity labels are shareable words: positive, forward-looking at every score
 * range, and memorable enough to spark curiosity in a social post.
 */

export interface IdentityLabel {
  word:    string  // e.g. "Plant Builder"
  tagline: string  // e.g. "Building a solid food foundation"
  emoji:   string  // e.g. "🌱"
}

const LABELS: Array<{ min: number } & IdentityLabel> = [
  {
    min:     90,
    word:    "Gut Athlete",
    tagline: "Elite-level food system",
    emoji:   "🔥",
  },
  {
    min:     75,
    word:    "Biotic Champion",
    tagline: "Your food system is genuinely strong",
    emoji:   "🏆",
  },
  {
    min:     60,
    word:    "Gut Optimizer",
    tagline: "Actively fine-tuning your food system",
    emoji:   "⚡",
  },
  {
    min:     45,
    word:    "Food Strategist",
    tagline: "Making intentional food choices",
    emoji:   "🎯",
  },
  {
    min:     30,
    word:    "Plant Builder",
    tagline: "Building a solid food foundation",
    emoji:   "🌱",
  },
  {
    min:     0,
    word:    "Gut Explorer",
    tagline: "You've started the journey",
    emoji:   "🧭",
  },
]

/**
 * Returns the identity label for a given score (0–100).
 */
export function getIdentityLabel(score: number): IdentityLabel {
  for (const label of LABELS) {
    if (score >= label.min) {
      return { word: label.word, tagline: label.tagline, emoji: label.emoji }
    }
  }
  // Fallback (score < 0 edge case)
  return { word: "Gut Explorer", tagline: "You've started the journey", emoji: "🧭" }
}
