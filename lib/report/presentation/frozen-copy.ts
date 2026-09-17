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
 * ONE string is not. `thirtyDayLoop` is an array rather than a `ReportSection`,
 * so it carries no title of its own and the presentation layer must supply one.
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
 */

export interface FrozenPresentationCopy {
  /**
   * The heading above the four-week loop.
   *
   * Transcribed from `STRUCTURAL_COPY.thirtyDayLoopTitle` as it stood at
   * `content-pack-v1`. Do not change this value; add a version instead.
   */
  readonly thirtyDayLoopTitle: string
}

const PRESENTATION_COPY_BY_CONTENT_PACK_VERSION: Readonly<
  Record<string, FrozenPresentationCopy>
> = {
  "content-pack-v1": {
    thirtyDayLoopTitle: "Your next 30 days",
  },
}

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

/** The versions this build can present. Exposed for tests and for audit. */
export function knownContentPackVersions(): readonly string[] {
  return Object.keys(PRESENTATION_COPY_BY_CONTENT_PACK_VERSION)
}
