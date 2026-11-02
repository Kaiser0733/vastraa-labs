#!/usr/bin/env python3
"""Mascot pipeline, plan section 3: porcelain tint, crops, favicons, social cards.

Run from the repo root:  python3 scripts/prep-assets.py [logo.png]
Outputs: src/assets/mascot/, public/ favicons + site.webmanifest + og/.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
    "/home/hatch/workspace/goals/vastraa-labs-website-update/files/vastraa-labs-logo.png"
)
MASCOT = ROOT / "src/assets/mascot"
PUBLIC = ROOT / "public"
PORCELAIN = (250, 246, 243)  # #FAF6F3
CARBON = (11, 11, 13)  # #0B0B0D
MUTE = (138, 136, 144)  # #8A8890

CROPS = {
    "full": (0, 0, 1600, 1600),
    "bust": (160, 0, 1440, 1600),
    "head": (220, 60, 1180, 1020),
    "face": (500, 400, 1000, 900),
    "eyes": (480, 470, 1020, 650),
    "og": (200, 0, 1340, 1197),
}


def tint(img: Image.Image) -> Image.Image:
    """All channels >= 246 -> pure white, then multiply by #FAF6F3."""
    r, g, b = img.split()
    lightest = ImageChops.darker(ImageChops.darker(r, g), b)
    mask = lightest.point(lambda v: 255 if v >= 246 else 0)
    white = Image.new("RGB", img.size, (255, 255, 255))
    img = Image.composite(white, img, mask)
    return ImageChops.multiply(img, Image.new("RGB", img.size, PORCELAIN))


def font(path: str, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(ROOT / "scripts/fonts" / path), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def card(og: Image.Image, title: str, sub: str, domain: str, out: Path) -> None:
    img = Image.new("RGBA", (1200, 630), CARBON + (255,))
    right = og.resize((600, 630), Image.LANCZOS)
    img.alpha_composite(right, (600, 0))
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)
    d.text((48, 236), title, font=font("SchibstedGrotesk.ttf", 64, 600), fill=PORCELAIN)
    d.text((48, 330), sub, font=font("IBMPlexMono-Regular.ttf", 22), fill=MUTE)
    d.text((48, 556), domain, font=font("IBMPlexMono-Regular.ttf", 22), fill=MUTE)
    img.save(out)


def main() -> None:
    MASCOT.mkdir(parents=True, exist_ok=True)
    (PUBLIC / "og").mkdir(parents=True, exist_ok=True)

    # Favicons keep the square art (browser chrome, not a page surface).
    master = tint(Image.open(SRC).convert("RGB"))
    assert master.getpixel((0, 0)) == PORCELAIN, master.getpixel((0, 0))

    crops = {name: master.crop(box) for name, box in CROPS.items()}
    head, face = crops["head"], crops["face"]
    head.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    face.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png")
    face.resize((192, 192), Image.LANCZOS).save(PUBLIC / "icon-192.png")
    face.resize((512, 512), Image.LANCZOS).save(PUBLIC / "icon-512.png")
    (PUBLIC / "site.webmanifest").write_text(json.dumps({
        "name": "Vastraa Labs",
        "short_name": "Vastraa Labs",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "theme_color": "#0B0B0D",
        "background_color": "#0B0B0D",
        "display": "standalone",
    }, indent=2) + "\n")

    # Social cards carry the transparent cutout on carbon. No location text.
    og_cut = Image.open(MASCOT / "og-cut.png").convert("RGBA")
    card(og_cut, "Vastraa Labs", "We build and ship our own products.",
         "vastraalabs.online", PUBLIC / "og/og-default.png")
    card(og_cut, "Rivet", "v1.1.1 · Android",
         "vastraalabs.online/rivet", PUBLIC / "og/og-rivet.png")
    print("favicons, webmanifest, og cards done")


if __name__ == "__main__":
    main()
