/* airpods — 스크롤로 읽는 제품 이야기 */
(function () {
  "use strict";

  const ACTS = [
    {
      no: "01",
      title: "쓸데없이 예쁜 곡선",
      text: "이어폰 하나에도 곡선이 필요합니다. 손에 쥐었을 때의 무게, 케이스를 열 때의 각도까지 계산한 결과입니다.",
    },
    {
      no: "02",
      title: "소음을 지우는 일",
      text: "바깥 소리를 듣고, 반대 파동을 만들어 상쇄합니다. 지하철 소음이 갑자기 멀어지는 이유입니다.",
    },
    {
      no: "03",
      title: "머리 주위를 도는 소리",
      text: "고개를 돌려도 소리가 그 자리에 남아 있는 것처럼 들립니다. 영화관의 그 느낌을 귀에 옮겼습니다.",
    },
  ];

  window.LAB.add({
    id: "airpods",
    name: "에어팟 프로",
    original: "AirPods Pro",
    tier: "extra",
    tag: "스크롤 스토리",
    blurb:
      "제품 하나를 스크롤로 설명하는 페이지. 스크롤을 내리면 배경이 어두워지고 이어폰이 돌아갑니다.",
    info: "제품 페이지, 스크롤 애니메이션",
    mount(root) {
      const { el, clamp, randInt, seeded } = window.UI;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scroll = el("div", {
        class: "air-scroll",
        tabindex: "0",
        "data-act": "0",
        "aria-label": "제품 이야기 스크롤 영역",
      });
      const product = el(
        "div",
        { class: "air-product" },
        el("div", {
          class: "air-svg-wrap",
          html: `
          <svg viewBox="0 0 360 380" fill="none" stroke="currentColor" aria-hidden="true">
            <ellipse cx="180" cy="330" rx="96" ry="15" fill="currentColor" opacity=".08" stroke="none"/>
            <rect x="104" y="206" width="152" height="112" rx="30" stroke-width="3" fill="currentColor" fill-opacity=".05"/>
            <path d="M108 242h144" stroke-width="1.4" opacity=".35"/>
            <circle cx="180" cy="286" r="4" fill="currentColor" stroke="none"/>
            <g transform="rotate(-14 128 150)">
              <rect x="108" y="108" width="40" height="78" rx="20" stroke-width="3" fill="currentColor" fill-opacity=".09"/>
              <circle cx="128" cy="96" r="27" stroke-width="3" fill="currentColor" fill-opacity=".12"/>
              <circle cx="128" cy="96" r="8" stroke-width="2"/>
              <path d="M122 164v26" stroke-width="5" stroke-linecap="round"/>
            </g>
            <g transform="rotate(14 232 150)">
              <rect x="212" y="108" width="40" height="78" rx="20" stroke-width="3" fill="currentColor" fill-opacity=".09"/>
              <circle cx="232" cy="96" r="27" stroke-width="3" fill="currentColor" fill-opacity=".12"/>
              <circle cx="232" cy="96" r="8" stroke-width="2"/>
              <path d="M238 164v26" stroke-width="5" stroke-linecap="round"/>
            </g>
          </svg>`,
        }),
        el("div", { class: "air-noise", "aria-hidden": "true" })
      );

      const rnd = seeded(17);
      for (let i = 0; i < 34; i += 1) {
        product.querySelector(".air-noise").append(
          el("span", {
            style: {
              left: `${Math.round(rnd() * 100)}%`,
              top: `${Math.round(rnd() * 100)}%`,
              animationDelay: `${(rnd() * 4).toFixed(2)}s`,
              animationDuration: `${(2.4 + rnd() * 3).toFixed(2)}s`,
            },
          })
        );
      }

      const quiet = el("button", {
        class: "btn btn--sm btn--ghost air-quiet",
        type: "button",
        "aria-pressed": "false",
        text: "노이즈 캔슬링 켜기",
        onclick: () => {
          const on = quiet.getAttribute("aria-pressed") !== "true";
          quiet.setAttribute("aria-pressed", on ? "true" : "false");
          quiet.textContent = on ? "노이즈 캔슬링 끄기" : "노이즈 캔슬링 켜기";
          scroll.classList.toggle("is-quiet", on);
        },
      });

      const caption = el("span", { class: "air-caption mono", text: "01 / 디자인" });
      const sticky = el(
        "div",
        { class: "air-sticky" },
        el("span", { class: "air-eyebrow mono", text: "WIRELESS EARBUDS" }),
        product,
        caption,
        quiet
      );

      const acts = el(
        "div",
        { class: "air-acts" },
        ...ACTS.map((act) =>
          el(
            "section",
            { class: "air-act" },
            el("span", { class: "mono air-act-no", text: act.no }),
            el("h3", { class: "air-act-title", text: act.title }),
            el("p", { class: "air-act-text", text: act.text })
          )
        )
      );

      scroll.append(el("div", { class: "air-inner" }, el("div", { class: "air-visual" }, sticky), acts));

      let raf = 0;
      const update = () => {
        raf = 0;
        const max = scroll.scrollHeight - scroll.clientHeight;
        const p = max > 0 ? clamp(scroll.scrollTop / max, 0, 1) : 0;
        const act = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
        scroll.dataset.act = String(act);
        caption.textContent = `${ACTS[act].no} / ${ACTS[act].title}`;
        if (!reduce) {
          product.style.transform = `translateY(${(-6 + p * 12).toFixed(2)}px) rotate(${(
            -7 + p * 15
          ).toFixed(2)}deg) scale(${(1.05 - p * 0.12).toFixed(3)})`;
        }
        quiet.classList.toggle("is-dark", act > 0);
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      scroll.addEventListener("scroll", onScroll, { passive: true });
      update();

      root.append(el("div", { class: "lab air-lab" }, scroll));

      return () => {
        scroll.removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
      };
    },
  });
})();
