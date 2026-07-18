/** Maps a screen slug → its mock component. Concept-only. */
import type { ScreenSlug } from "../theme"
import { HomeScreen } from "./HomeScreen"
import { RitualScreen } from "./RitualScreen"
import { MealScreen } from "./MealScreen"
import { ScoresScreen } from "./ScoresScreen"

export const SCREEN_COMPONENTS: Record<ScreenSlug, () => React.JSX.Element> = {
  "app-home": HomeScreen,
  "app-ritual": RitualScreen,
  "app-meal": MealScreen,
  "app-scores": ScoresScreen,
}
