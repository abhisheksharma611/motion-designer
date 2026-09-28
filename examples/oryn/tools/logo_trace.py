import os
from pathlib import Path
import json
import math
import sys

from PIL import Image

SRC = os.environ.get('ORYN_REPO', str(Path(__file__).resolve().parents[3])) + '/assets/branding/app-icon.png'
OUT_SVG, OUT_JSON = sys.argv[1], sys.argv[2]
im = Image.open(SRC).convert('RGBA')
px = im.load()
X0, Y0, X1, Y1 = 200, 160, 830, 830


def coverage(x, y):
    r, g, b, a = px[x, y]
    s = (b - min(r, g)) / 255.0 * (a / 255.0)
    return max(0.0, min(1.0, s / 0.93))


gw, gh = X1 - X0 + 1, Y1 - Y0 + 1
C = [[coverage(X0 + i, Y0 + j) for i in range(gw)] for j in range(gh)]
ISO = 0.5


def interp(p0, p1, v0, v1):
    t = (ISO - v0) / (v1 - v0) if v1 != v0 else 0.5
    return (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t)


pts, adj = {}, {}


def edge_point(key):
    if key in pts:
        return pts[key]
    kind, i, j = key
    p = interp((i, j), (i + 1, j), C[j][i], C[j][i + 1]) if kind == 'h' else interp((i, j), (i, j + 1), C[j][i], C[j + 1][i])
    pts[key] = (p[0] + X0, p[1] + Y0)
    return pts[key]


def link(a, b):
    edge_point(a)
    edge_point(b)
    adj.setdefault(a, []).append(b)
    adj.setdefault(b, []).append(a)


TABLE = {
    1: 'LB', 2: 'BR', 3: 'LR', 4: 'TR', 6: 'TB', 7: 'LT', 8: 'LT', 9: 'TB', 11: 'TR', 12: 'LR', 13: 'BR', 14: 'LB',
    5: 'LT BR', 10: 'TR LB',
}
for j in range(gh - 1):
    for i in range(gw - 1):
        idx = ((C[j][i] >= ISO) << 3) | ((C[j][i + 1] >= ISO) << 2) | ((C[j + 1][i + 1] >= ISO) << 1) | (C[j + 1][i] >= ISO)
        if idx in (0, 15):
            continue
        E = {'T': ('h', i, j), 'R': ('v', i + 1, j), 'B': ('h', i, j + 1), 'L': ('v', i, j)}
        for seg in TABLE[idx].split():
            link(E[seg[0]], E[seg[1]])

seen, loops = set(), []
for start in adj:
    if start in seen:
        continue
    loop, prev, cur = [start], None, start
    seen.add(start)
    while True:
        nxts = [n for n in adj[cur] if n != prev]
        if not nxts or nxts[0] == start or nxts[0] in seen:
            break
        loop.append(nxts[0])
        seen.add(nxts[0])
        prev, cur = cur, nxts[0]
    if len(loop) > 50:
        loops.append([pts[k] for k in loop])
loops.sort(key=len, reverse=True)


def area(poly):
    n = len(poly)
    return 0.5 * sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))


def resample(poly, step=0.75):
    out, acc, n = [poly[0]], 0.0, len(poly)
    for i in range(1, n + 1):
        a, b = poly[i - 1], poly[i % n]
        seg = math.dist(a, b)
        while acc + seg >= step:
            t = (step - acc) / seg
            a = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            out.append(a)
            seg, acc = math.dist(a, b), 0.0
        acc += seg
    return out


def turning(poly, i, k):
    n = len(poly)
    a, b, c = poly[(i - k) % n], poly[i], poly[(i + k) % n]
    v1, v2 = (b[0] - a[0], b[1] - a[1]), (c[0] - b[0], c[1] - b[1])
    return abs(math.degrees(math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1])))


def smooth_keep_corners(poly, sigma=3.0, k=6, corner_deg=38):
    n = len(poly)
    turn = [turning(poly, i, k) for i in range(n)]
    corners = [i for i in range(n) if turn[i] > corner_deg and turn[i] >= max(turn[(i + d) % n] for d in range(-k, k + 1))]
    rad = int(3 * sigma)
    wts = [math.exp(-(d * d) / (2 * sigma * sigma)) for d in range(-rad, rad + 1)]
    out = []
    for i in range(n):
        dmin = min((min((i - c) % n, (c - i) % n) for c in corners), default=10 ** 9)
        r = min(rad, dmin)
        if r <= 0:
            out.append(poly[i])
            continue
        sx = sy = sw = 0.0
        for d in range(-r, r + 1):
            w = wts[d + rad]
            p = poly[(i + d) % n]
            sx += p[0] * w
            sy += p[1] * w
            sw += w
        out.append((sx / sw, sy / sw))
    return out


outer, inner = loops[0], loops[1]
if area(outer) < 0:
    outer = outer[::-1]
if area(inner) < 0:
    inner = inner[::-1]
outer, inner = resample(outer), resample(inner)
near = []
for oi, p in enumerate(outer):
    best = min(range(len(inner)), key=lambda ii: (inner[ii][0] - p[0]) ** 2 + (inner[ii][1] - p[1]) ** 2)
    near.append((math.dist(p, inner[best]), oi, best))
pinches = []
for d, oi, ii in sorted(near):
    if d > 4:
        break
    if all(min(abs(oi - q[1]), len(outer) - abs(oi - q[1])) > 40 for q in pinches):
        pinches.append((d, oi, ii))
    if len(pinches) == 2:
        break
(_, o1, i1), (_, o2, i2) = pinches


def arc(poly, a, b):
    out, i = [], a
    while True:
        out.append(poly[i])
        if i == b:
            break
        i = (i + 1) % len(poly)
    return out


pieces = []
for oa, ob, ia, ib in [(o1, o2, i2, i1), (o2, o1, i1, i2)]:
    poly = arc(outer, oa, ob) + arc(inner[::-1], len(inner) - 1 - ia, len(inner) - 1 - ib)
    if area(poly) < 0:
        poly = poly[::-1]
    sm = smooth_keep_corners(smooth_keep_corners(resample(poly)), sigma=2.0)
    pieces.append(sm[::2])
pieces.sort(key=lambda pc: sum(p[0] for p in pc) / len(pc))

xs = [p[0] for pc in pieces for p in pc]
ys = [p[1] for pc in pieces for p in pc]
bx0, by0, bx1, by1 = min(xs), min(ys), max(xs), max(ys)

interior = []
for y in range(Y0 + 4, Y1 - 4, 2):
    for x in range(X0 + 4, X1 - 4, 2):
        if all(coverage(x + dx, y + dy) > 0.45 for dx in (-4, 0, 4) for dy in (-4, 0, 4)):
            interior.append((x, y, px[x, y]))


def lsq(vals):
    n = len(interior)
    Sx = Sy = Sxx = Syy = Sxy = Sv = Sxv = Syv = 0.0
    for (x, y, _), v in zip(interior, vals):
        Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y; Sv += v; Sxv += x * v; Syv += y * v
    M = [[n, Sx, Sy, Sv], [Sx, Sxx, Sxy, Sxv], [Sy, Sxy, Syy, Syv]]
    for i in range(3):
        piv = max(range(i, 3), key=lambda r: abs(M[r][i]))
        M[i], M[piv] = M[piv], M[i]
        for r in range(3):
            if r != i:
                f = M[r][i] / M[i][i]
                for c in range(i, 4):
                    M[r][c] -= f * M[i][c]
    return [M[i][3] / M[i][i] for i in range(3)]


_, gx, gy = lsq([c[0] for _, _, c in interior])
norm = math.hypot(gx, gy)
ux, uy = gx / norm, gy / norm
projs = [x * ux + y * uy for x, y, _ in interior]
pmin, pmax = min(projs), max(projs)
cx0, cy0 = (bx0 + bx1) / 2, (by0 + by1) / 2
mid = cx0 * ux + cy0 * uy
ax0, ay0 = cx0 + (pmin - mid) * ux, cy0 + (pmin - mid) * uy
ax1, ay1 = cx0 + (pmax - mid) * ux, cy0 + (pmax - mid) * uy
bins = [[0, 0, 0, 0] for _ in range(11)]
for (x, y, c), pr in zip(interior, projs):
    b = bins[round((pr - pmin) / (pmax - pmin) * 10)]
    b[0] += c[0]; b[1] += c[1]; b[2] += c[2]; b[3] += 1
stops = [(k / 10, '#%02x%02x%02x' % (round(r / n), round(g / n), round(b / n))) for k, (r, g, b, n) in enumerate(bins) if n > 20]


def path_d(poly):
    return 'M' + ' L'.join('%.2f %.2f' % (p[0] - bx0, p[1] - by0) for p in poly) + ' Z'


vw, vh = bx1 - bx0, by1 - by0
grad = ''.join('<stop offset="%.2f" stop-color="%s"/>' % s for s in stops)
open(OUT_SVG, 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.2f} {vh:.2f}" width="{vw:.0f}" height="{vh:.0f}">'
    f'<defs><linearGradient id="oryn-g" gradientUnits="userSpaceOnUse" x1="{ax0 - bx0:.2f}" y1="{ay0 - by0:.2f}" x2="{ax1 - bx0:.2f}" y2="{ay1 - by0:.2f}">{grad}</linearGradient></defs>'
    f'<path id="oryn-a" fill="url(#oryn-g)" d="{path_d(pieces[0])}"/><path id="oryn-b" fill="url(#oryn-g)" d="{path_d(pieces[1])}"/></svg>')
json.dump({'viewBox': [vw, vh], 'axis': [ax0 - bx0, ay0 - by0, ax1 - bx0, ay1 - by0], 'stops': stops,
           'a': path_d(pieces[0]), 'b': path_d(pieces[1])}, open(OUT_JSON, 'w'))
print('pieces', [len(p) for p in pieces], 'bbox', round(bx0, 2), round(by0, 2), round(bx1, 2), round(by1, 2), 'stops', len(stops))
