/* deepsea — 수심 11,000m까지 스크롤하는 바다 */
(function () {
  "use strict";

  const ZONES = [
    {
      depth: 0,
      name: "표층",
      title: "햇빛이 닿는 곳",
      text: "바다의 겉면. 빛이 가득해 광합성이 일어나고, 우리가 아는 바다 생물의 대부분이 이 좁은 층에 모여 삽니다.",
      creature: "dolphin",
    },
    {
      depth: 200,
      name: "박명",
      title: "색이 사라지기 시작한다",
      text: "빛이 줄면서 붉은색부터 보이지 않습니다. 여기서부터 생물들은 눈을 크게 키우거나 스스로 빛을 냅니다.",
      creature: "squid",
    },
    {
      depth: 1000,
      name: "암흑",
      title: "영원한 어둠",
      text: "마지막 햇빛도 사라지는 깊이. 이 아래로는 낮과 밤의 구분이 없습니다.",
      creature: "jelly",
    },
    {
      depth: 2000,
      name: "심해",
      title: "스스로 빛을 만드는 곳",
      text: "수압은 200기압. 아귀는 머리 위 유인등을 켜고 먹이를 기다립니다.",
      creature: "angler",
    },
    {
      depth: 4000,
      name: "심연",
      title: "가라앉은 것들이 쌓이는 곳",
      text: "침몰한 배와 죽은 생물의 잔해가 눈처럼 천천히 내려와 쌓입니다. 이걸 바다눈이라고 부릅니다.",
      creature: "snailfish",
    },
    {
      depth: 6000,
      name: "초심해",
      title: "그래도 사는 물고기가 있다",
      text: "수압 600기압. 뼈가 물러지고 몸이 젤리처럼 변한 물고기가 이 깊이에서도 헤엄칩니다.",
      creature: "fish",
    },
    {
      depth: 10994,
      name: "마리아나 해구",
      title: "지구에서 가장 깊은 곳",
      text: "에베레스트를 통째로 넣어도 봉우리가 잠기는 깊이. 사람이 만든 잠수정이 겨우 닿는 바닥입니다.",
      creature: "rov",
    },
  ];

  const CREATURES = {
    dolphin: `
      <path d="M18 82c26-32 68-46 110-36 22 5 38 18 44 34-8 14-26 24-50 28-38 6-78-2-104-26z" fill="currentColor" opacity=".14"/>
      <path d="M18 82c26-32 68-46 110-36 22 5 38 18 44 34" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M86 52c8-18 20-26 30-26-6 12-6 22-2 30" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M168 78l26-16-6 18 22 6-38 10" fill="currentColor" opacity=".28"/>
      <circle cx="54" cy="76" r="2.6" fill="currentColor"/>
    `,
    squid: `
      <path d="M110 28c24 0 38 20 38 44 0 20-16 32-38 32s-38-12-38-32c0-24 14-44 38-44z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="2"/>
      <path d="M88 102c-6 16-16 22-26 24M102 104c-2 18-8 24-14 28M118 104c2 18 8 24 14 28M132 102c6 16 16 22 26 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="96" cy="66" r="5" fill="currentColor"/>
      <circle cx="124" cy="66" r="5" fill="currentColor"/>
      <circle cx="96" cy="66" r="2" fill="var(--void)"/>
      <circle cx="124" cy="66" r="2" fill="var(--void)"/>
    `,
    jelly: `
      <path d="M56 66c0-28 22-44 54-44s54 16 54 44c-30 12-64 12-108 0z" fill="currentColor" opacity=".16" stroke="currentColor" stroke-width="2"/>
      <path d="M70 78c-4 22 6 34 0 48M94 80c-6 24 4 34-2 50M118 80c6 24-4 34 2 50M142 78c4 22-6 34 0 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M56 66c18 8 36 10 54 10s36-2 54-10" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".5"/>
    `,
    angler: `
      <path d="M34 82c0-30 28-48 64-48 36 0 64 20 64 50 0 26-28 42-62 42-36 0-66-18-66-44z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="2"/>
      <path d="M104 44c-2-26 18-34 30-38" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="139" cy="4" r="10" fill="currentColor" opacity=".22"/>
      <circle cx="139" cy="4" r="4" fill="currentColor"/>
      <path d="M34 92c20 8 46 10 70 8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M48 88l8 10 8-10 8 10 8-10 8 10 8-10" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="72" cy="64" r="6" fill="currentColor"/>
      <circle cx="72" cy="64" r="2.4" fill="var(--void)"/>
    `,
    snailfish: `
      <path d="M30 84c22-26 62-36 104-24 20 6 34 16 42 28-10 16-28 26-54 30-36 6-70-6-92-34z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="2"/>
      <path d="M34 86c-14 2-22 10-24 20 12 2 22-2 30-10" fill="currentColor" opacity=".2"/>
      <path d="M78 62c10-8 22-8 30 0" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="58" cy="78" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="58" cy="78" r="2.6" fill="currentColor"/>
      <path d="M96 96c10 6 20 7 30 2" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".6"/>
    `,
    fish: `
      <path d="M44 84c0-22 26-36 58-36 30 0 52 14 52 34 0 20-24 36-56 36-30 0-54-14-54-34z" fill="currentColor" opacity=".12" stroke="currentColor" stroke-width="2"/>
      <path d="M44 84l-20-14v28z" fill="currentColor" opacity=".28"/>
      <path d="M96 52c6-12 14-16 22-14" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="78" cy="78" r="9" fill="currentColor" opacity=".38"/>
      <circle cx="78" cy="78" r="3" fill="var(--void)"/>
      <path d="M108 100c10 6 18 6 26 0" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".6"/>
    `,
    rov: `
      <rect x="48" y="56" width="96" height="46" rx="4" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="2"/>
      <rect x="66" y="68" width="34" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <path d="M144 72h22v14h-22z" fill="currentColor" opacity=".2"/>
      <path d="M48 66h-16M48 92h-16M144 66h16M144 92h16" stroke="currentColor" stroke-width="3"/>
      <circle cx="96" cy="44" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M166 79l40-18v36z" fill="currentColor" opacity=".08"/>
    `,
  };

  window.LAB.add({
    id: "deepsea",
    name: "더 딥 시",
    original: "The Deep Sea",
    tier: "t4",
    tag: "스크롤 여행",
    blurb:
      "스크롤을 내릴수록 빛이 사라지고 압력이 올라갑니다. 수심 11,000m까지 내려가며 바다의 층을 만나 보세요.",
    info: "수심, 바다, 스크롤 스토리",
    mount(root) {
      const { el } = window.UI;
      const scroll = el("div", {
        class: "deep-scroll",
        tabindex: "0",
        "aria-label": "수심 11,000m까지 내려가는 스크롤 영역",
      });
      const depthValue = el("strong", { class: "deep-depth", text: "0" });
      const zoneName = el("span", { class: "deep-zone-label", text: "표층" });
      const gauge = el("i");
      const hud = el(
        "div",
        { class: "deep-hud" },
        el(
          "div",
          { class: "deep-hud-inner" },
          el("span", { class: "mono", text: "DEPTH" }),
          el("span", { class: "deep-depth-row" }, depthValue, el("span", { class: "mono", text: "m" })),
          zoneName,
          el("span", { class: "deep-gauge", "aria-hidden": "true" }, gauge),
          el("button", {
            class: "deep-top",
            type: "button",
            text: "수면으로",
            onclick: () => scroll.scrollTo({ top: 0, behavior: "smooth" }),
          })
        )
      );
      const track = el("div", { class: "deep-track" });
      const hint = el("p", { class: "deep-hint", text: "스크롤해서 내려가세요" });

      ZONES.forEach((zone, index) => {
        const section = el(
          "section",
          {
            class: `deep-zone${index % 2 === 1 ? " is-right" : ""}`,
            style: { top: `${index * 500 - 60}px` },
            "aria-label": `수심 ${zone.depth}m ${zone.name}`,
          },
          el(
            "div",
            { class: "deep-copy" },
            el("span", { class: "mono deep-zone-no", text: `ZONE ${String(index + 1).padStart(2, "0")}` }),
            el("h3", { class: "deep-title", text: zone.title }),
            el("p", { class: "deep-text", text: zone.text }),
            el("span", { class: "deep-depth-tag mono", text: `${zone.depth.toLocaleString("ko-KR")} m · ${zone.name}` })
          ),
          el("div", {
            class: "deep-creature",
            "aria-hidden": "true",
            html: `<svg viewBox="0 0 220 140" fill="none" style="color:var(--foam)">${CREATURES[zone.creature]}</svg>`,
          })
        );
        track.append(section);
      });

      track.append(
        el(
          "div",
          { class: "deep-end" },
          el("span", { class: "mono", text: "BOTTOM" }),
          el("p", { text: "여기까지 왔습니다. 다시 올라가려면 수면으로 버튼을 누르세요." })
        )
      );

      scroll.append(hud, hint, track);

      let raf = 0;
      const anchors = ZONES.map((zone, index) => ({
        y: index * 500 + 190,
        depth: zone.depth,
      }));

      const depthFor = (centerY) => {
        if (centerY <= anchors[0].y) return 0;
        for (let i = 0; i < anchors.length - 1; i += 1) {
          const a = anchors[i];
          const b = anchors[i + 1];
          if (centerY <= b.y) {
            const t = (centerY - a.y) / (b.y - a.y);
            return Math.round(a.depth + (b.depth - a.depth) * t);
          }
        }
        return 10994;
      };

      const update = () => {
        raf = 0;
        const viewCenter = scroll.scrollTop + scroll.clientHeight / 2;
        const depth = depthFor(viewCenter);
        const progress = depth / 10994;
        depthValue.textContent = depth.toLocaleString("ko-KR");
        gauge.style.transform = `scaleX(${Math.max(0.001, progress)})`;
        const zone =
          ZONES.slice()
            .reverse()
            .find((item) => depth >= item.depth) || ZONES[0];
        zoneName.textContent = zone.name;
        hint.classList.toggle("is-hidden", scroll.scrollTop > 60);
      };

      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      scroll.addEventListener("scroll", onScroll, { passive: true });
      update();

      root.append(el("div", { class: "lab deep-lab" }, scroll));

      return () => {
        scroll.removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
      };
    },
  });
})();
