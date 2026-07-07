import React from "react";
import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { TEXT, BRAND_GRADIENT_H, BRAND_COPY, ANIM } from "../lib/brand";

/**
 * The EatoBiotics brand lockup: logo mark + "EatoBiotics" wordmark (Lora) + the
 * "The Food System Inside You" tagline (DM Sans), with a brand-gradient divider.
 * Springs in from `startFrame`. The final premium lockup reused as the close of
 * every video and the intro brand asset.
 */
export const BrandLockup: React.FC<{
  name?: string;
  tagline?: string;
  /** Show the logo mark above the wordmark. */
  showLogo?: boolean;
  /** Public path of the logo (must live in /remotion/public). Empty string hides it. */
  logoSrc?: string;
  /** Frame at which the lockup starts animating in. */
  startFrame?: number;
  /** Scale everything down for in-video / corner use. */
  scale?: number;
  /** Wordmark font size in px (before `scale`). */
  wordmarkSize?: number;
}> = ({
  name = BRAND_COPY.name,
  tagline = BRAND_COPY.tagline,
  showLogo = true,
  logoSrc = "eatobiotics-icon.png",
  startFrame = 0,
  scale = 1,
  wordmarkSize = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: ANIM.spring,
  });
  const wordmarkY = interpolate(enter, [0, 1], [40, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const logoSpring = spring({
    frame: frame - startFrame - 4,
    fps,
    config: ANIM.springSnappy,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.7, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // Divider wipes from the centre outwards, just after the wordmark lands.
  const divider = interpolate(
    frame,
    [startFrame + 14, startFrame + 40],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  const taglineSpring = spring({
    frame: frame - startFrame - 16,
    fps,
    config: ANIM.spring,
  });
  const taglineOpacity = interpolate(taglineSpring, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineSpring, [0, 1], [20, 0]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${scale})`,
      }}
    >
      {showLogo && logoSrc && (
        <Img
          src={staticFile(logoSrc)}
          style={{
            width: wordmarkSize * 0.92,
            height: wordmarkSize * 0.92,
            marginBottom: wordmarkSize * 0.18,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        />
      )}

      <div
        style={{
          ...TEXT.wordmark,
          fontSize: wordmarkSize,
          opacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        {name}
      </div>

      <div
        style={{
          marginTop: wordmarkSize * 0.26,
          height: Math.max(6, wordmarkSize * 0.06),
          width: wordmarkSize * 2.9,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            background: BRAND_GRADIENT_H,
            transform: `scaleX(${divider})`,
            transformOrigin: "center",
          }}
        />
      </div>

      <div
        style={{
          ...TEXT.tagline,
          marginTop: wordmarkSize * 0.28,
          fontSize: wordmarkSize * 0.32,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        {tagline}
      </div>
    </div>
  );
};
