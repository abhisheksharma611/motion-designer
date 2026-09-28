import re
import sys


def ts(s):
    ms = round(s * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


rows = []
for line in open(sys.argv[1], errors="ignore"):
    m = re.match(r"\s*([\d.]+)[–-]\s*([\d.]+)s\s+\S+\s+(.+)$", line.rstrip())
    if m:
        rows.append((float(m[1]), float(m[2]), m[3].strip()))
for i, (a, b, text) in enumerate(rows, 1):
    print(f"{i}\n{ts(a)} --> {ts(b + 0.25)}\n{text}\n")
