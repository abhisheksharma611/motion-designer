---
description: The skill's music part finds tempo, downbeat and the first drop of a track, and cuts 8 bars so the drop lands on film beat 17.
tags: [music]
expected_outcome: 124 BPM; the first drop is track bar 9 (about 15.85 s); the cut is bars 5–12 (about 8.11 s to 23.60 s), 32 beats, 929 frames at 60 fps.
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
---

track.wav in this folder is the music for my app's launch film. The film is exactly 8 bars long and its key reveal is on beat 17, and I want the track's first big drop to hit exactly there. Cut the track to fit and save the cut as edit.wav in this folder. Then tell me the tempo, which part of the track you used, and how many beats and frames (at 60 fps) the film should be.
