/* arcade — simon */
(function () {
  "use strict";
  const UI = window.UI;

  ARCADE.add({
    id: "simon",
    name: "사이먼",
    origin: "Simon (1978) · 순서 기억하기",
    genre: "기억",
    controls: "패드를 누르거나 1 ~ 4 키",
    mount(root, api) {
      const TONES = [262, 330, 392, 523];
      const labels = ["1", "2", "3", "4"];
      let sequence = [];
      let inputIndex = 0;
      let playing = true;
      let over = false;
      let score = 0;
      const timers = [];

      const status = UI.el("span", { text: "준비…" });
      const round = UI.el("span", { class: "mono", text: "ROUND 1" });
      const bar = UI.el("div", { class: "simon-bar" }, round, status);
      const board = UI.el("div", { class: "simon-board" });
      const pads = labels.map((label, index) => {
        const pad = UI.el(
          "button",
          { class: "simon-pad", type: "button", "aria-label": `패드 ${label}` },
          UI.el("span", { text: label })
        );
        pad.addEventListener("click", () => press(index));
        return pad;
      });
      pads.forEach((pad) => board.append(pad));
      const note = UI.el("p", {
        class: "game-note",
        text: "순서를 외우세요. 한 라운드마다 하나씩 길어집니다.",
      });
      root.append(UI.el("div", { class: "simon" }, bar, board, note));

      function schedule(fn, ms) {
        timers.push(window.setTimeout(fn, ms));
      }

      function flash(index, duration) {
        const pad = pads[index];
        pad.classList.add("is-on");
        api.tone(TONES[index], 0.18, "square", 0.04);
        schedule(() => pad.classList.remove("is-on"), duration || 220);
      }

      function playSequence() {
        playing = true;
        inputIndex = 0;
        status.textContent = "따라 하세요";
        round.textContent = `ROUND ${sequence.length}`;
        sequence.forEach((value, index) => {
          schedule(() => flash(value, 230), 600 + index * 640);
        });
        schedule(() => {
          playing = false;
          status.textContent = "당신 차례";
        }, 600 + sequence.length * 640);
      }

      function nextRound() {
        if (over) return;
        sequence.push(Math.floor(Math.random() * 4));
        playSequence();
      }

      function press(index) {
        if (over || playing) return;
        flash(index, 150);
        if (sequence[inputIndex] !== index) {
          over = true;
          api.tone(140, 0.3, "sawtooth", 0.045, 60);
          api.finish(
            Math.max(0, sequence.length - 1),
            "순서를 틀렸습니다",
            `${sequence.length - 1}라운드까지 성공`
          );
          return;
        }
        inputIndex += 1;
        if (inputIndex === sequence.length) {
          score = sequence.length;
          api.score(score);
          status.textContent = "좋아요";
          playing = true;
          schedule(nextRound, 900);
        }
      }

      const onKey = (event) => {
        const index = ["1", "2", "3", "4"].indexOf(event.key);
        if (index < 0) return;
        event.preventDefault();
        press(index);
      };
      window.addEventListener("keydown", onKey);

      schedule(() => {
        sequence = [Math.floor(Math.random() * 4)];
        playSequence();
      }, 650);

      api.score(0);

      return () => {
        over = true;
        timers.forEach((timer) => window.clearTimeout(timer));
        window.removeEventListener("keydown", onKey);
      };
    },
  });
})();
