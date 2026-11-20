/* arcade — pong */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "pong",
    name: "퐁",
    origin: "Pong (1972) · 탁구 대결",
    genre: "스포츠",
    controls: "↑ ↓ · W S · 마우스/터치로 패들 이동",
    mount(root, api) {
      const W = 640;
      const H = 400;
      const canvas = UI.el("canvas", { width: W, height: H, "aria-label": "퐁 게임" });
      const ctx = canvas.getContext("2d");
      root.append(UI.el("div", { class: "game" }, canvas));

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");

      const player = { x: 24, y: H / 2 - 35, w: 10, h: 70 };
      const cpu = { x: W - 34, y: H / 2 - 35, w: 10, h: 70 };
      const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, size: 8 };
      let playerScore = 0;
      let cpuScore = 0;
      let serveTimer = 0.9;
      let over = false;
      let raf = 0;
      let last = 0;

      function resetBall(direction) {
        ball.x = W / 2;
        ball.y = H / 2;
        ball.vx = 280 * direction;
        ball.vy = (Math.random() * 2 - 1) * 190;
        serveTimer = 0;
      }

      function point(who) {
        if (who === "player") {
          playerScore += 1;
          api.tone(880, 0.09, "square", 0.035);
        } else {
          cpuScore += 1;
          api.tone(180, 0.16, "sawtooth", 0.04);
        }
        api.score(playerScore);
        if (playerScore >= 7 || cpuScore >= 7) {
          over = true;
          const win = playerScore > cpuScore;
          api.finish(playerScore, win ? "승리!" : "패배", `${playerScore} : ${cpuScore}`);
          return;
        }
        serveTimer = 0.85;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = W / 2;
        ball.y = H / 2;
      }

      function update(dt) {
        if (serveTimer > 0) {
          serveTimer -= dt;
          if (serveTimer <= 0) resetBall(Math.random() < 0.5 ? -1 : 1);
          return;
        }

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.y < ball.size) {
          ball.y = ball.size;
          ball.vy = Math.abs(ball.vy);
        }
        if (ball.y > H - ball.size) {
          ball.y = H - ball.size;
          ball.vy = -Math.abs(ball.vy);
        }

        const hit = (paddle) =>
          ball.x + ball.size > paddle.x &&
          ball.x - ball.size < paddle.x + paddle.w &&
          ball.y + ball.size > paddle.y &&
          ball.y - ball.size < paddle.y + paddle.h;

        if (ball.vx < 0 && hit(player)) {
          const offset = (ball.y - (player.y + player.h / 2)) / (player.h / 2);
          ball.vx = Math.abs(ball.vx) * 1.03;
          ball.vy = offset * 250;
          ball.x = player.x + player.w + ball.size;
          api.tone(420, 0.05, "square", 0.03);
        }
        if (ball.vx > 0 && hit(cpu)) {
          const offset = (ball.y - (cpu.y + cpu.h / 2)) / (cpu.h / 2);
          ball.vx = -Math.abs(ball.vx) * 1.03;
          ball.vy = offset * 250;
          ball.x = cpu.x - ball.size;
          api.tone(320, 0.05, "square", 0.03);
        }

        if (ball.x < -20) point("cpu");
        if (ball.x > W + 20) point("player");

        // CPU 추적
        const target = ball.vx > 0 ? ball.y : H / 2;
        const center = cpu.y + cpu.h / 2;
        const speed = 260;
        if (center < target - 8) cpu.y = Math.min(H - cpu.h, cpu.y + speed * dt);
        else if (center > target + 8) cpu.y = Math.max(0, cpu.y - speed * dt);
      }

      function draw() {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(23,20,14,.35)";
        ctx.setLineDash([10, 12]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2, 10);
        ctx.lineTo(W / 2, H - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = ink;
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.fillRect(cpu.x, cpu.y, cpu.w, cpu.h);
        ctx.fillRect(ball.x - ball.size, ball.y - ball.size, ball.size * 2, ball.size * 2);

        ctx.font = "500 48px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(23,20,14,.38)";
        ctx.fillText(String(playerScore), W / 2 - 80, 66);
        ctx.fillText(String(cpuScore), W / 2 + 80, 66);

        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.fillStyle = "rgba(23,20,14,.55)";
        ctx.textAlign = "left";
        ctx.fillText("YOU", 24, 24);
        ctx.textAlign = "right";
        ctx.fillText("CPU · FIRST TO 7", W - 24, 24);
      }

      function frame(now) {
        if (over) return;
        if (!last) last = now;
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        update(dt);
        draw();
        raf = requestAnimationFrame(frame);
      }

      const keyMap = { ArrowUp: -1, ArrowDown: 1, w: -1, s: 1, W: -1, S: 1 };
      const pressed = new Set();
      const onKeyDown = (event) => {
        if (keyMap[event.key] === undefined) return;
        event.preventDefault();
        pressed.add(keyMap[event.key]);
      };
      const onKeyUp = (event) => {
        if (keyMap[event.key] === undefined) return;
        pressed.delete(keyMap[event.key]);
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      const onPointer = (event) => {
        const rect = canvas.getBoundingClientRect();
        const y = ((event.clientY - rect.top) / rect.height) * H;
        player.y = Math.max(0, Math.min(H - player.h, y - player.h / 2));
      };
      canvas.addEventListener("pointermove", onPointer);

      const control = setInterval(() => {
        if (pressed.has(-1)) player.y = Math.max(0, player.y - 26);
        if (pressed.has(1)) player.y = Math.min(H - player.h, player.y + 26);
      }, 16);

      api.score(0);
      draw();
      raf = requestAnimationFrame(frame);

      return () => {
        over = true;
        cancelAnimationFrame(raf);
        clearInterval(control);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        canvas.removeEventListener("pointermove", onPointer);
      };
    },
  });
})();
