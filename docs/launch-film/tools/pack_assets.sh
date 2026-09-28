#!/usr/bin/env bash
set -euo pipefail
film="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$film/../.." && pwd)"
imgs=()
for f in "$film"/assets/img/*.jpg; do n="$(basename "$f" .jpg)"; imgs+=(--img "$n=$f"); done
python3 "$repo/skills/motion-designer/scripts/assets.py" "$film/src/assets.js" \
  --font "Inter=$film/assets/fonts/Inter-Variable.ttf" \
  --font "JetBrains Mono:100 800=$film/assets/fonts/JetBrainsMono-Variable.ttf" \
  "${imgs[@]}"
