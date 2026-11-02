#!/usr/bin/env python3
"""Transparent mascot cutouts.

First route was border flood-fill keying (near-white connected to the
border -> transparent, erode 1px, feather). It failed the proof gate:
white pockets sealed between hair strands stayed as white blobs on
carbon, and the stripes' highlight cores key the same as those
pockets, so no threshold separates them.

Shipped route: rembg with the isnet-anime model (the one alternative
the brief allowed), which passed the same proofs clean. Run with the
project venv:  .venv/bin/python scripts/cutout.py [logo.png]
Outputs src/assets/mascot/*-cut.png and .receipts/cutout-proofs/*.jpg
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
    "/home/hatch/workspace/goals/vastraa-labs-website-update/files/vastraa-labs-logo.png"
)
OUT = ROOT / "src/assets/mascot"
PROOFS = ROOT / ".receipts/cutout-proofs"
CARBON = (11, 11, 13)

CROPS = {
    "full": (0, 0, 1600, 1600),
    "bust": (160, 0, 1440, 1600),
    "head": (220, 60, 1180, 1020),
    "face": (500, 400, 1000, 900),
    "eyes": (480, 470, 1020, 650),
    "og": (200, 0, 1340, 1197),
}


def main() -> None:
    from rembg import new_session, remove

    OUT.mkdir(parents=True, exist_ok=True)
    PROOFS.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    full = remove(src, session=new_session("isnet-anime"))
    for name, box in CROPS.items():
        c = full.crop(box)
        c.save(OUT / f"{name}-cut.png")
        bg = Image.new("RGBA", c.size, CARBON + (255,))
        bg.alpha_composite(c)
        proof = bg.convert("RGB")
        proof.thumbnail((640, 640))
        proof.save(PROOFS / f"{name}-on-carbon.jpg", quality=88)
        cov = np.asarray(c.split()[3])
        print(f"{name}: {c.size}, opaque {(cov > 128).mean():.1%}")


if __name__ == "__main__":
    main()
