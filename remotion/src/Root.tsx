import "./index.css";
import { Composition } from "remotion";
import { VIDEO, VIDEO_VERTICAL, BRAND_COPY } from "./lib/brand";
import { EatoBioticsBrandIntro } from "./compositions/EatoBioticsBrandIntro";
import { AssessmentResultVideo } from "./compositions/AssessmentResultVideo";
import { MealScoreSocialVideo } from "./compositions/MealScoreSocialVideo";

/**
 * EatoBiotics video engine — composition registry.
 *
 * Strategy: Brand → Assessment → Meal → Score → Share → Membership.
 * - EatoBioticsBrandIntro: the polished master brand asset (8s, landscape).
 * - AssessmentResultVideo: data-driven post-assessment result (landscape).
 * - MealScoreSocialVideo: data-driven vertical social meal-score (9:16).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EatoBioticsBrandIntro"
        component={EatoBioticsBrandIntro}
        durationInFrames={240}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          wordmark: BRAND_COPY.name,
          tagline: BRAND_COPY.tagline,
        }}
      />

      <Composition
        id="AssessmentResultVideo"
        component={AssessmentResultVideo}
        durationInFrames={390}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          name: undefined,
          score: 72,
          max: 100,
          summary:
            "Your internal food system shows strong foundations, with opportunities to improve stability, diversity, and daily rhythm.",
          pillars: ["Stability", "Diversity", "Rhythm", "Energy"],
          cta: "Understand your Food System Inside You",
        }}
      />

      <Composition
        id="MealScoreSocialVideo"
        component={MealScoreSocialVideo}
        durationInFrames={330}
        fps={VIDEO_VERTICAL.fps}
        width={VIDEO_VERTICAL.width}
        height={VIDEO_VERTICAL.height}
        defaultProps={{
          score: 81,
          max: 100,
          mealImage: undefined,
          title: "Meal Score",
          labels: [
            "Prebiotic base",
            "Protein support",
            "Fermented boost",
            "Colour diversity",
            "Stability impact",
          ],
        }}
      />
    </>
  );
};
