# The EatoBiotics Experience Constitution

> How the product behaves toward the person using it.

**Scope.** This document holds **product-experience** principles: truthfulness,
hierarchy, complexity, personalisation boundaries, refusal behaviour,
persistence, navigation promises, evidence and reachability, and the relation
between product architecture and interface behaviour.

It is **not** the visual system. Typography, colour, spacing, surfaces, motion
and illustration live in
[DESIGN_CONSTITUTION.md](../masterplan/DESIGN_CONSTITUTION.md) and
[MOTION_CONSTITUTION.md](../masterplan/MOTION_CONSTITUTION.md). Neither document
restates the other. Where a question is "how should this look", it belongs
there. Where it is "what may this say, and what must it do when it cannot say
it", it belongs here.

**Status: a living canonical document during Experience 0.** It is seeded only
with principles explicitly accepted as durable programme rules.

> **An audit hypothesis does not become constitutional because an agent
> discovered it.** Findings, evidence, screenshots and remediation detail stay
> in `EATOBIOTICS_SCIENTIFIC_UI_DEBT.md` and the per-surface audits. This file
> is not a dump of those.

---

## 1 · Truthfulness

**Do not make the interface promise a personal conclusion that the instrument
did not collect enough information to derive.**

The question is not whether a sentence is defensible in general. It is whether
*this* product, from *this* input, about *this* person, is entitled to say it.
A questionnaire and a meal photo are what the instrument collects; the
conclusion must not exceed them.

Two corollaries the programme has paid for:

- **Describe the input you actually have.** Averaged meals and assessment
  answers are different inputs and are not interchangeable, even where they
  produce similar-looking numbers.
- **A correction is never a deletion.** Teaching the biology accurately is an
  obligation, not a concession; what is removed is the claim that the biology
  was personally measured, never the education itself.

### Absence of member data must remain absence.

Adopted at the 0R-4 close.

**The product may explain an empty state. It may never populate one with
synthetic personal history.**

An empty state is a true statement about a person: nothing has been logged, no
report exists yet, this is the first day. Filling it with plausible content
replaces a true statement with a false one, in the one place the person has no
way to check — their own record.

The corollary is what makes it operational, and it closes the obvious wrong fix:

> Do not substitute demo data, sample data, more realistic fixtures, placeholder
> history or inferred values. Zero meals render as zero meals, missing history as
> missing history, zero reports as zero reports. **Counts and averages derive
> only from real member data, and read as absent when there is none.**

It earned constitutional status across **six** surfaces rather than one card —
meals, averages, weekly history, report counts, attributed quotations and
consultations — every one of them a fallback that looked like care and behaved
like fabrication. The code knew: `const isMock = todayMeals.length === 0`, under
a comment reading *"Real today's meals — or mock fallback"*.

> **A fallback is a design decision about what to say when you know nothing.**
> The honest answer is usually to say that.

*Evidence: `P0-TRUST-01` and `P0-TRUST-02` in
[`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md);
enforced by `tests/unit/live-dashboard-fabrication.test.ts`.*

## 2 · Personalisation boundaries

**A claim is still a claim when it is encoded through colour, motion, anatomy,
position, scale or another visual state rather than words.**

A boundary is therefore about **what is rendered**, not about which words are
used. If a member's own state may not be stated, it may not be shown either —
not as a number, not as a bar, not as a band word, not as a superlative, not as
a possessive, not as a mechanism, and not as a colour, a light, a position on a
body or a movement.

This is the form the boundary keeps returning in: each repair closes the form it
found, and the next implementation reaches for a form nobody enumerated.

It also sets a requirement on how claims are guarded. **A string scanner cannot
see a claim that has no string**, so a corpus of text rules is necessary and not
sufficient; where a prohibited conclusion can reach a visual parameter, the
guard belongs at that parameter.

*Evidence: `P0-SCIENCE-04` and `P0-SCIENCE-05` in
[`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md).*

### Real data does not legitimise an invalid construct.

Adopted at the 0R-5 close.

**Truthful inputs can still produce an untruthful product claim.**

> The validity of a personal conclusion depends on the inference and claim being
> justified — not merely on the underlying data being real.

This is the half of the boundary that the trust work cannot reach. 0R-4
established that synthetic data must never masquerade as member data, and every
construct 0R-5 removed was built from genuine numbers — which is precisely why
0R-4's guards passed all of it. Provenance is not permission:

- real meal data did not make personal Prebiotic / Probiotic / Postbiotic bars
  valid, at any of the **seven** live sites that rendered them;
- a genuine `probiotic_score` did not legitimise a *"Probiotic network"* row, or
  a biological band word derived from that score;
- a real self-report did not establish a measured anatomical response.

#### The consequence for how a repair is scoped

**Repair the construct, not the sentence.** An unsupported inference does not
live in its wording; the wording is one of its outputs.

`lib/account/meal-impact.ts` expressed a single inference through a chain —
score → Biotic label → band word → mechanism → fermented-implies-probiotic →
asserted body effect. Removing only the `effect` string would have left the
model that produced it intact, and the next renderer would have found it again.
`P0-SCIENCE-04` is the same point structurally rather than textually: the stage
aura now accepts a static palette tone, so the **capability** to encode a
personal Biotic verdict as colour is gone, not merely the mapping that did.

A repair is complete when the product can no longer form the claim — not when it
has stopped saying it.

*Evidence: the 0R-5 site-level close record in
[`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md).*

## 3 · Voice and authorship

**The product must never place a product-authored personal conclusion into the
user's mouth.**

Where the product suggests a question, a message or a phrasing on the person's
behalf, two things must hold. It must remain visibly product-authored rather
than appearing to be something the person said. And it must carry no personal
premise that deterministic product state cannot support — a suggestion is not a
weaker place to make a claim, it is a place where the claim arrives unattributed.

The danger is specific and compounding: a product-authored premise that becomes
an input to a model returns as generated prose that reads as a response to the
person. The claim is then laundered through their own voice, and nothing
downstream can tell that the product, not the person, asserted it.

### Prefill is not authorship. Submission is authorship.

Adopted at the 0R-3 close, and general well beyond the route that produced it.

A suggestion the product writes into an input box is a **draft**. It becomes the
person's own statement at one moment and one moment only: when they
deliberately submit it. Authorship is created by that act — it is **not**
inherited from the text already sitting in the field, however it got there.

Three consequences, which are where this stops being a slogan:

1. **A URL, a stored value or a suggestion may prefill. It may not send.**
   Arriving on a page is not a person asking a question.
2. **The distinction belongs in the construction path, not in a label.** Make a
   product-authored string structurally unable to become a user message, rather
   than tagging it and trusting every downstream reader to check the tag. The
   same reasoning as the Gate 6 ceiling: the mistake should be unavailable, not
   refused.
3. **Prefill reduces the harm of an asserting suggestion; it does not cure it.**
   A draft that reads *"I have IBS"* is still the product proposing that the
   person assert it. There is no prefill exemption from the rule above.

Deterministic product fact is a **third** thing again, and stays on its own
channel: passed as context to support an answer, never concatenated into the
person's authored text to get it there.

*Evidence: `P0-TRUST-05` in
[`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md);
enforced by `tests/unit/ai-authorship.test.ts`.*

## 4 · The money path

**A paid surface must meet at least the same truth and claims standard as the
free product around it. Payment must never relax the evidence boundary.**

Compactly: **the money path gets stricter, not looser.**

The pressure runs the other way by default. A paid document is expected to feel
worth paying for, and the cheapest way to make it feel that way is to say more
than the instrument supports — so the surface under the most commercial pressure
to overclaim is also the one where overclaiming does the most damage.

A free surface that overclaims is a product defect. A paid surface that
overclaims is a product defect the person was charged for.

*Evidence: `P0-SCIENCE-06` in
[`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md).*

## 5 · Complexity

**Complexity should be absorbed by architecture before it is displayed by the
interface.**

The goal is not sparseness. It is richness without speculation: a surface may be
dense with things the product genuinely knows, and must not be dense with things
it is guessing.

## 6 · Refusal

**Refusal is a designed outcome, not an error state.** A product that declines
to compare, declines to rank or declines to interpret is working, and the
interface should look like it is working.

**A correctly refused destination must not be presented as an available
action.** The classifier protects the destination; something must protect the
promise. An honest refusal behind a link the product still offers is a worse
experience than either an honest refusal or no link.

## 7 · Persistence

The product a person returns to is the thing the journey should establish. A
journey that terminates in a page the person reads once has not established
anything, however good the page is.

Where an experience cannot establish persistence because the instrument does not
gather what persistence is made of, that is an **instrument** finding, and
naming it as an interface finding hides it.

## 8 · Evidence

**Source inspection establishes possibility. Rendered evidence establishes
reachability.**

A claim about what a surface does is not settled by reading the component. It is
settled by rendering it and looking. This standard applies to the product's
claims about itself — docblocks, comments and design documents describing a past
fix are not evidence of a present state.

## 9 · Architecture and interface

**Bring Generation 1's visual ambition to Generation 4's truthfulness.** Do not
bring Generation 1's product model with it, and do not flatten Generation 4 into
visual minimalism for its own sake.

A newer generation must not inherit an older generation's capabilities
accidentally, through component reuse. Where a component crosses a generation
boundary, what it is structurally unable to do is worth more than what it
currently declines to do.

---

*Visual design has its own constitution:
[DESIGN_CONSTITUTION.md](../masterplan/DESIGN_CONSTITUTION.md). Motion has its
own: [MOTION_CONSTITUTION.md](../masterplan/MOTION_CONSTITUTION.md). Which
document owns which topic:
[DOCUMENTATION_MAP.md](./DOCUMENTATION_MAP.md).*
