/* duolingo — 짧은 영어 퀴즈 */
(function () {
  "use strict";

  const QUESTIONS = [
    { prompt: "apple", answer: "사과", options: ["사과", "바나나", "포도", "오렌지"] },
    { prompt: "water", answer: "물", options: ["물", "불", "흙", "바람"] },
    { prompt: "book", answer: "책", options: ["책", "신발", "모자", "시계"] },
    { prompt: "friend", answer: "친구", options: ["친구", "가족", "이웃", "선생님"] },
    { prompt: "sky", answer: "하늘", options: ["하늘", "바다", "산", "강"] },
    { prompt: "커피", answer: "coffee", options: ["coffee", "tea", "milk", "juice"], reverse: true },
    { prompt: "rain", answer: "비", options: ["비", "눈", "바람", "구름"] },
    { prompt: "music", answer: "음악", options: ["음악", "그림", "영화", "춤"] },
    { prompt: "컴퓨터", answer: "computer", options: ["computer", "television", "radio", "phone"], reverse: true },
    { prompt: "dog", answer: "개", options: ["개", "고양이", "토끼", "새"] },
  ];

  const HEART =
    '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M12 20.7S4.2 16 2 12.2C.4 9.3 2 5.6 5.4 5.6c2 0 3.2 1.2 4.2 2.5 1-1.3 2.2-2.5 4.2-2.5 3.4 0 5 3.7 3.4 6.6C19.8 16 12 20.7 12 20.7z" fill="currentColor"/></svg>';

  window.LAB.add({
    id: "duolingo",
    name: "듀오링고",
    original: "Duolingo",
    tier: "extra",
    tag: "언어 학습",
    blurb:
      "하루 3분, 틀려도 다시 하는 짧은 영어 퀴즈. 하트 세 개가 다 닳기 전에 끝내 보세요.",
    info: "영어 퀴즈, 학습 게임",
    mount(root) {
      const { el, shuffle } = window.UI;
      let index = 0;
      let xp = 0;
      let hearts = 3;
      let correct = 0;
      let answered = false;
      let finished = false;

      const heartsHost = el("div", { class: "dl-hearts", "aria-label": "남은 하트" });
      const meter = el("i");
      const xpLabel = el("span", { class: "mono" });
      const card = el("div", { class: "dl-card" });

      const updateHearts = () => {
        heartsHost.replaceChildren(
          ...Array.from({ length: 3 }, (_, i) =>
            el("span", { class: `dl-heart${i < hearts ? " is-on" : ""}`, html: HEART })
          )
        );
        heartsHost.setAttribute("aria-label", `남은 하트 ${hearts}개`);
      };

      const finish = () => {
        finished = true;
        const accuracy = Math.round((correct / QUESTIONS.length) * 100);
        card.replaceChildren(
          el("span", { class: "mono dl-kicker", text: hearts > 0 ? "라운드 완료" : "하트 소진" }),
          el("h3", { class: "dl-result-title", text: hearts > 0 ? "오늘의 학습 완료" : "여기까지!" }),
          el("p", { class: "dl-result-score", text: `${xp} XP` }),
          el(
            "div",
            { class: "dl-result-row" },
            el("span", { text: `정답 ${correct} / ${QUESTIONS.length}` }),
            el("span", { text: `정확도 ${accuracy}%` }),
            el("span", { text: `하트 ${hearts}` })
          ),
          el("button", {
            class: "btn btn--primary",
            type: "button",
            text: "다시 학습",
            onclick: () => {
              index = 0;
              xp = 0;
              hearts = 3;
              correct = 0;
              answered = false;
              finished = false;
              updateHearts();
              render();
            },
          }),
          el("p", { class: "hint", text: "점수는 어디에도 저장되지 않습니다." })
        );
        meter.style.transform = "scaleX(1)";
      };

      const next = () => {
        index += 1;
        answered = false;
        if (hearts <= 0 || index >= QUESTIONS.length) {
          finish();
        } else {
          render();
        }
      };

      const answer = (option, button, options, question) => {
        if (answered || finished) return;
        answered = true;
        const ok = option === question.answer;
        if (ok) {
          xp += 10;
          correct += 1;
        } else {
          hearts -= 1;
        }
        updateHearts();
        xpLabel.textContent = `${xp} XP`;
        options.forEach((node) => {
          node.disabled = true;
          if (node.dataset.value === question.answer) node.classList.add("is-correct");
          if (node === button && !ok) node.classList.add("is-wrong");
        });
        button.classList.add(ok ? "is-correct" : "is-wrong");

        const feedback = el(
          "div",
          { class: `dl-feedback ${ok ? "is-ok" : "is-bad"}`, role: "status" },
          el("strong", { text: ok ? "좋아요!" : "아쉬워요" }),
          el("span", {
            text: ok ? `+10 XP · ${question.answer}` : `정답은 “${question.answer}”입니다`,
          })
        );
        const cont = el("button", {
          class: "btn btn--sm dl-continue",
          type: "button",
          text: index + 1 >= QUESTIONS.length || hearts <= 0 ? "결과 보기" : "계속",
          onclick: next,
        });
        feedback.append(cont);
        card.append(feedback);
        meter.style.transform = `scaleX(${(index + 1) / QUESTIONS.length})`;
        window.setTimeout(() => cont.focus({ preventScroll: true }), 60);
      };

      const render = () => {
        if (finished) return;
        const question = QUESTIONS[index];
        const options = shuffle(question.options);
        meter.style.transform = `scaleX(${index / QUESTIONS.length})`;
        const title = el("h3", {
          class: "dl-question",
          text: question.reverse ? "이 단어를 영어로" : "이 단어의 뜻은?",
        });
        const word = el("p", { class: `dl-word${question.reverse ? " is-ko" : ""}`, text: question.prompt });
        const optionHost = el("div", { class: "dl-options" });
        const nodes = options.map((option) =>
          el("button", {
            class: "dl-option",
            type: "button",
            dataset: { value: option },
            onclick: (event) => answer(option, event.currentTarget, nodes, question),
          }, el("span", { text: option }))
        );
        optionHost.append(...nodes);
        card.replaceChildren(title, word, optionHost);
        updateHearts();
      };

      const onKey = (event) => {
        if (finished) return;
        if (/^[1-4]$/.test(event.key) && !answered) {
          const buttons = Array.from(card.querySelectorAll(".dl-option"));
          const button = buttons[Number(event.key) - 1];
          if (button) button.click();
        } else if (event.key === "Enter" && answered) {
          const cont = card.querySelector(".dl-continue");
          if (cont) cont.click();
        }
      };
      document.addEventListener("keydown", onKey);

      root.append(
        el(
          "div",
          { class: "lab dl-lab" },
          el(
            "div",
            { class: "dl-top" },
            heartsHost,
            el("div", { class: "dl-meter", "aria-hidden": "true" }, meter),
            xpLabel
          ),
          card,
          el("p", { class: "hint dl-hint", text: "1~4 키로 고르고 Enter로 계속할 수 있습니다." })
        )
      );

      updateHearts();
      render();

      return () => document.removeEventListener("keydown", onKey);
    },
  });
})();
