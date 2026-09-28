import json
import math
import re
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'audio' / 'vo'
BEAT = 60 / 128
at = lambda bar, beat=1: ((bar - 1) * 4 + (beat - 1)) * BEAT

SCRIPT = [
    ((1, 2), 'Meet Oryn.', 'Meet Orin.'),
    ((3, 2), 'The dual-pane file manager.', 'The dual-pane file manager.'),
    ((6, 2), 'Select your files. Drag them across.', 'Select your files. Drag them across.'),
    ((10, 2), 'Browse in a grid, and preview images and Markdown in place.', 'Browse in a grid, and preview images and Markdown in place.'),
    ((13, 2), 'Or switch to columns.', 'Or switch to columns.'),
    ((14, 2), 'Filter as you type.', 'Filter as you type.'),
    ((15, 3), 'Rename a whole batch, with a live preview.', 'Rename a whole batch, with a live preview.'),
    ((18, 1), 'Open a zip like any other folder.', 'Open a zip like any other folder.'),
    ((19, 3), 'Inside a repo, see exactly what changed.', 'Inside a repo, see exactly what changed.'),
    ((21, 1), 'Diff, blame and history, right beside your files.', 'Diff, blame, and history, right beside your files.'),
    ((23, 1), 'And a terminal, already in the right folder.', 'And a terminal, already in the right folder.'),
    ((25, 1), 'Jump anywhere from the command palette.', 'Jump anywhere from the command palette.'),
    ((26, 2), 'Even to your servers, over SFTP.', 'Even to your servers, over S F T P.'),
    ((29, 2.5), 'On macOS.', 'On Mac O S.'),
    ((30, 1.5), 'On Windows.', 'On Windows.'),
    ((31, 1.5), 'And Linux.', 'And Linux.'),
    ((34, 3), 'Oryn. Your files. In flow.', 'Orin. Your files. In flow.'),
]
SEEDS = (11, 23, 37, 51)
RETRY_SEEDS = (11, 23, 37, 51, 67, 89)


def syllables(text):
    words = re.findall(r"[A-Za-z]+", text)
    count = 0
    for w in words:
        w = w.lower()
        if len(w) == 1:
            count += 1
            continue
        groups = re.findall(r'[aeiouy]+', w)
        n = len(groups) - (1 if w.endswith('e') and len(groups) > 1 and not w.endswith('le') else 0)
        count += max(1, n)
    return count


def envelope(wav, sr, win=0.01):
    hop = int(sr * win)
    frames = len(wav) // hop
    rms = np.sqrt(np.mean(wav[:frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-9), hop


def analyse(wav, sr):
    db, hop = envelope(wav, sr)
    thresh = db.max() - 38
    active = np.where(db > thresh)[0]
    if len(active) == 0:
        return None
    first, last = active[0], active[-1]
    gaps, run = [], 0
    for v in db[first:last + 1] > thresh:
        run = 0 if v else run + 1
        gaps.append(run)
    longest = max(gaps) * hop / sr if gaps else 0
    start = max(0, first * hop - int(0.04 * sr))
    end = min(len(wav), (last + 1) * hop + int(0.14 * sr))
    return {'start': start, 'end': end, 'speech': (last - first + 1) * hop / sr, 'gap': longest}


def score(info, text):
    sentences = max(1, len(re.findall(r'[.!?]', text)))
    expected = syllables(text) * 0.2 + 0.15 * sentences + 0.32 * (sentences - 1) + 0.12 * text.count(',')
    s = abs(info['speech'] - expected) / expected
    allowed = 0.55 if sentences == 1 else 0.85
    if info['gap'] > allowed:
        s += 2 * (info['gap'] - allowed) + 0.5
    return s, expected


def main(only=None):
    from chatterbox.tts import ChatterboxTTS

    OUT.mkdir(parents=True, exist_ok=True)
    snap = next(Path.home().glob('.cache/huggingface/hub/models--ResembleAI--chatterbox/snapshots/*'))
    model = ChatterboxTTS.from_local(snap, device='mps')
    sr = model.sr
    path = OUT / 'manifest.json'
    manifest = json.loads(path.read_text()) if only and path.exists() else []
    for i, ((bar, beat), text, say) in enumerate(SCRIPT, 1):
        if only and i not in only:
            continue
        takes = []
        for seed in (RETRY_SEEDS if only else SEEDS):
            torch.manual_seed(seed)
            wav = model.generate(say, exaggeration=0.45, cfg_weight=0.5).squeeze(0).cpu().numpy().astype(np.float32)
            info = analyse(wav, sr)
            if info is None:
                continue
            sc, expected = score(info, say)
            takes.append((sc, seed, wav, info, expected))
            print(f'{i:02d} seed {seed}: speech {info["speech"]:.2f}s (expected {expected:.2f}s), longest gap {info["gap"]:.2f}s, score {sc:.3f}', flush=True)
        sc, seed, wav, info, expected = min(takes, key=lambda x: x[0])
        clip = wav[info['start']:info['end']].copy()
        fade = int(0.06 * sr)
        clip[-fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
        clip[:int(0.01 * sr)] *= np.linspace(0, 1, int(0.01 * sr))
        db, hop = envelope(clip, sr)
        voiced = db > db.max() - 30
        rms = math.sqrt(np.mean(np.concatenate([clip[k * hop:(k + 1) * hop] for k in np.where(voiced)[0]]) ** 2))
        clip *= 10 ** (-20 / 20) / rms
        import soundfile as sf
        sf.write(OUT / f'{i:02d}.wav', clip, sr, subtype='FLOAT')
        cue = at(bar, beat)
        entry = {'id': i, 'text': text, 'say': say, 'cue': round(cue, 4), 'lead': 0.04, 'dur': round(len(clip) / sr, 4),
                 'seed': seed, 'score': round(sc, 3), 'file': f'{i:02d}.wav'}
        manifest = [m for m in manifest if m['id'] != i] + [entry]
        print(f'-> {i:02d} "{text}" seed {seed}, {len(clip) / sr:.2f}s at {cue:.2f}s', flush=True)
    path.write_text(json.dumps(sorted(manifest, key=lambda m: m['id']), indent=2))


if __name__ == '__main__':
    import sys
    main({int(a) for a in sys.argv[1:]} or None)
