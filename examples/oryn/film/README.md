# Oryn: Files, in motion

A 67.5 s launch film for Oryn: 1440 × 1440, 60 fps, 36 bars at 128 BPM. Every frame is a
pure function of time (`film.seek(t)`), and every piece of UI is the real Oryn frontend
captured from a production build, not a redraw.

## Layout

| Path | What it is |
| --- | --- |
| `film/index.html` | The composition: warm canvas, the MacBook, the Windows and Linux desktops, wordmark, tagline. |
| `film/film.js` | Timeline (`T`), springs, camera, and the per-scene state functions behind `seek(t)`. |
| `film/app-bundle.js` | Captured Oryn DOM states and stylesheet (generated). |
| `film/mark.js`, `film/assets/` | Traced Oryn mark, dock icons, repository screenshots used as file thumbnails (generated). |
| `tools/mock_backend.js` | Mocked Tauri IPC for the capture: file system, zip VFS, git, PTY, SFTP, transfers. |
| `tools/capture.py` | Drives the real build through each scene and saves DOM + CSS states. |
| `tools/build_bundle.py` | Turns the captured states into `film/app-bundle.js`. |
| `tools/logo_trace.py` | Traces the Oryn mark from the app icon into an SVG with two pieces. |
| `tools/audio_edit.py` | Cuts the soundtrack to the 36-bar beat map. |
| `tools/voiceover.py` | Generates the voiceover lines with the local Chatterbox model (built-in voice). |
| `tools/mix_vo.py` | Places each line on its cue, ducks the music under it, normalises to -14 LUFS, writes captions. |
| `tools/render.py` | Renders stills: `render.py OUT name=b9.1 name2=12.5`. |
| `tools/render_video.py` | Renders every frame with parallel headless Chrome pages. |
| `tools/frame_diff.py` | Flags consecutive-frame spikes (pops) with their bar.beat. |
| `tools/beatmap.py` | Renders the beat map (`out/beatmap.png`). |

## Preview

Open `film/index.html` in Chrome and scrub from the console: `film.seek(film.at(9, 1))`.
`film.T` lists every cue; `film.at(bar, beat)` converts the musical grid to seconds.

## Rebuild

```sh
# from the repository root: a production build of the current working tree
npx vite build --outDir "$PWD/tmp/launch-film/oryn-dist" --emptyOutDir

cd tmp/launch-film
python3 tools/capture.py          # app/states/*.json, work/capture/*.png
python3 tools/build_bundle.py     # film/app-bundle.js, film/mark.js
python3 tools/audio_edit.py audio/film_edit.wav
ffmpeg -i audio/film_edit.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null -
# second pass with the measured values, linear=true, -ar 48000 -> audio/film_mix.wav
HF_HUB_OFFLINE=1 ~/.cache/rolyn-film/chatterbox/bin/python tools/voiceover.py   # audio/vo/*.wav, manifest.json
~/.cache/rolyn-film/chatterbox/bin/python tools/mix_vo.py                       # audio/film_mix_vo.wav, out/*.srt
python3 tools/render_video.py work/frames --workers 8
python3 tools/frame_diff.py work/frames
ffmpeg -framerate 60 -i work/frames/%05d.png -i audio/film_mix_vo.wav -map 0:v -map 1:a \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 14 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart out/oryn-files-in-motion.mp4
```

`render_video.py` calls `film.remount(t)` for every frame. It rebuilds the app document
before seeking because Chrome keeps the raster scale it chose for the iframe layers during
a continuous zoom, so sequential seeks drift soft.

`tools/voiceover.py 15` regenerates a single line (with more seeds) and keeps the others.
Each line is picked from several seeds by how well its length fits the text, with no long
gaps or trailing noise. Listen to the result: the picker cannot judge pronunciation.

## Voice

Chatterbox TTS by Resemble AI (MIT licence), built-in voice, run offline from the local
cache. Chatterbox embeds its Perth watermark in the audio it produces. "Oryn" is spoken as
"Orin" (the `say` column in `tools/voiceover.py`); change it there if it should sound
different. `out/oryn-files-in-motion.srt` carries the lines as captions for muted autoplay.

## Music

"Ethereal Pulse" by Surf House Productions, https://surf-house-productions.bandcamp.com
Royalty Free Music by https://www.free-stock-music.com
Licensed under Creative Commons Attribution 4.0 (CC BY 4.0). Keep this credit wherever the
film is published, or buy the track license on Bandcamp to publish without it.
