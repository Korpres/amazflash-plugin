#!/usr/bin/env python3
"""Genera iconos PNG para la extensión Chrome desde icons/icon-source.png."""
from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Instala Pillow: pip install Pillow") from exc

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
SRC = OUT / "icon-source.png"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Falta {SRC} — copia el logo AmazFlash ahí.")
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    for size in (16, 48, 128):
        path = OUT / f"icon{size}.png"
        img.resize((size, size), Image.Resampling.LANCZOS).save(path, format="PNG", optimize=True)
        print(f"OK {path}")


if __name__ == "__main__":
    main()
