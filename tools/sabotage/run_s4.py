import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run as driver
from run_s3 import run_new_page
from cases_s4 import CASES, NEW_VARIANT


def main():
    outcomes = [driver.run(c) for c in CASES]
    names = [c[0] for c in CASES]
    outcomes.append(run_new_page(NEW_VARIANT))
    names.append(NEW_VARIANT[0])
    slipped = [n for n, o in zip(names, outcomes) if o != "caught"]
    print(f"\n{len(names) - len(slipped)}/{len(names)} caught")
    if slipped:
        print("SLIPPED/BROKEN:", slipped)
        sys.exit(1)


if __name__ == "__main__":
    main()
