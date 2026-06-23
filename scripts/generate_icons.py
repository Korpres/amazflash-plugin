#!/usr/bin/env python3
"""Genera iconos PNG para la extensión Chrome (naranja AmazFlash + rayo)."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"


def _chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def _png(size: int) -> bytes:
    """PNG RGBA con fondo naranja redondeado y símbolo ⚡ simplificado."""
    w = h = size
    px = bytearray()
    cx = cy = (size - 1) / 2
    r = size * 0.46
    orange = (255, 153, 0, 255)
    dark = (20, 20, 20, 255)

    for y in range(h):
        row = bytearray([0])  # filter byte
        for x in range(w):
            dx = x - cx
            dy = y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if dist > r:
                row.extend((0, 0, 0, 0))
                continue
            # Rayo estilizado (triángulo central)
            nx = dx / max(r, 1)
            ny = dy / max(r, 1)
            bolt = (
                ny < -0.05
                and abs(nx) < 0.22 - (ny + 0.05) * 0.35
            ) or (
                -0.05 <= ny <= 0.35
                and abs(nx + ny * 0.35) < 0.18
            ) or (
                ny > 0.35
                and abs(nx - 0.08) < 0.14 - (ny - 0.35) * 0.2
            )
            color = dark if bolt else orange
            row.extend(color)
        px.extend(row)

    raw = zlib.compress(bytes(px), 9)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", raw) + _chunk(b"IEND", b"")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (16, 48, 128):
        path = OUT / f"icon{size}.png"
        path.write_bytes(_png(size))
        print(f"OK {path}")


if __name__ == "__main__":
    main()
