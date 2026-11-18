/* bruno — 광고판이 있는 작은 3D 세계를 2D로 */
(function () {
  "use strict";

  const WORLD = { w: 2200, h: 1500 };

  window.LAB.add({
    id: "bruno",
    name: "브루노 사이먼",
    original: "Bruno Simon",
    tier: "t5",
    tag: "드라이빙",
    blurb:
      "포트폴리오를 자동차로 달리며 구경하는 사이트. 여기서는 광고판을 찾아 달리는 작은 세계로 옮겼습니다.",
    info: "자동차, 3D 포트폴리오, 키보드",
    mount(root) {
      const { el, canvas, clamp, on } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const stage = el("div", { class: "bruno-stage" });
      const { cv, ctx, w, h } = canvas(stage, 900, 540);
      const prompt = el("div", { class: "bruno-prompt", hidden: true });
      const panel = el("div", { class: "bruno-panel", hidden: true });

      const billboards = [
        { x: 520, y: 610, label: "아이디어웹", text: "23곳을 한 페이지에", title: "아이디어웹" },
        { x: 1500, y: 980, label: "Cmd+K", text: "키보드로 모든 것을", title: "리니어 Cmd+K" },
        { x: 1850, y: 360, label: "아이디어웹", text: "브라우저에서 체험하는 웹 아이디어", title: "보관 위치" },
      ].map((billboard) => Object.assign(billboard, { near: false }));

      const car = { x: 700, y: 760, angle: -Math.PI / 2, speed: 0 };
      const keys = { up: false, down: false, left: false, right: false };
      const colors = {
        grass: css("--t3-soft"),
        grassDark: css("--line"),
        road: css("--paper-deep"),
        roadLine: css("--paper-raised"),
        ink: css("--ink"),
        signal: css("--signal"),
        paper: css("--paper-raised"),
        forest: css("--t3"),
        wood: css("--t-extra"),
      };

      const trees = [];
      for (let i = 0; i < 46; i += 1) {
        const x = 80 + ((i * 397) % 2040);
        const y = 90 + ((i * 613) % 1320);
        const onRoad = Math.abs(y - 700) < 170 || Math.abs(x - 1000) < 170;
        if (!onRoad) trees.push({ x, y, r: 18 + (i % 5) * 4 });
      }

      const camera = { x: car.x, y: car.y };
      let raf = 0;
      let last = 0;

      const collides = (x, y) =>
        trees.some((tree) => Math.hypot(tree.x - x, tree.y - y) < tree.r + 18);

      const update = (dt) => {
        const accel = keys.up ? 300 : keys.down ? -190 : 0;
        car.speed += accel * dt;
        car.speed *= 1 - 1.15 * dt;
        car.speed = clamp(car.speed, -160, 330);

        const turning = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
        if (Math.abs(car.speed) > 4) {
          car.angle += turning * 2.5 * dt * Math.min(1, Math.abs(car.speed) / 150) * Math.sign(car.speed);
        }

        const nextX = car.x + Math.cos(car.angle) * car.speed * dt;
        const nextY = car.y + Math.sin(car.angle) * car.speed * dt;
        if (!collides(nextX, car.y)) car.x = clamp(nextX, 60, WORLD.w - 60);
        else car.speed *= 0.4;
        if (!collides(car.x, nextY)) car.y = clamp(nextY, 60, WORLD.h - 60);
        else car.speed *= 0.4;

        camera.x += (car.x - camera.x) * Math.min(1, dt * 5);
        camera.y += (car.y - camera.y) * Math.min(1, dt * 5);

        const nearest = billboards.find(
          (billboard) => Math.hypot(billboard.x - car.x, billboard.y - car.y) < 110
        );
        billboards.forEach((billboard) => {
          billboard.near = billboard === nearest;
        });
        if (nearest) {
          prompt.hidden = false;
          prompt.querySelector("strong").textContent = nearest.title;
        } else if (panel.hidden) {
          prompt.hidden = true;
        }
      };

      const drawTree = (tree) => {
        ctx.fillStyle = "rgba(23,20,14,.12)";
        ctx.beginPath();
        ctx.ellipse(tree.x + 6, tree.y + 8, tree.r * 0.9, tree.r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.wood;
        ctx.fillRect(tree.x - 3, tree.y - 4, 6, 16);
        ctx.fillStyle = colors.forest;
        ctx.beginPath();
        ctx.arc(tree.x, tree.y - 10, tree.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      };

      const drawBillboard = (billboard) => {
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(billboard.x - 34, billboard.y + 40);
        ctx.lineTo(billboard.x, billboard.y + 8);
        ctx.moveTo(billboard.x + 34, billboard.y + 40);
        ctx.lineTo(billboard.x, billboard.y + 8);
        ctx.stroke();
        ctx.fillStyle = billboard.near ? colors.signal : colors.ink;
        ctx.fillRect(billboard.x - 70, billboard.y - 34, 140, 56);
        ctx.strokeStyle = colors.paper;
        ctx.lineWidth = 2;
        ctx.strokeRect(billboard.x - 66, billboard.y - 30, 132, 48);
        ctx.fillStyle = colors.paper;
        ctx.font = "600 15px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(billboard.label, billboard.x, billboard.y - 12);
        ctx.font = "500 10px 'IBM Plex Sans KR', sans-serif";
        ctx.fillStyle = "rgba(250,246,236,.72)";
        ctx.fillText(billboard.text, billboard.x, billboard.y + 6);
      };

      const drawCar = () => {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);
        ctx.fillStyle = "rgba(23,20,14,.18)";
        ctx.beginPath();
        ctx.ellipse(2, 6, 30, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.signal;
        ctx.beginPath();
        ctx.roundRect(-24, -14, 48, 28, 8);
        ctx.fill();
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(23,20,14,.72)";
        ctx.beginPath();
        ctx.roundRect(-8, -10, 20, 20, 4);
        ctx.fill();
        ctx.fillStyle = colors.paper;
        ctx.beginPath();
        ctx.roundRect(-20, -9, 7, 18, 3);
        ctx.fill();
        ctx.restore();
      };

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = colors.grass;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2 - camera.x, h / 2 - camera.y);

        for (let x = 60; x < WORLD.w; x += 120) {
          for (let y = 60; y < WORLD.h; y += 120) {
            if ((x + y) % 240 === 0) {
              ctx.fillStyle = "rgba(23,20,14,.035)";
              ctx.fillRect(x, y, 60, 60);
            }
          }
        }

        ctx.fillStyle = colors.road;
        ctx.fillRect(0, 610, WORLD.w, 180);
        ctx.fillRect(910, 0, 180, WORLD.h);
        ctx.strokeStyle = colors.roadLine;
        ctx.lineWidth = 3;
        ctx.setLineDash([26, 22]);
        ctx.beginPath();
        ctx.moveTo(0, 700);
        ctx.lineTo(WORLD.w, 700);
        ctx.moveTo(1000, 0);
        ctx.lineTo(1000, WORLD.h);
        ctx.stroke();
        ctx.setLineDash([]);

        trees.forEach(drawTree);
        billboards.forEach(drawBillboard);
        drawCar();
        ctx.restore();

        ctx.fillStyle = "rgba(23,20,14,.55)";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("BRUNO SIMON · FAN BUILD", 18, h - 16);
      };

      const loop = (time) => {
        if (!last) last = time;
        const dt = Math.min(0.032, (time - last) / 1000);
        last = time;
        update(dt);
        draw();
        raf = requestAnimationFrame(loop);
      };

      const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };

      const onKeyDown = (event) => {
        if (map[event.key]) {
          event.preventDefault();
          keys[map[event.key]] = true;
        }
        if (event.key.toLowerCase() === "e" && !prompt.hidden) {
          const billboard = billboards.find((item) => item.near);
          if (billboard) {
            panel.hidden = false;
            panel.replaceChildren(
              el("span", { class: "mono", text: "BILLBOARD" }),
              el("h3", { text: billboard.title }),
              el("p", { text: `${billboard.text}. 운전해서 다른 광고판도 찾아보세요.` }),
              el("button", {
                class: "btn btn--sm btn--ghost",
                type: "button",
                text: "닫기 (Esc)",
                onclick: closePanel,
              })
            );
            panel.querySelector("button").focus({ preventScroll: true });
          }
        }
        if (event.key === "Escape") closePanel();
      };
      const onKeyUp = (event) => {
        if (map[event.key]) keys[map[event.key]] = false;
      };
      const closePanel = () => {
        panel.hidden = true;
        if (!billboards.some((billboard) => billboard.near)) prompt.hidden = true;
      };

      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);

      const touchPad = el(
        "div",
        { class: "bruno-touch", "aria-label": "터치 조작" },
        ...[
          ["up", "↑", "앞으로"],
          ["left", "←", "왼쪽"],
          ["down", "↓", "뒤로"],
          ["right", "→", "오른쪽"],
        ].map(([key, glyph, label]) =>
          el("button", {
            class: `bruno-key bruno-key--${key}`,
            type: "button",
            "aria-label": label,
            text: glyph,
            onpointerdown: (event) => {
              event.preventDefault();
              keys[key] = true;
            },
            onpointerup: () => {
              keys[key] = false;
            },
            onpointerleave: () => {
              keys[key] = false;
            },
          })
        )
      );

      stage.append(prompt, panel);
      prompt.append(
        el("span", { class: "mono", text: "E" }),
        el("strong", { text: "" }),
        el("span", { class: "hint", text: "열기" })
      );

      root.append(
        el(
          "div",
          { class: "lab bruno-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "광고판을 찾아서" }),
            el("span", { class: "lab-sub", text: "방향키 또는 WASD · 광고판 근처에서 E" })
          ),
          stage,
          touchPad
        )
      );

      raf = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
      };
    },
  });
})();
