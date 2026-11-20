/* arcade — breakout */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "breakout",
    name: "벽돌 깨기",
    origin: "Breakout (1976) · 벽돌 부수기",
    genre: "아케이드",
    controls: "← → / 마우스 · Space 발사",
    mount(root, api) {
      const W = 640;
      const H = 420;
      const canvas = UI.el("canvas", { width: W, height: H, "aria-label": "벽돌 깨기 게임" });
      const ctx = canvas.getContext("2d");
      root.append(UI.el("div", { class: "game" }, canvas));

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const soft = css("--paper-deep");
      const signal = css("--signal");

      const paddle = { x: W / 2 - 46, y: H - 30, w: 92, h: 10 };
      const ball = { x: W / 2, y: H - 50, vx: 0, vy: 0, r: 5 };
      let launched = false;
      let lives = 3;
      let score = 0;
      let over = false;
      let raf = 0;
      let last = 0;
      let bricks = [];

      function buildBricks() {
        bricks = [];
        const cols = 10;
        const rows = 5;
        const padX = 26;
        const gap = 6;
        const top = 56;
        const brickH = 18;
        const brickW = (W - padX * 2 - gap * (cols - 1)) / cols;
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            bricks.push({
              x: padX + col * (brickW + gap),
              y: top + row * (brickH + gap),
              w: brickW,
              h: brickH,
              row,
              alive: true,
            });
          }
        }
      }

      function resetBall() {
        launched = false;
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 1;
        ball.vx = 0;
        ball.vy = 0;
      }

      function launch() {
        if (launched || over) return;
        launched = true;
        const angle = (-Math.PI * 0.72) + Math.random() * 0.44;
        ball.vx = Math.cos(angle) * 320;
        ball.vy = Math.sin(angle) * 320;
        api.tone(420, 0.06, "square", 0.03);
      }

      function loseLife() {
        lives -= 1;
        api.tone(180, 0.2, "sawtooth", 0.04);
        if (lives <= 0) {
          over = true;
          api.finish(score, "게임 오버", `점수 ${score.toLocaleString("ko-KR")}`);
          return;
        }
        resetBall();
      }

      function hitBrick() {
        for (const brick of bricks) {
          if (!brick.alive) continue;
          if (
            ball.x + ball.r > brick.x &&
            ball.x - ball.r < brick.x + brick.w &&
            ball.y + ball.r > brick.y &&
            ball.y - ball.r < brick.y + brick.h
          ) {
            brick.alive = false;
            score += 10;
            api.score(score);
            api.tone(620, 0.05, "square", 0.03);
            const overlapX = Math.min(
              ball.x + ball.r - brick.x,
              brick.x + brick.w - (ball.x - ball.r)
            );
            const overlapY = Math.min(
              ball.y + ball.r - brick.y,
              brick.y + brick.h - (ball.y - ball.r)
            );
            if (overlapX < overlapY) ball.vx *= -1;
            else ball.vy *= -1;
            if (!bricks.some((item) => item.alive)) {
              over = true;
              api.finish(score, "클리어!", `점수 ${score.toLocaleString("ko-KR")} · 남은 목숨 ${lives}`);
            }
            return;
          }
        }
      }

      function update(dt) {
        if (!launched) {
          ball.x = paddle.x + paddle.w / 2;
          ball.y = paddle.y - ball.r - 1;
          return;
        }
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x < ball.r) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > W - ball.r) {
          ball.x = W - ball.r;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y < ball.r) {
          ball.y = ball.r;
          ball.vy = Math.abs(ball.vy);
        }
        if (ball.y > H + 20) {
          loseLife();
          return;
        }

        if (
          ball.vy > 0 &&
          ball.y + ball.r > paddle.y &&
          ball.y - ball.r < paddle.y + paddle.h &&
          ball.x > paddle.x &&
          ball.x < paddle.x + paddle.w
        ) {
          const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const speed = Math.min(520, Math.hypot(ball.vx, ball.vy) * 1.02);
          const angle = -Math.PI / 2 + offset * 0.9;
          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
          ball.y = paddle.y - ball.r - 1;
          api.tone(300, 0.05, "square", 0.028);
        }

        hitBrick();
      }

      function drawBrick(brick) {
        if (!brick.alive) return;
        const shades = [soft, "#cfc5b0", "#b9ae97", "#9d927c", "#7f7768"];
        ctx.fillStyle = shades[brick.row % shades.length];
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
        ctx.strokeStyle = "rgba(23,20,14,.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.w - 1, brick.h - 1);
      }

      function draw() {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, W, H);

        bricks.forEach(drawBrick);

        ctx.fillStyle = ink;
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.fillStyle = signal;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(23,20,14,.5)";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SCORE ${score}`, 24, 28);
        ctx.textAlign = "right";
        ctx.fillText(`LIVES ${"■".repeat(Math.max(0, lives))}`, W - 24, 28);

        if (!launched && !over) {
          ctx.fillStyle = "rgba(23,20,14,.62)";
          ctx.font = "500 12px 'IBM Plex Sans KR', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Space 또는 클릭으로 공을 발사하세요", W / 2, H / 2 + 42);
        }
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

      const keys = new Set();
      const onKeyDown = (event) => {
        if (["ArrowLeft", "ArrowRight", " ", "Space"].includes(event.key)) {
          event.preventDefault();
        }
        if (event.key === " " || event.code === "Space") launch();
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.add("left");
        if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.add("right");
      };
      const onKeyUp = (event) => {
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.delete("left");
        if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.delete("right");
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      const onPointer = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * W;
        paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
      };
      canvas.addEventListener("pointermove", onPointer);
      canvas.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        launch();
      });

      const control = setInterval(() => {
        if (keys.has("left")) paddle.x = Math.max(0, paddle.x - 18);
        if (keys.has("right")) paddle.x = Math.min(W - paddle.w, paddle.x + 18);
      }, 16);

      buildBricks();
      resetBall();
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
