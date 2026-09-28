#!/usr/bin/env bash
set -euo pipefail
film="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$film/../.." && pwd)"
scripts="$repo/skills/motion-designer/scripts"
work="$film/out/work/img"
mkdir -p "$work/rolyn" "$film/assets/img"
node "$scripts/render.mjs" stills "$repo/examples/rolyn/src/index.html" "$work/rolyn" \
  1.2,4.0,6.5,9.5,12.2,14.5,17.8,20.5,23.0,24.9,27.5,30.0,33.0,36.0,39.5,42.0,44.2,45.8 || true
[ "$(ls "$work/rolyn" | wc -l)" -ge 18 ] || { echo "Rolyn stills missing" >&2; exit 1; }
for t in 10 14 18 22 28 38 44 60; do
  ffmpeg -loglevel error -y -ss "$t" -i "$repo/examples/oryn/preview.mp4" -frames:v 1 "$work/oryn_$t.png"
done
uv run --quiet --with pillow python3 - "$work" "$film/assets/img" <<'PY'
import sys
from pathlib import Path
from PIL import Image
work, dest = Path(sys.argv[1]), Path(sys.argv[2])
def save(src, name, size, q=90):
    Image.open(src).convert("RGB").resize((size, size), Image.LANCZOS).save(dest / name, quality=q, optimize=True)
for p in sorted((work / "rolyn").glob("t*.png"), key=lambda p: float(p.stem[1:])):
    t = p.stem[1:].replace(".", "_")
    save(p, f"r_{t}.jpg", 720 if t in ("4_000", "12_200", "24_900", "45_800") else 240, 88)
for p in work.glob("oryn_*.png"):
    save(p, f"{p.stem}.jpg", 1080, 90)
print("images in", dest, len(list(dest.glob("*.jpg"))))
PY
