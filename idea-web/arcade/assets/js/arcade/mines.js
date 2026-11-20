/* arcade — minesweeper */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "mines",
    name: "지뢰찾기",
    origin: "Minesweeper (1989) · 지뢰 피하기",
    genre: "퍼즐",
    format: "time",
    lower: true,
    hudLabel: "시간",
    controls: "클릭 열기 · 우클릭 깃발 · 모바일은 깃발 모드",
    mount(root, api) {
      const SIZE = 9;
      const MINES = 10;
      let cells = [];
      let started = false;
      let dead = false;
      let won = false;
      let flags = 0;
      let seconds = 0;
      let timer = 0;
      let flagMode = false;

      const wrap = UI.el("div", { class: "mines" });
      const bar = UI.el(
        "div",
        { class: "mines-bar" },
        UI.el("span", { text: `9 × 9 · 지뢰 ${MINES}` }),
        UI.el("button", {
          class: "mines-mode",
          type: "button",
          text: "깃발 모드 꺼짐",
          "aria-pressed": "false",
          onclick: (event) => {
            flagMode = !flagMode;
            event.currentTarget.textContent = `깃발 모드 ${flagMode ? "켜짐" : "꺼짐"}`;
            event.currentTarget.setAttribute("aria-pressed", flagMode ? "true" : "false");
          },
        })
      );
      const grid = UI.el("div", {
        class: "mines-grid",
        role: "grid",
        "aria-label": "지뢰찾기 보드",
      });
      wrap.append(bar, grid);
      root.append(wrap);

      const cellEls = [];
      for (let i = 0; i < SIZE * SIZE; i += 1) {
        const button = UI.el("button", {
          class: "mines-cell",
          type: "button",
          role: "gridcell",
          "aria-label": "닫힌 칸",
          onclick: () => onReveal(i),
          oncontextmenu: (event) => {
            event.preventDefault();
            toggleFlag(i);
          },
        });
        cellEls.push(button);
        grid.append(button);
      }

      const idx = (x, y) => y * SIZE + x;
      const inBounds = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;

      function formatTime(value) {
        return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
      }

      function neighbors(index) {
        const x = index % SIZE;
        const y = Math.floor(index / SIZE);
        const out = [];
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue;
            if (inBounds(x + dx, y + dy)) out.push(idx(x + dx, y + dy));
          }
        }
        return out;
      }

      function placeMines(safe) {
        const safeSet = new Set([safe, ...neighbors(safe)]);
        const pool = [];
        for (let i = 0; i < SIZE * SIZE; i += 1) if (!safeSet.has(i)) pool.push(i);
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        pool.slice(0, MINES).forEach((index) => {
          cells[index].mine = true;
        });
        cells.forEach((cell, index) => {
          if (cell.mine) return;
          cell.count = neighbors(index).filter((n) => cells[n].mine).length;
        });
      }

      function startTimer() {
        if (started) return;
        started = true;
        timer = window.setInterval(() => {
          seconds += 1;
          api.score(seconds);
        }, 1000);
      }

      function stopTimer() {
        if (timer) window.clearInterval(timer);
        timer = 0;
      }

      function paint(index) {
        const cell = cells[index];
        const el = cellEls[index];
        el.className = "mines-cell";
        el.textContent = "";
        el.disabled = false;
        if (cell.open) {
          el.classList.add("is-open");
          el.disabled = true;
          if (cell.mine) {
            el.classList.add("is-mine");
            el.textContent = "✕";
          } else if (cell.count > 0) {
            el.dataset.n = String(cell.count);
            el.textContent = String(cell.count);
          }
        } else if (cell.flag) {
          el.classList.add("is-flag");
          el.textContent = "⚑";
        }
        el.setAttribute(
          "aria-label",
          cell.open ? `열린 칸 ${cell.count || ""}` : cell.flag ? "깃발" : "닫힌 칸"
        );
      }

      function openCell(index) {
        const cell = cells[index];
        if (cell.open || cell.flag || dead || won) return;
        if (!started) {
          placeMines(index);
          startTimer();
        }
        cell.open = true;
        if (cell.mine) {
          dead = true;
          stopTimer();
          cells.forEach((item, i) => {
            if (item.mine) item.open = true;
            paint(i);
          });
          api.tone(160, 0.3, "sawtooth", 0.045, 70);
          api.finish(seconds, "지뢰를 밟았습니다", `시간 ${formatTime(seconds)}`, { record: false });
          return;
        }
        if (cell.count === 0) {
          neighbors(index).forEach((n) => {
            if (!cells[n].open && !cells[n].flag) openCell(n);
          });
        }
        paint(index);
        checkWin();
      }

      function onReveal(index) {
        if (dead || won) return;
        if (flagMode && !cells[index].open) {
          toggleFlag(index);
          return;
        }
        openCell(index);
      }

      function toggleFlag(index) {
        if (dead || won || cells[index].open) return;
        const cell = cells[index];
        cell.flag = !cell.flag;
        flags += cell.flag ? 1 : -1;
        paint(index);
        api.tone(cell.flag ? 520 : 320, 0.04, "square", 0.02);
      }

      function checkWin() {
        const openSafe = cells.filter((cell) => cell.open && !cell.mine).length;
        if (openSafe !== SIZE * SIZE - MINES) return;
        won = true;
        stopTimer();
        api.tone(880, 0.1, "square", 0.04);
        api.finish(seconds, "클리어!", `시간 ${formatTime(seconds)}`);
      }

      cells = Array.from({ length: SIZE * SIZE }, () => ({
        mine: false,
        open: false,
        flag: false,
        count: 0,
      }));

      api.score(0);

      return () => stopTimer();
    },
  });
})();
