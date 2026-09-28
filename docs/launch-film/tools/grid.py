import sys
from pathlib import Path
from PIL import Image, ImageDraw
src, out = Path(sys.argv[1]), sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
size = int(sys.argv[4]) if len(sys.argv) > 4 else 360
files = sorted(src.glob("t*.png"), key=lambda p: float(p.stem[1:]))
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * size, rows * (size + 22)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((size, size), Image.LANCZOS)
    x, y = (i % cols) * size, (i // cols) * (size + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 6, y + 4), f.stem[1:] + " s", fill=(230, 230, 230))
sheet.save(out, quality=88)
print(out, len(files))
