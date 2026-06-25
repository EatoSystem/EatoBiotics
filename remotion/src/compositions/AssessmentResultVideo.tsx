import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS, SOFT_RADIAL, TEXT, ICON, BRAND_GRADIENT_STOPS } from "../lib/brand";
import { ParticleField } from "../components/ParticleField";
import { ScoreRing } from "../components/ScoreRing";
import { MetricPill } from "../components/MetricPill";
import { GradientText } from "../components/GradientText";
import { BrandLockup } from "../components/BrandLockup";

/**
 * AssessmentResultVideo — reusable, data-driven scaffold (1920×1080, 30fps, ~13s).
 * Shown after a user completes an EatoBiotics assessment. Score, name, copy and
 * pillars are all props so this can later generate personalised result videos.
 *
 * Flow: intro pulse → score ring counts 0→score → pillars + summary → CTA.
 */
export type AssessmentResultProps = {
  name?: string;
  score?: number;
  max?: number;
  summary?: string;
  pillars?: string[];
  cta?: string;
};

export const AssessmentResultVideo: React.FC<AssessmentResultProps> = ({
  name,
  score = 72,
  max = 100,
  summary = "Your internal food system shows strong foundations, with opportunities to improve stability, diversity, and daily rhythm.",
  pillars = ["Stability", "Diversity", "Rhythm", "Energy"],
  cta = "Understand your Food System Inside You",
}) => {
  const frame = useCurrentFrame();

  const fade = (a: number, b: number, from = 0, to = 1) =>
    interpolate(frame, [a, b], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });

  // Eyebrow + score occupy the first ~2/3; then everything lifts and the CTA enters.
  const headOpacity = fade(8, 30);
  const scoreGroupY = interpolate(frame, [180, 215], [0, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Final CTA phase.
  const ctaOpacity = fade(320, 350);
  const bodyOpacity = fade(330, 358, 1, 0); // fade score/pillars out under the CTA

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <AbsoluteFill style={{ background: SOFT_RADIAL }} />
      <AbsoluteFill style={{ opacity: 0.7 }}>
        <ParticleField count={32} maxOpacity={0.4} />
      </AbsoluteFill>

      {/* Score + pillars group */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: bodyOpacity,
          transform: `translateY(${scoreGroupY}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              ...TEXT.eyebrow,
              fontSize: 30,
              opacity: headOpacity,
              marginBottom: 28,
            }}
          >
            {name ? `${name} · Your Biotics Score™` : "Your Biotics Score™"}
          </div>

          {/* Score ring counts up */}
          <ScoreRing
            score={score}
            max={max}
            size={420}
            strokeWidth={22}
            startFrame={45}
            durationInFrames={95}
            caption={`/ ${max}`}
          />

          {/* Pillars */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 56,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 1200,
            }}
          >
            {pillars.map((p, i) => (
              <MetricPill
                key={p}
                label={p}
                delay={170 + i * 10}
                accent={BRAND_GRADIENT_STOPS[i % BRAND_GRADIENT_STOPS.length]}
              />
            ))}
          </div>

          {/* Summary copy */}
          <div
            style={{
              ...TEXT.tagline,
              fontSize: 34,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 1100,
              marginTop: 44,
              opacity: fade(230, 262),
            }}
          >
            {summary}
          </div>
        </div>
      </AbsoluteFill>

      {/* CTA close */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: ctaOpacity,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              ...TEXT.h1,
              fontSize: 64,
              textAlign: "center",
              maxWidth: 1300,
            }}
          >
            <GradientText>{cta}</GradientText>
          </div>
          <div style={{ marginTop: 56 }}>
            <BrandLockup startFrame={332} showLogo wordmarkSize={64} tagline="" />
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom gradient edge */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div style={{ height: 10, width: "100%", background: `linear-gradient(90deg, ${ICON.lime}, ${ICON.green}, ${ICON.teal}, ${ICON.yellow}, ${ICON.orange})` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
