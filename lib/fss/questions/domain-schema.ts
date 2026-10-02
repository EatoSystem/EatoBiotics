import type { FssDomain } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   The domain schema — WHICH FIVE THINGS a score is composed of.

   ── Why this is a FOURTH anchor, and not any of the three that exist ──────

   `lib/fss/system/version.ts` lists three, and argues that conflating any two
   of them makes a historical decision unreadable:

     `ScoreProvenance`        HOW THE SCORE WAS CALCULATED
     `SYSTEM_MODEL_VERSION`   HOW THE DECISION WAS MADE
     `ACTION_SET_VERSION`     WHAT WORDING THE RECOMMENDATION HAD

   None of them answers "what are the parts?". A method version can stay still
   while the domain set is renamed, split or recomposed — `foodQuality`
   becoming `processing` and `sourcing`, say, or `mealRhythm` absorbing an item
   that used to score under `diversity`. The arithmetic is unchanged, the
   wording is unchanged, the policy is unchanged, and a per-domain comparison
   across that change is MEANINGLESS while looking perfectly well-formed.

   That is the specific failure this exists to refuse:

     > Do not assume that because the overall FSS is comparable, every nested
     > construct is automatically comparable.

   ── Why it is not a sixth `ScoreProvenance` field ─────────────────────────

   Because `ScoreProvenance` cannot grow. Its five keys are pinned BY VALUE
   (`tests/unit/fss-action-model.test.ts`), and `repository.ts` argues why:
   widening it would change what every score already written claims about
   itself. `ACTION_SET_VERSION` reached the same conclusion for the same
   reason, and so does this — it sits BESIDE provenance, on `StoredScore`.

   ── Why it lives here and not in `lib/fss/system/version.ts` ──────────────

   The domain set is a fact about the INSTRUMENT, not about the selection
   POLICY. `version.ts` owns the policy anchor and says in so many words that
   the coincidence of a filename is not an argument for what kind of thing a
   constant is. The parts a score is made of belong with the questions that
   feed them, so this module sits beside `FssDomain`'s own declaration and
   imports from it in one direction only.

   ── It is a candidate, like everything else in this layer ─────────────────

   No reviewer has approved the five domains. They are the first item on the
   "still visibly unresolved" list, and moving this version is how a future
   reviewer's decision becomes visible in records written before it.
   ════════════════════════════════════════════════════════════════════════ */

/** The composition of a Food System Score: which domains, under which names. */
export const DOMAIN_SCHEMA_VERSION = "domains-v1.0" as const

export type DomainSchemaVersion = typeof DOMAIN_SCHEMA_VERSION

/**
 * The five, as a value.
 *
 * `FssDomain` was a type and ONLY a type until now, which is why four test
 * files each carry their own hard-coded copy of these five strings. Nothing
 * could iterate the set, so nothing could notice it moving.
 */
export const FSS_DOMAINS = [
  "diversity",
  "plantsAndFibre",
  "fermentedFoods",
  "foodQuality",
  "mealRhythm",
] as const

type Listed = (typeof FSS_DOMAINS)[number]

/** Fails to instantiate unless `T` is exactly `true`. */
type Assert<T extends true> = T

/*
 * Both directions, named separately so the error says WHICH way it broke.
 * `[X] extends [never]` rather than `X extends never`, because the bare form
 * is the one that reads as satisfied when it is not.
 */
type NotListed = Exclude<FssDomain, Listed>
type NotInUnion = Exclude<Listed, FssDomain>

/**
 * THE BRIDGE BETWEEN THE TYPE AND THE VALUE.
 *
 * Add a sixth domain to the union and this fails to compile. Add it to
 * `FSS_DOMAINS` alone and this fails to compile. The union and the list move
 * together or the build stops — which is what makes `DOMAIN_SCHEMA_VERSION` a
 * statement about the real domain set rather than about a copy of it.
 *
 * `tsc` is not the whole guard, though: the sabotage harness runs vitest, and
 * a type widening is invisible to vitest. `tests/unit/fss-engine.test.ts`
 * therefore reads `types.ts` AS SOURCE and asserts set equality with this
 * list — the Gate 4 lesson, applied where it recurs.
 */
type _EveryDomainIsListed = Assert<[NotListed] extends [never] ? true : false>
type _EveryListedIsADomain = Assert<[NotInUnion] extends [never] ? true : false>

/* ── NO `isCurrentDomainSchema` HERE YET, AND THAT IS DELIBERATE ───────────
 *
 * The obvious companion to the three anchors above is a resolver, matching
 * `isCurrentSystemModel`. It is not here because nothing in this step needs
 * one, and `canCompareDomains` specifically must NOT use one: two scores from
 * a schema this code has never heard of still share a composition, so refusing
 * them for being unrecognised would refuse a sound comparison for a
 * presentation reason.
 *
 * The question a resolver answers — can today's reviewed copy NAME these
 * domains? — belongs to whatever renders a per-domain change, which does not
 * exist yet. `isMintedId` sat exported and uncalled through an entire gate
 * while the defect it was written for stayed live, so the resolver arrives
 * with its caller.
 * ─────────────────────────────────────────────────────────────────────────── */
