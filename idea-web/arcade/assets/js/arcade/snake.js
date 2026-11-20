/* arcade — snake */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "snake",
    name: "뱀",
    origin: "Snake (1976) · 먹고 길어지기",
    genre: "아케이드",
    controls: "방향키 · WASD · 화면 버튼",
    mount(root, api) {
      const size = 20;
      const cell = 22;
      const canvas = UI.el("canvas", { width: size * cell, height: size * cell, "aria-label": "뱀 게임" });
      const ctx = canvas.getContext("2d");
      const pad = UI.el(
        "div",
        { class: "pad", "aria-label": "방향 버튼" },
        UI.el("button", { type: "button", text: "↑", "aria-label": "위", onclick: () => turn(0, -1) }),
        UI.el("button", { type: "button", text: "←", "aria-label": "왼쪽", onclick: () => turn(-1, 0) }),
        UI.el("button", { type: "button", text: "→", "aria-label": "오른쪽", onclick: () => turn(1, 0) }),
        UI.el("button", { type: "button", text: "↓", "aria-label": "아래", onclick: () => turn(0, 1) })
      );
      root.append(UI.el("div", { class: "game" }, canvas, pad));

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const soft = css("--line-strong");
      const signal = css("--signal");

      let snake = [];
      let dir = { x: 1, y: 0 };
      let nextDir = { x: 1, y: 0 };
      let food = { x: 0, y: 0 };
      let score = 0;
      let alive = true;
      let started = false;
      let step = 0.13;
      let acc = 0;
      let last = 0;
      let raf = 0;

      function spawnFood() {
        const open = [];
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            if (!snake.some((part) => part.x === x && part.y === y)) open.push({ x, y });
          }
        }
        food = open[Math.floor(Math.random() * open.length)] || { x: 0, y: 0 };
      }

      function reset() {
        snake = [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
          { x: 6, y: 10 },
        ];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        alive = true;
        started = false;
        step = 0.13;
        acc = 0;
        spawnFood();
        api.score(score);
      }

      function turn(x, y) {
        if (!alive) return;
        if (dir.x === -x && dir.y === -y) return;
        started = true;
        nextDir = { x, y };
      }

      function die() {
        if (!alive) return;
        alive = false;
        api.tone(200, 0.3, "sawtooth", 0.04, 70);
        api.finish(score, "게임 오버", `길이 ${snake.length} · 점수 ${score.toLocaleString("ko-KR")}`);
      }

      function tick() {
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (
          head.x < 0 ||
          head.y < 0 ||
          head.x >= size ||
          head.y >= size ||
          snake.some((part) => part.x === head.x && part.y === head.y)
        ) {
          die();
          return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          api.score(score);
          api.tone(660, 0.06, "square", 0.03);
          if (snake.length % 5 === 0) step = Math.max(0.07, step - 0.008);
          spawnFood();
        } else {
          snake.pop();
        }
      }

      function draw() {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(23,20,14,.08)";
        ctx.lineWidth = 1;
        for (let i = 1; i < size; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * cell + 0.5, 0);
          ctx.lineTo(i * cell + 0.5, canvas.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cell + 0.5);
          ctx.lineTo(canvas.width, i * cell + 0.5);
          ctx.stroke();
        }

        // food
        ctx.strokeStyle = signal;
        ctx.fillStyle = paper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = signal;
        ctx.beginPath();
        ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();

        snake.forEach((part, index) => {
          ctx.fillStyle = index === 0 ? ink : soft;
          ctx.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4);
          if (index === 0) {
            ctx.fillStyle = paper;
            const ex = part.x * cell + cell / 2 + dir.x * 4;
            const ey = part.y * cell + cell / 2 + dir.y * 4;
            ctx.beginPath();
            ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        if (!started) {
          ctx.fillStyle = "rgba(250,246,236,.82)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = ink;
          ctx.font = "500 15px 'IBM Plex Sans KR', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("방향키로 시작", canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = "500 10px 'IBM Plex Mono', monospace";
          ctx.fillStyle = "rgba(23,20,14,.55)";
          ctx.fillText("WASD · 화면 버튼", canvas.width / 2, canvas.height / 2 + 16);
        }
      }

      function frame(now) {
        if (!alive) return;
        if (!started) {
          draw();
          raf = requestAnimationFrame(frame);
          return;
        }
        if (!last) last = now;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        acc += dt;
        while (acc >= step) {
          acc -= step;
          tick();
          if (!alive) return;
        }
        draw();
        raf = requestAnimationFrame(frame);
      }

      const keyMap = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
        W: [0, -1],
        S: [0, 1],
        A: [-1, 0],
        D: [1, 0],
      };
      const onKey = (event) => {
        const move = keyMap[event.key];
        if (!move) return;
        event.preventDefault();
        turn(move[0], move[1]);
      };
      window.addEventListener("keydown", onKey);

      reset();
      draw();
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
      };
    },
  });
})();
