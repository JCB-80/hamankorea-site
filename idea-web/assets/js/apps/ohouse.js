/* ohouse — 사진 속 가구를 눌러 사는 집 */
(function () {
  "use strict";

  const PRODUCTS = [
    {
      id: "sofa",
      name: "모듈 소파 3인용",
      price: 1290000,
      tag: "가구",
      desc: "낮은 등받이와 넉넉한 좌방석. 거실의 중심을 잡아 주는 기본 소파입니다.",
      x: 51,
      y: 57,
    },
    {
      id: "table",
      name: "원목 커피 테이블",
      price: 320000,
      tag: "가구",
      desc: "둥근 상판과 가는 다리. 소파 앞에 두면 동선이 한결 가벼워집니다.",
      x: 50,
      y: 73,
    },
    {
      id: "lamp",
      name: "플로어 스탠드",
      price: 89000,
      tag: "조명",
      desc: "저녁에만 켜 두고 싶은 조명. 전구 색온도는 따뜻한 쪽으로.",
      x: 83,
      y: 47,
    },
    {
      id: "plant",
      name: "몬스테라 화분",
      price: 45000,
      tag: "식물",
      desc: "잎이 넓어 공간을 금방 채워 줍니다. 물은 일주일에 한 번이면 충분합니다.",
      x: 15,
      y: 64,
    },
    {
      id: "frame",
      name: "추상 포스터 액자",
      price: 38000,
      tag: "소품",
      desc: "색 두 가지로만 구성한 액자. 벽이 비어 보일 때 가장 빠른 해결책입니다.",
      x: 56,
      y: 22,
    },
    {
      id: "rug",
      name: "울 러그 200x140",
      price: 210000,
      tag: "패브릭",
      desc: "발이 닿는 순간이 다른 러그. 거실의 온도를 조금 올려 줍니다.",
      x: 33,
      y: 84,
    },
  ];

  const ROOM = `
    <svg viewBox="0 0 900 520" fill="none" aria-hidden="true">
      <rect width="900" height="520" fill="var(--paper-soft)"/>
      <rect width="900" height="372" fill="var(--paper-deep)"/>
      <path d="M0 372h900v148H0z" fill="var(--t-extra-soft)"/>
      <path d="M0 372h900" stroke="var(--ink)" stroke-width="1.5" opacity=".45"/>

      <rect x="84" y="48" width="224" height="156" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="2"/>
      <path d="M196 48v156M84 126h224" stroke="var(--ink)" stroke-width="1.4" opacity=".45"/>
      <circle cx="150" cy="86" r="17" fill="var(--t2-soft)"/>
      <path d="M84 204c30-38 62-38 92 0" stroke="var(--t4)" stroke-width="2" opacity=".5"/>

      <rect x="426" y="64" width="150" height="108" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="2"/>
      <circle cx="470" cy="110" r="26" fill="var(--t1-soft)"/>
      <path d="M506 62v112M426 146h150" stroke="var(--ink)" stroke-width="1" opacity=".3"/>
      <path d="M426 130l40-38 36 44 34-30 40 34" stroke="var(--t4)" stroke-width="2" opacity=".55"/>

      <ellipse cx="300" cy="438" rx="250" ry="52" fill="var(--t1-soft)" opacity=".85"/>
      <ellipse cx="700" cy="438" rx="170" ry="38" fill="var(--t2-soft)" opacity=".4"/>

      <rect x="286" y="232" width="338" height="76" rx="10" fill="var(--t4-soft)" stroke="var(--ink)" stroke-width="2"/>
      <rect x="268" y="268" width="374" height="96" rx="12" fill="var(--t4-soft)" stroke="var(--ink)" stroke-width="2"/>
      <rect x="306" y="252" width="128" height="52" rx="8" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="1.4"/>
      <rect x="444" y="252" width="128" height="52" rx="8" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="1.4"/>
      <path d="M306 300v54M604 300v54" stroke="var(--ink)" stroke-width="5"/>

      <ellipse cx="450" cy="374" rx="118" ry="26" fill="var(--t2-soft)" stroke="var(--ink)" stroke-width="2"/>
      <path d="M356 380l-8 44M544 380l8 44" stroke="var(--ink)" stroke-width="4"/>
      <ellipse cx="430" cy="366" rx="24" ry="7" fill="var(--paper-raised)" opacity=".8"/>

      <path d="M748 122v210" stroke="var(--ink)" stroke-width="4"/>
      <path d="M708 146h80l-16-52h-48z" fill="var(--t2-soft)" stroke="var(--ink)" stroke-width="2"/>
      <ellipse cx="748" cy="336" rx="30" ry="8" fill="var(--ink)" opacity=".18"/>

      <path d="M132 348h56l-8 40h-40z" fill="var(--t-extra)" stroke="var(--ink)" stroke-width="2"/>
      <path d="M160 348c0-34 8-54 20-66M160 350c-18-12-28-28-30-44M160 352c16-10 26-24 30-38" stroke="var(--ink)" stroke-width="2"/>
      <ellipse cx="180" cy="278" rx="13" ry="24" fill="var(--t3)" opacity=".75" transform="rotate(28 180 278)"/>
      <ellipse cx="128" cy="306" rx="11" ry="21" fill="var(--t3)" opacity=".55" transform="rotate(-34 128 306)"/>
      <ellipse cx="192" cy="314" rx="10" ry="19" fill="var(--t3)" opacity=".45" transform="rotate(46 192 314)"/>

      <path d="M640 372h70v44h-70z" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="1.6"/>
      <path d="M650 372v-14h50v14" stroke="var(--ink)" stroke-width="2"/>
      <circle cx="675" cy="394" r="9" fill="var(--t2-soft)"/>

      <path d="M0 372h900" stroke="var(--ink)" stroke-width="1" opacity=".25"/>
    </svg>`;

  window.LAB.add({
    id: "ohouse",
    name: "오늘의집",
    original: "Ohouse",
    tier: "extra",
    tag: "사진 쇼핑",
    blurb:
      "집 사진 속 작은 점을 누르면 그 가구가 바로 나옵니다. 사진 한 장이 상품 목록이 되는 방식.",
    info: "이미지 핫스팟, 인테리어 쇼핑",
    mount(root) {
      const { el, fmt, toast } = window.UI;
      let cart = 0;
      let current = null;

      const cartLabel = el("span", { class: "mono oh-cart", text: "장바구니 0" });
      const room = el("div", { class: "oh-room" });
      room.innerHTML = ROOM;
      const panel = el("div", { class: "oh-panel", hidden: true });

      const openPanel = (product) => {
        current = product;
        panel.hidden = false;
        panel.replaceChildren(
          el(
            "div",
            { class: "oh-panel-head" },
            el("span", { class: "mono", text: `HOTSPOT · ${product.tag}` }),
            el("button", {
              class: "oh-close",
              type: "button",
              "aria-label": "상품 닫기",
              html: window.UI.icon("close", 14),
              onclick: () => {
                panel.hidden = true;
                current = null;
              },
            })
          ),
          el("h3", { class: "oh-name", text: product.name }),
          el("p", { class: "oh-desc", text: product.desc }),
          el(
            "div",
            { class: "oh-buy" },
            el("strong", { class: "oh-price", text: `${fmt(product.price)}원` }),
            el("button", {
              class: "btn btn--sm btn--primary",
              type: "button",
              text: "장바구니 담기",
              onclick: () => {
                cart += 1;
                cartLabel.textContent = `장바구니 ${cart}`;
                toast(`${product.name}을 담았습니다`);
              },
            })
          )
        );
      };

      PRODUCTS.forEach((product, index) => {
        const hotspot = el(
          "button",
          {
            class: "oh-hotspot",
            type: "button",
            style: { left: `${product.x}%`, top: `${product.y}%` },
            "aria-label": `${product.name} ${fmt(product.price)}원`,
            onclick: () => openPanel(product),
          },
          el("span", { class: "oh-dot", "aria-hidden": "true" }),
          el("span", { class: "oh-tag", text: product.name })
        );
        if (index === 0) hotspot.classList.add("is-selected");
        room.append(hotspot);
      });
      room.append(panel);

      root.append(
        el(
          "div",
          { class: "lab oh-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "거실 한 장, 상품 여섯 개" }),
            cartLabel
          ),
          el("p", { class: "hint", text: "사진 속 점을 눌러 상품을 확인하세요." }),
          room
        )
      );
    },
  });
})();
