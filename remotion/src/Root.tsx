import "./index.css";
import { Composition } from "remotion";
import { VIDEO, VIDEO_VERTICAL, BRAND_COPY } from "./lib/brand";
import { EatoBioticsBrandIntro } from "./compositions/EatoBioticsBrandIntro";
import { TheFoodSystemInsideYouHero } from "./compositions/TheFoodSystemInsideYouHero";
import { FoodSystemHeroLoop } from "./compositions/FoodSystemHeroLoop";
import { DigitalTwinHeroLoop } from "./compositions/DigitalTwinHeroLoop";
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
        id="TheFoodSystemInsideYouHero"
        component={TheFoodSystemInsideYouHero}
        durationInFrames={360}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          heroImage: "assets/food-system-inside-you.png",
          wordmark: BRAND_COPY.name,
          tagline: BRAND_COPY.tagline,
          subline: "Understand your internal food system.",
          score: 86,
          showScoreRing: true,
        }}
      />

      {/* Square, text-free looping variant — rendered to mp4/webm for the
          website hero slots (homepage + waitlist). */}
      <Composition
        id="FoodSystemHeroLoop"
        component={FoodSystemHeroLoop}
        durationInFrames={240}
        fps={VIDEO.fps}
        width={1080}
        height={1080}
        defaultProps={{
          heroImage: "assets/food-system-inside-you.png",
        }}
      />

      {/* Account "Your Digital Twin" hero — landscape 3:2, subtle loop over the
          already-rich male/female artwork. Rendered to mp4/webm for /account. */}
      <Composition
        id="DigitalTwinHeroLoop"
        component={DigitalTwinHeroLoop}
        durationInFrames={240}
        fps={VIDEO.fps}
        width={1440}
        height={960}
        defaultProps={{
          heroImage: "assets/twin-male.png",
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
