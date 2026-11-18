/* billgates — 1000억 달러로 장보기 */
(function () {
  "use strict";

  const START = 100000000000;

  const ITEMS = [
    { id: "coke", name: "코카콜라 한 캔", note: "냉장고에서 바로", price: 1 },
    { id: "shoe", name: "운동화 한 켤레", note: "한정판 말고 기본", price: 150 },
    { id: "phone", name: "아이폰", note: "이제 막 나온 것", price: 1299 },
    { id: "mac", name: "맥북 프로", note: "메모리 풀옵션", price: 2499 },
    { id: "tesla", name: "테슬라 모델 S", note: "한 대부터", price: 89990 },
    { id: "ad", name: "슈퍼볼 광고 30초", note: "전 국민이 본다", price: 7000000 },
    { id: "penthouse", name: "맨해튼 펜트하우스", note: "센트럴파크 뷰", price: 25000000 },
    { id: "island", name: "태평양의 섬 하나", note: "등기까지 포함", price: 35000000 },
    { id: "jet", name: "개인 제트기", note: "연료비는 별도", price: 65000000 },
    { id: "art", name: "피카소 명화", note: "경매에서 낙찰", price: 140000000 },
    { id: "rocket", name: "우주선 한 척", note: "재사용 가능", price: 450000000 },
    { id: "yacht", name: "슈퍼 요트", note: "헬기장 딸린 것", price: 500000000 },
    { id: "school", name: "대학 하나 기부", note: "이름이 붙는다", price: 1000000000 },
    { id: "team", name: "프로 축구팀", note: "구단주가 된다", price: 4000000000 },
  ];

  const shortPrice = (n) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${window.UI.fmt(n)}`;
  };

  window.LAB.add({
    id: "billgates",
    name: "스펜드 빌 게이츠 머니",
    original: "Spend Bill Gates' Money",
    tier: "t3",
    tag: "소비 시뮬레이터",
    blurb:
      "1000억 달러를 들고 장에 나왔습니다. 요트도 사고 축구팀도 사고, 남은 돈이 얼마인지 지켜보세요.",
    info: "돈 계산, 구매와 판매",
    mount(root) {
      const { el, fmt, money } = window.UI;
      const qty = new Map(ITEMS.map((item) => [item.id, 0]));
      const updaters = [];
      let cash = START;

      const cashNode = el("span", { class: "bg-cash" });
      const spentBar = el("i");
      const spentLabel = el("span", { class: "mono" });
      const summary = el("div", { class: "bg-summary" });
      const list = el("div", { class: "bg-list" });

      const sync = () => {
        const spent = START - cash;
        cashNode.textContent = money(cash);
        cashNode.classList.toggle("is-low", cash < START * 0.1);
        spentBar.style.transform = `scaleX(${Math.max(0, spent / START)})`;
        spentLabel.textContent = `${money(spent)} 사용 · ${((spent / START) * 100).toFixed(1)}%`;
        const bought = ITEMS.filter((item) => qty.get(item.id) > 0);
        summary.replaceChildren(
          ...(bought.length
            ? bought.map((item) =>
                el("span", {
                  class: "bg-tag",
                  text: `${item.name} × ${qty.get(item.id)}`,
                })
              )
            : [el("span", { class: "bg-tag bg-tag--empty", text: "아직 아무것도 사지 않았습니다" })])
        );
      };

      const items = ITEMS.map((item) => {
        const count = el("span", { class: "bg-qty", text: "0" });
        const minus = el("button", {
          class: "bg-step",
          type: "button",
          "aria-label": `${item.name} 하나 팔기`,
          html: window.UI.icon("minus", 14),
          onclick: () => {
            const n = qty.get(item.id);
            if (!n) return;
            qty.set(item.id, n - 1);
            cash += item.price;
            count.textContent = n - 1;
            sync();
            updaters.forEach((fn) => fn());
          },
        });
        const plus = el("button", {
          class: "bg-step",
          type: "button",
          "aria-label": `${item.name} 하나 사기`,
          html: window.UI.icon("plus", 14),
          onclick: () => {
            if (cash < item.price) {
              window.UI.toast("돈이 부족합니다");
              return;
            }
            const n = qty.get(item.id);
            qty.set(item.id, n + 1);
            cash -= item.price;
            count.textContent = n + 1;
            sync();
            updaters.forEach((fn) => fn());
          },
        });
        minus.disabled = true;

        const row = el(
          "article",
          { class: "bg-item" },
          el(
            "div",
            { class: "bg-item-main" },
            el("h3", { class: "bg-item-name", text: item.name }),
            el("p", { class: "bg-item-note", text: item.note }),
            el("p", { class: "bg-item-price", text: shortPrice(item.price) })
          ),
          el("div", { class: "bg-controls" }, minus, count, plus)
        );

        const updateDisabled = () => {
          minus.disabled = qty.get(item.id) === 0;
          plus.disabled = cash < item.price;
        };
        row.addEventListener("mouseenter", updateDisabled);
        updaters.push(updateDisabled);
        return row;
      });

      const reset = el("button", {
        class: "btn btn--sm btn--ghost",
        type: "button",
        text: "처음으로",
        onclick: () => {
          cash = START;
          ITEMS.forEach((item) => qty.set(item.id, 0));
          items.forEach((row) => {
            row.querySelector(".bg-qty").textContent = "0";
          });
          sync();
          updaters.forEach((fn) => fn());
          window.UI.toast("1000억 달러로 돌아왔습니다");
        },
      });

      const board = el(
        "div",
        { class: "lab bg-lab" },
        el(
          "div",
          { class: "bg-top" },
          el(
            "div",
            { class: "bg-money-block" },
            el("span", { class: "bg-label", text: "남은 돈" }),
            cashNode,
            el("div", { class: "bg-meter", "aria-hidden": "true" }, spentBar),
            spentLabel
          ),
          reset
        ),
        el("p", { class: "hint bg-hint" }, "사고 싶은 것의 + 를 누르면 바로 빠져나갑니다."),
        list,
        el(
          "div",
          { class: "bg-bought" },
          el("span", { class: "bg-label", text: "산 물건" }),
          summary
        )
      );

      root.append(board);
      list.append(...items);
      items.forEach((row) => row.dispatchEvent(new Event("mouseenter")));
      sync();

      const onKey = (event) => {
        if (event.target.closest("input, textarea")) return;
        if (event.key === "r" || event.key === "R") reset.click();
      };
      document.addEventListener("keydown", onKey);

      return () => document.removeEventListener("keydown", onKey);
    },
  });
})();
