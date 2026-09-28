film({ BPM: 128.00402947015482, BEATS: 128, holds: [] });

const APP = { word: "motion-designer", tag: "Launch films, made in Claude Code." };
const WM = { size: 128, track: -0.045, baseline: 706 };
const TOTALS = { secs: STATS.secs, out: STATS.out, read: STATS.read, calls: STATS.calls };
const RUN = { anchors: [[17, 0, 0], [18, STATS.marks.doctor.secs, STATS.marks.doctor.out], [41, STATS.marks.build.secs, STATS.marks.build.out], [65, STATS.secs, STATS.out]] };
const ST = { card: 360, tile: 177, gap: 20, x: 1150, y: 136 };
const WV = { x: 1150, y: 170, w: 740, h: 440, pad: 34, top: 108, height: 230 };
const PL = { w: 720, bar: 34 };
PL.h = PL.w + PL.bar;
const PLAYERS = { rolyn: { x: 396, y: 62, title: "rolyn-launch-film.mp4" }, oryn: { x: 660, y: 104, title: "oryn-launch-film.mp4" } };
const ROLYN = { bpm: 128.998, from: 52, length: 46.5167 };
const ORYN = ["oryn_10", "oryn_14", "oryn_18", "oryn_22", "oryn_28", "oryn_38", "oryn_44", "oryn_60"];
const STILLS = ["r_4_000", "r_12_200", "r_24_900", "r_45_800"];
const SHEET = ["r_1_200", "r_4_000", "r_6_500", "r_9_500", "r_12_200", "r_14_500", "r_17_800", "r_20_500",
  "r_23_000", "r_24_900", "r_27_500", "r_30_000", "r_33_000", "r_36_000", "r_39_500", "r_44_200"];
const CMDS = [
  ["/add-dir", "Add a new working directory"], ["/agents", "Manage agent configurations"],
  ["/clear", "Clear conversation history and free up context"], ["/compact", "Clear history but keep a summary in context"],
  ["/config", "Open config panel"], ["/mcp", "Manage MCP servers"], ["/memory", "Edit Claude memory files"],
  ["/model", "Set the AI model for Claude Code"],
  ["/motion-designer", "Make a launch film for an app — mobile or desktop, cut to music…"],
  ["/permissions", "Manage allow and deny tool permission rules"],
];
const CMD = "/motion-designer", ASK = "make a video for my app", ASK2 = "add a voiceover", INSTALL = "npx skills add kaventro/motion-designer";
const VOICES = [
  ["Chatterbox", "Resemble AI · MIT", "The most natural. A timbre from a 10–20 s sample.", "about 4 GB"],
  ["Kokoro-82M", "Apache-2.0", "54 preset voices in nine languages.", "about 0.6 GB"],
  ["say", "macOS", "Drafts, for timing.", "built in"],
];

const K = {};
let ITEMS = [], UI = {};
const P8 = () => FILM.P / 8;

function timeline() {
  Object.assign(K, {
    tagOut: B(3), del: B(4), home: B(6), open: B(7), chrome: B(7.5), welcome: B(8), input: B(9),
    slash: B(10), tab: B(12), type: B(12.5), enter: B(17),
    doc: B(18), beats: B(21), grep: B(25), pack: B(29), plan: B(33), stills: B(35), stillsBack: B(39.5),
    write: B(41), check: B(43), sheet: B(49), sheetBack: B(53.5), music: B(54.5), render: B(59), drop: B(65),
    oryn: B(77), fold: B(85), ask2: B(85.5), enter2: B(87.5), question: B(88.5), half: B(90), choose: B(92.5), vo: B(93.5),
    stats: B(99), free: B(108), install: B(109), desk: B(116), laptop: B(118), close: B(120), caret: B(121),
    word: B(123), tag: B(125.5),
  });
  const chk = ["node 25.9.0", "chrome 153.0", "ffmpeg 8.1.2", "python3 3.14.5", "uv 0.11.27"]
    .map((s, i) => `<span data-k="chk${i}"><span class="ok">${G.check}</span> ${s}</span>`).join("   ");
  ITEMS = [
    user("u1", K.enter, ""),
    tool("doc", K.doc, "Bash", "bash ~/.claude/skills/motion-designer/scripts/doctor.sh", [chk, "everything required is here"],
      { outAt: [B(18.5), B(19.75)], done: B(20) }),
    tool("beats", K.beats, "Bash", "python3 …/scripts/beats.py audio/source/mixkit-digital-clouds-175.mp3",
      ["128.998 BPM, beat 0.4651 s, bar 1.8605 s, bar 1 starts at 0.159 s",
        `<span class="dim">bar  17    29.93s</span>  <span class="acc">############################</span>             <span class="acc">drop</span>`],
      { outAt: [B(21.75), B(22.5)], done: B(23) }),
    tool("grep", K.grep, "Bash", `grep -rn "I'm listening\\|Speak an expense" --include='*.swift' .`,
      [`VoiceCaptureViewModel.swift:38:  case .listening: "I'm listening…"`,
        `ActionButtonsView.swift:124:  "Speak an expense; <span class="warn">sent to Rolyn's server</span> to recognise it"`],
      { outAt: [B(25.75), B(26.5)], done: B(27) }),
    tool("pack", K.pack, "Bash", "python3 …/scripts/assets.py src/assets.js --font Manrope=… --sym assets/sym",
      ["src/assets.js: 1 fonts, 6 images, 62 symbols, 1.25 MB"], { outAt: [B(29.75)], done: B(30) }),
    say("plan", K.plan, [
      { html: "Here's the plan: <span class=\"b\">Meadow</span>, 46.5 s at 129 BPM, and four stills for your approval." },
      { html: `<span class="dim">beat  1  0:00</span>  the dot draws the balance line and the phone forms` },
      { html: `<span class="dim">beat 19  0:08</span>  voice entry: the phrase appears as it is said` },
      { html: `<span class="dim">beat 53  0:24</span>  <span class="acc">drop</span>: the new row grows into the cash-flow card` },
    ].map((r, i) => ({ ...r, at: K.plan + (i * FILM.P) / 2 }))),
    tool("write", K.write, "Write", "docs/launch-film/src/scenes.js",
      ["Wrote 1349 lines to docs/launch-film/src/scenes.js", `<span class="faint">1</span> film({ BPM: 128.998, BEATS: 100, holds: [[7.9, 3], [14.5, 2]] });`],
      { outAt: [B(41.75), B(42.25)], done: B(42.5) }),
    tool("check", K.check, "Bash", "node …/scripts/check.mjs docs/launch-film/src/index.html", [
      `<span class="ok">PASS</span>  no clock, timer, randomness or CSS animation in src/`,
      `<span class="ok">PASS</span>  every 0.05s from 0 to 46.50s without page errors`,
      `<span class="ok">PASS</span>  frames are the same whatever order they are sought in`,
      `<span class="ok">PASS</span>  the loop closes: 46.517s equals 0s`,
      `<span class="ok">all checks passed</span>`], { outAt: [B(44), B(45), B(46), B(47), B(47.75)], done: B(48) }),
    tool("sheet", K.sheet, "Bash", "node …/scripts/render.mjs sheet src/index.html out/qa/all.png 0 46.5 0.5",
      ["out/qa/all.png: 94 frames, every 0.5 s"], { outAt: [B(49.5)], done: B(49.75) }),
    tool("music", K.music, "Bash", "python3 …/music_edit.py audio/source/track.mp3 audio/grid.json --from-bar 4 --bars 25", [
      "bars 4–28: 5.7404s → 52.2571s, 100 beats at 128.998 BPM = 2791 frames",
      `track bar 17 (<span class="acc">drop</span>) → film beat 53 at 24.187s`], { outAt: [B(55.25), B(56)], done: B(56.5) }),
    tool("render", K.render, "Bash", "node …/render.mjs video src/index.html out/rolyn-launch-film.mp4 --scale 2", [
      `<span data-k="frames"></span><i class="abs" style="left:${22 * TERM.cw}px;top:9px;width:${40 * TERM.cw}px;height:5px;border-radius:3px;background:var(--hair)"></i><i class="abs" data-k="barOn" style="left:${22 * TERM.cw}px;top:9px;width:0;height:5px;border-radius:3px;background:var(--accent)"></i>`,
      `out/rolyn-launch-film.mp4: 2791 frames`], { outAt: [B(59.75), K.drop], done: K.drop }),
    done("w1", K.drop + 0.2, `Worked for ${clock(TOTALS.secs)}`),
    user("u2", K.enter2, ASK2),
    say("chosen", K.choose + 0.15, [{ html: `<span class="dim">Voice →</span> Chatterbox` }]),
    tool("vo", K.vo, "Bash", "python3 …/scripts/voiceover.py voiceover.json", [
      "n01: take 3, 1.74s, pitch range 7.7 semitones  One command in Claude Code.",
      "voice 18.4 dB above the music while speaking; music between lines -7.6 dB against the voice"], { outAt: [B(94.25), B(95)], done: B(95.5) }),
  ];
  ITEMS[0].lines[0].html = `<span class="dim">&gt;</span> <span class="sel">${CMD}</span> ${ASK}`;
  UI = {
    welcome: K.welcome,
    spin: { from: K.enter + 0.3, to: K.drop + 0.2, word: (t) => (t < K.plan ? "Analyzing…" : t < K.render ? "Choreographing…" : "Rendering…"), count: runCount },
    input: { at: K.input, text: inputText, cols: inputCols, typing: inputTyping, caret: (t) => t < K.question || t >= K.choose, bash: (t) => t >= K.install },
    menuH: (t) => (menuRows(t).length ? menuRows(t).length * TERM.lh : TERM.lh),
    askH: (t) => (t >= K.question && t < K.choose + 0.25 ? 9 * TERM.lh * prog(t, K.question, 0.2, E.snappy) : 0),
    menuOn: (t) => menuRows(t).length > 0,
  };
}
const done = (k, at, text) => ({ k, at, lines: [{ at, html: `<span class="cc" style="display:inline-block;width:9px">${STARS[4]}</span> <span class="dim">${text}</span>` }] });

function runCount(t) {
  const a = RUN.anchors.map(([b, s, n]) => [B(b), s, n]);
  if (t <= a[0][0]) return [0, 0];
  for (let i = 1; i < a.length; i++) {
    if (t < a[i][0]) {
      const p = (t - a[i - 1][0]) / (a[i][0] - a[i - 1][0]);
      return [lerp(a[i - 1][1], a[i][1], p), lerp(a[i - 1][2], a[i][2], p)];
    }
  }
  return [a[a.length - 1][1], a[a.length - 1][2]];
}

const typedAt = (t, t0, text, step) => text.slice(0, clamp(Math.floor((t - t0) / step) + 1, 0, text.length));
function inputPlain(t) {
  const slash = "/motion", step = FILM.P / 4, step2 = FILM.P * 0.15;
  if (t < K.slash) return "";
  if (t < K.tab) return typedAt(t, K.slash, slash, step);
  if (t < K.type) return CMD + " ";
  if (t < K.enter) return CMD + " " + typedAt(t, K.type, ASK, step2);
  if (t < K.ask2) return "";
  if (t < K.enter2) return typedAt(t, K.ask2, ASK2, FILM.P * 0.12);
  if (t < K.install) return "";
  return typedAt(t, K.install, INSTALL, FILM.P * 0.1);
}
const inputCols = (t) => inputPlain(t).length;
function inputText(t) {
  const s = esc(inputPlain(t));
  return s.startsWith(CMD + " ") ? `<span class="sel">${CMD}</span>${s.slice(CMD.length)}` : s;
}
const inputTyping = (t) => (t >= K.slash && t < K.tab + 0.1) || (t >= K.type && t < K.enter) || (t >= K.ask2 && t < K.enter2) || (t >= K.install && t < K.install + INSTALL.length * FILM.P * 0.1 + 0.1);
function menuRows(t) {
  if (t < K.slash || t >= K.tab) return [];
  const typed = inputPlain(t);
  return CMDS.filter(([c]) => c.startsWith(typed)).slice(0, 5);
}

function build(stage) {
  timeline();
  const img = (k) => ASSETS.img[k];
  const player = (name, p, inner) => `
    <div class="abs" data-k="pl_${name}" style="left:0;top:0;width:${PL.w}px;height:${PL.h}px">
      <div class="abs" data-k="plShadow_${name}"></div>
      <div class="abs" data-k="plClip_${name}" style="left:0;top:0;width:${PL.w}px;height:${PL.h}px;overflow:hidden;transform-origin:50% 50%">
        <div class="abs" style="left:0;top:0;width:${PL.w}px;height:${PL.h}px;background:#08090C">
          <div class="abs center" style="left:0;top:0;width:${PL.w}px;height:${PL.bar}px;background:var(--tBar);font:500 13px/1 Inter,sans-serif;color:var(--ccDim)">${p.title}</div>
          <div class="abs row" style="left:14px;top:11px;gap:8px">
            <i style="width:12px;height:12px;border-radius:50%;background:#FF5F57"></i><i style="width:12px;height:12px;border-radius:50%;background:#FEBC2E"></i><i style="width:12px;height:12px;border-radius:50%;background:#28C840"></i>
          </div>
          <div class="abs mask" style="left:0;top:${PL.bar}px;width:${PL.w}px;height:${PL.w}px">${inner}</div>
          <i class="abs" style="left:0;bottom:0;width:${PL.w}px;height:4px;background:rgba(255,255,255,.12)"></i>
          <i class="abs" data-k="plNow_${name}" style="left:0;bottom:0;width:0;height:4px;background:var(--accent)"></i>
        </div>
      </div>
    </div>`;
  const oryn = ORYN.map((k, i) => `<img data-k="oryn${i}" class="abs" src="${img(k)}" style="left:0;top:0;width:${PL.w}px;height:${PL.w}px">`).join("");
  const windows = player("rolyn", PLAYERS.rolyn, `<div data-k="rolynHost" class="abs" style="left:0;top:0;width:${PL.w}px;height:${PL.w}px;background:#F5F6F2"></div>`) + player("oryn", PLAYERS.oryn, oryn);
  const card = (k, i) => `<div class="abs" data-k="still${i}" style="left:0;top:0;width:${ST.card}px;height:${ST.card}px;border-radius:16px;overflow:hidden;background:#F5F6F2;box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.1)"><img src="${img(k)}" style="width:${ST.card}px;height:${ST.card}px;display:block"></div>`;
  const tile = (k, i) => `<div class="abs" data-k="tile${i}" style="left:0;top:0;width:${ST.tile}px;height:${ST.tile}px;border-radius:8px;overflow:hidden;background:#F5F6F2;box-shadow:0 10px 28px rgba(0,0,0,.45)"><img src="${img(k)}" style="width:${ST.tile}px;height:${ST.tile}px;display:block"><span class="abs t" style="left:8px;top:5px;font:600 12px/1.3 Inter;color:#4E574F">${(i * 2.9).toFixed(1)} s</span></div>`;
  const fly = `
    <div class="abs mask" data-k="stillsCapClip" style="left:${ST.x}px;top:${ST.y - 62}px;width:760px;height:44px"><div data-k="stillsCap" class="t" style="font:600 30px/44px Inter;color:var(--ink);letter-spacing:-.01em">Four stills for your approval</div></div>
    ${STILLS.map(card).join("")}
    <div class="abs mask" data-k="sheetCapClip" style="left:${ST.x}px;top:${ST.y - 62}px;width:760px;height:44px"><div data-k="sheetCap" class="t" style="font:600 30px/44px Inter;color:var(--ink);letter-spacing:-.01em">Every half second, checked</div></div>
    ${SHEET.map(tile).join("")}
    ${wavePanel()}`;
  const term = termMarkup("Rolyn — claude — 104×28", ITEMS);
  const icon = `<div class="abs center term" style="left:0;top:0;width:46px;height:46px;background:#15171D;color:var(--accent);font-size:20px;font-weight:700">&gt;_</div>`;
  const cap = (k, html, css) => `<div class="abs mask" data-k="${k}Clip" style="${css}"><div data-k="${k}" class="t" style="line-height:inherit">${html}</div></div>`;
  const R = 800;
  stage.innerHTML = `
    <div class="full" style="background:var(--bg)"></div>
    ${desktopMarkup(term, { name: "Terminal", menu: ["Shell", "Edit", "View", "Window", "Help"], icon, dock: 6, clock: "Mon 9:41", windows, fly })}
    <div class="full" data-k="caps">
      ${cap("vEye", "VOICEOVER", `left:${R}px;top:250px;width:560px;height:30px;font:700 20px/30px Inter;letter-spacing:.14em;color:var(--accent)`)}
      ${cap("vHead", "Local voices.", `left:${R}px;top:286px;width:600px;height:96px;font:700 76px/96px Inter;letter-spacing:-.035em`)}
      ${VOICES.map(([n, lic, what, size], i) => `
        <div class="abs" data-k="vCard${i}" style="left:${R}px;top:${412 + i * 170}px;width:596px;height:150px;border-radius:18px;background:#161922;box-shadow:inset 0 0 0 1px var(--hair)">
          <span class="abs t" style="left:28px;top:22px;font:700 36px/1.3 Inter;letter-spacing:-.02em">${n}</span>
          <span class="abs t" style="right:28px;top:32px;font:600 19px/1.3 Inter;color:var(--accent2)">${lic}</span>
          <span class="abs t" style="left:28px;top:76px;font:500 21px/1.3 Inter;color:var(--ink2)">${what}</span>
          <span class="abs t" style="left:28px;top:106px;font:500 19px/1.3 Inter;color:var(--ink3)">${size}, on your machine</span>
        </div>`).join("")}
      ${cap("sEye", "THIS FILM, PROMPT TO RENDER", `left:${R}px;top:268px;width:600px;height:30px;font:700 20px/30px Inter;letter-spacing:.14em;color:var(--accent)`)}
      ${[0, 1, 2, 3].map((i) => `
        ${cap("sL" + i, ["TIME AT WORK", "TOKENS WRITTEN", "TOKENS READ, MOSTLY CACHED", "TOOL CALLS"][i], `left:${R}px;top:${330 + i * 152}px;width:600px;height:30px;font:600 20px/30px Inter;letter-spacing:.1em;color:var(--ink3)`)}
        ${cap("sV" + i, "", `left:${R}px;top:${360 + i * 152}px;width:600px;height:104px;font:700 84px/104px Inter;letter-spacing:-.04em`)}`).join("")}
      ${cap("fHead", "Free and open.", `left:${R}px;top:300px;width:620px;height:96px;font:700 76px/96px Inter;letter-spacing:-.035em`)}
      ${["MIT-licensed skill for Claude Code.", "Renders, music and voices", "run on your machine.", "No API keys. No cloud renders."].map((s, i) =>
        cap("fL" + i, s, `left:${R}px;top:${440 + [0, 84, 136, 220][i]}px;width:620px;height:52px;font:500 36px/52px Inter;color:var(--ink2)`)).join("")}
      <div class="abs row term" data-k="pill" style="left:${R}px;top:790px;height:64px;padding:0 26px;border-radius:14px;background:#161922;box-shadow:inset 0 0 0 1px var(--hair);font-size:21px;color:var(--ink);white-space:pre"><span class="acc">$</span> ${INSTALL}</div>
    </div>
    <div class="full" data-k="word">
      <div class="abs t" data-k="wm" style="font:700 ${WM.size}px/1.3 Inter;letter-spacing:${WM.track}em">${[...APP.word].map((c, i) => `<span data-k="wl${i}">${c}</span>`).join("")}</div>
      <div class="abs mask" data-k="tagClip"><div data-k="tagline" class="t" style="font:500 40px/56px Inter;color:var(--ink2)">${APP.tag}</div></div>
      <div class="abs" data-k="caret" style="left:0;top:0;border-radius:6px;background:var(--accent)"></div>
    </div>`;
  collect(stage);
  $.winClip.insertAdjacentHTML("beforeend", `<div class="abs" style="left:0;top:0;width:${WIN.w}px;height:${WIN.h}px;background:var(--accent)"></div>`);
  $.winTint = $.winClip.lastElementChild;

  const css = `font-family:Inter;letter-spacing:${WM.track}em`;
  WM.widths = [...APP.word].map((_, i) => measure(APP.word.slice(0, i), WM.size, 700, css));
  WM.widths.push(measure(APP.word, WM.size, 700, css));
  WM.caret = { w: Math.round(WM.size * 0.34), h: Math.round(WM.size * 0.86) };
  WM.gap = Math.round(WM.size * 0.06);
  WM.left = Math.round((FILM.W - (WM.widths[APP.word.length] + WM.gap + WM.caret.w)) / 2);
  WM.top = Math.round(WM.baseline - WM.size * 1.3 * 0.5 - WM.size * 0.36);
  WM.caret.y = Math.round(WM.baseline - WM.size * 0.74);
  Object.assign($.wm.style, { left: WM.left + "px", top: WM.top + "px" });
  const tagW = measure(APP.tag, 40, 500, "font-family:Inter");
  Object.assign($.tagClip.style, { left: Math.round((FILM.W - tagW) / 2) + "px", top: WM.baseline + 44 + "px", width: Math.ceil(tagW) + 4 + "px", height: "56px" });
  WM.home = { x: Math.round(FILM.W / 2 - WM.caret.w / 2), y: Math.round(FILM.H / 2 - WM.caret.h / 2) };
}

function wavePanel() {
  const n = WAVE.v.length, w = WV.w - 2 * WV.pad, col = w / n, mid = WV.top + WV.height / 2;
  const bars = WAVE.v.map((v, i) => {
    const h = Math.max(2, v * WV.height);
    return `<i class="abs" data-k="wv${i}" style="left:${(WV.pad + i * col).toFixed(2)}px;top:${(mid - h / 2).toFixed(2)}px;width:${Math.max(1, col - 1).toFixed(2)}px;height:${h.toFixed(2)}px;border-radius:1px;background:var(--ink3)"></i>`;
  }).join("");
  const lines = Array.from({ length: WAVE.beats / 4 + 1 }, (_, b) => `<i class="abs" style="left:${(WV.pad + b * 8 * col).toFixed(2)}px;top:${WV.top - 8}px;width:1px;height:${WV.height + 16}px;background:${b % 4 ? "var(--hair)" : "rgba(255,255,255,.18)"}"></i>`).join("");
  const nums = Array.from({ length: WAVE.beats / 16 }, (_, k) => `<span class="abs t term" style="left:${(WV.pad + k * 32 * col + 6).toFixed(2)}px;top:${WV.top + WV.height + 14}px;font-size:20px;color:var(--ink3)">${1 + k * 4}</span>`).join("");
  const dropX = WV.pad + (WAVE.drop - 1) * 2 * col;
  return `
    <div class="abs" data-k="wave" style="left:0;top:0;width:${WV.w}px;height:${WV.h}px;border-radius:18px;background:#12141A;box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.1)">
      <span class="abs t term" style="left:${WV.pad}px;top:30px;font-size:24px;color:var(--ink)">audio/edit.m4a</span>
      <span class="abs t term" style="right:${WV.pad}px;top:31px;font-size:22px;color:var(--ink2)">${Math.round(WAVE.bpm)} BPM · ${WAVE.beats / 4} bars</span>
      ${lines}${bars}${nums}
      <i class="abs" style="left:${dropX.toFixed(2)}px;top:${WV.top - 22}px;width:3px;height:${WV.height + 30}px;border-radius:2px;background:var(--accent2)"></i>
      <span class="abs t term" style="left:${(dropX + 10).toFixed(2)}px;top:${WV.top - 34}px;font-size:20px;color:var(--accent2)">drop</span>
      <i class="abs" data-k="wvPlay" style="left:0;top:${WV.top - 22}px;width:4px;height:${WV.height + 30}px;border-radius:2px;background:var(--accent)"></i>
    </div>`;
}

let rolyn = null;
async function prepare() {
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts allow-same-origin");
  f.style.cssText = `position:absolute;left:0;top:0;width:1440px;height:1440px;border:0;transform:scale(${PL.w / 1440});transform-origin:0 0;pointer-events:none`;
  const loaded = new Promise((r) => f.addEventListener("load", r, { once: true }));
  f.srcdoc = FILMS.rolyn;
  $.rolynHost.appendChild(f);
  await loaded;
  try {
    await f.contentWindow.seek(0);
    rolyn = f;
  } catch {
    rolyn = null;
  }
}
const rolynTime = (t) => (ROLYN.from * 60) / ROLYN.bpm + (t - K.drop) * (FILM.BPM / ROLYN.bpm);

function apply(t) {
  const v = camera(t);
  const worldOn = t >= K.open && t < K.caret + 0.1;
  show($.world, worldOn);
  let pending = null;
  if (worldOn) {
    const grow = prog(t, K.open, 0.7, E.smooth);
    placeWorld(v, {
      rect: grow < 1 ? mixRect(caretInWindow(), FULL, grow) : FULL,
      chrome: prog(t, K.chrome, 0.35, E.out),
      desk: prog(t, K.desk + 0.1, 0.85, E.smooth),
      hw: prog(t, K.laptop, 0.6, E.out),
      lid: 1 - prog(t, K.close, 0.5, E.inOut),
    });
    $.winTint.style.opacity = (1 - prog(t, K.open + 0.15, 0.5, E.inOut)).toFixed(3);
    show($.winTint, t < K.open + 0.66);
    show($.pointer, false);
    const lay = applyTerm(t, ITEMS, UI);
    applyMenu(t, lay);
    applyAsk(t, lay);
    applyTermExtras(t);
    applyFly(t, lay);
    pending = applyPlayers(t, lay);
  }
  applyCaps(t);
  applyWord(t, v);
  return pending;
}

const OPEN = () => onWindow(500, 360, 1.3);
const READ = () => onWindow(500, 372, 1.37);
const HALF = () => view(1199, 464, 0.7);
const SIDE = () => view(1040, 490, 0.8);
const playerView = (p, z = 1.5) => view(p.x + PL.w / 2, p.y + PL.bar + PL.w / 2, z);
function camera(t) {
  return cameraAt(t, [
    { t: 0, ...OPEN() },
    { t: K.welcome + 0.1, ...onWindow(425, 232, 1.58), d: 1.0 },
    { t: K.enter + 0.15, ...READ(), d: 0.9 },
    { t: K.pack + 0.4, ...onWindow(500, 380, 1.4), d: K.plan - K.pack - 0.4 },
    { t: K.plan + FILM.P * 1.6, ...SIDE(), d: 1.0 },
    { t: K.stillsBack, ...READ(), d: 0.9 },
    { t: K.check + 0.3, ...onWindow(500, 390, 1.4), d: K.sheet - K.check - 0.3 },
    { t: K.sheet + 0.15, ...SIDE(), d: 0.9 },
    { t: K.render + 0.3, ...onWindow(445, 360, 1.55), d: K.drop - K.render - 0.5 },
    { t: K.drop, ...playerView(PLAYERS.rolyn), spring: [0.55, 0.92] },
    { t: K.drop + 0.8, ...playerView(PLAYERS.rolyn, 1.56), d: K.oryn - K.drop - 0.8 },
    { t: K.oryn, ...playerView(PLAYERS.oryn), d: 0.9 },
    { t: K.oryn + 0.9, ...playerView(PLAYERS.oryn, 1.54), d: K.fold - K.oryn - 0.9 },
    { t: K.fold, ...READ(), d: 0.8 },
    { t: K.ask2, ...onWindow(445, 360, 1.55), d: 0.8 },
    { t: K.half, ...HALF(), d: 1.0 },
    { t: K.half + 1.1, ...view(1199, 464, 0.715), d: K.desk - K.half - 1.1 },
    { t: K.desk, ...WHOLE_SCREEN, d: 1.0 },
    { t: K.laptop, ...WHOLE_LAPTOP, d: 0.9 },
  ]);
}

function caretInWindow() {
  const v = OPEN(), c = WM.caret;
  return { x: (WM.home.x - FILM.W / 2) / v.z + v.cx - WIN.x, y: (WM.home.y - FILM.H / 2) / v.z + v.cy - WIN.y, w: c.w / v.z, h: c.h / v.z, r: 6 / v.z };
}

function applyMenu(t, lay) {
  const rows = menuRows(t);
  show($.menu, rows.length > 0);
  if (!rows.length) return;
  const key = rows.map(([c]) => c).join("|");
  if ($.menu._v !== key) {
    $.menu.innerHTML = rows.map(([c, d], i) => `<div class="ln" style="top:${i * TERM.lh}px;left:${2 * TERM.cw}px"><span class="${i ? "" : "sel"}">${c.padEnd(20)}</span><span class="${i ? "dim" : "sel"}">${esc(d)}</span></div>`).join("");
    $.menu._v = key;
  }
  $.menu.style.top = lay.at.foot + "px";
  $.menu.style.opacity = prog(t, K.slash, 0.12).toFixed(3);
}

function applyAsk(t, lay) {
  const on = t >= K.question && t < K.choose + 0.25;
  show($.ask, on);
  show($.inBox, !on && t >= K.input);
  if (!on) return;
  if (!$.ask._v) {
    $.ask.innerHTML = `
      <div class="abs" style="left:0;top:0;width:100%;height:${9 * TERM.lh}px;border:1.5px solid var(--ccSel);border-radius:8px"></div>
      <div class="ln" style="top:${0.5 * TERM.lh}px;left:${2 * TERM.cw}px"><span style="background:var(--ccSel);color:#15171D;padding:0 6px;border-radius:3px">Voice</span>  Which voice should narrate the film?</div>
      ${VOICES.map(([n, , what, size], i) => `
        <div class="ln" style="top:${(2 + i * 2) * TERM.lh}px;left:${2 * TERM.cw}px">${i ? "  " : '<span class="sel">❯</span> '}<span class="${i ? "" : "sel"}">${i + 1}. ${n}</span></div>
        <div class="ln dim" style="top:${(3 + i * 2) * TERM.lh}px;left:${7 * TERM.cw}px">${esc(what)}${size === "built in" ? "" : " · " + size}</div>`).join("")}`;
    $.ask._v = 1;
  }
  const p = prog(t, K.question, 0.35, E.out), out = prog(t, K.choose, 0.25, E.in);
  $.ask.style.top = lay.at.input.toFixed(2) + "px";
  $.ask.style.opacity = (p * (1 - out)).toFixed(3);
  setT($.ask, `translateY(${((1 - p) * 10).toFixed(2)}px)`);
}

function applyTermExtras(t) {
  for (let i = 0; i < 5; i++) $["chk" + i].style.opacity = prog(t, B(18.5) + (i * FILM.P) / 4, 0.18, E.out).toFixed(3);
  const f = Math.min(2791, Math.floor(2791 * prog(t, B(59.75), K.drop - B(59.75) - 0.05, E.linear)));
  const txt = `frame ${String(f).padStart(4, " ")}/2791`;
  if ($.frames._v !== txt) { $.frames.textContent = txt; $.frames._v = txt; }
  $.barOn.style.width = ((40 * TERM.cw * f) / 2791).toFixed(2) + "px";
}

function applyFly(t, lay) {
  const from = (k, dx = 0) => ({ x: WIN.x + TERM.x + 60 + dx, y: WIN.y + TERM.top + (lay.at[k] ?? 0) - lay.scroll });
  for (let i = 0; i < 4; i++) {
    const el = $["still" + i], at = K.stills + (i * FILM.P) / 2;
    const on = t >= at && t < K.stillsBack + 0.6;
    show(el, on);
    if (!on) continue;
    const go = clamp(spring(t, at, 0.6, 0.82), 0, 1.04), back = prog(t, K.stillsBack + (3 - i) * 0.05, 0.4, E.in);
    const src = from("plan", i * 40), dst = { x: ST.x + (i % 2) * (ST.card + ST.gap), y: ST.y + Math.floor(i / 2) * (ST.card + ST.gap) };
    const p = t < K.stillsBack ? go : 1 - back;
    el.style.transformOrigin = "0 0";
    setT(el, `translate(${lerp(src.x, dst.x, p).toFixed(2)}px,${lerp(src.y, dst.y, p).toFixed(2)}px) scale(${lerp(0.12, 1, Math.min(p, 1.02)).toFixed(4)})`);
    el.style.opacity = Math.min(1, p * 3).toFixed(3);
  }
  caption($.stillsCapClip, $.stillsCap, t, K.stills + FILM.P * 2, K.stillsBack - 0.3);

  for (let i = 0; i < 16; i++) {
    const el = $["tile" + i], at = K.sheet + FILM.P * 0.75 + (i * FILM.P) / 8;
    const on = t >= at && t < K.sheetBack + 0.7;
    show(el, on);
    if (!on) continue;
    const go = clamp(spring(t, at, 0.5, 0.84), 0, 1.03), back = prog(t, K.sheetBack + (15 - i) * 0.02, 0.35, E.in);
    const src = from("sheet"), dst = { x: ST.x + (i % 4) * (ST.tile + 10), y: ST.y + Math.floor(i / 4) * (ST.tile + 10) };
    const p = t < K.sheetBack ? go : 1 - back;
    el.style.transformOrigin = "0 0";
    setT(el, `translate(${lerp(src.x, dst.x, p).toFixed(2)}px,${lerp(src.y, dst.y, p).toFixed(2)}px) scale(${lerp(0.15, 1, Math.min(p, 1.03)).toFixed(4)})`);
    el.style.opacity = Math.min(1, p * 3).toFixed(3);
  }
  caption($.sheetCapClip, $.sheetCap, t, K.sheet + FILM.P * 1.5, K.sheetBack - 0.3);

  const wAt = K.music + FILM.P * 0.5, wBack = K.render - 0.35;
  const wOn = t >= wAt && t < wBack + 0.45;
  show($.wave, wOn);
  if (wOn) {
    const go = clamp(spring(t, wAt, 0.55, 0.84), 0, 1.03), back = prog(t, wBack, 0.4, E.in);
    const src = from("music"), p = t < wBack ? go : 1 - back;
    $.wave.style.transformOrigin = "0 0";
    setT($.wave, `translate(${lerp(src.x, WV.x, p).toFixed(2)}px,${lerp(src.y, WV.y, p).toFixed(2)}px) scale(${lerp(0.14, 1, Math.min(p, 1.03)).toFixed(4)})`);
    $.wave.style.opacity = Math.min(1, p * 3).toFixed(3);
    const n = WAVE.v.length, head = clamp(t / FILM.DURATION) * n;
    $.wvPlay.style.left = (WV.pad + (head / n) * (WV.w - 2 * WV.pad) - 2).toFixed(2) + "px";
    for (let i = 0; i < n; i++) {
      const c = i < head ? "var(--ink)" : "var(--ink3)";
      const el = $["wv" + i];
      if (el._c !== c) { el.style.background = c; el._c = c; }
    }
  }
}

function caption(clip, el, t, tin, tout) {
  const on = t >= tin && t < tout + 0.3;
  show(clip, on);
  if (!on) return;
  if (t < tout) rise(el, prog(t, tin, 0.42, E.out));
  else sink(el, prog(t, tout, 0.28, E.in));
}

function applyPlayers(t, lay) {
  const line = { x: WIN.x + TERM.x + 5 * TERM.cw, y: WIN.y + TERM.top + (lay.at.render ?? 0) + TERM.lh - lay.scroll, w: 46 * TERM.cw, h: TERM.lh, r: 3 };
  const open = clamp(spring(t, K.drop, 0.5, 0.86), 0, 1.02), fold = prog(t, K.fold, 0.45, E.inOut);
  const on = t >= K.drop && fold < 1;
  show($.pl_rolyn, on);
  let pending = null;
  if (on) {
    const full = { x: PLAYERS.rolyn.x, y: PLAYERS.rolyn.y, w: PL.w, h: PL.h, r: 12 };
    const r = fold > 0 ? mixRect(full, line, fold) : mixRect(line, full, open);
    placePlayer("rolyn", r, prog(t, K.drop + 0.25, 0.35, E.out) * (1 - fold));
    const inner = rolynTime(t);
    $.plNow_rolyn.style.width = (PL.w * clamp(inner / ROLYN.length)).toFixed(2) + "px";
    if (rolyn) pending = rolyn.contentWindow.seek(inner);
  }
  const oIn = clamp(spring(t, K.oryn, 0.6, 0.88), 0, 1.01), oOut = prog(t, K.fold, 0.4, E.in);
  const oOn = t >= K.oryn && oOut < 1;
  show($.pl_oryn, oOn);
  if (oOn) {
    const x = lerp(SCREEN.W + 40, PLAYERS.oryn.x, oIn) + oOut * (SCREEN.W + 40 - PLAYERS.oryn.x);
    placePlayer("oryn", { x, y: PLAYERS.oryn.y, w: PL.w, h: PL.h, r: 12 }, 1);
    const f = clamp(Math.floor((t - K.oryn) / FILM.P), 0, ORYN.length - 1);
    ORYN.forEach((_, i) => show($["oryn" + i], i === f));
    $.plNow_oryn.style.width = (PL.w * (0.2 + 0.6 * clamp((t - K.oryn) / (K.fold - K.oryn)))).toFixed(2) + "px";
  }
  return pending;
}

function placePlayer(name, r, shadow) {
  const el = $["pl_" + name], clip = $["plClip_" + name], s = r.w / PL.w, clipH = r.h / s;
  el.style.left = (r.x + r.w / 2 - PL.w / 2).toFixed(2) + "px";
  el.style.top = (r.y + r.h / 2 - PL.h / 2).toFixed(2) + "px";
  clip.style.clipPath = `inset(${((PL.h - clipH) / 2).toFixed(2)}px 0px ${((PL.h - clipH) / 2).toFixed(2)}px 0px round ${(r.r / s).toFixed(2)}px)`;
  setT(clip, s === 1 ? "none" : `scale(${s.toFixed(4)})`);
  const sh = $["plShadow_" + name];
  rectCss(sh, { x: PL.w / 2 - r.w / 2, y: PL.h / 2 - r.h / 2, w: r.w, h: r.h, r: r.r });
  sh.style.boxShadow = `0 ${(30 * shadow).toFixed(1)}px ${(80 * shadow).toFixed(1)}px rgba(0,0,0,${(0.55 * shadow).toFixed(3)}), 0 0 0 1px rgba(255,255,255,${(0.12 * shadow).toFixed(3)})`;
}

function applyCaps(t) {
  const slot = (k, tin, tout) => caption($[k + "Clip"], $[k], t, tin, tout);
  const vIn = K.half + 0.25, vOut = K.stats - 0.3;
  slot("vEye", vIn, vOut);
  slot("vHead", vIn + 0.08, vOut);
  VOICES.forEach((_, i) => {
    const el = $["vCard" + i], at = vIn + FILM.P * (1 + i * 0.5);
    const p = clamp(spring(t, at, 0.5, 0.86), 0, 1), out = prog(t, vOut - (2 - i) * 0.04, 0.28, E.in);
    show(el, t >= at && out < 1);
    setT(el, `translateY(${((1 - p) * 40 - out * 30).toFixed(2)}px)`);
    el.style.opacity = (Math.min(1, p * 1.5) * (1 - out)).toFixed(3);
  });
  const sIn = K.stats + 0.1, sOut = K.free - 0.3;
  slot("sEye", sIn, sOut);
  const vals = [
    (p) => { const m = Math.floor((TOTALS.secs * p) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; },
    (p) => `${Math.round((TOTALS.out * p) / 1000)} K`,
    (p) => `${((TOTALS.read * p) / 1e6).toFixed(1)} M`,
    (p) => `${Math.round(TOTALS.calls * p)}`,
  ];
  for (let i = 0; i < 4; i++) {
    const at = sIn + FILM.P * (0.5 + i * 0.75);
    slot("sL" + i, at, sOut);
    slot("sV" + i, at + 0.06, sOut);
    const txt = vals[i](prog(t, at + 0.1, FILM.P * 3, E.out));
    if ($["sV" + i]._v !== txt) { $["sV" + i].textContent = txt; $["sV" + i]._v = txt; }
  }
  const fIn = K.free + 0.1, fOut = K.desk - 0.3;
  slot("fHead", fIn, fOut);
  for (let i = 0; i < 4; i++) slot("fL" + i, fIn + FILM.P * (1 + i * 0.5), fOut);
  const pAt = fIn + FILM.P * 3.5, pIn = clamp(spring(t, pAt, 0.5, 0.86), 0, 1), pOut = prog(t, fOut, 0.28, E.in);
  show($.pill, t >= pAt && pOut < 1);
  setT($.pill, `translateY(${((1 - pIn) * 36 - pOut * 30).toFixed(2)}px)`);
  $.pill.style.opacity = (Math.min(1, pIn * 1.5) * (1 - pOut)).toFixed(3);
}

function applyWord(t, v) {
  const n = APP.word.length;
  let count = n;
  if (t >= K.del && t < K.word) count = Math.max(0, n - Math.floor((t - K.del) / P8()) - 1);
  if (t >= K.word) count = Math.min(n, Math.floor((t - K.word) / P8()) + 1);
  show($.wm, t < K.home || t >= K.word);
  for (let i = 0; i < n; i++) $["wl" + i].style.visibility = i < count ? "" : "hidden";

  show($.tagClip, t < K.tagOut + 0.3 || t >= K.tag);
  if (t < K.tag) sink($.tagline, prog(t, K.tagOut, 0.3, E.in));
  else rise($.tagline, prog(t, K.tag, 0.45, E.out));

  const beatBlink = (t / FILM.P) % 1 < 0.6;
  const atWord = { x: WM.left + WM.widths[count] + (count ? WM.gap : 0), y: WM.caret.y, w: WM.caret.w, h: WM.caret.h };
  let r = null, on = true, tint = 1;
  if (t < K.home) {
    r = atWord;
    on = t >= K.del && t < K.del + n * P8() ? true : beatBlink;
  } else if (t < K.open + 0.02) {
    const p = prog(t, K.home, 0.4, E.smooth);
    r = { x: lerp(WM.left, WM.home.x, p), y: lerp(WM.caret.y, WM.home.y, p), w: WM.caret.w, h: WM.caret.h };
  } else if (t >= K.caret && t < K.word) {
    const deck = { x: -LAPTOP.bezel - LAPTOP.deckOver, y: SCREEN.H + LAPTOP.bezel, w: SCREEN.W + 2 * (LAPTOP.bezel + LAPTOP.deckOver), h: LAPTOP.deckH };
    const a = toStage(v, deck.x, deck.y), p = prog(t, K.caret + 0.1, 0.7, E.smooth);
    const from = { x: a.x, y: a.y, w: deck.w * v.z, h: deck.h * v.z };
    r = { x: lerp(from.x, WM.left, p), y: lerp(from.y, WM.caret.y, p), w: lerp(from.w, WM.caret.w, p), h: lerp(from.h, WM.caret.h, p) };
    tint = p;
  } else if (t >= K.word) {
    r = atWord;
    on = t < K.word + n * P8() ? true : beatBlink;
  }
  show($.caret, !!r);
  if (!r) return;
  rectCss($.caret, { ...r, r: Math.min(6, r.h / 2) });
  $.caret.style.background = tint < 1 ? `color-mix(in srgb, var(--accent) ${(tint * 100).toFixed(1)}%, var(--metal1))` : "var(--accent)";
  $.caret.style.opacity = on ? "1" : "0";
}
