import json
from pathlib import Path

film = Path(__file__).resolve().parent.parent
repo = film.parent.parent
FILMS = {"rolyn": repo / "examples/rolyn/dist/rolyn-launch-film.html"}

out = {}
for name, path in FILMS.items():
    html = path.read_text()
    assert html.count("new URLSearchParams(location.search)") == 1, f"{path}: unexpected boot code"
    out[name] = html.replace("new URLSearchParams(location.search)", 'new URLSearchParams("render")')
dest = film / "src/films.js"
dest.write_text("window.FILMS = " + json.dumps(out) + ";\n")
print(dest, f"{dest.stat().st_size / 1e6:.2f} MB")
