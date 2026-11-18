/* squishy — 누르면 말랑한 장난감 */
(function () {
  "use strict";

  const BLOBS = [
    { name: "딸기", hue: 6, size: 148, rotate: -3 },
    { name: "레몬", hue: 46, size: 122, rotate: 2 },
    { name: "민트", hue: 158, size: 172, rotate: -1 },
    { name: "포도", hue: 318, size: 132, rotate: 2 },
    { name: "코코아", hue: 26, size: 112, rotate: 0 },
  ];

  const REACTIONS = [
    "말랑말랑합니다.",
    "조금 더 세게 눌러도 됩니다.",
    "소리가 날 것 같습니다.",
    "이건 참을 수 없습니다.",
    "손가락이 기억했습니다.",
    "하나 더 누르고 싶습니다.",
    "말랑함은 과학입니다.",
    "이제 그만 눌러 주세요.",
  ];

  window.LAB.add({
    id: "squishy",
    name: "스퀴시",
    original: "Squishy",
    tier: "t1",
    tag: "말랑 장난감",
    blurb:
      "아무 목적 없는 말랑이. 누르면 눌린 만큼 돌아옵니다. 이유 없이 계속 누르게 되는 것이 목적입니다.",
    info: "인터랙션 장난감, 스프링",
    mount(root) {
      const { el, randInt } = window.UI;
      let count = 0;

      const counter = el("span", { class: "mono sq-count", text: "0번" });
      const reaction = el("p", { class: "sq-reaction", "aria-live": "polite" });
      const board = el("div", { class: "squishy-board" });

      const bump = (blob) => {
        count += 1;
        counter.textContent = `${count}번`;
        reaction.textContent = REACTIONS[randInt(0, REACTIONS.length - 1)];
        blob.classList.remove("is-boing");
        void blob.offsetWidth;
        blob.classList.add("is-boing");
        window.setTimeout(() => blob.classList.remove("is-boing"), 620);
      };

      BLOBS.forEach((data, index) => {
        const blob = el(
          "button",
          {
            class: "squishy",
            type: "button",
            style: {
              "--hue": String(data.hue),
              "--size": `${data.size}px`,
              "--rotate": `${data.rotate}deg`,
            },
            "aria-label": `${data.name} 말랑이 누르기`,
          },
          el(
            "span",
            { class: "squishy-body", "aria-hidden": "true" },
            el(
              "span",
              { class: "squishy-face" },
              el("span", { class: "squishy-eye" }),
              el("span", { class: "squishy-eye" }),
              el("span", { class: "squishy-mouth" })
            ),
            el("span", { class: "squishy-shine" })
          )
        );

        blob.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          blob.classList.add("is-squish");
          blob.setPointerCapture(event.pointerId);
        });
        const release = () => blob.classList.remove("is-squish");
        blob.addEventListener("pointerup", release);
        blob.addEventListener("pointercancel", release);
        blob.addEventListener("pointerleave", release);
        blob.addEventListener("click", () => bump(blob));
        blob.addEventListener("keydown", (event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            bump(blob);
            blob.classList.add("is-squish");
            window.setTimeout(() => blob.classList.remove("is-squish"), 140);
          }
        });

        board.append(blob);
        if (index === 0) blob.classList.add("is-first");
      });

      root.append(
        el(
          "div",
          { class: "lab sq-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "누르면 돌아옵니다" }),
            counter
          ),
          board,
          el(
            "div",
            { class: "sq-foot" },
            reaction,
            el("button", {
              class: "btn btn--sm btn--ghost",
              type: "button",
              text: "처음으로",
              onclick: () => {
                count = 0;
                counter.textContent = "0번";
                reaction.textContent = "";
              },
            })
          )
        )
      );

      reaction.textContent = "말랑이를 눌러 보세요.";
    },
  });
})();
