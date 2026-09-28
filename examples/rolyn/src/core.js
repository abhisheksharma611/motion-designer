const FILM = {
  W: 1440,
  H: 1440,
  FPS: 60,
  BPM: 128.995,
  BEATS: 100,
  DURATION: 2791 / 60,
};
FILM.P = 60 / FILM.BPM;
const B = (n) => (n - 1) * FILM.P;

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, p) => a + (b - a) * p;

function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 24 && Math.abs(sx(t) - x) > 1e-6; i++) {
      if (sx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

const E = {
  linear: (x) => x,
  inOut: cubicBezier(0.65, 0, 0.35, 1),
  smooth: cubicBezier(0.45, 0, 0.2, 1),
  out: cubicBezier(0.16, 1, 0.3, 1),
  outSoft: cubicBezier(0.25, 1, 0.5, 1),
  in: cubicBezier(0.55, 0, 0.85, 0.35),
  snappy: cubicBezier(0.2, 0.9, 0.3, 1),
};

const prog = (t, t0, dur, ease = E.inOut) => ease(clamp((t - t0) / dur));

function spring(t, t0, response = 0.32, damping = 0.86) {
  if (t <= t0) return 0;
  const dt = t - t0;
  const w0 = (2 * Math.PI) / response;
  if (damping < 1) {
    const wd = w0 * Math.sqrt(1 - damping * damping);
    const e = Math.exp(-damping * w0 * dt);
    return 1 - e * (Math.cos(wd * dt) + ((damping * w0) / wd) * Math.sin(wd * dt));
  }
  return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
}

function track(t, base, keys) {
  let v = base, prevTo = base;
  for (const k of keys) {
    const f = k.spring ? spring(t, k.t, k.spring[0], k.spring[1]) : prog(t, k.t, k.d, k.e || E.inOut);
    v += (k.to - prevTo) * f;
    prevTo = k.to;
  }
  return v;
}

function press(t, t0, depth = 0.94) {
  if (t < t0) return 1;
  const down = prog(t, t0, 0.07, E.out);
  const up = spring(t, t0 + 0.1, 0.3, 0.7);
  return 1 - (1 - depth) * (down - up);
}

function pulse(t, t0, dur = 0.35) {
  if (t < t0 || t > t0 + dur) return 0;
  return Math.sin((Math.PI * (t - t0)) / dur);
}

function usd(minor, sign = false) {
  const neg = minor < 0;
  const body = (Math.abs(minor) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? "-" : sign && minor > 0 ? "+" : "") + "$" + body;
}

const TODAY = "2026-09-27";
const ADDED = [
  { d: TODAY, k: "expense", a: 1499, c: "Clothing", p: "Shopping", m: "H&M", w: "Main card", to: "" },
  { d: TODAY, k: "expense", a: 6430, c: "Groceries", p: "Food", m: "Lidl", w: "Main card", to: "" },
];
const TX = window.TX.filter((t) => !(t.d === TODAY && t.c === "Groceries" && t.a === 6430)).concat(ADDED);
const dayOf = (s) => new Date(s + "T12:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

function sumTx(kind, start, end, pred = () => true) {
  let s = 0;
  for (const t of TX) if (t.k === kind && t.d >= start && t.d <= end && pred(t)) s += t.a;
  return s;
}

const BALANCE_NOW = { "Main card": 560121, Savings: 680000 };

function netOn(day, account, added) {
  let n = 0;
  for (const t of TX) {
    if (t.d !== day) continue;
    if (ADDED.indexOf(t) >= added) continue;
    const mine = account === "All" || t.w === account;
    if (t.k === "income" && mine) n += t.a;
    else if (t.k === "expense" && mine) n -= t.a;
    else if (t.k === "transfer" && account !== "All") {
      if (t.w === account) n -= t.a;
      if (t.to === account) n += t.a;
    }
  }
  return n;
}

function balanceSeries(account, added) {
  const now =
    account === "All" ? BALANCE_NOW["Main card"] + BALANCE_NOW.Savings : BALANCE_NOW[account];
  let running = now + ADDED.slice(added).filter((t) => account === "All" || t.w === account).reduce((s, t) => s + t.a, 0);
  const pts = [];
  let d = dayOf(TODAY);
  for (let i = 0; i < 30; i++) {
    pts.push({ day: iso(d), v: running });
    running -= netOn(iso(d), account, added);
    d = addDays(d, -1);
  }
  return pts.reverse();
}

function weekBuckets(start, end) {
  let d = dayOf(start);
  d = addDays(d, -d.getUTCDay());
  const out = [];
  while (iso(d) <= end) {
    const ws = iso(d), we = iso(addDays(d, 6));
    const lo = ws < start ? start : ws, hi = we > end ? end : we;
    out.push({ start: ws, exp: sumTx("expense", lo, hi), inc: sumTx("income", lo, hi) });
    d = addDays(d, 7);
  }
  return out;
}

function dayBuckets(start, end) {
  const out = [];
  for (let d = dayOf(start); iso(d) <= end; d = addDays(d, 1)) {
    const s = iso(d);
    out.push({ start: s, exp: sumTx("expense", s, s), inc: sumTx("income", s, s) });
  }
  return out;
}

const PERIODS = {
  sixMonths: { cur: ["2026-04-01", "2026-09-30"], prev: ["2025-10-01", "2026-03-31"], gran: "week" },
  thisMonth: { cur: ["2026-09-01", "2026-09-30"], prev: ["2026-08-01", "2026-08-31"], gran: "day" },
};

const CATS = {
  Bills: { icon: "doc.text.fill", color: "#6B6BE0" },
  Food: { icon: "fork.knife", color: "#FFC432" },
  Transport: { icon: "tram.fill", color: "#1D6FE8" },
  Shopping: { icon: "bag.fill", color: "#E0559B" },
  Entertainment: { icon: "gamecontroller.fill", color: "#A463D8" },
  Health: { icon: "cross.case.fill", color: "#D9534F" },
};

function periodStats(key) {
  const p = PERIODS[key];
  const bucket = p.gran === "week" ? weekBuckets : dayBuckets;
  const bars = bucket(...p.cur), prevBars = bucket(...p.prev);
  const exp = sumTx("expense", ...p.cur), inc = sumTx("income", ...p.cur);
  const pexp = sumTx("expense", ...p.prev), pinc = sumTx("income", ...p.prev);
  const max = Math.max(1, ...bars.map((b) => Math.max(b.exp, b.inc)));
  const cats = Object.keys(CATS).map((c) => {
    const a = sumTx("expense", ...p.cur, (t) => t.p === c);
    const b = sumTx("expense", ...p.prev, (t) => t.p === c);
    return { name: c, amount: a, delta: a - b, share: a / exp };
  }).sort((x, y) => y.amount - x.amount);
  return { key, p, bars, prevBars, exp, inc, pexp, pinc, net: inc - exp, pnet: pinc - pexp, max, cats };
}

const pct = (a, b) => Math.round(((a - b) / b) * 100);
const pctText = (v) => (v > 0 ? "+" : "") + v + "%";

function foodCumulative() {
  const out = [];
  let acc = 0;
  for (let day = 1; day <= 27; day++) {
    const s = `2026-09-${String(day).padStart(2, "0")}`;
    acc += sumTx("expense", s, s, (t) => t.p === "Food");
    out.push({ day, v: acc });
  }
  return out;
}

window.CORE = {
  FILM, B, clamp, lerp, E, prog, spring, track, press, pulse, usd, sumTx, TODAY,
  balanceSeries, periodStats, CATS, pct, pctText, foodCumulative, dayOf, iso, addDays,
};
