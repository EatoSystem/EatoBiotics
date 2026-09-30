#!/usr/bin/env python3
"""
Differential sabotage — does the suite actually catch the thing it claims to?

A guard that passes proves nothing on its own: it may be asserting something
trivially true, matching its own explanatory comment, or scanning an empty file
list. So each case breaks exactly one property in the source, asserts the
mutation LANDED (by sha256, not by hope), runs the named tests, and requires
them to FAIL. Then it restores the file and verifies the restore is
byte-identical.

A case that does not make the suite red is a case whose guard is decorative —
and the standing rule is that when a case slips, the TEST gets stronger, never
the case, unless the case was aimed at the wrong thing.

Usage:  python3 run.py [first] [last]
"""
import hashlib
import subprocess
import sys
from pathlib import Path

# The repository root, derived from this file's location: tools/sabotage/run.py.
# This was a hardcoded absolute container path while the harness lived in a
# session scratchpad. It is in the repository now, so it has to work from any
# checkout.
REPO = Path(__file__).resolve().parent.parent.parent


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def collectable(tests) -> bool:
    """
    Can vitest actually collect these files?

    vitest.config.ts includes only `tests/**/*.test.ts`. Pointed at anything
    else — a Playwright `.spec.ts`, a renamed file, a typo — vitest reports "no
    test files found" and exits NON-ZERO, which this harness reads as "caught".
    Such a case reports caught for every mutation and for no mutation, which is
    the precise failure the harness exists to detect, occurring inside the
    harness itself. Case 945 did this for its entire life.

    A rendered property cannot be covered here at all: Playwright serves a
    prebuilt .next that a source mutation never reaches. Those belong in the
    Playwright suite, and this check makes trying to smuggle one in loud.
    """
    return all(str(t).startswith("tests/") and str(t).endswith(".test.ts") for t in tests)


def run(case):
    number, name, rel, find, repl, tests = case
    path = REPO / rel

    if not tests or not collectable(tests):
        print(f"  {number}  UNRUNNABLE  tests vitest cannot collect: {tests}")
        return "unrunnable"

    original = path.read_bytes()
    before = sha(path)

    source = original.decode("utf8")
    if find not in source:
        print(f"  {number}  ANCHOR MISSING in {rel}: {find[:70]!r}")
        return "anchor"

    # count=1: a byte-identical anchor in two places would otherwise sabotage
    # whichever one comes first, which is how case 287 passed while testing
    # nothing.
    path.write_text(source.replace(find, repl, 1), encoding="utf8")
    if sha(path) == before:
        path.write_bytes(original)
        print(f"  {number}  MUTATION DID NOT LAND in {rel}")
        return "no-op"

    try:
        result = subprocess.run(
            ["npx", "vitest", "run", *tests],
            cwd=REPO,
            capture_output=True,
            text=True,
            timeout=900,
        )
        caught = result.returncode != 0
    finally:
        path.write_bytes(original)
        assert sha(path) == before, f"restore of {rel} was not byte-identical"

    print(f"  {number}  {'caught ' if caught else 'SLIPPED'}  {name}")
    return "caught" if caught else "slipped"


def main():
    from cases import CASES

    first = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    last = int(sys.argv[2]) if len(sys.argv) > 2 else 10**9
    selected = [c for c in CASES if first <= c[0] <= last]

    outcomes = [run(c) for c in selected]
    slipped = [c[0] for c, o in zip(selected, outcomes) if o != "caught"]
    print(f"\n{len(selected) - len(slipped)}/{len(selected)} caught")
    if slipped:
        print(f"SLIPPED/BROKEN: {slipped}")
        sys.exit(1)


if __name__ == "__main__":
    main()
