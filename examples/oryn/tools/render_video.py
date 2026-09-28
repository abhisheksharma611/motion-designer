import argparse
import asyncio
import os
import time

from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.join(os.path.dirname(HERE), 'film', 'index.html')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


async def worker(browser, frames, out_dir, fps, done):
    page = await browser.new_page(viewport={'width': 1440, 'height': 1440}, device_scale_factor=1)
    page.on('pageerror', lambda e: print('[pageerror]', e, flush=True))
    await page.goto('file://' + FILM)
    await page.wait_for_function('window.film !== undefined', timeout=20000)
    await page.evaluate('window.film.ready')
    for i in frames:
        path = os.path.join(out_dir, f'{i:05d}.png')
        if not os.path.exists(path):
            await page.evaluate(f'window.film.remount({i / fps})')
            await page.evaluate('window.film.settled()')
            await page.screenshot(path=path + '.part.png', clip={'x': 0, 'y': 0, 'width': 1440, 'height': 1440})
            os.replace(path + '.part.png', path)
        done.append(i)
    await page.close()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out_dir')
    ap.add_argument('--fps', type=int, default=60)
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--start', type=int, default=0)
    ap.add_argument('--end', type=int, default=None)
    args = ap.parse_args()
    os.makedirs(args.out_dir, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, headless=True, args=['--allow-file-access-from-files'])
        probe = await browser.new_page()
        await probe.goto('file://' + FILM)
        await probe.wait_for_function('window.film !== undefined', timeout=20000)
        duration = await probe.evaluate('window.film.DURATION')
        await probe.close()
        end = args.end if args.end is not None else int(round(duration * args.fps))
        frames = list(range(args.start, end))
        done = []
        t0 = time.time()
        jobs = [asyncio.create_task(worker(browser, frames[k::args.workers], args.out_dir, args.fps, done)) for k in range(args.workers)]
        while not all(j.done() for j in jobs):
            await asyncio.sleep(10)
            rate = len(done) / max(1e-6, time.time() - t0)
            print(f'{len(done)}/{len(frames)} frames, {rate:.1f} fps, eta {(len(frames) - len(done)) / max(rate, 1e-6):.0f}s', flush=True)
        for j in jobs:
            j.result()
        await browser.close()
        print(f'rendered {len(frames)} frames in {time.time() - t0:.0f}s')


if __name__ == '__main__':
    asyncio.run(main())
