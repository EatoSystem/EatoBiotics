import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, ICON, BRAND_GRADIENT, FONTS, GLOW, ANIM } from "../lib/brand";

/**
 * A pill / chip showing a metric or pillar — a gradient accent dot, a label, and
 * an optional value. Springs up with a per-item `delay` so a row/column of pills
 * can stagger in. Used for assessment pillars and meal-score labels.
 */
export const MetricPill: React.FC<{
  label: string;
  value?: string;
  /** Frames to wait before animating in. */
  delay?: number;
  /** Accent colour for the dot (defaults to the brand gradient). */
  accent?: string;
  /** Larger sizing for vertical/social layouts. */
  large?: boolean;
}> = ({ label, value, delay = 0, accent, large = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: ANIM.springSnappy,
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [22, 0]);

  const pad = large ? "18px 30px" : "14px 24px";
  const fontSize = large ? 38 : 30;
  const dot = large ? 20 : 16;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: large ? 18 : 14,
        padding: pad,
        borderRadius: 999,
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        boxShadow: GLOW.card,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          borderRadius: 999,
          background: accent ?? BRAND_GRADIENT,
          boxShadow: `0 0 12px ${ICON.green}66`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: FONTS.sans,
          fontWeight: 600,
          fontSize,
          color: COLORS.foreground,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {value && (
        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize,
            color: COLORS.muted,
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
};
