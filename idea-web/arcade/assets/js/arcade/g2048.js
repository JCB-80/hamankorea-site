/* arcade — 2048 */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "g2048",
    name: "2048",
    origin: "2048 (2014) · 숫자 합치기",
    genre: "퍼즐",
    best: "high",
    controls: "방향키 · WASD · 보드를 스와이프",
    mount(root, api) {
      let board = [];
      let score = 0;
      let won = false;
      let dead = false;
      const size = 4;

      const wrap = UI.el("div", { class: "g2048" });
      const head = UI.el(
        "div",
        { class: "g2048-head" },
        UI.el("strong", { text: "4 × 4" }),
        UI.el("span", { class: "mono", text: "같은 숫자를 합쳐 2048" })
      );
      const boardEl = UI.el("div", {
        class: "g2048-board",
        role: "grid",
        "aria-label": "2048 보드",
        tabindex: "0",
      });
      wrap.append(head, boardEl);
      root.append(wrap);

      const cells = [];
      for (let i = 0; i < size * size; i += 1) {
        const cell = UI.el("div", { class: "g2048-cell", role: "gridcell" });
        cells.push(cell);
        boardEl.append(cell);
      }

      const emptyBoard = () => Array.from({ length: size * size }, () => 0);

      function addTile() {
        const empty = board.map((value, index) => (value === 0 ? index : -1)).filter((i) => i >= 0);
        if (!empty.length) return;
        const index = empty[Math.floor(Math.random() * empty.length)];
        board[index] = Math.random() < 0.9 ? 2 : 4;
      }

      function render() {
        board.forEach((value, index) => {
          const cell = cells[index];
          cell.textContent = value ? String(value) : "";
          if (value) cell.dataset.v = String(value);
          else delete cell.dataset.v;
        });
        api.score(score);
      }

      function slideLine(line) {
        const values = line.filter((value) => value !== 0);
        const out = [];
        for (let i = 0; i < values.length; i += 1) {
          if (values[i] === values[i + 1]) {
            const merged = values[i] * 2;
            out.push(merged);
            score += merged;
            if (merged === 2048) won = true;
            i += 1;
          } else {
            out.push(values[i]);
          }
        }
        while (out.length < size) out.push(0);
        return out;
      }

      const getLine = (index, dir) => {
        if (dir === "left" || dir === "right") {
          return board.slice(index * size, index * size + size);
        }
        return Array.from({ length: size }, (_, row) => board[row * size + index]);
      };

      const setLine = (index, dir, line) => {
        if (dir === "left" || dir === "right") {
          line.forEach((value, i) => {
            board[index * size + i] = value;
          });
        } else {
          line.forEach((value, i) => {
            board[i * size + index] = value;
          });
        }
      };

      function move(dir) {
        if (dead) return;
        const before = board.slice();
        for (let i = 0; i < size; i += 1) {
          let line = getLine(i, dir);
          if (dir === "right" || dir === "down") line = line.slice().reverse();
          line = slideLine(line);
          if (dir === "right" || dir === "down") line.reverse();
          setLine(i, dir, line);
        }
        if (before.some((value, index) => value !== board[index])) {
          addTile();
          api.tone(300, 0.04, "square", 0.025);
          render();
          checkState();
        }
      }

      function canMove() {
        if (board.some((value) => value === 0)) return true;
        for (let row = 0; row < size; row += 1) {
          for (let col = 0; col < size; col += 1) {
            const value = board[row * size + col];
            if (col + 1 < size && board[row * size + col + 1] === value) return true;
            if (row + 1 < size && board[(row + 1) * size + col] === value) return true;
          }
        }
        return false;
      }

      function checkState() {
        if (won) {
          dead = true;
          api.tone(880, 0.12, "square", 0.04);
          api.tone(1320, 0.16, "square", 0.035);
          api.finish(score, "2048 달성!", `점수 ${score.toLocaleString("ko-KR")} · 여기서 멈춥니다.`);
          return;
        }
        if (!canMove()) {
          dead = true;
          api.finish(score, "더 움직일 수 없습니다", `점수 ${score.toLocaleString("ko-KR")}`);
        }
      }

      function reset() {
        board = emptyBoard();
        score = 0;
        won = false;
        dead = false;
        addTile();
        addTile();
        render();
      }

      const keys = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
        a: "left",
        d: "right",
        w: "up",
        s: "down",
        A: "left",
        D: "right",
        W: "up",
        S: "down",
      };

      const onKey = (event) => {
        const dir = keys[event.key];
        if (!dir) return;
        event.preventDefault();
        move(dir);
      };
      window.addEventListener("keydown", onKey);

      let swipe = null;
      const onDown = (event) => {
        swipe = { x: event.clientX, y: event.clientY };
        boardEl.setPointerCapture(event.pointerId);
      };
      const onUp = (event) => {
        if (!swipe) return;
        const dx = event.clientX - swipe.x;
        const dy = event.clientY - swipe.y;
        swipe = null;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
        else move(dy > 0 ? "down" : "up");
      };
      boardEl.addEventListener("pointerdown", onDown);
      boardEl.addEventListener("pointerup", onUp);
      boardEl.addEventListener("pointercancel", () => {
        swipe = null;
      });

      reset();

      return () => {
        window.removeEventListener("keydown", onKey);
        boardEl.removeEventListener("pointerdown", onDown);
        boardEl.removeEventListener("pointerup", onUp);
      };
    },
  });
})();
