import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { COLORS, SOFT_RADIAL, TEXT, ICON, BRAND_GRADIENT } from "../lib/brand";
import { ParticleField } from "../components/ParticleField";
import { ScoreRing } from "../components/ScoreRing";
import { MetricPill } from "../components/MetricPill";
import { BrandLockup } from "../components/BrandLockup";

/**
 * MealScoreSocialVideo — reusable vertical (9:16) social scaffold.
 * 1080×1920, 30fps, ~11s. Designed for meal scoring + sharing.
 *
 * Score, labels and the meal image are all props so this can later be generated
 * per meal. When no meal image is supplied, a clean abstract brand "plate" stands
 * in — no external asset required.
 */
export type MealScoreProps = {
  score?: number;
  max?: number;
  /** Public path (in /remotion/public) of a meal photo. Falls back to abstract plate. */
  mealImage?: string;
  labels?: string[];
  title?: string;
};

/** Abstract brand plate: a four-segment gradient disc — the EatoBiotics plate motif. */
const AbstractPlate: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const spin = Math.sin(t * 0.4) * 4; // gentle wobble, not a full spin
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(${ICON.lime} 0deg 90deg, ${ICON.green} 90deg 180deg, ${ICON.yellow} 180deg 270deg, ${ICON.orange} 270deg 360deg)`,
          transform: `rotate(${spin}deg)`,
          opacity: 0.9,
          filter: "saturate(1.05)",
        }}
      />
      {/* plate rim */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: `inset 0 0 0 10px ${COLORS.background}`, }} />
      {/* centre well */}
      <div
        style={{
          position: "absolute",
          inset: size * 0.3,
          borderRadius: "50%",
          background: COLORS.background,
          boxShadow: "inset 0 8px 30px rgba(26,46,18,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("eatobiotics-icon.png")}
          style={{ width: size * 0.22, height: size * 0.22, opacity: 0.9 }}
        />
      </div>
    </div>
  );
};

export const MealScoreSocialVideo: React.FC<MealScoreProps> = ({
  score = 81,
  max = 100,
  mealImage,
  labels = [
    "Prebiotic base",
    "Protein support",
    "Fermented boost",
    "Colour diversity",
    "Stability impact",
  ],
  title = "Meal Score",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const plateSpring = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.7 } });
  const plateScale = interpolate(plateSpring, [0, 1], [0.8, 1]);
  const plateOpacity = interpolate(plateSpring, [0, 1], [0, 1]);

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Everything settles, then the end lockup rises near the close.
  const lockupOpacity = interpolate(frame, [270, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const PLATE = 560;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <AbsoluteFill style={{ background: SOFT_RADIAL }} />
      <AbsoluteFill style={{ opacity: 0.7 }}>
        <ParticleField count={28} maxOpacity={0.4} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 150,
          paddingLeft: 70,
          paddingRight: 70,
        }}
      >
        {/* Title */}
        <div style={{ ...TEXT.eyebrow, fontSize: 40, opacity: titleOpacity }}>
          {title}
        </div>

        {/* Meal / plate */}
        <div
          style={{
            marginTop: 56,
            opacity: plateOpacity,
            transform: `scale(${plateScale})`,
            borderRadius: mealImage ? 40 : "50%",
            overflow: "hidden",
          }}
        >
          {mealImage ? (
            <Img
              src={staticFile(mealImage)}
              style={{ width: PLATE, height: PLATE, objectFit: "cover" }}
            />
          ) : (
            <AbstractPlate size={PLATE} />
          )}
        </div>

        {/* Score ring */}
        <div style={{ marginTop: 64 }}>
          <ScoreRing
            score={score}
            max={max}
            size={460}
            strokeWidth={26}
            startFrame={40}
            durationInFrames={80}
            caption={`/ ${max}`}
          />
        </div>

        {/* Labels — stagger in as a vertical list */}
        <div
          style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            gap: 22,
            alignItems: "center",
          }}
        >
          {labels.map((l, i) => (
            <MetricPill key={l} label={l} delay={130 + i * 12} large />
          ))}
        </div>
      </AbsoluteFill>

      {/* End lockup */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 120,
          opacity: lockupOpacity,
        }}
      >
        <BrandLockup
          name="Scored with EatoBiotics"
          startFrame={272}
          wordmarkSize={70}
          showLogo={false}
        />
      </AbsoluteFill>

      {/* Bottom gradient edge */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div style={{ height: 12, width: "100%", background: BRAND_GRADIENT }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
