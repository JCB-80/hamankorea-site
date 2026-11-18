/* craft — 요소를 끌어다 붙이면 새로 태어난다 */
(function () {
  "use strict";

  const RECIPES = {
    "불+물": "증기",
    "물+흙": "진흙",
    "불+흙": "벽돌",
    "바람+불": "불꽃",
    "물+바람": "파도",
    "바람+흙": "먼지",
    "물+물": "바다",
    "불+불": "화산",
    "흙+흙": "산",
    "바람+바람": "폭풍",
    "바람+증기": "구름",
    "구름+구름": "비",
    "비+흙": "풀",
    "불+풀": "재",
    "나무+불": "숯",
    "나무+물": "종이",
    "바다+불": "소금",
    "물+소금": "바닷물",
    "나무+나무": "숲",
    "불+숲": "화재",
    "불+진흙": "벽돌",
    "벽돌+벽돌": "집",
    "집+집": "마을",
    "마을+마을": "도시",
    "물+도시": "항구",
    "불+산": "화산",
    "물+화산": "섬",
    "나무+섬": "정글",
    "불+정글": "잿더미",
    "구름+불": "번개",
    "물+번개": "생명",
    "생명+흙": "사람",
    "사람+사람": "가족",
    "가족+집": "이웃",
    "사람+물": "수영",
    "불+종이": "재",
    "바람+종이": "비행기",
    "비행기+구름": "여행",
    "사람+바람": "노래",
    "노래+사람": "합창",
    "모래+불": "유리",
    "증기+흙": "모래",
    "모래+모래": "유리",
    "산+바람": "돌",
    "돌+불": "금속",
    "금속+번개": "전기",
    "재+물": "잉크",
    "잉크+종이": "글",
    "모래+유리": "시간",
    "유리+물": "거울",
    "거울+사람": "자아",
    "별+별": "은하",
    "달+사람": "우주인",
    "우주+사람": "탐험",
    "사람+종이": "책",
    "책+책": "도서관",
    "전기+사람": "아이디어",
    "아이디어+사람": "발명",
    "금속+불": "칼",
    "칼+나무": "도끼",
    "도끼+숲": "목재",
    "목재+집": "오두막",
    "인터넷+사람": "신박함",
    "컴퓨터+사람": "프로그래머",
    "전기+금속": "컴퓨터",
    "컴퓨터+컴퓨터": "인터넷",
    "시간+사람": "기억",
    "기억+글": "이야기",
  };

  const BASE = [
    { name: "물", x: 0.2, y: 0.28 },
    { name: "불", x: 0.56, y: 0.2 },
    { name: "흙", x: 0.34, y: 0.64 },
    { name: "바람", x: 0.72, y: 0.56 },
  ];

  const keyOf = (a, b) => [a, b].sort((x, y) => x.localeCompare(y, "ko")).join("+");
  const RECIPE_MAP = new Map();
  Object.entries(RECIPES).forEach(([key, value]) => {
    const [a, b] = key.split("+");
    RECIPE_MAP.set(keyOf(a, b), value);
  });

  window.LAB.add({
    id: "craft",
    name: "인피니트 크래프트",
    original: "Infinite Craft",
    tier: "t2",
    tag: "조합 놀이",
    blurb:
      "물, 불, 흙, 바람에서 시작해 무엇이든 만들어 보세요. 두 요소를 겹치면 예상 못 한 것이 나옵니다.",
    info: "드래그 앤 드롭 조합",
    mount(root) {
      const { el, clamp, toast } = window.UI;
      let seq = 0;
      const elements = [];
      let drag = null;

      const hueOf = (name) => {
        let hash = 0;
        for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
        return hash;
      };

      const board = el("div", { class: "craft-board" });
      const count = el("span", { class: "mono", text: "4개 요소" });

      const sortKey = (a, b) => [a, b].sort((x, y) => x.localeCompare(y, "ko")).join("+");
      const generateName = (a, b) => {
        const joined = `${a}${b}`;
        if (joined.length <= 7) return joined;
        return `${a.slice(0, 2)}${b.slice(-2)}`;
      };

      const flash = (name) => {
        const target = Array.from(board.querySelectorAll(".craft-chip")).find(
          (chip) => chip.dataset.name === name
        );
        if (!target) return;
        target.classList.remove("is-flash");
        void target.offsetWidth;
        target.classList.add("is-flash");
      };

      const addElement = (name, x, y, fresh) => {
        if (elements.some((item) => item.name === name)) {
          flash(name);
          return null;
        }
        const item = { id: ++seq, name, x, y, hue: hueOf(name) };
        elements.push(item);
        count.textContent = `${elements.length}개 요소`;
        const chip = el(
          "div",
          {
            class: `craft-chip${fresh ? " is-new" : ""}`,
            style: { left: `${x * 100}%`, top: `${y * 100}%`, "--chip-h": String(item.hue) },
            dataset: { name, id: String(item.id) },
            title: name,
          },
          el("span", { class: "craft-chip-name", text: name })
        );

        chip.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          const rect = chip.getBoundingClientRect();
          drag = {
            id: item.id,
            chip,
            dx: event.clientX - (rect.left + rect.width / 2),
            dy: event.clientY - (rect.top + rect.height / 2),
            startX: event.clientX,
            startY: event.clientY,
            ox: item.x,
            oy: item.y,
            moved: false,
          };
          chip.setPointerCapture(event.pointerId);
          chip.classList.add("is-drag");
        });

        chip.addEventListener("pointermove", (event) => {
          if (!drag || drag.id !== item.id) return;
          if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 3) {
            drag.moved = true;
          }
          const rect = board.getBoundingClientRect();
          const x2 = clamp((event.clientX - drag.dx - rect.left) / rect.width, 0.05, 0.95);
          const y2 = clamp((event.clientY - drag.dy - rect.top) / rect.height, 0.07, 0.93);
          item.x = x2;
          item.y = y2;
          chip.style.left = `${x2 * 100}%`;
          chip.style.top = `${y2 * 100}%`;
        });

        chip.addEventListener("pointerup", (event) => {
          if (!drag || drag.id !== item.id) return;
          const moved = drag.moved;
          const origin = { x: drag.ox, y: drag.oy };
          chip.releasePointerCapture(event.pointerId);
          chip.classList.remove("is-drag");
          drag = null;
          if (!moved) return;
          const rect = chip.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const other = elements.find((candidate) => {
            if (candidate.id === item.id) return false;
            const chipRect = board.querySelector(`[data-id="${candidate.id}"]`).getBoundingClientRect();
            return Math.hypot(
              chipRect.left + chipRect.width / 2 - cx,
              chipRect.top + chipRect.height / 2 - cy
            ) < Math.max(44, Math.min(rect.width, chipRect.width) * 0.55);
          });
          if (other) {
            combine(item, other);
            item.x = origin.x;
            item.y = origin.y;
            chip.style.left = `${origin.x * 100}%`;
            chip.style.top = `${origin.y * 100}%`;
          }
        });

        chip.addEventListener("pointercancel", () => {
          chip.classList.remove("is-drag");
          drag = null;
        });

        board.append(chip);
        return item;
      };

      const combine = (a, b) => {
        if (a.name === b.name && !RECIPE_MAP.has(sortKey(a.name, b.name))) {
          toast("같은 것끼리는 아직 아무것도 되지 않습니다");
          return;
        }
        const key = sortKey(a.name, b.name);
        const name = RECIPE_MAP.get(key) || generateName(a.name, b.name);
        if (!name || name === a.name || name === b.name) {
          toast("이 둘은 아직 섞이지 않습니다");
          return;
        }
        if (elements.some((item) => item.name === name)) {
          toast(`이미 발견한 ${name}입니다`);
          flash(name);
          return;
        }
        const x = clamp((a.x + b.x) / 2, 0.1, 0.9);
        const y = clamp((a.y + b.y) / 2, 0.12, 0.88);
        addElement(name, x, y, true);
        toast(`새로 발견: ${name}`);
        if (name === "신박함") {
          window.setTimeout(() => toast("신박함을 발견했습니다. 이게 이 사이트의 끝입니다."), 1400);
        }
      };

      root.append(
        el(
          "div",
          { class: "lab craft-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "작업대" }),
            el("span", { class: "lab-sub", text: "요소를 끌어 다른 요소 위에 놓으세요" }),
            count
          ),
          board
        )
      );

      BASE.forEach((item) => addElement(item.name, item.x, item.y, false));
      count.textContent = `${elements.length}개 요소`;

      const cleanup = () => {
        drag = null;
      };
      return cleanup;
    },
  });
})();
