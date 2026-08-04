#!/usr/bin/env python3
"""
Convert a portrait photo into retro pixel avatar frames for GitHub profile assets.

Requires: Pillow (pip install Pillow)
Optional: opencv-python for better edge-aware downscale

Usage:
  python photo_to_pixel_avatar.py [--input PATH] [--output DIR] [--size 40]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
except ImportError:
    print("Install Pillow: pip install Pillow", file=sys.stderr)
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
PROFILE_ROOT = SCRIPT_DIR.parent
DEFAULT_OUTPUT = PROFILE_ROOT / "assets" / "pixel-avatar"

# Candidate photo paths (first existing wins)
PHOTO_CANDIDATES = [
    PROFILE_ROOT / "assets" / "felipe-photo.jpg",
    Path("assets/felipe-photo.jpg"),
    Path("felipe-photo.jpg"),
    Path.home() / "Desktop" / "curriculos" / "data" / "github-profile" / "assets" / "felipe-photo.jpg",
]

PALETTE_SIZE = 32  # max colors for retro look


def discover_photo(explicit: Path | None) -> Path | None:
    if explicit and explicit.is_file():
        return explicit
    for candidate in PHOTO_CANDIDATES:
        if candidate.is_file():
            return candidate
    return None


def load_and_pixelize(src: Path, size: int) -> Image.Image:
    img = Image.open(src).convert("RGB")
    # Center crop to square
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((size, size), Image.Resampling.NEAREST)
    img = img.quantize(colors=PALETTE_SIZE, method=Image.Quantize.MEDIANCUT).convert("RGB")
    enhancer = ImageEnhance.Contrast(img)
    return enhancer.enhance(1.15)


def tint_overlay(base: Image.Image, rgb: tuple[int, int, int], alpha: float) -> Image.Image:
    overlay = Image.new("RGB", base.size, rgb)
    return Image.blend(base, overlay, alpha)


def frame_idle(base: Image.Image) -> Image.Image:
    return base.copy()


def frame_crouch(base: Image.Image) -> Image.Image:
    w, h = base.size
    squashed = base.resize((w, int(h * 0.75)), Image.Resampling.NEAREST)
    out = Image.new("RGB", (w, h), (13, 17, 23))
    out.paste(squashed, (0, h - squashed.size[1]))
    return out


def frame_jump(base: Image.Image) -> Image.Image:
    w, h = base.size
    out = Image.new("RGB", (w, h), (13, 17, 23))
    stretched = base.resize((w, int(h * 1.08)), Image.Resampling.NEAREST)
    out.paste(stretched, (0, 0))
    return out


def frame_fall(base: Image.Image) -> Image.Image:
    return tint_overlay(base, (80, 120, 200), 0.12)


def frame_victory(base: Image.Image) -> Image.Image:
    return tint_overlay(base, (255, 215, 0), 0.18)


def build_spritesheet(frames: dict[str, Image.Image]) -> Image.Image:
    names = ["idle", "crouch", "jump", "fall", "victory"]
    size = next(iter(frames.values())).size[0]
    sheet = Image.new("RGB", (size * len(names), size), (13, 17, 23))
    for i, name in enumerate(names):
        sheet.paste(frames[name], (i * size, 0))
    return sheet


def save_gif(frames: dict[str, Image.Image], path: Path, duration_ms: int = 180) -> None:
    order = ["idle", "crouch", "jump", "fall", "victory", "idle"]
    images = [frames[n] for n in order]
    images[0].save(
        path,
        save_all=True,
        append_images=images[1:],
        duration=duration_ms,
        loop=0,
        disposal=2,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Photo → pixel avatar frames")
    parser.add_argument("--input", type=Path, help="Source portrait (default: auto-discover)")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--size", type=int, default=40, choices=range(24, 65))
    args = parser.parse_args()

    photo = discover_photo(args.input)
    if not photo:
        print("No photo found. Place felipe-photo.jpg in assets/ or pass --input.", file=sys.stderr)
        return 1

    args.output.mkdir(parents=True, exist_ok=True)
    base = load_and_pixelize(photo, args.size)

    frames = {
        "idle": frame_idle(base),
        "crouch": frame_crouch(base),
        "jump": frame_jump(base),
        "fall": frame_fall(base),
        "victory": frame_victory(base),
    }

    for name, img in frames.items():
        img.save(args.output / f"{name}.png")

    build_spritesheet(frames).save(args.output / "spritesheet.png")
    save_gif(frames, args.output / "avatar-loop.gif")

    meta = {
        "source": str(photo),
        "size_px": args.size,
        "frames": list(frames.keys()),
        "output_dir": str(args.output),
    }
    (args.output / "meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    print(f"Generated {len(frames)} frames + spritesheet + GIF → {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
