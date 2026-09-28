# Design notes

## Principles

- **Real UI only.** Every screen is the Oryn frontend from the current working tree, driven
  through its own controls (sidebar, context menu, command palette, Multi-Rename, Git
  overlay, terminal drawer). The film only moves the camera, the pointer, and the timing.
- **Show the change.** A cut never hides what changed. Lists swap in place, overlays grow
  from the row that opened them, and the camera settles before the next action lands.
- **Deterministic.** `seek(t)` is pure. Motion uses closed-form damped springs; additive
  spring chains keep interrupted moves continuous in position and velocity.

## Look

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#EEE9E1` | Warm neutral stage, a soft radial lift to `#F3EFE9` in the centre |
| `--ink` | `#141416` | Wordmark, tagline, row pill |
| `--muted` | `#6F6A62` | Device labels |
| accent | Oryn's own selection blue | Only where the app itself uses it |

No glass, particles, 3D flips or random cursor paths. The only 3D is the MacBook lid on its
hinge. It is flattened (no transform) whenever it is at rest, so the app stays crisp.

## Rhythm

128 BPM, 36 bars. The transfer completes on the music's drop (bar 9). The final hit
(bar 33) lands as the camera returns to the MacBook and the lid closes into the row. See
`out/beatmap.png` for every cue.

## Devices and desktops

The MacBook is drawn in CSS: deck, lip, and a lid with an aluminium back and a notch. The
app runs live inside it, under a macOS menu bar. It opens the film and closes it.

For the platform tour, the hardware retracts onto the edges of the screen. What is left is
the macOS desktop as a bare card. Windows and Linux desktops then wipe in around the same
Oryn window: same state, same position. Only the platform differences change: the
`platform-windows` class the app sets there (caption buttons instead of traffic lights), and
the drive and home strings the real app shows (`C:` / `Local Disk (C:)`, `Root (/)` /
`File System`). The desktops (wallpaper, taskbar, top bar, dock) are simple CSS stand-ins
with no OS logos. Oryn is a desktop app, so no phone is shown.

## Voice

Seventeen short lines, each landing on the cue of the moment it describes (see the beat
map's voice lane). They only name what is on screen: nothing about speed or scale. The
voice is levelled, lightly compressed and peak-limited. The music dips 6–12 dB under each
line, so speech sits about 9 dB above it; the drop (bar 9) and the final hit (bar 33) stay
clear of speech. The mix is -14 LUFS, true peak about -1.8 dBTP.

## Legibility on phones

The film is square and usually watched on a phone at about 390 px wide. The camera
works zoomed in: app text renders at 1.3–1.9× (≈ 17–25 px on the 1440 master). Each frame
re-creates the app document (`film.remount`), so zoomed text stays sharp.

## Loop

The film opens and closes on the same lockup, in the same place and at the same size on
the warm canvas. The last frame adds "Your files. In flow." beneath it, so a loop reads as
the tagline stepping away.
