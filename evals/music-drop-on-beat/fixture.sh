#!/usr/bin/env bash
set -euo pipefail
python3 - <<'EOF'
import array, math, random, wave
BPM, OFFSET, SR, BARS = 124.0, 0.37, 22050, 24
LEVEL = {**dict.fromkeys(range(1, 9), 0.22), **dict.fromkeys(range(9, 17), 1.0),
         **dict.fromkeys(range(17, 21), 0.2), **dict.fromkeys(range(21, 25), 1.0)}
beat = 60 / BPM
x = [0.0] * int((OFFSET + BARS * 4 * beat + 1.0) * SR)
rnd = random.Random(7)

def add(t, seconds, fn, gain):
    i0 = int(round(t * SR))
    for i in range(min(int(seconds * SR), len(x) - i0)):
        x[i0 + i] += gain * fn(i / SR)

kick = lambda s: math.sin(2 * math.pi * (50 * s + 2 * (1 - math.exp(-30 * s)))) * math.exp(-18 * s)
snare = lambda s: rnd.uniform(-1, 1) * math.exp(-25 * s)
hat = lambda s: rnd.uniform(-1, 1) * math.exp(-90 * s)
bass = lambda s: math.sin(2 * math.pi * 55 * s) * min(1.0, s * 40)
for bar in range(1, BARS + 1):
    g = LEVEL[bar]
    for k in range(4):
        t = OFFSET + ((bar - 1) * 4 + k) * beat
        add(t, 0.25, kick, g)
        add(t, beat * 0.9, bass, 0.35 * g)
        if k in (1, 3):
            add(t, 0.2, snare, 0.5 * g)
        add(t, 0.05, hat, 0.25 * g)
        add(t + beat / 2, 0.05, hat, 0.25 * g)
peak = max(abs(v) for v in x)
with wave.open("track.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(array.array("h", (int(v / peak * 26000) for v in x)).tobytes())
EOF
