// lib/pdf/pdf-fonts.ts
// Server-only — brand typefaces for the paid PDF.

import path from "node:path"
import fs from "node:fs"
import { Font } from "@react-pdf/renderer"

/**
 * Registers Lora + DM Sans for the paid PDF, and **fails safe to the base-14
 * fonts if it cannot**.
 *
 * ── Why the fallback is not optional ─────────────────────────────────────────
 *
 * These files live in `public/fonts/`, read at runtime through `process.cwd()`.
 * `next.config.mjs` excludes `public/images/**` from serverless tracing and the
 * font path is built dynamically, so whether the .ttf files actually reach the
 * lambda depends on the tracer and on the tracingIncludes entry that ships with
 * this change. If any of that is wrong in a future deploy, `Font.register` with
 * a missing file throws — and react-pdf also throws when a style names a family
 * that was never registered.
 *
 * Either failure would break **every paid PDF**, which is exactly the outage
 * Phase 1 fixed (`Helvetica-Bold` + `fontStyle: italic` resolved to nothing and
 * the whole render threw). So registration is attempted once, guarded, and the
 * exported FONT names point at Helvetica when it did not work. A deploy that
 * loses the fonts produces a plainer PDF instead of no PDF.
 *
 * `fontsRegistered` is exported so a test can assert the brand path is the one
 * actually being exercised here, rather than silently testing the fallback.
 */

const FONTS_DIR = path.join(process.cwd(), "public", "fonts")

const FILES = {
  lora: path.join(FONTS_DIR, "Lora.ttf"),
  loraItalic: path.join(FONTS_DIR, "Lora-Italic.ttf"),
  dmSans: path.join(FONTS_DIR, "DMSans.ttf"),
  dmSansItalic: path.join(FONTS_DIR, "DMSans-Italic.ttf"),
} as const

function tryRegister(): boolean {
  try {
    if (!Object.values(FILES).every((f) => fs.existsSync(f))) return false

    // A family per weight rather than weights within one family: react-pdf
    // resolves synthetic weights inconsistently across versions, and a miss
    // throws at render time rather than degrading.
    Font.register({ family: "Lora", src: FILES.lora })
    Font.register({ family: "Lora-Bold", src: FILES.lora, fontWeight: 700 })
    Font.register({ family: "Lora-Italic", src: FILES.loraItalic })
    Font.register({ family: "DMSans", src: FILES.dmSans })
    Font.register({ family: "DMSans-Bold", src: FILES.dmSans, fontWeight: 700 })
    Font.register({ family: "DMSans-Italic", src: FILES.dmSansItalic })

    // Lora and DM Sans have no hyphenation data here; the default hyphenation
    // callback breaks long words mid-syllable in narrow columns, which reads as
    // a typo in a paid report.
    Font.registerHyphenationCallback((word) => [word])
    return true
  } catch {
    return false
  }
}

export const fontsRegistered = tryRegister()

/**
 * The family names to use in styles. Never write "Lora" directly into a
 * StyleSheet — go through these, so the fallback actually takes effect.
 */
export const FONT = fontsRegistered
  ? {
      serif: "Lora",
      serifBold: "Lora-Bold",
      serifItalic: "Lora-Italic",
      sans: "DMSans",
      sansBold: "DMSans-Bold",
      sansItalic: "DMSans-Italic",
    }
  : {
      serif: "Helvetica",
      serifBold: "Helvetica-Bold",
      serifItalic: "Helvetica-Oblique",
      sans: "Helvetica",
      sansBold: "Helvetica-Bold",
      sansItalic: "Helvetica-Oblique",
    }
