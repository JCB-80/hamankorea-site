/* pointer — 마우스를 따라 모두가 손가락을 든다 */
(function () {
  "use strict";

  window.LAB.add({
    id: "pointer",
    name: "포인터 포인터",
    original: "Pointer Pointer",
    tier: "t5",
    tag: "마우스 추적",
    blurb:
      "커서를 어디로 옮겨도 사진 속 사람들이 그쪽을 가리킵니다. 아무 생각 없이 커서만 움직여 보세요.",
    info: "커서 추적 캔버스 인터랙션",
    mount(root) {
      const { el, canvas, clamp, on } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();

      const paperDeep = css("--paper-deep");
      const paper = css("--paper-raised");
      const ink = css("--ink");
      const inkSoft = css("--ink-soft");
      const signal = css("--signal");
      const shirtColors = [
        css("--t1"),
        css("--t2"),
        css("--t3"),
        css("--t4"),
        css("--t5"),
        css("--t-extra"),
        css("--ink-soft"),
      ];

      const head = el(
        "div",
        { class: "lab-top" },
        el("span", { class: "lab-h", text: "커서를 움직여 보세요" }),
        el("span", { class: "lab-sub", text: "7명이 동시에 가리킵니다" })
      );
      const board = el("div", { class: "pointer-board" });
      root.append(el("div", { class: "lab" }, head, board));

      const { cv, ctx, w, h } = canvas(board, 960, 560, "960px");

      const figures = [
        { x: 96, y: 468, s: 1.14 },
        { x: 218, y: 430, s: 0.98 },
        { x: 344, y: 486, s: 1.2 },
        { x: 476, y: 442, s: 1.04 },
        { x: 612, y: 482, s: 1.18 },
        { x: 744, y: 434, s: 0.99 },
        { x: 868, y: 474, s: 1.12 },
      ].map((figure, index) =>
        Object.assign(figure, {
          color: shirtColors[index % shirtColors.length],
          hair: index % 3 === 0,
        })
      );

      const target = { x: w * 0.55, y: h * 0.42 };
      const goal = { x: target.x, y: target.y };
      let lastMove = performance.now();
      let raf = 0;

      const drawFigure = (fig, now) => {
        const { x, y, s, color } = fig;
        const shoulder = { x: x + 20 * s, y: y - 68 * s };
        const idle = Math.sin(now / 900 + x) * 0.06;

        ctx.save();

        // shadow
        ctx.fillStyle = "rgba(23, 20, 14, 0.09)";
        ctx.beginPath();
        ctx.ellipse(x, y + 10 * s, 48 * s, 9 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // legs
        ctx.strokeStyle = inkSoft;
        ctx.lineWidth = 9 * s;
        ctx.lineCap = "round";
        [x - 12 * s, x + 12 * s].forEach((legX) => {
          ctx.beginPath();
          ctx.moveTo(legX, y - 24 * s);
          ctx.lineTo(legX + (legX < x ? -5 : 5) * s, y + 4 * s);
          ctx.stroke();
        });

        // torso
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - 30 * s, y - 22 * s);
        ctx.lineTo(x - 23 * s, y - 72 * s);
        ctx.quadraticCurveTo(x, y - 82 * s, x + 23 * s, y - 72 * s);
        ctx.lineTo(x + 30 * s, y - 22 * s);
        ctx.closePath();
        ctx.fill();

        // neck
        ctx.fillStyle = paper;
        ctx.fillRect(x - 5 * s, y - 86 * s, 10 * s, 10 * s);

        // head
        ctx.beginPath();
        ctx.fillStyle = paper;
        ctx.arc(x, y - 98 * s, 16 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // hair
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(x, y - 101 * s, 16 * s, Math.PI * 1.08, Math.PI * 1.92);
        if (fig.hair) ctx.arc(x - 15 * s, y - 96 * s, 6 * s, 0, Math.PI * 2);
        ctx.fill();

        // resting arm
        ctx.strokeStyle = inkSoft;
        ctx.lineWidth = 7 * s;
        ctx.beginPath();
        ctx.moveTo(x - 22 * s, y - 66 * s);
        ctx.lineTo(x - 29 * s, y - 36 * s);
        ctx.stroke();

        // pointing arm
        const dx = target.x - shoulder.x;
        const dy = target.y - shoulder.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx) + idle;
        const reach = clamp(dist * 0.55, 52 * s, 108 * s);
        const elbow = {
          x: shoulder.x + Math.cos(angle + 0.38) * reach * 0.55,
          y: shoulder.y + Math.sin(angle + 0.38) * reach * 0.55,
        };
        const hand = {
          x: shoulder.x + Math.cos(angle) * reach,
          y: shoulder.y + Math.sin(angle) * reach,
        };

        ctx.strokeStyle = ink;
        ctx.lineWidth = 8 * s;
        ctx.beginPath();
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.quadraticCurveTo(elbow.x, elbow.y, hand.x, hand.y);
        ctx.stroke();

        // hand + finger
        ctx.fillStyle = paper;
        ctx.beginPath();
        ctx.arc(hand.x, hand.y, 5.6 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.lineWidth = 4.5 * s;
        ctx.beginPath();
        ctx.moveTo(hand.x, hand.y);
        ctx.lineTo(hand.x + Math.cos(angle) * 11 * s, hand.y + Math.sin(angle) * 11 * s);
        ctx.stroke();

        ctx.restore();
      };

      const render = (now) => {
        const idleFor = now - lastMove;
        if (idleFor > 3200) {
          const t = now / 1400;
          goal.x = w * 0.5 + Math.cos(t) * w * 0.3;
          goal.y = h * 0.34 + Math.sin(t * 1.4) * h * 0.2;
        }
        target.x += (goal.x - target.x) * 0.14;
        target.y += (goal.y - target.y) * 0.14;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = paperDeep;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(23, 20, 14, 0.06)";
        ctx.lineWidth = 1;
        for (let x = 40; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        ctx.strokeStyle = "rgba(23, 20, 14, 0.14)";
        ctx.beginPath();
        ctx.moveTo(0, 500);
        ctx.lineTo(w, 500);
        ctx.stroke();

        // crosshair target
        ctx.strokeStyle = signal;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = signal;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(target.x - 24, target.y);
        ctx.lineTo(target.x - 18, target.y);
        ctx.moveTo(target.x + 18, target.y);
        ctx.lineTo(target.x + 24, target.y);
        ctx.moveTo(target.x, target.y - 24);
        ctx.lineTo(target.x, target.y - 18);
        ctx.stroke();

        figures
          .slice()
          .sort((a, b) => a.y - b.y)
          .forEach((fig) => drawFigure(fig, now));

        ctx.fillStyle = "rgba(23, 20, 14, 0.45)";
        ctx.font = "500 11px 'IBM Plex Mono', monospace";
        ctx.fillText("POINTER POINTER · FAN BUILD", 20, h - 18);

        raf = requestAnimationFrame(render);
      };

      const offMove = on(cv, "pointermove", (event) => {
        const pos = window.UI.pointerPos(cv, event, w, h);
        goal.x = pos.x;
        goal.y = pos.y;
        lastMove = performance.now();
      });
      const offDown = on(cv, "pointerdown", (event) => {
        const pos = window.UI.pointerPos(cv, event, w, h);
        goal.x = pos.x;
        goal.y = pos.y;
        lastMove = performance.now();
      });

      raf = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(raf);
        offMove();
        offDown();
      };
    },
  });
})();
