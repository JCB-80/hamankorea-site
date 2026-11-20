/* arcade — flappy */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "flappy",
    name: "플래피",
    origin: "Flappy Bird (2013) · 한 번의 날갯짓",
    genre: "액션",
    controls: "Space · 클릭 · 터치로 날기",
    mount(root, api) {
      const W = 400;
      const H = 560;
      const canvas = UI.el("canvas", { width: W, height: H, "aria-label": "플래피 게임" });
      const ctx = canvas.getContext("2d");
      const flapBtn = UI.el("button", {
        class: "btn flappy-btn",
        type: "button",
        text: "날개 치기",
        onclick: flap,
      });
      root.append(UI.el("div", { class: "game flappy" }, canvas, flapBtn));

      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const soft = css("--paper-deep");
      const signal = css("--signal");

      const bird = { x: 108, y: 260, vy: 0, r: 13 };
      const pipes = [];
      let started = false;
      let over = false;
      let score = 0;
      let spawnTimer = 0;
      let raf = 0;
      let last = 0;

      function flap() {
        if (over) return;
        if (!started) {
          started = true;
          pipes.push({ x: W + 40, gap: 250, passed: false });
          spawnTimer = 0;
        }
        bird.vy = -390;
        api.tone(520, 0.06, "square", 0.03, 720);
      }

      function reset() {
        bird.y = 260;
        bird.vy = 0;
        pipes.length = 0;
        started = false;
        over = false;
        score = 0;
        spawnTimer = 0;
        api.score(0);
      }

      function spawnPipe() {
        pipes.push({
          x: W + 60,
          gap: 150 + Math.random() * 210,
          passed: false,
        });
      }

      function hitPipe(pipe) {
        if (bird.x + bird.r < pipe.x || bird.x - bird.r > pipe.x + 58) return false;
        return bird.y - bird.r < pipe.gap - 76 || bird.y + bird.r > pipe.gap + 76;
      }

      function die() {
        if (over) return;
        over = true;
        api.tone(180, 0.3, "sawtooth", 0.045, 60);
        api.finish(score, "게임 오버", `점수 ${score.toLocaleString("ko-KR")}`);
      }

      function update(dt) {
        if (!started || over) return;
        bird.vy = Math.min(640, bird.vy + 1400 * dt);
        bird.y += bird.vy * dt;
        if (bird.y + bird.r > 510 || bird.y - bird.r < 0) {
          die();
          return;
        }

        spawnTimer += dt;
        if (spawnTimer > 1.45) {
          spawnTimer = 0;
          spawnPipe();
        }

        for (const pipe of pipes) pipe.x -= 155 * dt;
        for (const pipe of pipes) {
          if (!pipe.passed && pipe.x + 58 < bird.x) {
            pipe.passed = true;
            score += 1;
            api.score(score);
            api.tone(760, 0.06, "square", 0.03);
          }
          if (hitPipe(pipe)) {
            die();
            return;
          }
        }
        while (pipes.length && pipes[0].x < -80) pipes.shift();
      }

      function draw() {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, W, H);

        // skyline
        ctx.fillStyle = "rgba(23,20,14,.06)";
        for (let i = 0; i < 7; i += 1) {
          const bx = (i * 74 + 20) % (W + 80) - 40;
          const bh = 50 + ((i * 37) % 70);
          ctx.fillRect(bx, 510 - bh, 46, bh);
        }

        // ground
        ctx.fillStyle = soft;
        ctx.fillRect(0, 510, W, 50);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 510);
        ctx.lineTo(W, 510);
        ctx.stroke();
        ctx.strokeStyle = "rgba(23,20,14,.18)";
        for (let x = -20; x < W + 20; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, 512);
          ctx.lineTo(x - 14, 560);
          ctx.stroke();
        }

        for (const pipe of pipes) {
          const topH = pipe.gap - 76;
          const bottomY = pipe.gap + 76;
          ctx.fillStyle = paper;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 2;
          ctx.fillRect(pipe.x, 0, 58, topH);
          ctx.strokeRect(pipe.x + 1, 0, 56, topH);
          ctx.fillRect(pipe.x, bottomY, 58, 510 - bottomY);
          ctx.strokeRect(pipe.x + 1, bottomY, 56, 510 - bottomY - 1);
          ctx.strokeStyle = "rgba(23,20,14,.16)";
          ctx.lineWidth = 1;
          for (let y = 20; y < topH; y += 16) {
            ctx.beginPath();
            ctx.moveTo(pipe.x + 8, y);
            ctx.lineTo(pipe.x + 50, y - 10);
            ctx.stroke();
          }
          for (let y = bottomY + 16; y < 510; y += 16) {
            ctx.beginPath();
            ctx.moveTo(pipe.x + 8, y);
            ctx.lineTo(pipe.x + 50, y - 10);
            ctx.stroke();
          }
        }

        // bird
        ctx.fillStyle = signal;
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = paper;
        ctx.beginPath();
        ctx.arc(bird.x + 4, bird.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(bird.x + 5, bird.y - 4, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bird.x + bird.r - 2, bird.y + 2);
        ctx.lineTo(bird.x + bird.r + 8, bird.y + 5);
        ctx.lineTo(bird.x + bird.r - 2, bird.y + 9);
        ctx.closePath();
        ctx.fillStyle = ink;
        ctx.fill();

        if (!started) {
          ctx.fillStyle = "rgba(23,20,14,.62)";
          ctx.font = "500 13px 'IBM Plex Sans KR', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Space 또는 화면을 눌러 시작", W / 2, 120);
        }

        ctx.fillStyle = "rgba(23,20,14,.45)";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText("FLAPPY", 18, 26);
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

      const onKey = (event) => {
        if (event.code === "Space" || event.key === "ArrowUp") {
          event.preventDefault();
          flap();
        }
      };
      window.addEventListener("keydown", onKey);
      const onPointer = (event) => {
        event.preventDefault();
        flap();
      };
      canvas.addEventListener("pointerdown", onPointer);

      api.score(0);
      draw();
      raf = requestAnimationFrame(frame);

      return () => {
        over = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        canvas.removeEventListener("pointerdown", onPointer);
      };
    },
  });
})();
