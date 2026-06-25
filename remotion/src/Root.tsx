import "./index.css";
import { Composition } from "remotion";
import { BrandIntro } from "./eatobiotics/BrandIntro";
import { VIDEO } from "./eatobiotics/brand";

/**
 * Composition registry. The first EatoBiotics video is `EatoBrandIntro` — the
 * brand-intro foundation we evolve into adverts, assessment explainers, hero
 * animations and social cuts.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EatoBrandIntro"
        component={BrandIntro}
        durationInFrames={150}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          wordmark: "EatoBiotics",
          tagline: "Your food system, understood.",
        }}
      />
    </>
  );
};
