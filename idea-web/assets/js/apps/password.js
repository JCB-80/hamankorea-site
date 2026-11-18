/* password — 규칙이 계속 늘어나는 비밀번호 */
(function () {
  "use strict";

  const today = (() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  })();

  const RULES = [
    { text: "8자 이상", test: (v) => v.length >= 8 },
    { text: "숫자를 하나 이상", test: (v) => /\d/.test(v) },
    { text: "영문 대문자를 하나 이상", test: (v) => /[A-Z]/.test(v) },
    { text: "특수문자를 하나 이상", test: (v) => /[^A-Za-z0-9가-힣]/.test(v) },
    {
      text: "숫자의 합이 정확히 25",
      test: (v) =>
        Array.from(v)
          .filter((ch) => /\d/.test(ch))
          .reduce((sum, ch) => sum + Number(ch), 0) === 25,
    },
    { text: "로마 숫자(I, V, X, L, C, D, M)를 하나 이상", test: (v) => /[IVXLCDM]/.test(v) },
    { text: `오늘 날짜(${today})를 포함`, test: (v) => v.includes(today) },
    { text: "‘신박’이라는 글자를 포함", test: (v) => v.includes("신박") },
    { text: "‘ㅋ’을 3번 이상", test: (v) => (v.match(/ㅋ/g) || []).length >= 3 },
    { text: "20자 이상", test: (v) => v.length >= 20 },
  ];

  window.LAB.add({
    id: "password",
    name: "더 패스워드 게임",
    original: "The Password Game",
    tier: "t4",
    tag: "규칙 퍼즐",
    blurb:
      "비밀번호를 만들수록 규칙이 하나씩 붙습니다. 마지막 규칙까지 통과할 수 있습니까?",
    info: "누적 규칙 검증 퍼즐",
    mount(root) {
      const { el, icon } = window.UI;
      let unlocked = 1;
      let pending = false;
      let won = false;
      let revealTimer = 0;

      const meter = el("i");
      const level = el("span", { class: "mono" });
      const count = el("span", { class: "mono" });
      const list = el("ul", { class: "pw-rules" });
      const field = el("input", {
        class: "input pw-input",
        type: "text",
        placeholder: "여기에 비밀번호를 입력하세요",
        autocomplete: "off",
        spellcheck: "false",
        "aria-describedby": "pw-status",
      });
      const status = el("p", { class: "hint", id: "pw-status", "aria-live": "polite" });
      const winPanel = el("div", { class: "pw-win", hidden: true });
      const chars = el("span", { class: "mono pw-chars", text: "0자" });

      const render = () => {
        const value = field.value;
        const visible = RULES.slice(0, unlocked);
        const states = visible.map((rule) => rule.test(value));
        const passed = states.filter(Boolean).length;

        level.textContent = `규칙 ${unlocked} / ${RULES.length}`;
        count.textContent = `통과 ${passed}`;
        meter.style.transform = `scaleX(${passed / unlocked})`;
        chars.textContent = `${value.length}자`;

        list.replaceChildren(
          ...visible.map((rule, index) => {
            const ok = states[index];
            return el(
              "li",
              { class: `pw-rule${ok ? " is-pass" : ""}${index === unlocked - 1 ? " is-new" : ""}` },
              el("span", { class: "pw-rule-no", text: String(index + 1).padStart(2, "0") }),
              el("span", {
                class: "pw-rule-icon",
                html: icon(ok ? "check" : "close", 13),
                "aria-hidden": "true",
              }),
              el("span", { class: "pw-rule-text", text: rule.text }),
              el("span", { class: "sr-only", text: ok ? "통과" : "미통과" })
            );
          })
        );

        if (won) return;

        if (passed === visible.length && unlocked < RULES.length && !pending) {
          pending = true;
          status.textContent = "규칙을 모두 지켰습니다. 다음 규칙이 곧 도착합니다…";
          revealTimer = window.setTimeout(() => {
            unlocked += 1;
            pending = false;
            window.UI.toast(`규칙 ${unlocked}이 추가되었습니다`);
            render();
          }, 460);
        } else if (passed === visible.length && unlocked === RULES.length) {
          win(value);
        } else if (!pending) {
          const missing = visible.length - passed;
          status.textContent = `${missing}개의 규칙이 남았습니다.`;
        }
      };

      const win = (value) => {
        won = true;
        status.textContent = "모든 규칙을 통과했습니다.";
        field.disabled = true;
        winPanel.hidden = false;
        winPanel.replaceChildren(          el("p", { class: "pw-win-kicker mono", text: "ALL RULES PASSED" }),
          el("h3", { class: "pw-win-title", text: "당신의 비밀번호는 이렇게 생겼습니다" }),
          el("code", { class: "pw-win-value", text: value }),
          el(
            "div",
            { class: "row" },
            el("button", {
              class: "btn btn--sm btn--primary",
              type: "button",
              text: "복사하기",
              onclick: () => window.UI.copy(value, "비밀번호를 복사했습니다"),
            }),
            el("button", {
              class: "btn btn--sm btn--ghost",
              type: "button",
              text: "다시 도전",
              onclick: reset,
            })
          ),
          el("p", { class: "hint", text: "이 비밀번호는 어디에도 저장되지 않습니다." })
        );
        requestAnimationFrame(() =>
          winPanel.scrollIntoView({ block: "nearest", behavior: "smooth" })
        );
      };

      const reset = () => {
        window.clearTimeout(revealTimer);
        unlocked = 1;
        pending = false;
        won = false;
        field.disabled = false;
        field.value = "";
        winPanel.hidden = true;
        winPanel.replaceChildren();
        status.textContent = "가장 쉬운 규칙부터 시작합니다.";
        render();
        field.focus();
      };

      field.addEventListener("input", render);

      const clear = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "처음부터",
        onclick: reset,
      });

      root.append(
        el(
          "div",
          { class: "lab pw-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "비밀번호 만들기" }),
            el("span", { class: "row" }, level, count, chars)
          ),
          el("div", { class: "pw-meter", "aria-hidden": "true" }, meter),
          el(
            "div",
            { class: "pw-field-wrap" },
            field,
            el("span", { class: "pw-field-note", text: "입력하는 동안 자동 저장되지 않습니다" })
          ),
          list,
          el("div", { class: "pw-status-row" }, status, clear),
          winPanel
        )
      );

      render();
      field.focus({ preventScroll: true });

      return () => window.clearTimeout(revealTimer);
    },
  });
})();
