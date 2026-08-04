#!/usr/bin/env python3
"""Generate static hero.png (and optional hero.gif) for GitHub profile README."""
from __future__ import annotations

import base64
import io
import struct
import zlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = Path(__file__).resolve().parent
PROFILE_ROOT = SCRIPT_DIR.parent
ASSETS = PROFILE_ROOT / "assets"
OUT_PNG = ASSETS / "hero.png"
OUT_GIF = ASSETS / "hero.gif"

W, H = 800, 300

# Embedded idle avatar from hero.svg (photo-derived pixel art)
AVATAR_B64 = (
    "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"
)


def _gradient(draw: ImageDraw.ImageDraw, y0: int, y1: int, top: tuple, mid: tuple, bot: tuple) -> None:
    for y in range(y0, y1):
        t = (y - y0) / max(y1 - y0 - 1, 1)
        if t < 0.55:
            u = t / 0.55
            c = tuple(int(top[i] + (mid[i] - top[i]) * u) for i in range(3))
        else:
            u = (t - 0.55) / 0.45
            c = tuple(int(mid[i] + (bot[i] - mid[i]) * u) for i in range(3))
        draw.line([(0, y), (W, y)], fill=c)


def _ellipse(draw: ImageDraw.ImageDraw, cx: int, cy: int, rx: int, ry: int, fill: str) -> None:
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=fill)


def _block(draw: ImageDraw.ImageDraw, x: int, y: int, color: str, stroke: str, label: str, label_color: str = "#fff") -> None:
    draw.rectangle([x, y, x + 44, y + 44], fill=color, outline=stroke, width=3)
    draw.rectangle([x + 4, y + 4, x + 40, y + 12], fill=_lighten(color))
    try:
        font = ImageFont.truetype("consola.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((x + 22 - tw // 2, y + 24), label, fill=label_color, font=font)


def _lighten(hex_color: str) -> str:
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return f"#{min(255, r + 40):02x}{min(255, g + 40):02x}{min(255, b + 40):02x}"


def _bug(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str) -> None:
    draw.ellipse([cx - 14, cy - 10, cx + 14, cy + 10], fill=color)
    draw.rectangle([cx - 12, cy - 6, cx - 6, cy], fill="#fff")
    draw.rectangle([cx + 6, cy - 6, cx + 12, cy], fill="#fff")
    draw.rectangle([cx - 10, cy - 4, cx - 7, cy - 1], fill="#111")
    draw.rectangle([cx + 7, cy - 4, cx + 10, cy - 1], fill="#111")


def _load_avatar() -> Image.Image:
    data = base64.b64decode(AVATAR_B64)
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    return img.resize((40, 40), Image.Resampling.NEAREST)


def render_frame(jump_offset: int = 0, hero_x: int = 80) -> Image.Image:
    img = Image.new("RGB", (W, H), "#6ec5ff")
    draw = ImageDraw.Draw(img)

    _gradient(draw, 0, H, (0x6E, 0xC5, 0xFF), (0x4A, 0x9F, 0xD4), (0x2D, 0x6A, 0x8F))

    # Clouds
    for cx, cy, rx, ry in [(90, 52, 34, 16), (118, 48, 26, 14), (64, 50, 20, 12), (420, 38, 40, 18), (452, 34, 28, 15), (388, 36, 22, 13)]:
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill="#ffffff")

    # Hills
    _ellipse(draw, 180, 210, 220, 55, "#3d7a52")
    _ellipse(draw, 620, 218, 260, 62, "#3d7a52")
    _ellipse(draw, 400, 232, 480, 70, "#4caf6a")

    # Flag
    draw.rectangle([740, 148, 744, 230], fill="#c4a35a")
    draw.polygon([(744, 156), (778, 166), (744, 176)], fill="#ffd700")
    draw.rectangle([744, 156, 778, 176], fill="#ff6b6b")
    draw.ellipse([738, 148, 746, 156], fill="#ffd700")

    # Ground
    for row in range(248, H, 8):
        for col in range(0, W, 16):
            base = "#8b4513" if (row // 8 + col // 16) % 2 == 0 else "#a0522d"
            draw.rectangle([col, row, col + 16, row + 8], fill=base)
    draw.rectangle([0, 240, W, 252], fill="#3cb371")
    draw.rectangle([0, 240, W, 244], fill="#5fd38a")

    # Blocks
    _block(draw, 148, 118, "#3178c6", "#1e4f8a", "TS")
    _block(draw, 248, 108, "#3776ab", "#1f4f73", "Py", "#ffd43b")
    _block(draw, 348, 118, "#2496ed", "#1256a3", "=3")
    _block(draw, 448, 108, "#336791", "#1a3d57", "PG")
    _block(draw, 548, 118, "#5881d8", "#334f8a", "λ")

    # Gems
    for pts, color in [([(170, 90), (174, 98), (182, 98), (176, 104), (178, 112), (170, 108), (162, 112), (164, 104), (158, 98), (166, 98)], "#ffd700")]:
        draw.polygon(pts, fill=color)

    # Bugs
    _bug(draw, 210, 252, "#7c3aed")
    _bug(draw, 520, 254, "#ef4444")

    # Hero shadow
    draw.ellipse([hero_x + 38 - 18, 241, hero_x + 38 + 18, 251], fill="#00000040")

    # Avatar + laptop
    avatar = _load_avatar()
    ax, ay = hero_x + 18, 208 + jump_offset
    img.paste(avatar, (ax, ay), avatar)
    draw.rectangle([hero_x + 54, 218 + jump_offset, hero_x + 68, 228 + jump_offset], fill="#334155", outline="#64748b")
    draw.rectangle([hero_x + 56, 220 + jump_offset, hero_x + 66, 226 + jump_offset], fill="#22d3ee")

    # Title bar
    overlay = Image.new("RGBA", (W, 72), (13, 17, 23, 140))
    img.paste(overlay, (0, 0), overlay)
    try:
        title_font = ImageFont.truetype("consolab.ttf", 18)
        sub_font = ImageFont.truetype("consola.ttf", 11)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()

    title = "FELIPE OLIVEIRA FERNANDES"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    draw.text((400 - tw // 2, 14), title, fill="#ffd700", font=title_font)
    sub = "Backend Developer · São José dos Campos, BR"
    bbox2 = draw.textbbox((0, 0), sub, font=sub_font)
    sw = bbox2[2] - bbox2[0]
    draw.text((400 - sw // 2, 40), sub, fill="#00ff88", font=sub_font)

    press = "▶ PRESS START TO CONTINUE"
    bbox3 = draw.textbbox((0, 0), press, font=sub_font)
    pw = bbox3[2] - bbox3[0]
    draw.text((400 - pw // 2, 278), press, fill="#ffd700", font=sub_font)

    return img


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    png = render_frame()
    png.save(OUT_PNG, "PNG", optimize=True)
    print(f"Wrote {OUT_PNG} ({OUT_PNG.stat().st_size} bytes)")

    # Simple 4-frame jump loop GIF
    frames = [render_frame(0, 80), render_frame(-20, 80), render_frame(-52, 80), render_frame(-20, 80)]
    frames[0].save(
        OUT_GIF,
        save_all=True,
        append_images=frames[1:],
        duration=300,
        loop=0,
        optimize=True,
    )
    print(f"Wrote {OUT_GIF} ({OUT_GIF.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
