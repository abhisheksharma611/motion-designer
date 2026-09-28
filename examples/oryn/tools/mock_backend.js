(() => {
  const ORIGIN = 'http://oryn.test';
  const TEXT = window.__ORYN_TEXT__ || {};
  const GIT = window.__ORYN_GIT__ || { log: [], diff: '', blame: [], code: '' };
  const PLATFORM = window.__ORYN_PLATFORM__ || 'mac';

  if (PLATFORM !== 'mac') {
    const ua = PLATFORM === 'win'
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
      : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
    Object.defineProperty(navigator, 'userAgent', { get: () => ua });
    Object.defineProperty(navigator, 'platform', { get: () => (PLATFORM === 'win' ? 'Win32' : 'Linux x86_64') });
  }
  const HOME = { mac: '/Users/studio', win: 'C:/Users/studio', linux: '/home/studio' }[PLATFORM];
  const ROOT = PLATFORM === 'win' ? 'C:/' : '/';
  const DRIVE = { mac: 'Macintosh HD', win: 'Local Disk (C:)', linux: 'File System' }[PLATFORM];
  const REPO = HOME + '/Projects/Oryn';

  const D = (name, mtime = '2026-09-24T09:12:00') => ({ name, isDir: true, size: null, mtime });
  const F = (name, size, mtime = '2026-09-24T09:12:00') => ({ name, isDir: false, size, mtime });

  const fs = {
    [ROOT]: PLATFORM === 'win' ? [D('Program Files'), D('Users'), D('Windows')]
      : PLATFORM === 'linux' ? [D('bin'), D('etc'), D('home'), D('usr'), D('var')]
        : [D('Applications'), D('Library'), D('System'), D('Users')],
    [HOME.slice(0, HOME.lastIndexOf('/')) || ROOT]: [D('Shared'), D('studio')],
    [HOME]: [D('Applications'), D('Desktop'), D('Documents'), D('Downloads'), D('Movies'), D('Music'), D('Pictures'), D('Projects')],
    [HOME + '/Downloads']: [
      D('Fonts', '2026-09-18T15:12:00'),
      D('Receipts', '2026-09-02T09:40:00'),
      F('Frame 12.png', 1283180, '2026-09-25T10:14:00'),
      F('Frame 13.png', 1133480, '2026-09-25T10:14:00'),
      F('Frame 13 copy.png', 1108597, '2026-09-25T10:15:00'),
      F('Frame 14.png', 1138746, '2026-09-25T10:15:00'),
      F('Frame 14 copy.png', 970554, '2026-09-25T10:16:00'),
      F('Frame 15.png', 1034760, '2026-09-25T10:16:00'),
      F('brand-guidelines.pdf', 4823040, '2026-09-21T17:30:00'),
      F('invoice-0921.pdf', 88210, '2026-09-21T09:05:00'),
      F('keynote-draft.key', 18350080, '2026-09-23T19:48:00'),
      F('meeting-notes.md', 3120, '2026-09-24T11:02:00'),
      F('Oryn-0.0.6-aarch64.dmg', 9437184, '2026-09-24T10:38:00'),
      F('Oryn-brand-assets.zip', 4404019, '2026-09-24T18:40:00'),
      F('screen-recording.mov', 52428800, '2026-09-22T16:20:00'),
    ],
    [HOME + '/Downloads/Oryn-brand-assets.zip']: [
      D('colors', '2026-09-24T18:31:00'), D('fonts', '2026-09-24T18:31:00'), D('logo', '2026-09-24T18:31:00'),
      F('LICENSE.txt', 1070, '2026-09-24T18:31:00'), F('README.md', 1840, '2026-09-24T18:31:00'),
    ],
    [HOME + '/Downloads/Oryn-brand-assets.zip/logo']: [
      F('oryn-lockup-dark.svg', 6120, '2026-09-24T18:31:00'), F('oryn-lockup-light.svg', 6118, '2026-09-24T18:31:00'),
      F('oryn-mark.svg', 34303, '2026-09-24T18:31:00'), F('oryn-mark@1024.png', 765138, '2026-09-24T18:31:00'),
      F('oryn-wordmark.svg', 4210, '2026-09-24T18:31:00'),
    ],
    [HOME + '/Downloads/Oryn-brand-assets.zip/colors']: [F('palette.ase', 2048), F('tokens.json', 1312)],
    [HOME + '/Downloads/Oryn-brand-assets.zip/fonts']: [F('README.txt', 640)],
    [HOME + '/Desktop']: [D('Press Kit', '2026-09-25T09:30:00'), D('Screenshots', '2026-09-24T18:02:00'), F('todo.txt', 412, '2026-09-25T08:47:00')],
    [HOME + '/Desktop/Press Kit']: [
      D('screenshots', '2026-09-24T18:10:00'),
      F('app-icon.png', 996304, '2026-09-24T17:55:00'),
      F('changelog.md', 2380, '2026-09-24T10:38:00'),
      F('fact-sheet.pdf', 312400, '2026-09-24T16:20:00'),
      F('oryn-wordmark.svg', 4210, '2026-09-24T17:58:00'),
      F('press-release.md', 3480, '2026-09-25T09:30:00'),
      F('press-release.pdf', 208900, '2026-09-25T09:31:00'),
    ],
    [HOME + '/Desktop/Press Kit/screenshots']: [
      F('oryn-columns.png', 80781, '2026-09-24T18:10:00'), F('oryn-dual-pane.png', 127383, '2026-09-24T18:10:00'),
      F('oryn-grid-view.png', 79484, '2026-09-24T18:10:00'), F('oryn-terminal.png', 135966, '2026-09-24T18:10:00'),
    ],
    [HOME + '/Desktop/Screenshots']: [],
    [HOME + '/Documents']: [D('Contracts'), D('Invoices'), F('Q3 plan.pages', 1240000)],
    [HOME + '/Projects']: [D('Oryn', '2026-09-26T23:33:00'), D('website', '2026-09-20T12:00:00')],
    [REPO]: [
      D('.github', '2026-09-24T01:02:00'), D('desktop', '2026-09-26T23:30:00'), D('docs', '2026-09-24T01:02:00'),
      D('public', '2026-09-24T01:02:00'), D('scripts', '2026-09-24T01:13:00'), D('src', '2026-09-26T23:30:00'),
      F('CHANGELOG.md', 2380, '2026-09-24T10:38:00'), F('LICENSE', 34719, '2026-09-02T00:29:00'),
      F('package.json', 1312, '2026-09-24T10:37:00'), F('README.md', 6603, '2026-09-10T16:34:00'),
      F('tsconfig.json', 461, '2026-08-31T18:28:00'), F('vite.config.ts', 429, '2026-09-02T01:33:00'),
    ],
    [REPO + '/desktop']: [D('icons'), D('src', '2026-09-26T23:30:00'), D('tests'), F('Cargo.lock', 180224), F('Cargo.toml', 1720), F('tauri.conf.json', 2210)],
    [REPO + '/desktop/src']: [D('commands'), D('services', '2026-09-26T23:30:00'), D('vfs'), F('lib.rs', 9640), F('main.rs', 188)],
    [REPO + '/desktop/src/services']: [
      F('fs_archive.rs', 8758), F('fs_config.rs', 2879), F('fs_delete.rs', 6691), F('fs_duplicates.rs', 9995),
      F('fs_listing.rs', 6008, '2026-09-26T23:30:00'), F('fs_office.rs', 23575), F('fs_props.rs', 3734), F('fs_rename.rs', 5365),
      F('fs_size.rs', 11485), D('fs_transfer', '2026-09-26T23:30:00'), F('fs_transfer.rs', 9116), F('fs_vfs.rs', 1868),
      F('fs_watcher.rs', 4117), F('fs_zip.rs', 3342), F('mod.rs', 333), F('os_favorites.rs', 8654), D('remote'),
    ],
  };
  const remote = {
    'press-server:/': [D('var')],
    'press-server:/var': [D('www')],
    'press-server:/var/www': [D('press'), D('site')],
    'press-server:/var/www/press': [
      D('2025', '2025-11-02T10:00:00'),
      D('icons', '2026-09-20T08:00:00'),
      F('index.html', 6120, '2026-09-20T08:00:00'),
      F('press-kit.zip', 24117248, '2026-09-20T08:00:00'),
    ],
    'press-server:/var/www/press/icons': [],
    'press-server:/var/www/press/2025': [F('press-kit-2025.zip', 18874368, '2025-11-02T10:00:00')],
  };

  const norm = (p) => (p || '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
  const dirname = (p) => {
    p = norm(p);
    const i = p.lastIndexOf('/');
    if (i < 0) return ROOT;
    if (i === 0) return '/';
    const d = p.slice(0, i);
    return /^[A-Za-z]:$/.test(d) ? d + '/' : d;
  };
  const basename = (p) => norm(p).split('/').pop() || '';
  const iso = (m) => (m ? new Date(m).toISOString() : '');
  const listing = (entries, withParent) => ({
    ok: true,
    items: [
      ...(withParent ? [{ display: '..', base: '..', isDir: true, size: null, mtime: '' }] : []),
      ...entries.map((e) => ({ display: e.name, base: e.name, isDir: e.isDir, size: e.size, mtime: iso(e.mtime) })),
    ],
  });
  const find = (dir, name) => (fs[dir] || []).find((e) => e.name === name);
  const inRepo = (p) => norm(p) === REPO || norm(p).startsWith(REPO + '/');

  let cbid = 1000;
  const callbacks = {};
  const listeners = {};
  window.__mockEmit = (event, payload) => {
    (listeners[event] || []).forEach((id) => callbacks[id] && callbacks[id]({ event, id, payload }));
  };
  window.__mockHold = {};
  window.__mockWaiting = {};
  window.__mockTasks = [];
  window.__mockRelease = (name) => {
    window.__mockHold[name] = false;
    (window.__mockWaiting[name] || []).splice(0).forEach((resolve) => resolve());
  };
  const held = (name) => new Promise((resolve) => {
    if (!window.__mockHold[name]) return resolve();
    (window.__mockWaiting[name] = window.__mockWaiting[name] || []).push(resolve);
  });

  const gitFiles = [
    { file: 'desktop/src/services/fs_listing.rs', index: ' ', worktree: 'M' },
    { file: 'desktop/src/services/fs_transfer/engine.rs', index: ' ', worktree: 'M' },
    { file: 'src/modules/columns/columnsViewController.ts', index: 'M', worktree: ' ' },
  ];
  const terminal = {
    pwd: () => ({ code: 0, stdout: '', stderr: '' }),
    'git log --oneline -5': () => ({
      code: 0,
      stdout: GIT.log.slice(0, 5).map((c, i) => (i === 0
        ? `\u001b[33m${c.short} (\u001b[1;36mHEAD -> \u001b[1;32mmain\u001b[0;33m)\u001b[0m ${c.subject}`
        : `\u001b[33m${c.short}\u001b[0m ${c.subject}`)).join('\n') + '\n',
      stderr: '',
    }),
  };

  const pty = { cwd: HOME, buf: '' };
  const prompt = () => `\u001b[1;32mstudio@oryn\u001b[0m \u001b[1;34m${basename(pty.cwd) || '~'}\u001b[0m % `;

  const handlers = {
    app_get_home: () => HOME,
    config_load: () => ({}),
    system_get_stats: () => ({ cpuPct: 9, ramUsed: 7516192768, ramTotal: 17179869184, ramPct: 44, uptimeSec: 86400 }),
    system_get_path_space: () => ({ ok: true, total: 994662584320, free: 612032512000 }),
    system_get_locations: () => ({
      home: HOME,
      desktop: HOME + '/Desktop',
      documents: HOME + '/Documents',
      downloads: HOME + '/Downloads',
      pictures: HOME + '/Pictures',
      music: HOME + '/Music',
      videos: HOME + '/Movies',
      favorites: [
        { name: 'Desktop', path: HOME + '/Desktop' },
        { name: 'Downloads', path: HOME + '/Downloads' },
        { name: 'Documents', path: HOME + '/Documents' },
      ],
      drives: [{ name: DRIVE, mountPoint: ROOT, totalSpace: 994662584320, availableSpace: 612032512000, isRemovable: false }],
      locations: [{ name: DRIVE, mountPoint: ROOT, totalSpace: 994662584320, availableSpace: 612032512000, isRemovable: false }],
    }),
    git_is_repo: ({ input }) => (inRepo(input.dirPath) ? { ok: true, root: REPO } : { ok: false }),
    git_status: () => ({ ok: true, branch: 'main', ahead: 0, behind: 0, files: gitFiles }),
    git_log: () => ({ ok: true, commits: GIT.log }),
    git_diff: () => ({ ok: true, diff: GIT.diff }),
    git_blame: () => ({ ok: true, lines: GIT.blame }),
    git_branches: () => ({
      ok: true,
      branches: [
        { name: 'main', isCurrent: true, upstream: 'origin/main' },
        { name: 'feat/os-favorites', isCurrent: false },
        { name: 'release/v0.0.3', isCurrent: false },
      ],
    }),
    fs_watch_dirs: () => ({ ok: true }),
    fs_read_dir: ({ input }) => {
      const p = norm(input.path);
      const key = fs[p] ? p : fs[p + '/'] ? p + '/' : null;
      if (!key) return { ok: false, error: `No such directory: ${p}` };
      return listing(fs[key], key !== ROOT);
    },
    fs_read_file_text: ({ input }) => {
      const name = basename(input.path);
      const t = name === 'fs_listing.rs' ? GIT.code : TEXT[name];
      if (t == null) throw new Error('binary file');
      return t;
    },
    fs_probe_text: ({ input }) => ({ ok: true, isText: TEXT[basename(input.path)] != null || basename(input.path) === 'fs_listing.rs' }),
    fs_read_media_data_url: async ({ input }) => {
      const r = await fetch(ORIGIN + '/__media/' + encodeURIComponent(norm(input.path)));
      const blob = await r.blob();
      return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    },
    fs_stat_props: ({ input }) => {
      const e = find(dirname(input.path), basename(input.path));
      return { ok: true, props: { size: e?.size ?? 0, isDir: !!e?.isDir, mtime: iso(e?.mtime), mode: 'rw-r--r--' }, size: e?.size ?? 0, isDir: !!e?.isDir };
    },
    fs_get_dir_size: () => ({ ok: true, size: 0 }),
    fs_copy_conflicts: () => ({ ok: true, conflicts: [] }),
    fs_copy: async ({ input }) => {
      window.__mockTasks.push({ taskId: input.taskId, name: basename(input.src) });
      await held('copy');
      const e = find(dirname(input.src), basename(input.src));
      const dst = dirname(input.dst);
      if (e && fs[dst] && !find(dst, e.name)) fs[dst].push({ ...e, mtime: '2026-09-26T10:21:00' });
      return { ok: true, copied: 1 };
    },
    fs_rename: ({ input }) => {
      const e = find(dirname(input.src), basename(input.src));
      if (e) e.name = basename(input.dst);
      return { ok: true };
    },
    remote_list_profiles: () => [
      { id: 'press-server', name: 'press-server', host: '203.0.113.24', port: 22, username: 'deploy', auth_type: 'Key', initial_path: '/var/www/press' },
    ],
    remote_connect: () => ({ ok: true }),
    remote_test_connection: () => ({ ok: true }),
    remote_read_dir: ({ profileId, path }) => {
      const key = `${profileId}:${norm(path) || '/'}`;
      if (!remote[key]) return { ok: false, error: `No such directory: ${path}` };
      return listing(remote[key], norm(path) !== '/');
    },
    remote_upload: async ({ profileId, localSrc, remoteDst }) => {
      await held('upload');
      const e = find(dirname(localSrc), basename(localSrc));
      const key = `${profileId}:${dirname(remoteDst)}`;
      if (e && remote[key] && !remote[key].find((x) => x.name === e.name)) remote[key].push({ ...e, mtime: '2026-09-26T10:24:00' });
      return { ok: true };
    },
    shell_exec: ({ input }) => (terminal[(input?.cmd || '').trim()] || (() => ({ code: 0, stdout: '', stderr: '' })))(),
    shell_terminal_start: ({ input }) => {
      pty.cwd = input?.cwd || HOME;
      setTimeout(() => window.__mockEmit('terminal-output', { sessionId: 'pty-1', data: prompt() }), 20);
      return 'pty-1';
    },
    shell_terminal_write: ({ input }) => {
      let out = '';
      for (const ch of input.data) {
        if (ch === '\r') {
          const cmd = pty.buf.trim();
          pty.buf = '';
          const res = cmd ? (terminal[cmd] || (() => ({ stdout: `zsh: command not found: ${cmd.split(' ')[0]}\n` })))() : { stdout: '' };
          out += '\r\n' + res.stdout.replace(/\n/g, '\r\n') + prompt();
        } else if (ch === '\u007f') {
          if (pty.buf) { pty.buf = pty.buf.slice(0, -1); out += '\b \b'; }
        } else {
          pty.buf += ch;
          out += ch;
        }
      }
      if (out) window.__mockEmit('terminal-output', { sessionId: 'pty-1', data: out });
      return null;
    },
    shell_terminal_resize: () => null,
    shell_terminal_stop: () => null,
    'plugin:updater|check': () => null,
    set_dock_icon: () => null,
    path_join: ({ a, b }) => norm(`${a}/${b}`),
    path_dirname: ({ input }) => dirname(input.path),
    path_basename: ({ input }) => basename(input.path),
    path_normalize: ({ input }) => norm(input.path),
    'plugin:event|listen': ({ event, handler }) => {
      (listeners[event] = listeners[event] || []).push(handler);
      return handler;
    },
    'plugin:event|unlisten': () => null,
  };

  window.__ORYN_CALLS__ = [];
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
  window.__TAURI_INTERNALS__ = {
    metadata: { currentWindow: { label: 'main' }, currentWebview: { windowLabel: 'main', label: 'main' } },
    convertFileSrc: (src) => `${ORIGIN}/__media/${encodeURIComponent(norm(src))}`,
    transformCallback: (cb) => { const id = ++cbid; callbacks[id] = cb; return id; },
    unregisterCallback: (id) => { delete callbacks[id]; },
    invoke: async (cmd, args = {}) => {
      window.__ORYN_CALLS__.push(cmd);
      const h = handlers[cmd];
      return h ? await h(args) : { ok: true };
    },
  };

  try {
    localStorage.setItem('Oryn.paneMode', 'dual');
    localStorage.setItem('Oryn.viewMode', 'list');
    localStorage.setItem('Oryn.pinnedFolders', JSON.stringify([
      { id: 'pin_press', path: HOME + '/Desktop/Press Kit', name: 'Press Kit' },
      { id: 'pin_oryn', path: REPO, name: 'Oryn' },
    ]));
    localStorage.setItem('Oryn.recentPaletteItems', JSON.stringify([
      'sftp://press-server/var/www/press',
      HOME + '/Desktop/Press Kit',
      REPO,
    ]));
  } catch {  }
})();
