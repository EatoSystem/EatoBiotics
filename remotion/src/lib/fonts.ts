/**
 * Brand font family stacks for the EatoBiotics video engine.
 *
 * The actual DM Sans (sans) + Lora (serif) faces are self-hosted via
 * `src/fonts.css` (woff2 in `src/fonts/`, imported by `src/index.css`). That means
 * the real brand type renders identically in Remotion Studio AND in headless
 * renders, with no runtime network fetch — so renders never fail on fonts. The
 * system fallbacks below cover the brief moment before the woff2 decodes.
 */

/** Sans stack — DM Sans with safe system fallbacks. */
export const SANS_FAMILY =
  '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

/** Serif stack — Lora with safe system fallbacks. */
export const SERIF_FAMILY = '"Lora", Georgia, "Times New Roman", serif';
