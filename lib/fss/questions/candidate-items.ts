import type { OwnedItem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   The items questions-v1.0 owns outright.

   EVERY ONE IS A DRAFT PENDING SCIENTIFIC SIGN-OFF, and each carries
   `status: "draft-pending-review"` so that status travels with the item into
   the resolved artefact rather than living in a comment nobody reads.

   Drafted in docs/fss/FSS_V1_DESIGN_SPEC.md §5.2. Same four-option, 0–3 shape
   and the same voice as the frozen instrument, so a person cannot tell which
   items are new — the seam is in the data, not in the experience.
   ════════════════════════════════════════════════════════════════════════ */

/* ── Food Quality ─────────────────────────────────────────────────────────
   q5 alone measured processing exposure, and a scored domain resting on one
   item is fragile. These two are why D4 is not a one-question domain. */

const FOOD_QUALITY: OwnedItem[] = [
  {
    kind: "owned",
    id: "fq2",
    part: "what-you-eat",
    sectionTitle: "Food Quality",
    text: "In a typical week, how much of what you eat is prepared from whole ingredients rather than ready-made?",
    options: [
      { value: 0, label: "Mostly ready-made", description: "Packaged meals, takeaways or prepared food most days." },
      { value: 1, label: "A mix, leaning ready-made", description: "Some cooking from scratch, but convenience carries most of the week." },
      { value: 2, label: "A mix, leaning home-prepared", description: "Most meals start from ingredients, with convenience filling the gaps." },
      { value: 3, label: "Almost entirely from whole ingredients", description: "Ready-made food is the exception rather than the routine." },
    ],
    contributes: "fss",
    domain: "foodQuality",
    status: "draft-pending-review",
  },
  {
    kind: "owned",
    id: "fq3",
    part: "what-you-eat",
    sectionTitle: "Food Quality",
    text: "How often do sweetened drinks, confectionery or packaged snacks feature in your day?",
    options: [
      { value: 0, label: "Several times a day", description: "They are part of the ordinary rhythm of the day." },
      { value: 1, label: "Most days", description: "Usually once a day, without it being a decision." },
      { value: 2, label: "A few times a week", description: "Present, but not daily." },
      { value: 3, label: "Rarely", description: "Occasional rather than routine." },
    ],
    contributes: "fss",
    domain: "foodQuality",
    status: "draft-pending-review",
  },
]

/* ── Meal Rhythm ──────────────────────────────────────────────────────────
   q10–q12 cover timing and regularity but nothing about what a meal is made
   of. Marked optional in the design spec; carried here as a full item so the
   reviewer can accept or reject it on its wording rather than on its absence. */

const MEAL_RHYTHM: OwnedItem[] = [
  {
    kind: "owned",
    id: "mr4",
    part: "how-you-eat",
    sectionTitle: "Meal Rhythm",
    text: "How often does a typical main meal include vegetables, a protein source and a whole-food carbohydrate together?",
    options: [
      { value: 0, label: "Rarely", description: "Main meals tend to be built around one or two of the three." },
      { value: 1, label: "Sometimes", description: "It happens, without being the usual shape of a meal." },
      { value: 2, label: "Most meals", description: "The three tend to arrive together more often than not." },
      { value: 3, label: "Nearly always", description: "It is the ordinary shape of a main meal." },
    ],
    contributes: "fss",
    domain: "mealRhythm",
    status: "draft-pending-review",
  },
]

/* ── Your Food Context ────────────────────────────────────────────────────

   UNSCORED, and the reason is a rule rather than a preference: a factor a
   person cannot readily change must never depress their Score. Scoring these
   would score somebody's income, their shift pattern or where they live.

   THE TONE IS THE SPECIFICATION HERE. Each asks about a CIRCUMSTANCE, not a
   choice, and none implies fault:

     "How much time and energy do you usually have"  not  "do you make time"
     "How easy is it to get fresh food where you live" not "do you buy fresh food"

   The 0–3 values exist only so the answers have a consistent shape to store
   and to read back. They are NOT a scale of better and worse, nothing sums
   them, and the engine refuses to read a `food-context` item at all.
   ──────────────────────────────────────────────────────────────────────── */

const FOOD_CONTEXT: OwnedItem[] = [
  {
    kind: "owned",
    id: "fc1",
    part: "your-food-context",
    sectionTitle: "Your Food Context",
    text: "On a typical weekday, how much time and energy do you usually have for preparing food?",
    options: [
      { value: 0, label: "Very little", description: "Weekdays leave almost nothing for cooking." },
      { value: 1, label: "Some, on a good day", description: "It depends how the day has gone." },
      { value: 2, label: "Usually enough", description: "Most weekdays allow for something prepared." },
      { value: 3, label: "Plenty", description: "Time to cook is not the constraint." },
    ],
    contributes: "food-context",
    status: "draft-pending-review",
  },
  {
    kind: "owned",
    id: "fc2",
    part: "your-food-context",
    sectionTitle: "Your Food Context",
    text: "How affordable is the food you would like to be eating?",
    options: [
      { value: 0, label: "A real constraint", description: "Cost decides most of what ends up in the basket." },
      { value: 1, label: "Often a constraint", description: "Cost shapes the choice more often than not." },
      { value: 2, label: "Sometimes a constraint", description: "It comes into the decision, without deciding it." },
      { value: 3, label: "Not a constraint", description: "Cost is not what shapes what you eat." },
    ],
    contributes: "food-context",
    status: "draft-pending-review",
  },
  {
    kind: "owned",
    id: "fc3",
    part: "your-food-context",
    sectionTitle: "Your Food Context",
    text: "How easy is it to get fresh food where you live?",
    options: [
      { value: 0, label: "Difficult", description: "Fresh food means a special trip, or it is not really available." },
      { value: 1, label: "Possible with effort", description: "It can be done, but it takes planning." },
      { value: 2, label: "Fairly easy", description: "Fresh food is within reach most weeks." },
      { value: 3, label: "Easy", description: "Good fresh food is close by and routine to get." },
    ],
    contributes: "food-context",
    status: "draft-pending-review",
  },
  {
    kind: "owned",
    id: "fc4",
    part: "your-food-context",
    sectionTitle: "Your Food Context",
    text: "How well do your kitchen and your confidence in it suit the way you would like to cook?",
    options: [
      { value: 0, label: "Not well", description: "Equipment, space or confidence gets in the way." },
      { value: 1, label: "Somewhat", description: "Simple things are fine; anything more is a stretch." },
      { value: 2, label: "Mostly well", description: "Most of what you would want to cook is within reach." },
      { value: 3, label: "Very well", description: "Neither the kitchen nor the confidence is a limit." },
    ],
    contributes: "food-context",
    status: "draft-pending-review",
  },
]

/** Every item this version owns. Drafts, all of them. */
export const CANDIDATE_ITEMS: readonly OwnedItem[] = [
  ...FOOD_QUALITY,
  ...MEAL_RHYTHM,
  ...FOOD_CONTEXT,
]
