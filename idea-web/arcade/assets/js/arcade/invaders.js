/* arcade — space invaders */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "invaders",
    name: "우주 침공",
    origin: "Space Invaders (1978) · 에일리언 격추",
    genre: "슈팅",
    controls: "← → 이동 · Space 발사 · 화면 버튼",
    mount(root, api) {
      const W = 640;
      const H = 480;
      const canvas = UI.el("canvas", { width: W, height: H, "aria-label": "우주 침공 게임" });
      const ctx = canvas.getContext("2d");
      const leftBtn = UI.el("button", { type: "button", text: "←", "aria-label": "왼쪽" });
      const rightBtn = UI.el("button", { type: "button", text: "→", "aria-label": "오른쪽" });
      leftBtn.addEventListener("pointerdown", () => (keys.left = true));
      leftBtn.addEventListener("pointerup", () => (keys.left = false));
      leftBtn.addEventListener("pointerleave", () => (keys.left = false));
      rightBtn.addEventListener("pointerdown", () => (keys.right = true));
      rightBtn.addEventListener("pointerup", () => (keys.right = false));
      rightBtn.addEventListener("pointerleave", () => (keys.right = false));
      const pad = UI.el(
        "div",
        { class: "pad", "aria-label": "우주선 조작" },
        leftBtn,
        UI.el("button", { type: "button", text: "발사", "aria-label": "발사", onclick: shoot }),
        rightBtn,
        UI.el("button", {
          type: "button",
          text: "■",
          "aria-label": "정지",
          onclick: () => {
            keys.left = false;
            keys.right = false;
          },
        })
      );
      root.append(UI.el("div", { class: "game invaders" }, canvas, pad));

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const soft = css("--paper-deep");
      const signal = css("--signal");

      const player = { x: W / 2, y: H - 46, w: 38, h: 16 };
      const keys = { left: false, right: false };
      let lives = 3;
      let score = 0;
      let bullets = [];
      let bombs = [];
      let aliens = [];
      let alienDir = 1;
      let alienSpeed = 26;
      let fireCooldown = 0;
      let bombTimer = 1.2;
      let over = false;
      let raf = 0;
      let last = 0;

      function buildAliens() {
        aliens = [];
        const cols = 8;
        const rows = 4;
        const gap = 12;
        const aw = 32;
        const ah = 20;
        const startX = (W - (cols * aw + (cols - 1) * gap)) / 2;
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            aliens.push({
              x: startX + col * (aw + gap),
              y: 64 + row * 30,
              w: aw,
              h: ah,
              alive: true,
              type: row % 2,
            });
          }
        }
      }

      function shoot() {
        if (over || fireCooldown > 0) return;
        bullets.push({ x: player.x, y: player.y - 8, vy: -520 });
        fireCooldown = 0.24;
        api.tone(620, 0.05, "square", 0.025, 900);
      }

      function loseLife() {
        lives -= 1;
        bombs = [];
        api.tone(180, 0.25, "sawtooth", 0.045, 60);
        if (lives <= 0) {
          over = true;
          api.finish(score, "게임 오버", `점수 ${score.toLocaleString("ko-KR")}`);
        }
      }

      function update(dt) {
        if (over) return;
        fireCooldown = Math.max(0, fireCooldown - dt);
        if (keys.left) player.x = Math.max(20, player.x - 260 * dt);
        if (keys.right) player.x = Math.min(W - 20, player.x + 260 * dt);

        bullets.forEach((bullet) => (bullet.y += bullet.vy * dt));
        bullets = bullets.filter((bullet) => bullet.y > -20);

        const alive = aliens.filter((alien) => alien.alive);
        if (!alive.length) {
          over = true;
          api.finish(score, "클리어!", `점수 ${score.toLocaleString("ko-KR")} · 남은 목숨 ${lives}`);
          return;
        }

        // 움직임
        const speed = alienSpeed + (32 - alive.length) * 1.4;
        let edge = false;
        alive.forEach((alien) => {
          alien.x += alienDir * speed * dt;
          if (alien.x < 16 || alien.x + alien.w > W - 16) edge = true;
        });
        if (edge) {
          alienDir *= -1;
          alive.forEach((alien) => {
            alien.y += 16;
          });
        }

        // 총알 vs 에일리언
        for (const bullet of bullets) {
          for (const alien of alive) {
            if (
              bullet.x > alien.x &&
              bullet.x < alien.x + alien.w &&
              bullet.y > alien.y &&
              bullet.y < alien.y + alien.h
            ) {
              alien.alive = false;
              bullet.y = -999;
              score += 10;
              api.score(score);
              api.tone(480, 0.05, "square", 0.03);
              break;
            }
          }
        }

        // 폭탄
        bombTimer -= dt;
        if (bombTimer <= 0) {
          bombTimer = 0.6 + Math.random() * 0.8;
          const shooters = aliens.filter((alien) => alien.alive);
          if (shooters.length) {
            const alien = shooters[Math.floor(Math.random() * shooters.length)];
            bombs.push({ x: alien.x + alien.w / 2, y: alien.y + alien.h, vy: 210 });
          }
        }
        bombs.forEach((bomb) => (bomb.y += bomb.vy * dt));
        bombs = bombs.filter((bomb) => bomb.y < H + 10);
        for (const bomb of bombs) {
          if (
            bomb.x > player.x - player.w / 2 &&
            bomb.x < player.x + player.w / 2 &&
            bomb.y > player.y - player.h / 2 &&
            bomb.y < player.y + player.h / 2
          ) {
            bomb.y = H + 999;
            loseLife();
            break;
          }
        }

        const lowest = Math.max(...aliens.filter((alien) => alien.alive).map((alien) => alien.y + alien.h));
        if (lowest > player.y - 24) {
          over = true;
          api.finish(score, "침공당했습니다", `점수 ${score.toLocaleString("ko-KR")}`);
        }
      }

      function drawAlien(alien) {
        ctx.fillStyle = alien.type ? signal : ink;
        const x = alien.x;
        const y = alien.y;
        ctx.fillRect(x + 4, y, 24, 4);
        ctx.fillRect(x, y + 4, 32, 8);
        ctx.fillRect(x + 6, y + 12, 20, 4);
        ctx.fillRect(x + 2, y + 16, 6, 4);
        ctx.fillRect(x + 24, y + 16, 6, 4);
        ctx.fillStyle = paper;
        ctx.fillRect(x + 8, y + 6, 4, 4);
        ctx.fillRect(x + 20, y + 6, 4, 4);
      }

      function draw() {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "rgba(23,20,14,.25)";
        for (let i = 0; i < 40; i += 1) {
          const x = (i * 97) % W;
          const y = (i * 53) % (H - 80);
          ctx.fillRect(x, y, 1.5, 1.5);
        }

        aliens.forEach((alien) => {
          if (alien.alive) drawAlien(alien);
        });

        ctx.fillStyle = signal;
        bullets.forEach((bullet) => ctx.fillRect(bullet.x - 1.5, bullet.y, 3, 10));
        ctx.fillStyle = ink;
        bombs.forEach((bomb) => ctx.fillRect(bomb.x - 2, bomb.y, 4, 10));

        // player
        ctx.fillStyle = ink;
        ctx.fillRect(player.x - 18, player.y - 4, 36, 8);
        ctx.fillRect(player.x - 4, player.y - 10, 8, 8);

        ctx.fillStyle = "rgba(23,20,14,.55)";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SCORE ${score}`, 20, 24);
        ctx.textAlign = "right";
        ctx.fillText(`LIVES ${"■".repeat(Math.max(0, lives))}`, W - 20, 24);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(23,20,14,.35)";
        ctx.fillText("SPACE", W / 2, H - 18);
      }

      function frame(now) {
        if (over) return;
        if (!last) last = now;
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        update(dt);
        if (over) return;
        draw();
        raf = requestAnimationFrame(frame);
      }

      const onKeyDown = (event) => {
        if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = true;
        if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = true;
        if (event.code === "Space" || event.key === " ") shoot();
      };
      const onKeyUp = (event) => {
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = false;
        if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = false;
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      buildAliens();
      api.score(0);
      draw();
      raf = requestAnimationFrame(frame);

      return () => {
        over = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    },
  });
})();
