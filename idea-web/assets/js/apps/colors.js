/* colors — 스페이스바로 만드는 팔레트 */
(function () {
  "use strict";

  const hslToHex = (h, s, l) => {
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const luminance = (hex) => {
    const value = hex.replace("#", "");
    const rgb = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
    const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };

  const SCHEMES = [
    [0, 28, 58, 188, 218],
    [0, 12, 168, 196, 340],
    [0, 42, 84, 160, 250],
    [0, 24, 48, 72, 180],
    [0, 150, 165, 180, 330],
  ];

  window.LAB.add({
    id: "colors",
    name: "리얼타임 컬러스",
    original: "Real-time Colors",
    tier: "t1",
    tag: "색 도구",
    blurb:
      "스페이스바를 누를 때마다 팔레트가 새로 태어납니다. 마음에 드는 색은 고정해 두고, 하나씩 복사하세요.",
    info: "색상 팔레트 생성기",
    mount(root) {
      const { el, randInt, pick, copy, store, icon, toast } = window.UI;

      const saved = store.get("colors.saved", []);
      let colors = [];
      let savedList = saved;

      const generate = (keepLocked = true) => {
        const scheme = pick(SCHEMES);
        const base = randInt(0, 359);
        colors = colors.length && keepLocked
          ? colors.map((color, index) =>
              color.locked
                ? color
                : {
                    h: (base + scheme[index] + randInt(-8, 8) + 360) % 360,
                    s: randInt(42, 78),
                    l: randInt(26, 72),
                    locked: false,
                  }
            )
          : scheme.map((offset, index) => ({
              h: (base + offset + randInt(-6, 6) + 360) % 360,
              s: randInt(42, 78),
              l: randInt(26, 72),
              locked: false,
            }));
      };

      const row = el("div", { class: "palette-row" });
      const savedHost = el("div", { class: "saved-row" });

      const renderSaved = () => {
        savedHost.replaceChildren(
          ...(savedList.length
            ? savedList.map((palette, index) =>
                el(
                  "button",
                  {
                    class: "saved-palette",
                    type: "button",
                    "aria-label": `저장한 팔레트 ${index + 1} 불러오기`,
                    onclick: () => {
                      colors = palette.map((hex) => {
                        const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
                        const r = rgb[0] / 255;
                        const g = rgb[1] / 255;
                        const b = rgb[2] / 255;
                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        const l = (max + min) / 2;
                        let h = 0;
                        let s = 0;
                        if (max !== min) {
                          const d = max - min;
                          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                          else if (max === g) h = ((b - r) / d + 2) * 60;
                          else h = ((r - g) / d + 4) * 60;
                        }
                        return { h, s: s * 100, l: l * 100, locked: false };
                      });
                      render();
                      toast("팔레트를 불러왔습니다");
                    },
                  },
                  ...palette.map((hex) => el("span", { style: { background: hex } }))
                )
              )
            : [el("p", { class: "hint", text: "저장한 팔레트가 아직 없습니다." })])
        );
      };

      const render = () => {
        row.replaceChildren(
          ...colors.map((color, index) => {
            const hex = hslToHex(color.h, color.s, color.l);
            const background = `hsl(${color.h} ${color.s}% ${color.l}%)`;
            const light = luminance(hex) > 0.55;
            return el(
              "div",
              {
                class: `swatch-col${light ? " is-light" : ""}`,
                style: { "--swatch": background },
                "data-hex": hex,
              },
              el("span", { class: "swatch-index mono", text: String(index + 1).padStart(2, "0") }),
              el("button", {
                class: "swatch-lock",
                type: "button",
                "aria-pressed": color.locked ? "true" : "false",
                "aria-label": `${hex} 고정 ${color.locked ? "해제" : "설정"}`,
                html: icon(color.locked ? "lock" : "unlock", 15),
                onclick: (event) => {
                  event.stopPropagation();
                  color.locked = !color.locked;
                  render();
                },
              }),
              el("button", {
                class: "swatch-body",
                type: "button",
                "aria-label": `${hex} 복사`,
                onclick: () => copy(hex.toUpperCase(), `${hex.toUpperCase()} 복사`),
              }),
              el(
                "div",
                { class: "swatch-meta" },
                el("strong", { class: "swatch-hex", text: hex.toUpperCase() }),
                el("span", { class: "swatch-hsl mono", text: `H${Math.round(color.h)} S${Math.round(color.s)} L${Math.round(color.l)}` })
              )
            );
          })
        );
      };

      const cssText = () =>
        `:root {\n${colors
          .map(
            (color, index) =>
              `  --palette-${index + 1}: ${hslToHex(color.h, color.s, color.l)}; /* hsl(${Math.round(
                color.h
              )} ${Math.round(color.s)}% ${Math.round(color.l)}%) */`
          )
          .join("\n")}\n}`;

      const toolbar = el(
        "div",
        { class: "palette-toolbar" },
        el("button", {
          class: "btn btn--sm btn--primary",
          type: "button",
          text: "새 팔레트",
          onclick: () => {
            generate();
            render();
          },
        }),
        el("button", {
          class: "btn btn--sm",
          type: "button",
          text: "CSS 복사",
          onclick: () => copy(cssText(), "팔레트 CSS를 복사했습니다"),
        }),
        el("button", {
          class: "btn btn--sm btn--ghost",
          type: "button",
          text: "저장",
          onclick: () => {
            const palette = colors.map((color) => hslToHex(color.h, color.s, color.l));
            savedList = [palette, ...savedList.filter((row) => row.join() !== palette.join())].slice(0, 8);
            store.set("colors.saved", savedList);
            renderSaved();
            toast("팔레트를 저장했습니다");
          },
        }),
        el("span", { class: "hint" }, "스페이스바", el("span", { class: "kbd", text: "Space" }))
      );

      root.append(
        el(
          "div",
          { class: "lab colors-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "오늘의 팔레트" }),
            el("span", { class: "lab-sub", text: "잠근 색은 그대로, 나머지만 바뀝니다" })
          ),
          row,
          toolbar,
          el(
            "div",
            { class: "saved-wrap" },
            el("div", { class: "lab-top" }, el("span", { class: "lab-h", text: "저장한 팔레트" })),
            savedHost
          )
        )
      );

      generate(false);
      render();
      renderSaved();

      const onKey = (event) => {
        if (event.target.closest("input, textarea, select")) return;
        if (event.code === "Space") {
          event.preventDefault();
          generate();
          render();
        }
      };
      document.addEventListener("keydown", onKey);

      return () => document.removeEventListener("keydown", onKey);
    },
  });
})();
