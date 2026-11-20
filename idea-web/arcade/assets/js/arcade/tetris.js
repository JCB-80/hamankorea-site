/* arcade — tetris */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "tetris",
    name: "블록 스택",
    origin: "Tetris (1984) · 클래식 & 갤럭시",
    genre: "퍼즐",
    controls:
      "← → 이동 · ↑ 회전 · ↓ 소프트 드롭 · Space 즉시 낙하 · P 일시정지 · 모드에서 갤럭시 선택",
    mount(root, api) {
      const COLS = 10;
      const ROWS = 20;
      const CELL = 30;
      const canvas = UI.el("canvas", { width: COLS * CELL, height: ROWS * CELL, "aria-label": "블록 스택 게임" });
      const ctx = canvas.getContext("2d");
      const nextCanvas = UI.el("canvas", { width: 90, height: 90, "aria-label": "다음 조각" });
      const nctx = nextCanvas.getContext("2d");

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const soft = css("--paper-deep");

      const SHAPES = {
        I: [[1, 1, 1, 1]],
        O: [[1, 1], [1, 1]],
        T: [[0, 1, 0], [1, 1, 1]],
        S: [[0, 1, 1], [1, 1, 0]],
        Z: [[1, 1, 0], [0, 1, 1]],
        J: [[1, 0, 0], [1, 1, 1]],
        L: [[0, 0, 1], [1, 1, 1]],
      };
      const SHADES = {
        I: "#d9d1bf",
        O: "#c3b9a2",
        T: "#8e8778",
        S: "#a99e86",
        Z: "#b5aa92",
        J: "#6f6a5f",
        L: "#4b463a",
      };
      const GALAXY_SHADES = {
        I: "#f6f1e6",
        O: "#e8e1d2",
        T: "#cfc5b0",
        S: "#ddd5c5",
        Z: "#f2ede2",
        J: "#b5aa92",
        L: "#9d927c",
      };
      const KEYS = Object.keys(SHAPES);
      const stars = Array.from({ length: 46 }, (_, index) => ({
        x: (index * 73) % 300,
        y: (index * 47) % 600,
        r: 0.4 + (index % 3) * 0.35,
      }));

      let galaxy = false;
      const shadeOf = (key) => (galaxy ? GALAXY_SHADES : SHADES)[key];
      const wrapX = (x) => ((x % COLS) + COLS) % COLS;

      let board = [];
      let piece = null;
      let nextKey = KEYS[Math.floor(Math.random() * KEYS.length)];
      let score = 0;
      let lines = 0;
      let level = 1;
      let dropEvery = 0.8;
      let dropTimer = 0;
      let paused = false;
      let over = false;
      let raf = 0;
      let last = 0;

      const emptyBoard = () => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

      const rotate = (matrix) =>
        matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());

      function spawn() {
        const key = nextKey;
        nextKey = KEYS[Math.floor(Math.random() * KEYS.length)];
        piece = {
          key,
          matrix: SHAPES[key].map((row) => row.slice()),
          x: Math.floor((COLS - SHAPES[key][0].length) / 2),
          y: 0,
        };
        drawNext();
        if (collides(piece.matrix, piece.x, piece.y)) {
          over = true;
          api.finish(score, "게임 오버", `${lines}줄 · 레벨 ${level} · 점수 ${score.toLocaleString("ko-KR")}`);
        }
      }

      function collides(matrix, px, py) {
        for (let row = 0; row < matrix.length; row += 1) {
          for (let col = 0; col < matrix[row].length; col += 1) {
            if (!matrix[row][col]) continue;
            const rawX = px + col;
            const x = galaxy ? wrapX(rawX) : rawX;
            const y = py + row;
            if (!galaxy && (x < 0 || x >= COLS)) return true;
            if (y >= ROWS) return true;
            if (y >= 0 && board[y][x]) return true;
          }
        }
        return false;
      }

      function lock() {
        piece.matrix.forEach((row, r) => {
          row.forEach((value, c) => {
            if (!value) return;
            const y = piece.y + r;
            const rawX = piece.x + c;
            const x = galaxy ? wrapX(rawX) : rawX;
            if (y >= 0 && x >= 0 && x < COLS) board[y][x] = piece.key;
          });
        });
        clearLines();
        spawn();
        dropTimer = 0;
      }

      function clearLines() {
        const kept = board.filter((row) => row.some((cell) => !cell));
        const cleared = ROWS - kept.length;
        if (cleared > 0) {
          while (kept.length < ROWS) kept.unshift(Array.from({ length: COLS }, () => null));
          board = kept;
          lines += cleared;
          const points = [0, 100, 300, 500, 800][cleared] || 800;
          score += points * level;
          level = 1 + Math.floor(lines / 10);
          dropEvery = Math.max(0.09, 0.8 - (level - 1) * 0.065);
          api.score(score);
          api.tone(440 + cleared * 110, 0.09, "square", 0.035);
        }
      }

      function tryMove(dx) {
        if (over || paused) return;
        if (!collides(piece.matrix, piece.x + dx, piece.y)) piece.x += dx;
      }

      function tryRotate() {
        if (over || paused) return;
        const rotated = rotate(piece.matrix);
        for (const kick of [0, -1, 1, -2, 2]) {
          if (!collides(rotated, piece.x + kick, piece.y)) {
            piece.matrix = rotated;
            piece.x += kick;
            api.tone(520, 0.04, "square", 0.022);
            return;
          }
        }
      }

      function softDrop() {
        if (over || paused) return;
        if (!collides(piece.matrix, piece.x, piece.y + 1)) {
          piece.y += 1;
          dropTimer = 0;
          score += 1;
          api.score(score);
        } else {
          lock();
        }
      }

      function hardDrop() {
        if (over || paused) return;
        let distance = 0;
        while (!collides(piece.matrix, piece.x, piece.y + 1)) {
          piece.y += 1;
          distance += 1;
        }
        score += distance * 2;
        api.score(score);
        lock();
        api.tone(220, 0.06, "triangle", 0.035);
      }

      function drawCell(target, x, y, color, size, alpha) {
        target.globalAlpha = alpha === undefined ? 1 : alpha;
        target.fillStyle = color;
        target.fillRect(x * size, y * size, size - 1, size - 1);
        target.strokeStyle = galaxy ? "rgba(246,241,230,.28)" : "rgba(23,20,14,.35)";
        target.lineWidth = 1;
        target.strokeRect(x * size + 0.5, y * size + 0.5, size - 2, size - 2);
        target.globalAlpha = 1;
      }

      function drawNext() {
        nctx.clearRect(0, 0, 90, 90);
        nctx.fillStyle = galaxy ? "#0b0b0c" : soft;
        nctx.fillRect(0, 0, 90, 90);
        const matrix = SHAPES[nextKey];
        const size = 18;
        const offsetX = (90 - matrix[0].length * size) / 2;
        const offsetY = (90 - matrix.length * size) / 2;
        matrix.forEach((row, r) => {
          row.forEach((value, c) => {
            if (!value) return;
            nctx.fillStyle = shadeOf(nextKey);
            nctx.fillRect(offsetX + c * size, offsetY + r * size, size - 1, size - 1);
            nctx.strokeStyle = galaxy
              ? "rgba(246,241,230,.28)"
              : "rgba(23,20,14,.35)";
            nctx.strokeRect(offsetX + c * size + 0.5, offsetY + r * size + 0.5, size - 2, size - 2);
          });
        });
      }

      function draw() {
        ctx.fillStyle = galaxy ? "#0b0b0c" : paper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (galaxy) {
          stars.forEach((star) => {
            ctx.globalAlpha = 0.35 + ((star.x + star.y) % 40) / 100;
            ctx.fillStyle = "#f6f1e6";
            ctx.fillRect(star.x, star.y, star.r, star.r);
          });
          ctx.globalAlpha = 1;
        }

        ctx.strokeStyle = galaxy ? "rgba(246,241,230,.10)" : "rgba(23,20,14,.08)";
        ctx.lineWidth = 1;
        for (let c = 1; c < COLS; c += 1) {
          ctx.beginPath();
          ctx.moveTo(c * CELL + 0.5, 0);
          ctx.lineTo(c * CELL + 0.5, canvas.height);
          ctx.stroke();
        }
        for (let r = 1; r < ROWS; r += 1) {
          ctx.beginPath();
          ctx.moveTo(0, r * CELL + 0.5);
          ctx.lineTo(canvas.width, r * CELL + 0.5);
          ctx.stroke();
        }

        board.forEach((row, r) => {
          row.forEach((value, c) => {
            if (value) drawCell(ctx, c, r, shadeOf(value), CELL, 1);
          });
        });

        if (piece && !over) {
          let ghostY = piece.y;
          while (!collides(piece.matrix, piece.x, ghostY + 1)) ghostY += 1;
          piece.matrix.forEach((row, r) => {
            row.forEach((value, c) => {
              if (!value) return;
              const y = ghostY + r;
              if (y < 0) return;
              const x = galaxy ? wrapX(piece.x + c) : piece.x + c;
              ctx.fillStyle = galaxy ? "rgba(246,241,230,.13)" : "rgba(23,20,14,.10)";
              ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 5, CELL - 5);
            });
          });
          piece.matrix.forEach((row, r) => {
            row.forEach((value, c) => {
              if (!value) return;
              const y = piece.y + r;
              if (y < 0) return;
              const x = galaxy ? wrapX(piece.x + c) : piece.x + c;
              drawCell(ctx, x, y, shadeOf(piece.key), CELL, 1);
            });
          });
        }

        if (galaxy) {
          ctx.strokeStyle = "rgba(216,64,42,.55)";
          ctx.setLineDash([5, 8]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0.5, 0);
          ctx.lineTo(0.5, canvas.height);
          ctx.moveTo(canvas.width - 0.5, 0);
          ctx.lineTo(canvas.width - 0.5, canvas.height);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(246,241,230,.5)";
          ctx.font = "500 8px 'IBM Plex Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText("WRAP", canvas.width / 2, 12);
          ctx.textAlign = "left";
        }

        if (paused) {
          ctx.fillStyle = galaxy ? "rgba(11,11,12,.88)" : "rgba(250,246,236,.88)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = galaxy ? "#f6f1e6" : ink;
          ctx.font = "500 18px 'IBM Plex Sans KR', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("일시정지", canvas.width / 2, canvas.height / 2);
          ctx.font = "500 11px 'IBM Plex Mono', monospace";
          ctx.fillText("P로 계속", canvas.width / 2, canvas.height / 2 + 24);
          ctx.textAlign = "left";
        }
      }

      function frame(now) {
        if (over) return;
        if (!last) last = now;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!paused) {
          dropTimer += dt;
          if (dropTimer >= dropEvery) {
            dropTimer = 0;
            if (!collides(piece.matrix, piece.x, piece.y + 1)) piece.y += 1;
            else lock();
          }
        }
        draw();
        raf = requestAnimationFrame(frame);
      }

      function reset() {
        board = emptyBoard();
        score = 0;
        lines = 0;
        level = 1;
        dropEvery = 0.8;
        dropTimer = 0;
        paused = false;
        over = false;
        nextKey = KEYS[Math.floor(Math.random() * KEYS.length)];
        spawn();
        api.score(score);
      }

      const modeClassic = UI.el("button", {
        class: "tetris-mode-btn",
        type: "button",
        text: "클래식",
        "aria-pressed": "true",
        onclick: () => setMode(false),
      });
      const modeGalaxy = UI.el("button", {
        class: "tetris-mode-btn",
        type: "button",
        text: "갤럭시",
        "aria-pressed": "false",
        onclick: () => setMode(true),
      });
      const modeGroup = UI.el(
        "div",
        { class: "tetris-modes", role: "group", "aria-label": "테트리스 모드" },
        modeClassic,
        modeGalaxy
      );
      const modeWrap = UI.el(
        "div",
        { class: "tetris-mode-wrap" },
        UI.el("span", { class: "mono", text: "MODE" }),
        modeGroup
      );

      function setMode(value) {
        if (galaxy === value) return;
        galaxy = value;
        modeClassic.setAttribute("aria-pressed", String(!value));
        modeGalaxy.setAttribute("aria-pressed", String(value));
        reset();
        draw();
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      }
      const top = UI.el(
        "div",
        { class: "tetris-top" },
        UI.el("div", { class: "tetris-next" }, UI.el("span", { class: "mono", text: "NEXT" }), nextCanvas),
        modeWrap,
        UI.el("p", { class: "game-note", text: "줄을 지우면 점수 · 10줄마다 레벨 업" })
      );
      const pad = UI.el(
        "div",
        { class: "pad", "aria-label": "블록 조작" },
        UI.el("button", { type: "button", text: "←", "aria-label": "왼쪽", onclick: () => tryMove(-1) }),
        UI.el("button", { type: "button", text: "↻", "aria-label": "회전", onclick: tryRotate }),
        UI.el("button", { type: "button", text: "→", "aria-label": "오른쪽", onclick: () => tryMove(1) }),
        UI.el("button", { type: "button", text: "↓", "aria-label": "아래", onclick: softDrop })
      );
      const dropBtn = UI.el("button", {
        class: "btn tetris-drop",
        type: "button",
        text: "즉시 낙하",
        onclick: hardDrop,
      });
      const wrap = UI.el("div", { class: "tetris" }, top, canvas, pad, dropBtn);
      root.append(wrap);

      const onKey = (event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
          event.preventDefault();
        }
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") tryMove(-1);
        else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") tryMove(1);
        else if (event.key === "ArrowUp" || event.key === "x" || event.key === "X") tryRotate();
        else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") softDrop();
        else if (event.key === " " || event.code === "Space") hardDrop();
        else if (event.key === "p" || event.key === "P") {
          paused = !paused;
          api.tone(300, 0.05, "square", 0.02);
        }
      };
      window.addEventListener("keydown", onKey);

      reset();
      draw();
      raf = requestAnimationFrame(frame);

      return () => {
        over = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
      };
    },
  });
})();
