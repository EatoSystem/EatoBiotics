/**
 * EatoBiotics brand tokens — the single source of truth for every Remotion video.
 *
 * These mirror the web app's design tokens in `app/globals.css` (the `:root`
 * variables + the `.brand-gradient` definition). Keep them in sync with the site:
 * if a colour changes there, change it here, and every composition stays on-brand.
 *
 * Brand rule: warm, organic green → yellow → orange only. No blue. No purple.
 */

/** Core palette (from globals.css `:root`). */
export const COLORS = {
  /** True white — every composition sits on this. */
  background: "#FFFFFF",
  /** Deep green used for all primary text. */
  foreground: "#1A2E12",
  /** Muted green-grey for secondary text. */
  muted: "#5A6E50",
  /** Hairline borders / dividers. */
  border: "#E5E5E5",
  primary: "#4CB648",
  accent: "#F5A623",
} as const;

/** Icon palette — extracted from the EatoBiotics biotic shapes. */
export const ICON = {
  lime: "#A8E063",
  green: "#4CB648",
  teal: "#2DAA6E",
  yellow: "#F5C518",
  orange: "#F5A623",
} as const;

/**
 * The brand gradient — lime → green → teal → yellow → orange.
 * Mirrors `.brand-gradient` (135deg) in globals.css.
 */
export const BRAND_GRADIENT_STOPS = [
  ICON.lime,
  ICON.green,
  ICON.teal,
  ICON.yellow,
  ICON.orange,
] as const;

/** Diagonal brand gradient (matches `.brand-gradient`). */
export const BRAND_GRADIENT = `linear-gradient(135deg, ${ICON.lime} 0%, ${ICON.green} 25%, ${ICON.teal} 50%, ${ICON.yellow} 75%, ${ICON.orange} 100%)`;

/** Horizontal brand gradient (matches the `.section-divider`). */
export const BRAND_GRADIENT_H = `linear-gradient(90deg, ${ICON.lime} 0%, ${ICON.green} 25%, ${ICON.teal} 50%, ${ICON.yellow} 75%, ${ICON.orange} 100%)`;

/**
 * Brand fonts: DM Sans (sans) + Lora (serif), matching the site.
 *
 * Follow-up: load the real font files for pixel-accurate renders via
 * `@remotion/google-fonts/DMSans` + `@remotion/google-fonts/Lora`, or drop
 * local `.woff2` files in `public/fonts` and `@font-face` them. Until then these
 * family names degrade to clean system fallbacks.
 */
export const FONTS = {
  sans: '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: '"Lora", Georgia, "Times New Roman", serif',
} as const;

/** Standard 1080p, 30fps canvas used across the brand videos. */
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;
