(function () {
  const S = window.SCENES;
  const { FILM } = window.CORE;
  const params = new URLSearchParams(location.search);
  const RENDER = params.has("render");
  const stage = document.getElementById("stage");

  async function decodeImages() {
    const imgs = [...document.images];
    await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
  }

  const ready = (async () => {
    await document.fonts.load('700 188px Manrope');
    await document.fonts.load('600 16px Manrope');
    await document.fonts.load('500 16px Manrope');
    await document.fonts.load('400 16px Manrope');
    await document.fonts.ready;
    S.build(stage);
    S.buildTaps();
    await decodeImages();
  })();

  window.seek = async function seek(t) {
    await ready;
    const time = Math.min(Math.max(0, t), FILM.DURATION);
    S.apply(time);
    return time;
  };
  window.FILM_INFO = { ...FILM, frames: Math.round(FILM.DURATION * FILM.FPS) };

  if (RENDER) {
    document.documentElement.classList.add("render");
    if (params.has("t")) seek(Number(params.get("t")));
    return;
  }

  const ui = document.getElementById("player");
  const audio = document.getElementById("music");
  const scrub = document.getElementById("scrub");
  const playBtn = document.getElementById("play");
  const time = document.getElementById("time");
  scrub.max = String(FILM.DURATION);
  let playing = false;

  function fit() {
    const pad = 96;
    const s = Math.min((innerWidth - 32) / 1440, (innerHeight - pad) / 1440);
    stage.style.transform = `scale(${s})`;
    stage.parentElement.style.width = 1440 * s + "px";
    stage.parentElement.style.height = 1440 * s + "px";
  }
  addEventListener("resize", fit);
  fit();

  function show(t) {
    seek(t);
    scrub.value = String(t);
    const beat = Math.floor(t / FILM.P) + 1;
    time.textContent = `${t.toFixed(2)} s · beat ${Math.min(beat, FILM.BEATS)}`;
  }

  const hasMusic = () => audio.readyState > 0 && !audio.error;
  let clock = 0, last;
  function loop(now) {
    if (!playing) return;
    const t = hasMusic() ? audio.currentTime : (clock = (clock + (now - (last ?? now)) / 1000) % FILM.DURATION);
    last = now;
    show(t);
    requestAnimationFrame(loop);
  }

  playBtn.addEventListener("click", async () => {
    await ready;
    playing = !playing;
    playBtn.textContent = playing ? "Pause" : "Play";
    last = undefined;
    if (playing) { if (hasMusic()) await audio.play().catch(() => {}); requestAnimationFrame(loop); } else if (hasMusic()) audio.pause();
  });
  scrub.addEventListener("input", () => {
    clock = Number(scrub.value);
    if (hasMusic()) audio.currentTime = clock;
    if (!playing) show(clock);
  });
  audio.addEventListener("ended", () => { audio.currentTime = 0; if (playing) audio.play(); });

  const start = Number(params.get("t") || 0);
  ready.then(() => { clock = start; if (hasMusic()) audio.currentTime = start; show(start); });
  ui.hidden = false;
})();
