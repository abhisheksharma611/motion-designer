# Oryn

A desktop file manager. 67.5 s, 1440 × 1440, 60 fps, 128 BPM (36 bars), in the Warm ink style, on a MacBook
and then on macOS, Windows and Linux desktops, with music and an English voiceover.

- [`preview.mp4`](preview.mp4) is the film at 1080 with its music and voiceover.
- [`beatmap.png`](beatmap.png) shows every cue on the bar grid, with the voice lane.
- [`captions.srt`](captions.srt) has the voiceover lines for muted autoplay.
- [`film/`](film/) is the film itself, and [`tools/`](tools/) the capture, audio and render pipeline.

All the interface in this film is the real Oryn frontend, a Tauri 2 app, captured from a production build with
a mocked backend ([capture](../../skills/motion-designer/reference/capture.md)). The film only moves the camera,
the pointer and the timing.

The letters of the wordmark draw together into a file row. The row becomes a closed MacBook, the lid opens and
Oryn builds up on screen. In dual panes six files are selected and dragged across, and the transfer finishes on
the drop at bar 9. A thumbnail lifts into an image preview, then a Markdown preview, then Column view. A filter
narrows the list into a selection, followed by a batch rename with a live preview. A `.zip` opens like a folder,
then come the Git overlays (diff, blame, log) and the terminal drawer, and the command palette opens an SFTP
server and uploads. The laptop steps back to its desktop, Windows and Linux desktops wipe in around the same
window, and back on the MacBook the lid closes into the row. The row unfolds into the wordmark with "Your files.
In flow.", the same lockup as the first frame.

## How it was made

- `tools/mock_backend.js` answers the app's IPC (file system, zip, git, PTY, SFTP, transfers) from made-up data.
  `tools/capture.py` drives the production build through each state and saves the DOM and CSS, and
  `tools/build_bundle.py` turns them into `film/app-bundle.js`.
- `film/film.js` is the timeline: cues on the bar grid, closed-form springs, spring chains for the camera and
  the panels, and `film.remount(t)`, which rebuilds the app document for every rendered frame so zoomed text
  stays sharp.
- `film/README.md` and `film/DESIGN.md` are the film's own notes. Their commands run from the Oryn repository,
  where the pipeline lives (`tmp/launch-film/`). From anywhere else, point the tools at the app with
  `ORYN_REPO=/path/to/Oryn`.

## Music and voice

The music is "Ethereal Pulse" by Surf House Productions
([surf-house-productions.bandcamp.com](https://surf-house-productions.bandcamp.com)), royalty-free from
[free-stock-music.com](https://www.free-stock-music.com) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Keep that credit wherever the film is published. The voiceover is seventeen short English lines made locally with
Chatterbox (Resemble AI, MIT), each one on the cue it describes, with the music ducked under it.
