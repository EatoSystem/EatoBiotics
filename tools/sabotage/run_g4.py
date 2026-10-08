import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import run as driver
from cases_g4 import CASES

def main():
    outcomes = [driver.run(c) for c in CASES]
    slipped = [c[0] for c, o in zip(CASES, outcomes) if o != "caught"]
    print(f"\n{len(CASES) - len(slipped)}/{len(CASES)} caught")
    if slipped:
        print("SLIPPED/BROKEN:", slipped)
        sys.exit(1)

if __name__ == "__main__":
    main()
