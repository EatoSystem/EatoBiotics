import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import {
  COLORS,
  SOFT_RADIAL,
  BRAND_GRADIENT,
  BRAND_GRADIENT_STOPS,
} from "../lib/brand";
import { ParticleField } from "../components/ParticleField";
import { GlowBodySystem } from "../components/GlowBodySystem";
import { ScoreRing } from "../components/ScoreRing";
import { BrandLockup } from "../components/BrandLockup";
import { BioticPill } from "../components/BioticPill";

/**
 * EatoBioticsBrandIntro — the master brand asset. 1920×1080, 30fps, 240f (8s).
 *
 * 0–2s  living brand-particle ecosystem drifts in over premium white.
 * 2–4s  an abstract glowing "food system inside you" form rises in the centre.
 * 4–6s  a score ring forms around it — you are assessed, understood, supported.
 * 6–8s  the system recedes and the EatoBiotics lockup resolves to a clean,
 *       screenshot-worthy final frame.
 */
export const EatoBioticsBrandIntro: React.FC<{
  wordmark?: string;
  tagline?: string;
}> = ({ wordmark, tagline }) => {
  const frame = useCurrentFrame();

  // The body + ring "system" group recedes as the lockup takes over (~6s).
  const systemOpacity = interpolate(frame, [165, 195], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const systemScale = interpolate(frame, [165, 200], [1, 0.86], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Particles stay alive throughout but settle back during the lockup.
  const particleOpacity = interpolate(frame, [170, 205], [1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const BODY = 520;
  const RING = 760;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      {/* Soft brand-tinted radial wash */}
      <AbsoluteFill style={{ background: SOFT_RADIAL }} />

      {/* Living ecosystem of particles */}
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        <ParticleField count={46} />
      </AbsoluteFill>

      {/* Centre system: glowing body + score ring */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: systemOpacity,
          transform: `scale(${systemScale})`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: RING,
            height: RING,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Glowing food-system form */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GlowBodySystem startFrame={60} size={BODY} />
          </div>

          {/* Score ring forms around the body (no number — this is the brand ring) */}
          <div style={{ position: "absolute", inset: 0 }}>
            <ScoreRing
              score={86}
              startFrame={120}
              durationInFrames={55}
              size={RING}
              strokeWidth={16}
              showNumber={false}
            />
          </div>
        </div>
      </AbsoluteFill>

      {/* Final lockup resolves over the receding system */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <BrandLockup
          name={wordmark}
          tagline={tagline}
          startFrame={184}
          wordmarkSize={128}
        />
      </AbsoluteFill>

      {/* Brand-signature gradient edge along the bottom */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div
          style={{
            height: 10,
            width: "100%",
            background: BRAND_GRADIENT,
            opacity: interpolate(frame, [12, 40], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </AbsoluteFill>

      {/* A few biotic pills accent the lockup at the very end */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(frame, [200, 224], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ display: "flex", gap: 16, marginTop: 560 }}>
          {BRAND_GRADIENT_STOPS.map((c, i) => (
            <BioticPill
              key={c}
              color={c}
              width={70}
              height={14}
              delay={202 + i * 4}
              rotate={-6 + i * 3}
              rise={28}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
