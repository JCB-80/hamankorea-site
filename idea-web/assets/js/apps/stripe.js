/* stripe — 그라디언트를 만지는 도구 (Stripe 오마주) */
(function () {
  "use strict";

  const PRESETS = [
    { name: "노을", colors: ["--signal", "--t2", "--t1", "--t4"] },
    { name: "바다", colors: ["--t4", "--t3", "--t5", "--t2"] },
    { name: "종이", colors: ["--t1-soft", "--t2-soft", "--t4-soft", "--t3-soft"] },
  ];

  window.LAB.add({
    id: "stripe",
    name: "스트라이프",
    original: "Stripe",
    tier: "t2",
    tag: "그라디언트",
    blurb:
      "결제 회사의 홈페이지에서 배운 것: 배경 하나로도 사이트는 기억에 남습니다. 색 덩어리를 직접 끌어 보세요.",
    info: "메시 그라디언트 생성기",
    mount(root) {
      const { el, clamp, randInt, shuffle, copy, toast } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const palette = [
        css("--signal"),
        css("--t1"),
        css("--t2"),
        css("--t3"),
        css("--t4"),
        css("--t5"),
        css("--t-extra"),
      ];

      const stage = el("div", { class: "grad-stage", style: { "--grad-blur": "56px" } });
      const layers = el("div", { class: "grad-layers" });
      stage.append(layers);

      const code = el("code", { class: "grad-code" });
      const codeBox = el("pre", { class: "grad-code-box" }, code);

      let items = [];
      let nodes = [];
      let blur = 56;

      const cssText = () =>
        [
          "background:",
          ...items.map(
            (item, index) =>
              `  radial-gradient(${item.size}% ${item.size}% at ${item.x.toFixed(
                0
              )}% ${item.y.toFixed(0)}%, ${item.color} 0%, transparent 70%)${
                index === items.length - 1 ? ";" : ","
              }`
          ),
          "  #faf6ec;",
        ].join("\n");

      const sync = () => {
        items.forEach((item, index) => {
          const node = nodes[index];
          node.style.left = `${item.x}%`;
          node.style.top = `${item.y}%`;
          node.style.width = `${item.size}%`;
          node.style.height = `${item.size}%`;
          node.style.background = `radial-gradient(circle, ${item.color} 0%, transparent 68%)`;
          node.style.zIndex = String(index);
        });
        stage.style.setProperty("--grad-blur", `${blur}px`);
        code.textContent = cssText();
      };

      const build = (preset) => {
        const colors = preset ? preset.colors.map(css) : shuffle(palette).slice(0, 4);
        items = colors.map((color, index) => ({
          x: [20, 74, 44, 82][index] + randInt(-8, 8),
          y: [28, 22, 76, 66][index] + randInt(-8, 8),
          color,
          size: randInt(58, 96),
        }));
        layers.replaceChildren();
        nodes = items.map((item, index) => {
          const node = el("button", {
            class: "grad-blob",
            type: "button",
            "aria-label": `색 덩어리 ${index + 1} 옮기기`,
            dataset: { index: String(index) },
          });
          layers.append(node);
          return node;
        });
        sync();
      };

      const dragStart = (event) => {
        const node = event.target.closest(".grad-blob");
        if (!node) return;
        const index = Number(node.dataset.index);
        const rect = stage.getBoundingClientRect();
        node.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");

        const move = (ev) => {
          const item = items[index];
          item.x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100);
          item.y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100);
          sync();
        };
        const end = () => {
          stage.classList.remove("is-dragging");
          node.removeEventListener("pointermove", move);
          node.removeEventListener("pointerup", end);
          node.removeEventListener("pointercancel", end);
        };
        node.addEventListener("pointermove", move);
        node.addEventListener("pointerup", end);
        node.addEventListener("pointercancel", end);
      };

      stage.addEventListener("pointerdown", dragStart);

      const blurInput = el("input", {
        class: "grad-range",
        type: "range",
        min: "0",
        max: "100",
        value: "56",
        "aria-label": "흐림 정도",
        oninput: (event) => {
          blur = Number(event.target.value);
          sync();
        },
      });

      root.append(
        el(
          "div",
          { class: "lab grad-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "메시 그라디언트" }),
            el("span", { class: "lab-sub", text: "덩어리를 끌어서 배치하세요" })
          ),
          stage,
          el(
            "div",
            { class: "grad-controls" },
            el("button", {
              class: "btn btn--sm btn--primary",
              type: "button",
              text: "새 조합",
              onclick: () => build(),
            }),
            ...PRESETS.map((preset) =>
              el("button", {
                class: "btn btn--sm btn--ghost",
                type: "button",
                text: preset.name,
                onclick: () => build(preset),
              })
            ),
            el(
              "label",
              { class: "grad-blur" },
              el("span", { class: "hint", text: "흐림" }),
              blurInput
            ),
            el("button", {
              class: "btn btn--sm",
              type: "button",
              text: "CSS 복사",
              onclick: () => copy(cssText(), "CSS를 복사했습니다"),
            })
          ),
          codeBox
        )
      );

      build(PRESETS[0]);
      if (!document.querySelector("#grad-code-note")) {
        root.append(
          el("p", {
            class: "hint grad-note",
            id: "grad-code-note",
            text: "CSS는 근사치입니다. 실제 화면은 캔버스가 아니라 여러 겹의 그라디언트로 그립니다.",
          })
        );
      }
    },
  });
})();
