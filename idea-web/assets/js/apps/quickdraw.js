/* quickdraw — 한 획으로 그린 그림을 알아맞히는 게임 */
(function () {
  "use strict";

  const SHAPES = [
    { id: "circle", name: "동그라미", make: () => circlePoints() },
    { id: "triangle", name: "세모", make: () => polygonPoints(3) },
    { id: "square", name: "네모", make: () => polygonPoints(4) },
    { id: "star", name: "별", make: () => starPoints() },
    { id: "zigzag", name: "지그재그", make: () => zigzagPoints() },
    { id: "heart", name: "하트", make: () => heartPoints() },
  ];

  function circlePoints() {
    const points = [];
    for (let i = 0; i <= 48; i += 1) {
      const angle = (i / 48) * Math.PI * 2 - Math.PI / 2;
      points.push({ x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 });
    }
    return points;
  }

  function polygonPoints(sides) {
    const points = [];
    for (let i = 0; i <= sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      points.push({ x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 });
    }
    return points;
  }

  function starPoints() {
    const points = [];
    for (let i = 0; i <= 10; i += 1) {
      const radius = i % 2 === 0 ? 100 : 44;
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return points;
  }

  function zigzagPoints() {
    return [0, 1, 2, 3, 4, 5].map((i) => ({
      x: i * 50,
      y: i % 2 === 0 ? 50 : -50,
    }));
  }

  function heartPoints() {
    const points = [];
    for (let i = 0; i <= 64; i += 1) {
      const t = (i / 64) * Math.PI * 2;
      points.push({
        x: 12 * Math.pow(Math.sin(t), 3) * 9,
        y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 9,
      });
    }
    return points;
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function pathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i += 1) length += dist(points[i - 1], points[i]);
    return length;
  }

  function centroid(points) {
    let x = 0;
    let y = 0;
    points.forEach((point) => {
      x += point.x;
      y += point.y;
    });
    return { x: x / points.length, y: y / points.length };
  }

  function bbox(points) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  function resample(points, n = 64) {
    const pts = points.map((point) => ({ x: point.x, y: point.y }));
    if (pts.length < 2) return pts;
    const interval = pathLength(pts) / (n - 1);
    if (!interval) return pts;
    let D = 0;
    const out = [{ x: pts[0].x, y: pts[0].y }];
    for (let i = 1; i < pts.length; i += 1) {
      const d = dist(pts[i - 1], pts[i]);
      if (d <= 0) continue;
      if (D + d >= interval) {
        const t = (interval - D) / d;
        const next = {
          x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x),
          y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y),
        };
        out.push(next);
        pts.splice(i, 0, next);
        D = 0;
      } else {
        D += d;
      }
    }
    while (out.length < n) out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
    return out.slice(0, n);
  }

  function rotateBy(points, angle) {
    const c = centroid(points);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return points.map((point) => {
      const dx = point.x - c.x;
      const dy = point.y - c.y;
      return { x: dx * cos - dy * sin + c.x, y: dx * sin + dy * cos + c.y };
    });
  }

  function rotateToZero(points) {
    const c = centroid(points);
    const angle = Math.atan2(c.y - points[0].y, c.x - points[0].x);
    return rotateBy(points, -angle);
  }

  function scaleToSquare(points, size = 250) {
    const box = bbox(points);
    const scaleX = box.width > 0 ? size / box.width : 1;
    const scaleY = box.height > 0 ? size / box.height : 1;
    return points.map((point) => ({
      x: (point.x - box.minX) * scaleX,
      y: (point.y - box.minY) * scaleY,
    }));
  }

  function translateToOrigin(points) {
    const c = centroid(points);
    return points.map((point) => ({ x: point.x - c.x, y: point.y - c.y }));
  }

  function preprocess(points, size = 250) {
    return translateToOrigin(scaleToSquare(rotateToZero(resample(points, 64)), size));
  }

  function pathDistance(a, b) {
    let d = 0;
    for (let i = 0; i < a.length; i += 1) d += dist(a[i], b[i]);
    return d / a.length;
  }

  function distanceAtBestAngle(points, template, a = -0.785, b = 0.785, threshold = 0.0349) {
    const phi = 0.5 * (Math.sqrt(5) - 1);
    let x1 = phi * a + (1 - phi) * b;
    let f1 = pathDistance(rotateBy(points, x1), template);
    let x2 = (1 - phi) * a + phi * b;
    let f2 = pathDistance(rotateBy(points, x2), template);
    while (Math.abs(b - a) > threshold) {
      if (f1 < f2) {
        b = x2;
        x2 = x1;
        f2 = f1;
        x1 = phi * a + (1 - phi) * b;
        f1 = pathDistance(rotateBy(points, x1), template);
      } else {
        a = x1;
        x1 = x2;
        f1 = f2;
        x2 = (1 - phi) * a + phi * b;
        f2 = pathDistance(rotateBy(points, x2), template);
      }
    }
    return Math.min(f1, f2);
  }

  const templates = SHAPES.map((shape) => ({
    id: shape.id,
    name: shape.name,
    points: preprocess(shape.make()),
  }));

  function recognize(points) {
    const candidate = preprocess(points);
    let best = { id: null, name: null, score: 0 };
    templates.forEach((template) => {
      const distance = distanceAtBestAngle(candidate, template.points);
      const score = 1 - distance / (0.5 * Math.sqrt(2 * 250 * 250));
      if (score > best.score) best = { id: template.id, name: template.name, score };
    });
    return best;
  }

  // exposed for verification scripts; harmless in production
  window.__QD_TEST = { recognize, templates, shapes: SHAPES };

  window.LAB.add({
    id: "quickdraw",
    name: "퀵 드로우",
    original: "Quick, Draw!",
    tier: "t3",
    tag: "낙서 인식",
    blurb:
      "20초 안에 제시된 모양을 한 획으로 그리면 브라우저가 알아맞힙니다. 생각보다 손이 어렵습니다.",
    info: "필기 인식, $1 인식기",
    mount(root) {
      const { el, canvas, pointerPos, clamp, shuffle, toast } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const signal = css("--signal");
      const ok = css("--ok");

      const ROUNDS = 8;
      const queue = [];
      while (queue.length < ROUNDS) queue.push(...shuffle(SHAPES));

      let round = 0;
      let score = 0;
      let attempts = 0;
      let drawing = false;
      let points = [];
      let locked = false;
      const timers = [];

      const targetLabel = el("strong", { class: "qd-target" });
      const roundLabel = el("span", { class: "mono" });
      const scoreLabel = el("span", { class: "mono" });
      const feedback = el("p", { class: "qd-feedback", "aria-live": "polite" });
      const stage = el("div", { class: "qd-stage" });
      const { cv, ctx, w, h } = canvas(stage, 720, 420);

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(23,20,14,.07)";
        ctx.lineWidth = 1;
        for (let x = 60; x < w; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 60; y < h; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        if (points.length) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
      };

      const setRound = () => {
        attempts = 0;
        points = [];
        locked = false;
        targetLabel.textContent = queue[round].name;
        roundLabel.textContent = `${round + 1} / ${ROUNDS}`;
        scoreLabel.textContent = `${score}점`;
        feedback.textContent = "한 획으로 그려 주세요.";
        draw();
      };

      const next = () => {
        round += 1;
        if (round >= ROUNDS) {
          finish();
          return;
        }
        setRound();
      };

      const finish = () => {
        locked = true;
        feedback.textContent = "";
        const overlay = el(
          "div",
          { class: "qd-overlay" },
          el("span", { class: "mono", text: "결과" }),
          el("strong", { class: "qd-score", text: `${score} / ${ROUNDS}` }),
          el("p", {
            text:
              score >= 7
                ? "손끝이 인공지능보다 빠릅니다."
                : score >= 4
                ? "절반은 통했습니다. 한 번 더?"
                : "인식기는 아직 당신을 모릅니다.",
          }),
          el("button", {
            class: "btn btn--primary",
            type: "button",
            text: "다시 도전",
            onclick: () => {
              round = 0;
              score = 0;
              queue.length = 0;
              while (queue.length < ROUNDS) queue.push(...shuffle(SHAPES));
              overlay.remove();
              setRound();
            },
          })
        );
        stage.append(overlay);
      };

      const evaluate = () => {
        if (points.length < 6) {
          toast("조금 더 길게 그려 주세요");
          points = [];
          draw();
          return;
        }
        const result = recognize(points);
        const target = queue[round];
        const matched = result.id === target.id && result.score > 0.46;

        if (matched) {
          score += 1;
          scoreLabel.textContent = `${score}점`;
          feedback.textContent = `정답! ${result.name}으로 읽었습니다 (${(result.score * 100).toFixed(0)}%)`;
          feedback.classList.add("is-ok");
          locked = true;
          timers.push(window.setTimeout(() => {
            feedback.classList.remove("is-ok");
            next();
          }, 1000));
          return;
        }

        attempts += 1;
        if (attempts >= 2) {
          feedback.textContent = `아쉽습니다. ${result.name || "무언가"}로 읽혔습니다. 정답은 ${target.name}.`;
          locked = true;
          timers.push(window.setTimeout(next, 1300));
        } else {
          feedback.textContent = `${result.name || "무언가"}로 보입니다. 한 번 더 그려 보세요.`;
          timers.push(window.setTimeout(() => {
            points = [];
            draw();
          }, 650));
        }
      };

      const start = (event) => {
        if (locked) return;
        event.preventDefault();
        cv.setPointerCapture(event.pointerId);
        drawing = true;
        points = [pointerPos(cv, event, w, h)];
        draw();
      };
      const move = (event) => {
        if (!drawing || locked) return;
        points.push(pointerPos(cv, event, w, h));
        draw();
      };
      const end = (event) => {
        if (!drawing) return;
        drawing = false;
        try {
          cv.releasePointerCapture(event.pointerId);
        } catch (err) {
          /* pointer may already be released */
        }
        evaluate();
      };

      cv.addEventListener("pointerdown", start);
      cv.addEventListener("pointermove", move);
      cv.addEventListener("pointerup", end);
      cv.addEventListener("pointercancel", end);

      const clear = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "다시 그리기",
        onclick: () => {
          if (locked) return;
          points = [];
          draw();
        },
      });
      const skip = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "건너뛰기",
        onclick: () => {
          if (locked) return;
          feedback.textContent = `정답은 ${queue[round].name}였습니다.`;
          next();
        },
      });

      root.append(
        el(
          "div",
          { class: "lab qd-lab" },
          el(
            "div",
            { class: "qd-head" },
            el("div", { class: "qd-prompt" }, el("span", { class: "hint", text: "이걸 그려 보세요" }), targetLabel),
            el("div", { class: "qd-meta" }, roundLabel, scoreLabel)
          ),
          stage,
          el(
            "div",
            { class: "qd-foot" },
            feedback,
            el("div", { class: "row" }, clear, skip)
          )
        )
      );

      setRound();
      draw();

      return () => timers.forEach((timer) => window.clearTimeout(timer));
    },
  });
})();
