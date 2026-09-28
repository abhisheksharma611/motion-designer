import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'audio'
VO = AUDIO / 'vo'
SR = 48000
DUCK_DB = 8.0
VOICE_OVER_DB = 9.0
ATTACK = 0.2
RELEASE = 0.5
VOICE_RMS_DB = -15


def raised(n):
    return 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))


def srt_time(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def ffmpeg(*args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-y', *args], check=True, capture_output=True, text=True).stderr


def loudness(path):
    out = ffmpeg('-i', str(path), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-')
    return json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', out).group(0))


def main():
    music, sr = sf.read(AUDIO / 'film_mix.wav', dtype='float32', always_2d=True)
    assert sr == SR
    n = len(music)
    lines = json.loads((VO / 'manifest.json').read_text())
    hp = butter(2, 90, 'highpass', fs=SR, output='sos')

    raw = np.zeros(n, dtype=np.float32)
    regions = []
    for line in lines:
        clip, csr = sf.read(VO / line['file'], dtype='float32')
        clip = sosfilt(hp, resample_poly(clip, SR, csr)).astype(np.float32)
        start = int(round((line['cue'] - line['lead']) * SR))
        end = min(n, start + len(clip))
        raw[start:end] += clip[:end - start]
        regions.append((start, end))
    for (s0, e0), (s1, _), line in zip(regions, regions[1:], lines):
        if e0 > s1:
            print(f'warning: line {line["id"]} overlaps the next by {(e0 - s1) / SR:.2f}s')

    sf.write(AUDIO / 'vo_raw.wav', raw, SR, subtype='FLOAT')
    ffmpeg('-i', str(AUDIO / 'vo_raw.wav'), '-af', 'acompressor=threshold=-26dB:ratio=3:attack=4:release=90:knee=6',
           '-c:a', 'pcm_f32le', str(AUDIO / 'vo_comp.wav'))
    vo, _ = sf.read(AUDIO / 'vo_comp.wav', dtype='float32')
    talking = np.concatenate([vo[s:e] for s, e in regions])
    active = talking[np.abs(talking) > 10 ** (-50 / 20)]
    vo *= 10 ** (VOICE_RMS_DB / 20) / np.sqrt(np.mean(active ** 2))
    sf.write(AUDIO / 'vo_levelled.wav', vo, SR, subtype='FLOAT')
    ceiling = 10 ** ((VOICE_RMS_DB + 11) / 20)
    ffmpeg('-i', str(AUDIO / 'vo_levelled.wav'), '-af', f'alimiter=limit={ceiling:.4f}:attack=2:release=50:level=false:latency=true',
           '-c:a', 'pcm_f32le', str(AUDIO / 'vo_limited.wav'))
    vo, _ = sf.read(AUDIO / 'vo_limited.wav', dtype='float32')

    rms = lambda x: float(np.sqrt(np.mean(x ** 2)))
    base = [20 * np.log10(rms(vo[s:e]) / rms(music[s:e])) + DUCK_DB for s, e in regions]
    depths = [min(12.0, max(6.0, DUCK_DB + VOICE_OVER_DB - b)) for b in base]
    duck = np.ones(n, dtype=np.float32)
    a, r = int(ATTACK * SR), int(RELEASE * SR)
    for (start, end), d in zip(regions, depths):
        depth = 10 ** (-d / 20)
        g = np.ones(n, dtype=np.float32)
        s0, e1 = max(0, start - a), min(n, end + r)
        g[s0:start] = 1 - (1 - depth) * raised(start - s0)
        g[start:end] = depth
        g[end:e1] = depth + (1 - depth) * raised(e1 - end)
        duck = np.minimum(duck, g)
    mix = music * duck[:, None] + vo[:, None]
    over = [20 * np.log10(rms(vo[s:e]) / rms(music[s:e] * duck[s:e, None])) for s, e in regions]
    print('music dip per line (dB):', [round(d, 1) for d in depths])
    print('speech over ducked music per line (dB):', [round(float(x), 1) for x in over])

    sf.write(AUDIO / 'vo_stem.wav', np.stack([vo, vo], axis=1), SR, subtype='FLOAT')
    sf.write(AUDIO / 'film_vo_premix.wav', mix, SR, subtype='FLOAT')
    ffmpeg('-i', str(AUDIO / 'film_vo_premix.wav'), '-af', 'alimiter=limit=0.841:attack=3:release=60:level=false:latency=true',
           '-c:a', 'pcm_f32le', str(AUDIO / 'film_vo_limited.wav'))
    m = loudness(AUDIO / 'film_vo_limited.wav')
    ffmpeg('-i', str(AUDIO / 'film_vo_limited.wav'), '-af',
           f'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}'
           f':measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true:print_format=json',
           '-ar', str(SR), '-c:a', 'pcm_f32le', str(AUDIO / 'film_mix_vo.wav'))
    final = loudness(AUDIO / 'film_mix_vo.wav')
    print(f'final: {final["input_i"]} LUFS, true peak {final["input_tp"]} dBTP, LRA {final["input_lra"]}')

    out = ROOT / 'out'
    out.mkdir(exist_ok=True)
    with open(out / 'oryn-files-in-motion.srt', 'w') as f:
        for k, (line, (start, end)) in enumerate(zip(lines, regions), 1):
            until = end / SR + 0.35
            if k < len(regions):
                until = min(until, regions[k][0] / SR - 0.05)
            f.write(f'{k}\n{srt_time(start / SR)} --> {srt_time(until)}\n{line["text"]}\n\n')


if __name__ == '__main__':
    main()
