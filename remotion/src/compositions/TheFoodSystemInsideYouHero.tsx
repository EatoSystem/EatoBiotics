import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { SOFT_RADIAL, BRAND_GRADIENT, TEXT } from "../lib/brand";
import { ParticleField } from "../components/ParticleField";
import { ScoreRing } from "../components/ScoreRing";
import { BrandLockup } from "../components/BrandLockup";
import { HeroImageLayer } from "../components/HeroImageLayer";
import { DigestiveGlowPulse, type GutPoint } from "../components/DigestiveGlowPulse";
import { SystemEnergyRings } from "../components/SystemEnergyRings";
import { OrbitingMicrobiomeLayer } from "../components/OrbitingMicrobiomeLayer";

/**
 * TheFoodSystemInsideYouHero — the flagship 12s brand hero.
 * 1920×1080, 30fps, 360f. Animates the EatoBiotics "food system inside you"
 * artwork: a living particle ecosystem, the figure resolving in, the digestive
 * system activating, microbiome orbits + energy rings, a score ring, and the
 * final brand lockup.
 *
 * Data-driven: the hero image, copy, gut-glow points and score are all props, so
 * this can be reused with other hero assets and adapted to 9:16 / 1:1 canvases
 * (layout uses relative units throughout).
 */
export type FoodSystemHeroProps = {
  heroImage?: string;
  wordmark?: string;
  tagline?: string;
  subline?: string;
  score?: number;
  showScoreRing?: boolean;
  gutPoints?: GutPoint[];
};

export const TheFoodSystemInsideYouHero: React.FC<FoodSystemHeroProps> = ({
  heroImage = "assets/food-system-inside-you.png",
  wordmark = "EatoBiotics",
  tagline = "The Food System Inside You",
  subline = "Understand your internal food system.",
  score = 86,
  showScoreRing = true,
  gutPoints,
}) => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  // ── Finale (10–12s): figure eases up + shrinks, scene settles, lockup resolves.
  const figureScale = interpolate(frame, [300, 345], [1, 0.84], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const figureOffsetY = interpolate(frame, [300, 345], [0, -0.09], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const particleOpacity = interpolate(frame, [310, 345], [1, 0.5], clamp);
  // Score ring fades in for its phase (~8s) and out into the finale (~10s).
  const ringFade = interpolate(frame, [232, 252, 300, 322], [0, 1, 1, 0], clamp);
  const scrimOpacity = interpolate(frame, [300, 338], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FCFDFB" }}>
      {/* Soft brand radial wash on near-white */}
      <AbsoluteFill style={{ background: SOFT_RADIAL }} />

      {/* 0–2s: living particle ecosystem */}
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        <ParticleField count={44} maxOpacity={0.5} />
      </AbsoluteFill>

      {/* 6–8s: energy rings (behind figure) */}
      <SystemEnergyRings startFrame={180} count={3} sizePct={1.02} />

      {/* Back microbiome orbit (behind figure) */}
      <OrbitingMicrobiomeLayer
        startFrame={185}
        count={5}
        radiiPct={[0.5, 0.58]}
        speed={5}
        seed={2}
        maxOpacity={0.55}
      />

      {/* 2–4s: hero figure resolves in (finale transform applied here) */}
      <HeroImageLayer
        src={heroImage}
        startFrame={60}
        heightPct={0.94}
        scale={figureScale}
        offsetYPct={figureOffsetY}
      />

      {/* 4–6s: digestive system activates (over the figure) */}
      <DigestiveGlowPulse startFrame={120} points={gutPoints} />

      {/* Front microbiome orbit (in front of figure) */}
      <OrbitingMicrobiomeLayer
        startFrame={195}
        count={5}
        radiiPct={[0.46, 0.54]}
        speed={7}
        seed={9}
        maxOpacity={0.95}
      />

      {/* 8–10s: score ring forms near the figure (ties to Biotics Score™) */}
      {showScoreRing && (
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", opacity: ringFade }}
        >
          <ScoreRing
            score={score}
            startFrame={240}
            durationInFrames={55}
            size={980}
            strokeWidth={12}
            showNumber={false}
          />
        </AbsoluteFill>
      )}

      {/* Finale scrim so the lockup reads cleanly over the lower scene */}
      <AbsoluteFill
        style={{
          opacity: scrimOpacity,
          background:
            "linear-gradient(to top, #FCFDFB 8%, rgba(252,253,251,0.85) 26%, rgba(252,253,251,0) 52%)",
        }}
      />

      {/* 10–12s: brand lockup resolves in the lower third */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 96,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <BrandLockup
            name={wordmark}
            tagline={tagline}
            startFrame={312}
            showLogo={false}
            wordmarkSize={96}
          />
          {subline && (
            <div
              style={{
                ...TEXT.tagline,
                fontSize: 28,
                marginTop: 22,
                opacity: interpolate(frame, [336, 356], [0, 1], clamp),
              }}
            >
              {subline}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* Brand-signature gradient edge */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div
          style={{
            height: 10,
            width: "100%",
            background: BRAND_GRADIENT,
            opacity: interpolate(frame, [12, 40], [0, 1], clamp),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
