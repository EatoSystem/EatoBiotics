/** Maps a screen slug → its mock component. Concept-only. app-home renders the
    Today screen with the default (ring) visualisation; the /app-home page uses
    TodayShowcase for the ring/figure toggle. */
import type { ScreenSlug } from "../theme"
import { OnboardingScreen } from "./OnboardingScreen"
import { TodayScreen } from "./TodayScreen"
import { MealScreen } from "./MealScreen"
import { ScoresScreen } from "./ScoresScreen"

export const SCREEN_COMPONENTS: Record<ScreenSlug, () => React.JSX.Element> = {
  "app-onboarding": OnboardingScreen,
  "app-home": () => <TodayScreen viz="ring" />,
  "app-meal": MealScreen,
  "app-scores": ScoresScreen,
}
