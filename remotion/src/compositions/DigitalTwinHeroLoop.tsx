import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AuraGlow } from "../components/AuraGlow";
import { HeroImageLayer } from "../components/HeroImageLayer";
import { Glints } from "../components/Glints";

/**
 * DigitalTwinHeroLoop — the account "Your Digital Twin" hero.
 *
 * The provided male/female artwork is already rich (orbiting microbes, digestive
 * glow, rings), so this loop stays deliberately SUBTLE: a soft breathing aura, a
 * gentle float + breathing zoom on the figure, and a few shimmer glints. No
 * orbit/scanner/score-ring layers (the art has its own). Landscape 3:2 so nothing
 * crops. Rendered to mp4/webm and played by the app via <HeroVideo> (no Remotion
 * runtime ships). Seamless 8s/240f loop; layers fully present from frame 0.
 */
export const DigitalTwinHeroLoop: React.FC<{ heroImage?: string }> = ({
  heroImage = "assets/twin-male.png",
}) => {
  const frame = useCurrentFrame();
  // One full sine over the loop = seamless float + breathing zoom.
  const floatY = Math.sin((frame / 240) * Math.PI * 2) * 0.012;
  const zoom = 1 + 0.03 * Math.sin((frame / 240) * Math.PI * 2);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      {/* soft heartbeat aura, kept tight so tile edges stay pure white */}
      <AuraGlow sizePct={0.62} beatSec={5} hueSec={9} />

      {/* the figure — gentle float + breathing zoom (its own microbes float with it) */}
      <HeroImageLayer
        src={heroImage}
        startFrame={-200}
        heightPct={0.98}
        offsetYPct={floatY}
        scale={zoom}
        glow={false}
      />

      {/* a few shimmer glints across the figure */}
      <Glints count={14} loopSec={8} />
    </AbsoluteFill>
  );
};
