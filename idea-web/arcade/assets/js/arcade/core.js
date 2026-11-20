/* arcade core — game list, stage, scores, sound */
(function () {
  "use strict";

  const UI = window.UI;
  const games = [];
  const grid = document.getElementById("grid");
  const stage = document.getElementById("stage");
  const body = document.getElementById("stage-body");
  const stageTitle = document.getElementById("stage-title");
  const stageOrigin = document.getElementById("stage-origin");
  const stageIndex = document.getElementById("stage-index");
  const stageGenre = document.getElementById("stage-genre");
  const stageControls = document.getElementById("stage-controls");
  const stageScore = document.getElementById("stage-score");
  const stageBest = document.getElementById("stage-best");
  const hudLabel = document.getElementById("hud-label");
  const stageBack = document.getElementById("stage-back");
  const stageRestart = document.getElementById("stage-restart");
  const stageNext = document.getElementById("stage-next");
  const bonus = document.querySelector(".bonus");
  const hero = document.querySelector(".ah-hero");
  const soundBtn = document.getElementById("sound");
  const titleBase = document.title;

  let current = null;
  let cleanup = null;
  let finished = false;
  let initialized = false;
  let muted = UI.store.get("arcade.muted", false);
  let audio = null;

  const bestKey = (id) => `arcade.best.${id}`;
  const bestOf = (id) => UI.store.get(bestKey(id), 0);

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  function formatValue(game, value) {
    if (value === null || value === undefined) return "—";
    if (game.format === "time") return formatTime(value);
    return Math.round(value).toLocaleString("ko-KR");
  }

  /* sound --------------------------------------------------------------- */
  function ensureAudio() {
    if (audio) {
      if (audio.state === "suspended") audio.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      audio = new Ctx();
    } catch (err) {
      audio = null;
    }
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (muted || !audio) return;
    const start = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + (duration || 0.08));
    gain.gain.setValueAtTime(volume || 0.035, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (duration || 0.08));
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + (duration || 0.08) + 0.02);
  }

  function syncSound() {
    if (!soundBtn) return;
    soundBtn.textContent = muted ? "소리 켜기" : "소리 끄기";
    soundBtn.setAttribute("aria-pressed", muted ? "false" : "true");
  }

  function toggleMute() {
    muted = !muted;
    UI.store.set("arcade.muted", muted);
    syncSound();
    if (!muted) {
      ensureAudio();
      tone(660, 0.07, "square", 0.03);
    }
  }

  /* grid ---------------------------------------------------------------- */
  function cardFor(game, index) {
    const best = bestOf(game.id);
    return UI.el(
      "button",
      {
        class: "card",
        type: "button",
        onclick: () => openGame(game.id),
      },
      UI.el("span", { class: "card-no", text: String(index + 1).padStart(2, "0") }),
      UI.el("span", { class: "card-genre", text: game.genre }),
      UI.el("strong", { class: "card-name", text: game.name }),
      UI.el("span", { class: "card-origin", text: game.origin }),
      UI.el(
        "span",
        { class: "card-bottom" },
        UI.el("span", { text: best ? `최고 ${formatValue(game, best)}` : "기록 없음" }),
        UI.el("span", { class: "card-play", text: "플레이 →" })
      )
    );
  }

  function renderGrid() {
    grid.replaceChildren(...games.map((game, index) => cardFor(game, index)));
  }

  /* stage --------------------------------------------------------------- */
  function stopGame() {
    if (typeof cleanup === "function") {
      try {
        cleanup();
      } catch (err) {
        console.warn("cleanup", err);
      }
    }
    cleanup = null;
  }

  function updateStageBest() {
    if (!current) return;
    const best = bestOf(current.id);
    stageBest.textContent = best ? formatValue(current, best) : "—";
  }

  function openGame(id) {
    const index = games.findIndex((game) => game.id === id);
    if (index < 0) return;
    stopGame();
    current = games[index];
    finished = false;
    ensureAudio();

    body.replaceChildren();
    stageTitle.textContent = current.name;
    stageOrigin.textContent = current.origin;
    stageIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(games.length).padStart(2, "0")}`;
    stageGenre.textContent = current.genre;
    stageControls.textContent = current.controls || "";
    hudLabel.textContent = current.hudLabel || "점수";
    stageScore.textContent = "0";
    updateStageBest();

    grid.hidden = true;
    if (bonus) bonus.hidden = true;
    if (hero) hero.hidden = true;
    stage.hidden = false;
    document.title = `${current.name} · 신박랩 아케이드`;
    history.replaceState(null, "", `#${current.id}`);

    const root = UI.el("div", { class: "game" });
    body.append(root);

    const api = {
      tone,
      score(value) {
        stageScore.textContent = formatValue(current, value);
      },
      best: () => bestOf(current.id),
      finish(score, heading, note, options) {
        finishGame(score, heading, note, options);
      },
      restart: () => openGame(current.id),
      muted: () => muted,
    };

    try {
      cleanup = current.mount(root, api) || null;
    } catch (err) {
      console.error(`[arcade:${current.id}]`, err);
      body.append(
        UI.el(
          "p",
          { class: "game-note" },
          "이 게임을 시작하지 못했습니다. 콘솔을 확인하세요."
        )
      );
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function closeGame() {
    stopGame();
    current = null;
    finished = false;
    body.replaceChildren();
    stage.hidden = true;
    grid.hidden = false;
    if (bonus) bonus.hidden = false;
    if (hero) hero.hidden = false;
    document.title = titleBase;
    history.replaceState(null, "", location.pathname);
    renderGrid();
  }

  function nextGame() {
    if (!current) {
      if (games[0]) openGame(games[0].id);
      return;
    }
    const index = games.findIndex((game) => game.id === current.id);
    openGame(games[(index + 1) % games.length].id);
  }

  function finishGame(score, heading, note, options) {
    if (finished || !current) return;
    finished = true;
    const game = current;
    const prev = bestOf(game.id);
    const numeric = Number(score) || 0;
    const record = !options || options.record !== false;
    const better = record && numeric > 0 && (!prev || (game.lower ? numeric < prev : numeric > prev));
    if (better) UI.store.set(bestKey(game.id), numeric);

    if (stageScore) stageScore.textContent = formatValue(game, numeric);
    updateStageBest();
    stopGame();

    const over = UI.el(
      "div",
      { class: "over", role: "dialog", "aria-label": `${heading || "게임 결과"}` },
      UI.el("span", { class: "over-kicker", text: better ? "NEW RECORD" : "RESULT" }),
      UI.el("strong", { text: heading || "게임 오버" }),
      UI.el("p", {
        text:
          note ||
          (game.format === "time"
            ? `기록 ${formatTime(numeric)}`
            : `점수 ${numeric.toLocaleString("ko-KR")}`),
      }),
      UI.el(
        "div",
        { class: "over-actions" },
        UI.el("button", { type: "button", text: "다시 시작", onclick: () => openGame(game.id) }),
        UI.el("button", { type: "button", text: "다음 게임", onclick: nextGame }),
        UI.el("button", {
          class: "ghost",
          type: "button",
          text: "목록",
          onclick: closeGame,
        })
      )
    );
    body.append(over);
    const button = over.querySelector("button");
    if (button) window.setTimeout(() => button.focus({ preventScroll: true }), 50);
    renderGrid();
  }

  /* init ---------------------------------------------------------------- */
  window.ARCADE = {
    add(game) {
      if (!game || !game.id || !game.mount) return;
      games.push(game);
      if (initialized) renderGrid();
    },
  };

  stageBack.addEventListener("click", closeGame);
  stageRestart.addEventListener("click", () => {
    if (current) openGame(current.id);
  });
  stageNext.addEventListener("click", nextGame);
  soundBtn.addEventListener("click", toggleMute);

  window.addEventListener("load", () => {
    initialized = true;
    renderGrid();
    syncSound();
    const id = location.hash.replace("#", "");
    if (id && games.some((game) => game.id === id)) openGame(id);
  });
})();
