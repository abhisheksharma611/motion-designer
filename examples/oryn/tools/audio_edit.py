import array
import json
import math
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(os.path.dirname(HERE), 'audio')
SRC = os.path.join(AUDIO, 'surf-house-productions-ethereal-pulse.mp3')
SR = 48000
analysis = json.load(open(os.path.join(AUDIO, 'analysis.json')))
BEAT = 60.0 / analysis['bpm']
BAR = 4 * BEAT
track_bar = lambda n: analysis['phase'] + (n - 1) * BAR

EDIT = [
    (1, 37, 4),
    (5, 45, 20),
    (25, 81, 4),
    (29, 93, 8),
]
FILM_BARS = 36
XFADE = BEAT
FADE_IN = 0.25
FADE_OUT = 1.6


def main(out_path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    src = array.array('f')
    src.frombytes(raw)
    total = int(round(FILM_BARS * BAR * SR))
    out = array.array('f', bytes(total * 8))
    xf = int(round(XFADE * SR))
    starts = [(int(round((fb - 1) * BAR * SR)), int(round(track_bar(tb) * SR))) for fb, tb, _ in EDIT]
    for idx, (fbar, tbar, nbars) in enumerate(EDIT):
        f0, t0 = starts[idx]
        n = min(int(round(nbars * BAR * SR)), total - f0)
        out[f0 * 2:(f0 + n) * 2] = src[t0 * 2:(t0 + n) * 2]
        if idx == 0:
            continue
        pf0, pt0 = starts[idx - 1]
        a0 = (pt0 + (f0 - xf - pf0)) * 2
        b0 = (t0 - xf) * 2
        px = sum(v * v for v in src[a0:a0 + xf * 2])
        py = sum(v * v for v in src[b0:b0 + xf * 2])
        rho = sum(src[a0 + j] * src[b0 + j] for j in range(xf * 2)) / math.sqrt(px * py)
        for i in range(xf):
            k = (i + 0.5) / xf
            ga, gb = math.cos(k * math.pi / 2), math.sin(k * math.pi / 2)
            blend = ga * ga * px + gb * gb * py
            norm = math.sqrt(blend / (blend + 2 * rho * ga * gb * math.sqrt(px * py)))
            for c in range(2):
                out[(f0 - xf + i) * 2 + c] = (src[a0 + i * 2 + c] * ga + src[b0 + i * 2 + c] * gb) * norm
        print(f'splice at film bar {fbar}: correlation {rho:+.2f}')
    fin = int(FADE_IN * SR)
    for i in range(fin):
        g = math.sin((i / fin) * math.pi / 2)
        out[i * 2] *= g; out[i * 2 + 1] *= g
    fout = int(FADE_OUT * SR)
    for i in range(fout):
        g = math.cos((i / fout) * math.pi / 2)
        j = total - fout + i
        out[j * 2] *= g; out[j * 2 + 1] *= g
    tmp = out_path + '.raw'
    open(tmp, 'wb').write(out.tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', tmp, '-c:a', 'pcm_f32le', out_path], check=True)
    os.remove(tmp)
    print('wrote', out_path, f'{total / SR:.3f}s')


if __name__ == '__main__':
    main(sys.argv[1])
