(function () {
  const C = window.CORE, U = window.UI;
  const { FILM, B: beat, clamp, lerp, E, prog, spring, track, press, pulse, usd, pct, pctText } = C;

  const HOLDS = [
    [8.95, 2], [14.5, 2],
    [18.5, 5], [21.9, 2], [23.82, 2],
    [25.3, 1], [27.8, 2], [30.3, 2], [32.75, 2],
    [34.95, 2], [38.9, 2], [42.9, 2],
    [45.6, 2], [46.8, 2], [52.8, 2],
  ];
  const B = (b) => beat(b + HOLDS.reduce((s, [at, len]) => s + (b >= at ? len : 0), 0));
  const P = FILM.P;
  const LH = U.LH;
  const $ = {};

  const T = (x, y, s = 1) => `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
  const show = (el, on) => { el.style.visibility = on ? "" : "hidden"; };
  const setT = (el, v) => { el.style.transform = v; };
  const rise = (el, p, dist = 1.05) => setT(el, `translateY(${((1 - p) * dist * 100).toFixed(2)}%)`);
  const sink = (el, p, dist = 1.05) => setT(el, `translateY(${(-p * dist * 100).toFixed(2)}%)`);
  const mixRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), r: lerp(a.r, b.r, p) });
  const inset = (r, W = 402, H = 874) =>
    `inset(${r.y.toFixed(2)}px ${(W - r.x - r.w).toFixed(2)}px ${(H - r.y - r.h).toFixed(2)}px ${r.x.toFixed(2)}px round ${r.r.toFixed(2)}px)`;

  function rectCss(el, r) {
    el.style.left = r.x.toFixed(2) + "px";
    el.style.top = r.y.toFixed(2) + "px";
    el.style.width = r.w.toFixed(2) + "px";
    el.style.height = r.h.toFixed(2) + "px";
    el.style.borderRadius = r.r.toFixed(2) + "px";
  }

  function collect(root) {
    root.querySelectorAll("[data-k]").forEach((el) => { $[el.dataset.k] = el; });
  }

  let STAGE;
  const stageScale = () => STAGE.getBoundingClientRect().width / 1440 || 1;

  function measure(text, size, weight, extra = "") {
    const el = document.createElement("span");
    el.className = "t";
    el.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;font-size:${size}px;font-weight:${weight};${extra}`;
    el.textContent = text;
    STAGE.appendChild(el);
    const w = el.getBoundingClientRect().width / stageScale();
    el.remove();
    return w;
  }

  function makeRoller(host, size, weight, color, align, extra = "") {
    host.innerHTML = `<span class="t" style="position:absolute;top:0;font-size:${size}px;font-weight:${weight};color:${color};${extra}"></span><span class="t" style="position:absolute;top:0;font-size:${size}px;font-weight:${weight};color:${color};${extra}"></span>`;
    const [a, b] = host.children;
    for (const el of [a, b]) {
      if (align === "center") { el.style.left = "0"; el.style.width = "100%"; el.style.textAlign = "center"; }
      else if (align === "right") { el.style.right = "0"; el.style.textAlign = "right"; }
      else el.style.left = "0";
    }
    return { a, b, last: [null, null] };
  }

  function setRoller(r, t, steps, dur = 0.34, html = false) {
    let i = -1;
    for (let k = 0; k < steps.length; k++) if (t >= steps[k].t) i = k;
    const put = (el, slot, v) => {
      if (r.last[slot] !== v) { if (html) el.innerHTML = v; else el.textContent = v; r.last[slot] = v; }
    };
    if (i < 0) { show(r.a, false); show(r.b, false); return; }
    const cur = steps[i], prev = steps[i - 1];
    const p = prog(t, cur.t, dur, E.snappy);
    if (!prev || p >= 1) {
      put(r.a, 0, cur.v); show(r.a, true); show(r.b, false);
      setT(r.a, prev ? "none" : `translateY(${((1 - prog(t, cur.t, dur, E.out)) * 105).toFixed(2)}%)`);
      return;
    }
    put(r.a, 0, prev.v); put(r.b, 1, cur.v);
    show(r.a, true); show(r.b, true);
    setT(r.a, `translateY(${(-p * 105).toFixed(2)}%)`);
    setT(r.b, `translateY(${((1 - p) * 105).toFixed(2)}%)`);
  }

  function catmull(points) {
    const n = points.length;
    if (n < 2) return "";
    const pt = (i) => points[Math.max(0, Math.min(n - 1, i))];
    let d = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = i === 0 ? [2 * pt(0)[0] - pt(1)[0], 2 * pt(0)[1] - pt(1)[1]] : pt(i - 1);
      const p1 = pt(i), p2 = pt(i + 1);
      const p3 = i + 2 >= n ? [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]] : pt(i + 2);
      const dist = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-6;
      const d01 = dist(p0, p1), d12 = dist(p1, p2), d23 = dist(p2, p3);
      const c1 = [0, 1].map((k) => p1[k] + ((p1[k] - p0[k]) / d01 - (p2[k] - p0[k]) / (d01 + d12) + (p2[k] - p1[k]) / d12) * (d12 / 3));
      const c2 = [0, 1].map((k) => p2[k] - ((p2[k] - p1[k]) / d12 - (p3[k] - p1[k]) / (d12 + d23) + (p3[k] - p2[k]) / d23) * (d12 / 3));
      d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }

  function monotone(points) {
    const n = points.length;
    if (n < 2) return "";
    const dx = [], dy = [], m = [];
    for (let i = 0; i < n - 1; i++) { dx.push(points[i + 1][0] - points[i][0]); dy.push(points[i + 1][1] - points[i][1]); m.push(dy[i] / dx[i]); }
    const tg = [m[0]];
    for (let i = 1; i < n - 1; i++) tg.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
    tg.push(m[n - 2]);
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { tg[i] = 0; tg[i + 1] = 0; continue; }
      const a = tg[i] / m[i], b = tg[i + 1] / m[i], h = a * a + b * b;
      if (h > 9) { const s = 3 / Math.sqrt(h); tg[i] = s * a * m[i]; tg[i + 1] = s * b * m[i]; }
    }
    let d = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += ` C${(points[i][0] + h).toFixed(2)} ${(points[i][1] + tg[i] * h).toFixed(2)} ${(points[i + 1][0] - h).toFixed(2)} ${(points[i + 1][1] - tg[i + 1] * h).toFixed(2)} ${points[i + 1][0].toFixed(2)} ${points[i + 1][1].toFixed(2)}`;
    }
    return d;
  }

  function resample(values, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * (values.length - 1);
      const a = Math.floor(x), b = Math.min(values.length - 1, a + 1);
      out.push(lerp(values[a], values[b], x - a));
    }
    return out;
  }

  function mixColor(a, b, p) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], p))).join(",")})`;
  }

  function spin(key, t) {
    const head = Math.floor(t * 8) % 8;
    for (let i = 0; i < 8; i++) $[key + i].style.opacity = (1 - ((head - i + 8) % 8) * 0.105).toFixed(3);
  }

  const V = { tap: B(15), open: B(15) + 0.12, stop: B(19), fill: B(20), sub: B(21), save: B(22) };
  const V_OUT = V.save + 0.12;
  const PHRASE = { t0: B(16) + 0.1, lines: [0, 1.68, 2.44] };
  const S = { tap: B(24), open: B(24) + 0.12, lock: B(24.8), shot: B(25), done: B(25.5), read: B(25.5) + 0.1, review: B(26.75), confirm: B(28), save: B(30.5) };
  const S_OUT = S.save + 0.12;
  const DROP = B(33);
  const BUD_LIST = B(45.65);
  const HOME_BACK = B(52.9);
  const SHEET_TOP = 72;
  const STATS_SCROLL = 352;

  const camAt = (s, top) => ({ s, x: 720 - 201 * s, y: -top * s });
  const camMix = (a, b, p) => ({ s: lerp(a.s, b.s, p), x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
  const toStage = (c, x, y) => [c.x + x * c.s, c.y + y * c.s];

  const PHONE_S = 1060 / 874;
  const WHOLE_S = 1440 / (874 + 16 + 40);
  const CAMS = {
    homeA: camAt(2.2, -40),
    whole: camAt(WHOLE_S, -28),
    voice: { s: 1.25, x: 150, y: (1440 - 874 * 1.25) / 2 },
    scan: camAt(1.65, -20),
    statsA: camAt(1.85, -30),
    statsB: camAt(2.0, 190),
    budCard: camAt(2.2, 180),
    bud: camAt(1.75, -30),
    det: camAt(1.8, -30),
    phone: { s: PHONE_S, x: 170, y: 190 },
  };

  const EDGE = { bezel: 5, frame: 3 };
  const FULL = { x: 0, y: 0, w: 402, h: 874, r: 55 };
  const BAND = { x: 0, y: 283, w: 402, h: 150, r: 22 };
  const ICON = { size: 200, r: 200 * 0.2237 };
  const APP_ICON = { x: U.SPRING.icon.x, y: U.SPRING.icon.y, w: U.SPRING.icon.s, h: U.SPRING.icon.s, r: U.SPRING.icon.s * 0.2237 };

  function holdStep(t) {
    return [58, 59, 60].reduce((k, b) => k + prog(t, B(b), 0.4, E.out), 0) - prog(t, B(61), 0.45, E.inOut) * 3;
  }

  function withStep(c, t) {
    const k = holdStep(t);
    const s = c.s * (1 + 0.012 * k);
    return { s, x: c.x + (402 * c.s - 402 * s) / 2, y: c.y + (874 * c.s - 874 * s) / 2 - 5 * k };
  }

  function screenRect(t) {
    if (t < B(5)) return BAND;
    if (t < B(62)) return mixRect(BAND, FULL, prog(t, B(5), 0.55, E.smooth));
    return mixRect(FULL, APP_ICON, prog(t, B(62), 0.45, E.inOut));
  }

  function edgeScale(t) {
    if (t < B(5)) return 0;
    if (t < B(62)) return prog(t, B(5), 0.4, E.out);
    return 1 - prog(t, B(62) + 0.05, 0.3, E.in);
  }

  function drifted(c, since) {
    const k = 1 + 0.008 * Math.max(0, since);
    return { s: c.s * k, x: 720 - (720 - c.x) * k, y: 720 - (720 - c.y) * k };
  }

  let SHOTS;
  function shots() {
    return SHOTS || (SHOTS = [
      { t0: 0, d: 0, cam: CAMS.homeA, rest: B(8.95) },
      { t0: B(13) + 0.15, d: 0.7, cam: CAMS.whole },
      { t0: V.tap + 0.1, d: 0.7, cam: CAMS.voice },
      { t0: V_OUT + 0.15, d: 0.6, cam: CAMS.whole },
      { t0: S.tap + 0.1, d: 0.6, cam: CAMS.scan },
      { t0: S_OUT, d: 0.6, cam: CAMS.whole },
      { t0: DROP, d: 0.6, cam: CAMS.statsA },
      { t0: B(39), d: 0.6, cam: CAMS.statsB },
      { t0: B(43), d: 0.6, cam: CAMS.budCard },
      { t0: BUD_LIST, d: 0.6, cam: CAMS.bud },
      { t0: B(48), d: 0.5, cam: CAMS.det },
    ].map((s) => ({ ...s, rest: s.rest ?? s.t0 + s.d })));
  }

  function camera(t) {
    const list = shots();
    const at = (i) => drifted(list[i].cam, t - list[i].rest);
    let i = 0;
    while (i + 1 < list.length && t >= list[i + 1].t0) i++;
    if (t < B(53) + 0.1) return i ? camMix(at(i - 1), at(i), prog(t, list[i].t0, list[i].d, E.smooth)) : at(0);
    if (t < B(62)) return withStep(camMix(at(list.length - 1), CAMS.phone, prog(t, B(53) + 0.1, 0.8, E.smooth)), t);
    const q = prog(t, B(62), 0.45, E.inOut);
    const icx = APP_ICON.x + APP_ICON.w / 2, icy = APP_ICON.y + APP_ICON.h / 2;
    const s = lerp(CAMS.phone.s, ICON.size / APP_ICON.w, q);
    const cx = lerp(CAMS.phone.x + icx * CAMS.phone.s, 720, q), cy = lerp(CAMS.phone.y + icy * CAMS.phone.s, 720, q);
    return { s, x: cx - icx * s, y: cy - icy * s };
  }

  const series = {
    all: C.balanceSeries("All", 0),
    main: C.balanceSeries("Main card", 0),
    sav: C.balanceSeries("Savings", 0),
    allV: C.balanceSeries("All", 1),
    allS: C.balanceSeries("All", 2),
  };
  const SM = C.periodStats("thisMonth");
  const S6 = C.periodStats("sixMonths");
  const FOODCUM = C.foodCumulative();
  const BAL = series.all[29].v, BAL_V = series.allV[29].v, BAL_S = series.allS[29].v;

  function sparkPoints(vals) {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = Math.max(1, (hi - lo) / 5);
    const dmin = lo - pad, dmax = hi + pad;
    return vals.map((v, i) => [(i + 0.5) * (402 / 30), 129.4 * (1 - (v - dmin) / (dmax - dmin))]);
  }

  const AURA = "background:linear-gradient(90deg,var(--auraTop),var(--auraBottom));-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.72) 16%,rgba(0,0,0,0) 50%);mask-image:linear-gradient(180deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.72) 16%,rgba(0,0,0,0) 50%)";

  function build(stage) {
    STAGE = stage;
    const img = (name) => `<img src="${window.ASSETS.logo[name]}" style="position:absolute;left:50%;top:0;height:100%;aspect-ratio:1;transform:translateX(-50%)">`;
    stage.innerHTML = `
      <div class="full" style="background:var(--bg)"></div>
      <div class="cam" data-k="device">
        <div class="abs" data-k="devShadow"></div>
        ${["btnL1", "btnL2", "btnL3", "btnR"].map((k) => `<div class="abs" data-k="${k}" style="background:linear-gradient(90deg,#1E2320,#3A403B 50%,#1E2320)"></div>`).join("")}
        <div class="abs" data-k="devBody" style="background:linear-gradient(145deg,#4A504B 0%,#262B27 22%,#1A1E1B 50%,#2B302C 78%,#454B46 100%);box-shadow:inset 0 0 0 0.6px rgba(255,255,255,.22)">
          <div class="abs" data-k="devBezel" style="background:#070807"></div>
        </div>
        <div class="screen" data-k="screen">
          <div class="screen" data-k="springL">${U.springboard()}</div>
          <div class="screen" data-k="appClip"><div class="screen" data-k="appWin">
            <div class="screen" style="background:var(--bg)"></div>
            <div class="screen" data-k="auraReveal"><div class="screen" style="${AURA}"></div></div>
            <div class="screen" data-k="homeL">${U.homeScreen()}</div>
            <div class="screen" data-k="statsL">${U.statsScreen()}</div>
            <div class="screen" data-k="budL">${U.budgetsScreen()}</div>
            <div class="screen" data-k="detL" style="overflow:hidden;box-shadow:-10px 0 30px rgba(20,26,21,.10)">
              <div class="screen" style="background:var(--bg)"></div><div class="screen" style="${AURA}"></div>${U.detailScreen()}</div>
            <div class="abs" data-k="sheetL" style="left:0;top:${SHEET_TOP}px;width:402px;height:${874 - SHEET_TOP}px;border-radius:38px 38px 0 0;overflow:hidden;box-shadow:0 -8px 30px rgba(20,26,21,.10)">
              <div class="screen" style="background:var(--bg)"></div><div class="screen" style="${AURA}"></div>${U.periodSheet()}</div>
            <div class="screen" data-k="voiceL">${U.voiceScreen()}</div>
            <div class="screen" data-k="scanReadL">${U.scanReading()}</div>
            <div class="screen" data-k="scanRevL">${U.scanReview()}</div>
            <div class="screen" data-k="scanCamL" style="overflow:hidden">${U.scanCamera()}</div>
            <div class="screen" data-k="addL">
              <div class="screen" style="background:
                radial-gradient(circle 390px at 0% 0%, rgba(211,240,201,.72) 12px, rgba(211,240,201,0) 390px),
                radial-gradient(circle 420px at 100% 0%, rgba(148,215,136,.62) 20px, rgba(148,215,136,0) 420px),
                radial-gradient(circle 470px at 50% 100%, rgba(228,244,222,.5) 20px, rgba(228,244,222,0) 470px),
                var(--bg)"></div>
              ${U.addScreen()}</div>
            <div class="abs center" data-k="mSave" style="overflow:hidden">
              <div class="abs center mask" style="inset:0"><div data-k="mSaveText">${U.txt("Save", 18.5, 600, "#FFFFFF")}</div></div>
              <div class="abs" data-k="mLogoV" style="inset:0">${img("h-m")}</div>
              <div class="abs" data-k="mLogoS" style="inset:0">${img("lidl")}</div>
            </div>
            <div class="abs" data-k="tapHost" style="left:0;top:0"></div>
          </div></div>
          <div class="screen" data-k="overlay">${U.phoneOverlay()}</div>
        </div>
      </div>
      <div class="full" data-k="speech">
        <div class="abs mask" style="left:760px;top:576px;width:620px;height:32px"><div data-k="spOver" style="font-size:21px;font-weight:600;letter-spacing:0.12em;color:var(--t3);line-height:32px">VOICE ENTRY</div></div>
        ${[0, 1, 2].map((i) => `<div class="abs mask" style="left:700px;top:${630 + i * 78}px;width:740px;height:84px"><div data-k="spL${i}" style="padding-left:60px;font-size:64px;font-weight:700;letter-spacing:-0.025em;line-height:78px;color:var(--t1);white-space:nowrap">${[
          `<span data-k="spQ">“</span><span data-k="spT">T-shirt</span> from <span data-k="spH">H&amp;M</span>,`,
          `<span data-k="spA1">fourteen</span>`,
          `<span data-k="spA2">ninety-nine</span>.”`,
        ][i]}</div></div>`).join("")}
        ${["spUT", "spUH", "spUA1", "spUA2"].map((k) => `<div class="abs" data-k="${k}" style="height:6px;border-radius:3px;background:var(--leaf)"></div>`).join("")}
      </div>
      <div class="full" data-k="caption">
        <div class="abs mask" style="left:790px;top:560px;width:600px;height:32px"><div data-k="capOver" style="font-size:21px;font-weight:600;letter-spacing:0.12em;color:var(--t3);line-height:32px">PRIVACY</div></div>
        <div class="abs mask" style="left:790px;top:614px;width:640px;height:78px"><div data-k="capL1" style="font-size:66px;font-weight:700;letter-spacing:-0.025em;line-height:78px;color:var(--t1)">Stored on your</div></div>
        <div class="abs mask" style="left:790px;top:686px;width:640px;height:84px"><div data-k="capL2" style="font-size:66px;font-weight:700;letter-spacing:-0.025em;line-height:78px;color:var(--t1)">device by default.</div></div>
      </div>
      <div class="full" data-k="word">
        <div class="abs" data-k="wmRow" style="font-size:188px;font-weight:700;letter-spacing:-0.035em;line-height:1;color:var(--t1);white-space:nowrap">
          <div class="abs mask" data-k="wmClip" style="left:0;top:-30px;height:260px">${"Rolyn".split("").map((ch, i) => `<span class="abs" data-k="wm${i}" style="top:30px">${ch}</span>`).join("")}</div>
        </div>
        <div class="abs mask" data-k="slClip"><div data-k="sl" style="font-size:42px;font-weight:500;letter-spacing:-0.01em;color:var(--t2);line-height:58px;white-space:nowrap">Your money, in plain view.</div></div>
        <div class="abs" data-k="icon" style="overflow:hidden"><img src="${window.ASSETS.icon}" data-k="iconImg" style="position:absolute;left:0;top:0;width:100%;height:100%">
          <div class="abs" data-k="iconGreen" style="left:50%;top:50%;border-radius:50%;background:var(--leaf)"></div></div>
        <div class="abs" data-k="dot" style="width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;background:var(--leaf)"></div>
      </div>`;
    collect(stage);
    $.tapHost.innerHTML = Array.from({ length: 3 }, (_, i) => `<div class="tap" data-k="tap${i}"></div>`).join("");
    collect($.tapHost);

    $.balRoll = makeRoller($.balFig, 58, 600, "var(--t1)", "center", "letter-spacing:-0.4px");
    $.cfNetRoll = makeRoller($.cfNet, 36, 600, "var(--t1)", "left");
    $.cfBadgeRoll = makeRoller($.cfBadgeV, 13, 600, "var(--green)", "left");
    $.lgExpVRoll = makeRoller($.lgExpV, 16.5, 600, "var(--t1)", "right");
    $.lgIncVRoll = makeRoller($.lgIncV, 16.5, 600, "var(--green)", "right");
    $.lgExpDRoll = makeRoller($.lgExpD, 12, 400, "var(--green)", "right");
    $.lgIncDRoll = makeRoller($.lgIncD, 12, 400, "var(--spent)", "right");
    $.tileExpVRoll = makeRoller($.tileExpV, 21, 600, "var(--t1)", "left");
    $.tileIncVRoll = makeRoller($.tileIncV, 21, 600, "var(--t1)", "left");
    $.tileExpDRoll = makeRoller($.tileExpD, 12, 600, "var(--green)", "left");
    $.tileIncDRoll = makeRoller($.tileIncD, 12, 600, "var(--spent)", "left");

    const head = document.createElementNS("http://www.w3.org/2000/svg", "path");
    head.setAttribute("d", catmull(sparkPoints(series.all.map((p) => p.v))));
    head.setAttribute("fill", "none");
    head.style.visibility = "hidden";
    $.spark.appendChild(head);
    $.headPath = head;
    SPARK_LEN = head.getTotalLength();

    buildBars();
    buildCats();
    buildAxes();
    buildDetail();
    buildAmount();
    buildBadge();
    buildBudgetCarry();
    layoutWordmark();
    buildPills();
    buildSpeech();
    $.hdr.style.cssText = "position:absolute;left:0;top:0;width:402px;height:874px;clip-path:inset(46px 0 0 0)";
  }

  const PILL = {};
  function buildPills() {
    const w = (label) => 9 + 26 + 8 + measure(label, 15.5, 600) + 17;
    PILL.w = [w("All"), w("Main card"), w("Savings")];
    PILL.x = [20, 20 + PILL.w[0] + 10, 20 + PILL.w[0] + 10 + PILL.w[1] + 10];
    PILL.scroll = -Math.max(0, PILL.x[2] + PILL.w[2] + 4 - 324);
    $.pill1.style.left = PILL.x[1] + "px";
    $.pill2.style.left = PILL.x[2] + "px";
  }

  function buildSpeech() {
    const k = stageScale();
    const box = (el) => {
      const r = el.getBoundingClientRect(), s = STAGE.getBoundingClientRect();
      return { x: (r.left - s.left) / k, w: r.width / k };
    };
    $.spL0.style.paddingLeft = 60 - box($.spQ).w + "px";
    const under = (key, word, line) => {
      const b = box(word);
      Object.assign($[key].style, { left: b.x + "px", top: 630 + line * 78 + 75 + "px", width: b.w + "px" });
    };
    under("spUT", $.spT, 0);
    under("spUH", $.spH, 0);
    under("spUA1", $.spA1, 1);
    under("spUA2", $.spA2, 2);
  }

  const BAR = { day: [], week: [] };
  function buildBars() {
    const ns = "http://www.w3.org/2000/svg";
    const mk = (g, arr, n) => {
      for (let i = 0; i < n; i++) {
        const e = document.createElementNS(ns, "rect");
        e.setAttribute("fill", "url(#gExp)");
        const inc = document.createElementNS(ns, "rect");
        inc.setAttribute("fill", "url(#gInc)");
        g.appendChild(e); g.appendChild(inc);
        arr.push([e, inc]);
      }
    };
    mk($.barsDay, BAR.day, SM.bars.length);
    mk($.barsWeek, BAR.week, S6.bars.length);
  }

  function ghostPath(S) {
    const w = U.CF.chartW, h = U.CF.plotH, n = S.bars.length, slot = w / n;
    const y = (v) => h - (Math.min(v, S.max) / S.max) * h;
    const mk = (key) => {
      const pts = S.prevBars.slice(0, n).map((b, i) => [(i + 0.5) * slot, y(b[key])]);
      let d = "";
      pts.forEach((p, i) => {
        if (!i) d += `M${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
        else { const mx = (pts[i - 1][0] + p[0]) / 2; d += `H${mx.toFixed(2)}V${p[1].toFixed(2)}H${p[0].toFixed(2)}`; }
      });
      return d;
    };
    return { exp: mk("exp"), inc: mk("inc") };
  }
  const GHOST = { month: ghostPath(SM), six: ghostPath(S6) };

  function setBars(arr, S, hFn) {
    const w = U.CF.chartW, h = U.CF.plotH, n = S.bars.length, slot = w / n;
    const bw = n > 20 ? 5 : n > 12 ? 8 : 14;
    S.bars.forEach((b, i) => {
      const f = hFn(i, n);
      const cx = (i + 0.5) * slot;
      const eh = (b.exp / S.max) * h * f, ih = (b.inc / S.max) * h * f;
      const [re, ri] = arr[i];
      re.setAttribute("x", (cx - bw).toFixed(2)); re.setAttribute("width", bw);
      re.setAttribute("y", (h - eh).toFixed(2)); re.setAttribute("height", Math.max(0, eh).toFixed(2));
      re.setAttribute("rx", Math.max(0, Math.min(7, bw / 2, eh / 2)).toFixed(2));
      ri.setAttribute("x", cx.toFixed(2)); ri.setAttribute("width", bw);
      ri.setAttribute("y", (h - ih).toFixed(2)); ri.setAttribute("height", Math.max(0, ih).toFixed(2));
      ri.setAttribute("rx", Math.max(0, Math.min(7, bw / 2, ih / 2)).toFixed(2));
    });
  }

  function buildAxes() {
    const w = U.CF.chartW;
    const mk = (S, key) => {
      const n = S.bars.length, slot = w / n;
      const stride = Math.max(1, Math.ceil(n / (S.p.gran === "day" ? 8 : 6)));
      let html = "";
      for (let i = 0; i < n; i += stride) {
        const cx = (i + stride / 2) * slot;
        if (cx + 18 > w) break;
        const d = C.dayOf(S.bars[i].start);
        const label = S.p.gran === "day" ? String(d.getUTCDate()) : d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) + " " + d.getUTCDate();
        html += `<div class="abs mask" style="left:${cx - 40}px;width:80px;top:0;height:20px;text-align:center"><div data-k="${key}${i}">${U.txt(label, S.p.gran === "day" ? 14 : 12, 400, "var(--t3)")}</div></div>`;
      }
      return html;
    };
    $.cfAxis.innerHTML = mk(SM, "axM") + mk(S6, "axW");
    collect($.cfAxis);
    $.axM = [...$.cfAxis.querySelectorAll('[data-k^="axM"]')];
    $.axW = [...$.cfAxis.querySelectorAll('[data-k^="axW"]')];
  }

  function buildCats() {
    S6.cats.forEach((cat, i) => {
      const up = cat.delta > 0;
      $["cat" + i].innerHTML = `<div class="abs" data-k="catIn${i}" style="left:0;top:0;width:362px;height:62px">${U.catRowInner(cat, usd(Math.abs(cat.delta)), up, !up, i > 0)}</div>`;
    });
    collect($.catCard);
    $.foodRowIndex = S6.cats.findIndex((c) => c.name === "Food");
  }

  const BADGE = { x: 26 };
  function buildBadge() {
    BADGE.v0 = measure(usd(SM.net - SM.pnet, true), 13, 600);
    BADGE.v1 = measure(usd(S6.net - S6.pnet, true), 13, 600);
    BADGE.tail = measure("vs last period", 13, 400);
    $.cfSeed.style.top = "6px";
  }

  function buildBudgetCarry() {
    const cat = S6.cats[$.foodRowIndex];
    const up = cat.delta > 0, color = up ? "var(--spent)" : "var(--green)";
    const shareHost = $.bud0s.parentElement;
    shareHost.style.position = "relative";
    shareHost.insertAdjacentHTML("beforeend", `<div class="abs" data-k="bud0share" style="left:0;top:0">${U.txt((cat.share * 100).toFixed(1) + "%", 13, 400, "var(--t3)")}</div>`);
    $.bud0.insertAdjacentHTML("beforeend", `<div class="abs mask" style="right:20px;top:10px;width:170px;height:46px;text-align:right"><div data-k="bud0carry" style="padding-top:2px">
      ${U.txt(usd(cat.amount), 16.5, 600, "var(--t1)", "display:block")}
      <div class="row" style="justify-content:flex-end;gap:2px;margin-top:2px">${U.sym((up ? "arrow.up" : "arrow.down") + "@bold", 9, color)}${U.txt(usd(Math.abs(cat.delta)), 12, 500, color)}</div></div></div>`);
    collect($.bud0);
  }

  function buildDetail() {
    const x = (day) => 19 + (day - 1) * 12.519;
    const y = (v) => 414.3 - (v / 100) * 0.18177 - U.DET.chartTop;
    const pts = FOODCUM.map((p) => [x(p.day), y(p.v)]);
    $.detLine.setAttribute("d", monotone(pts));
    $.detArea.setAttribute("d", monotone(pts) + ` L${pts[pts.length - 1][0].toFixed(2)} ${(414.3 - U.DET.chartTop).toFixed(2)} L${pts[0][0].toFixed(2)} ${(414.3 - U.DET.chartTop).toFixed(2)} Z`);
    const end = pts[pts.length - 1];
    $.detFc.setAttribute("d", `M${end[0].toFixed(2)} ${end[1].toFixed(2)} L${x(30).toFixed(2)} ${y(63755).toFixed(2)}`);
    for (const el of [$.detDot, $.detRing]) {
      el.setAttribute("cx", end[0].toFixed(2));
      el.setAttribute("cy", end[1].toFixed(2));
    }
    const ly = y(75000);
    $.detLimit.setAttribute("y1", ly.toFixed(2));
    $.detLimit.setAttribute("y2", ly.toFixed(2));
    $.detLimitLabel.style.left = "329px";
    $.detLimitLabel.style.top = "253.5px";
    $.detAxis.innerHTML = [[6, 125.5], [13, 213.5], [20, 302.3], [27, 355.5]].map(([d, cx]) => `<div class="abs" style="left:${cx - 20}px;width:40px;top:0;text-align:center">${U.txt(String(d), 11, 400, "var(--t3)")}</div>`).join("");
  }

  const AMT = {};
  function buildAmount() {
    $.amount.innerHTML = `<div class="abs" data-k="amtCur" style="top:${((78 - 40) * 1.066).toFixed(2)}px">${U.txt("$", 40, 600, "var(--t2)")}</div>`;
    collect($.amount);
    AMT.cur = measure("$", 40, 600);
    for (const [key, text] of [["V", "14,99"], ["S", "64,30"]]) {
      const row = document.createElement("div");
      row.className = "abs";
      row.style.cssText = `top:0;height:${78 * LH}px`;
      $.amount.appendChild(row);
      let x = 0;
      const cells = text.split("").map((ch) => {
        const w = measure(ch, 78, 700, "font-variant-numeric:tabular-nums");
        const el = document.createElement("div");
        el.className = "abs mask";
        el.style.cssText = `left:${x}px;top:0;width:${w + 4}px;height:${78 * LH}px`;
        el.innerHTML = `<div>${U.txt(ch, 78, 700, "var(--t1)", "font-variant-numeric:tabular-nums")}</div>`;
        row.appendChild(el);
        x += w;
        return el;
      });
      const left = 201 - (x + 8 + AMT.cur) / 2;
      row.style.left = left + "px";
      AMT[key] = { row, cells, cur: left + x + 8 };
    }
  }

  const WM = {};
  function layoutWordmark() {
    const k = stageScale();
    const spans = [0, 1, 2, 3, 4].map((i) => $["wm" + i]);
    const widths = spans.map((s) => s.getBoundingClientRect().width / k);
    let x = 0;
    WM.letters = spans.map((s, i) => { const lx = x; x += widths[i]; return lx; });
    WM.textW = x;
    WM.dot = 0.19 * 188;
    WM.gap = 0.06 * 188;
    WM.total = WM.textW + WM.gap + WM.dot;
    WM.left = (1440 - WM.total) / 2;
    WM.baseline = 680;
    WM.top = WM.baseline - 188 * 0.82;
    $.wmRow.style.left = WM.left + "px";
    $.wmRow.style.top = WM.top + "px";
    spans.forEach((s, i) => { s.style.left = WM.letters[i] + "px"; });
    $.wmClip.style.width = WM.textW + 6 + "px";
    WM.dotX = WM.left + WM.textW + WM.gap + WM.dot / 2;
    WM.dotY = WM.top + 188 * 0.82 - WM.dot / 2 - 1;
    const slW = $.sl.getBoundingClientRect().width / k;
    $.slClip.style.left = (1440 - slW) / 2 + "px";
    $.slClip.style.top = WM.baseline + 58 + "px";
    $.slClip.style.width = slW + 4 + "px";
    $.slClip.style.height = "60px";
  }

  function apply(t) {
    applyWord(t);
    applyDevice(t);
    applyHome(t);
    applyVoice(t);
    applySpeech(t);
    applyScan(t);
    applyAdd(t);
    applyStats(t);
    applySheet(t);
    applyBudgets(t);
    applyDetail(t);
    applyCaption(t);
    applySpringboard(t);
    applyTaps(t);
  }

  let SPARK_LEN = 0;
  function lineHead(p) {
    const pt = $.headPath.getPointAtLength(SPARK_LEN * p);
    return toStage(CAMS.homeA, pt.x, 291.5 + pt.y);
  }

  function applyWord(t) {
    const endIn = B(65);
    const gather = prog(t, B(2), 0.42, E.in);
    const clipR = WM.textW * (1 - gather);
    for (let i = 0; i < 5; i++) {
      const el = $["wm" + i];
      const inn = spring(t, endIn + i * 0.045, 0.5, 0.86);
      const dx = t < endIn ? (WM.textW + 6 - WM.letters[i]) * gather : 0;
      const y = t >= endIn - 0.01 ? (1 - clamp(inn, 0, 1.2)) * 240 : 0;
      show(el, t < B(2) + 0.45 || t >= endIn);
      setT(el, `translate(${dx.toFixed(2)}px,${y.toFixed(2)}px)`);
    }
    $.wmClip.style.clipPath = t < endIn ? `inset(0 ${(WM.textW + 6 - clipR).toFixed(2)}px 0 0)` : "none";
    const slOut = prog(t, B(2), 0.3, E.in);
    const slIn = spring(t, B(66), 0.5, 0.88);
    setT($.sl, `translateY(${(t >= B(66) ? (1 - slIn) * 105 : slOut * 105).toFixed(2)}%)`);
    show($.slClip, t < B(3) || t >= B(66));

    let dx = WM.dotX, dy = WM.dotY, ds = 1, dVis = true;
    const beatPulse = (b) => 0.1 * pulse(t, B(b), 0.32);
    if (t < B(3)) {
      ds = 1 + beatPulse(1);
    } else if (t < B(4)) {
      const pp = 0.28 * pulse(t, B(3), 0.3);
      const travel = prog(t, B(3) + 0.12, P - 0.12, E.smooth);
      const [sx, sy] = lineHead(0);
      dx = lerp(WM.dotX, sx, travel);
      dy = lerp(WM.dotY, sy, travel) - Math.sin(Math.PI * travel) * 120;
      ds = (1 + pp) * lerp(1, 0.42, travel);
    } else if (t < B(5) + 0.2) {
      [dx, dy] = lineHead(prog(t, B(4), 0.62, E.smooth));
      ds = t < B(5) ? 0.42 : lerp(0.42, 0, prog(t, B(5), 0.2, E.in));
      dVis = ds > 0.01;
    } else if (t >= B(64)) {
      const p = prog(t, B(64), P * 0.95, E.smooth);
      dx = lerp(720, WM.dotX, p);
      dy = lerp(720, WM.dotY, p) - Math.sin(Math.PI * p) * 70;
      ds = 1 + beatPulse(67) + beatPulse(68);
    } else dVis = false;
    show($.dot, dVis);
    setT($.dot, T(dx, dy, ds));
    applyIcon(t);
  }

  function applyIcon(t) {
    const on = t >= B(62) + 0.44 && t < B(64);
    show($.icon, on);
    if (!on) return;
    const shrink = prog(t, B(63) + 0.1, 0.34, E.inOut);
    const size = lerp(ICON.size, 36, shrink);
    const r = lerp(ICON.r, size / 2, shrink);
    const dot = prog(t, B(63) + 0.18, 0.26, E.inOut) * size;
    $.icon.style.left = 720 - size / 2 + "px";
    $.icon.style.top = 720 - size / 2 + "px";
    $.icon.style.width = size + "px";
    $.icon.style.height = size + "px";
    $.icon.style.borderRadius = r + "px";
    $.iconGreen.style.width = dot.toFixed(2) + "px";
    $.iconGreen.style.height = dot.toFixed(2) + "px";
    $.iconGreen.style.margin = `${(-dot / 2).toFixed(2)}px 0 0 ${(-dot / 2).toFixed(2)}px`;
  }

  const BUTTONS = [["btnL1", -1, 142, 28], ["btnL2", -1, 212, 50], ["btnL3", -1, 276, 50], ["btnR", 1, 238, 98]];

  function applyDevice(t) {
    const on = t >= B(3) + 0.1 && t < B(62) + 0.46;
    show($.device, on);
    if (!on) return;
    const c = camera(t);
    setT($.device, T(c.x, c.y, c.s));
    const r = screenRect(t);
    const k = edgeScale(t);
    $.screen.style.clipPath = inset(r);
    const e = (EDGE.bezel + EDGE.frame) * k;
    const body = { x: r.x - e, y: r.y - e, w: r.w + 2 * e, h: r.h + 2 * e, r: r.r + e };
    rectCss($.devBody, body);
    rectCss($.devShadow, body);
    const b = EDGE.bezel * k;
    rectCss($.devBezel, { x: e - b, y: e - b, w: r.w + 2 * b, h: r.h + 2 * b, r: r.r + b });
    $.devShadow.style.boxShadow = `0 ${(26 * k).toFixed(2)}px ${(50 * k).toFixed(2)}px rgba(20,26,21,${(0.2 * k).toFixed(3)}), 0 ${(6 * k).toFixed(2)}px ${(16 * k).toFixed(2)}px rgba(20,26,21,${(0.1 * k).toFixed(3)})`;
    show($.devBody, k > 0.001);
    show($.devShadow, k > 0.001);
    const bk = t < B(62) ? prog(t, B(5) + 0.25, 0.3, E.out) : 1 - prog(t, B(62), 0.2, E.in);
    for (const [key, side, y, h] of BUTTONS) {
      const w = 3.2 * bk;
      const x = side < 0 ? r.x - e - w + 0.6 : r.x + r.w + e - 0.6;
      rectCss($[key], { x, y: r.y + y * (r.h / 874), w, h: h * (r.h / 874), r: 1.4 });
      show($[key], bk > 0.01);
    }
    const camTop = scanCameraY(t);
    const light = (camTop !== null && camTop < 54) || t >= B(58) + 0.1;
    $.overlay.style.setProperty("--sb", light ? "#FFFFFF" : "var(--t1)");
    show($.homeInd, t < B(58) + 0.2);
  }

  function homeSelection(t) {
    if (t >= B(13)) return 0;
    if (t >= B(11)) return 2;
    if (t >= B(9)) return 1;
    return 0;
  }

  function sparkValues(t) {
    const key = ["all", "main", "sav"];
    const at = [B(9), B(11), B(13)];
    const order = [0, 1, 2, 0];
    let from = series.all.map((p) => p.v), to = from, p = 1;
    for (let i = 0; i < 3; i++) {
      if (t >= at[i]) {
        from = series[key[order[i]]].map((q) => q.v);
        to = series[key[order[i + 1]]].map((q) => q.v);
        p = prog(t, at[i], 0.42, E.smooth);
      }
    }
    let vals = from.map((v, i) => lerp(v, to[i], p));
    for (const [at2, s] of [[B(23), series.allV], [B(32), series.allS]]) {
      const q = prog(t, at2, 0.4, E.smooth);
      if (q > 0) vals = vals.map((v, i) => lerp(v, s[i].v, q));
    }
    return vals;
  }

  function pillScroll(t) {
    return track(t, 0, [
      { t: B(10), to: PILL.scroll, d: 0.38, e: E.snappy },
      { t: B(12), to: 0, d: 0.38, e: E.snappy },
    ]);
  }

  function applyHome(t) {
    const back = t >= HOME_BACK;
    show($.homeL, (t >= B(3) + 0.1 && t < B(34)) || back);
    const edge = lerp(874, -120, prog(t, B(5), 0.9, E.smooth));
    const mask = t < B(7) ? `linear-gradient(180deg, transparent ${edge.toFixed(1)}px, #000 ${(edge + 120).toFixed(1)}px)` : "none";
    $.auraReveal.style.webkitMaskImage = mask;
    $.auraReveal.style.maskImage = mask;

    const pts = sparkPoints(sparkValues(t));
    const d = catmull(pts);
    $.sparkLine.setAttribute("d", d);
    $.sparkArea.setAttribute("d", d + ` L${pts[29][0].toFixed(2)} 130 L${pts[0][0].toFixed(2)} 130 Z`);
    const len = $.sparkLine.getTotalLength();
    $.sparkLine.style.strokeDasharray = `${len.toFixed(1)} ${len.toFixed(1)}`;
    $.sparkLine.style.strokeDashoffset = ((1 - prog(t, B(4), 0.62, E.smooth)) * len).toFixed(1);
    $.sparkAreaClip.setAttribute("y", ((1 - prog(t, B(5), 0.5, E.out)) * 130).toFixed(2));
    for (let i = 0; i < 4; i++) rise($["axis" + i], prog(t, B(5) + 0.12 + i * 0.05, 0.4, E.out));
    rise($.balLabel, prog(t, B(6), 0.42, E.out));
    setRoller($.balRoll, t, [
      { t: B(6) + 0.08, v: usd(BAL) },
      { t: B(9) + 0.04, v: usd(series.main[29].v) },
      { t: B(11) + 0.04, v: usd(series.sav[29].v) },
      { t: B(13) + 0.04, v: usd(BAL) },
      { t: B(23), v: usd(BAL_V) },
      { t: B(32), v: usd(BAL_S) },
    ], 0.34);

    ["hdrWs", "hdrSc", "hdrGear"].forEach((key, i) => {
      const at = B(7) + 0.05 + i * 0.06;
      setT($[key], `translateY(${((1 - spring(t, at, 0.55, 0.82)) * -90).toFixed(2)}px)`);
      show($[key], t > at);
    });

    const pressAt = [B(13), B(9), B(11)];
    [0, 1, 2].forEach((i) => {
      const p = spring(t, B(8) + i * 0.06, 0.5, 0.8);
      $["pill" + i].style.transform = `translateY(${((1 - p) * 64).toFixed(2)}px) scale(${press(t, pressAt[i], 0.95).toFixed(4)})`;
    });
    setT($.pillAdd, `scale(${Math.max(0, spring(t, B(8) + 0.18, 0.45, 0.62)).toFixed(4)})`);
    $.pillRow.style.transform = `translateX(${pillScroll(t).toFixed(2)}px)`;
    const moves = [{ t: B(9), i: 1 }, { t: B(11), i: 2 }, { t: B(13), i: 0 }];
    $.thumb.style.left = track(t, PILL.x[0], moves.map((m) => ({ t: m.t, to: PILL.x[m.i], spring: [0.3, 0.86] }))).toFixed(2) + "px";
    $.thumb.style.width = track(t, PILL.w[0], moves.map((m) => ({ t: m.t, to: PILL.w[m.i], spring: [0.3, 0.86] }))).toFixed(2) + "px";
    $.thumb.style.transform = `translateY(${((1 - spring(t, B(8), 0.5, 0.8)) * 64).toFixed(2)}px)`;
    const sel = homeSelection(t);
    ["pill0t", "pill1t", "pill2t"].forEach((key, i) => { $[key].style.color = i === sel ? "var(--t1)" : "var(--t2)"; });

    rise($.recent, prog(t, B(13) + 0.3, 0.4, E.out));
    const listGrow = prog(t, B(13) + 0.35, 0.55, E.smooth);
    $.list.style.clipPath = `inset(0 0 ${((1 - listGrow) * 100).toFixed(2)}% 0 round 32px)`;
    applyRows(t);

    [["fabScan", 0, S.tap], ["fabMic", 0.05, V.tap], ["fabAdd", 0.1, null]].forEach(([key, d, at]) => {
      const s = Math.max(0, spring(t, B(14) + d, 0.42, 0.62)) * (at === null ? 1 : press(t, at, 0.92));
      setT($[key], `scale(${s.toFixed(4)})`);
    });

    const dy = back ? 0 : prog(t, DROP, 0.36, E.smooth) * 874;
    for (const key of ["hdr", "balLabelM", "balFigM", "spark", "axis", "pills", "recentM", "fabScan", "fabMic", "fabAdd", "list"]) {
      $[key].style.translate = `0 ${dy.toFixed(2)}px`;
    }
  }

  function applyRows(t) {
    const shiftV = prog(t, V_OUT + 0.08, 0.42, E.snappy);
    const shiftS = prog(t, S_OUT + 0.08, 0.42, E.snappy);
    const top0 = 570.2;
    const away = t >= DROP && t < HOME_BACK;
    for (let i = 0; i < 6; i++) {
      let slot, enter = 1, on;
      if (i === 0) { slot = 0; on = t >= S_OUT && !away; }
      else if (i === 1) { slot = shiftS; on = t >= V_OUT; }
      else { slot = i - 2 + shiftV + shiftS; enter = prog(t, B(13) + 0.45 + (i - 2) * 0.05, 0.45, E.out); on = slot < 4; }
      const el = $["row" + i];
      el.style.top = top0 + slot * 69 + (1 - enter) * 60 + "px";
      show(el, on);
      el.style.clipPath = slot > 3 ? `inset(0 0 ${(clamp(slot - 3) * 100).toFixed(1)}% 0)` : "none";
      show($["row" + i + "sep"], slot >= 0.5);
    }
    for (const [i, out] of [[0, S_OUT], [1, V_OUT]]) {
      rise($["row" + i + "t"], prog(t, out + 0.3, 0.36, E.out));
      rise($["row" + i + "a"], prog(t, out + 0.34, 0.36, E.out));
      show($["row" + i + "av"], t >= out + 0.5);
    }
    $.sepAll.style.top = top0 + 4 * 69 - 1 + "px";
    $.viewAll.style.top = top0 + 4 * 69 + "px";
  }

  const VOICE_CARD = { bottom: 728, listen: 22 + 1.23 * 22 + 10 + 18 * LH + 22, work: 96 };

  function voiceCardRect(t) {
    const pr = prog(t, V.stop + 0.08, 0.3, E.snappy);
    const h = lerp(VOICE_CARD.listen, VOICE_CARD.work, pr);
    return { x: 20, y: VOICE_CARD.bottom - h, w: 362, h, r: 24, pr };
  }

  function applyVoice(t) {
    const on = t >= V.open && t < V.fill + 0.45;
    show($.voiceL, on);
    if (!on) return;
    $.vDim.style.opacity = (0.4 * prog(t, V.open, 0.25, E.out)).toFixed(3);
    const up = (1 - clamp(spring(t, V.open, 0.5, 0.86), 0, 1.04)) * 320;
    const card = voiceCardRect(t);
    rectCss($.vCard, card);
    for (const key of ["vCard", "vStop", "vCancel", "vSpinHost"]) $[key].style.translate = `0 ${up.toFixed(2)}px`;

    const waveOut = prog(t, V.stop + 0.04, 0.2, E.in);
    setT($.vWave, `scale(${(1 - waveOut).toFixed(3)})`);
    const a = lerp(-35, 100, ((t - V.open) / 0.9) % 1);
    $.vWaveHi.style.clipPath = `inset(0 ${(100 - Math.min(100, a + 35)).toFixed(2)}% 0 ${Math.max(0, a).toFixed(2)}%)`;
    $.vTextM.style.top = lerp(22 + 1.23 * 22 + 10, (VOICE_CARD.work - 18 * LH) / 2, card.pr).toFixed(2) + "px";
    const roll = prog(t, V.stop + 0.06, 0.3, E.snappy);
    sink($.vListen, roll);
    rise($.vRecog, roll);

    const out = prog(t, V.stop + 0.04, 0.22, E.in);
    $.vStop.style.transform = `scale(${((1 - out) * press(t, V.stop, 0.92)).toFixed(4)})`;
    $.vCancel.style.transform = `scale(${(1 - out).toFixed(4)})`;
    setT($.vSpinHost, `scale(${clamp(spring(t, V.stop + 0.14, 0.4, 0.8), 0, 1.1).toFixed(4)})`);
    show($.vSpinHost, t >= V.stop + 0.14);
    spin("vSpin", t);
  }

  function applySpeech(t) {
    const on = t >= B(16) && t < V.save + 0.5;
    show($.speech, on);
    if (!on) return;
    const lines = [["spOver", B(16)], ...PHRASE.lines.map((d, i) => ["spL" + i, PHRASE.t0 + d])];
    lines.forEach(([key, at], i) => {
      const y = t < V.save ? (1 - spring(t, at, 0.5, 0.88)) * 110 : prog(t, V.save + 0.02 + (3 - i) * 0.04, 0.3, E.in) * -110;
      $[key].style.transform = `translateY(${y.toFixed(2)}%)`;
    });
    const underline = (key, at, line) => {
      const p = prog(t, at, 0.34, E.smooth);
      const y = t < V.save ? 0 : prog(t, V.save + 0.02 + (3 - line) * 0.04, 0.3, E.in) * -86;
      $[key].style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0 round 3px)`;
      $[key].style.transform = `translateY(${y.toFixed(2)}px)`;
      show($[key], p > 0 && y > -80);
    };
    underline("spUA1", V.fill + 0.2, 2);
    underline("spUA2", V.fill + 0.32, 3);
    underline("spUH", V.fill + 0.45, 1);
    underline("spUT", V.sub + 0.1, 1);
  }

  function scanCameraY(t) {
    if (t < S.open || t >= S.read + 0.36) return null;
    return (1 - clamp(spring(t, S.open, 0.42, 0.9), 0, 1)) * 874 + prog(t, S.read, 0.36, E.in) * 874;
  }

  function applyScan(t) {
    const camY = scanCameraY(t);
    show($.scanCamL, camY !== null);
    if (camY !== null) {
      setT($.scanCamL, `translateY(${camY.toFixed(2)}px)`);
      const p = U.RECEIPT.paper;
      const lock = spring(t, S.lock, 0.42, 0.8);
      const k = 1 + 0.22 * (1 - clamp(lock, 0, 1.2));
      rectCss($.scanQuad, { x: p.x - (p.w * (k - 1)) / 2, y: p.y - (p.h * (k - 1)) / 2, w: p.w * k, h: p.h * k, r: 3 });
      $.scanQuad.style.transform = `rotate(${(p.rot + 3 * (1 - clamp(lock))).toFixed(3)}deg)`;
      show($.scanQuad, t >= S.lock - 0.02 && t < S.shot + 0.1);
      $.scanShutter.style.transform = `scale(${press(t, S.shot, 0.9).toFixed(4)})`;
      $.scanSave.style.transform = `scale(${(clamp(spring(t, S.shot + 0.12, 0.4, 0.7), 0, 1.2) * press(t, S.done, 0.9)).toFixed(4)})`;
      show($.scanSave, t >= S.shot + 0.12);
      const fly = prog(t, S.shot + 0.08, 0.36, E.inOut);
      const kk = lerp(1, 40 / p.w, fly);
      const tx = lerp(0, 46 - (p.x + p.w / 2), fly), ty = lerp(0, 762 + (p.h * kk) / 2 - (p.y + p.h / 2), fly);
      $.scanShot.style.transformOrigin = "50% 50%";
      $.scanShot.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${lerp(p.rot, 0, fly).toFixed(3)}deg) scale(${kk.toFixed(4)})`;
      show($.scanShot, t >= S.shot + 0.08);
    }

    const readOn = t >= S.read && t < S.confirm + 0.55;
    show($.scanReadL, readOn);
    if (readOn) {
      const out = prog(t, S.review, 0.2, E.in);
      $.readInner.style.transformOrigin = "201px 447px";
      $.readInner.style.transform = `scale(${(1 - out).toFixed(4)})`;
      show($.readInner, out < 1);
      spin("readSpin", t);
    }

    const revOn = t >= S.review && t < S.confirm + 0.55;
    show($.scanRevL, revOn);
    if (revOn) {
      rise($.revHead, prog(t, S.review + 0.05, 0.36, E.out));
      $.revCard.style.transform = `translateY(${((1 - spring(t, S.review + 0.08, 0.5, 0.86)) * 700).toFixed(2)}px)`;
      [0, 1, 2].forEach((i) => rise($["revF" + i], prog(t, S.review + 0.3 + i * 0.1, 0.34, E.out)));
      $.revItems.style.transform = `translateY(${((1 - spring(t, S.review + 0.2, 0.55, 0.86)) * 600).toFixed(2)}px)`;
      for (let i = 0; i < U.RECEIPT.items.length + 2; i++) {
        $["revI" + i].style.transform = `translateY(${((1 - spring(t, S.review + 0.3 + i * 0.045, 0.45, 0.86)) * 40).toFixed(2)}px)`;
      }
      $.revBar.style.transform = `translateY(${((1 - spring(t, S.review + 0.35, 0.5, 0.86)) * 140).toFixed(2)}px) scale(${press(t, S.confirm, 0.96).toFixed(4)})`;
    }
  }

  const ASSEMBLE = [
    ["addClose", 0.16, -50], ["addToggle", 0.19, -50], ["addSerial", 0.22, -50],
    ["amount", 0.12, 40], ["addChips", 0.2, 60], ["addAcct", 0.22, 60], ["addComment", 0.18, 60],
    ["ctlLeft", 0.26, 70], ["wheel", 0.24, 70], ["ctlSearch", 0.28, 70], ["ctlAddCat", 0.28, 70], ["save", 0.24, 90],
  ];
  const KEYS = ["1", "2", "3", "divide", "4", "5", "6", "multiply", "7", "8", "9", "minus", ",", "0", "delete.left", "plus"];

  function addSession(t) {
    if (t >= V.fill && t < V_OUT + 0.46) return { k: "V", t0: V.fill, from: voiceCardRect(V.fill), save: V.save, out: V_OUT };
    if (t >= S.confirm + 0.1 && t < S_OUT + 0.46) return { k: "S", t0: S.confirm + 0.1, from: U.REVIEW.bar, save: S.save, out: S_OUT };
    return null;
  }

  function applyAdd(t) {
    applyMorphs(t);
    const ss = addSession(t);
    show($.addL, !!ss);
    if (!ss) return;
    const { k, t0 } = ss;
    setT($.addL, `translateY(${(prog(t, ss.out, 0.44, E.in) * 874).toFixed(2)}px)`);
    const grow = prog(t, t0, 0.42, E.smooth);
    $.addL.style.clipPath = grow < 1 ? inset(mixRect(ss.from, { x: 0, y: 0, w: 402, h: 874, r: 0 }, grow)) : "none";

    for (const [key, d, dy] of ASSEMBLE) {
      $[key].style.translate = `0 ${((1 - spring(t, t0 + d, 0.4, 0.86)) * dy).toFixed(2)}px`;
      $[key].style.opacity = t >= t0 + d ? "" : "0";
    }
    KEYS.forEach((key, i) => {
      const at = t0 + 0.14 + Math.floor(i / 4) * 0.025 + (i % 4) * 0.008;
      $["key_" + key].style.translate = `0 ${((1 - spring(t, at, 0.34, 0.86)) * 90).toFixed(2)}px`;
      $["key_" + key].style.opacity = t < at ? "0" : "";
    });

    for (const key of ["V", "S"]) show(AMT[key].row, key === k);
    AMT[k].cells.forEach((el, i) => rise(el.firstElementChild, prog(t, t0 + 0.2 + i * 0.05, 0.3, E.out)));
    $.amtCur.style.left = AMT[k].cur + "px";

    show($.addCommentPh, false);
    const logoAt = t0 + 0.45;
    for (const key of ["V", "S"]) {
      show($["addLogo" + key], key === k && t >= logoAt);
      show($["addMerch" + key], key === k);
    }
    setT($["addLogo" + k], `scale(${clamp(spring(t, logoAt, 0.4, 0.62), 0, 1.25).toFixed(4)})`);
    rise($["addMerch" + k], prog(t, t0 + 0.4, 0.34, E.out));

    $.save.style.opacity = "";
    show($.save, t < ss.out);
    $.save.style.transform = `scale(${press(t, ss.save, 0.96).toFixed(4)})`;
    applyWheel(t, k);
  }

  function applyWheel(t, k) {
    const voice = k === "V";
    const sub = voice ? spring(t, V.sub, 0.42, 0.9) : 1;
    const exit = voice ? prog(t, V.sub, 0.25, E.in) : 1;
    const parent = voice ? 2 : 1;
    const kids = voice ? [9, 10, 11] : [5, 6, 7, 8];
    const wWidth = lerp(268, 221, sub);
    $.wheel.style.width = wWidth + "px";
    const center = wWidth / 2;
    for (let i = 0; i < 12; i++) {
      let phase = 0, sc = 1, extraY = 0, vis = true;
      const kid = kids.indexOf(i);
      if (i === parent) phase = -sub;
      else if (i < 5) { phase = i - parent; sc = 1 - exit; vis = exit < 1; }
      else if (kid >= 0) {
        phase = kid + 1 - sub;
        extraY = voice ? (1 - spring(t, V.sub + 0.08 + kid * 0.05, 0.42, 0.86)) * 60 : 0;
        vis = !voice || t >= V.sub;
      } else vis = false;
      const ph = Math.min(Math.abs(phase), 1);
      const el = $["cell" + i];
      show(el, vis);
      el.style.left = center + phase * 53 - 25 + "px";
      el.style.transform = `translateY(${(ph * 5 + extraY).toFixed(2)}px) scale(${((1 - ph * 0.19) * sc).toFixed(4)})`;
      let label = 0;
      if (i === parent) label = voice ? 1 - prog(t, V.sub, 0.2, E.in) : 0;
      if (i === kids[0]) label = voice ? prog(t, V.sub + 0.12, 0.3, E.out) : 1;
      rise($["cell" + i + "l"], label);
    }
    const swap = voice ? spring(t, V.sub, 0.36, 0.8) : 1;
    $.ctlPlus.style.transform = `scale(${clamp(1 - swap * 1.4, 0, 1).toFixed(3)}) rotate(${(swap * 90).toFixed(1)}deg)`;
    $.ctlBack.style.transform = `scale(${clamp(swap * 1.4 - 0.4, 0, 1).toFixed(3)})`;
    $.ctlSearch.style.left = lerp(339, 292, sub) + "px";
    $.ctlAddCat.style.transform = `scale(${(voice ? clamp(spring(t, V.sub + 0.1, 0.4, 0.7), 0, 1.2) : 1).toFixed(4)})`;
  }

  function applyMorphs(t) {
    const flight = t >= V_OUT && t < V_OUT + 0.5 ? { out: V_OUT, key: "V", color: "#FAF9F7" }
      : t >= S_OUT && t < S_OUT + 0.5 ? { out: S_OUT, key: "S", color: "#005FB6" } : null;
    show($.mSave, !!flight);
    if (!flight) return;
    const { out } = flight;
    const pw = prog(t, out, 0.3, E.out), py = prog(t, out + 0.04, 0.46, E.smooth);
    rectCss($.mSave, { x: lerp(20, 36, pw), y: lerp(786, 582.2, py), w: lerp(362, 44, pw), h: lerp(46, 44, py), r: lerp(23, 10, pw) });
    $.mSave.style.background = mixColor("#1C2E1D", flight.color, prog(t, out + 0.2, 0.14, E.inOut));
    sink($.mSaveText, prog(t, out, 0.18, E.in));
    for (const key of ["V", "S"]) show($["mLogo" + key], key === flight.key && t >= out + 0.22);
    setT($["mLogo" + flight.key], `scale(${clamp(spring(t, out + 0.22, 0.35, 0.7), 0, 1.2).toFixed(3)})`);
  }

  function applyStats(t) {
    const on = t >= DROP && t < B(44);
    show($.statsL, on);
    if (!on) return;
    const scroll = prog(t, B(39), 0.6, E.smooth) * STATS_SCROLL;
    const drop = prog(t, B(43) + 0.02, 0.42, E.in) * 874;
    setT($.statsScreen, `translateY(${(drop - scroll).toFixed(2)}px)`);
    $.statsL.style.clipPath = drop > 0 ? `inset(${drop.toFixed(2)}px 0 0 0)` : "none";

    const from = { x: 20, y: 564.2, w: 362, h: 74, r: 32 };
    const g = spring(t, DROP, 0.55, 0.92);
    rectCss($.cfCard, mixRect(from, { x: 20, y: U.CF.top, w: 362, h: U.CF.h, r: 24 }, clamp(g, 0, 1.02)));
    $.cfInner.style.transform = `translateY(${((1 - clamp(g)) * 60).toFixed(2)}px)`;
    const seedOut = prog(t, DROP, 0.26, E.in);
    show($.cfSeed, seedOut < 1);
    $.cfSeed.style.transform = `translateY(${(-seedOut * 90).toFixed(2)}px)`;
    $.cfInner.style.clipPath = `inset(${(clamp(1 - prog(t, DROP + 0.08, 0.3, E.out)) * 100).toFixed(2)}% 0 0 0)`;

    setT($.stNav, `translateY(${((1 - spring(t, DROP + 0.2, 0.5, 0.85)) * -140).toFixed(2)}px)`);
    for (const [key, d] of [["tileExp", 0], ["tileInc", 0.06], ["catCard", 0.12]]) {
      $[key].style.transform = `translateY(${((1 - spring(t, B(34) + d, 0.55, 0.86)) * 320).toFixed(2)}px)`;
    }

    const grow = (i) => prog(t, DROP + 0.3 + i * 0.012, 0.35, E.out);
    const shrinkDay = (i, n) => 1 - prog(t, B(37) + 0.05 + (n - 1 - i) * 0.006, 0.22, E.in);
    setBars(BAR.day, SM, (i, n) => grow(i) * shrinkDay(i, n));
    setBars(BAR.week, S6, (i) => prog(t, B(37) + 0.25 + i * 0.014, 0.36, E.out));
    const ghostIn = t < B(37) ? prog(t, B(34), 0.5, E.smooth) : prog(t, B(37) + 0.45, 0.45, E.smooth);
    const ghostOut = t < B(37) + 0.2 ? 1 - prog(t, B(37), 0.2, E.in) : 1;
    const six = t >= B(37) + 0.2;
    $.ghostExp.setAttribute("d", six ? GHOST.six.exp : GHOST.month.exp);
    $.ghostInc.setAttribute("d", six ? GHOST.six.inc : GHOST.month.inc);
    $.ghostClip.setAttribute("width", (U.CF.chartW * (six ? ghostIn : Math.min(ghostIn, ghostOut))).toFixed(2));
    $.axM.forEach((el, i) => {
      if (t < B(37)) rise(el, prog(t, DROP + 0.4 + i * 0.03, 0.35, E.out));
      else sink(el, prog(t, B(37), 0.2, E.in));
    });
    $.axW.forEach((el, i) => rise(el, prog(t, B(37) + 0.3 + i * 0.05, 0.35, E.out)));

    setRoller($.cfNetRoll, t, [{ t: B(34), v: usd(SM.net, true) }, { t: B(38), v: usd(S6.net, true) }]);
    setRoller($.cfBadgeRoll, t, [{ t: B(34) + 0.12, v: usd(SM.net - SM.pnet, true) }, { t: B(38) + 0.06, v: usd(S6.net - S6.pnet, true) }]);
    const bw = lerp(BADGE.v0, BADGE.v1, prog(t, B(38) + 0.06, 0.34, E.snappy));
    $.cfBadgeT.style.left = BADGE.x + bw + 5 + "px";
    $.cfBadge.style.width = BADGE.x + bw + 5 + BADGE.tail + 12 + "px";
    $.cfBadge.style.clipPath = `inset(0 ${((1 - prog(t, B(34) + 0.1, 0.4, E.smooth)) * 100).toFixed(2)}% 0 0 round 999px)`;

    const eM = pct(SM.exp, SM.pexp), iM = pct(SM.inc, SM.pinc), e6 = pct(S6.exp, S6.pexp), i6 = pct(S6.inc, S6.pinc);
    setRoller($.lgExpVRoll, t, [{ t: B(34) + 0.2, v: usd(SM.exp) }, { t: B(38) + 0.1, v: usd(S6.exp) }]);
    setRoller($.lgIncVRoll, t, [{ t: B(34) + 0.26, v: usd(SM.inc, true) }, { t: B(38) + 0.14, v: usd(S6.inc, true) }]);
    setRoller($.lgExpDRoll, t, [{ t: B(34) + 0.3, v: pctText(eM) + " vs prev." }, { t: B(38) + 0.18, v: pctText(e6) + " vs prev." }]);
    setRoller($.lgIncDRoll, t, [{ t: B(34) + 0.34, v: pctText(iM) + " vs prev." }, { t: B(38) + 0.22, v: pctText(i6) + " vs prev." }]);
    $.lgIncDRoll.b.style.color = i6 > 0 ? "var(--green)" : "var(--spent)";
    $.lgIncDRoll.a.style.color = t >= B(38) + 0.56 ? (i6 > 0 ? "var(--green)" : "var(--spent)") : "var(--spent)";
    const tileDelta = (v, goodWhenDown) => {
      const up = v > 0;
      const color = (goodWhenDown ? !up : up) ? "var(--green)" : "var(--spent)";
      const name = up ? "arrow.up.right" : "arrow.down.right";
      const icon = window.ASSETS.sym[name + "@bold"];
      return `<i class="sym s-${name.replace(/[.@]/g, "-")}-bold" style="width:${(icon.w * 9).toFixed(2)}px;height:${(icon.h * 9).toFixed(2)}px;background:${color};margin-right:3px;vertical-align:-1px"></i><span style="color:${color}">${pctText(v)}</span>`;
    };
    setRoller($.tileExpVRoll, t, [{ t: B(34) + 0.2, v: usd(SM.exp) }, { t: B(38) + 0.26, v: usd(S6.exp) }]);
    setRoller($.tileIncVRoll, t, [{ t: B(34) + 0.26, v: usd(SM.inc, true) }, { t: B(38) + 0.3, v: usd(S6.inc, true) }]);
    setRoller($.tileExpDRoll, t, [{ t: B(34) + 0.3, v: tileDelta(eM, true) }, { t: B(38) + 0.34, v: tileDelta(e6, true) }], 0.34, true);
    setRoller($.tileIncDRoll, t, [{ t: B(34) + 0.34, v: tileDelta(iM, false) }, { t: B(38) + 0.38, v: tileDelta(i6, false) }], 0.34, true);
    const mt = prog(t, B(37) + 0.3, 0.6, E.smooth);
    const trend = (vals) => {
      const mx = Math.max(...vals), mn = Math.min(...vals), rg = Math.max(1, mx - mn);
      return vals.map((v, i) => [(i / (vals.length - 1)) * 147, 34 - 2 - ((v - mn) / rg) * 30]);
    };
    const draw = prog(t, B(34) + 0.3, 0.5, E.smooth);
    for (const [key, field] of [["tileExp", "exp"], ["tileInc", "inc"]]) {
      const pa = trend(resample(SM.bars.map((b) => b[field]), 60)), pb = trend(resample(S6.bars.map((b) => b[field]), 60));
      const d = catmull(pa.map((p, i) => [p[0], lerp(p[1], pb[i][1], mt)]));
      $[key + "L"].setAttribute("d", d);
      $[key + "A"].setAttribute("d", d + " L147 34 L0 34 Z");
      $[key + "L"].style.clipPath = `inset(0 ${((1 - draw) * 100).toFixed(1)}% 0 0)`;
      $[key + "A"].style.clipPath = `inset(0 ${((1 - draw) * 100).toFixed(1)}% 0 0)`;
    }

    for (let i = 0; i < 6; i++) {
      const at = [B(39) + 0.25, B(40), B(40) + P / 2, B(41), B(41) + P / 3, B(41) + (2 * P) / 3][i];
      $["catIn" + i].style.transform = `translateY(${((1 - spring(t, at, 0.48, 0.86)) * 64).toFixed(2)}px)`;
      $["cat" + i].style.overflow = t < at + 0.6 ? "hidden" : "visible";
    }
    const lift = spring(t, B(42), 0.4, 0.75);
    const food = $["cat" + $.foodRowIndex];
    food.style.zIndex = "2";
    food.style.transform = `scale(${lerp(1, 1.035, lift).toFixed(4)})`;
    food.style.background = lift > 0.01 ? "var(--card)" : "transparent";
    food.style.borderRadius = "16px";
    food.style.boxShadow = lift > 0.01 ? `0 ${(10 * lift).toFixed(1)}px ${(32 * lift).toFixed(1)}px rgba(20,26,21,${(0.14 * lift).toFixed(3)})` : "none";
    $.catRowsM.style.overflow = t >= B(42) ? "visible" : "hidden";
    const dl = $.dl_Food;
    dl.style.transform = `scale(${(1 + 0.18 * pulse(t, B(42) + 0.1, 0.4)).toFixed(4)})`;
    dl.style.transformOrigin = "100% 50%";
    show(food, t < B(43));
  }

  function applySheet(t) {
    const on = t >= B(35) && t < B(37) + 0.5;
    show($.sheetL, on);
    if (!on) return;
    const travel = 874 - SHEET_TOP;
    const y = (1 - spring(t, B(35), 0.5, 0.9)) * travel + prog(t, B(37), 0.42, E.in) * travel;
    setT($.sheetL, `translateY(${y.toFixed(2)}px)`);
    $.sheetCheck.style.top = 17 + (2 + 3 * spring(t, B(36) + 0.05, 0.32, 0.86)) * 69 + "px";
  }

  function applyBudgets(t) {
    const on = t >= B(43) && t < B(53);
    show($.budL, on);
    if (!on) return;
    setT($.budScreen, `translateX(${(-prog(t, B(48), 0.5, E.snappy) * 100).toFixed(2)}px)`);

    const rowTop = U.CF.cats + 52 + $.foodRowIndex * 62 - STATS_SCROLL;
    const k = 1.035;
    const from = { x: 20 - (362 * (k - 1)) / 2, y: rowTop - (62 * (k - 1)) / 2, w: 362 * k, h: 62 * k, r: 16 * k };
    const g = spring(t, B(43), 0.55, 0.9);
    const gn = clamp(g);
    rectCss($.bud0, mixRect(from, { x: 20, y: U.BUD_Y.cards[0], w: 362, h: 132, r: 24 }, clamp(g, 0, 1.02)));
    $.bud0.style.boxShadow = `0 ${lerp(10, 4, gn).toFixed(2)}px ${lerp(32, 16, gn).toFixed(2)}px rgba(20,26,21,${lerp(0.14, 0.06, gn).toFixed(3)})`;
    $.bud0av.style.transformOrigin = "0 0";
    $.bud0av.style.transform = `translate(${lerp(20 * k - 20, 0, gn).toFixed(2)}px,${lerp(9 * k - 22, 0, gn).toFixed(2)}px) scale(${lerp((44 * k) / 38, 1, gn).toFixed(4)})`;
    $.bud0name.style.transform = `translate(${lerp(78 * k - 70, 0, gn).toFixed(2)}px,${lerp(12 * k - 20, 0, gn).toFixed(2)}px) scale(${lerp(k, 1, gn).toFixed(4)})`;
    const carry = prog(t, B(43), 0.22, E.in);
    sink($.bud0share, carry);
    sink($.bud0carry, carry);
    show($.bud0share, carry < 1);
    show($.bud0carry, carry < 1);
    rise($.bud0s, prog(t, B(43) + 0.3, 0.35, E.out));
    $.bud0track.style.clipPath = `inset(0 ${((1 - prog(t, B(44) - 0.1, 0.3, E.out)) * 100).toFixed(2)}% 0 0 round 999px)`;
    $.bud0fill.style.width = (322 * (U.BUDGETS[0].spent / U.BUDGETS[0].limit) * prog(t, B(44), 0.6, E.outSoft)).toFixed(2) + "px";
    rise($.bud0left, prog(t, B(45), 0.35, E.out));
    rise($.bud0day, prog(t, B(45) + 0.08, 0.35, E.out));

    const L = BUD_LIST;
    setT($.budNav, `translateY(${((1 - spring(t, L + 0.1, 0.5, 0.85)) * -160).toFixed(2)}px)`);
    $.budSum.style.transform = `translateY(${((1 - spring(t, L, 0.5, 0.86)) * -420).toFixed(2)}px)`;
    $.budSumFill.style.width = (322 * 0.7063 * prog(t, L + 0.25, 0.6, E.outSoft)).toFixed(2) + "px";
    [1, 2].forEach((i) => {
      $["bud" + i].style.transform = `translateY(${((1 - spring(t, L + 0.07 * i, 0.5, 0.86)) * 520).toFixed(2)}px)`;
      $["bud" + i + "fill"].style.width = (322 * (U.BUDGETS[i].spent / U.BUDGETS[i].limit) * prog(t, L + 0.25 + 0.07 * i, 0.6, E.outSoft)).toFixed(2) + "px";
      for (const part of ["s", "left", "day"]) rise($["bud" + i + part], 1);
    });
    $.bud0.style.transform = `scale(${press(t, B(47), 0.98).toFixed(4)})`;
  }

  function applyDetail(t) {
    const on = t >= B(48) && t < B(54);
    show($.detL, on);
    if (!on) return;
    const x = (1 - prog(t, B(48), 0.5, E.snappy)) * 402;
    const y = prog(t, B(53), 0.46, E.in) * 874;
    setT($.detL, `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`);
    rise($.detFig, prog(t, B(48) + 0.25, 0.4, E.out));
    $.detBadgeRow.style.clipPath = `inset(-4px ${((1 - prog(t, B(48) + 0.4, 0.4, E.smooth)) * 100).toFixed(2)}% -4px 0)`;
    $.detClip.setAttribute("width", (402 * prog(t, B(49), 0.75, E.smooth)).toFixed(2));
    $.detLimit.style.clipPath = `inset(0 ${((1 - prog(t, B(48) + 0.5, 0.5, E.smooth)) * 100).toFixed(2)}% 0 0)`;
    $.detLimitLabel.style.transform = `scale(${clamp(spring(t, B(49) + 0.2, 0.4, 0.7), 0, 1.2).toFixed(4)})`;
    $.detLimitLabel.style.transformOrigin = "100% 100%";
    const beat = (b) => pulse(t, B(b), 0.3);
    $.detDot.setAttribute("r", (4.4 * clamp(spring(t, B(49) + 0.7, 0.4, 0.6), 0, 1.3) * (1 + 0.35 * (beat(51) + beat(52)))).toFixed(3));
    const ringP = t >= B(52) ? prog(t, B(52), 0.5, E.out) : prog(t, B(51), 0.5, E.out);
    const ringOn = t >= B(51) && ringP < 1;
    $.detRing.setAttribute("r", ringOn ? (5 + 14 * ringP).toFixed(2) : "0");
    $.detRing.setAttribute("stroke-width", ringOn ? (2 * (1 - ringP)).toFixed(2) : "0");
    for (const [key, d] of [["detAvail", 0], ["detFore", 0.07]]) {
      $[key].style.transform = `translateY(${((1 - spring(t, B(50) + d, 0.55, 0.86)) * 400).toFixed(2)}px)`;
    }
    $.detAvailFill.style.width = (143 * (573.8 / 750) * prog(t, B(50) + 0.2, 0.6, E.outSoft)).toFixed(2) + "px";
    $.detForeFill.style.width = (143 * (637.55 / 750) * prog(t, B(50) + 0.27, 0.6, E.outSoft)).toFixed(2) + "px";
  }

  function applyCaption(t) {
    const on = t >= B(55) && t < B(62);
    show($.caption, on);
    if (!on) return;
    $.caption.style.transform = `translateY(${(-5 * holdStep(t)).toFixed(2)}px)`;
    [["capOver", B(55)], ["capL1", B(56)], ["capL2", B(57)]].forEach(([key, at], i) => {
      const y = t < B(61) ? (1 - spring(t, at, 0.5, 0.88)) * 110 : prog(t, B(61) + (2 - i) * 0.05, 0.3, E.in) * -110;
      $[key].style.transform = `translateY(${y.toFixed(2)}%)`;
    });
  }

  function applySpringboard(t) {
    const q = prog(t, B(58), 0.45, E.inOut);
    show($.springL, q > 0);
    if (q <= 0) {
      $.appClip.style.clipPath = "none";
      $.appWin.style.transform = "none";
      show($.appClip, true);
      return;
    }
    const icx = APP_ICON.x + APP_ICON.w / 2, icy = APP_ICON.y + APP_ICON.h / 2;
    const r = mixRect({ x: 0, y: 0, w: 402, h: 874, r: 55 }, APP_ICON, q);
    const close = prog(t, B(58) + 0.3, 0.18, E.in);
    const cw = r.w * (1 - close), ch = r.h * (1 - close);
    $.appClip.style.clipPath = inset({ x: r.x + (r.w - cw) / 2, y: r.y + (r.h - ch) / 2, w: cw, h: ch, r: lerp(r.r, Math.min(cw, ch) / 2, close) });
    $.appWin.style.transformOrigin = `${icx}px ${icy}px`;
    $.appWin.style.transform = `scale(${lerp(1, APP_ICON.w / 402, q).toFixed(4)})`;
    show($.appClip, close < 1);
    $.springL.style.transformOrigin = "201px 437px";
    $.springL.style.transform = `scale(${lerp(1.08, 1, q).toFixed(4)})`;
  }

  const TAPS = [];
  function buildTaps() {
    TAPS.length = 0;
    const tap = (t, x, y, drag) => TAPS.push({ t, x, y, drag });
    const pillY = 459.7 + 24;
    const pillC = (i, scroll = 0) => PILL.x[i] + PILL.w[i] / 2 + scroll;
    tap(B(9), pillC(1), pillY);
    tap(B(10), 290, pillY, { d: 0.22, follow: pillScroll });
    tap(B(11), pillC(2, PILL.scroll), pillY);
    tap(B(12), 150 + PILL.scroll, pillY, { d: 0.22, follow: pillScroll });
    tap(B(13), pillC(0), pillY);
    tap(V.tap, 274, 796);
    tap(V.stop, 161, 782);
    tap(V.save, 201, 809);
    tap(S.tap, 198, 796);
    tap(S.done, 352, 788);
    tap(S.confirm, 201, 802);
    tap(S.save, 201, 809);
    tap(B(36) + 0.05, 345, SHEET_TOP + 86 + 5 * 69 + 34);
    tap(B(47), 201, 386);
  }

  function applyTaps(t) {
    let used = 0;
    for (const tp of TAPS) {
      const lift = tp.drag ? tp.t + tp.drag.d : tp.t + 0.14;
      const fade = tp.drag ? 0.12 : 0.2;
      if (t < tp.t - 0.08 || t > lift + fade) continue;
      const el = $["tap" + used++];
      if (!el) break;
      const x = tp.drag ? tp.x + tp.drag.follow(Math.min(t, lift)) - tp.drag.follow(tp.t) : tp.x;
      const inn = clamp(spring(t, tp.t - 0.08, 0.22, 0.8), 0, 1.1);
      const out = prog(t, lift, fade, E.out);
      el.style.left = x.toFixed(2) + "px";
      el.style.top = tp.y.toFixed(2) + "px";
      el.style.opacity = (1 - out).toFixed(3);
      setT(el, `scale(${((0.6 + 0.4 * inn) * (1 + 0.35 * out)).toFixed(4)})`);
      show(el, true);
    }
    for (let i = used; i < 3; i++) show($["tap" + i], false);
  }

  window.SCENES = { build, apply, buildTaps, $, CAMS, FILM };
})();
