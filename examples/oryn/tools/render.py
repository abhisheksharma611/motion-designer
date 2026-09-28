import asyncio
import os
import sys

from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.join(os.path.dirname(HERE), 'film', 'index.html')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def parse_time(s):
    if s.startswith('b'):
        bar, beat = s[1:].split('.', 1) if '.' in s[1:] else (s[1:], '1')
        return ('bar', float(bar), float(beat))
    return ('sec', float(s))


async def main(out_dir, specs):
    os.makedirs(out_dir, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, headless=True, args=['--allow-file-access-from-files'])
        page = await browser.new_page(viewport={'width': 1440, 'height': 1440}, device_scale_factor=1)
        page.on('pageerror', lambda e: print('[pageerror]', e))
        page.on('console', lambda m: m.type == 'error' and print('[console]', m.text))
        await page.goto('file://' + FILM)
        await page.wait_for_function('window.film !== undefined', timeout=20000)
        await page.evaluate('window.film.ready')
        for spec in specs:
            name, tstr = spec.split('=', 1)
            kind = parse_time(tstr)
            t = await page.evaluate(f'window.film.at({kind[1]}, {kind[2]})') if kind[0] == 'bar' else kind[1]
            await page.evaluate(f'window.film.remount({t})')
            await page.evaluate('window.film.settled()')
            await page.evaluate(f'window.film.remount({t})')
            await page.evaluate('window.film.settled()')
            await page.screenshot(path=os.path.join(out_dir, f'{name}.png'), clip={'x': 0, 'y': 0, 'width': 1440, 'height': 1440})
            print(f'{name}: t={t:.3f}s')
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1], sys.argv[2:]))
