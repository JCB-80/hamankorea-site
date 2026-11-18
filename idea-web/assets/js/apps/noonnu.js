/* noonnu — 무료 한글 폰트를 바로 비교하는 도구 */
(function () {
  "use strict";

  const FONTS = [
    { id: "black", name: "검은고딕", family: "Black Han Sans", cat: "디스플레이", weights: [400] },
    { id: "dohyeon", name: "도현", family: "Do Hyeon", cat: "디스플레이", weights: [400] },
    { id: "jua", name: "주아", family: "Jua", cat: "디스플레이", weights: [400] },
    { id: "gugi", name: "구기", family: "Gugi", cat: "디스플레이", weights: [400] },
    { id: "nanumgothic", name: "나눔고딕", family: "Nanum Gothic", cat: "고딕", weights: [400, 700, 800] },
    { id: "nanummyeongjo", name: "나눔명조", family: "Nanum Myeongjo", cat: "명조", weights: [400, 700, 800] },
    { id: "gowunbatang", name: "고운바탕", family: "Gowun Batang", cat: "명조", weights: [400, 700] },
    { id: "songmyung", name: "송명", family: "Song Myung", cat: "명조", weights: [400] },
    { id: "gowundodum", name: "고운돋움", family: "Gowun Dodum", cat: "고딕", weights: [400] },
    { id: "nanumpen", name: "나눔손글씨 펜", family: "Nanum Pen Script", cat: "손글씨", weights: [400] },
    { id: "nanumbrush", name: "나눔손글씨 붓", family: "Nanum Brush Script", cat: "손글씨", weights: [400] },
    { id: "gaegu", name: "개구", family: "Gaegu", cat: "손글씨", weights: [300, 400, 700] },
    { id: "yeonsung", name: "연성", family: "Yeon Sung", cat: "손글씨", weights: [400] },
    { id: "poorstory", name: "푸어스토리", family: "Poor Story", cat: "손글씨", weights: [400] },
    { id: "himelody", name: "하이멜로디", family: "Hi Melody", cat: "손글씨", weights: [400] },
    { id: "singleday", name: "싱글데이", family: "Single Day", cat: "디스플레이", weights: [400] },
    { id: "eastsea", name: "동해독도", family: "East Sea Dokdo", cat: "손글씨", weights: [400] },
    { id: "cutefont", name: "큐트폰트", family: "Cute Font", cat: "디스플레이", weights: [400] },
    { id: "plexkr", name: "IBM 플렉스 산스", family: "IBM Plex Sans KR", cat: "고딕", weights: [300, 400, 600, 700] },
    { id: "notokr", name: "노토 산스", family: "Noto Sans KR", cat: "고딕", weights: [300, 400, 600, 900] },
  ];

  const SAMPLES = [
    ["제목", "신박한 웹, 직접 만져보기"],
    ["본문", "영상에서 소개한 23곳의 기능을 브라우저에서 그대로 체험할 수 있게 다시 만들었습니다."],
    ["판그램", "다람쥐 헌 쳇바퀴에 타고파\n키스의 고유 조건은 입술끼리 만나야 하고 특별한 기술이 필요하다."],
  ];

  window.LAB.add({
    id: "noonnu",
    name: "눈누",
    original: "Noonnu",
    tier: "t1",
    tag: "폰트 도구",
    blurb:
      "무료 한글 폰트를 고르는 일은 늘 어렵습니다. 문장을 넣고 크기와 자간을 바꿔 보며 눈으로 결정하세요.",
    info: "폰트 미리보기, 자간, 굵기",
    mount(root) {
      const { el, copy, toast, clamp } = window.UI;
      const loaded = new Set();
      const state = {
        fontId: "nanumgothic",
        size: 52,
        weight: 400,
        tracking: 0,
        leading: 1.28,
        dark: false,
        text: SAMPLES[0][1],
      };

      const byId = (id) => FONTS.find((font) => font.id === id);
      const current = () => byId(state.fontId);

      const loadFont = (font) => {
        if (loaded.has(font.id)) return;
        loaded.add(font.id);
        const family = font.family.replace(/ /g, "+");
        const weights = font.weights.length > 1 ? `:wght@${font.weights.join(";")}` : "";
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${family}${weights}&display=swap`;
        link.dataset.font = font.id;
        document.head.appendChild(link);
      };

      const list = el("div", { class: "noonnu-list", role: "listbox", "aria-label": "폰트 목록" });
      const preview = el("textarea", {
        class: "noonnu-preview-text",
        "aria-label": "미리보기 문장",
        spellcheck: "false",
        rows: "3",
      });
      preview.value = state.text;
      const meta = el("div", { class: "noonnu-meta" });
      const sizeOut = el("output", { class: "mono", text: `${state.size}px` });
      const trackOut = el("output", { class: "mono", text: "0" });
      const leadOut = el("output", { class: "mono", text: "1.28" });
      const weightSelect = el("select", { class: "select", "aria-label": "굵기" });
      const stage = el("div", { class: "noonnu-stage" });

      const renderList = () => {
        list.replaceChildren(
          ...FONTS.map((font) => {
            const active = font.id === state.fontId;
            return el(
              "button",
              {
                class: `noonnu-item${active ? " is-active" : ""}`,
                type: "button",
                role: "option",
                "aria-selected": active ? "true" : "false",
                onclick: () => {
                  state.fontId = font.id;
                  if (!font.weights.includes(state.weight)) {
                    state.weight = font.weights.includes(400) ? 400 : font.weights[0];
                  }
                  loadFont(font);
                  renderList();
                  render();
                  toast(`${font.name} 적용`);
                },
              },
              el("span", { class: "noonnu-item-name", text: font.name }),
              el("span", { class: "noonnu-item-cat mono", text: font.cat })
            );
          })
        );
      };

      const renderWeight = () => {
        const font = current();
        weightSelect.replaceChildren(
          ...font.weights.map((weight) =>
            el("option", { value: String(weight), text: String(weight), selected: weight === state.weight })
          )
        );
        weightSelect.disabled = font.weights.length === 1;
      };

      const render = () => {
        const font = current();
        preview.style.fontFamily = `"${font.family}", var(--font-sans)`;
        preview.style.fontSize = `${state.size}px`;
        preview.style.fontWeight = String(state.weight);
        preview.style.letterSpacing = `${state.tracking / 100}em`;
        preview.style.lineHeight = String(state.leading);
        stage.classList.toggle("is-dark", state.dark);
        meta.replaceChildren(
          el("strong", { text: font.name }),
          el("span", { class: "mono", text: font.family }),
          el("span", { class: "badge", text: `${font.cat} · ${font.weights.join(" / ")}` }),
          el("span", { class: "hint", text: "Google Fonts · OFL" })
        );
        renderWeight();
      };

      FONTS.forEach((font) => {
        if (font.id === state.fontId) loadFont(font);
      });

      const sizeInput = el("input", {
        class: "noonnu-range",
        type: "range",
        min: "14",
        max: "120",
        value: String(state.size),
        "aria-label": "글자 크기",
        oninput: (event) => {
          state.size = Number(event.target.value);
          sizeOut.textContent = `${state.size}px`;
          render();
        },
      });

      const trackInput = el("input", {
        class: "noonnu-range",
        type: "range",
        min: "-5",
        max: "20",
        value: "0",
        "aria-label": "자간",
        oninput: (event) => {
          state.tracking = Number(event.target.value);
          trackOut.textContent = String(state.tracking);
          render();
        },
      });

      const leadInput = el("input", {
        class: "noonnu-range",
        type: "range",
        min: "100",
        max: "220",
        value: "128",
        "aria-label": "줄 간격",
        oninput: (event) => {
          state.leading = clamp(Number(event.target.value) / 100, 1, 2.2);
          leadOut.textContent = state.leading.toFixed(2);
          render();
        },
      });

      weightSelect.addEventListener("change", () => {
        state.weight = Number(weightSelect.value);
        render();
      });

      preview.addEventListener("input", () => {
        state.text = preview.value;
      });

      const cssSnippet = () =>
        [
          `font-family: "${current().family}", sans-serif;`,
          `font-weight: ${state.weight};`,
          `font-size: ${state.size}px;`,
          `letter-spacing: ${state.tracking / 100}em;`,
          `line-height: ${state.leading};`,
        ].join("\n");

      const importSnippet = () => {
        const font = current();
        const family = font.family.replace(/ /g, "+");
        const weights = font.weights.length > 1 ? `:wght@${font.weights.join(";")}` : "";
        return `@import url("https://fonts.googleapis.com/css2?family=${family}${weights}&display=swap");`;
      };

      root.append(
        el(
          "div",
          { class: "lab noonnu-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "폰트 미리보기" }),
            el("span", { class: "lab-sub", text: "고른 폰트만 내려받습니다 · 20종" })
          ),
          el(
            "div",
            { class: "noonnu-grid" },
            list,
            el(
              "div",
              { class: "noonnu-main" },
              el(
                "div",
                { class: "noonnu-samples" },
                ...SAMPLES.map(([label, text]) =>
                  el("button", {
                    class: "btn btn--sm btn--ghost",
                    type: "button",
                    text: label,
                    onclick: () => {
                      preview.value = text;
                      state.text = text;
                      render();
                    },
                  })
                ),
                el(
                  "label",
                  { class: "noonnu-dark" },
                  el("input", {
                    type: "checkbox",
                    onchange: (event) => {
                      state.dark = event.target.checked;
                      render();
                    },
                  }),
                  el("span", { text: "어두운 배경" })
                )
              ),
              stage,
              el(
                "div",
                { class: "noonnu-controls" },
                el(
                  "label",
                  { class: "noonnu-control" },
                  el("span", { class: "hint", text: "크기" }),
                  sizeInput,
                  sizeOut
                ),
                el(
                  "label",
                  { class: "noonnu-control" },
                  el("span", { class: "hint", text: "자간" }),
                  trackInput,
                  trackOut
                ),
                el(
                  "label",
                  { class: "noonnu-control" },
                  el("span", { class: "hint", text: "줄 간격" }),
                  leadInput,
                  leadOut
                ),
                el(
                  "label",
                  { class: "noonnu-control" },
                  el("span", { class: "hint", text: "굵기" }),
                  weightSelect
                )
              ),
              meta,
              el(
                "div",
                { class: "noonnu-actions" },
                el("button", {
                  class: "btn btn--sm btn--primary",
                  type: "button",
                  text: "CSS 복사",
                  onclick: () => copy(cssSnippet(), "CSS를 복사했습니다"),
                }),
                el("button", {
                  class: "btn btn--sm",
                  type: "button",
                  text: "@import 복사",
                  onclick: () => copy(importSnippet(), "@import를 복사했습니다"),
                })
              )
            )
          )
        )
      );

      stage.append(preview);
      renderList();
      render();
    },
  });
})();
