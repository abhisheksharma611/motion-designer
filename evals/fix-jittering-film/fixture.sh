#!/usr/bin/env bash
set -euo pipefail
skill="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../skills/motion-designer" && pwd)"
bash "$skill/scripts/new_film.sh" film mobile > /dev/null
python3 - <<'EOF'
from pathlib import Path
p = Path("film/src/scenes.js")
s = p.read_text()
old = "  show($.dot, on);\n  setT($.dot, T(x, y, s));"
assert old in s, "the template changed; update this fixture"
p.write_text(s.replace(old, "  show($.dot, on);\n  const settle = Math.random() * 0.8;\n  setT($.dot, T(x + settle, y, s));"))
EOF
