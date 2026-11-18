/* wheel — 이름을 넣고 돌리는 룰렛 */
(function () {
  "use strict";

  const DEFAULTS = [
    "포인터 포인터",
    "빌 게이츠 머니",
    "패스워드 게임",
    "꼬맨틀",
    "퀵 드로우",
    "인피니트 크래프트",
    "눈누",
    "리니어",
  ];

  window.LAB.add({
    id: "wheel",
    name: "휠 오브 네임즈",
    original: "Wheel of Names",
    tier: "t1",
    tag: "랜덤 뽑기",
    blurb:
      "이름을 넣고 돌리면 하나가 남습니다. 점심 메뉴부터 발표자까지, 결정을 남에게 넘기는 도구.",
    info: "룰렛 랜덤 추첨",
    mount(root) {
      const { el, canvas, clamp, easeOutQuart } = window.UI;
      const css = (name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const ink = css("--ink");
      const paper = css("--paper-raised");
      const paperDeep = css("--paper-deep");
      const signal = css("--signal");
      const palette = [
        css("--t1"),
        css("--t2"),
        css("--t3"),
        css("--t4"),
        css("--t5"),
        css("--t-extra"),
        css("--ink"),
        css("--signal-deep"),
      ];

      let names = DEFAULTS.slice();
      let rotation = 0;
      let spinning = false;
      let winnerIndex = -1;
      let raf = 0;

      const stage = el("div", { class: "wheel-stage" });
      const { cv, ctx } = canvas(stage, 640, 640, "640px");
      const overlay = el("div", { class: "wheel-winner", hidden: true });
      const pointer = el("div", { class: "wheel-pointer", "aria-hidden": "true" });
      const listHost = el("div", { class: "wheel-names" });
      const spinBtn = el("button", {
        class: "btn btn--primary btn--block",
        type: "button",
        text: "돌리기",
      });
      const count = el("span", { class: "mono" });

      const colorFor = (index) => {
        const color = palette[index % palette.length];
        if (names.length % palette.length === 1 && index === names.length - 1) {
          return palette[(index + 1) % palette.length];
        }
        return color;
      };

      const draw = () => {
        const w = 640;
        const h = 640;
        const cx = w / 2;
        const cy = h / 2;
        const R = 286;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = paperDeep;
        ctx.fillRect(0, 0, w, h);

        if (names.length < 1) {
          ctx.fillStyle = ink;
          ctx.font = "500 16px 'IBM Plex Sans KR', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("이름을 하나 이상 넣어 주세요", cx, cy);
          return;
        }

        const seg = (Math.PI * 2) / names.length;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        names.forEach((name, index) => {
          const start = index * seg;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, R, start, start + seg);
          ctx.closePath();
          ctx.fillStyle = colorFor(index);
          ctx.fill();
          ctx.strokeStyle = paper;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        names.forEach((name, index) => {
          const center = index * seg + seg / 2;
          const label = name.length > 13 ? `${name.slice(0, 12)}…` : name;
          ctx.save();
          ctx.fillStyle = paper;
          ctx.font = `600 ${clamp(170 / names.length, 10, 17)}px "IBM Plex Sans KR", sans-serif`;
          ctx.textBaseline = "middle";
          if (Math.cos(center) < 0) {
            ctx.rotate(center + Math.PI);
            ctx.textAlign = "left";
            ctx.fillText(label, -(R - 24), 0);
          } else {
            ctx.rotate(center);
            ctx.textAlign = "right";
            ctx.fillText(label, R - 24, 0);
          }
          ctx.restore();
        });

        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fillStyle = paper;
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.font = "600 12px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SPIN", cx, cy + 1);

        ctx.beginPath();
        ctx.arc(cx, cy, R + 10, 0, Math.PI * 2);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.stroke();
      };

      const hideWinner = () => {
        overlay.hidden = true;
        overlay.replaceChildren();
        winnerIndex = -1;
      };

      const showWinner = (index) => {
        winnerIndex = index;
        overlay.hidden = false;
        overlay.replaceChildren(
          el("span", { class: "wheel-winner-kicker mono", text: "당첨" }),
          el("strong", { class: "wheel-winner-name", text: names[index] }),
          el(
            "div",
            { class: "wheel-winner-actions" },
            el("button", {
              class: "btn btn--sm btn--primary",
              type: "button",
              text: "한 번 더",
              onclick: () => {
                hideWinner();
                spin();
              },
            }),
            el("button", {
              class: "btn btn--sm btn--ghost",
              type: "button",
              text: "이 이름 빼기",
              onclick: () => {
                const name = names[winnerIndex];
                names.splice(winnerIndex, 1);
                hideWinner();
                renderNames();
                draw();
                window.UI.toast(`${name}을 뺐습니다`);
              },
            })
          )
        );
      };

      const spin = () => {
        if (spinning || names.length < 2) {
          if (names.length < 2) window.UI.toast("이름을 두 개 이상 넣어 주세요");
          return;
        }
        spinning = true;
        hideWinner();
        spinBtn.disabled = true;
        count.textContent = "도는 중…";

        const seg = (Math.PI * 2) / names.length;
        const winner = Math.floor(Math.random() * names.length);
        const targetCenter = winner * seg + seg / 2;
        const targetRotation = -Math.PI / 2 - targetCenter;
        let need = targetRotation - rotation;
        need = ((need % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const turns = 5 + Math.floor(Math.random() * 3);
        const total = need + turns * Math.PI * 2;
        const start = rotation;
        const duration = 3600 + Math.random() * 900;
        const t0 = performance.now();

        const tick = (now) => {
          const p = clamp((now - t0) / duration, 0, 1);
          rotation = start + total * easeOutQuart(p);
          draw();
          if (p < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            spinning = false;
            spinBtn.disabled = false;
            count.textContent = `${names.length}개 이름`;
            showWinner(winner);
          }
        };
        raf = requestAnimationFrame(tick);
      };

      spinBtn.addEventListener("click", spin);

      const addName = (value) => {
        const name = value.trim().slice(0, 24);
        if (!name) return;
        if (names.length >= 16) {
          window.UI.toast("이름은 16개까지 넣을 수 있습니다");
          return;
        }
        names.push(name);
        renderNames();
        draw();
      };

      const renderNames = () => {
        listHost.replaceChildren(
          ...names.map((name, index) =>
            el(
              "span",
              { class: "wheel-chip" },
              el("span", { class: "wheel-chip-dot", style: { background: colorFor(index) } }),
              el("span", { class: "wheel-chip-name", text: name }),
              el("button", {
                class: "wheel-chip-x",
                type: "button",
                "aria-label": `${name} 빼기`,
                html: window.UI.icon("close", 12),
                onclick: () => {
                  names.splice(index, 1);
                  hideWinner();
                  renderNames();
                  draw();
                },
              })
            )
          )
        );
        count.textContent = `${names.length}개 이름`;
        spinBtn.disabled = names.length < 2 || spinning;
      };

      const input = el("input", {
        class: "input",
        type: "text",
        placeholder: "이름 추가",
        maxlength: "24",
        "aria-label": "룰렛에 넣을 이름",
      });
      const form = el(
        "form",
        {
          class: "wheel-add",
          onsubmit: (event) => {
            event.preventDefault();
            addName(input.value);
            input.value = "";
            input.focus();
          },
        },
        input,
        el("button", { class: "btn btn--sm", type: "submit", text: "추가" })
      );

      root.append(
        el(
          "div",
          { class: "lab wheel-lab" },
          el(
            "div",
            { class: "wheel-grid" },
            el("div", { class: "wheel-canvas-wrap" }, stage, pointer, overlay),
            el(
              "aside",
              { class: "wheel-side" },
              el(
                "div",
                { class: "lab-top" },
                el("span", { class: "lab-h", text: "이름 목록" }),
                count
              ),
              listHost,
              form,
              el(
                "div",
                { class: "wheel-actions" },
                el("button", {
                  class: "btn btn--sm btn--ghost",
                  type: "button",
                  text: "섞기",
                  onclick: () => {
                    names = window.UI.shuffle(names);
                    hideWinner();
                    renderNames();
                    draw();
                  },
                }),
                el("button", {
                  class: "btn btn--sm btn--ghost",
                  type: "button",
                  text: "기본값",
                  onclick: () => {
                    names = DEFAULTS.slice();
                    hideWinner();
                    renderNames();
                    draw();
                  },
                })
              ),
              spinBtn,
              el("p", { class: "hint", text: "바퀴는 항상 무작위로 멈춥니다. 결과를 저장하지 않습니다." })
            )
          )
        )
      );

      renderNames();
      draw();

      return () => cancelAnimationFrame(raf);
    },
  });
})();
