import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ANIM } from "../lib/brand";

/**
 * A single "biotic pill" — the rounded capsule motif from the EatoBiotics brand
 * (see `.biotic-pill` in globals.css). Reusable across compositions.
 *
 * Springs up into place (scale + fade + a small drift) so a cluster of pills can
 * be staggered via `delay` to feel alive and organic rather than mechanical.
 */
export const BioticPill: React.FC<{
  /** Capsule fill — pass a solid colour or a CSS gradient. */
  color: string;
  width: number;
  height: number;
  /** Frames to wait before this pill animates in. */
  delay?: number;
  /** Final rotation in degrees. */
  rotate?: number;
  /** Vertical drift distance the pill rises from, in px. */
  rise?: number;
  style?: React.CSSProperties;
}> = ({ color, width, height, delay = 0, rotate = 0, rise = 40, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: ANIM.spring,
  });

  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const translateY = interpolate(enter, [0, 1], [rise, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 999,
        background: color,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
        ...style,
      }}
    />
  );
};
