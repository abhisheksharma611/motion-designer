(() => {
  'use strict';

  const BPM = 128;
  const BEAT = 60 / BPM;
  const at = (bar, beat = 1) => ((bar - 1) * 4 + (beat - 1)) * BEAT;
  const DURATION = at(37);
  const WIN_W = 1280;
  const WIN_H = 800;
  const STAGE = 1440;
  const ROW_H = 30;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ramp = (t, t0, t1) => clamp((t - t0) / (t1 - t0));

  function spring(dt, response, damping) {
    if (dt <= 0) return 0;
    const w0 = (2 * Math.PI) / response;
    if (damping >= 1) return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
    const wd = w0 * Math.sqrt(1 - damping * damping);
    return 1 - Math.exp(-damping * w0 * dt) * (Math.cos(wd * dt) + ((damping * w0) / wd) * Math.sin(wd * dt));
  }
  const SPR = {
    panel: [0.55, 0.86],
    select: [0.32, 0.82],
    camera: [0.9, 1.0],
    cameraFast: [0.75, 1.0],
    morph: [0.6, 0.84],
    snap: [0.42, 0.8],
    soft: [0.8, 0.96],
    lid: [1.15, 0.84],
    wipe: [0.45, 1],
  };
  const S = (dt, s) => spring(dt, s[0], s[1]);
  function chain(t, keys) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [ti, vi, s = SPR.panel] = keys[i];
      v += (vi - keys[i - 1][1]) * S(t - ti, s);
    }
    return v;
  }
  const steps = (t, times) => times.filter((x) => t >= x).length;
  const series = (start, count, every) => Array.from({ length: count }, (_, i) => start + i * every);

  const T = {
    lockupHold: at(1, 4),
    drawTogether: at(2, 1),
    toLaptop: at(2, 3.5),
    lidOpen: at(3, 1),
    screenOn: at(3, 2),
    pushIn: at(4, 3),
    divide: at(5, 1),
    openLeft: at(5, 1.5),
    openRight: at(5, 2.5),
    walkLeft: series(at(5, 3), 4, BEAT / 4),
    focusLeft: at(6, 1),
    marks: series(at(6, 2), 6, BEAT / 2),
    grab: at(7, 1),
    release: at(7, 3),
    drop: at(9, 1),
    grid: at(10, 1),
    walkGrid: series(at(10, 3), 7, BEAT / 4),
    lift: at(11, 1),
    previewImg: at(11, 2),
    closeImg: at(12, 1),
    previewMd: at(12, 2),
    closeMd: at(13, 1),
    columns: at(13, 2),
    columnsNav: at(13, 3),
    backToList: at(13, 4),
    search: at(14, 1),
    letters: series(at(14, 2), 5, BEAT / 2),
    marks2: series(at(15, 1), 6, BEAT / 4),
    rename: at(15, 3),
    find: series(at(15, 3.5), 7, BEAT / 8),
    regex: at(16, 1),
    replace: at(16, 1.5),
    apply: at(17, 1),
    clear: at(17, 1.5),
    zipFocus: at(18, 1),
    walkZip: series(at(18, 1.5), 5, BEAT / 4),
    openZip: at(18, 3),
    cursorLogo: at(18, 4),
    openLogo: at(19, 1),
    gitRoot: at(19, 3),
    gitServices: at(20, 1),
    ctxMenu: at(20, 3),
    gitDiff: at(21, 1),
    gitBlame: at(21, 3),
    gitLog: at(22, 1),
    gitClose: at(22, 3),
    termOpen: at(23, 1),
    typing: series(at(23, 1.5), 20, BEAT / 8),
    enter: at(23, 4),
    termClose: at(24, 3),
    palette: at(25, 1),
    query: series(at(25, 2), 5, BEAT / 2),
    launch: at(26, 1),
    cursorIcons: at(26, 3),
    browse: at(26, 4),
    upFocus: at(27, 1),
    upMarks: series(at(27, 1.5), 6, BEAT / 4),
    upload: at(27, 4),
    arrived: at(28, 1),
    pullBack: at(29, 1),
    toWin: at(30, 1),
    toLinux: at(31, 1),
    lineup: at(32, 1),
    converge: at(33, 1),
    lidClose: at(33, 2),
    toRow: at(33, 4),
    unfold: at(34, 1),
    tagline: at(35, 1),
  };

  const FAN_AT = T.toLinux + BEAT * 3;
  const deskShadow = (k) => (k > 0.001 ? `0 50px 110px -40px rgba(40, 30, 20, ${(0.55 * k).toFixed(3)}), 0 0 0 1px rgba(20, 16, 12, ${(0.1 * k).toFixed(3)})` : 'none');

  const $ = (id) => document.getElementById(id);
  const world = $('world');
  const mac = $('mac');
  const macLid = $('mac-lid');
  const screen = $('screen');
  const macFront = $('mac-front');
  const macDisplay = $('mac-display');
  const [macShadow, macDeck, macLip, macNotch, macDeskShadow] = ['mac-shadow', 'mac-deck', 'mac-lip', 'mac-notch', 'mac-desk-shadow'].map($);
  const deskWin = $('desk-win');
  const deskLinux = $('desk-linux');
  const mirrors = { win: $('app-win'), linux: $('app-linux') };
  const frame = $('app');
  const pointer = $('pointer');
  const traffic = $('traffic');
  const pill = $('pill');
  const lockup = $('lockup');
  const markSvg = $('mark');
  const tagline = $('tagline');
  const labels = { mac: $('lbl-mac'), win: $('lbl-win'), linux: $('lbl-linux') };

  const APP = window.ORYN_APP;
  const MARK = window.ORYN_MARK;

  const WX = 46 + 18 + 116;
  const WY = 26 + 100;
  const MAC = { x: 0, w: 1640, h: 1124 };
  const DISPLAY = { x: 46 + 18, y: 26, w: 1512, h: 982 };
  const SLOT = DISPLAY.w + 100;
  const viewOf = (d, z, dy = 0) => ({ cx: d.x + d.w / 2 - WX, cy: d.h / 2 - WY + dy, z });
  const MAC_CLOSED = { cx: 820 - WX, cy: 1065 - WY + (720 - 672) / 0.62, z: 0.62 };
  const MAC_OPEN = viewOf(MAC, 0.62);
  const DESK_CX = DISPLAY.x + DISPLAY.w / 2 - WX;
  const DESK_CY = DISPLAY.y + DISPLAY.h / 2 - WY;
  const CARD_VIEW = { cx: DESK_CX, cy: DESK_CY + 50 / 0.9, z: 0.9 };
  const LINEUP_Z = (STAGE - 72) / (3 * DISPLAY.w + 2 * (SLOT - DISPLAY.w));
  const LINEUP_VIEW = { cx: DESK_CX + SLOT, cy: DESK_CY + 37 / LINEUP_Z, z: LINEUP_Z };

  const FS = 212;
  const MARK_H = 176;
  const LOCKUP_CY = 672;
  const markW = (MARK.viewBox[0] / MARK.viewBox[1]) * MARK_H;
  const stops = MARK.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const ax = MARK.axis;
  markSvg.setAttribute('viewBox', `0 0 ${MARK.viewBox[0]} ${MARK.viewBox[1]}`);
  markSvg.setAttribute('width', MARK.viewBox[0]);
  markSvg.setAttribute('height', MARK.viewBox[1]);
  markSvg.innerHTML =
    `<defs><linearGradient id="oryn-grad" gradientUnits="userSpaceOnUse" x1="${ax[0]}" y1="${ax[1]}" x2="${ax[2]}" y2="${ax[3]}">${stops}</linearGradient></defs>` +
    `<path id="mark-a" fill="url(#oryn-grad)" d="${MARK.a}"/><path id="mark-b" fill="url(#oryn-grad)" d="${MARK.b}"/>`;
  const markA = $('mark-a');
  const markB = $('mark-b');
  const markScale = MARK_H / MARK.viewBox[1];

  function measureWord(weight, size, spacingEm) {
    const probe = document.createElement('div');
    probe.className = 'glyph';
    probe.style.cssText = `visibility:hidden;font-weight:${weight};font-size:${size}px;letter-spacing:${spacingEm}em`;
    probe.innerHTML = 'Oryn<span style="display:inline-block;width:0;height:0"></span>';
    $('stage').appendChild(probe);
    const text = probe.firstChild;
    const box = probe.getBoundingClientRect();
    const offsets = [];
    const range = document.createRange();
    for (let i = 0; i < 4; i++) {
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      offsets.push(range.getBoundingClientRect().left - box.left);
    }
    const baseline = probe.lastChild.getBoundingClientRect().top - box.top;
    const width = box.width;
    probe.remove();
    return { offsets, baseline, width };
  }
  const big = measureWord(700, FS, -0.025);
  const lockupW = markW + 0.21 * FS + big.width;
  const lockupX = (STAGE - lockupW) / 2;
  const baseY = LOCKUP_CY + (0.705 * FS) / 2;
  const wordX = lockupX + markW + 0.21 * FS;
  const glyphs = 'Oryn'.split('').map((ch) => {
    const g = document.createElement('div');
    g.className = 'glyph';
    g.textContent = ch;
    lockup.appendChild(g);
    return g;
  });

  const PILL = { x: 220, y: 642, w: 1000, h: 60 };
  const ROW_FS = 26;
  const small = measureWord(500, ROW_FS, 0);
  const labelX = PILL.x + 32 + 32 + 16;
  const labelBase = PILL.y + PILL.h / 2 + (0.705 * ROW_FS) / 2;
  pill.innerHTML =
    '<span class="meta" style="right:222px">26 Sep 2026 at 09:41</span>' +
    '<span class="meta" style="right:32px">&lt;DIR&gt;</span>';
  const pillMeta = [...pill.querySelectorAll('.meta')];
  const ICON = { x: PILL.x + 32, y: PILL.y + (PILL.h - 32) / 2, h: 32 };

  const FILM_APP_CSS = `
    *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
    html, body { width: ${WIN_W}px !important; height: ${WIN_H}px !important; overflow: hidden !important; }
    .row-icon > img.row-thumbnail { opacity: 1 !important; display: block !important; }
    .row-icon:has(> img.row-thumbnail) > svg.mac-icon { display: none !important; }
    #film-ghost { position: fixed; left: 0; top: 0; display: none; }
    .film-ghosts { position: absolute; left: 0; top: 0; right: 0; pointer-events: none; }
    .film-ghosts .row { position: absolute; left: 0; right: 0; }
    .pane-list { position: relative; }
    .xterm-cursor-layer, .xterm-helper-textarea { visibility: hidden !important; }
    #git-overlay .git-modal { width: 920px !important; height: 720px !important; }
  `;
  let doc = null;
  let appGen = 0;
  function mountApp() {
    appGen += 1;
    doc = frame.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${APP.css}</style><style>${FILM_APP_CSS}</style></head>` +
      `<body class="platform-mac">${APP.body}<div id="film-ghost" class="drag-ghost-badge">📁 6 items</div></body></html>`);
    doc.close();
  }
  mountApp();
  const q = (sel) => doc.querySelector(sel);

  const PLATFORM_TEXT = {
    win: { root: 'C:', users: 'Users', home: 'C:/Users/studio', drive: 'Local Disk (C:)' },
    linux: { root: 'Root (/)', users: 'home', home: '/home/studio', drive: 'File System' },
  };
  function applyMirrors(t) {
    if (t < T.toWin || t >= T.converge + 1.2) return;
    for (const key of ['win', 'linux']) {
      const el = mirrors[key];
      if (el.dataset.gen === String(appGen)) continue;
      const d = el.contentDocument;
      d.open();
      d.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${APP.css}</style><style>${FILM_APP_CSS}</style></head>` +
        `<body class="platform-windows">${doc.body.innerHTML}</body></html>`);
      d.close();
      const p = PLATFORM_TEXT[key];
      d.querySelectorAll('.path-crumb').forEach((b) => {
        if (b.textContent === 'Macintosh HD') b.textContent = p.root;
        else if (b.textContent === 'Users' && b.title === '/Users') b.textContent = p.users;
      });
      d.querySelectorAll('.sidebar-item--drive .sidebar-item-label').forEach((l) => {
        if (l.textContent === 'Macintosh HD') l.textContent = p.drive;
      });
      const status = d.getElementById('full-path-status');
      if (status) status.textContent = status.textContent.replace('/Users/studio', p.home);
      el.dataset.gen = String(appGen);
    }
  }

  function ensure(id) {
    let el = q(`#${id}`);
    if (!el) {
      el = doc.createElement('div');
      el.id = id;
      el.className = 'hidden';
      doc.body.appendChild(el);
    }
    return el;
  }
  function swapOuter(sel, html, key) {
    const el = q(sel);
    if (!el || el.dataset.filmKey === key) return el;
    const holder = doc.createElement('div');
    holder.innerHTML = html;
    const next = holder.firstElementChild;
    next.dataset.filmKey = key;
    el.replaceWith(next);
    return next;
  }
  function setClass(el, cls, on) {
    if (el && el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
  }
  function style(el, props) {
    if (!el) return;
    for (const k in props) {
      if (el.style[k] !== props[k]) el.style[k] = props[k];
    }
  }
  const nameOf = (row) => row.querySelector('.row-name-text')?.textContent || '';

  function setList(side, key) {
    const list = q(`#list-${side}`);
    if (list.dataset.filmKey !== (key || '')) {
      list.innerHTML = key ? APP.lists[key] : '<div class="virtual-inner" style="height:0px"><div class="virtual-window"></div></div>';
      list.dataset.filmKey = key || '';
      list.querySelector('.virtual-window')?.style.removeProperty('transform');
      const ghosts = doc.createElement('div');
      ghosts.className = 'film-ghosts';
      list.appendChild(ghosts);
    }
    return [...list.querySelectorAll('.virtual-window > .row')];
  }
  function setChrome(key) {
    const c = APP.chrome[key];
    swapOuter('header.mac-header', c.header, key);
    swapOuter('section.mac-nav-bar', c.nav, key);
    swapOuter('footer', c.footer, key);
    swapOuter('#sidebar', c.sidebar, key);
  }
  function setOverlay(id, key) {
    const el = ensure(id);
    if (!key) {
      if (el.dataset.filmKey !== 'hidden') {
        if (id === 'nx-xfer') el.classList.add('nx-xfer--hidden');
        else el.classList.add('hidden');
        el.style.display = id === 'ctx-menu' ? 'none' : '';
        el.dataset.filmKey = 'hidden';
      }
      return null;
    }
    const next = swapOuter(`#${id}`, APP.overlays[key], key);
    if (next) next.style.display = '';
    return next;
  }
  function setColumns(which) {
    for (const side of ['left', 'right']) {
      let c = q(`#pane-${side} .columns-container`);
      if (!c) {
        c = doc.createElement('div');
        c.className = 'columns-container';
        q(`#pane-${side} .pane-body`).appendChild(c);
      }
      const key = which || '';
      if (c.dataset.filmKey !== key) {
        c.innerHTML = which === 'nav' ? APP.columnsNav[side] : which ? APP.columns[side] : '';
        c.dataset.filmKey = key;
      }
    }
  }

  const namesCache = {};
  function namesOf(key) {
    if (!key) return [];
    if (!namesCache[key]) {
      const holder = doc.createElement('div');
      holder.innerHTML = APP.lists[key];
      namesCache[key] = [...holder.querySelectorAll('.row')].map(nameOf);
    }
    return namesCache[key];
  }
  const RENAMED = {
    'Frame 12.png': 'oryn-icon-01.png', 'Frame 13 copy.png': 'oryn-icon-02.png', 'Frame 13.png': 'oryn-icon-03.png',
    'Frame 14 copy.png': 'oryn-icon-04.png', 'Frame 14.png': 'oryn-icon-05.png', 'Frame 15.png': 'oryn-icon-06.png',
  };

  function setGhosts(side, prevKey, nextKey, k, since) {
    const layer = q(`#list-${side} .film-ghosts`);
    if (!layer) return;
    const renaming = prevKey === 'filter_frame' && nextKey === 'presskit_renamed';
    const key = prevKey && k < 1 ? `${prevKey}>${nextKey}` : '';
    if (layer.dataset.filmKey !== key) {
      layer.innerHTML = '';
      layer.dataset.filmKey = key;
      if (key) {
        const keep = new Set(namesOf(nextKey));
        const holder = doc.createElement('div');
        holder.innerHTML = APP.lists[prevKey];
        [...holder.querySelectorAll('.row')].forEach((row, i) => {
          const n = nameOf(row);
          if (keep.has(n)) return;
          const renamed = keep.has(RENAMED[n]);
          if (renamed && !renaming) return;
          row.classList.remove('selected', 'user-selected');
          if (renamed) {
            row.classList.add('user-selected');
            row.dataset.renamed = '1';
          }
          row.style.top = `${i * ROW_H}px`;
          layer.appendChild(row);
        });
      }
    }
    for (const row of layer.children) {
      if (row.dataset.renamed) style(row, { opacity: `${(1 - S(since, [0.2, 1])).toFixed(3)}`, transform: '' });
      else style(row, { opacity: `${(1 - k).toFixed(3)}`, transform: `translateX(${(-18 * k).toFixed(2)}px) scale(${lerp(1, 0.96, k).toFixed(4)})` });
    }
  }

  const LEFT_EVENTS = [
    [T.screenOn, null, 'home_left'], [T.openLeft, 'home_left', 'downloads'], [T.openZip, 'downloads', 'zip_root'],
    [T.openLogo, 'zip_root', 'zip_logo'], [T.gitRoot, 'zip_logo', 'git_root'], [T.gitServices, 'git_root', 'git_services'],
    [T.launch, 'git_services', 'remote_press'], [T.browse, 'remote_press', 'remote_icons'], [T.arrived, 'remote_icons', 'remote_icons_full'],
  ];
  const RIGHT_EVENTS = [
    [T.divide, null, 'home_right'], [T.openRight, 'home_right', 'presskit'], [T.drop, 'presskit', 'presskit_after'],
    ...T.letters.map((tt, i) => [tt, i === 0 ? 'presskit_after' : `filter_${'frame'.slice(0, i)}`, `filter_${'frame'.slice(0, i + 1)}`]),
    [T.clear, 'filter_frame', 'presskit_renamed'],
  ];
  const FRESH = new Set(['home_left', 'home_right', 'downloads', 'presskit', 'zip_root', 'zip_logo', 'git_root', 'git_services', 'remote_press', 'remote_icons', 'presskit_renamed']);
  function lastSwap(t, side) {
    let last = null;
    for (const e of side === 'left' ? LEFT_EVENTS : RIGHT_EVENTS) if (t >= e[0]) last = e;
    return last;
  }

  function chromeKey(t) {
    if (t < T.openLeft) return 'home';
    if (t < T.marks[0]) return 'downloads';
    if (t < T.drop) return `dl_mark_${Math.max(1, steps(t, T.marks))}`;
    if (t < T.grid) return 'done';
    if (t < T.closeImg) return 'grid';
    if (t >= T.columnsNav && t < T.backToList) return 'columns_nav';
    if (t < T.letters[0]) return 'presskit';
    if (t < T.marks2[0]) return `filter_${'frame'.slice(0, steps(t, T.letters))}`;
    if (t < T.clear) return `mark_${steps(t, T.marks2)}`;
    if (t < T.zipFocus) return 'renamed';
    if (t < T.openZip) return 'zip_cursor';
    if (t < T.openLogo) return 'zip_open';
    if (t < T.gitRoot) return 'zip_logo';
    if (t < T.gitServices) return 'git_root';
    if (t < T.palette) return 'git_services';
    if (t < T.launch) return 'palette';
    if (t < T.cursorIcons) return 'remote';
    if (t < T.browse) return 'remote_cursor';
    if (t < T.upMarks[0]) return 'remote_icons';
    if (t < T.arrived) return `upmark_${Math.max(1, steps(t, T.upMarks))}`;
    return 'uploaded';
  }

  function viewMode(t) {
    if (t >= T.pullBack) return 'grid';
    if (t >= T.grid && t < T.closeImg + BEAT / 2) return 'grid';
    if (t >= T.columns && t < T.backToList) return 'columns';
    return 'list';
  }

  const DL_WALK = ['..', 'Fonts', 'Receipts', 'brand-guidelines.pdf', 'Frame 12.png'];
  const MARKED = ['Frame 12.png', 'Frame 13 copy.png', 'Frame 13.png', 'Frame 14 copy.png', 'Frame 14.png', 'Frame 15.png'];
  const GRID_WALK = ['..', 'screenshots', 'app-icon.png', 'changelog.md', 'fact-sheet.pdf', 'Frame 12.png', 'Frame 13 copy.png', 'Frame 13.png'];
  const ZIP_WALK = ['invoice-0921.pdf', 'keynote-draft.key', 'meeting-notes.md', 'Oryn-0.0.6-aarch64.dmg', 'Oryn-brand-assets.zip'];
  const FILTER_ORDER = ['Frame 12.png', 'Frame 13.png', 'Frame 14.png', 'Frame 15.png', 'Frame 13 copy.png', 'Frame 14 copy.png'];
  const UP_MARKED = ['oryn-icon-01.png', 'oryn-icon-02.png', 'oryn-icon-03.png', 'oryn-icon-04.png', 'oryn-icon-05.png', 'oryn-icon-06.png'];

  function cursorAndMarks(t, side) {
    if (side === 'left') {
      if (t < T.openLeft) return { cursor: t >= T.divide ? 'Downloads' : '..', marks: [] };
      if (t < T.drop) {
        const m = steps(t, T.marks);
        if (m > 0) return { cursor: m < 6 ? MARKED[m] : 'invoice-0921.pdf', marks: MARKED.slice(0, m), markTimes: T.marks };
        return { cursor: DL_WALK[steps(t, T.walkLeft)], marks: [] };
      }
      if (t < T.openZip) return { cursor: ZIP_WALK[steps(t, T.walkZip) ? steps(t, T.walkZip) - 1 : 0], marks: [] };
      if (t < T.openLogo) return { cursor: t >= T.cursorLogo ? 'logo' : '..', marks: [] };
      if (t < T.gitRoot) return { cursor: '..', marks: [] };
      if (t < T.gitServices) return { cursor: 'desktop', marks: [] };
      if (t < T.launch) return { cursor: 'fs_listing.rs', marks: [] };
      if (t < T.browse) return { cursor: t >= T.cursorIcons ? 'icons' : '..', marks: [] };
      return { cursor: '..', marks: [] };
    }
    if (t < T.grid) return { cursor: '..', marks: [] };
    if (t < T.letters[0]) return { cursor: t < T.closeImg ? GRID_WALK[steps(t, T.walkGrid)] : t < T.closeMd ? 'press-release.md' : 'screenshots', marks: [] };
    if (t < T.marks2[0]) return { cursor: '..', marks: [] };
    if (t < T.clear) {
      const m = steps(t, T.marks2);
      return { cursor: FILTER_ORDER[Math.min(m, 5)], marks: FILTER_ORDER.slice(0, m), markTimes: T.marks2 };
    }
    if (t < T.upMarks[0]) return { cursor: t >= T.upFocus ? 'oryn-icon-01.png' : '..', marks: [] };
    if (t < T.arrived) {
      const m = steps(t, T.upMarks);
      return { cursor: m < 6 ? UP_MARKED[m] : 'oryn-wordmark.svg', marks: UP_MARKED.slice(0, m), markTimes: T.upMarks };
    }
    return { cursor: 'oryn-wordmark.svg', marks: [] };
  }
  const leftActive = (t) => t < T.grid || (t >= T.zipFocus && t < T.upFocus);

  function applyApp(t) {
    const app = q('#app');
    const mode = viewMode(t);
    setClass(app, 'list-mode', mode === 'list');
    setClass(app, 'grid-mode', mode === 'grid');
    setClass(app, 'columns-mode', mode === 'columns');
    setColumns(mode === 'columns' ? (t >= T.columnsNav ? 'nav' : 'root') : null);
    for (const [id, m] of [['btn-view-list', 'list'], ['btn-view-grid', 'grid'], ['btn-view-columns', 'columns']]) {
      setClass(q(`#${id}`), 'mac-toolbar-btn--active', mode === m);
    }
    const thumbDir = mode === 'grid' ? '160' : '48';
    for (const img of doc.querySelectorAll('img.row-thumbnail')) {
      const src = img.getAttribute('src');
      const want = src.replace(/icons\/(48|160)\//, `icons/${thumbDir}/`);
      if (src !== want) img.setAttribute('src', want);
    }

    setChrome(chromeKey(t));

    const split = t < T.divide ? 0 : S(t - T.divide, SPR.panel);
    style(q('#pane-right'), { flex: `${split.toFixed(4)} 1 0%`, minWidth: '0px', marginLeft: `${lerp(-12, 0, clamp(split)).toFixed(2)}px`, opacity: `${clamp(split * 1.6).toFixed(3)}` });
    setClass(q('#pane-left'), 'active', leftActive(t));
    setClass(q('#pane-right'), 'active', !leftActive(t));

    const modeAt = [T.grid, T.closeImg + BEAT / 2, T.backToList, T.pullBack].filter((x) => t >= x).pop();
    const sinceMode = modeAt === undefined ? 99 : t - modeAt;
    const rows = {};
    for (const side of ['left', 'right']) {
      const swap = lastSwap(t, side);
      rows[side] = setList(side, swap ? swap[2] : null);
      const { cursor, marks, markTimes } = cursorAndMarks(t, side);
      const prevNames = swap ? namesOf(swap[1]) : [];
      const since = swap ? t - swap[0] : 99;
      const renaming = !!swap && swap[1] === 'filter_frame' && swap[2] === 'presskit_renamed';
      const fresh = !swap || !swap[1] || FRESH.has(swap[2]);
      const k = swap && !fresh ? S(since, SPR.panel) : 1;
      setGhosts(side, swap && (!fresh || renaming) ? swap[1] : null, swap ? swap[2] : null, renaming ? S(since, [0.2, 1]) : k, since);
      const delay = renaming ? 0.14 : -0.05;
      rows[side].forEach((row, i) => {
        const name = nameOf(row);
        setClass(row, 'selected', name === cursor);
        const mi = marks.indexOf(name);
        setClass(row, 'user-selected', mi >= 0);
        let x = 0; let y = 0; let s = 1; let o = 1; let shadow = 0;
        if (swap && fresh) {
          const a = S(since - delay - (i * BEAT) / 8, SPR.select);
          y = lerp(16, 0, a);
          o = clamp(a * 1.3);
        } else if (swap) {
          const was = prevNames.indexOf(name);
          if (was >= 0) {
            y = lerp((was - i) * ROW_H, 0, k);
          } else {
            const order = rows[side].slice(0, i).filter((r) => prevNames.indexOf(nameOf(r)) < 0).length;
            const a = S(since - 0.04 - (order * BEAT) / 4, SPR.snap);
            x = lerp(40, 0, a);
            o = clamp(a * 1.2);
          }
        }
        if (mi >= 0 && markTimes) s *= lerp(0.97, 1, S(t - markTimes[mi], SPR.select));
        if (side === 'right' && name === 'Frame 13.png' && t >= T.lift && t < T.closeImg + 0.6) {
          const lift = S(t - T.lift, SPR.snap) * (1 - S(t - T.previewImg, [0.3, 1]));
          y -= 6 * lift;
          s *= 1 + 0.1 * lift;
          shadow = lift;
        }
        if (sinceMode < 1.0) {
          const a = S(sinceMode + 0.08 - (i * BEAT) / 16, SPR.snap);
          if (mode === 'grid') s *= lerp(0.86, 1, a);
          else y += lerp(8, 0, a);
          o = Math.min(o, clamp(a * 1.4));
        }
        applyMotion(row, x, y, s, o, shadow);
      });
    }

    const drag = dragPath(t);
    style(q('#film-ghost'), drag.visible
      ? { display: 'flex', transform: `translate(${(drag.x + 14).toFixed(2)}px, ${(drag.y + 18).toFixed(2)}px) scale(${drag.badge.toFixed(4)})`, opacity: `${drag.badge.toFixed(3)}` }
      : { display: 'none' });
    setClass(q('#list-right'), 'drag-over', drag.visible && drag.x > 770 && t < T.release);

    applyToast(t);
    applyViewer(t, rows.right);
    applySearchFocus(t);
    applyRename(t, rows.right);
    applyGit(t, rows.left);
    applyTerminal(t);
    applyPalette(t);
  }

  function applyMotion(row, x, y, s, o, shadow) {
    const still = Math.abs(x) < 0.01 && Math.abs(y) < 0.01 && Math.abs(s - 1) < 0.0005;
    style(row, {
      transform: still ? '' : `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`,
      opacity: o >= 0.999 ? '' : `${o.toFixed(3)}`,
      boxShadow: shadow > 0.01 ? `0 ${(14 * shadow).toFixed(1)}px ${(34 * shadow).toFixed(1)}px rgba(0,0,0,${(0.45 * shadow).toFixed(3)})` : '',
      zIndex: shadow > 0.01 ? '5' : '',
    });
  }

  function dragPath(t) {
    const from = { x: 262, y: 362 };
    const to = { x: 920, y: 350 };
    if (t < T.grab - 0.35 || t > T.release + 0.4) return { visible: false, x: to.x, y: to.y, badge: 0 };
    const k = S(t - T.grab - BEAT * 0.4, [0.62, 0.9]);
    const x = lerp(from.x, to.x, k);
    const y = lerp(from.y, to.y, k) - Math.sin(Math.PI * clamp(k)) * 40;
    const badge = t < T.release ? S(t - T.grab - BEAT * 0.2, SPR.snap) : 1 - S(t - T.release, [0.22, 1]);
    return { visible: t >= T.grab && t < T.release + 0.4, x, y, badge: clamp(badge) };
  }

  function applyToast(t) {
    const on = t >= T.release && t < T.drop + 0.5;
    const toast = setOverlay('nx-xfer', on ? 'xfer' : null);
    if (!toast) return;
    setClass(toast, 'nx-xfer--hidden', false);
    const p = ramp(t, T.release + 0.12, T.drop - 0.05);
    const inS = S(t - T.release, SPR.snap);
    const outS = S(t - T.drop, SPR.select);
    const prog = MARKED.map((_, i) => clamp(p * 3 - Math.floor(i / 2) - (i % 2) * 0.18, 0, 1) / (i % 2 ? 0.82 : 1));
    let active = 0;
    toast.querySelectorAll('.nx-xfer-queue-row').forEach((rowEl, i) => {
      const v = clamp(prog[i]);
      const st = rowEl.lastElementChild;
      const text = v <= 0 ? 'Queued' : v >= 1 ? 'Completed' : `Running · ${Math.round(v * 100)}% · ${MARKED[i]}`;
      if (st.textContent !== text) st.textContent = text;
      if (v > 0) active = i;
    });
    const av = clamp(prog[active]);
    q('#nx-xfer-fill').style.width = `${(av * 100).toFixed(1)}%`;
    q('#nx-xfer-pct').textContent = `${Math.round(av * 100)}%`;
    q('#nx-xfer-file').textContent = MARKED[active];
    q('#nx-xfer-title').textContent = `Copy 6 items → /Users/studio/Desktop/Press Kit · ${MARKED[active]}…`;
    style(toast, {
      transform: `translateY(${(lerp(18, 0, inS) + outS * 10).toFixed(2)}px) scale(${(lerp(0.96, 1, inS) - outS * 0.04).toFixed(4)})`,
      opacity: `${(clamp(inS * 1.4) * (1 - outS)).toFixed(3)}`,
    });
  }

  function flipDialog(dialog, src, k) {
    if (!dialog) return;
    dialog.style.transform = '';
    const m = dialog.getBoundingClientRect();
    const sx = src.width / m.width;
    const sy = src.height / m.height;
    const tx = src.left + src.width / 2 - (m.left + m.width / 2);
    const ty = src.top + src.height / 2 - (m.top + m.height / 2);
    dialog.style.transformOrigin = '50% 50%';
    dialog.style.transform = k >= 0.9995 ? '' : `translate(${lerp(tx, 0, k).toFixed(2)}px, ${lerp(ty, 0, k).toFixed(2)}px) scale(${lerp(sx, 1, k).toFixed(4)}, ${lerp(sy, 1, k).toFixed(4)})`;
    dialog.style.opacity = `${clamp(k * 2).toFixed(3)}`;
  }

  function applyViewer(t, rightRows) {
    let key = null;
    let k = 0;
    let src = null;
    if (t >= T.previewImg && t < T.closeImg + 0.5) {
      key = 'viewer_img';
      k = clamp(S(t - T.previewImg, SPR.morph) - S(t - T.closeImg, [0.45, 0.95]), 0, 1.2);
      src = rightRows.find((r) => nameOf(r) === 'Frame 13.png');
    } else if (t >= T.previewMd && t < T.closeMd + 0.5) {
      key = 'viewer_md';
      k = clamp(S(t - T.previewMd, SPR.morph) - S(t - T.closeMd, [0.45, 0.95]), 0, 1.2);
      src = rightRows.find((r) => nameOf(r) === 'press-release.md');
    }
    const overlay = setOverlay('viewer-overlay', key);
    if (!overlay || !src) return;
    style(overlay, { opacity: `${clamp(k * 1.5).toFixed(3)}` });
    flipDialog(overlay.querySelector('.viewer-modal'), src.getBoundingClientRect(), k);
  }

  function applySearchFocus(t) {
    const box = q('.mac-search-container');
    if (!box) return;
    if (!(t >= T.search && t < T.clear + 0.3)) {
      style(box, { boxShadow: '', borderColor: '', background: '' });
      return;
    }
    const k = S(t - T.search, SPR.snap) * (1 - S(t - T.clear, [0.3, 1]));
    style(box, {
      boxShadow: `0 0 0 ${(3 * k).toFixed(2)}px rgba(10, 132, 255, ${(0.25 * clamp(k)).toFixed(3)})`,
      borderColor: `rgba(10, 132, 255, ${clamp(k).toFixed(3)})`,
      background: `rgba(255, 255, 255, ${lerp(0.05, 0.08, clamp(k)).toFixed(3)})`,
    });
  }

  function markedBox(rows) {
    const sel = rows.filter((r) => r.classList.contains('user-selected')).map((r) => r.getBoundingClientRect());
    if (!sel.length) return null;
    const left = Math.min(...sel.map((r) => r.left));
    const top = Math.min(...sel.map((r) => r.top));
    const right = Math.max(...sel.map((r) => r.right));
    const bottom = Math.max(...sel.map((r) => r.bottom));
    return { left, top, width: right - left, height: bottom - top };
  }
  function applyRename(t, rightRows) {
    let key = null;
    if (t >= T.rename && t < T.apply + 0.5) {
      if (t >= T.replace) key = 'rename_replace';
      else if (t >= T.regex) key = 'rename_regex';
      else key = steps(t, T.find) ? `rename_find_${steps(t, T.find)}` : 'rename_open';
    }
    const overlay = setOverlay('multi-rename-overlay', key);
    if (!overlay) return;
    const pane = q('#list-right').getBoundingClientRect();
    const src = markedBox(rightRows) || { left: pane.left + 8, top: pane.top + ROW_H, width: pane.width - 16, height: 6 * ROW_H };
    const k = clamp(S(t - T.rename, SPR.morph) - S(t - T.apply, [0.42, 0.95]), 0, 1.2);
    style(overlay, { opacity: `${clamp(k * 1.5).toFixed(3)}` });
    flipDialog(overlay.querySelector('.multi-rename-modal'), src, k);
    if (key === 'rename_replace') {
      [...overlay.querySelectorAll('#mr-preview-list > *')].forEach((rowEl, i) => {
        const cell = rowEl.lastElementChild || rowEl;
        const a = S(t - T.replace - (i * BEAT) / 8, SPR.snap);
        style(cell, { opacity: `${clamp(a * 1.3).toFixed(3)}`, transform: `translateX(${lerp(10, 0, a).toFixed(2)}px)` });
      });
    }
  }

  function applyGit(t, leftRows) {
    const menu = setOverlay('ctx-menu', t >= T.ctxMenu && t < T.gitDiff ? 'ctx_git' : null);
    if (menu) {
      const a = S(t - T.ctxMenu, SPR.snap);
      style(menu, { transformOrigin: '0 0', transform: `scale(${lerp(0.94, 1, a).toFixed(4)})`, opacity: `${clamp(a * 1.6).toFixed(3)}` });
      const item = [...menu.querySelectorAll('.ctx-item')].find((el) => el.textContent.includes('Git Diff with HEAD'));
      if (item) setClass(item, 'ctx-item--active', t >= T.ctxMenu + BEAT);
      if (item) style(item, { background: t >= T.ctxMenu + BEAT ? 'var(--primary, #0a84ff)' : '', borderRadius: '6px' });
    }
    let key = null;
    if (t >= T.gitDiff && t < T.gitClose + 0.5) key = t >= T.gitLog ? 'git_log' : t >= T.gitBlame ? 'git_blame' : 'git_diff';
    const overlay = setOverlay('git-overlay', key);
    if (!overlay) return;
    const k = clamp(S(t - T.gitDiff, SPR.morph) - S(t - T.gitClose, [0.45, 0.95]), 0, 1.2);
    style(overlay, { opacity: `${clamp(k * 1.5).toFixed(3)}` });
    const row = leftRows.find((r) => nameOf(r) === 'fs_listing.rs');
    const src = row ? row.getBoundingClientRect() : { left: 240, top: 300, width: 500, height: 30 };
    flipDialog(overlay.querySelector('.modal'), src, k);
  }

  function applyTerminal(t) {
    let key = null;
    if (t >= T.termOpen && t < T.termClose + 0.5) key = t >= T.enter ? 'term_out' : t >= T.typing[0] ? 'term_typed' : 'term_open';
    const drawer = setOverlay('terminal-drawer', key);
    if (!drawer) return;
    setClass(drawer, 'hidden', false);
    const k = clamp(S(t - T.termOpen, SPR.panel) - S(t - T.termClose, [0.45, 0.95]), 0, 1.2);
    style(drawer, { transform: `translateY(${((1 - k) * 110).toFixed(2)}%)`, opacity: `${clamp(k * 2).toFixed(3)}` });
    if (key === 'term_typed') {
      const n = steps(t, T.typing);
      const cmd = 'git log --oneline -5';
      const spans = [...drawer.querySelectorAll('.xterm-rows span')];
      const target = spans.find((s) => s.dataset.full === cmd || s.textContent.includes('git log'));
      if (target) {
        if (!target.dataset.full) target.dataset.full = target.textContent;
        const full = target.dataset.full;
        const at0 = full.indexOf('git log');
        const text = full.slice(0, at0) + cmd.slice(0, n);
        if (target.textContent !== text) target.textContent = text;
      }
    }
  }

  function applyPalette(t) {
    let key = null;
    if (t >= T.palette && t < T.launch + 0.5) key = steps(t, T.query) ? `palette_${'press'.slice(0, steps(t, T.query))}` : 'palette_open';
    const overlay = setOverlay('command-palette-overlay', key);
    if (!overlay) return;
    const modal = overlay.querySelector('.command-palette-modal');
    const inK = S(t - T.palette, SPR.snap);
    const out = S(t - T.launch, [0.45, 0.95]);
    style(overlay, { opacity: `${clamp(inK * 1.5 - out * 1.2).toFixed(3)}` });
    if (t < T.launch) {
      style(modal, { transformOrigin: '50% 0%', transform: `translateY(${lerp(-14, 0, inK).toFixed(2)}px) scale(${lerp(0.97, 1, inK).toFixed(4)})`, opacity: `${clamp(inK * 1.6).toFixed(3)}` });
    } else {
      flipDialog(modal, q('#mac-breadcrumbs').getBoundingClientRect(), 1 - out);
    }
  }

  const CAMERA_KEYS = [
    [0, MAC_CLOSED],
    [T.lidOpen, MAC_OPEN, SPR.soft],
    [T.pushIn, { cx: 640, cy: 400, z: 1.0 }, SPR.camera],
    [T.focusLeft - BEAT * 0.75, { cx: 500, cy: 380, z: 1.72 }, SPR.camera],
    [T.grab - BEAT * 0.75, { cx: 750, cy: 400, z: 1.36 }, SPR.cameraFast],
    [T.drop, { cx: 920, cy: 400, z: 1.62 }, SPR.snap],
    [T.grid, { cx: 1000, cy: 380, z: 1.58 }, SPR.camera],
    [T.previewImg - BEAT * 0.5, { cx: 640, cy: 400, z: 1.24 }, SPR.cameraFast],
    [T.closeMd, { cx: 820, cy: 330, z: 1.62 }, SPR.cameraFast],
    [T.search - BEAT * 0.5, { cx: 1010, cy: 300, z: 1.9 }, SPR.cameraFast],
    [T.rename - BEAT * 0.25, { cx: 640, cy: 392, z: 1.42 }, SPR.cameraFast],
    [T.apply, { cx: 1000, cy: 380, z: 1.6 }, SPR.cameraFast],
    [T.zipFocus - BEAT * 0.5, { cx: 500, cy: 360, z: 1.72 }, SPR.cameraFast],
    [T.ctxMenu - BEAT * 0.5, { cx: 640, cy: 420, z: 1.3 }, SPR.cameraFast],
    [T.gitDiff, { cx: 640, cy: 400, z: 1.36 }, SPR.cameraFast],
    [T.termOpen - BEAT * 0.5, { cx: 440, cy: 580, z: 1.55 }, SPR.camera],
    [T.palette - BEAT * 0.5, { cx: 640, cy: 330, z: 1.5 }, SPR.camera],
    [T.launch, { cx: 500, cy: 360, z: 1.6 }, SPR.camera],
    [T.upFocus - BEAT * 0.5, { cx: 1000, cy: 380, z: 1.6 }, SPR.camera],
    [T.upload, { cx: 750, cy: 400, z: 1.36 }, SPR.camera],
    [T.pullBack, CARD_VIEW, SPR.soft],
    [T.toWin, { ...CARD_VIEW, z: CARD_VIEW.z * 1.015 }, [1.2, 1]],
    [T.toLinux, { ...CARD_VIEW, z: CARD_VIEW.z * 1.03 }, [1.2, 1]],
    [FAN_AT, LINEUP_VIEW, SPR.soft],
    [T.converge, MAC_OPEN, [0.95, 1]],
    [T.lidClose + BEAT, MAC_CLOSED, SPR.soft],
  ];
  function cameraAt(t) {
    const pick = (f) => chain(t, CAMERA_KEYS.map(([tk, v, s]) => [tk, v[f], s]));
    return { cx: pick('cx'), cy: pick('cy'), z: pick('z') };
  }
  const worldToStage = (cam, x, y) => ({ x: STAGE / 2 + (x - WX - cam.cx) * cam.z, y: STAGE / 2 + (y - WY - cam.cy) * cam.z });

  function lidAngle(t) {
    if (t < T.lidOpen) return -90;
    if (t < T.lidClose) return -90 * (1 - S(t - T.lidOpen, SPR.lid));
    return -90 * S(t - T.lidClose, [0.8, 0.95]);
  }

  function applyWorld(t) {
    const cam = cameraAt(t);
    world.style.transform = `translate(${(STAGE / 2 - (WX + cam.cx) * cam.z).toFixed(3)}px, ${(STAGE / 2 - (WY + cam.cy) * cam.z).toFixed(3)}px) scale(${cam.z.toFixed(5)})`;
    const shown = clamp(ramp(t, T.toLaptop, T.toLaptop + 0.3)) * (1 - clamp(ramp(t, T.toRow, T.toRow + 0.3)));
    style(world, { opacity: `${shown.toFixed(3)}`, display: shown > 0.001 ? 'block' : 'none' });

    const angle = lidAngle(t);
    const moving = Math.abs(angle) > 0.02;
    style(mac, { perspective: moving ? '20000px' : 'none', perspectiveOrigin: '820px -370px' });
    style(macLid, { transform: moving ? `rotateX(${angle.toFixed(3)}deg)` : 'none', transformStyle: moving ? 'preserve-3d' : 'flat' });
    const on = clamp((1 + angle / 90 - 0.3) / 0.45);
    style(screen, { opacity: `${on.toFixed(3)}` });

    const card = clamp(S(t - T.pullBack + 0.08, [0.5, 1])) * (1 - clamp(S(t - T.converge - 0.1, [0.6, 1])));
    const cut = card > 0.0005;
    const cutY = lerp(1092, 1008, card);
    style(macFront, { clipPath: cut ? `inset(${(26 * card).toFixed(2)}px ${(18 * card).toFixed(2)}px ${clamp(1028 - cutY, 0, 20).toFixed(2)}px ${(18 * card).toFixed(2)}px round ${lerp(28, 14, card).toFixed(2)}px)` : '' });
    style(macDeck, { clipPath: cut ? `inset(0 0 ${(40 - clamp(cutY - 1028, 0, 40)).toFixed(2)}px 0)` : '' });
    style(macLip, { clipPath: cut ? `inset(0 0 ${(24 - clamp(cutY - 1068, 0, 24)).toFixed(2)}px 0)` : '' });
    style(macShadow, { opacity: cut ? (1 - card).toFixed(3) : '' });
    style(macNotch, { opacity: cut ? clamp(1 - card * 1.6).toFixed(3) : '' });
    style(macDisplay, cut
      ? { borderRadius: `${lerp(12, 14, card).toFixed(2)}px ${lerp(12, 14, card).toFixed(2)}px ${lerp(2, 14, card).toFixed(2)}px ${lerp(2, 14, card).toFixed(2)}px` }
      : { borderRadius: '' });
    style(macDeskShadow, { boxShadow: deskShadow(card) });
    const wipeWin = clamp(S(t - T.toWin, SPR.wipe));
    const wipeLinux = clamp(S(t - T.toLinux, SPR.wipe));
    const fan = S(t - FAN_AT, SPR.soft);
    const away = S(t - T.converge, [0.5, 1]);
    const slotX = (slot) => slot * (SLOT * fan + 420 * away);
    for (const [el, wipe, slot, t0] of [[deskWin, wipeWin, 1, T.toWin], [deskLinux, wipeLinux, 2, T.toLinux]]) {
      const vis = t >= t0 && away < 0.999;
      style(el, {
        display: vis ? 'block' : 'none',
        transform: `translate(${(DISPLAY.x + slotX(slot)).toFixed(2)}px, ${DISPLAY.y}px)`,
        clipPath: wipe < 0.9995 ? `inset(0 ${((1 - wipe) * 100).toFixed(3)}% 0 0)` : 'none',
        boxShadow: deskShadow(clamp(fan)),
        opacity: `${(1 - away).toFixed(3)}`,
      });
    }

    const lblIn = clamp(S(t - T.pullBack - BEAT, SPR.snap)) * (1 - clamp(S(t - T.converge, [0.4, 1])));
    const handover = (w) => clamp(1 - w * 2.5);
    const arrive = (w) => clamp((w - 0.4) / 0.6);
    const vis = {
      mac: Math.max(handover(wipeWin), clamp(fan)),
      win: t < T.toWin ? 0 : Math.max(arrive(wipeWin) * handover(wipeLinux), clamp(fan)),
      linux: t < T.toLinux ? 0 : arrive(wipeLinux),
    };
    [['mac', 0], ['win', 1], ['linux', 2]].forEach(([key, slot]) => {
      const p = worldToStage(cam, DISPLAY.x + DISPLAY.w / 2 + slotX(slot), DISPLAY.y + DISPLAY.h);
      const rise = key === 'mac' ? 0 : 10 * (1 - vis[key]);
      style(labels[key], { transform: `translate(${p.x.toFixed(1)}px, ${(p.y + 30 + rise).toFixed(1)}px)`, opacity: `${(vis[key] * lblIn).toFixed(3)}` });
    });

    assembleChrome(t);
    const drag = dragPath(t);
    const show = t >= T.grab - 0.35 && t < T.release + 0.5;
    const appear = S(t - (T.grab - 0.35), SPR.snap) * (1 - S(t - T.release - 0.15, [0.3, 1]));
    style(pointer, {
      display: show ? 'block' : 'none',
      transform: `translate(${drag.x.toFixed(2)}px, ${drag.y.toFixed(2)}px) scale(${t >= T.grab && t < T.release ? 0.9 : 1})`,
      opacity: `${clamp(appear).toFixed(3)}`,
    });
    style(traffic, { opacity: '1' });
    return cam;
  }

  function assembleChrome(t) {
    const t0 = T.screenOn + 0.1;
    const parts = [['#sidebar', 0, 'x', -28], ['header.mac-header', 1, 'y', -10], ['.mac-toolbar', 2, 'y', -10], ['section.mac-nav-bar', 3, 'y', -10], ['#panes-wrapper', 4, 'y', 14], ['footer', 5, 'y', 8]];
    for (const [sel, i, axis, d] of parts) {
      const el = q(sel);
      if (!el) continue;
      const s = S(t - t0 - (i * BEAT) / 4, SPR.panel);
      if (s > 0.9995) style(el, { transform: '', opacity: '' });
      else style(el, { transform: axis === 'x' ? `translateX(${lerp(d, 0, s).toFixed(2)}px)` : `translateY(${lerp(d, 0, s).toFixed(2)}px)`, opacity: `${clamp(s * 1.4).toFixed(3)}` });
    }
  }

  const UNROLL_AT = 0.36;
  const REGROW_AT = 0.22;
  const bigAdvance = [0, 1, 2, 3].map((i) => (i < 3 ? big.offsets[i + 1] : big.width) - big.offsets[i]);
  function applyBrand(t, cam) {
    const toLaptop = clamp(ramp(t, T.toLaptop, T.toLaptop + 0.3)) * (1 - clamp(ramp(t, T.toRow, T.toRow + 0.3)));
    const k = clamp(S(t - T.drawTogether, [0.6, 0.86]) - S(t - T.unfold - REGROW_AT, [0.6, 0.86]), 0, 1.1);
    const u = Math.max(0, S(t - T.drawTogether - UNROLL_AT, SPR.snap) - S(t - T.unfold, SPR.snap));
    const early = clamp(u * 3);
    const iconC = ICON.x + ICON.h / 2;
    const rowL = lerp(iconC, PILL.x, early);
    const rowR = lerp(iconC, PILL.x + PILL.w, u);
    const rowH = lerp(ICON.h, PILL.h, early);
    const gap = S(t - T.lockupHold, SPR.snap) - S(t - T.drawTogether, [0.42, 0.9]);
    glyphs.forEach((g, i) => {
      const x = lerp(wordX + big.offsets[i] + gap * 7 * i, labelX + small.offsets[i], k);
      const y = lerp(baseY - big.baseline, labelBase - small.baseline, k);
      const s = lerp(1, ROW_FS / FS, clamp(k));
      style(g, {
        transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(5)})`,
        fontWeight: `${Math.round(lerp(700, 500, clamp(k)))}`,
        color: u > 0.001 && rowR > x + (s * bigAdvance[i]) / 2 ? '#F5F5F7' : '#141416',
        opacity: `${(1 - toLaptop).toFixed(3)}`,
      });
    });
    const mx = lerp(lockupX, ICON.x, clamp(k));
    const my = lerp(LOCKUP_CY - MARK_H / 2, ICON.y, clamp(k));
    const ms = lerp(markScale, ICON.h / MARK.viewBox[1], clamp(k));
    style(markA, { transform: `translate(${(-10 * gap).toFixed(2)}px, ${(-4 * gap).toFixed(2)}px)` });
    style(markB, { transform: `translate(${(10 * gap).toFixed(2)}px, ${(4 * gap).toFixed(2)}px)` });
    style(markSvg, { transform: `translate(${mx.toFixed(2)}px, ${my.toFixed(2)}px) scale(${ms.toFixed(5)})`, opacity: `${(1 - toLaptop).toFixed(3)}` });

    const a0 = worldToStage(cam, 0, 1028);
    const a1 = worldToStage(cam, 1640, 1102);
    const px = lerp(rowL, a0.x, toLaptop);
    const pw = lerp(rowR - rowL, a1.x - a0.x, toLaptop);
    const py = lerp(PILL.y + (PILL.h - rowH) / 2, a0.y, toLaptop);
    const ph = lerp(rowH, a1.y - a0.y, toLaptop);
    style(pill, {
      left: `${px.toFixed(2)}px`, top: `${py.toFixed(2)}px`, width: `${pw.toFixed(2)}px`, height: `${ph.toFixed(2)}px`,
      opacity: `${u > 0.001 ? (1 - toLaptop).toFixed(3) : '0'}`,
    });
    pillMeta.forEach((m) => style(m, { opacity: `${(clamp((u - 0.75) / 0.25) * (1 - toLaptop)).toFixed(3)}` }));
    const tg = S(t - T.tagline, [0.55, 0.95]);
    style(tagline, { transform: `translate(0px, ${(LOCKUP_CY + 150 + lerp(14, 0, tg)).toFixed(2)}px)`, opacity: `${clamp(tg * 1.2).toFixed(3)}` });
  }

  function seek(t) {
    t = clamp(t, 0, DURATION);
    applyApp(t);
    applyMirrors(t);
    const cam = applyWorld(t);
    applyBrand(t, cam);
    return t;
  }

  function settled() {
    const docs = [doc, mirrors.win.contentDocument, mirrors.linux.contentDocument].filter(Boolean);
    const imgs = [...document.images, ...docs.flatMap((d) => [...d.images])].filter((i) => i.getAttribute('src') && !i.complete);
    return Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))).then(() => document.fonts.ready);
  }

  const preload = Promise.all(['1', '2', '6', '7', '8', '9', '10'].flatMap((n) => ['', '48/', '160/'].map((dir) => new Promise((r) => {
    const im = new Image();
    im.onload = im.onerror = r;
    im.src = `assets/icons/${dir}${n}.png`;
  }))));

  function remount(t) {
    mountApp();
    return seek(t);
  }

  window.film = { seek, remount, settled, DURATION, BPM, at, T, ready: preload.then(() => document.fonts.ready) };
  window.seek = seek;
  const qs = new URLSearchParams(location.search);
  seek(qs.has('t') ? parseFloat(qs.get('t')) : 0);
})();
