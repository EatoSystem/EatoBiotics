/**
 * EatoBiotics brand system — the single source of truth for every Remotion video.
 *
 * Mirrors the website's design tokens in `app/globals.css` (the `:root` variables
 * + the `.brand-gradient` / `.section-divider` definitions). Keep in sync with the
 * site: change a colour there, change it here, and every composition stays
 * on-brand.
 *
 * Brand rule: warm, organic green → yellow → orange only. **No blue. No purple.**
 */
import React from "react";
import { SANS_FAMILY, SERIF_FAMILY } from "./fonts";

/* ── Colour palette (from globals.css `:root`) ──────────────────────────────── */
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

/** Ordered gradient stops — lime → green → teal → yellow → orange. */
export const BRAND_GRADIENT_STOPS = [
  ICON.lime,
  ICON.green,
  ICON.teal,
  ICON.yellow,
  ICON.orange,
] as const;

/** Diagonal brand gradient (matches `.brand-gradient`, 135deg). */
export const BRAND_GRADIENT = `linear-gradient(135deg, ${ICON.lime} 0%, ${ICON.green} 25%, ${ICON.teal} 50%, ${ICON.yellow} 75%, ${ICON.orange} 100%)`;

/** Horizontal brand gradient (matches `.section-divider`, 90deg). */
export const BRAND_GRADIENT_H = `linear-gradient(90deg, ${ICON.lime} 0%, ${ICON.green} 25%, ${ICON.teal} 50%, ${ICON.yellow} 75%, ${ICON.orange} 100%)`;

/** A soft brand-tinted radial wash to keep white surfaces premium, not flat. */
export const SOFT_RADIAL = `radial-gradient(60% 50% at 50% 42%, ${ICON.lime}14 0%, rgba(255,255,255,0) 70%)`;

/* ── Fonts ──────────────────────────────────────────────────────────────────── */
export const FONTS = {
  sans: SANS_FAMILY,
  serif: SERIF_FAMILY,
} as const;

/* ── Canvas presets ─────────────────────────────────────────────────────────── */
/** Standard 1080p landscape, 30fps — website hero + brand videos. */
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Vertical 9:16 — social (Reels / TikTok / Shorts). */
export const VIDEO_VERTICAL = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/* ── Animation timings (frames @ 30fps) + spring presets ────────────────────── */
export const ANIM = {
  fps: 30,
  /** Quick UI fade. */
  fast: 12,
  /** Standard element entrance. */
  base: 20,
  /** Slow, premium reveal. */
  slow: 30,
  /** Calm, premium spring — soft settle, no bounce. */
  spring: { damping: 200, mass: 0.8 } as const,
  /** Slightly snappier spring for smaller elements. */
  springSnappy: { damping: 200, mass: 0.6 } as const,
} as const;

/* ── Glow / shadow presets ──────────────────────────────────────────────────── */
export const GLOW = {
  /** Soft green ambient glow. */
  green: `0 0 80px ${ICON.green}55`,
  /** Warm orange accent glow. */
  orange: `0 0 60px ${ICON.orange}55`,
  /** Subtle premium card shadow. */
  card: "0 24px 60px rgba(26,46,18,0.10)",
  /** SVG drop-shadow filter for rings/marks. */
  ringFilter: `drop-shadow(0 0 18px ${ICON.green}66)`,
} as const;

/* ── Shared text styles ─────────────────────────────────────────────────────── */
export const TEXT = {
  /** Large serif wordmark (EatoBiotics). */
  wordmark: {
    fontFamily: FONTS.serif,
    fontWeight: 600,
    color: COLORS.foreground,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  } as React.CSSProperties,
  /** Serif display heading. */
  h1: {
    fontFamily: FONTS.serif,
    fontWeight: 600,
    color: COLORS.foreground,
    letterSpacing: "-0.015em",
    lineHeight: 1.08,
  } as React.CSSProperties,
  /** Sans tagline / supporting line. */
  tagline: {
    fontFamily: FONTS.sans,
    fontWeight: 500,
    color: COLORS.muted,
    letterSpacing: "0.01em",
    lineHeight: 1.3,
  } as React.CSSProperties,
  /** Small uppercase eyebrow label. */
  eyebrow: {
    fontFamily: FONTS.sans,
    fontWeight: 700,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
  } as React.CSSProperties,
  /** Big numeric (scores). */
  numeral: {
    fontFamily: FONTS.serif,
    fontWeight: 600,
    color: COLORS.foreground,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  } as React.CSSProperties,
} as const;

/** Brand wording used across compositions. */
export const BRAND_COPY = {
  name: "EatoBiotics",
  tagline: "The Food System Inside You",
} as const;
