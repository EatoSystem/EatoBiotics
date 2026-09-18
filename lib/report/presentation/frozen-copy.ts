/**
 * Presentation copy, frozen per content-pack version — Phase 4B-S2.
 *
 * ══ WHY THIS EXISTS ═════════════════════════════════════════════════════════
 *
 * A canonical Report is immutable and records `provenance.contentPackVersion`,
 * because customer-visible wording is reviewed content and reviewed content is
 * versioned. Almost every string a customer reads is carried in the Report's
 * own bytes, so it is version-bound by construction — reopening a Report shows
 * the words that were composed into it, whatever the live pack says today.
 *
 * A SMALL NUMBER are not, and each one is here because the canonical document
 * structurally cannot carry it: the document has no title of its own, the
 * `thirtyDayLoop` is an array rather than a `ReportSection` so it carries no
 * heading, and `LoopStep.week` is a number rather than a phrase. Three strings,
 * and the bar for a fourth is that same structural impossibility — not
 * convenience, and not "the renderer needed a word".
 *
 * The loop heading is the one that taught the lesson.
 * The first version of this layer invented a heading. The second read
 * `STRUCTURAL_COPY` from the live content pack — which looks like the fix, and
 * is a different bug wearing its clothes:
 *
 *     Report A purchased under content-pack-v1, heading "Your next 30 days"
 *       … CONTENT_PACK_VERSION later becomes v2 and the heading changes …
 *     Report A reopened → the v2 heading, wrapped around immutable v1 bytes
 *
 * The artifact has not changed. The paid document the customer sees has. That
 * is exactly the drift Phase 4A-S4 was built to prevent: its historical reader
 * refuses to consult live modules and binds to frozen contracts keyed by the
 * Report's own recorded versions. This registry is the same idea for the one
 * string the Report cannot carry itself.
 *
 * Not hypothetical, either: the `constraints-known` acknowledgement repair
 * recorded in CLAUDE.md is expected to bump `CONTENT_PACK_VERSION` before
 * activation, so v2 is already on the roadmap.
 *
 * ══ WHY THE STRINGS ARE TRANSCRIBED AND NOT IMPORTED ════════════════════════
 *
 * Because a module that imports the live pack cannot be frozen, however
 * carefully it is written — the next person to edit `STRUCTURAL_COPY` would
 * move every historical Report with it, and nothing here would notice.
 *
 * The duplication is the mechanism, not an oversight. Two things keep it
 * honest: a guard asserts that no file in this directory imports the content
 * pack at all, and a tripwire asserts that while `CONTENT_PACK_VERSION` is
 * still `content-pack-v1` the frozen v1 wording matches the live wording — so a
 * mis-transcription fails now, and that check retires itself the moment v2
 * lands rather than failing for the wrong reason.
 *
 * ══ THE RULE FOR ADDING TO THIS FILE ════════════════════════════════════════
 *
 * A new content-pack version gets a NEW ENTRY. Historical entries are never
 * edited — editing one rewrites documents people have already paid for and
 * read. Any future presentation-supplied string joins this registry rather than
 * being written inline somewhere.
 *
 * ══ WHICH SIDE OF THE LINE v1 IS ON, TODAY ══════════════════════════════════
 *
 * "Historical entries are never edited" binds from the moment a Report exists
 * under that version. Right now ZERO Reports exist: Migrations 48, 49 and 50
 * are drafted and unapplied, there is no customer-facing Report route, and
 * nothing calls `ensurePersistedConsultationReport`. So v1's snapshot is still
 * being AUTHORED, and adding a string to it rewrites nothing.
 *
 * It seals at activation, which CLAUDE.md's activation prerequisites already
 * gate. After that point this entry is a historical record of what people were
 * shown, and the only correct way to change any word in it is a new version.
 *
 * The distinction is written down because the next person wanting to add a
 * string here will need to know which side of that line they are standing on,
 * and the file gives no other way to tell.
 */

export interface FrozenPresentationCopy {
  /**
   * The document's own title, and the page's single `h1`.
   *
   * The canonical Report carries no title: it has a `foundation`, sections with
   * their own headings, and nothing that names the document. A rendered page
   * needs one heading at the top, so this is presentation copy — and because it
   * is the first thing a customer reads on something they paid €49 for, it is
   * reviewed copy, not a renderer's choice of words.
   *
   * Transcribed from `PERSONAL_REPORT` in `lib/product-vocabulary.ts`, which is
   * the authority for product names. Transcribed rather than imported for the
   * same reason as everything else here: an import moves historical documents
   * when the source moves. A tripwire asserts the two match while v1 is current.
   */
  readonly documentTitle: string

  /**
   * The heading above the four-week loop.
   *
   * Transcribed from `STRUCTURAL_COPY.thirtyDayLoopTitle` as it stood at
   * `content-pack-v1`. Do not change this value; add a version instead.
   */
  readonly thirtyDayLoopTitle: string

  /**
   * The word before a loop step's week number.
   *
   * `LoopStep.week` is the NUMBER `1`. "Week" is a word a customer reads, so it
   * cannot be assembled in JSX — that would make the renderer an author. The
   * model composes the finished label from this string and the canonical
   * number, and the renderer prints it.
   *
   * The four beats — Try, Notice, Adjust, Repeat — are deliberately NOT here.
   * The composer writes the matching beat into every step, so the Report
   * carries them, and a second copy would be a second place the same four words
   * live and a second place they can disagree.
   */
  readonly weekLabel: string
}

/**
 * Every entry is frozen ON THE WAY IN.
 *
 * `readonly` and `const` are erased at runtime, so the first version of this
 * file handed callers the registry's own mutable object — one
 * `(copy as any).thirtyDayLoopTitle = "..."` anywhere in the process and every
 * subsequent v1 Report rendered different wording. The exact guarantee this
 * module exists to provide, defeated from inside instead of by a version bump.
 *
 * This codebase has already been bitten one level down:
 * `narrative/internal/committed-packs.ts` records that "the array and the pack
 * were already frozen; each VARIANT was not, so a populated pack would have
 * shipped mutable `narrativeText`". Its fix is the shape copied here — entries
 * pass through a freeze on the way in, so a later addition "does not have to
 * remember".
 *
 * That is the part that matters. Freezing today's single entry inline would
 * work today; the risk is the NEXT entry. `content-pack-v2` is already on the
 * roadmap, and it cannot be added unfrozen through this door.
 *
 * `Object.freeze` is shallow, which is a complete freeze only while every value
 * is a primitive. A test asserts exactly that, so the day somebody adds a
 * nested field the assumption fails loudly rather than leaving a mutable object
 * sitting behind a frozen wrapper.
 */
function freezeEntries(
  raw: Record<string, FrozenPresentationCopy>,
): Readonly<Record<string, FrozenPresentationCopy>> {
  for (const copy of Object.values(raw)) Object.freeze(copy)
  return Object.freeze(raw)
}

const PRESENTATION_COPY_BY_CONTENT_PACK_VERSION = freezeEntries({
  "content-pack-v1": {
    documentTitle: "Personal Food System Report",
    thirtyDayLoopTitle: "Your next 30 days",
    weekLabel: "Week",
  },
})

/**
 * The reviewed presentation copy for one recorded content-pack version.
 *
 * `undefined` for a version this build does not know, exactly as
 * `v1QuestionAuthorityFor` does in the persisted wire. The caller fails closed
 * on that — falling back to the newest entry would reintroduce the whole
 * problem, quietly, for the Reports least able to survive it.
 */
export function presentationCopyFor(
  contentPackVersion: string,
): FrozenPresentationCopy | undefined {
  return PRESENTATION_COPY_BY_CONTENT_PACK_VERSION[contentPackVersion]
}

/**
 * Whether the registry CONTAINER is frozen.
 *
 * A boolean, deliberately, and not the registry itself. `committed-packs.ts`
 * exports its freeze helper "INTERNALLY ... only so a guard can prove the
 * per-variant freeze", and the same need applies here — but exporting the
 * container so a test can try to mutate it would hand production code the exact
 * handle this module exists to withhold. A guard can prove the property without
 * being given the thing.
 */
export function registryIsFrozen(): boolean {
  return Object.isFrozen(PRESENTATION_COPY_BY_CONTENT_PACK_VERSION)
}

/** The versions this build can present. Exposed for tests and for audit. */
export function knownContentPackVersions(): readonly string[] {
  return Object.keys(PRESENTATION_COPY_BY_CONTENT_PACK_VERSION)
}
