import asyncio
import html
import json
import os
import sys

from playwright.async_api import async_playwright

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BPM = 128.0
BEAT = 60 / BPM
BARS = 36
at = lambda bar, beat=1: ((bar - 1) * 4 + (beat - 1)) * BEAT

SECTIONS = [
    ('Wordmark → row', (1, 1), (2, 3), 'The ORYN wordmark; its letters draw together into a file row.', 'T37–38 piano'),
    ('Row → MacBook', (2, 3), (5, 1), 'The row becomes a closed MacBook, the lid opens, the screen wakes and Oryn assembles; push in.', 'T38–40 piano'),
    ('Dual pane + transfer', (5, 1), (10, 1), 'Panes divide (Downloads | Press Kit); six files marked, dragged across; the transfer queue completes on the drop.', 'T45–48 build → T49 drop'),
    ('Grid + preview', (10, 1), (13, 2), 'Grid view with thumbnails; a tile lifts into the image preview, then the Markdown preview.', 'T50–53 groove'),
    ('Columns', (13, 2), (14, 1), 'Column view: open screenshots/, back up, return to the list.', 'T53'),
    ('Search + batch rename', (14, 1), (18, 1), 'Filter “frame” narrows the list; results marked; Multi-Rename find / regex / replace preview, applied.', 'T54–57'),
    ('Archive', (18, 1), (19, 3), 'Oryn-brand-assets.zip opens like a folder; into logo/.', 'T58–59'),
    ('Git', (19, 3), (23, 1), 'Repo badge and M markers; context menu → Git Diff with HEAD, Blame, Log.', 'T59–62'),
    ('Terminal', (23, 1), (25, 1), 'Terminal drawer in the current folder: git log --oneline -5.', 'T63–64'),
    ('Palette + remote', (25, 1), (29, 1), 'Command palette “press” → SFTP press-server; browse; upload six icons; queue completes.', 'T81–84 piano reprise'),
    ('Every desktop', (29, 1), (33, 1), 'Pull back: the MacBook retracts to its desktop; Windows, then Linux wipe in around the same Oryn window; the three fan out.', 'T93–96 build'),
    ('Close', (33, 1), (37, 1), 'Final hit: back to the Mac, the lid closes into the row, the row unfolds into the wordmark; “Your files. In flow.”', 'T97–100 hit + decay'),
]
EVENTS = [('lid opens', 3, 1), ('drop · transfer done', 9, 1), ('preview', 11, 2), ('columns', 13, 2), ('rename', 15, 3), ('zip opens', 18, 3),
          ('diff', 21, 1), ('blame', 21, 3), ('terminal', 23, 1), ('SFTP', 26, 1), ('Windows', 30, 1), ('Linux', 31, 1),
          ('final hit · lid closes', 33, 2), ('tagline', 35, 1)]
SPLICES = [(5, 'T40 → T45'), (25, 'T64 → T81'), (29, 'T84 → T93')]
COLORS = ['#e9e4dc', '#dcd5ca']


def fmt(t):
    return f'{int(t // 60)}:{t % 60:05.2f}'


def voice_lines():
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio', 'vo', 'manifest.json')
    return json.load(open(path)) if os.path.exists(path) else []


def page():
    px = 1600 / BARS
    blocks, rows = [], []
    vo = voice_lines()
    for i, (title, a, b, what, music) in enumerate(SECTIONS):
        x0, x1 = (at(*a) / at(BARS + 1)) * 1600, (at(*b) / at(BARS + 1)) * 1600
        label = html.escape(title) if x1 - x0 > 80 else str(i + 1)
        blocks.append(f'<div class="sec" style="left:{x0:.1f}px;width:{x1 - x0:.1f}px;background:{COLORS[i % 2]}"><span>{label}</span></div>')
        said = ' '.join(f'“{v["text"]}”' for v in vo if at(*a) <= v['cue'] < at(*b))
        rows.append(f'<tr><td class="n">{i + 1}</td><td><b>{html.escape(title)}</b></td><td class="mono">{a[0]}.{a[1]} – {b[0]}.{b[1]}</td>'
                    f'<td class="mono">{fmt(at(*a))} – {fmt(at(*b))}</td><td>{html.escape(what)}</td><td class="vo">{html.escape(said)}</td><td class="mono">{html.escape(music)}</td></tr>')
    ticks = ''.join(f'<div class="bar{" four" if (b - 1) % 4 == 0 else ""}" style="left:{(b - 1) * px:.1f}px"><i>{b}</i></div>' for b in range(1, BARS + 1))
    ev = ''.join(f'<div class="ev" style="left:{at(b, k) / at(BARS + 1) * 1600:.1f}px;top:{8 + (n % 3) * 18}px"><em>{html.escape(name)}</em></div>'
                 for n, (name, b, k) in enumerate(EVENTS))
    spl = ''.join(f'<div class="spl" style="left:{(b - 1) * px:.1f}px"><em>{html.escape(lbl)}</em></div>' for b, lbl in SPLICES)
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>Oryn beat map</title><style>
body{{margin:0;background:#f4f1ec;color:#141416;font:14px/1.45 -apple-system,"SF Pro Text",Inter,sans-serif}}
.wrap{{width:1600px;padding:40px}} h1{{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}} .sub{{color:#6b6660;margin-bottom:28px}}
.lane{{position:relative;height:56px;margin-bottom:6px}} .sec{{position:absolute;top:0;height:56px;border-radius:6px;box-sizing:border-box;padding:6px 8px;overflow:hidden;border:1px solid #cfc7bb}}
.sec span{{font-size:11.5px;font-weight:600;line-height:1.2;display:block}}
.ruler{{position:relative;height:22px;border-top:1px solid #bdb5a8}} .bar{{position:absolute;top:0;height:6px;border-left:1px solid #bdb5a8}} .bar.four{{height:12px;border-left:1px solid #6b6660}}
.bar i{{position:absolute;top:10px;left:-4px;font-style:normal;font-size:10px;color:#6b6660}}
.events{{position:relative;height:66px}} .ev{{position:absolute;height:66px;border-left:2px solid #5b5bd6}} .ev em{{font-style:normal;font-size:11px;background:#f4f1ec;padding:0 4px;white-space:nowrap;color:#3a3a8c}}
.music{{position:relative;height:28px;background:#141416;border-radius:6px;margin-top:4px}} .spl{{position:absolute;top:0;height:28px;border-left:2px dashed #f5c26b}} .spl em{{position:absolute;top:6px;left:6px;font-style:normal;font-size:11px;color:#f5c26b;white-space:nowrap}}
.drop{{position:absolute;top:0;height:28px;border-left:3px solid #fff}} .legend{{color:#6b6660;font-size:12px;margin:6px 0 26px}}
table{{border-collapse:collapse;width:1600px}} td,th{{text-align:left;vertical-align:top;padding:7px 10px;border-bottom:1px solid #ddd6cb}} th{{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b6660}}
.mono{{font-family:"SF Mono",Menlo,monospace;font-size:12px;white-space:nowrap}} .n{{color:#6b6660}} .vo{{color:#3a3a8c;font-style:italic;width:330px}}
.voice{{position:relative;height:26px;margin-top:4px}} .vline{{position:absolute;top:4px;height:18px;border-radius:9px;background:#5b5bd6;opacity:.85}}
</style></head><body><div class="wrap">
<h1>Oryn — Files, in motion · beat map</h1>
<div class="sub">1440 × 1440 · 60 fps · 36 bars at 128 BPM = {fmt(at(BARS + 1))} · music: “Ethereal Pulse” by Surf House Productions, cut on downbeats (film bar ← track bar)</div>
<div class="events">{ev}</div>
<div class="lane">{''.join(blocks)}</div>
<div class="ruler">{ticks}</div>
<div class="music">{spl}<div class="drop" style="left:{8 * px:.1f}px"></div><div class="drop" style="left:{32 * px:.1f}px"></div></div>
<div class="voice">{''.join(f'<div class="vline" style="left:{(v["cue"] - v["lead"]) / at(BARS + 1) * 1600:.1f}px;width:{v["dur"] / at(BARS + 1) * 1600:.1f}px" title="{html.escape(v["text"])}"></div>' for v in vo)}</div>
<div class="legend">Blue lane: voiceover (Chatterbox, built-in voice), the music ducks under it. Dark lane: soundtrack. Dashed = splice (one-beat equal-power crossfade ending on the downbeat). White = the drop (bar 9) and the final hit (bar 33).</div>
<table><tr><th>#</th><th>Scene</th><th>Bars</th><th>Time</th><th>What happens (real Oryn UI)</th><th>Voiceover</th><th>Music</th></tr>{''.join(rows)}</table>
</div></body></html>'''


async def main(base):
    with open(base + '.html', 'w') as f:
        f.write(page())
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, headless=True)
        pg = await browser.new_page(viewport={'width': 1680, 'height': 900}, device_scale_factor=2)
        await pg.goto('file://' + os.path.abspath(base + '.html'))
        await pg.screenshot(path=base + '.png', full_page=True)
        await browser.close()
    print('wrote', base + '.html', base + '.png')


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1]))
