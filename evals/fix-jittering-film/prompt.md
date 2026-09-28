---
description: A film whose dot jitters from frame to frame gets diagnosed with check.mjs, fixed at the cause, and proven fixed.
tags: [qa, film]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Edit, Write]
---

My app's launch film is in film/ (open film/src/index.html). When I render it the little dot jitters, and the loop doesn't join cleanly: the last frame isn't the same as the first. Find the cause, fix it properly, and prove to me it's fixed.
