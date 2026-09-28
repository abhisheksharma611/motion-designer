import json
import math
import struct
import subprocess
import sys

path, bpm, beats, drop = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
sr = 8000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = struct.unpack(f"<{len(raw) // 2}h", raw)
step = 60 / bpm / 2
vals = []
for i in range(beats * 2):
    a, b = int(i * step * sr), int((i + 1) * step * sr)
    seg = x[a:b] or (0,)
    vals.append(math.sqrt(sum(v * v for v in seg) / len(seg)))
top = max(vals) or 1
print("window.WAVE = " + json.dumps({"bpm": bpm, "beats": beats, "drop": drop, "v": [round(v / top, 3) for v in vals]}) + ";")
