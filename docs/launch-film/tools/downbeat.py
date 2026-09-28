import json
import sys

import librosa
import numpy as np

path, grid = sys.argv[1], json.load(open(sys.argv[2]))
bpm, bar1 = grid["bpm"], grid["bar1"]
beat = 60 / bpm
y, sr = librosa.load(path, sr=22050, mono=True)
hop = 512
chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
frame_t = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=hop)
first = bar1 - beat * np.floor(bar1 / beat)
beats = np.arange(first, len(y) / sr - beat, beat)


def mean_chroma(t0, t1):
    m = (frame_t >= t0) & (frame_t < t1)
    c = chroma[:, m].mean(axis=1) if m.any() else np.zeros(12)
    return c / (np.linalg.norm(c) + 1e-9)


novelty = np.array([1 - float(mean_chroma(b - 2 * beat, b) @ mean_chroma(b, b + 2 * beat)) for b in beats])
phase_of = np.round((beats - bar1) / beat).astype(int) % 4
scores = [float(novelty[phase_of == k].mean()) for k in range(4)]
best = int(np.argmax(scores))
print("chord change by beat of the bar:", ", ".join(f"{k + 1}: {s:.4f}" for k, s in enumerate(scores)))
print(f"one = beat {best + 1} of the analyser's bar; shift bar1 by {best} beat(s): {bar1 + best * beat:.4f} s")
