const TERM = { bar: 38, x: 26, top: 54, rows: 28, lh: 23, cw: 9 };
TERM.viewH = TERM.rows * TERM.lh;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const G = { dot: '<i class="g g-dot"></i>', elbow: '<i class="g g-elbow"></i>', check: '<i class="g g-check"></i>' };

function tool(k, at, name, args, out, { done, outAt = [], color = "var(--ccOk)" } = {}) {
  const lines = [{ at, html: `${G.dot} <span class="b">${name}</span>(${esc(args)})` }];
  out.forEach((html, i) => lines.push({ at: outAt[i] ?? at + 0.2 + i * 0.12, html: (i ? "     " : `  ${G.elbow}  `) + html }));
  return { k, at, lines, bullet: { done: done ?? lines[lines.length - 1].at + 0.1, color } };
}
const say = (k, at, rows) => ({ k, at, lines: rows.map((r, i) => ({ at: r.at ?? at + i * 0.1, html: (i ? "  " : `${G.dot} `) + r.html })), bullet: { done: at, color: "var(--ccText)" } });
const user = (k, at, text) => ({ k, at, user: true, instant: true, lines: [{ at, html: `<span class="dim">&gt;</span> ${esc(text)}` }] });

function termMarkup(title, items) {
  const item = (it) => `
    <div class="abs" data-k="ti_${it.k}" style="left:0;top:0;width:${WIN.w - 2 * TERM.x}px">
      ${it.user ? `<div class="abs" style="left:-10px;right:-10px;top:0;height:${TERM.lh}px;border-radius:4px;background:var(--ccUser)"></div>` : ""}
      ${it.lines.map((l, i) => `<div class="ln" data-k="tl_${it.k}_${i}">${l.html}</div>`).join("")}
    </div>`;
  return `
    <div class="abs term" data-k="term" style="left:0;top:0;width:${WIN.w}px;height:${WIN.h}px;background:var(--winBg)">
      <div class="abs center" style="left:0;top:0;width:${WIN.w}px;height:${TERM.bar}px;background:var(--tBar);box-shadow:inset 0 -1px 0 var(--hair);font:500 13.5px/1 Inter,sans-serif;color:var(--ccDim)" data-k="tTitle">${title}</div>
      <div class="abs mask" style="left:${TERM.x}px;top:${TERM.top}px;width:${WIN.w - 2 * TERM.x}px;height:${TERM.viewH}px">
        <div class="abs" data-k="tScroll" style="left:0;top:0;width:100%">
          <div class="abs" data-k="welcome" style="left:0;top:0;width:${54 * TERM.cw}px;height:${7 * TERM.lh}px">
            <div class="abs" data-k="wBox" style="left:0;top:${TERM.lh / 2}px;width:100%;height:${6 * TERM.lh}px;border:1.5px solid var(--cc);border-radius:9px"></div>
            <div class="ln" data-k="w1" style="top:${TERM.lh}px;left:${2 * TERM.cw}px"><span class="cc" data-k="wStar" style="display:inline-block;width:9px"></span> Welcome to <span class="b">Claude Code</span>!</div>
            <div class="ln dim" data-k="w2" style="top:${3 * TERM.lh}px;left:${4 * TERM.cw}px">/help for help, /status for your current setup</div>
            <div class="ln dim" data-k="w3" style="top:${5 * TERM.lh}px;left:${4 * TERM.cw}px">cwd: ~/Developer/Rolyn</div>
          </div>
          ${items.map(item).join("")}
          <div class="ln" data-k="spin" style="top:0"><span data-k="spinStar" class="cc" style="display:inline-block;width:9px"></span> <span data-k="spinWord" class="cc"></span> <span class="dim" data-k="spinInfo"></span></div>
          <div class="ln dim" data-k="worked" style="top:0"></div>
          <div class="abs" data-k="inBox" style="left:0;top:0;width:100%;height:${2 * TERM.lh}px;border:1.5px solid var(--ccBorder);border-radius:7px">
            <div class="ln" data-k="inText" style="left:${TERM.cw}px;top:10px"></div>
            <i class="abs" data-k="caretT" style="top:12px;width:${TERM.cw}px;height:19px;border-radius:1.5px;background:var(--accent)"></i>
          </div>
          <div class="ln faint" data-k="foot" style="top:0;left:${2 * TERM.cw}px">? for shortcuts</div>
          <div class="abs" data-k="menu" style="left:0;top:0;width:100%"></div>
          <div class="abs" data-k="ask" style="left:0;top:0;width:100%"></div>
        </div>
      </div>
    </div>`;
}

const STARS = [[0, 0, 0], [4, 4.2, 1.5], [8, 4.6, 1.4], [6, 5, 2.1], [8, 5.2, 2.3], [8, 5.6, 2.9]].map(([n, len, w]) => {
  const arms = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2, x = 9 + Math.cos(a) * len, y = 11.5 + Math.sin(a) * len;
    return `<line x1="9" y1="11.5" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/>`;
  }).join("");
  return `<svg width="18" height="23" viewBox="0 0 18 23" style="display:inline-block;vertical-align:top;margin-left:-4.5px">${n ? arms : '<circle cx="9" cy="11.5" r="1.6" fill="currentColor"/>'}</svg>`;
});
const starFrame = (t) => { const n = Math.floor(t * 8) % 10; return n < 6 ? n : 10 - n; };
const starAt = (t) => STARS[starFrame(t)];
const clock = (s) => (s < 60 ? `${Math.floor(s)}s` : s < 3600 ? `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s` : `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`);
const kTok = (n) => (n < 1000 ? `${Math.round(n)}` : `${(n / 1000).toFixed(1)}k`);
function shimmer(word, t) {
  const at = ((t / 1.6) % 1) * (word.length + 8) - 4;
  return [...word].map((ch, i) => `<span style="color:${Math.abs(i - at) < 2 ? "#F4B9A2" : "var(--cc)"}">${ch}</span>`).join("");
}

function layoutTerm(t, items, ui) {
  const L = TERM.lh, grow = (at) => prog(t, at, 0.16, E.snappy);
  let y = ui.welcome <= t ? 7 * L * grow(ui.welcome) : 0;
  const at = {};
  for (const it of items) {
    if (t < it.at) continue;
    const g = it.instant ? () => 1 : grow;
    y += L * g(it.at);
    at[it.k] = y;
    for (const l of it.lines) if (t >= l.at) y += L * g(l.at);
  }
  const spinOn = ui.spin && t >= ui.spin.from && t < ui.spin.to;
  if (spinOn) { y += L * grow(ui.spin.from); at.spin = y; y += L * grow(ui.spin.from); }
  const workedOn = ui.worked && t >= ui.worked.at;
  if (workedOn) { y += L * grow(ui.worked.at); at.worked = y; y += L * grow(ui.worked.at); }
  y += L * 0.5;
  at.input = y;
  y += Math.max(2 * L, ui.askH ? ui.askH(t) : 0) + L * 0.5;
  at.foot = y;
  y += ui.menuH ? ui.menuH(t) : L;
  const scroll = Math.max(0, y - TERM.viewH);
  return { at, end: y, scroll, spinOn, workedOn };
}

function applyTerm(t, items, ui) {
  const lay = layoutTerm(t, items, ui);
  setT($.tScroll, `translateY(${(-lay.scroll).toFixed(2)}px)`);
  const wg = prog(t, ui.welcome, 0.5, E.out);
  show($.welcome, t >= ui.welcome);
  $.wBox.style.clipPath = `inset(0 ${((1 - prog(t, ui.welcome, 0.45, E.smooth)) * 100).toFixed(2)}% 0 0 round 9px)`;
  [$.w1, $.w2, $.w3].forEach((el, i) => { const p = prog(t, ui.welcome + 0.2 + i * 0.08, 0.3, E.out); el.style.opacity = p.toFixed(3); setT(el, `translateY(${((1 - p) * 8).toFixed(2)}px)`); });
  if ($.wStar._v !== 4) { $.wStar.innerHTML = STARS[4]; $.wStar._v = 4; }

  for (const it of items) {
    const el = $["ti_" + it.k];
    const on = t >= it.at;
    show(el, on);
    if (!on) continue;
    setT(el, `translateY(${lay.at[it.k].toFixed(2)}px)`);
    let y = 0;
    it.lines.forEach((l, i) => {
      const ln = $[`tl_${it.k}_${i}`];
      const lon = t >= l.at;
      show(ln, lon);
      if (!lon) return;
      const p = it.instant ? 1 : prog(t, l.at, 0.2, E.out);
      ln.style.top = y + "px";
      ln.style.opacity = Math.min(1, p * 1.6).toFixed(3);
      setT(ln, `translateY(${((1 - p) * 5).toFixed(2)}px)`);
      y += TERM.lh * (it.instant ? 1 : prog(t, l.at, 0.16, E.snappy));
    });
    if (it.bullet) {
      const b = $[`tl_${it.k}_0`].firstElementChild;
      const running = t < it.bullet.done;
      b.style.color = running ? "var(--ccFaint)" : it.bullet.color;
      b.style.opacity = running ? (Math.floor((t - it.at) / 0.25) % 2 ? "0.35" : "1") : "1";
    }
  }

  show($.spin, lay.spinOn);
  if (lay.spinOn) {
    const s = ui.spin, e = t - s.from;
    $.spin.style.top = lay.at.spin + "px";
    const sf = starFrame(t); if ($.spinStar._v !== sf) { $.spinStar.innerHTML = STARS[sf]; $.spinStar._v = sf; }
    $.spinWord.innerHTML = shimmer(s.word(t), t);
    const [secs, toks] = s.count(t);
    $.spinInfo.textContent = `(${clock(secs)} · ↓ ${kTok(toks)} tokens · esc to interrupt)`;
    $.spin.style.opacity = prog(t, s.from, 0.2).toFixed(3);
    void e;
  }
  show($.worked, lay.workedOn);
  if (lay.workedOn) {
    $.worked.style.top = lay.at.worked + "px";
    $.worked.innerHTML = `<span class="cc" style="display:inline-block;width:9px">${STARS[4]}</span> ${ui.worked.text}`;
    $.worked.style.opacity = prog(t, ui.worked.at, 0.25).toFixed(3);
  }

  const inOn = t >= ui.input.at;
  show($.inBox, inOn);
  show($.foot, inOn && !(ui.menuOn && ui.menuOn(t)));
  if (inOn) {
    $.inBox.style.top = lay.at.input + "px";
    $.foot.style.top = lay.at.foot + "px";
    $.inBox.style.clipPath = `inset(0 ${((1 - prog(t, ui.input.at, 0.4, E.smooth)) * 100).toFixed(2)}% 0 0 round 7px)`;
    const bash = !!(ui.input.bash && ui.input.bash(t));
    const text = (bash ? '<span style="color:var(--ccBash)">!</span> ' : '<span class="dim">&gt;</span> ') + ui.input.text(t);
    $.inBox.style.borderColor = bash ? "var(--ccBash)" : "";
    if ($.inText._v !== text) { $.inText.innerHTML = text; $.inText._v = text; }
    const cols = 2 + ui.input.cols(t);
    $.caretT.style.left = (TERM.cw + cols * TERM.cw) + "px";
    const typingNow = ui.input.typing(t);
    const blink = typingNow || (((t / FILM.P) % 1) < 0.6);
    $.caretT.style.opacity = (blink ? 1 : 0).toFixed(3);
    show($.caretT, ui.input.caret(t));
  }
  return lay;
}
