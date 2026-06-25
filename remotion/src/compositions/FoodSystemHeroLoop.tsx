import React from "react";
import { AbsoluteFill } from "remotion";
import { SOFT_RADIAL } from "../lib/brand";
import { ParticleField } from "../components/ParticleField";
import { ScoreRing } from "../components/ScoreRing";
import { HeroImageLayer } from "../components/HeroImageLayer";
import { DigestiveGlowPulse } from "../components/DigestiveGlowPulse";
import { SystemEnergyRings } from "../components/SystemEnergyRings";
import { OrbitingMicrobiomeLayer } from "../components/OrbitingMicrobiomeLayer";

/**
 * FoodSystemHeroLoop — a square (1:1), text-free, seamlessly-looping version of
 * the hero for embedding in the website hero slots (homepage + waitlist). It is
 * rendered to an mp4/webm and served by the Next.js app via a plain <video> — no
 * Remotion runtime ships with the app.
 *
 * No entrance/exit fades and no lockup: every layer is "fully on" from frame 0
 * (large-negative startFrames), so the clip restarts without a pop. Only
 * continuous, gentle motion (breathe, slow orbits, glow pulse, particle drift)
 * runs — the headline lives in the page's H1, not here.
 */
export const FoodSystemHeroLoop: React.FC<{
  heroImage?: string;
}> = ({ heroImage = "assets/food-system-inside-you.png" }) => {
  // Steady-state start frame: pushed far into the past so every spring/entrance
  // has already settled at frame 0 (no fade-in on loop restart).
  const STEADY = -200;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      {/* Soft brand radial wash */}
      <AbsoluteFill style={{ background: SOFT_RADIAL }} />

      {/* Living particles (subtle) */}
      <ParticleField count={30} maxOpacity={0.42} fadeInBy={1} />

      {/* Energy rings behind the figure */}
      <SystemEnergyRings startFrame={STEADY} count={3} sizePct={0.98} />

      {/* Back microbiome orbit */}
      <OrbitingMicrobiomeLayer
        startFrame={STEADY}
        count={5}
        radiiPct={[0.42, 0.48]}
        speed={5}
        seed={2}
        maxOpacity={0.55}
      />

      {/* The figure (breathe only — fully present from frame 0) */}
      <HeroImageLayer src={heroImage} startFrame={STEADY} heightPct={0.96} />

      {/* Digestive system, lit + breathing */}
      <DigestiveGlowPulse startFrame={STEADY} />

      {/* Front microbiome orbit */}
      <OrbitingMicrobiomeLayer
        startFrame={STEADY}
        count={5}
        radiiPct={[0.4, 0.46]}
        speed={7}
        seed={9}
        maxOpacity={0.9}
      />

      {/* Subtle static score ring — brand tie-in, fully drawn, low opacity */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 0.45 }}>
        <ScoreRing
          score={86}
          startFrame={STEADY}
          durationInFrames={1}
          size={920}
          strokeWidth={10}
          showNumber={false}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
