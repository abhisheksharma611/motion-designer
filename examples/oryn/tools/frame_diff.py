import argparse
import glob
import os
import statistics

from PIL import Image, ImageChops, ImageStat

BPM = 128.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('frames')
    ap.add_argument('--fps', type=int, default=60)
    ap.add_argument('--ratio', type=float, default=4.0)
    ap.add_argument('--floor', type=float, default=1.5)
    args = ap.parse_args()
    files = sorted(glob.glob(os.path.join(args.frames, '[0-9]*.png')))
    small = lambda f: Image.open(f).convert('L').resize((360, 360), Image.BILINEAR)
    diffs, prev = [], small(files[0])
    for f in files[1:]:
        cur = small(f)
        diffs.append(ImageStat.Stat(ImageChops.difference(prev, cur)).mean[0])
        prev = cur
    beat = 60.0 / BPM
    flagged = 0
    for i, d in enumerate(diffs):
        window = diffs[max(0, i - 6):i] + diffs[i + 1:i + 7]
        base = statistics.median(window) if window else 0
        if d > args.floor and d > args.ratio * max(base, 0.25):
            t = (i + 1) / args.fps
            bar, rest = divmod(t / beat, 4)
            print(f'frame {i + 1:05d}  t={t:6.3f}s  bar {int(bar) + 1}.{rest + 1:.2f}  diff {d:6.2f}  local median {base:5.2f}')
            flagged += 1
    print(f'{len(files)} frames, {flagged} spikes, max diff {max(diffs):.2f}')


if __name__ == '__main__':
    main()
