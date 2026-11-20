/* arcade — frogger */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "frogger",
    name: "개구리 건너기",
    origin: "Frogger (1981) · 길과 강 건너기",
    genre: "액션",
    controls: "방향키 · WASD · 화면 버튼",
    mount(root, api) {
      const W = 480;
      const H = 540;
      const CELL = 30;
      const canvas = UI.el("canvas", { width: W, height: H, "aria-label": "개구리 건너기 게임" });
      const ctx = canvas.getContext("2d");
      const pad = UI.el(
        "div",
        { class: "pad", "aria-label": "개구리 이동" },
        UI.el("button", { type: "button", text: "↑", "aria-label": "위", onclick: () => hop(0, -1) }),
        UI.el("button", { type: "button", text: "←", "aria-label": "왼쪽", onclick: () => hop(-1, 0) }),
        UI.el("button", { type: "button", text: "→", "aria-label": "오른쪽", onclick: () => hop(1, 0) }),
        UI.el("button", { type: "button", text: "↓", "aria-label": "아래", onclick: () => hop(0, 1) })
      );
      root.append(UI.el("div", { class: "game frogger" }, canvas, pad));

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const soft = css("--paper-deep");
      const line = css("--line-strong");
      const signal = css("--signal");

      const player = { x: 7 * CELL + 4, y: 16 * CELL + 4, w: 22, h: 22, invuln: 0 };
      const logs = [];
      const cars = [];
      let lives = 3;
      let score = 0;
      let bestRow = 16;
      let over = false;
      let raf = 0;
      let last = 0;

      function makeLogs() {
        logs.length = 0;
        const lanes = [
          { row: 2, speed: 42, count: 3 },
          { row: 3, speed: -56, count: 2 },
          { row: 4, speed: 64, count: 3 },
          { row: 5, speed: -38, count: 2 },
          { row: 6, speed: 72, count: 2 },
          { row: 7, speed: -50, count: 3 },
        ];
        lanes.forEach((lane) => {
          for (let i = 0; i < lane.count; i += 1) {
            const width = (2 + Math.floor(Math.random() * 2)) * CELL;
            logs.push({
              row: lane.row,
              x: (i * (W + 40)) / lane.count + Math.random() * 40 - 40,
              w: width,
              speed: lane.speed,
            });
          }
        });
      }

      function makeCars() {
        cars.length = 0;
        const lanes = [
          { row: 9, speed: 80, count: 2 },
          { row: 10, speed: -105, count: 3 },
          { row: 11, speed: 62, count: 2 },
          { row: 12, speed: -88, count: 3 },
          { row: 13, speed: 95, count: 2 },
        ];
        lanes.forEach((lane) => {
          for (let i = 0; i < lane.count; i += 1) {
            cars.push({
              row: lane.row,
              x: (i * (W + 60)) / lane.count + Math.random() * 60 - 30,
              w: 48,
              speed: lane.speed,
            });
          }
        });
      }

      function resetPlayer() {
        player.x = 7 * CELL + 4;
        player.y = 16 * CELL + 4;
        player.invuln = 1.2;
      }

      function die(reason) {
        if (player.invuln > 0 || over) return;
        lives -= 1;
        api.tone(170, 0.25, "sawtooth", 0.045, 60);
        if (lives <= 0) {
          over = true;
          api.finish(score, "게임 오버", `점수 ${score.toLocaleString("ko-KR")}`);
          return;
        }
        resetPlayer();
      }

      function hop(dx, dy) {
        if (over) return;
        player.x = Math.max(0, Math.min(W - player.w, player.x + dx * CELL));
        player.y = Math.max(0, Math.min(H - player.h, player.y + dy * CELL));
        player.invuln = Math.max(player.invuln, 0.35);
        api.tone(520, 0.035, "square", 0.018);
        const row = Math.floor((player.y + player.h / 2) / CELL);
        if (row < bestRow) {
          bestRow = row;
          score += 10;
          api.score(score);
        }
        if (row <= 1 && !over) {
          over = true;
          score += 100;
          api.score(score);
          api.tone(880, 0.12, "square", 0.04);
          api.finish(score, "건너기 성공!", `점수 ${score.toLocaleString("ko-KR")} · 남은 목숨 ${lives}`);
        }
      }

      function update(dt) {
        if (over) return;
        player.invuln = Math.max(0, player.invuln - dt);

        logs.forEach((log) => {
          log.x += log.speed * dt;
          if (log.speed > 0 && log.x > W + 20) log.x = -log.w - 20;
          if (log.speed < 0 && log.x + log.w < -20) log.x = W + 20;
        });
        cars.forEach((car) => {
          car.x += car.speed * dt;
          if (car.speed > 0 && car.x > W + 20) car.x = -car.w - 20;
          if (car.speed < 0 && car.x + car.w < -20) car.x = W + 20;
        });

        const row = Math.floor((player.y + player.h / 2) / CELL);
        const inRiver = row >= 2 && row <= 7;
        const inRoad = row >= 9 && row <= 13;

        if (inRiver) {
          const riding = logs.find(
            (log) =>
              log.row === row &&
              player.x + player.w / 2 > log.x &&
              player.x + player.w / 2 < log.x + log.w
          );
          if (!riding) {
            die("water");
            return;
          }
          player.x += riding.speed * dt;
          if (player.x < -player.w || player.x > W) {
            die("water");
            return;
          }
        }

        if (inRoad) {
          const hit = cars.find(
            (car) =>
              car.row === row &&
              player.x + player.w > car.x + 3 &&
              player.x < car.x + car.w - 3
          );
          if (hit) die("car");
        }
      }

      function drawScene() {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, W, H);

        // goal
        ctx.fillStyle = soft;
        ctx.fillRect(0, 0, W, CELL * 2);
        for (let i = 0; i < 5; i += 1) {
          ctx.fillStyle = ink;
          ctx.fillRect(24 + i * 92, 8, 56, 16);
          ctx.fillStyle = paper;
          ctx.fillRect(28 + i * 92, 12, 48, 8);
        }

        // river
        ctx.fillStyle = "#eef0ec";
        ctx.fillRect(0, CELL * 2, W, CELL * 6);
        ctx.strokeStyle = "rgba(23,20,14,.12)";
        ctx.lineWidth = 1;
        for (let y = CELL * 2 + 10; y < CELL * 8; y += 14) {
          ctx.beginPath();
          for (let x = 0; x <= W; x += 16) {
            ctx.lineTo(x, y + Math.sin((x + y) * 0.06) * 2);
          }
          ctx.stroke();
        }

        logs.forEach((log) => {
          const y = log.row * CELL + 4;
          ctx.fillStyle = soft;
          ctx.fillRect(log.x, y, log.w, CELL - 8);
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(log.x + 0.5, y + 0.5, log.w - 1, CELL - 9);
          ctx.strokeStyle = "rgba(23,20,14,.22)";
          for (let x = log.x + 8; x < log.x + log.w - 6; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, y + 4);
            ctx.lineTo(x, y + CELL - 12);
            ctx.stroke();
          }
        });

        // median
        ctx.fillStyle = soft;
        ctx.fillRect(0, CELL * 8, W, CELL);
        ctx.strokeStyle = "rgba(23,20,14,.35)";
        ctx.beginPath();
        ctx.moveTo(0, CELL * 8);
        ctx.lineTo(W, CELL * 8);
        ctx.stroke();

        // road
        ctx.fillStyle = line;
        ctx.fillRect(0, CELL * 9, W, CELL * 5);
        ctx.strokeStyle = "rgba(250,246,236,.55)";
        ctx.setLineDash([16, 14]);
        for (let row = 9; row <= 13; row += 1) {
          ctx.beginPath();
          ctx.moveTo(0, row * CELL);
          ctx.lineTo(W, row * CELL);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        cars.forEach((car) => {
          const y = car.row * CELL + 5;
          ctx.fillStyle = ink;
          ctx.fillRect(car.x, y, car.w, CELL - 10);
          ctx.fillStyle = paper;
          ctx.fillRect(car.x + 8, y + 4, car.w - 16, 6);
          ctx.strokeStyle = "rgba(23,20,14,.5)";
          ctx.strokeRect(car.x + 0.5, y + 0.5, car.w - 1, CELL - 11);
        });

        // start
        ctx.fillStyle = soft;
        ctx.fillRect(0, CELL * 14, W, CELL * 4);

        // frog
        if (!(player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0)) {
          ctx.fillStyle = signal;
          ctx.fillRect(player.x + 3, player.y + 4, 16, 16);
          ctx.fillStyle = ink;
          ctx.beginPath();
          ctx.arc(player.x + 7, player.y + 6, 4, 0, Math.PI * 2);
          ctx.arc(player.x + 15, player.y + 6, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = paper;
          ctx.beginPath();
          ctx.arc(player.x + 7, player.y + 6, 1.6, 0, Math.PI * 2);
          ctx.arc(player.x + 15, player.y + 6, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "rgba(23,20,14,.5)";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SCORE ${score}`, 16, H - 10);
        ctx.textAlign = "right";
        ctx.fillText(`LIVES ${"■".repeat(Math.max(0, lives))}`, W - 16, H - 10);
      }

      function frame(now) {
        if (over) return;
        if (!last) last = now;
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        update(dt);
        if (over) return;
        drawScene();
        raf = requestAnimationFrame(frame);
      }

      const map = {
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
        const move = map[event.key];
        if (!move) return;
        event.preventDefault();
        if (!event.repeat) hop(move[0], move[1]);
      };
      window.addEventListener("keydown", onKey);

      makeLogs();
      makeCars();
      api.score(0);
      drawScene();
      raf = requestAnimationFrame(frame);

      return () => {
        over = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
      };
    },
  });
})();
