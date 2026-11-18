/* undraw — 도형으로 그리는 일러스트 생성기 (unDraw 오마주) */
(function () {
  "use strict";

  const SCENES = {
    desk: {
      name: "책상",
      draw: (c, rnd) => {
        const j = (n) => Math.round((rnd() * 2 - 1) * n);
        return `
<rect width="480" height="340" fill="${c.paper}"/>
<path d="M0 292h480" stroke="${c.ink}" stroke-width="1.5" opacity=".5"/>
<rect x="42" y="40" width="150" height="112" fill="none" stroke="${c.ink}" stroke-width="1.5"/>
<path d="M117 40v112M42 96h150" stroke="${c.ink}" stroke-width="1" opacity=".28"/>
<circle cx="160" cy="64" r="15" fill="${c.accent}" opacity=".28"/>
<path d="M42 152c20-26 40-26 60 0" stroke="${c.ink}" stroke-width="1" opacity=".28" fill="none"/>
<rect x="${70 + j(4)}" y="238" width="342" height="11" fill="${c.ink}"/>
<path d="M94 249v43M392 249v43" stroke="${c.ink}" stroke-width="4"/>
<rect x="250" y="150" width="118" height="78" rx="2" fill="${c.paper}" stroke="${c.ink}" stroke-width="2"/>
<rect x="260" y="160" width="98" height="58" fill="${c.accent}" opacity=".18"/>
<path d="M309 228v12M288 244h42" stroke="${c.ink}" stroke-width="3"/>
<circle cx="176" cy="174" r="25" fill="${c.paper}" stroke="${c.ink}" stroke-width="2"/>
<path d="M176 201c-24 0-36 16-38 40h76c-2-24-14-40-38-40z" fill="${c.accent}" opacity=".85"/>
<path d="M146 212c-16 8-24 20-24 30" fill="none" stroke="${c.ink}" stroke-width="3" stroke-linecap="round"/>
<path d="M206 212c14 6 22 16 24 26" fill="none" stroke="${c.ink}" stroke-width="3" stroke-linecap="round"/>
<rect x="214" y="222" width="16" height="16" rx="2" fill="${c.accent}" opacity=".5"/>
<path d="M414 238h-30l4 34h22z" fill="${c.ink}" opacity=".82"/>
<path d="M399 238c0-18 6-30 12-40M399 240c-12-8-18-18-20-28" fill="none" stroke="${c.ink}" stroke-width="2"/>
<ellipse cx="411" cy="196" rx="9" ry="16" fill="${c.accent}" opacity=".65" transform="rotate(24 411 196)"/>
<ellipse cx="379" cy="210" rx="8" ry="14" fill="${c.accent}" opacity=".4" transform="rotate(-30 379 210)"/>
`;
      },
    },
    plant: {
      name: "화분",
      draw: (c, rnd) => {
        const j = (n) => Math.round((rnd() * 2 - 1) * n);
        return `
<rect width="480" height="340" fill="${c.paper}"/>
<circle cx="380" cy="86" r="46" fill="${c.accent}" opacity=".18"/>
<path d="M0 292h480" stroke="${c.ink}" stroke-width="1.5" opacity=".5"/>
<rect x="0" y="292" width="480" height="48" fill="${c.ink}" opacity=".05"/>
<path d="M186 238h108l-12 54h-84z" fill="${c.accent}" opacity=".25" stroke="${c.ink}" stroke-width="2"/>
<path d="M196 238h88" stroke="${c.ink}" stroke-width="3"/>
<path d="M240 238c0-52 4-86 14-104M240 238c-10-36-24-58-40-72M240 238c10-28 28-46 48-54" fill="none" stroke="${c.ink}" stroke-width="2.4"/>
<ellipse cx="256" cy="132" rx="14" ry="26" fill="${c.accent}" opacity=".7" transform="rotate(18 256 132)"/>
<ellipse cx="252" cy="180" rx="12" ry="22" fill="${c.accent}" opacity=".45" transform="rotate(-32 252 180)"/>
<ellipse cx="200" cy="164" rx="12" ry="22" fill="${c.accent}" opacity=".55" transform="rotate(-48 200 164)"/>
<ellipse cx="290" cy="182" rx="11" ry="20" fill="${c.accent}" opacity=".5" transform="rotate(42 290 182)"/>
<path d="M78 ${274 + j(2)}h72l-8 18H86z" fill="${c.ink}" opacity=".7"/>
<path d="M112 274v-30M112 244c-10-6-16-14-18-22M112 250c10-4 16-12 18-20" fill="none" stroke="${c.ink}" stroke-width="2"/>
<circle cx="112" cy="240" r="7" fill="${c.accent}" opacity=".6"/>
<path d="M330 250c18-10 34-8 44 4" fill="none" stroke="${c.ink}" stroke-width="1.5" opacity=".45"/>
`;
      },
    },
    space: {
      name: "우주",
      draw: (c, rnd) => {
        let stars = "";
        for (let i = 0; i < 16; i += 1) {
          stars += `<circle cx="${Math.round(rnd() * 480)}" cy="${Math.round(
            rnd() * 220
          )}" r="${(rnd() * 1.6 + 0.6).toFixed(1)}" fill="${c.paper}" opacity="${(
            0.25 + rnd() * 0.5
          ).toFixed(2)}"/>`;
        }
        return `
<rect width="480" height="340" fill="${c.ink}"/>
${stars}
<circle cx="356" cy="118" r="82" fill="${c.accent}" opacity=".85"/>
<ellipse cx="356" cy="118" rx="126" ry="26" fill="none" stroke="${c.paper}" stroke-width="1.2" opacity=".55" transform="rotate(-16 356 118)"/>
<path d="M156 118c30 22 38 66 20 104h-48c-18-38-10-82 20-104z" fill="${c.paper}"/>
<path d="M156 118c10 8 16 16 20 26l-40 0c4-10 10-18 20-26z" fill="${c.accent}"/>
<circle cx="156" cy="166" r="13" fill="${c.ink}"/>
<circle cx="156" cy="166" r="8" fill="${c.accent}"/>
<path d="M128 196l-26 18 30 2M184 196l26 18-30 2" fill="${c.paper}"/>
<path d="M146 222h20l-10 34z" fill="${c.accent}" opacity=".9"/>
<path d="M258 268c14-12 30-12 44 0" fill="none" stroke="${c.paper}" stroke-width="1.4" opacity=".6"/>
`;
      },
    },
    walk: {
      name: "산책",
      draw: (c, rnd) => {
        const j = (n) => Math.round((rnd() * 2 - 1) * n);
        return `
<rect width="480" height="340" fill="${c.paper}"/>
<circle cx="382" cy="76" r="34" fill="${c.accent}" opacity=".28"/>
<path d="M0 278h480" stroke="${c.ink}" stroke-width="1.5"/>
<path d="M0 278c60-10 120-10 180 0M300 278c60-8 120-8 180 0" fill="none" stroke="${c.ink}" stroke-width="1" opacity=".25"/>
<rect x="92" y="176" width="9" height="102" fill="${c.ink}"/>
<circle cx="96" cy="158" r="34" fill="${c.accent}" opacity=".42"/>
<circle cx="74" cy="172" r="24" fill="${c.accent}" opacity=".28"/>
<circle cx="120" cy="172" r="26" fill="${c.accent}" opacity=".34"/>
<rect x="356" y="196" width="8" height="82" fill="${c.ink}"/>
<circle cx="360" cy="182" r="28" fill="${c.accent}" opacity=".32"/>
<circle cx="338" cy="192" r="18" fill="${c.accent}" opacity=".22"/>
<circle cx="252" cy="${152 + j(3)}" r="19" fill="${c.paper}" stroke="${c.ink}" stroke-width="2"/>
<path d="M252 173c-18 0-27 14-29 34h58c-2-20-11-34-29-34z" fill="${c.accent}"/>
<path d="M226 190c-12 6-18 16-18 26M278 190c12 6 18 16 18 26" fill="none" stroke="${c.ink}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M240 206l-12 34M264 206l10 34" stroke="${c.ink}" stroke-width="3" stroke-linecap="round"/>
<path d="M300 120c8-6 16-6 24 0M330 132c6-4 12-4 18 0" fill="none" stroke="${c.ink}" stroke-width="1.5" opacity=".45"/>
`;
      },
    },
  };

  window.LAB.add({
    id: "undraw",
    name: "언드로",
    original: "unDraw",
    tier: "t2",
    tag: "일러스트",
    blurb:
      "쓸 만한 무료 일러스트를 찾아 헤매는 대신, 도형으로 바로 만들어 봅니다. 색만 바꿔도 분위기가 달라집니다.",
    info: "절차적 SVG 일러스트",
    mount(root) {
      const { el, copy, download, toast, randInt } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();

      const style = {
        ink: css("--ink"),
        paper: css("--paper-raised"),
        paperDeep: css("--paper-deep"),
        accent: "#d8402a",
      };

      let sceneKey = "desk";
      let seed = randInt(1, 99999);
      let accent = "#d8402a";

      const stage = el("div", { class: "undraw-stage" });
      const code = el("code", { class: "undraw-code" });

      const hex = (value) => (/^#[0-9a-f]{6}$/i.test(value) ? value : "#d8402a");

      const svgMarkup = () => {
        const rnd = window.UI.seeded(seed);
        const inner = SCENES[sceneKey].draw(
          { ...style, accent: hex(accent) },
          rnd
        );
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 340" width="480" height="340" role="img" aria-label="${SCENES[sceneKey].name} 일러스트">${inner}</svg>`;
      };

      const render = () => {
        const markup = svgMarkup();
        stage.innerHTML = markup;
        code.textContent = markup.replace(/></g, ">\n<");
      };

      const tabs = el(
        "div",
        { class: "seg", role: "group", "aria-label": "장면" },
        ...Object.entries(SCENES).map(([key, scene]) =>
          el("button", {
            type: "button",
            text: scene.name,
            "aria-pressed": key === sceneKey ? "true" : "false",
            dataset: { scene: key },
            onclick: (event) => {
              sceneKey = key;
              tabs.querySelectorAll("button").forEach((button) => {
                button.setAttribute("aria-pressed", button.dataset.scene === key ? "true" : "false");
              });
              seed = randInt(1, 99999);
              render();
            },
          })
        )
      );

      const swatches = ["#d8402a", "#ad6f12", "#22625d", "#65731c", "#585a63", "#17140e"].map(
        (color) =>
          el("button", {
            class: "undraw-swatch",
            type: "button",
            style: { background: color },
            "aria-label": `강조색 ${color}`,
            onclick: () => {
              accent = color;
              colorInput.value = color;
              render();
            },
          })
      );

      const colorInput = el("input", {
        class: "undraw-color",
        type: "color",
        value: accent,
        "aria-label": "강조색 직접 고르기",
        oninput: (event) => {
          accent = event.target.value;
          render();
        },
      });

      root.append(
        el(
          "div",
          { class: "lab undraw-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "일러스트 생성기" }),
            el("span", { class: "lab-sub", text: "같은 장면도 매번 조금씩 달라집니다" })
          ),
          el(
            "div",
            { class: "undraw-bar" },
            tabs,
            el("div", { class: "undraw-colors" }, ...swatches, colorInput)
          ),
          stage,
          el(
            "div",
            { class: "undraw-actions" },
            el("button", {
              class: "btn btn--sm btn--primary",
              type: "button",
              text: "다시 생성",
              onclick: () => {
                seed = randInt(1, 99999);
                render();
              },
            }),
            el("button", {
              class: "btn btn--sm",
              type: "button",
              text: "SVG 저장",
              onclick: () => {
                download(`shinbak-${sceneKey}.svg`, svgMarkup(), "image/svg+xml");
                toast("SVG 파일을 저장했습니다");
              },
            }),
            el("button", {
              class: "btn btn--sm btn--ghost",
              type: "button",
              text: "코드 복사",
              onclick: () => copy(svgMarkup(), "SVG 코드를 복사했습니다"),
            })
          ),
          el("details", { class: "undraw-details" }, el("summary", { text: "SVG 코드 보기" }), el("pre", { class: "grad-code-box" }, code))
        )
      );

      render();
    },
  });
})();
