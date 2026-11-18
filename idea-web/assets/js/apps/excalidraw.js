/* excalidraw — 손으로 그리는 화이트보드 */
(function () {
  "use strict";

  const W = 900;
  const H = 520;

  window.LAB.add({
    id: "excalidraw",
    name: "엑스칼리드로",
    original: "Excalidraw",
    tier: "t4",
    tag: "화이트보드",
    blurb:
      "회의 중에 생각을 바로 그리는 도구. 손글씨처럼 삐뚤어도 괜찮다는 게 이 도구의 핵심입니다.",
    info: "드로잉, 화이트보드, 메모",
    mount(root) {
      const { el, canvas, pointerPos, download, toast } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const palette = [css("--ink"), css("--signal"), css("--t4"), css("--t2"), css("--t3")];

      let tool = "pen";
      let color = palette[0];
      let width = 3;
      let elements = [];
      let history = [];
      let draft = null;
      let drawing = false;

      const wrap = el("div", { class: "ex-wrap" });
      const { cv, ctx } = canvas(wrap, W, H);
      const toolbar = el("div", { class: "ex-toolbar" });
      const hint = el("span", { class: "hint ex-hint" });

      const clone = (value) => JSON.parse(JSON.stringify(value));

      const pushHistory = () => {
        history.push(clone(elements));
        if (history.length > 30) history.shift();
      };

      const drawElement = (target, item, preview) => {
        target.save();
        target.strokeStyle = item.color;
        target.fillStyle = "transparent";
        target.lineWidth = item.width;
        target.lineCap = "round";
        target.lineJoin = "round";
        if (item.type === "pen") {
          target.beginPath();
          item.points.forEach((point, index) => {
            if (index === 0) target.moveTo(point.x, point.y);
            else target.lineTo(point.x, point.y);
          });
          target.stroke();
        } else if (item.type === "rect") {
          target.strokeRect(
            Math.min(item.x0, item.x1),
            Math.min(item.y0, item.y1),
            Math.abs(item.x1 - item.x0),
            Math.abs(item.y1 - item.y0)
          );
        } else if (item.type === "ellipse") {
          const cx = (item.x0 + item.x1) / 2;
          const cy = (item.y0 + item.y1) / 2;
          target.beginPath();
          target.ellipse(cx, cy, Math.abs(item.x1 - item.x0) / 2, Math.abs(item.y1 - item.y0) / 2, 0, 0, Math.PI * 2);
          target.stroke();
        } else if (item.type === "arrow") {
          target.beginPath();
          target.moveTo(item.x0, item.y0);
          target.lineTo(item.x1, item.y1);
          target.stroke();
          const angle = Math.atan2(item.y1 - item.y0, item.x1 - item.x0);
          const head = 10 + item.width * 2;
          target.beginPath();
          target.moveTo(item.x1, item.y1);
          target.lineTo(item.x1 - head * Math.cos(angle - 0.42), item.y1 - head * Math.sin(angle - 0.42));
          target.moveTo(item.x1, item.y1);
          target.lineTo(item.x1 - head * Math.cos(angle + 0.42), item.y1 - head * Math.sin(angle + 0.42));
          target.stroke();
        } else if (item.type === "text") {
          target.fillStyle = item.color;
          target.font = `600 ${item.size}px "IBM Plex Sans KR", sans-serif`;
          target.textBaseline = "top";
          item.text.split("\n").forEach((line, index) => {
            target.fillText(line, item.x, item.y + index * item.size * 1.35);
          });
        }
        if (preview) target.globalAlpha = 0.9;
        target.restore();
      };

      const paint = (target) => {
        target.clearRect(0, 0, W, H);
        target.fillStyle = css("--paper-raised");
        target.fillRect(0, 0, W, H);
        target.strokeStyle = "rgba(23,20,14,.06)";
        target.lineWidth = 1;
        for (let x = 30; x < W; x += 30) {
          target.beginPath();
          target.moveTo(x, 0);
          target.lineTo(x, H);
          target.stroke();
        }
        for (let y = 30; y < H; y += 30) {
          target.beginPath();
          target.moveTo(0, y);
          target.lineTo(W, y);
          target.stroke();
        }
        elements.forEach((item) => drawElement(target, item, false));
        if (draft) drawElement(target, draft, true);
      };

      const point = (event) => pointerPos(cv, event, W, H);

      const near = (item, pt) => {
        if (item.type === "pen") {
          return item.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 14);
        }
        if (item.type === "text") {
          return (
            pt.x > item.x - 6 &&
            pt.x < item.x + item.size * Math.max(4, item.text.length * 0.62) &&
            pt.y > item.y - 6 &&
            pt.y < item.y + item.size * 1.6
          );
        }
        if (item.type === "arrow") {
          const dx = item.x1 - item.x0;
          const dy = item.y1 - item.y0;
          const length = Math.hypot(dx, dy) || 1;
          const t = Math.max(0, Math.min(1, ((pt.x - item.x0) * dx + (pt.y - item.y0) * dy) / (length * length)));
          return Math.hypot(item.x0 + dx * t - pt.x, item.y0 + dy * t - pt.y) < 12;
        }
        const x0 = Math.min(item.x0, item.x1) - 8;
        const x1 = Math.max(item.x0, item.x1) + 8;
        const y0 = Math.min(item.y0, item.y1) - 8;
        const y1 = Math.max(item.y0, item.y1) + 8;
        return pt.x > x0 && pt.x < x1 && pt.y > y0 && pt.y < y1;
      };

      const commit = () => {
        if (!draft) return;
        if (draft.type === "pen" && draft.points.length < 2) {
          draft = null;
          return;
        }
        elements.push(draft);
        draft = null;
        paint(ctx);
      };

      const textInput = el("input", {
        class: "ex-text-input",
        type: "text",
        placeholder: "메모",
        "aria-label": "글자 입력",
        hidden: true,
      });

      const finishText = (commitText) => {
        const value = textInput.value.trim();
        if (commitText && value) {
          elements.push({
            type: "text",
            x: draft.x,
            y: draft.y,
            text: value,
            color,
            size: 20,
          });
          paint(ctx);
        }
        textInput.hidden = true;
        draft = null;
      };

      textInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finishText(true);
        } else if (event.key === "Escape") {
          finishText(false);
        }
      });
      textInput.addEventListener("blur", () => {
        if (!textInput.hidden) finishText(true);
      });

      cv.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        const pt = point(event);
        if (tool === "eraser") {
          const index = elements
            .map((item, i) => [item, i])
            .reverse()
            .find(([item]) => near(item, pt));
          if (index) {
            pushHistory();
            elements.splice(index[1], 1);
            paint(ctx);
          }
          return;
        }
        if (tool === "text") {
          pushHistory();
          draft = { x: pt.x, y: pt.y };
          const rect = wrap.getBoundingClientRect();
          const scale = rect.width / W;
          textInput.style.left = `${pt.x * scale}px`;
          textInput.style.top = `${pt.y * scale}px`;
          textInput.style.fontSize = `${20 * scale}px`;
          textInput.value = "";
          textInput.hidden = false;
          textInput.focus();
          return;
        }
        event.preventDefault();
        cv.setPointerCapture(event.pointerId);
        drawing = true;
        pushHistory();
        if (tool === "pen") draft = { type: "pen", points: [pt], color, width };
        else draft = { type: tool, x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y, color, width };
        paint(ctx);
      });

      cv.addEventListener("pointermove", (event) => {
        if (!drawing || !draft) return;
        const pt = point(event);
        if (draft.type === "pen") draft.points.push(pt);
        else {
          draft.x1 = pt.x;
          draft.y1 = pt.y;
        }
        paint(ctx);
      });

      const end = () => {
        if (!drawing) return;
        drawing = false;
        commit();
      };
      cv.addEventListener("pointerup", end);
      cv.addEventListener("pointercancel", end);

      const tools = [
        ["pen", "펜", "p"],
        ["rect", "사각형", "r"],
        ["ellipse", "원", "o"],
        ["arrow", "화살표", "a"],
        ["text", "글자", "t"],
        ["eraser", "지우개", "e"],
      ];
      const toolButtons = tools.map(([key, label, shortcut]) =>
        el("button", {
          class: "ex-tool",
          type: "button",
          "aria-pressed": key === tool ? "true" : "false",
          dataset: { tool: key },
          title: `${label} (${shortcut.toUpperCase()})`,
          onclick: () => {
            tool = key;
            syncTools();
          },
        }, el("span", { text: label }))
      );

      const syncTools = () => {
        toolButtons.forEach((button) => {
          button.setAttribute("aria-pressed", button.dataset.tool === tool ? "true" : "false");
        });
        cv.style.cursor = tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair";
      };

      const swatches = palette.map((value) =>
        el("button", {
          class: "ex-swatch",
          type: "button",
          style: { background: value },
          "aria-label": `색 ${value}`,
          "aria-pressed": value === color ? "true" : "false",
          dataset: { color: value },
          onclick: () => {
            color = value;
            swatches.forEach((swatch) => {
              swatch.setAttribute("aria-pressed", swatch.dataset.color === value ? "true" : "false");
            });
          },
        })
      );

      const widths = [2, 4, 8].map((value) =>
        el("button", {
          class: "ex-width",
          type: "button",
          "aria-pressed": value === width ? "true" : "false",
          dataset: { width: String(value) },
          "aria-label": `선 굵기 ${value}`,
          onclick: () => {
            width = value;
            widths.forEach((button) => {
              button.setAttribute("aria-pressed", Number(button.dataset.width) === value ? "true" : "false");
            });
          },
        }, el("span", { style: { height: `${value}px` } }))
      );

      const undo = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "되돌리기",
        onclick: () => {
          if (!history.length) {
            toast("되돌릴 것이 없습니다");
            return;
          }
          elements = history.pop();
          paint(ctx);
        },
      });
      const clear = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "비우기",
        onclick: () => {
          pushHistory();
          elements = [];
          paint(ctx);
        },
      });
      const save = el("button", {
        class: "btn btn--sm btn--primary",
        type: "button",
        text: "PNG 저장",
        onclick: () => {
          const out = document.createElement("canvas");
          out.width = W;
          out.height = H;
          const octx = out.getContext("2d");
          paint(octx);
          out.toBlob((blob) => {
            if (blob) {
              download("shinbak-board.png", blob);
              toast("PNG를 저장했습니다");
            }
          }, "image/png");
        },
      });

      toolbar.append(
        el("div", { class: "ex-tools" }, ...toolButtons),
        el("div", { class: "ex-swatches" }, ...swatches),
        el("div", { class: "ex-widths" }, ...widths),
        el("div", { class: "ex-actions" }, undo, clear, save)
      );

      root.append(
        el(
          "div",
          { class: "lab ex-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "화이트보드" }),
            el("span", { class: "lab-sub", text: "그리고, 메모하고, PNG로 저장하세요" })
          ),
          toolbar,
          wrap,
          hint
        )
      );

      hint.textContent = "단축키 P R O A T E · Ctrl+Z 되돌리기";
      wrap.append(textInput);
      syncTools();
      paint(ctx);

      const onKey = (event) => {
        if (event.target.closest("input, textarea")) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          undo.click();
          return;
        }
        const map = { p: "pen", r: "rect", o: "ellipse", a: "arrow", t: "text", e: "eraser" };
        const next = map[event.key.toLowerCase()];
        if (next) {
          tool = next;
          syncTools();
        }
      };
      document.addEventListener("keydown", onKey);

      return () => document.removeEventListener("keydown", onKey);
    },
  });
})();
