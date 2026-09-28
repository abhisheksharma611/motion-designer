from pathlib import Path
import json
import os
import re
from urllib.parse import unquote

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STATES = os.path.join(ROOT, 'app', 'states')
FILM = os.path.join(ROOT, 'film')
REPO = os.environ.get('ORYN_REPO', str(Path(__file__).resolve().parents[3]))

ICON_OF = {
    'Frame 12.png': 6, 'Frame 13.png': 7, 'Frame 13 copy.png': 8, 'Frame 14.png': 9,
    'Frame 14 copy.png': 10, 'Frame 15.png': 2, 'app-icon.png': 1,
    'oryn-icon-01.png': 6, 'oryn-icon-02.png': 8, 'oryn-icon-03.png': 7,
    'oryn-icon-04.png': 10, 'oryn-icon-05.png': 9, 'oryn-icon-06.png': 2,
}
SHOT_OF = {
    'oryn-dual-pane.png': 'oryn_dual_pane', 'oryn-grid-view.png': 'oryn_grid_view',
    'oryn-columns.png': 'oryn_miller_columns', 'oryn-terminal.png': 'oryn_terminal_drawer',
}


def state(name):
    with open(os.path.join(STATES, f'{name}.json')) as f:
        return json.load(f)['html']


def media_url(name, size=''):
    n = ICON_OF.get(name)
    if n:
        return f'assets/icons/{size}{n}.png'
    if name in SHOT_OF:
        return f'assets/shots/{SHOT_OF[name]}.png'
    return None


def clean(html):
    def thumb(m):
        full = unquote(m.group(2))
        url = None if ('.zip/' in full or full.startswith('sftp:')) else media_url(os.path.basename(full), '48/')
        return f'{m.group(1)}src="{url}"' if url else ''

    def media(m):
        url = media_url(os.path.basename(unquote(m.group(1))))
        return f'src="{url}"' if url else 'src=""'

    html = re.sub(r'<img class="row-thumbnail"[^>]*src="http://oryn\.test/__media/([^"]+)"[^>]*>',
                  lambda m: m.group(0) if thumb(re.match(r'(.*)src="http://oryn\.test/__media/([^"]+)"', m.group(0))) else '', html)
    html = re.sub(r'(<img class="row-thumbnail"[^>]*?)src="http://oryn\.test/__media/([^"]+)"', thumb, html)
    html = re.sub(r'src="http://oryn\.test/__media/([^"]+)"', media, html)
    html = html.replace(' loading="lazy"', '').replace(' decoding="async"', '')
    html = re.sub(r'<img([^>]*?) src="/dock-icons/[^"]*"', r'<img\1', html)
    return html


def inner(html, open_re):
    m = re.search(open_re, html)
    if not m:
        raise KeyError(open_re)
    tag = re.match(r'<([a-z0-9]+)', m.group(0)).group(1)
    depth, i = 1, m.end()
    pat = re.compile(rf'<(/?){tag}\b[^>]*>')
    while depth:
        t = pat.search(html, i)
        depth += -1 if t.group(1) else 1
        i = t.end()
        if depth == 0:
            return html[m.end():t.start()]


def outer(html, open_re):
    m = re.search(open_re, html)
    tag = re.match(r'<([a-z0-9]+)', m.group(0)).group(1)
    return m.group(0) + inner(html, open_re) + f'</{tag}>'


def rows(html, side):
    return clean(inner(html, rf'<div class="pane-list[^"]*" id="list-{side}"[^>]*>'))


def chrome_of(st):
    h = state(st)
    return {
        'header': clean(outer(h, r'<header class="mac-header"[^>]*>')),
        'nav': clean(outer(h, r'<section class="mac-nav-bar"[^>]*>')),
        'footer': clean(outer(h, r'<footer[^>]*>')),
        'sidebar': clean(outer(h, r'<aside[^>]*id="sidebar"[^>]*>')),
    }


def columns_of(st):
    h = state(st)
    out = {}
    for side in ['left', 'right']:
        i = h.index(f'id="pane-{side}"')
        try:
            out[side] = clean(inner(h[i:], r'<div class="columns-container"[^>]*>'))
        except KeyError:
            out[side] = ''
    return out


def main():
    os.makedirs(os.path.join(FILM, 'assets', 'icons'), exist_ok=True)
    os.makedirs(os.path.join(FILM, 'assets', 'shots'), exist_ok=True)
    for n in sorted(set(ICON_OF.values())):
        im = Image.open(os.path.join(REPO, 'public', 'dock-icons', f'{n}.png')).convert('RGBA')
        im.resize((768, 768), Image.LANCZOS).save(os.path.join(FILM, 'assets', 'icons', f'{n}.png'), optimize=True)
        for size in (48, 160):
            os.makedirs(os.path.join(FILM, 'assets', 'icons', str(size)), exist_ok=True)
            im.resize((size, size), Image.LANCZOS).save(os.path.join(FILM, 'assets', 'icons', str(size), f'{n}.png'), optimize=True)
    for shot in SHOT_OF.values():
        Image.open(os.path.join(REPO, 'screenshots', f'{shot}.png')).convert('RGB').save(os.path.join(FILM, 'assets', 'shots', f'{shot}.png'), optimize=True)

    css = open(os.path.join(ROOT, 'app', 'oryn.css')).read()
    body = clean(inner(state('01_dual'), r'<body[^>]*>'))

    lists = {
        'home_left': rows(state('00_boot'), 'left'),
        'home_right': rows(state('00_boot'), 'right'),
        'downloads': rows(state('01_dual'), 'left'),
        'presskit': rows(state('01_dual'), 'right'),
        'presskit_after': rows(state('04_done'), 'right'),
        'presskit_renamed': rows(state('14c_clean'), 'right'),
        'zip_root': rows(state('15b_zip_open'), 'left'),
        'zip_logo': rows(state('15c_zip_logo'), 'left'),
        'git_root': rows(state('16_git_root'), 'left'),
        'git_services': rows(state('16b_git_services'), 'left'),
        'remote_press': rows(state('20_remote'), 'left'),
        'remote_icons': rows(state('20c_remote_icons'), 'left'),
        'remote_icons_full': rows(state('22_uploaded'), 'left'),
    }
    for q in ['f', 'fr', 'fra', 'fram', 'frame']:
        lists[f'filter_{q}'] = rows(state(f'10_filter_{q}'), 'right')

    chrome_states = {
        'home': '00_boot', 'downloads': '01_dual', 'done': '04_done', 'grid': '05_grid', 'presskit': '08_columns',
        'columns_nav': '08b_columns_nav', 'renamed': '14c_clean', 'zip_cursor': '15_zip_cursor', 'zip_open': '15b_zip_open',
        'zip_logo': '15c_zip_logo', 'git_root': '16_git_root', 'git_services': '16b_git_services', 'palette': '19_palette_open',
        'remote': '20_remote', 'remote_cursor': '20b_remote_cursor', 'remote_icons': '20c_remote_icons', 'uploaded': '22_uploaded',
    }
    for n in range(1, 7):
        chrome_states[f'dl_mark_{n}'] = f'02_mark_{n}'
        chrome_states[f'mark_{n}'] = f'11_mark_{n}'
        chrome_states[f'upmark_{n}'] = f'21_upmark_{n}'
    for q in ['f', 'fr', 'fra', 'fram', 'frame']:
        chrome_states[f'filter_{q}'] = f'10_filter_{q}'
    chrome = {key: chrome_of(st) for key, st in chrome_states.items()}

    overlay_of = lambda st, id_: clean(outer(state(st), rf'<div id="{id_}"[^>]*>'))
    overlays = {
        'xfer': overlay_of('03_xfer', 'nx-xfer'),
        'viewer_img': overlay_of('06_preview_img', 'viewer-overlay'),
        'viewer_md': overlay_of('07_preview_md', 'viewer-overlay'),
        'rename_open': overlay_of('12_rename_open', 'multi-rename-overlay'),
        'rename_regex': overlay_of('13_regex', 'multi-rename-overlay'),
        'rename_replace': overlay_of('13_replace_full', 'multi-rename-overlay'),
        'ctx_git': overlay_of('16c_git_ctx', 'ctx-menu'),
        'git_diff': overlay_of('17_git_diff', 'git-overlay'),
        'git_blame': overlay_of('17b_git_blame', 'git-overlay'),
        'git_log': overlay_of('17c_git_log', 'git-overlay'),
        'term_open': overlay_of('18_term_open', 'terminal-drawer'),
        'term_typed': overlay_of('18b_term_typed', 'terminal-drawer'),
        'term_out': overlay_of('18c_term_out', 'terminal-drawer'),
        'palette_open': overlay_of('19_palette_open', 'command-palette-overlay'),
    }
    for i in range(1, 8):
        overlays[f'rename_find_{i}'] = overlay_of(f'13_find_{i}', 'multi-rename-overlay')
    for q in ['p', 'pr', 'pre', 'pres', 'press']:
        overlays[f'palette_{q}'] = overlay_of(f'19_palette_{q}', 'command-palette-overlay')

    platforms = {}
    for pf in ['win', 'linux']:
        st = json.load(open(os.path.join(STATES, f'{pf}_grid.json')))
        platforms[pf] = {'body': clean(inner(st['html'], r'<body[^>]*>')), 'bodyClass': st['bodyClass']}

    bundle = {
        'css': css, 'body': body, 'lists': lists, 'chrome': chrome, 'overlays': overlays,
        'columns': columns_of('08_columns'), 'columnsNav': columns_of('08b_columns_nav'), 'platforms': platforms,
    }
    mark = json.load(open(os.path.join(ROOT, 'work', 'oryn-mark.json')))
    with open(os.path.join(FILM, 'mark.js'), 'w') as f:
        f.write('window.ORYN_MARK = ' + json.dumps(mark) + ';\n')
    with open(os.path.join(FILM, 'app-bundle.js'), 'w') as f:
        f.write('window.ORYN_APP = ' + json.dumps(bundle) + ';\n')
    print('bundle bytes', os.path.getsize(os.path.join(FILM, 'app-bundle.js')), 'lists', len(lists), 'chrome', len(chrome), 'overlays', len(overlays))


if __name__ == '__main__':
    main()
