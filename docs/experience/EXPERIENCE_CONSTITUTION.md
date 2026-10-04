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

## 2 · Personalisation boundaries

A boundary is about **what is rendered**, not about which words are used.

If a member's own state may not be stated, it may not be shown either — not as
a number, not as a bar, not as a band word, not as a superlative, not as a
possessive, not as a mechanism, **and not as a colour, a position on a body, a
light, or a motion.** A visual encoding of a prohibited claim is the prohibited
claim.

This is the form the boundary keeps returning in: each repair closes the form it
found, and the next implementation reaches for a form nobody enumerated.

## 3 · Complexity

**Complexity should be absorbed by architecture before it is displayed by the
interface.**

The goal is not sparseness. It is richness without speculation: a surface may be
dense with things the product genuinely knows, and must not be dense with things
it is guessing.

## 4 · Refusal

**Refusal is a designed outcome, not an error state.** A product that declines
to compare, declines to rank or declines to interpret is working, and the
interface should look like it is working.

**A correctly refused destination must not be presented as an available
action.** The classifier protects the destination; something must protect the
promise. An honest refusal behind a link the product still offers is a worse
experience than either an honest refusal or no link.

## 5 · Persistence

The product a person returns to is the thing the journey should establish. A
journey that terminates in a page the person reads once has not established
anything, however good the page is.

Where an experience cannot establish persistence because the instrument does not
gather what persistence is made of, that is an **instrument** finding, and
naming it as an interface finding hides it.

## 6 · Evidence

**Source inspection establishes possibility. Rendered evidence establishes
reachability.**

A claim about what a surface does is not settled by reading the component. It is
settled by rendering it and looking. This standard applies to the product's
claims about itself — docblocks, comments and design documents describing a past
fix are not evidence of a present state.

## 7 · Architecture and interface

**Bring Generation 1's visual ambition to Generation 4's truthfulness.** Do not
bring Generation 1's product model with it, and do not flatten Generation 4 into
visual minimalism for its own sake.

A newer generation must not inherit an older generation's capabilities
accidentally, through component reuse. Where a component crosses a generation
boundary, what it is structurally unable to do is worth more than what it
currently declines to do.

---

*Visual design has its own constitution:
[DESIGN_CONSTITUTION.md](../masterplan/DESIGN_CONSTITUTION.md).*
