import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run as driver
from cases_s3 import CASES, NEW_PAGE

REPO = Path(__file__).resolve().parent.parent.parent


def run_new_page(case):
    """Create a page nobody has classified; the exhaustiveness guard must fail."""
    number, name, rel, body, tests = case
    path = REPO / rel
    assert not path.exists(), f"{rel} already exists — pick another name"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf8")
    try:
        result = subprocess.run(
            ["npx", "vitest", "run", *tests],
            cwd=REPO, capture_output=True, text=True, timeout=900,
        )
        caught = result.returncode != 0
    finally:
        path.unlink(missing_ok=True)
        try:
            path.parent.rmdir()
        except OSError:
            pass
        assert not path.exists(), f"{rel} was not removed"
    print(f"  {number}  {'caught ' if caught else 'SLIPPED'}  {name}")
    return "caught" if caught else "slipped"


def main():
    outcomes = [driver.run(c) for c in CASES]
    names = [c[0] for c in CASES]
    outcomes.append(run_new_page(NEW_PAGE))
    names.append(NEW_PAGE[0])
    slipped = [n for n, o in zip(names, outcomes) if o != "caught"]
    print(f"\n{len(names) - len(slipped)}/{len(names)} caught")
    if slipped:
        print("SLIPPED/BROKEN:", slipped)
        sys.exit(1)


if __name__ == "__main__":
    main()
