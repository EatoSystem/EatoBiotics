import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { SOFT_RADIAL, ICON } from "../lib/brand";
import { ParticleField } from "../components/ParticleField";
import { ScoreRing } from "../components/ScoreRing";
import { HeroImageLayer } from "../components/HeroImageLayer";
import { DigestiveGlowPulse } from "../components/DigestiveGlowPulse";
import { DigestiveFlow } from "../components/DigestiveFlow";
import { SystemEnergyRings } from "../components/SystemEnergyRings";
import { OrbitingMicrobiomeLayer } from "../components/OrbitingMicrobiomeLayer";
import { AuraGlow } from "../components/AuraGlow";
import { Glints } from "../components/Glints";

/**
 * FoodSystemHeroLoop — a square (1:1), text-free, seamlessly-looping hero for the
 * website hero slots (homepage + waitlist). Rendered to mp4/webm and served by
 * the Next.js app via a plain <video> — no Remotion runtime ships with the app.
 *
 * "Alive" pass: heartbeat aura, flowing nutrients down the tract, orbiting
 * microbes with trails, shimmer glints, a scanner dot circling the score ring,
 * and a gentle figure float. Every motion's period divides the 8s/240f loop so it
 * restarts without a pop; layers are fully present from frame 0 (no entrance fade).
 */
export const FoodSystemHeroLoop: React.FC<{
  heroImage?: string;
}> = ({ heroImage = "assets/food-system-inside-you.png" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Steady-state start (everything fully "in" at frame 0 → loop-safe).
  const STEADY = -200;

  // Vertical float + breathing zoom — one full sine over the loop = seamless.
  const floatY = Math.sin((frame / 240) * Math.PI * 2) * 0.02;
  const zoom = 1 + 0.04 * Math.sin((frame / 240) * Math.PI * 2);

  // Scanner dot circling the score ring (one turn per loop = seamless).
  const ringSize = 920;
  const ringRadius = (ringSize - 10) / 2;
  const scanA = -Math.PI / 2 + (frame / 240) * Math.PI * 2;
  const scanX = width / 2 + Math.cos(scanA) * ringRadius;
  const scanY = height / 2 + Math.sin(scanA) * ringRadius;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      {/* Soft brand radial wash + breathing heartbeat aura */}
      <AbsoluteFill style={{ background: SOFT_RADIAL }} />
      <AuraGlow sizePct={0.95} beatSec={2} hueSec={8} />

      {/* Living particles (subtle) */}
      <ParticleField count={28} maxOpacity={0.4} fadeInBy={1} />

      {/* Energy rings behind the figure */}
      <SystemEnergyRings startFrame={STEADY} count={3} sizePct={0.98} />

      {/* Back microbiome orbit (2 turns / loop) */}
      <OrbitingMicrobiomeLayer
        startFrame={STEADY}
        count={7}
        radiiPct={[0.42, 0.48]}
        speed={11.25}
        seed={2}
        maxOpacity={0.7}
        trail={4}
        pulse
      />

      {/* The figure — float + breathing zoom */}
      <HeroImageLayer
        src={heroImage}
        startFrame={STEADY}
        heightPct={0.96}
        offsetYPct={floatY}
        scale={zoom}
        glow={false}
      />

      {/* Digestive system: lit base glow + flowing nutrients */}
      <DigestiveGlowPulse startFrame={STEADY} />
      <DigestiveFlow count={14} cycleSec={2} />

      {/* Shimmer glints across the figure */}
      <Glints count={20} loopSec={8} />

      {/* Front microbiome orbit (3 turns / loop) */}
      <OrbitingMicrobiomeLayer
        startFrame={STEADY}
        count={7}
        radiiPct={[0.4, 0.46]}
        speed={16.875}
        seed={9}
        maxOpacity={1}
        trail={5}
        pulse
      />

      {/* Subtle static score ring — brand tie-in */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
        <ScoreRing
          score={86}
          startFrame={STEADY}
          durationInFrames={1}
          size={ringSize}
          strokeWidth={10}
          showNumber={false}
        />
      </AbsoluteFill>

      {/* Scanner dot travelling the score ring */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: scanX - 9,
            top: scanY - 9,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: `radial-gradient(circle, #FFFFFF 0%, ${ICON.green} 45%, ${ICON.green}00 72%)`,
            boxShadow: `0 0 16px ${ICON.green}`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
