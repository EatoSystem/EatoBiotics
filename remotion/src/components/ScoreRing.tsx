import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { ICON, COLORS, TEXT, GLOW } from "../lib/brand";

/**
 * Animated circular score ring — the EatoBiotics score-system motif.
 * Gradient stroke (lime → green → teal → yellow → orange), soft glow, and a
 * number that counts up in sync with the arc. Used by every score composition.
 */
export const ScoreRing: React.FC<{
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  /** Frame at which the ring begins animating. */
  startFrame?: number;
  /** How long the fill + count animation runs, in frames. */
  durationInFrames?: number;
  /** Show the numeric value in the centre. */
  showNumber?: boolean;
  /** Small caption under the number (e.g. "/ 100" or a label). */
  caption?: string;
  /** Font size for the numeral (defaults proportional to size). */
  numberSize?: number;
}> = ({
  score,
  max = 100,
  size = 460,
  strokeWidth = 22,
  startFrame = 0,
  durationInFrames = 60,
  showNumber = true,
  caption,
  numberSize,
}) => {
  const frame = useCurrentFrame();

  const progressRaw = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  const fraction = Math.max(0, Math.min(1, score / max));
  const progress = progressRaw * fraction;
  const displayed = Math.round(progressRaw * score);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradId = "eato-score-grad";
  const glowId = "eato-score-glow";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ filter: GLOW.ringFilter }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ICON.lime} />
            <stop offset="30%" stopColor={ICON.green} />
            <stop offset="55%" stopColor={ICON.teal} />
            <stop offset="78%" stopColor={ICON.yellow} />
            <stop offset="100%" stopColor={ICON.orange} />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          opacity={0.5}
        />

        {/* Progress arc — starts at 12 o'clock, sweeps clockwise */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {showNumber && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ ...TEXT.numeral, fontSize: numberSize ?? size * 0.3 }}>
            {displayed}
          </div>
          {caption && (
            <div
              style={{
                ...TEXT.tagline,
                fontSize: size * 0.06,
                marginTop: size * 0.01,
              }}
            >
              {caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
