# Rolyn

An iOS personal finance app. 46.5 s, 1440 × 1440, 60 fps, 129 BPM (100 beats, 25 bars), in the Meadow style,
inside an iPhone, with music and an English voiceover.

- [`preview.mp4`](preview.mp4) is the film at 1080 with its music and voiceover.
- [`dist/rolyn-launch-film.html`](dist/rolyn-launch-film.html) is the whole film in one file. Open it in Chrome,
  press Play and scrub.
- [`src/`](src/) has the sources: `index.html`, `core.js`, `ui.js`, `scenes.js`, and `assets.js` with the app's
  font, SF Symbols and logos.

Rolyn's real screens are rebuilt in HTML from the app's SwiftUI code and 3× Simulator screenshots, and the
iPhone never leaves the frame. A brand dot draws the balance line and the phone forms around it. Then the film
goes through what the app does: accounts, voice entry, receipt scanning, six months of cash flow, categories,
budgets and Home Screen widgets. It closes onto the app icon, the icon turns back into the dot in the wordmark,
and the last frame matches the first.

| Beats | Time | What happens |
|---|---|---|
| 1–6 | 0:00 | Wordmark; the dot draws the 30-day balance line and the iPhone forms around it |
| 7–18 | 0:02.8 | Header and account pills; Main card, Savings, All; recent operations |
| 19–36 | 0:08.4 | Voice entry: the phrase appears next to the phone as it is said, the form opens filled in, Save |
| 37–52 | 0:16.7 | Receipt scan: the scanner finds the receipt, reads it, and the expense is added |
| **53** | **0:24.2** | **Drop:** the new row grows into the Cash-flow card |
| 54–68 | 0:24.7 | Six months of weekly bars, then the categories one by one |
| 69–84 | 0:31.6 | The Food budget card and its forecast |
| 85–100 | 0:39.1 | "Stored on your device by default.", Home Screen widgets, the icon, the dot, the wordmark |

## Music and voice

The music is "Digital Clouds" by Alejandro Magaña from Mixkit, under the
[Mixkit Stock Music Free License](https://mixkit.co/license/). The video carries it, but the track itself isn't
in this repository. The English voiceover was made locally with Chatterbox (Resemble AI, MIT) and mixed over the
music at −16 LUFS.

To play `src/index.html` in sync, download the track from
[Mixkit](https://mixkit.co/free-stock-music/tag/technology/) into `audio/source/` and run this from the folder:

```bash
python3 ../../skills/motion-designer/scripts/beats.py audio/source/mixkit-digital-clouds-175.mp3 --json audio/grid.json
python3 ../../skills/motion-designer/scripts/music_edit.py audio/source/mixkit-digital-clouds-175.mp3 audio/grid.json --from-bar 4 --bars 25 --out audio/digital-clouds-edit
```

Without the track the player runs on a silent clock.

## Notes

- All data is made up. The merchant logos (Nike, Starbucks, Lidl, H&M, Uber Eats) are trademarks of their
  owners and appear the way the app shows them in a list of payments.
- Voice entry is opt-in and sends the recording to Rolyn's server, so the film shows it in use and never calls
  it on-device. Receipt scanning runs on the device and is on by default.
