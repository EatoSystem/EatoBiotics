#!/usr/bin/env python3
"""Make the homepage illustration backgrounds transparent.

The hero / ecosystem / framework illustrations were exported as flat RGB images
whose background is a faintly blue-tinted off-white (~253,253,254) rather than
pure white or transparent. On the pure-white site this reads as an off-white
"box" around each figure, and it occludes the soft radial glow rendered behind
the hero images.

This script cuts the near-white background to transparency using a smooth alpha
ramp (so edges stay anti-aliased), preserving the figures and their own coloured
aura. It is re-runnable: pixels that are already transparent stay transparent,
and pixels that are already coloured are untouched.

Run from the repo root:  python3 scripts/whiten-illustrations.py
"""

from __future__ import annotations

import os
from collections import deque

from PIL import Image

# Most illustrations are figures / flat-lays with no large interior white
# regions, so a luminance ramp cleanly removes the background.
TARGETS = [
    "public/images/couple-hero.png",
    "public/images/assessment-hero.png",
    "public/images/hero-gut.png",
    "public/images/family-hero.png",
    "public/images/mind-hero.png",
    "public/images/stability-hero.png",
    "public/images/eatobetics-hero.webp",
    "public/images/eatosports-hero.webp",
    "public/prebiotics-1.png",
    "public/probiotics-1.png",
    "public/postbiotics-1.png",
]

# The plate is a white ceramic dish on an off-white background: a luminance cut
# would punch out the dish itself. Flood-fill from the edges instead so only the
# OUTER background is cleared and the dish (plus its drop-shadow) stays solid.
FLOODFILL_TARGETS = [
    "public/eatobiotics-plate.png",
]

# Alpha ramp tuning. A pixel counts as "background" when it is both bright
# (high luminance) and near-neutral (low chroma). Fully transparent at/above
# LUMA_CLEAR, fully opaque at/below LUMA_KEEP, linear in between. Pixels with
# meaningful colour (chroma > CHROMA_MAX) are always kept opaque so the figure's
# yellow/green aura survives.
LUMA_CLEAR = 250.0   # >= this brightness (and neutral) -> transparent
LUMA_KEEP = 234.0    # <= this brightness -> fully opaque
CHROMA_MAX = 18.0    # max(R,G,B)-min(R,G,B) above this -> always opaque (coloured)


def _is_background(r: int, g: int, b: int) -> bool:
    """True for bright, near-neutral pixels (the flat off-white background)."""
    if max(r, g, b) - min(r, g, b) > CHROMA_MAX:
        return False
    return (0.299 * r + 0.587 * g + 0.114 * b) >= LUMA_KEEP


def whiten_ramp(rgba: Image.Image) -> int:
    """Cut near-white pixels everywhere with a smooth alpha ramp."""
    px = rgba.load()
    w, h = rgba.size
    span = LUMA_CLEAR - LUMA_KEEP
    cleared = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue  # already transparent (re-run safety)
            if max(r, g, b) - min(r, g, b) > CHROMA_MAX:
                continue  # coloured pixel — part of the figure / aura
            luma = 0.299 * r + 0.587 * g + 0.114 * b  # Rec. 601
            if luma >= LUMA_CLEAR:
                new_a = 0
            elif luma <= LUMA_KEEP:
                new_a = a
            else:
                frac = (luma - LUMA_KEEP) / span  # brighter -> more transparent
                new_a = int(round(a * (1.0 - frac)))
            if new_a != a:
                px[x, y] = (r, g, b, new_a)
                if new_a == 0:
                    cleared += 1
    return cleared


def whiten_floodfill(rgba: Image.Image) -> int:
    """Clear only the outer background connected to the image border, so
    enclosed white regions (e.g. a ceramic plate) stay solid."""
    px = rgba.load()
    w, h = rgba.size
    visited = bytearray(w * h)
    dq: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not visited[y * w + x]:
            r, g, b, _ = px[x, y]
            if _is_background(r, g, b):
                visited[y * w + x] = 1
                dq.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    cleared = 0
    while dq:
        x, y = dq.popleft()
        r, g, b, a = px[x, y]
        if a != 0:
            px[x, y] = (r, g, b, 0)
            cleared += 1
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)
    return cleared


def process(path: str, floodfill: bool) -> None:
    img = Image.open(path)
    fmt = (img.format or "").upper()
    rgba = img.convert("RGBA")

    cleared = whiten_floodfill(rgba) if floodfill else whiten_ramp(rgba)

    if fmt == "WEBP":
        rgba.save(path, "WEBP", quality=90, method=6)
    else:
        rgba.save(path, "PNG", optimize=True)

    size_kb = os.path.getsize(path) / 1024
    mode = "flood-fill" if floodfill else "ramp"
    print(f"  {path}: cleared {cleared} px ({mode}), {size_kb:.0f} KB")


def main() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    jobs = [(p, False) for p in TARGETS] + [(p, True) for p in FLOODFILL_TARGETS]
    print(f"Processing {len(jobs)} illustrations in {root}")
    for path, floodfill in jobs:
        if not os.path.exists(path):
            print(f"  SKIP (missing): {path}")
            continue
        process(path, floodfill)
    print("Done.")


if __name__ == "__main__":
    main()
