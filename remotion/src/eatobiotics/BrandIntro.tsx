import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { BioticPill } from "./BioticPill";
import {
  COLORS,
  ICON,
  BRAND_GRADIENT,
  BRAND_GRADIENT_H,
  BRAND_GRADIENT_STOPS,
  FONTS,
} from "./brand";

/**
 * EatoBrandIntro — the foundation brand-intro composition.
 *
 * A calm, premium, white-background open: a cluster of brand-coloured biotic
 * pills springs in, the EatoBiotics wordmark rises, a brand-gradient divider
 * wipes across beneath it, and a serif tagline settles in. Built from reusable
 * brand tokens (`brand.ts`) + `BioticPill` so it can be the base we evolve into
 * adverts, assessment explainers, hero animations and social cuts.
 */
export const BrandIntro: React.FC<{
  wordmark?: string;
  tagline?: string;
}> = ({ wordmark = "EatoBiotics", tagline = "Your food system, understood." }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Wordmark rises + fades in.
  const wordmarkSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  const wordmarkY = interpolate(wordmarkSpring, [0, 1], [40, 0]);
  const wordmarkOpacity = interpolate(wordmarkSpring, [0, 1], [0, 1]);

  // Gradient divider wipes from the centre outwards.
  const dividerProgress = interpolate(frame, [48, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Tagline fades up last.
  const taglineSpring = spring({
    frame: frame - 66,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  const taglineY = interpolate(taglineSpring, [0, 1], [24, 0]);
  const taglineOpacity = interpolate(taglineSpring, [0, 1], [0, 1]);

  // Gentle overall settle at the end (subtle scale breathe-in).
  const settle = interpolate(frame, [0, 90], [1.015, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // The biotic-pill cluster above the wordmark — one per brand colour, staggered.
  const pillBaseDelay = 6;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: FONTS.sans,
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${settle})`,
      }}
    >
      {/* Very soft brand-tinted radial glow — keeps the white premium, not flat. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 50% at 50% 42%, ${ICON.lime}14 0%, rgba(255,255,255,0) 70%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Biotic pill cluster */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 56,
          }}
        >
          {BRAND_GRADIENT_STOPS.map((color, i) => (
            <BioticPill
              key={color}
              color={color}
              width={96}
              height={20}
              delay={pillBaseDelay + i * 5}
              rise={50}
              rotate={-6 + i * 3}
            />
          ))}
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontFamily: FONTS.serif,
            fontWeight: 600,
            fontSize: 132,
            letterSpacing: "-0.02em",
            color: COLORS.foreground,
            opacity: wordmarkOpacity,
            transform: `translateY(${wordmarkY}px)`,
            lineHeight: 1,
          }}
        >
          {wordmark}
        </div>

        {/* Gradient divider — wipes from the centre outwards */}
        <div
          style={{
            marginTop: 36,
            height: 8,
            width: 360,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: BRAND_GRADIENT_H,
              transform: `scaleX(${dividerProgress})`,
              transformOrigin: "center",
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 40,
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: 40,
            letterSpacing: "0.01em",
            color: COLORS.muted,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Decorative accent gradient bar pinned bottom — brand signature edge. */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div
          style={{
            height: 10,
            width,
            background: BRAND_GRADIENT,
            opacity: interpolate(frame, [12, 36], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
