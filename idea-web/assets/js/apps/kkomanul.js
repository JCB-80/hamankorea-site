/* kkomanul — 단어 유사도로 정답을 좁히는 게임 */
(function () {
  "use strict";

  const RAW = `
사과|fruit food red sweet
배|fruit food sweet
복숭아|fruit food sweet pink
딸기|fruit food red sweet
수박|fruit food sweet summer green
포도|fruit food sweet purple
바나나|fruit food sweet yellow
오렌지|fruit food sweet orange
레몬|fruit food sour yellow
토마토|vegetable food red
오이|vegetable food green
당근|vegetable food orange
양파|vegetable food
감자|vegetable food
고구마|vegetable food sweet
쌀|grain food
밥|food grain hot
빵|food bakery wheat
라면|food noodle hot spicy
김치|food vegetable spicy korean
떡볶이|food spicy korean ricecake
비빔밥|food korean rice vegetable
불고기|food meat korean
치킨|food meat fried
피자|food bread cheese italian
햄버거|food bread meat american
초콜릿|food sweet bitter
아이스크림|food sweet cold dairy
커피|drink bitter hot caffeine
차|drink hot
우유|drink dairy white cold
물|drink cold nature
맥주|drink alcohol bitter
와인|drink alcohol fruit
소금|seasoning food white salty
설탕|seasoning food sweet white
후추|seasoning spicy black
개|animal mammal pet land
고양이|animal mammal pet land
토끼|animal mammal pet land small
말|animal mammal land big
소|animal mammal land farm big
돼지|animal mammal land farm
호랑이|animal mammal wild big land
사자|animal mammal wild big land
코끼리|animal mammal wild big land
원숭이|animal mammal wild land smart
판다|animal mammal wild big china
곰|animal mammal wild big land
여우|animal mammal wild land smart
늑대|animal mammal wild land
쥐|animal mammal small land
다람쥐|animal mammal small land tree
새|animal bird sky small
참새|animal bird sky small city
비둘기|animal bird sky city
독수리|animal bird sky wild big
펭귄|animal bird cold sea
타조|animal bird land big
물고기|animal fish sea water
상어|animal fish sea wild big
고래|animal mammal sea big
돌고래|animal mammal sea smart
문어|animal sea smart
오징어|animal sea food
게|animal sea small
거북이|animal reptile sea slow
뱀|animal reptile land wild
개구리|animal amphibian water small green
나비|animal insect sky small pretty
벌|animal insect sky small sting
개미|animal insect land small strong
거미|animal insect small scary
나무|nature plant tree green big
꽃|nature plant flower pretty colorful
풀|nature plant green
잎|nature plant green tree
숲|nature tree green place
산|nature place big land
강|nature water place flow
바다|nature water place big blue
하늘|nature place sky blue big
구름|nature sky white weather
비|nature weather water sky
눈|nature weather cold white sky
바람|nature weather air
태양|nature sky hot bright star
달|nature sky night bright
별|nature sky night bright
무지개|nature sky colorful rain
번개|nature weather sky bright danger
불|nature hot red danger
흙|nature land brown
돌|nature land hard gray
모래|nature land beach yellow
섬|nature land sea place
사막|nature land hot dry
빙하|nature cold water big
화산|nature mountain hot danger
집|place building home warm
학교|place building study city
병원|place building heal city
도서관|place building book quiet city
카페|place building coffee city
공원|place nature city rest
지하철|vehicle transport city fast
버스|vehicle transport city big
자동차|vehicle transport road fast
자전거|vehicle transport road eco
비행기|vehicle transport sky fast big
보트|vehicle transport sea big
기차|vehicle transport rail fast big
컴퓨터|object tech machine work
휴대폰|object tech machine small
책|object book paper study
연필|object writing small wood
의자|object furniture home sit
침대|object furniture home rest
거울|object glass home reflect
시계|object time machine small
우산|object rain small tool
신발|object clothes feet walk
모자|object clothes head
안경|object clothes eyes see
가방|object bag carry
문|object building home open
창문|object building home light
사람|person human
친구|person human friend fun
가족|person human home love
어머니|person human family love
아버지|person human family love
아이|person human small young
어른|person human big old
선생님|person human study teach
의사|person human heal work
요리사|person human food work
가수|person human music art
화가|person human art paint
사랑|emotion love warm
행복|emotion happy warm
슬픔|emotion sad cold
분노|emotion angry hot
두려움|emotion scary cold
웃음|emotion happy face sound
눈물|emotion sad water face
꿈|emotion sleep night imagine
기억|mind time memory
생각|mind idea head
음악|art sound music emotion
그림|art paint color image
영화|art movie story image
춤|art move music body
게임|game fun computer play
축구|sport ball game team
야구|sport ball game team
수영|sport water body
달리기|sport fast body leg
시간|time abstract flow
돈|money object work
사이트|tech internet web computer
인터넷|tech web network
인공지능|tech computer smart future
로봇|tech machine future metal
우주|space nature big dark
지구|space nature planet home
중력|space science invisible
빛|light bright physics
소리|sound physics wave
색|color art light
빨강|color red warm
파랑|color blue cold
초록|color green nature
노랑|color yellow bright warm
검정|color black dark
하양|color white bright
`;

  const WORDS = RAW.trim()
    .split("\n")
    .map((line) => {
      const [word, tags] = line.split("|");
      return { word: word.trim(), tags: tags.trim().split(/\s+/) };
    })
    .filter((entry) => entry.word);

  const BROAD = new Set([
    "food",
    "animal",
    "nature",
    "place",
    "object",
    "person",
    "emotion",
    "art",
    "tech",
    "space",
    "sport",
    "color",
    "drink",
    "vehicle",
    "building",
    "plant",
    "weather",
    "sky",
    "sea",
    "land",
    "water",
    "mammal",
    "bird",
    "insect",
    "fish",
  ]);

  const weightOf = (tag) => (BROAD.has(tag) ? 0.6 : 2.2);

  const similarity = (a, b) => {
    if (a.word === b.word) return 1;
    const setB = new Set(b.tags);
    let shared = 0;
    let total = 0;
    a.tags.forEach((tag) => {
      total += weightOf(tag);
      if (setB.has(tag)) shared += weightOf(tag);
    });
    b.tags.forEach((tag) => {
      if (!a.tags.includes(tag)) total += weightOf(tag);
    });
    let score = total ? shared / total : 0;
    const aChars = new Set(Array.from(a.word));
    let common = 0;
    Array.from(b.word).forEach((ch) => {
      if (aChars.has(ch)) common += 1;
    });
    score += Math.min(0.04, common * 0.008) * (1 - score);
    return score;
  };

  const dayNumber = Math.floor(Date.now() / 86400000);

  window.LAB.add({
    id: "kkomanul",
    name: "꼬맨틀",
    original: "Kkomanul",
    tier: "t3",
    tag: "단어 추리",
    blurb:
      "정답과 얼마나 가까운 단어인지 알려줍니다. 100%에 가까워지는 단어를 하나씩 찾아보세요.",
    info: "단어 유사도, 추리 게임",
    mount(root) {
      const { el, toast, store } = window.UI;
      let answer = WORDS[dayNumber % WORDS.length];
      const MAX = 10;
      let guesses = [];
      let solved = false;

      const ranked = () => {
        const rows = WORDS.filter((entry) => entry.word !== answer.word).map((entry) => ({
          entry,
          sim: similarity(answer, entry),
        }));
        rows.sort((a, b) => b.sim - a.sim || a.entry.word.localeCompare(b.entry.word, "ko"));
        return rows;
      };

      let board = ranked();
      let rankMap = new Map(board.map((row, index) => [row.entry.word, index + 1]));

      const form = el("form", { class: "kk-form" });
      const input = el("input", {
        class: "input kk-input",
        type: "text",
        placeholder: "단어를 입력하세요",
        autocomplete: "off",
        maxlength: "16",
        "aria-label": "추측할 단어",
      });
      const submit = el("button", { class: "btn btn--primary", type: "submit", text: "추측" });
      form.append(input, submit);

      const tries = el("span", { class: "mono" });
      const history = el("div", { class: "kk-history" });
      const clue = el("p", { class: "kk-clue" });
      const result = el("div", { class: "kk-result", hidden: true });
      const best = el("div", { class: "kk-best" });

      const render = () => {
        tries.textContent = `${guesses.length} / ${MAX}`;
        const sorted = guesses.slice().sort((a, b) => b.sim - a.sim);
        history.replaceChildren(
          ...sorted.map((guess) => {
            const pct = (guess.sim * 100).toFixed(1);
            return el(
              "div",
              { class: `kk-row${guess.word === answer.word ? " is-solved" : ""}` },
              el("span", {
                class: "kk-row-rank mono",
                text: guess.word === answer.word ? "#1" : `#${rankMap.get(guess.word) || "-"}`,
              }),
              el("span", { class: "kk-row-word", text: guess.word }),
              el(
                "span",
                { class: "kk-row-bar", "aria-hidden": "true" },
                el("i", { style: { width: `${Math.max(1, guess.sim * 100)}%` } })
              ),
              el("span", { class: "kk-row-pct mono", text: `${pct}%` })
            );
          })
        );

        if (guesses.length) {
          const top = guesses.slice().sort((a, b) => b.sim - a.sim)[0];
          clue.textContent =
            top.sim >= 0.999
              ? "정답입니다."
              : `가장 가까운 단어는 ${top.word} (${(top.sim * 100).toFixed(1)}%)입니다.`;
          best.replaceChildren(
            el("span", { class: "hint", text: "사전" }),
            el("strong", { class: "kk-best-word", text: top.word }),
            el("span", { class: "mono", text: `${top.sim.toFixed(3)}` })
          );
        } else {
          clue.textContent = "정답과 의미가 가까운 단어일수록 높은 점수가 나옵니다.";
          best.replaceChildren(
            el("span", { class: "hint", text: `사전 ${WORDS.length}개 단어 · 간이 유사도 모델` })
          );
        }
      };

      const finish = (won) => {
        solved = true;
        input.disabled = true;
        submit.disabled = true;
        result.hidden = false;
        result.classList.toggle("is-win", won);
        result.replaceChildren(
          el("span", { class: "mono", text: won ? "정답" : "기회 종료" }),
          el("strong", { class: "kk-result-word", text: answer.word }),
          el("p", {
            text: won
              ? `${guesses.length}번 만에 맞혔습니다.`
              : `정답은 “${answer.word}”였습니다. 내일 또 다른 단어가 나옵니다.`,
          }),
          el("button", {
            class: "btn btn--sm btn--primary",
            type: "button",
            text: "새 게임",
            onclick: resetGame,
          })
        );
      };

      const resetGame = () => {
        answer = WORDS[Math.floor(Math.random() * WORDS.length)];
        board = ranked();
        rankMap = new Map(board.map((row, index) => [row.entry.word, index + 1]));
        guesses = [];
        solved = false;
        input.disabled = false;
        submit.disabled = false;
        result.hidden = true;
        result.replaceChildren();
        input.value = "";
        render();
        input.focus();
      };

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (solved) return;
        const value = input.value.trim().replace(/\s+/g, "");
        if (!value) return;
        if (guesses.some((guess) => guess.word === value)) {
          toast("이미 추측한 단어입니다");
          return;
        }
        const entry = WORDS.find((word) => word.word === value);
        if (!entry) {
          toast("사전에 없는 단어입니다");
          input.select();
          return;
        }
        const sim = similarity(answer, entry);
        guesses.push({ word: value, sim });
        input.value = "";
        render();
        if (value === answer.word) {
          window.setTimeout(() => finish(true), 250);
          store.set("kkomanul.last", { date: dayNumber, attempts: guesses.length });
        } else if (guesses.length >= MAX) {
          window.setTimeout(() => finish(false), 250);
        }
      });

      root.append(
        el(
          "div",
          { class: "lab kk-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "오늘의 단어를 맞히세요" }),
            tries
          ),
          form,
          el("div", { class: "kk-meta" }, clue, best),
          history,
          el(
            "p",
            { class: "hint" },
            "사전에 있는 명사만 인정됩니다. 새 게임을 누르면 다른 단어로 다시 시작합니다."
          ),
          result
        )
      );

      render();
      input.focus({ preventScroll: true });
    },
  });
})();
