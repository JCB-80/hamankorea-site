/* ktest — 8문항으로 보는 신박 취향 테스트 */
(function () {
  "use strict";

  const QUESTIONS = [
    {
      axis: "EI",
      q: "새로운 신박한 사이트를 발견했다. 가장 먼저 하는 일은?",
      a: { text: "단체 채팅방에 링크부터 던진다", value: "E" },
      b: { text: "아무도 모르게 혼자 만져본다", value: "I" },
    },
    {
      axis: "SN",
      q: "사이트를 판단하는 첫 번째 기준은?",
      a: { text: "손맛과 속도, 지금 이 화면", value: "S" },
      b: { text: "이 아이디어가 어디까지 갈 수 있을지", value: "N" },
    },
    {
      axis: "TF",
      q: "친구가 만든 사이트가 솔직히 별로다. 나는?",
      a: { text: "어디를 고치면 좋을지 바로 말한다", value: "T" },
      b: { text: "일단 잘한 점부터 찾아서 말한다", value: "F" },
    },
    {
      axis: "JP",
      q: "사이트에 들어가면 훑는 순서는?",
      a: { text: "메뉴부터 차례대로 다 본다", value: "J" },
      b: { text: "눈에 가는 것부터 닥치는 대로", value: "P" },
    },
    {
      axis: "EI",
      q: "재미있는 기능을 찾았다. 그다음은?",
      a: { text: "누구에게 보여줄지부터 생각한다", value: "E" },
      b: { text: "즐겨찾기에 넣고 조용히 쓴다", value: "I" },
    },
    {
      axis: "SN",
      q: "영상에서 본 사이트를 다시 볼 때 드는 생각은?",
      a: { text: "이 화면은 어떻게 만들었을까", value: "S" },
      b: { text: "이걸로 또 뭘 만들 수 있을까", value: "N" },
    },
    {
      axis: "TF",
      q: "티어표를 봤을 때 내 반응은?",
      a: { text: "순위 기준이 좀 애매한데?", value: "T" },
      b: { text: "내 최애가 높아서 기분이 좋다", value: "F" },
    },
    {
      axis: "JP",
      q: "주말에 새 사이트 10개를 본다면?",
      a: { text: "볼 목록을 정하고 순서대로", value: "J" },
      b: { text: "그때 끌리는 것부터", value: "P" },
    },
  ];

  const RESULTS = {
    INTP: ["아이디어 수집가", "설명은 귀찮지만 구조는 다 꿰고 있습니다. 새 기능을 보면 일단 뜯어봅니다.", ["분석", "호기심"]],
    INTJ: ["구조 설계자", "재미보다 오래 갈 구조를 봅니다. 마음에 들면 혼자 조용히 다 만들어 둡니다.", ["전략", "완벽주의"]],
    INFJ: ["조용한 큐레이터", "좋은 것을 찾아내 남몰래 모아 둡니다. 취향의 근거를 말로 설명할 수 있습니다.", ["큐레이션", "통찰"]],
    INFP: ["감성 수집가", "색과 문장에 먼저 반응합니다. 기능 하나보다 분위기 하나에 오래 머뭅니다.", ["감성", "상상"]],
    ENTP: ["실험가", "일단 눌러 봅니다. 망가뜨려도 다시 열면 되니까요. 새 조합을 찾을 때 가장 신납니다.", ["실험", "토론"]],
    ENTJ: ["제품 책임자", "재미있다고 끝내지 않습니다. 이걸 서비스로 만들 방법을 바로 계산합니다.", ["추진", "설계"]],
    ENFJ: ["커뮤니티 빌더", "좋은 사이트를 혼자 알면 아깝습니다. 링크와 함께 이유까지 정리해서 공유합니다.", ["공유", "리드"]],
    ENFP: ["링크 뿌리는 사람", "하루에 세 개씩 새 사이트를 발견합니다. 취향은 넓고, 탭은 항상 너무 많습니다.", ["열정", "발견"]],
    ISTP: ["손맛 장인", "설명은 짧게, 직접 만져보는 게 빠릅니다. 버튼 하나의 반응에도 예민합니다.", ["실행", "감각"]],
    ISTJ: ["매뉴얼주의자", "화면이 어떻게 돌아가는지 순서대로 확인합니다. 예측 가능한 인터랙션을 좋아합니다.", ["정확", "신뢰"]],
    ISFJ: ["디테일 수호자", "작은 아이콘 하나, 문장 하나를 오래 봅니다. 사이트의 다정함을 알아챕니다.", ["배려", "섬세"]],
    ISFP: ["취향 탐험가", "유행보다 내 눈에 맞는지를 봅니다. 마음에 드는 색을 만나면 오래 머뭅니다.", ["취향", "감각"]],
    ESTP: ["즉흥 테스터", "일단 끝까지 써 봅니다. 설명서는 나중에, 손이 먼저 나갑니다.", ["속도", "도전"]],
    ESTJ: ["일정 관리자", "볼 사이트도 계획대로. 재미있어도 할 일이 있으면 닫습니다.", ["정리", "실행"]],
    ESFJ: ["분위기 메이커", "같이 보면 더 재미있다는 걸 압니다. 누구에게 추천할지 늘 생각합니다.", ["친화", "추천"]],
    ESFP: ["무대 체질", "새로운 것 앞에서 제일 먼저 반응합니다. 그 자리에서 바로 써 보고 알려 줍니다.", ["즉흥", "에너지"]],
  };

  window.LAB.add({
    id: "ktest",
    name: "케이테스트",
    original: "K-test",
    tier: "t2",
    tag: "취향 테스트",
    blurb:
      "새로운 사이트를 볼 때의 습관으로 성향을 나눠 봅니다. 8문항이면 내 취향의 이름이 나옵니다.",
    info: "MBTI, 성향 테스트",
    mount(root) {
      const { el, copy, toast } = window.UI;
      let step = 0;
      const answers = [];

      const progress = el("div", { class: "kt-progress", "aria-hidden": "true" });
      const progressBar = el("i");
      progress.append(progressBar);
      const counter = el("span", { class: "mono" });
      const card = el("div", { class: "kt-card" });

      const compute = () => {
        const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        answers.forEach((value) => {
          scores[value] += 1;
        });
        return (
          (scores.E >= scores.I ? "E" : "I") +
          (scores.S >= scores.N ? "S" : "N") +
          (scores.T >= scores.F ? "T" : "F") +
          (scores.J >= scores.P ? "J" : "P")
        );
      };

      const renderResult = () => {
        const type = compute();
        const [title, desc, tags] = RESULTS[type];
        progressBar.style.transform = "scaleX(1)";
        counter.textContent = "결과";
        card.replaceChildren(
          el("span", { class: "mono kt-kicker", text: "당신의 신박 취향" }),
          el("p", { class: "kt-type", text: type }),
          el("h3", { class: "kt-title", text: title }),
          el("p", { class: "kt-desc", text: desc }),
          el(
            "div",
            { class: "kt-tags" },
            ...tags.map((tag) => el("span", { class: "badge", text: tag }))
          ),
          el(
            "div",
            { class: "kt-actions" },
            el("button", {
              class: "btn btn--sm btn--primary",
              type: "button",
              text: "결과 복사",
              onclick: () =>
                copy(`나는 ${type} · ${title}. ${desc} — 아이디어웹`, "결과를 복사했습니다"),
            }),
            el("button", {
              class: "btn btn--sm btn--ghost",
              type: "button",
              text: "다시 하기",
              onclick: () => {
                step = 0;
                answers.length = 0;
                render();
                toast("처음부터 다시 시작합니다");
              },
            })
          ),
          el("p", { class: "hint", text: "재미로 보는 테스트입니다. 공식 심리 검사가 아닙니다." })
        );
      };

      const render = () => {
        if (step >= QUESTIONS.length) {
          renderResult();
          return;
        }
        const question = QUESTIONS[step];
        progressBar.style.transform = `scaleX(${step / QUESTIONS.length})`;
        counter.textContent = `${step + 1} / ${QUESTIONS.length}`;
        card.replaceChildren(
          el("span", { class: "mono kt-kicker", text: `Q${step + 1}` }),
          el("h3", { class: "kt-question", text: question.q }),
          el(
            "div",
            { class: "kt-options" },
            ...[question.a, question.b].map((option, index) =>
              el(
                "button",
                {
                  class: "kt-option",
                  type: "button",
                  onclick: () => {
                    answers[step] = option.value;
                    step += 1;
                    render();
                  },
                },
                el("span", { class: "kt-option-key mono", text: index === 0 ? "A" : "B" }),
                el("span", { class: "kt-option-text", text: option.text })
              )
            )
          ),
          step > 0
            ? el("button", {
                class: "kt-back",
                type: "button",
                text: "이전 질문",
                onclick: () => {
                  step -= 1;
                  render();
                },
              })
            : ""
        );
      };

      root.append(
        el(
          "div",
          { class: "lab kt-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "신박 취향 테스트" }),
            counter
          ),
          progress,
          card
        )
      );

      render();
    },
  });
})();
