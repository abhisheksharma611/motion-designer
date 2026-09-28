from pathlib import Path
import asyncio
import json
import mimetypes
import os
import re
import sys
from urllib.parse import unquote, urlparse

from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIST = os.path.join(ROOT, 'oryn-dist')
REPO = os.environ.get('ORYN_REPO', str(Path(__file__).resolve().parents[3]))
OUT = os.path.join(ROOT, 'app')
SHOTS = os.path.join(ROOT, 'work', 'capture')
ORIGIN = 'http://oryn.test'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
VIEW = {'width': 1280, 'height': 800}

ICON = lambda n: os.path.join(REPO, 'public', 'dock-icons', f'{n}.png')
MEDIA = {
    'Frame 12.png': ICON(6), 'Frame 13.png': ICON(7), 'Frame 13 copy.png': ICON(8),
    'Frame 14.png': ICON(9), 'Frame 14 copy.png': ICON(10), 'Frame 15.png': ICON(2),
    'app-icon.png': ICON(1),
    'oryn-dual-pane.png': os.path.join(REPO, 'screenshots', 'oryn_dual_pane.png'),
    'oryn-grid-view.png': os.path.join(REPO, 'screenshots', 'oryn_grid_view.png'),
    'oryn-columns.png': os.path.join(REPO, 'screenshots', 'oryn_miller_columns.png'),
    'oryn-terminal.png': os.path.join(REPO, 'screenshots', 'oryn_terminal_drawer.png'),
}
RENAMED_ORDER = [ICON(6), ICON(8), ICON(7), ICON(10), ICON(9), ICON(2)]

PRESS_RELEASE = """# Oryn 0.0.6

**Oryn** is a keyboard-driven, dual-pane file manager for macOS and Windows, built with Tauri and Rust.

## What's new
- **Grid view with lazy thumbnails** for images, with an in-memory cache.
- **SFTP, on by default** — browse and transfer to remote servers from either pane.
- **APFS clonefile transfers** — copies on APFS volumes are up to 6.1× faster.
- **Terminal drawer** with ANSI colours that follows the active pane.

## Availability
Oryn 0.0.6 is available now for macOS (Apple silicon and Intel) and Windows.
"""


def media_path(name):
    if name in MEDIA:
        return MEDIA[name]
    m = re.search(r'(\d+)\.png$', name)
    if name.startswith('oryn-icon') and m:
        return RENAMED_ORDER[(int(m.group(1)) - 1) % len(RENAMED_ORDER)]
    return None


async def route(route_obj):
    path = unquote(urlparse(route_obj.request.url).path)
    if path.startswith('/__media/'):
        full = unquote(path[len('/__media/'):])
        if '.zip/' in full or full.startswith('sftp:'):
            return await route_obj.fulfill(status=404, body='')
        fp = media_path(os.path.basename(full))
        if fp and os.path.exists(fp):
            return await route_obj.fulfill(path=fp, content_type='image/png')
        return await route_obj.fulfill(status=404, body='')
    fp = os.path.join(DIST, path.lstrip('/')) if path != '/' else os.path.join(DIST, 'index.html')
    if os.path.isfile(fp):
        return await route_obj.fulfill(path=fp, content_type=mimetypes.guess_type(fp)[0] or 'application/octet-stream')
    return await route_obj.fulfill(status=404, body='')


async def snapshot(page, name, wait=350):
    os.makedirs(SHOTS, exist_ok=True)
    os.makedirs(os.path.join(OUT, 'states'), exist_ok=True)
    await page.wait_for_timeout(wait)
    await page.screenshot(path=os.path.join(SHOTS, f'{name}.png'))
    dom = await page.evaluate("""() => {
        const b = document.body.cloneNode(true);
        b.querySelectorAll('script').forEach(s => s.remove());
        const live = document.body.querySelectorAll('input, textarea, select');
        const copy = b.querySelectorAll('input, textarea, select');
        live.forEach((el, i) => {
            const c = copy[i];
            if (el.tagName === 'SELECT') { c.querySelectorAll('option').forEach(o => o.toggleAttribute('selected', o.value === el.value)); }
            else if (el.type === 'checkbox') { c.toggleAttribute('checked', el.checked); }
            else { c.setAttribute('value', el.value); if (el.tagName === 'TEXTAREA') c.textContent = el.value; }
        });
        return { html: b.outerHTML, bodyClass: document.body.className };
    }""")
    with open(os.path.join(OUT, 'states', f'{name}.json'), 'w') as f:
        json.dump(dom, f)
    print('  saved', name, flush=True)


async def save_css(page):
    css = await page.evaluate("""() => {
        const out = [];
        const walk = (sheet) => { for (const r of sheet.cssRules) {
            if (r instanceof CSSImportRule && r.styleSheet) walk(r.styleSheet); else out.push(r.cssText); } };
        for (const s of document.styleSheets) { try { walk(s); } catch (e) {} }
        return out.join('\\n');
    }""")
    with open(os.path.join(OUT, 'oryn.css'), 'w') as f:
        f.write(css)


def row(page, side, text):
    return page.locator(f'#list-{side} .row', has=page.locator('.row-name-text', has_text=re.compile(rf'^{re.escape(text)}$')))


async def open_row(page, side, text):
    await row(page, side, text).click()
    await page.wait_for_timeout(150)
    await row(page, side, text).dblclick()
    await page.wait_for_timeout(450)


async def boot(p, platform='mac'):
    browser = await p.chromium.launch(executable_path=CHROME, headless=True)
    ctx = await browser.new_context(viewport=VIEW, device_scale_factor=1)
    await ctx.route(f'{ORIGIN}/**', route)
    text = {'press-release.md': PRESS_RELEASE, 'changelog.md': open(os.path.join(REPO, 'CHANGELOG.md')).read()}
    git = json.load(open(os.path.join(OUT, 'git_data.json')))
    await ctx.add_init_script(f'window.__ORYN_TEXT__ = {json.dumps(text)}; window.__ORYN_GIT__ = {json.dumps(git)}; window.__ORYN_PLATFORM__ = {json.dumps(platform)};')
    await ctx.add_init_script(path=os.path.join(HERE, 'mock_backend.js'))
    page = await ctx.new_page()
    page.on('pageerror', lambda e: print('  [pageerror]', e))
    await page.goto(f'{ORIGIN}/')
    await page.wait_for_selector('#list-left .row', timeout=10000)
    await page.wait_for_timeout(700)
    return browser, page


async def wait_thumbs(page):
    for _ in range(20):
        n = await page.evaluate("[...document.querySelectorAll('img.row-thumbnail')].filter(i => i.naturalWidth > 0).length")
        if n:
            return n
        await page.wait_for_timeout(100)
    return 0


async def main_flow(p):
    browser, page = await boot(p)
    await snapshot(page, '00_boot')
    await open_row(page, 'left', 'Downloads')
    await open_row(page, 'right', 'Desktop')
    await open_row(page, 'right', 'Press Kit')
    await row(page, 'left', 'Frame 12.png').click()
    await wait_thumbs(page)
    await snapshot(page, '01_dual')

    for i in range(6):
        await page.keyboard.press('Insert')
        await snapshot(page, f'02_mark_{i + 1}', 150)
    await page.evaluate("window.__mockHold.copy = true")
    await page.keyboard.press('F5')
    await page.wait_for_timeout(500)
    await page.evaluate("""window.__mockTasks.forEach((t, i) => window.__mockEmit('fs:copyProgress',
        {type: 'file', taskId: t.taskId, bytes: [640000, 360000][i] || 0, total: 1000000, path: t.name}))""")
    await snapshot(page, '03_xfer')
    await page.evaluate("window.__mockRelease('copy')")
    await page.wait_for_timeout(1500)
    await snapshot(page, '04_done')

    await row(page, 'right', 'Frame 13.png').click()
    await page.click('#btn-view-grid')
    loaded = await wait_thumbs(page)
    await page.wait_for_timeout(600)
    print('  grid thumbnails loaded without workaround:', loaded)
    await snapshot(page, '05_grid')
    await page.click('button[data-cmd="viewFile"]')
    await page.wait_for_timeout(1000)
    await snapshot(page, '06_preview_img')
    await page.keyboard.press('Escape')
    await page.wait_for_timeout(300)

    await page.click('#btn-view-list')
    await page.wait_for_timeout(300)
    await row(page, 'right', 'press-release.md').click()
    await page.click('button[data-cmd="viewFile"]')
    await page.wait_for_timeout(1000)
    await snapshot(page, '07_preview_md')
    await page.keyboard.press('Escape')
    await page.wait_for_timeout(300)

    await page.click('#btn-view-columns')
    await page.wait_for_timeout(700)
    await snapshot(page, '08_columns')
    shots = page.locator('#pane-right .columns-container .row', has=page.locator('.row-name-text', has_text=re.compile(r'^screenshots$')))
    await shots.click()
    await page.wait_for_timeout(700)
    await snapshot(page, '08b_columns_nav')
    await page.click('#btn-view-list')
    await page.wait_for_timeout(300)
    await page.click('#btn-nav-up')
    await page.wait_for_timeout(500)
    await row(page, 'right', 'Frame 13.png').click()
    await page.wait_for_timeout(200)

    await page.click('#filter-input')
    typed = ''
    for ch in 'frame':
        typed += ch
        await page.keyboard.type(ch)
        await snapshot(page, f'10_filter_{typed}', 250)
    await row(page, 'right', 'Frame 12.png').click()
    for i in range(6):
        await page.keyboard.press('Insert')
        await snapshot(page, f'11_mark_{i + 1}', 150)

    await page.keyboard.press('Meta+m')
    await page.wait_for_timeout(600)
    await snapshot(page, '12_rename_open')
    await page.click('#mr-find')
    typed = ''
    for ch in 'Frame.*':
        typed += ch
        await page.keyboard.type(ch)
        await snapshot(page, f'13_find_{len(typed)}', 150)
    await page.check('#mr-regex')
    await snapshot(page, '13_regex', 200)
    await page.fill('#mr-replace', 'oryn-icon-[C]')
    await page.dispatch_event('#mr-replace', 'input')
    await snapshot(page, '13_replace_full', 300)
    await page.click('#mr-apply-btn')
    await page.wait_for_timeout(900)
    await snapshot(page, '14_renamed')
    await page.fill('#filter-input', '')
    await page.dispatch_event('#filter-input', 'input')
    await page.keyboard.press('Escape')
    await page.wait_for_timeout(400)
    await page.locator('#sidebar .sidebar-item[data-path$="/Desktop/Press Kit"]').first.click()
    await page.wait_for_timeout(700)
    await wait_thumbs(page)
    footer = await page.evaluate("document.querySelector('footer').innerText.split('\\n')[0]")
    print('  footer after re-open:', footer)
    await snapshot(page, '14c_clean')

    await row(page, 'left', 'Oryn-brand-assets.zip').click()
    await snapshot(page, '15_zip_cursor', 250)
    await row(page, 'left', 'Oryn-brand-assets.zip').dblclick()
    await page.wait_for_timeout(700)
    await snapshot(page, '15b_zip_open')
    await open_row(page, 'left', 'logo')
    await snapshot(page, '15c_zip_logo')

    await page.locator('#sidebar .sidebar-item[data-path$="/Projects/Oryn"]').first.click()
    await page.wait_for_timeout(900)
    await snapshot(page, '16_git_root')
    await open_row(page, 'left', 'desktop')
    await open_row(page, 'left', 'src')
    await open_row(page, 'left', 'services')
    await row(page, 'left', 'fs_listing.rs').click()
    await snapshot(page, '16b_git_services', 300)
    await row(page, 'left', 'fs_listing.rs').click(button='right')
    await page.wait_for_timeout(400)
    await snapshot(page, '16c_git_ctx')
    await page.get_by_text('Git Diff with HEAD', exact=True).click()
    await page.wait_for_timeout(900)
    await snapshot(page, '17_git_diff')
    await page.click('#git-overlay button[data-gtab="blame"]')
    await page.wait_for_timeout(700)
    blame_rows = await page.evaluate("document.querySelectorAll('#git-blame-content .git-blame-row').length")
    if not blame_rows:
        await page.fill('#git-blame-file', 'desktop/src/services/fs_listing.rs')
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(700)
    await snapshot(page, '17b_git_blame')
    await page.click('#git-overlay button[data-gtab="log"]')
    await page.wait_for_timeout(700)
    await snapshot(page, '17c_git_log')
    await page.keyboard.press('Escape')
    await page.wait_for_timeout(400)

    await page.click('#btn-status-terminal-toggle')
    await page.wait_for_timeout(600)
    await snapshot(page, '18_term_open')
    await page.click('#terminal-output')
    await page.wait_for_timeout(200)
    await page.keyboard.type('git log --oneline -5', delay=25)
    await snapshot(page, '18b_term_typed', 200)
    await page.keyboard.press('Enter')
    await page.wait_for_timeout(700)
    await snapshot(page, '18c_term_out')
    await page.click('#terminal-close-btn')
    await page.wait_for_timeout(400)

    await row(page, 'left', 'fs_listing.rs').click()
    await page.keyboard.press('Meta+k')
    await page.wait_for_timeout(400)
    await snapshot(page, '19_palette_open')
    typed = ''
    for ch in 'press':
        typed += ch
        await page.keyboard.type(ch)
        await snapshot(page, f'19_palette_{typed}', 200)
    await page.keyboard.press('Enter')
    await page.wait_for_timeout(1200)
    await snapshot(page, '20_remote')
    await row(page, 'left', 'icons').click()
    await snapshot(page, '20b_remote_cursor', 250)
    await row(page, 'left', 'icons').dblclick()
    await page.wait_for_timeout(900)
    await snapshot(page, '20c_remote_icons')

    await row(page, 'right', 'oryn-icon-01.png').click()
    for i in range(6):
        await page.keyboard.press('Insert')
        await snapshot(page, f'21_upmark_{i + 1}', 150)
    await page.evaluate("window.__mockHold.upload = true")
    await page.keyboard.press('F5')
    await page.wait_for_timeout(500)
    await snapshot(page, '21b_uploading')
    await page.evaluate("window.__mockRelease('upload')")
    await page.wait_for_timeout(1500)
    await snapshot(page, '22_uploaded')
    await save_css(page)
    await browser.close()


async def platform_flow(p, platform):
    browser, page = await boot(p, platform)
    await open_row(page, 'left', 'Downloads')
    await open_row(page, 'right', 'Desktop')
    await open_row(page, 'right', 'Press Kit')
    await row(page, 'right', 'app-icon.png').click()
    await page.click('#btn-view-grid')
    await wait_thumbs(page)
    await snapshot(page, f'{platform}_grid', 700)
    await browser.close()


async def main():
    async with async_playwright() as p:
        await main_flow(p)
        for platform in ['win', 'linux']:
            await platform_flow(p, platform)


if __name__ == '__main__':
    asyncio.run(main())
