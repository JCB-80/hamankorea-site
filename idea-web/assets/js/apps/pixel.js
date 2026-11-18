/* pixel — 20x20 픽셀 아트 스튜디오 */
(function () {
  "use strict";

  const SIZE = 20;
  const CELL = 24;
  const COLORS = [
    "#17140e",
    "#4b463a",
    "#86512f",
    "#d8402a",
    "#bf3a23",
    "#ad6f12",
    "#f2e4c6",
    "#65731c",
    "#22625d",
    "#d4e4e1",
    "#2f5d8a",
    "#e9f2ef",
    "#f6dcd4",
    "#9fb6bb",
    "#faf6ec",
    "#ffffff",
  ];

  window.LAB.add({
    id: "pixel",
    name: "픽셀 쏘츠",
    original: "Pixel Shots",
    tier: "t3",
    tag: "픽셀 아트",
    blurb:
      "20×20 격자에 찍고 칠하고 지우면 끝. 도트 하나하나가 그림이 되는 걸 몇 초 만에 경험합니다.",
    info: "도트 그림, PNG 저장",
    mount(root) {
      const { el, canvas, download, toast, store } = window.UI;
      const KEY = "pixel.board";
      let pixels = store.get(KEY, new Array(SIZE * SIZE).fill(null));
      if (!Array.isArray(pixels) || pixels.length !== SIZE * SIZE) {
        pixels = new Array(SIZE * SIZE).fill(null);
      }
      let color = COLORS[3];
      let tool = "pencil";
      let mirror = false;
      let drawing = false;
      let history = [];

      const { cv, ctx, w } = canvas(null, SIZE * CELL, SIZE * CELL);
      const stage = el("div", { class: "pixel-canvas" }, cv);
      const palette = el("div", { class: "pixel-palette", role: "group", "aria-label": "색상" });
      const counter = el("span", { class: "mono" });
      const mirrorBox = el("input", { type: "checkbox", id: "pixel-mirror" });

      const indexOf = (x, y) => y * SIZE + x;

      const render = () => {
        ctx.clearRect(0, 0, w, w);
        ctx.fillStyle = "#faf6ec";
        ctx.fillRect(0, 0, w, w);
        for (let y = 0; y < SIZE; y += 1) {
          for (let x = 0; x < SIZE; x += 1) {
            const value = pixels[indexOf(x, y)];
            if (value) {
              ctx.fillStyle = value;
              ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            }
          }
        }
        ctx.strokeStyle = "rgba(23, 20, 14, 0.1)";
        ctx.lineWidth = 1;
        for (let i = 1; i < SIZE; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * CELL + 0.5, 0);
          ctx.lineTo(i * CELL + 0.5, w);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * CELL + 0.5);
          ctx.lineTo(w, i * CELL + 0.5);
          ctx.stroke();
        }
        counter.textContent = `${pixels.filter(Boolean).length} / ${SIZE * SIZE} 칸`;
      };

      const snapshot = () => {
        history.push(pixels.slice());
        if (history.length > 40) history.shift();
      };

      const paintAt = (x, y) => {
        if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
        const value = tool === "eraser" ? null : color;
        pixels[indexOf(x, y)] = value;
        if (mirror) pixels[indexOf(SIZE - 1 - x, y)] = value;
      };

      const fillAt = (x, y) => {
        if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
        const target = pixels[indexOf(x, y)];
        if (target === color) return;
        const stack = [[x, y]];
        while (stack.length) {
          const [cx, cy] = stack.pop();
          if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) continue;
          if (pixels[indexOf(cx, cy)] !== target) continue;
          pixels[indexOf(cx, cy)] = color;
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
      };

      const cellFrom = (event) => {
        const rect = cv.getBoundingClientRect();
        const x = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
        const y = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
        return { x, y };
      };

      cv.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        cv.setPointerCapture(event.pointerId);
        drawing = true;
        snapshot();
        const { x, y } = cellFrom(event);
        if (tool === "fill") {
          fillAt(x, y);
        } else {
          paintAt(x, y);
        }
        render();
      });

      cv.addEventListener("pointermove", (event) => {
        if (!drawing || tool === "fill") return;
        const { x, y } = cellFrom(event);
        paintAt(x, y);
        render();
      });

      const stop = () => {
        if (!drawing) return;
        drawing = false;
        store.set(KEY, pixels);
      };
      cv.addEventListener("pointerup", stop);
      cv.addEventListener("pointercancel", stop);
      cv.addEventListener("pointerleave", stop);

      const toolButtons = [
        ["pencil", "연필"],
        ["eraser", "지우개"],
        ["fill", "채우기"],
      ].map(([key, label]) =>
        el("button", {
          class: "pixel-tool",
          type: "button",
          text: label,
          "aria-pressed": key === tool ? "true" : "false",
          dataset: { tool: key },
          onclick: () => {
            tool = key;
            toolButtons.forEach((button) => {
              button.setAttribute("aria-pressed", button.dataset.tool === key ? "true" : "false");
            });
          },
        })
      );

      COLORS.forEach((value) => {
        palette.append(
          el("button", {
            class: `pixel-swatch${value === color ? " is-active" : ""}`,
            type: "button",
            style: { background: value },
            "aria-label": `색 ${value}`,
            "aria-pressed": value === color ? "true" : "false",
            dataset: { color: value },
            onclick: (event) => {
              color = value;
              tool = "pencil";
              toolButtons.forEach((button) => {
                button.setAttribute("aria-pressed", button.dataset.tool === "pencil" ? "true" : "false");
              });
              palette.querySelectorAll(".pixel-swatch").forEach((swatch) => {
                const active = swatch.dataset.color === value;
                swatch.classList.toggle("is-active", active);
                swatch.setAttribute("aria-pressed", active ? "true" : "false");
              });
              event.currentTarget.focus();
            },
          })
        );
      });

      mirrorBox.addEventListener("change", () => {
        mirror = mirrorBox.checked;
      });

      const undo = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "되돌리기",
        onclick: () => {
          const previous = history.pop();
          if (!previous) {
            toast("되돌릴 것이 없습니다");
            return;
          }
          pixels = previous;
          render();
          store.set(KEY, pixels);
        },
      });

      const clear = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "비우기",
        onclick: () => {
          snapshot();
          pixels = new Array(SIZE * SIZE).fill(null);
          render();
          store.set(KEY, pixels);
        },
      });

      const save = el("button", {
        class: "btn btn--sm btn--primary",
        type: "button",
        text: "PNG 저장",
        onclick: () => {
          const out = document.createElement("canvas");
          out.width = SIZE * 16;
          out.height = SIZE * 16;
          const octx = out.getContext("2d");
          octx.imageSmoothingEnabled = false;
          for (let y = 0; y < SIZE; y += 1) {
            for (let x = 0; x < SIZE; x += 1) {
              const value = pixels[indexOf(x, y)];
              if (!value) continue;
              octx.fillStyle = value;
              octx.fillRect(x * 16, y * 16, 16, 16);
            }
          }
          out.toBlob((blob) => {
            if (blob) {
              download("shinbak-pixel.png", blob);
              toast("PNG를 저장했습니다");
            }
          }, "image/png");
        },
      });

      root.append(
        el(
          "div",
          { class: "lab pixel-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "픽셀 아트" }),
            counter
          ),
          el(
            "div",
            { class: "pixel-grid" },
            stage,
            el(
              "aside",
              { class: "pixel-side" },
              el("div", { class: "pixel-tools" }, ...toolButtons),
              el("p", { class: "hint", text: "색을 고르고 칸을 칠하세요. 끌면 이어집니다." }),
              palette,
              el(
                "label",
                { class: "pixel-mirror", for: "pixel-mirror" },
                mirrorBox,
                el("span", { text: "좌우 대칭" })
              ),
              el("div", { class: "pixel-actions" }, undo, clear),
              save
            )
          )
        )
      );

      render();
    },
  });
})();
